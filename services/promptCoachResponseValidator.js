// STEP 5 — Prompt Coach API 연결.
//
// provider.analyze()가 반환하는 값은 결국 AI가 만든 JSON이라, 가끔:
//   - 필드가 통째로 빠지거나
//   - score가 100을 넘거나 문자열로 오거나
//   - recommended_ai 안의 ai 이름이 오타이거나
//   - optimized_versions 중 일부 키가 없거나
// 하는 경우가 생길 수 있습니다.
//
// 이 파일은 그런 경우에도 프론트엔드가 절대 깨지지 않도록,
// "무엇이 와도 항상 이 모양으로 나간다"는 계약(contract)을 강제합니다.
// routes/promptCoach.js는 provider가 무엇을 반환하든 반드시 이 함수를 거친 뒤 응답합니다.

const VALID_LEVELS = ['입문', '중급', '전문가'];
const VALID_AI_NAMES = ['ChatGPT', 'Claude', 'Gemini'];
const OPTIMIZE_KEYS = ['chatgpt', 'claude', 'gemini', 'copilot'];

function clampInt(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim());
}

function toCleanString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeRecommendedAI(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ai: VALID_AI_NAMES.includes(item.ai) ? item.ai : toCleanString(item.ai, 'ChatGPT'),
      stars: clampInt(item.stars, 1, 5, 3),
      reason: toCleanString(item.reason, '추천 이유가 제공되지 않았습니다.'),
    }))
    .slice(0, 5);
}

function normalizeOptimizedVersions(value, fallbackPrompt) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};
  OPTIMIZE_KEYS.forEach((key) => {
    result[key] = toCleanString(source[key], fallbackPrompt);
  });
  return result;
}

// raw: provider.analyze()가 반환한 (검증되지 않은) 객체
// 반환값: 프론트엔드가 항상 신뢰할 수 있는, 형태가 고정된 객체
function validateAndNormalize(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI 응답이 객체 형태가 아닙니다.');
  }

  const improvedPrompt = toCleanString(raw.improved_prompt, null);
  if (!improvedPrompt) {
    // improved_prompt는 Prompt Coach의 핵심 산출물이라, 이것만은 없으면 안 됩니다.
    // (나머지 필드는 비어 있어도 화면에서 "정보 없음" 정도로 처리 가능하지만
    //  개선된 프롬프트가 없으면 이 기능 자체가 성립하지 않습니다.)
    throw new Error('AI 응답에 improved_prompt가 없습니다.');
  }

  const score = clampInt(raw.score, 0, 100, 70);
  const level = VALID_LEVELS.includes(raw.level)
    ? raw.level
    : score >= 90
    ? '전문가'
    : score >= 70
    ? '중급'
    : '입문';

  return {
    score,
    level,
    analysis: toStringArray(raw.analysis),
    strengths: toStringArray(raw.strengths),
    weaknesses: toStringArray(raw.weaknesses),
    improved_prompt: improvedPrompt,
    changes: toStringArray(raw.changes),
    recommended_ai: normalizeRecommendedAI(raw.recommended_ai),
    reason: toCleanString(raw.reason),
    question_if_needed: toCleanString(raw.question_if_needed),
    optimized_versions: normalizeOptimizedVersions(raw.optimized_versions, improvedPrompt),
  };
}

module.exports = { validateAndNormalize };
