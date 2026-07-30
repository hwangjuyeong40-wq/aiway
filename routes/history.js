// 사용 내역 / 저장된 프롬프트 API.
//
// server.js에 아래 두 줄을 추가하면 연결됩니다:
//   const historyRoute = require('./routes/history');
//   app.use('/api', historyRoute);
//
// 인증: 사용자 번호는 요청 본문이 아니라 로그인 토큰에서만 꺼냅니다.
// (본문의 userId를 믿으면 숫자만 바꿔서 남의 기록을 볼 수 있게 됩니다.)

const express = require('express');
const store = require('../services/historyStore');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// DB가 꺼져 있으면 모든 기록 API는 503으로 알려줍니다.
// 프론트엔드는 이 응답을 받으면 기록 UI를 조용히 숨기면 됩니다.
router.use((req, res, next) => {
  if (!db.isEnabled()) {
    return res.status(503).json({ error: '기록 기능이 아직 준비되지 않았습니다.', dbEnabled: false });
  }
  next();
});

// 이 아래 모든 경로는 로그인이 필요합니다.
router.use(requireAuth);

// 사용 내역 기록 (Prompt Coach를 쓸 때마다 자동 호출)
router.post('/history', async (req, res) => {
  const { category, rawInput, improvedPrompt, reason, score, scoreBreakdown } = req.body || {};
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    return res.status(400).json({ error: 'rawInput이 필요합니다.' });
  }
  if (typeof improvedPrompt !== 'string' || !improvedPrompt.trim()) {
    return res.status(400).json({ error: 'improvedPrompt가 필요합니다.' });
  }

  const saved = await store.saveHistory({
    userId: req.user.uid,
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
