// 어떤 AI 프로바이더(Claude/OpenAI/Gemini)를 쓰든, "무엇을 물어볼 것인가"는 동일해야 합니다.
// 그래서 이 파일은 특정 AI SDK에 의존하지 않는 순수 텍스트 조립 로직만 담습니다.
// 각 provider(claudeProvider.js 등)는 이 함수들이 만든 system/user 텍스트를
// 자신의 API 호출 형식에 맞게 보내기만 하면 됩니다.

const RESPONSE_JSON_SHAPE = `{
  "score": 0에서 100 사이의 정수,
  "level": "입문" 또는 "중급" 또는 "전문가",
  "analysis": ["프롬프트에서 부족한 점을 자연스러운 한국어 문장으로 설명 (3~5개)"],
  "strengths": ["이미 잘 된 점 (1~3개, 없으면 빈 배열)"],
  "weaknesses": ["더 채우면 좋은 점 (1~3개)"],
  "improved_prompt": "실제로 바로 사용할 수 있는 품질의 개선된 프롬프트 (한국어)",
  "changes": ["원본 대비 추가/개선된 요소를 2~4글자 짧은 태그로 (예: '스타일 추가', '출력 형식 추가')"],
  "recommended_ai": [
    {"ai": "ChatGPT 또는 Claude 또는 Gemini", "stars": 1에서 5 사이의 정수, "reason": "추천 이유 한 줄"}
  ],
  "reason": "왜 이 개선된 프롬프트가 더 나은지 자연스럽게 설명하는 한국어 문장",
  "question_if_needed": "사용자 입력이 너무 짧거나 모호할 때만 되물을 질문 한 개. 필요 없으면 빈 문자열",
  "optimized_versions": {
    "chatgpt": "ChatGPT에 최적화된 버전 (단계별 사고 과정과 표 형식을 강조)",
    "claude": "Claude에 최적화된 버전 (길고 자연스러운 문장, 문단 구성을 강조)",
    "gemini": "Gemini에 최적화된 버전 (최신 정보 검색과 구글 문서 형식을 강조)",
    "copilot": "Copilot에 최적화된 버전 (워드/파워포인트에 바로 쓸 수 있는 형식을 강조)"
  }
}`;

function buildSystemPrompt() {
  return [
    '당신은 세계 최고 수준의 Prompt Engineering 코치입니다.',
    '사용자가 AI에게 보낼 프롬프트를 분석하고, 더 좋은 프롬프트로 개선하도록 돕습니다.',
    '',
    '평가 기준: 명확성, 구체성, 역할 지정 여부, 출력 형식 지정 여부, 제약 조건 포함 여부, 목적 전달 여부.',
    '',
    '아래 JSON 형식으로만 응답하세요. JSON 앞뒤로 어떤 설명, 인사말, 코드블록 표시(```)도 절대 붙이지 마세요.',
    RESPONSE_JSON_SHAPE,
    '',
    '모든 텍스트는 한국어로, 시니어를 포함한 다양한 연령대가 이해하기 쉬운 표현으로 작성하세요.',
    'improved_prompt와 optimized_versions의 각 버전은 실제로 복사해서 바로 사용할 수 있는 완성된 문장으로 작성하세요.',
  ].join('\n');
}

function buildUserMessage({ category, rawInput, fields = [], answers = {} }) {
  const answerLines = fields.length
    ? fields
        .map((f) => `- ${f.label}: ${(answers[f.id] || '').trim() || '(비어있음)'}`)
        .join('\n')
    : '(추가 질문 없이 원본 문장만 제공됨)';

  return [
    `사용자가 처음 입력한 문장: "${rawInput}"`,
    `감지된 카테고리: ${category || '알 수 없음 (일반 요청)'}`,
    '사용자가 추가로 답한 내용:',
    answerLines,
    '',
    '위 정보를 바탕으로 프롬프트를 분석하고 개선해주세요.',
  ].join('\n');
}

module.exports = { buildSystemPrompt, buildUserMessage };
