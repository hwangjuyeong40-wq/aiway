// DB 연결 담당 모듈.
//
// 중요한 설계 원칙: DATABASE_URL이 없어도 서버는 정상 실행됩니다.
// AIWAY는 지금까지 DB 없이 동작해 왔고, DB는 "있으면 기록이 남는" 부가 기능입니다.
// 따라서 DB가 없을 때 서버가 죽으면 안 되고, 기록 기능만 조용히 비활성화되어야 합니다.

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

let pool = null;
if (connectionString) {
  pool = new Pool({
    connectionString,
    // Render의 PostgreSQL은 SSL을 요구하지만 자체 서명 인증서를 씁니다.
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  pool.on('error', (err) => {
    console.error('[DB] 연결 풀 오류:', err.message);
  });
  console.log('[DB] DATABASE_URL 감지됨 — 기록 기능이 활성화됩니다.');
} else {
  console.log('[DB] DATABASE_URL이 없습니다 — 기록 기능 없이 실행합니다.');
}

// DB를 쓸 수 있는 상태인지 확인용. 라우트에서 이 값을 보고 분기합니다.
function isEnabled() {
  return pool !== null;
}

// 쿼리 실행. DB가 없으면 null을 반환합니다(예외를 던지지 않습니다).
async function query(text, params) {
  if (!pool) return null;
  try {
    return await pool.query(text, params);
  } catch (err) {
    // 기록 저장 실패가 Prompt Coach 본 기능을 막아서는 안 됩니다.
    console.error('[DB] 쿼리 실패:', err.message);
    return null;
  }
}

module.exports = { query, isEnabled };
