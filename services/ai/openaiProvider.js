// 향후 OpenAI로 교체하거나 병행하고 싶을 때 이 파일을 채우세요.
// claudeProvider.js와 정확히 같은 모양의 analyze() 함수를 내보내기만 하면,
// config/aiProvider.js의 AI_PROVIDER 값을 "openai"로 바꾸는 것만으로 전체 시스템이 전환됩니다.
//
// 구현 순서 (claudeProvider.js를 참고하세요):
//   1. npm install openai
//   2. OpenAI 클라이언트 생성 (apiKey: process.env.OPENAI_API_KEY)
//   3. buildSystemPrompt() / buildUserMessage()는 그대로 재사용 (AI마다 달라질 필요 없음)
//   4. chat.completions.create() 호출 시 response_format: { type: 'json_object' } 사용 권장
//   5. 응답 텍스트를 parseJsonResponse()로 파싱해서 그대로 반환

async function analyze(/* { category, rawInput, fields, answers } */) {
  throw new Error(
    'OpenAI 프로바이더는 아직 구현되지 않았습니다. services/ai/openaiProvider.js 상단 주석을 참고해 구현하세요.'
  );
}

module.exports = { analyze };
