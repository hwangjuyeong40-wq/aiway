// Prompt Coach의 핵심 엔진: Anthropic Claude API.
//
// 이 파일이 지켜야 하는 "인터페이스"는 하나입니다:
//   async function analyze({ category, rawInput, fields, answers }) -> Promise<분석결과 객체>
// 다른 provider(openaiProvider.js, geminiProvider.js)도 반드시 같은 모양의
// 함수를 내보내야, routes/promptCoach.js가 어떤 프로바이더든 동일하게 호출할 수 있습니다.

const Anthropic = require('@anthropic-ai/sdk');
const { buildSystemPrompt, buildUserMessage } = require('../promptCoachPromptBuilder');
const { parseJsonResponse } = require('./parseJsonResponse');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 실제 사용 가능한 최신 모델명으로 바꿔서 쓰세요.
// (Anthropic 콘솔의 "Models" 문서에서 현재 사용 가능한 모델 이름을 확인하세요.)
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

async function analyze({ category, rawInput, fields = [], answers = {} }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY가 설정되어 있지 않습니다. server/.env 파일을 확인하세요.');
  }

  const system = buildSystemPrompt();
  const userMessage = buildUserMessage({ category, rawInput, fields, answers });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Claude 응답에 텍스트 블록이 없습니다.');
  }

  return parseJsonResponse(textBlock.text);
}

module.exports = { analyze };
