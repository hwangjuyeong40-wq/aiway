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

// 점수 산출 기준 5개 항목 (각 0~20점, 합계 100점).
// 프론트엔드의 SCORE_DIMENSIONS와 키가 정확히 일치해야 색상 막대가 그려집니다.
const DIM_KEYS = ['clarity', 'context', 'output_condition', 'detail', 'role'];
const DIM_MAX = 20;

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

// 5개 항목을 각각 0~20 정수로 강제 보정합니다.
// AI가 항목을 빠뜨리거나 문자열/범위 밖 숫자를 줘도 화면이 깨지지 않게 합니다.
function normalizeScoreBreakdown(value) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};
  DIM_KEYS.forEach((key) => {
    result[key] = clampInt(source[key], 0, DIM_MAX, 0);
  });
  return result;
}

// changes는 {tag, dimension} 형태를 기대하지만, AI가 예전처럼 문자열만 줄 수도 있습니다.
// 두 경우 모두 받아서 항상 {tag, dimension} 객체 배열로 통일합니다.
function normalizeChanges(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim() ? { tag: item.trim(), dimension: null } : null;
      }
      if (item && typeof item === 'object') {
        const tag = toCleanString(item.tag, '');
        if (!tag) return null;
        const dim = typeof item.dimension === 'string' ? item.dimension.trim() : '';
        return { tag, dimension: DIM_KEYS.includes(dim) ? dim : null };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 8);
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

  // 총점은 AI가 준 score를 그대로 믿지 않고, 5개 항목을 서버가 직접 합산해서 씁니다.
  // (AI가 항목 점수와 총점을 다르게 내는 경우가 실제로 생깁니다.)
  const score_breakdown = normalizeScoreBreakdown(raw.score_breakdown);
  const breakdownTotal = DIM_KEYS.reduce((sum, k) => sum + score_breakdown[k], 0);
  // 항목이 전부 0이면 AI가 score_breakdown 자체를 안 준 것으로 보고, 기존 score를 사용합니다.
  const hasBreakdown = breakdownTotal > 0;
  const score = hasBreakdown ? breakdownTotal : clampInt(raw.score, 0, 100, 70);

  const level = VALID_LEVELS.includes(raw.level)
    ? raw.level
    : score >= 90
    ? '전문가'
    : score >= 70
    ? '중급'
    : '입문';

  return {
    score,
    score_breakdown: hasBreakdown ? score_breakdown : null,
    level,
    analysis: toStringArray(raw.analysis),
    strengths: toStringArray(raw.strengths),
    weaknesses: toStringArray(raw.weaknesses),
    improved_prompt: improvedPrompt,
    changes: normalizeChanges(raw.changes),
    recommended_ai: normalizeRecommendedAI(raw.recommended_ai),
    reason: toCleanString(raw.reason),
    question_if_needed: toCleanString(raw.question_if_needed),
    optimized_versions: normalizeOptimizedVersions(raw.optimized_versions, improvedPrompt),
  };
}

module.exports = { validateAndNormalize };
