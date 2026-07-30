// 관리자 대시보드용 데이터 접근 계층.
//
// 지금 DB 스키마(users/prompt_coach_history/saved_prompts)에 실제로 있는 정보만 보여줍니다.
// 나이·담은 코스·완료 코스는 애초에 DB에 저장되고 있지 않아(프론트 전용 상태), 여기 포함하지 않습니다.

const db = require('../db');

// 사용자별 실제 활동 지표를 집계해서 최신 가입순으로 반환합니다.
async function listUsersWithActivity() {
  if (!db.isEnabled()) return [];
  const res = await db.query(`
    SELECT
      u.id,
      u.name,
      u.created_at AS joined_at,
      COUNT(DISTINCT h.id) AS prompt_count,
      COUNT(DISTINCT s.id) AS saved_count,
      GREATEST(MAX(h.created_at), MAX(s.saved_at)) AS last_activity
    FROM users u
    LEFT JOIN prompt_coach_history h ON h.user_id = u.id
    LEFT JOIN saved_prompts s ON s.user_id = u.id
    GROUP BY u.id, u.name, u.created_at
    ORDER BY u.created_at DESC
  `);
  return res ? res.rows : [];
}

module.exports = { listUsersWithActivity };
