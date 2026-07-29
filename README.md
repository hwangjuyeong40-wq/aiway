# AIWAY 🤖

> **AI를 쉽게 배우고, 프롬프트를 잘 작성할 수 있는 방법을 알려줍니다.**
>
> 디지털 취약계층도 3분 안에 첫 결과물을 만들 수 있게 돕는 AI 리터러시 플랫폼

🔗 **[사이트 바로가기](https://hwangjuyeong40-wq.github.io/aiway/)**

<details>
<summary>English summary</summary>

AIWAY is an AI literacy platform that teaches people — especially digitally underserved seniors — how to write better prompts, rather than writing prompts for them. Its core feature, **Prompt Coach**, analyzes a user's raw question, scores it against five explicit criteria (20 points each), and returns an improved prompt with a color-coded before/after comparison so users learn the pattern instead of just copying the output.

Built with vanilla HTML/CSS/JS on the frontend and Node.js + Express on the backend, with a provider-abstraction layer that allows switching between Gemini, Claude, and OpenAI via a single environment variable.
</details>

---

## 📌 이 프로젝트를 만든 이유

부모님이 AI를 쓰는 걸 옆에서 지켜보면서 발견한 문제가 있습니다.

**"AI가 어렵다"기보다, "뭐라고 물어봐야 할지를 모른다"는 것이었습니다.**

"그림 좀 그려줘"라고 입력하면 원하는 결과가 나오지 않고, 왜 원하는 그림이 나오지 않는지 알 수 없습니다. 그렇다고 누군가 프롬프트를 대신 써주면, 다음번에도 똑같이 막힙니다.

그래서 AIWAY는 **대신 써주고, 왜 이렇게 쓰면 더 좋은 지를 보여주는 방식을 택했습니다.

---

## ✨ 핵심 기능 — Prompt Coach

사용자가 아무 질문이나 입력하면 다음과 같은 과정을 거칩니다.

```
사용자 입력  →  AI 분석  →  5개 항목 점수  →  개선된 프롬프트
                                              →  Before/After 비교
                                              →  AI 서비스별 최적화 버전
```

### 점수는 근거가 있어야 합니다

초기 버전은 AI가 "45점"처럼 총점만 주고 근거가 불투명했습니다. 이를 **5개 항목 × 20점 = 100점** 구조로 바꾸고, 각 항목의 채점 기준표를 시스템 프롬프트에 명시했습니다.

| 항목 | 무엇을 보는가 | 색상 |
|---|---|:---:|
| **명확성** | 문장이 한 가지 뜻으로만 해석되는가 | 🔵 |
| **맥락** | 누가, 왜, 어떤 배경에서인지 설명됐는가 | 🟠 |
| **출력 조건** | 결과물의 형식·분량이 지정됐는가 | 🟢 |
| **세부 정보** | 구체적 수치·예시·제약이 있는가 | 🩷 |
| **역할 부여** | AI에게 전문가 역할을 부여했는가 | 🟣 |

**총점은 AI가 준 값을 믿지 않고 서버가 5개 항목을 직접 합산해서 재 계산합니다.** (실제로 AI가 항목 점수와 총점을 다르게 내는 경우가 발생했습니다.)

### 색상으로 개념을 학습시키기

점수 카드의 항목별 색상과 Before/After의 "추가된 요소" 태그 색상을 **의도적으로 통일**했습니다.

점수 카드에서 주황색 막대(맥락)가 낮은 걸 본 사용자가, Before/After에서 주황색 태그(맥락 추가)를 보게 됩니다. 이 반복 노출을 통해 "이 색 = 이 개념"을 자연스럽게 익히도록 설계했습니다. AIWAY의 미션인 "대신 써주기가 아니라 배우게 돕기"와 직결되는 UX입니다.

---

## 🛠 기술 스택

| 구분 | 기술 | 배포 |
|---|---|---|
| 프론트엔드 | HTML / CSS / JavaScript (프레임워크 없음) | GitHub Pages |
| 백엔드 | Node.js + Express | Render |
| 데이터베이스 | PostgreSQL | Render |
| AI 연동 | Provider 추상화 (Gemini / Claude / OpenAI) | — |
| 인증 | JWT + bcrypt | — |

### 왜 프레임워크를 쓰지 않았나

주 사용자가 시니어라 **저사양 기기와 느린 네트워크**를 고려해야 했습니다. React를 쓰면 번들 크기와 초기 로딩 시간이 늘어나는데, 이 프로젝트의 규모에서는 그 비용이 이득보다 컸습니다.

---

## 🏗 아키텍처

```
aiway/
├─ index.html                 # 프론트엔드 전체 (GitHub Pages)
│
└─ server/                    # 백엔드 (Render)
   ├─ server.js
   ├─ config/
   │  └─ aiProvider.js        # AI_PROVIDER 환경변수로 엔진 선택
   ├─ services/
   │  ├─ ai/
   │  │  ├─ claudeProvider.js
   │  │  ├─ geminiProvider.js
   │  │  ├─ openaiProvider.js
   │  │  └─ index.js          # 팩토리 패턴
   │  ├─ promptCoachPromptBuilder.js    # AI 무관 프롬프트 조립
   │  ├─ promptCoachResponseValidator.js # 응답 형태 강제
   │  ├─ historyStore.js
   │  └─ userStore.js
   ├─ middleware/
   │  └─ auth.js              # JWT 발급 / 검증
   ├─ routes/
   │  ├─ promptCoach.js
   │  ├─ auth.js
   │  └─ history.js
   └─ db/
      ├─ index.js
      └─ schema.sql
```

### AI Provider 추상화

`AI_PROVIDER` 환경변수 하나만 바꾸면 엔진을 교체할 수 있습니다.

```
AI_PROVIDER=gemini   # 현재 (무료 티어)
AI_PROVIDER=claude
AI_PROVIDER=openai
```

프롬프트 조립 로직(`promptCoachPromptBuilder.js`)은 특정 AI SDK에 의존하지 않는 순수 텍스트 처리만 담당합니다. 각 Provider는 그 결과를 자기 API 형식에 맞춰 보내기만 합니다.

**실제로 이 구조 덕분에 개발 중 Claude → Gemini 전환을 짧은 시간에 끝낼 수 있었습니다.** (학생 프로젝트로 유료 API 비용이 부담되어 무료 티어로 옮겨야 했습니다.)

### 응답 검증 계층

AI가 만든 JSON은 필드가 빠지거나, 점수가 범위를 벗어나거나, 타입이 다를 수 있습니다. `promptCoachResponseValidator.js`가 **"무엇이 와도 항상 이 모양으로 나간다"는 계약을 강제**해서, 프론트엔드가 AI의 변덕에 깨지지 않도록 했습니다.

---

## 💡 설계에서 신경 쓴 점

### 1. 어떤 단계가 실패해도 서비스가 멈추지 않습니다

| 실패 상황 | 동작 |
|---|---|
| AI API 호출 실패 | 규칙 기반 분석으로 자동 전환 (사용자는 "오프라인 모드" 배지만 봄) |
| DB 미연결 | 기록 기능만 비활성화, Prompt Coach는 정상 동작 |
| 서버 전체 다운 | 로그인이 브라우저 메모리 방식으로 폴백 |
| localStorage 차단 | 예외 없이 이번 방문에만 로그인 유지 |

핵심 기능인 Prompt Coach는 **어떤 조합의 장애에서도 결과를 반환**합니다.

### 2. 시니어 접근성은 추측이 아니라 관찰에서 나왔습니다

아버지께서 실제로 사이트를 쓰시는 걸 보다가 발견한 문제입니다.

> 복사 버튼을 눌렀는데 글자만 잠깐 바뀌니, **복사가 안 된 줄 알고 계속 다시 누르셨습니다.**

이후 복사 버튼을 이렇게 바꿨습니다.

- 문구를 2줄로: `📋 이 프롬프트 복사 붙여넣기` + 작은 글씨로 `Ctrl+C, Ctrl+V로 원하는 AI에 붙여넣으세요`
- 성공 시 **버튼 색 전체가 초록으로 전환**
- 체크 표시가 커지듯 나타나는 애니메이션
- 표시 유지 시간 1.8초 → **3초**

같은 이유로 음성 입력에도 "듣고 있음"을 색 변화 + 파동 애니메이션으로 표시했습니다.

### 3. 인증에서 실제로 고친 취약점

기록 API 초기 구현은 요청 본문의 `userId`를 그대로 신뢰했습니다. 이 상태에서는 **숫자만 바꾸면 남의 기록을 볼 수 있었습니다.**

JWT 도입 후 사용자 번호를 **서명된 토큰에서만** 꺼내도록 바꿨고, 다음을 검증했습니다.

| 시도 | 결과 |
|---|:---:|
| 토큰 없이 접근 | 401 |
| 위조된 토큰 | 401 |
| 토큰의 사용자 번호만 바꿔치기 | **401** |
| 정상 토큰 | 200 |

비밀번호(4자리 PIN)는 bcrypt 해시로만 저장하며, 로그인 실패 시 "없는 이름"과 "틀린 비밀번호"를 **구분해서 알려주지 않습니다.** 구분하면 어떤 이름이 가입되어 있는지 알아낼 수 있기 때문입니다.

---

## 🗄 데이터베이스 설계

```
users (1) ──< prompt_coach_history (N)
users (1) ──< saved_prompts (N)
prompt_coach_history (1) ──< saved_prompts (N, 선택적)
```

**사용 내역**과 **저장된 프롬프트**를 별도 테이블로 분리했습니다.

- `prompt_coach_history` — Prompt Coach를 쓸 때마다 **자동으로** 쌓이는 전체 로그
- `saved_prompts` — 사용자가 ⭐를 눌러 **명시적으로** 저장한 것만

`saved_prompts.history_id`는 **NULL을 허용**합니다. 코스별 예시 프롬프트처럼 AI 분석을 거치지 않고 바로 저장하는 경우가 있기 때문입니다. (선택적 관계)

점수는 `score_breakdown JSONB` 필드에 항목별로 저장해서, 추후 "지난달보다 평균 명확성 점수가 올랐어요" 같은 성장 추이 기능으로 확장할 수 있습니다.

---

## 📋 주요 기능 목록

- **Prompt Coach (자유 연습장)** — 아무 질문이나 입력 → 5개 항목 점수 + 개선된 프롬프트
- **코스별 Prompt Coach** — 이미지 / 보고서 / PPT / 여행 / 번역 / 글쓰기 / 앱기획 7개 코스
- **AI별 최적화** — ChatGPT / Claude / Gemini / Copilot 각각에 맞게 재작성
- **잘 쓴 프롬프트 예시** — 코스마다 바로 복사해 쓸 수 있는 완성형 예시 13개
- **음성 입력** — 브라우저 내장 Web Speech API (별도 API 키 불필요)
- **프롬프트 내보내기** — 한 세션에서 만든 프롬프트를 텍스트 파일로 일괄 다운로드
- **첫 방문 온보딩** — 섹션이 많아 헷갈리지 않도록 "동행이"가 3단계로 안내
- **글자 크기 조절** — A- / 기본 / A+ / A++

---

## 🚀 실행 방법

### 프론트엔드

`index.html` 하나면 됩니다. 브라우저로 열거나 정적 호스팅에 올리면 동작합니다.

API 주소는 접속 위치에 따라 자동으로 선택됩니다.

```js
localhost 에서 열면    → http://localhost:3000
배포된 사이트에서 열면  → https://aiway.onrender.com
```

### 백엔드

```bash
cd server
npm install
cp .env.example .env    # 키 입력
npm start
```

```bash
# .env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
DATABASE_URL=postgresql://...   # 없으면 기록 기능만 비활성화
JWT_SECRET=...
```

### 데이터베이스

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

---

## 🗺 앞으로 할 것

- [ ] 마이페이지에 "사용 내역" / "저장된 프롬프트" 화면 구현 (API는 완료)
- [ ] 관리자 대시보드를 실제 가입자 데이터와 연동
- [ ] 성장 추이 — "지난달보다 평균 점수가 올랐어요"
- [ ] 중국어 지원 (전공을 살린 확장 방향)

---

## 📝 개발 기록

이 프로젝트는 다음 순서로 발전했습니다.

| 버전 | 내용 |
|---|---|
| V2~V4 | "두 번째 인생 · AI 동행 노트" — 시니어 전용 AI 생활 코치 |
| V5 | **AIWAY로 리브랜딩** — 전 연령 대상 AI 리터러시 플랫폼으로 확장 |
| V6~V7 | 시니어 친화 타이포그래피, 글자 크기 조절, 문제-해결 섹션 |
| V8 | Prompt Coach 격상 (점수 + Before/After + AI별 최적화) |
| — | **백엔드 도입** — 규칙 기반 → 실제 AI 분석 |
| — | Claude → Gemini 전환 (Provider 추상화 활용) |
| — | 채점 기준 명문화, 색상 코드화, 인증/DB 설계 |

---

<div align="center">

**"틀려도 괜찮아요. 다시 눌러보면 됩니다. 오늘 하나, 같이 해봐요."**

— 동행이 🤖

</div>
