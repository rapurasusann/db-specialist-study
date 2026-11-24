'use strict';
// Server only: do not bundle with the GitHub Pages client.
const {createProgressAccess}=require('./progress-access');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createPgProgressStore(pool) {
  if (!pool || typeof pool.connect!=='function') throw new TypeError('DB_POOL_REQUIRED');
  async function transaction(userId, fn) {
    // Never allow a caller-supplied subject. This value comes exclusively
    // from createProgressAccess's verified JWT identity.
    if (!UUID.test(userId)) throw new Error('UNAUTHORIZED');
    const client=await pool.connect();
    let begun=false;
    try {
      await client.query('BEGIN');
      begun=true;
      // Transaction-local GUC: no identity leakage on pooled connections.
      await client.query("SELECT set_config('app.verified_user_id', $1, true)",[userId]);
      const result=await fn(client);
      await client.query('COMMIT');
      return result;
    } catch(err) {
      if(begun) { try{await client.query('ROLLBACK')}catch{} }
      throw err;
    } finally { client.release(); }
  }
  return Object.freeze({
    read({userId,examCode,questionId}) {
      return transaction(userId, async client=>{
        const {rows}=await client.query(
          'SELECT data, revision, updated_at FROM public.study_progress WHERE user_id=$1 AND exam_code=$2 AND question_id=$3',
          [userId,examCode,questionId]);
        return rows[0]??null;
      });
    },
    list({userId,examCode,limit,cursor}) {
      return transaction(userId,async client=>{
        const {rows}=await client.query(
          'SELECT question_id, data, revision, updated_at FROM public.study_progress WHERE user_id=$1 AND exam_code=$2 AND question_id>$3 ORDER BY question_id LIMIT $4',
          [userId,examCode,cursor??'',limit+1]);
        // Budget the actual JSON response envelope, including UTF-8 metadata and cursor.
        // The Worker retains its independent 65,536-byte hard limit.
        const records=[];
        let nextCursor=null;
        for(let i=0;i<Math.min(limit,rows.length);i++){
          const candidate=[...records,rows[i]];
          const cursorAfter=i+1<rows.length?rows[i].question_id:null;
          if(Buffer.byteLength(JSON.stringify({data:{records:candidate,nextCursor:cursorAfter}}),'utf8')>60000){
            if(records.length===0)throw Error('SERVICE_UNAVAILABLE');
            return {records,nextCursor:records.at(-1).question_id};
          }
          records.push(rows[i]);
          nextCursor=cursorAfter;
        }
        return {records,nextCursor};
      });
    },
    write({userId,examCode,questionId,data,revision}) {
      return transaction(userId,async client=>{
        // Revision 1 starts a new record. Updates require exact next revision.
        const sql=revision===1
          ? `INSERT INTO public.study_progress(user_id,exam_code,question_id,data,revision)
             VALUES($1,$2,$3,$4::jsonb,1)
             ON CONFLICT(user_id,exam_code,question_id) DO NOTHING
             RETURNING data,revision,updated_at`
          : `UPDATE public.study_progress SET data=$4::jsonb,revision=$5,updated_at=now()
             WHERE user_id=$1 AND exam_code=$2 AND question_id=$3 AND revision=$5-1
             RETURNING data,revision,updated_at`;
        const params=revision===1
          ? [userId,examCode,questionId,JSON.stringify(data)]
          : [userId,examCode,questionId,JSON.stringify(data),revision];
        const {rows}=await client.query(sql,params);
        if (rows.length===0) throw new Error('CONFLICT');
        return rows[0];
      });
    }
  });
}

function createProgressHandler({verifyToken,pool}) {
  const access=createProgressAccess({verifyToken,store:createPgProgressStore(pool)});
  return async function handle(request) {
    const url=new URL(request.url);
    if(url.pathname!=='/progress'||!['GET','PUT'].includes(request.method))
      return Response.json({error:'Not Found'},{status:404});
    try {
      let result;
      if(request.method==='GET') {
        if(url.searchParams.get('questionId')===null){
          const rawLimit=url.searchParams.get('limit');
          result=await access.list(request.headers,{
            examCode:url.searchParams.get('examCode'),
            limit:rawLimit===null?undefined:rawLimit,
            cursor:url.searchParams.get('cursor')
          });
        }else{
          result=await access.read(request.headers,{
            examCode:url.searchParams.get('examCode'),
            questionId:url.searchParams.get('questionId'),
            userId:url.searchParams.get('userId') // deliberately ignored
          });
        }
      } else {
        // Hard limit before JSON parsing, but do not use body.id as trusted identity.
        const body=await request.text();
        if(Buffer.byteLength(body,'utf8')>20000) return Response.json({error:'Bad Request'},{status:400});
        let data;
        try{data=JSON.parse(body)}catch{ return Response.json({error:'Bad Request'},{status:400}); }
        result=await access.write(request.headers,data);
      }
      return Response.json({data:result},{status:200});
    } catch(err) {
      const message=err&&err.message;
      if(message==='UNAUTHORIZED'||message==='INVALID_TOKEN')
        return Response.json({error:'Unauthorized'},{status:401});
      if(message==='BAD_REQUEST') return Response.json({error:'Bad Request'},{status:400});
      if(message==='CONFLICT') return Response.json({error:'Conflict'},{status:409});
      // No raw SQL errors, tokens or database details in public responses.
      return Response.json({error:'Service Unavailable'},{status:503});
    }
  };
}

module.exports={createPgProgressStore,createProgressHandler};
