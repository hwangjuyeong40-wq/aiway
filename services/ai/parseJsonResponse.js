// AI 모델이 가끔 JSON을 ```json ... ``` 코드블록으로 감싸서 주는 경우가 있어
// 그런 경우까지 안전하게 처리하기 위한 공용 파서입니다.
// 모든 provider(claude/openai/gemini)가 이 함수를 통해 응답을 파싱해야
// "형식이 안 맞으면 에러 메시지가 명확하게 나온다"는 동작이 일관되게 유지됩니다.

function parseJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI 응답이 비어 있습니다.');
  }

  let cleaned = rawText.trim();

  // ```json ... ``` 또는 ``` ... ``` 로 감싸져 있으면 벗겨냅니다.
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI 응답을 JSON으로 해석하지 못했습니다: ${err.message}`);
  }
}

module.exports = { parseJsonResponse };
