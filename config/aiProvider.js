// 어떤 AI를 Prompt Coach의 핵심 엔진으로 쓸지 결정하는 단일 설정 지점입니다.
// .env의 AI_PROVIDER 값만 바꾸면 코드 수정 없이 엔진을 교체할 수 있습니다.
// (단, openai/gemini는 services/ai/ 안에 실제 구현을 채워 넣어야 동작합니다 — 지금은 claude만 구현되어 있습니다.)

const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

const SUPPORTED_PROVIDERS = ['claude', 'openai', 'gemini'];

if (!SUPPORTED_PROVIDERS.includes(AI_PROVIDER)) {
  throw new Error(
    `AI_PROVIDER="${AI_PROVIDER}"는 지원하지 않는 값입니다. (지원: ${SUPPORTED_PROVIDERS.join(', ')})`
  );
}

module.exports = { AI_PROVIDER, SUPPORTED_PROVIDERS };
