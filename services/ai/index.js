// 이 파일 하나만 provider 구현체들의 존재를 알고 있습니다.
// routes/promptCoach.js 같은 상위 코드는 getAIProvider()가 반환하는 것이
// claude인지 openai인지 전혀 몰라도 되고, 항상 .analyze(...)만 호출하면 됩니다.
// 이것이 "서비스 레이어 분리" 구조의 핵심입니다.

const { AI_PROVIDER } = require('../../config/aiProvider');

const providers = {
  claude: () => require('./claudeProvider'),
  openai: () => require('./openaiProvider'),
  gemini: () => require('./geminiProvider'),
};

function getAIProvider() {
  const loadProvider = providers[AI_PROVIDER];
  if (!loadProvider) {
    // config/aiProvider.js에서 이미 검증하지만, 방어적으로 한 번 더 확인합니다.
    throw new Error(`등록되지 않은 AI_PROVIDER입니다: ${AI_PROVIDER}`);
  }
  return loadProvider();
}

module.exports = { getAIProvider };
