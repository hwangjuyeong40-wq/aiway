const express = require('express');
const { getAIProvider } = require('../services/ai');
const { validateAndNormalize } = require('../services/promptCoachResponseValidator');

const router = express.Router();

// POST /api/prompt-coach/analyze
// body: { category: string|null, rawInput: string, fields: {id,label}[], answers: {[fieldId]: string} }
router.post('/analyze', async (req, res) => {
  const { category, rawInput, fields, answers } = req.body || {};

  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return res.status(400).json({ error: 'rawInput(원본 프롬프트 문장)이 필요합니다.' });
  }

  try {
    const provider = getAIProvider();
    const rawResult = await provider.analyze({
      category: category || null,
      rawInput: rawInput.trim(),
      fields: Array.isArray(fields) ? fields : [],
      answers: answers && typeof answers === 'object' ? answers : {},
    });

    // provider가 무엇을 반환하든, 프론트엔드에는 항상 같은 모양으로 나갑니다.
    const result = validateAndNormalize(rawResult);
    res.json(result);
  } catch (err) {
    // 프론트엔드(promptCoachApi.js)는 이 에러를 감지해서
    // 규칙 기반 폴백(buildFreeAnalysis)으로 자동 전환합니다.
    console.error('[POST /api/prompt-coach/analyze] 실패:', err.message);
    res.status(502).json({ error: 'AI 분석에 실패했습니다.', detail: err.message });
  }
});

module.exports = router;
