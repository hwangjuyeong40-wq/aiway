// 사용 내역 / 저장된 프롬프트 API.
//
// server.js에 아래 두 줄을 추가하면 연결됩니다:
//   const historyRoute = require('./routes/history');
//   app.use('/api', historyRoute);
//
// 인증: 사용자 번호는 요청 본문이 아니라 로그인 토큰에서만 꺼냅니다.
// (본문의 userId를 믿으면 숫자만 바꿔서 남의 기록을 볼 수 있게 됩니다.)
//
// 단, 기록 저장(POST /history)만은 로그인 없이도 허용합니다.
// AIWAY는 가입 없이 쓸 수 있는 서비스라, 로그인한 사용자만 기록하면
// 실제 사용의 대부분이 집계에서 빠지기 때문입니다.
// 이 경우 user_id는 NULL로 저장되고 session_id로만 묶입니다.

const express = require('express');
const store = require('../services/historyStore');
const { requireAuth, readToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

/* ===== 간단한 요청 제한 =====
   로그인 없이 열려 있는 경로라 누구나 요청을 던질 수 있습니다.
   외부 패키지 없이 메모리에만 기록하는 최소한의 방어입니다.
   (서버가 재시작되면 초기화되며, 여러 인스턴스로 늘리면 인스턴스별로 각각 셉니다.) */
const RATE_WINDOW_MS = 60 * 1000; // 1분
const RATE_MAX = 20;              // 1분에 20회까지
const rateLog = new Map();        // IP -> [요청시각, ...]

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const hits = (rateLog.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateLog.set(ip, hits);

  // 오래된 IP 기록을 가끔 정리해 메모리가 무한정 늘지 않게 합니다.
  if (rateLog.size > 5000) {
    for (const [key, times] of rateLog) {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) rateLog.delete(key);
    }
  }

  if (hits.length > RATE_MAX) {
    return res.status(429).json({ error: '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.' });
  }
  next();
}

// DB가 꺼져 있으면 모든 기록 API는 503으로 알려줍니다.
// 프론트엔드는 이 응답을 받으면 기록 UI를 조용히 숨기면 됩니다.
router.use((req, res, next) => {
  if (!db.isEnabled()) {
    return res.status(503).json({ error: '기록 기능이 아직 준비되지 않았습니다.', dbEnabled: false });
  }
  next();
});

// ===== 로그인 없이도 되는 경로 (아래 requireAuth보다 먼저 선언해야 합니다) =====

// 사용 내역 기록 (Prompt Coach를 쓸 때마다 자동 호출)
// 로그인했으면 user_id가 함께 저장되고, 아니면 session_id만 저장됩니다.
router.post('/history', rateLimit, async (req, res) => {
  const { category, rawInput, improvedPrompt, reason, score, scoreBreakdown, sessionId } = req.body || {};
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    return res.status(400).json({ error: 'rawInput이 필요합니다.' });
  }
  if (typeof improvedPrompt !== 'string' || !improvedPrompt.trim()) {
    return res.status(400).json({ error: 'improvedPrompt가 필요합니다.' });
  }

  // 토큰이 있으면 읽고, 없어도 통과시킵니다(선택적 인증).
  const payload = readToken(req);

  const saved = await store.saveHistory({
    userId: payload && payload.role === 'user' ? payload.uid : null,
    // 지나치게 긴 값이 들어오지 않도록 잘라서 저장합니다.
    sessionId: typeof sessionId === 'string' ? sessionId.trim().slice(0, 40) : null,
    category,
    rawInput: rawInput.trim(),
    improvedPrompt: improvedPrompt.trim(),
    reason: typeof reason === 'string' ? reason.trim() : null,
    score: Number.isFinite(Number(score)) ? Number(score) : null,
    scoreBreakdown: scoreBreakdown || null,
  });

  if (!saved) return res.status(500).json({ error: '기록에 실패했습니다.' });
  res.status(201).json(saved);
});

// ===== 이 아래 모든 경로는 로그인이 필요합니다 =====
router.use(requireAuth);

// 사용 내역 조회
router.get('/history', async (req, res) => {
  const rows = await store.listHistory(req.user.uid);
  res.json({ items: rows });
});

// 저장된 프롬프트 조회
router.get('/saved-prompts', async (req, res) => {
  const rows = await store.listSaved(req.user.uid);
  res.json({ items: rows });
});

// 프롬프트 저장 (⭐ 버튼)
router.post('/saved-prompts', async (req, res) => {
  const { historyId = null, title, promptText, category } = req.body || {};
  if (typeof promptText !== 'string' || !promptText.trim()) {
    return res.status(400).json({ error: 'promptText가 필요합니다.' });
  }

  const saved = await store.savePrompt({
    userId: req.user.uid,
    historyId: historyId ? Number(historyId) : null,
    // 제목을 안 정했으면 프롬프트 앞부분으로 자동 생성해 줍니다.
    title: (title && title.trim()) || promptText.trim().slice(0, 30),
    promptText: promptText.trim(),
    category,
  });

  if (!saved) return res.status(500).json({ error: '저장에 실패했습니다.' });
  res.status(201).json(saved);
});

// 저장된 프롬프트 삭제
router.delete('/saved-prompts/:id', async (req, res) => {
  const ok = await store.deleteSaved({ userId: req.user.uid, savedId: Number(req.params.id) });
  if (!ok) return res.status(404).json({ error: '해당 기록을 찾을 수 없습니다.' });
  res.json({ deleted: true });
});

module.exports = router;
