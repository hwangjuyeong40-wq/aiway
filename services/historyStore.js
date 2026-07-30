// prompt_coach_history / saved_prompts 테이블에 대한 데이터 접근 계층.
//
// 라우트가 SQL을 직접 쓰지 않고 이 파일을 거치게 해서,
// 나중에 DB를 바꾸거나 쿼리를 고칠 때 한 곳만 수정하면 되도록 분리했습니다.
//
// 모든 함수는 DB가 없을 때 null 또는 빈 배열을 반환합니다 — 호출한 쪽이 예외 처리를 하지 않아도 됩니다.

const db = require('../db');

// ── 사용 내역 ────────────────────────────────

// Prompt Coach를 쓸 때마다 자동으로 한 줄 쌓입니다.
async function saveHistory({ userId, category, rawInput, improvedPrompt, reason, score, scoreBreakdown }) {
  if (!db.isEnabled() || !userId) return null;
  const res = await db.query(
    `INSERT INTO prompt_coach_history
       (user_id, category, raw_input, improved_prompt, reason, score, score_breakdown)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [userId, category || null, rawInput, improvedPrompt, reason || null, score ?? null, scoreBreakdown || null]
  );
  return res ? res.rows[0] : null;
}

// 마이페이지 "🗒️ 프롬프트 사용 내역" — 최신순
async function listHistory(userId, limit = 30) {
  if (!db.isEnabled() || !userId) return [];
  const res = await db.query(
    `SELECT id, category, raw_input, improved_prompt, reason, score, score_breakdown, created_at
       FROM prompt_coach_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return res ? res.rows : [];
}

// ── 저장된 프롬프트 ──────────────────────────

// 사용자가 "⭐ 저장하기"를 눌렀을 때만 호출됩니다.
// historyId는 선택 사항 — 코스 예시 프롬프트를 바로 저장하는 경우 null이 들어갑니다.
async function savePrompt({ userId, historyId = null, title, promptText, category }) {
  if (!db.isEnabled() || !userId) return null;
  const res = await db.query(
    `INSERT INTO saved_prompts (user_id, history_id, title, prompt_text, category)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, saved_at`,
    [userId, historyId, title || null, promptText, category || null]
  );
  return res ? res.rows[0] : null;
}

// 마이페이지 "⭐ 저장된 프롬프트" — 최신순
async function listSaved(userId, limit = 50) {
  if (!db.isEnabled() || !userId) return [];
  const res = await db.query(
    `SELECT id, history_id, title, prompt_text, category, saved_at
       FROM saved_prompts
      WHERE user_id = $1
      ORDER BY saved_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return res ? res.rows : [];
}

// 본인이 저장한 것만 지울 수 있도록 user_id 조건을 함께 겁니다.
// (이 조건이 없으면 id만 바꿔 남의 기록을 지울 수 있게 됩니다.)
async function deleteSaved({ userId, savedId }) {
  if (!db.isEnabled() || !userId) return false;
  const res = await db.query(
    `DELETE FROM saved_prompts WHERE id = $1 AND user_id = $2`,
    [savedId, userId]
  );
  return !!(res && res.rowCount > 0);
}

module.exports = { saveHistory, listHistory, savePrompt, listSaved, deleteSaved };
