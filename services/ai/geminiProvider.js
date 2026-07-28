// Prompt Coach의 대체 엔진: Google Gemini API (무료 티어로 사용 가능).
//
// claudeProvider.js와 정확히 같은 인터페이스를 지킵니다:
//   async function analyze({ category, rawInput, fields, answers }) -> Promise<분석결과 객체>
//
// 중요 — 두 차례 개편이 있었습니다:
//   1. 2025년 11월: 예전 패키지 `@google/generative-ai` deprecated → `@google/genai`로 통합
//   2. 2026년 상반기: `ai.models.generateContent(...)`가 아니라
//      `ai.interactions.create(...)` (Interactions API)가 새로운 기본 엔드포인트가 됨
//      (@google/genai 2.3.0 이상 필요)
//
// 이 파일은 최신 Interactions API를 사용합니다. generateContent 쪽에서 보고되던
// "AQ. 인증 키" 401 오류가 이 엔드포인트에서는 다를 수 있어 시도해볼 가치가 있습니다.

const { GoogleGenAI } = require('@google/genai');
const { buildSystemPrompt, buildUserMessage } = require('../promptCoachPromptBuilder');
const { parseJsonResponse } = require('./parseJsonResponse');

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 무료 티어에서 안정적으로 쓸 수 있는 모델입니다.
// Google이 모델 라인업을 자주 갱신하니, 무료 티어 여부는
// https://ai.google.dev/gemini-api/docs/pricing 에서 한 번씩 확인하세요.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
async function analyze({ category, rawInput, fields = [], answers = {} }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되어 있지 않습니다. server/.env 파일을 확인하세요.');
  }

  const system = buildSystemPrompt();
  const userMessage = buildUserMessage({ category, rawInput, fields, answers });

  // Interactions API의 별도 system-instruction 파라미터 이름이 아직 문서마다 다르게
  // 표기되어 있어(안정화 전), 안전하게 system 지침을 input 앞에 합쳐서 보냅니다.
  const combinedInput = `${system}\n\n---\n\n${userMessage}`;

  const interaction = await client.interactions.create({
    model: MODEL,
    input: combinedInput,
  });

  const text = interaction.output_text;
  if (!text) {
    throw new Error('Gemini 응답에 텍스트가 없습니다.');
  }

  return parseJsonResponse(text);
}

module.exports = { analyze };
