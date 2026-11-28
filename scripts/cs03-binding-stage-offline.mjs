// Offline orchestration only. No HTTP adapters or live entrypoint.
import { randomBytes } from 'node:crypto';
export async function stageBindings(api, databaseUrl) {
  let phase = 'preflight';
  try {
    const state = await api.inspect();
    if (state.project !== 'quiet-mouse-39990305' ||
        state.branch !== 'br-snowy-truth-a162pmdt' ||
        state.function !== 'cs03progress' || state.deployment !== 1 ||
        state.worker !== 'cs03-browser-isolated-candidate-not-approved' ||
        state.dark !== true || state.secretAbsent !== true ||
        state.environmentPreservationVerified !== true) throw Error();
    const u = new URL(databaseUrl);
    if (u.protocol !== 'postgresql:' || u.username !== 'cs03_progress_api' ||
        !u.password || u.pathname !== '/cs03_auth_sandbox' ||
        u.searchParams.get('sslmode') !== 'verify-full' ||
        !/^ep-dawn-dew-a11prveg(?:-pooler)?\.ap-southeast-1\.aws\.neon\.tech$/.test(u.hostname)) throw Error();
    const secret = randomBytes(32).toString('hex');
    phase = 'neon';
    if (await api.stageNeon({CS03_ORIGIN_SECRET:secret,CS03_TEST_DATABASE_URL:databaseUrl,CS03_ISOLATED_BRANCH_ID:state.branch}) !== true) throw Error();
    phase = 'cloudflare';
    if (await api.stageWorkerSecret(secret) !== true) throw Error();
    phase = 'verify';
    if (await api.verifyDark() !== true) throw Error();
    return {ok:true,phase:'staged',activation:false};
  } catch {
    return {ok:false,phase,activation:false};
  }
}
