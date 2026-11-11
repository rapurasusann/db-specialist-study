import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { Pool } from 'pg';
import { attachDatabasePool } from '@neon/functions';

const origin = 'https://rapurasusann.github.io';
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
if (!jwksUrl || !authBaseUrl || !process.env.DATABASE_URL) throw Error('Neon Auth and DB must be configured');
const jwks = createRemoteJWKSet(new URL(jwksUrl));
const pool = new Pool({connectionString:process.env.DATABASE_URL,max:5});
attachDatabasePool(pool);
const app = new Hono<{ Variables: { userId: string } }>();
app.use('*', cors({origin,allowHeaders:['Authorization','Content-Type'],allowMethods:['GET','PUT','OPTIONS'],credentials:false,maxAge:600}));
app.use('*', async(c,next)=>{
 if(c.req.method==='OPTIONS') return next();
 const auth=c.req.header('authorization')||'';
 if(!auth.startsWith('Bearer '))return c.json({error:'unauthorized'},401);
 try{
  const {payload}=await jwtVerify(auth.slice(7),jwks,{issuer:authBaseUrl,algorithms:['EdDSA']});
  if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>200)return c.json({error:'unauthorized'},401);
  c.set('userId',payload.sub);
  await next();
 }catch{return c.json({error:'unauthorized'},401)}
});
app.get('/v1/progress',async(c)=>{
 const {rows}=await pool.query('SELECT question_id,data,revision,updated_at FROM public.db_study_progress WHERE user_id=$1 ORDER BY question_id LIMIT 10000',[c.get('userId')]);
 return c.json({rows});
});
const idPattern=/^20\d{2}:(am1|am2|pm1|pm2):([1-9]|[1-9]\d|100)$/;
app.put('/v1/progress/:id',async(c)=>{
 const id=c.req.param('id');
 if(!idPattern.test(id))return c.json({error:'invalid id'},400);
 const raw=await c.req.text();
 if(new TextEncoder().encode(raw).length>20000)return c.json({error:'too large'},413);
 let body;try{body=JSON.parse(raw)}catch{return c.json({error:'invalid json'},400)}
 if(!body||!body.data||typeof body.data!=='object'||Array.isArray(body.data)
 || JSON.stringify(body.data).length>16384
 || !Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0)
 return c.json({error:'invalid payload'},400);
 const userId=c.get('userId');
 if(body.expectedRevision===0){
  const result=await pool.query(
   'INSERT INTO public.db_study_progress (user_id,question_id,data) VALUES ($1,$2,$3::jsonb) ON CONFLICT DO NOTHING RETURNING revision,updated_at',
   [userId,id,JSON.stringify(body.data)]);
  if(result.rowCount===0)return c.json({error:'revision conflict'},409);
  return c.json(result.rows[0],201);
 }
 const result=await pool.query(
  'UPDATE public.db_study_progress SET data=$3::jsonb,revision=revision+1,updated_at=now() WHERE user_id=$1 AND question_id=$2 AND revision=$4 RETURNING revision,updated_at',
  [userId,id,JSON.stringify(body.data),body.expectedRevision]);
 if(result.rowCount===0)return c.json({error:'revision conflict'},409);
 return c.json(result.rows[0]);
});
export default app;
