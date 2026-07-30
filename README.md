# AIWAY 🤖

> **AI를 쉽게 배우고, 프롬프트를 잘 작성할 수 있는 방법을 알려줍니다.**
>
> 디지털 취약계층도 3분 안에 첫 결과물을 만들 수 있게 돕는 AI 리터러시 플랫폼

🔗 **[사이트 바로가기](https://hwangjuyeong40-wq.github.io/aiway/)**

무엇이 다른가
	일반 AI 도구	AIWAY
결과	답을 대신 만들어줌	왜 이렇게 물어야 하는지를 보여줌
점수	없거나 근거 불명	5개 항목 × 20점, 기준표 공개
학습	매번 다시 막힘	색상·패턴 반복 노출로 체득

채점 5개 항목 — 명확성 🔵 · 맥락 🟠 · 출력 조건 🟢 · 세부 정보 🩷 · 역할 부여 🟣

점수 카드의 색과 Before/After 태그의 색을 일부러 통일했습니다. "이 색 = 이 개념"을 반복해서 보게 만드는 것이 이 서비스의 핵심 UX입니다.

주요 기능
Prompt Coach — 자유 입력 + 7개 코스(이미지 / 보고서 / PPT / 여행 / 번역 / 글쓰기 / 앱기획)
AI별 최적화 — ChatGPT · Claude · Gemini · Copilot용 버전 자동 생성
음성 입력 — 모든 질문칸에 마이크 (브라우저 내장, API 키 불필요)
사용 내역 — 원본 → 개선본 → 바뀐 이유를 계정에 저장
시니어 배려 — 글자 크기 4단계, 큰 복사 버튼, 첫 방문 안내
기술 스택
영역	기술	배포
프론트	HTML / CSS / JS (프레임워크 없음)	GitHub Pages
백엔드	Node.js + Express	Render
DB	PostgreSQL	Render
AI	Provider 추상화 (Gemini / Claude / OpenAI)	—
인증	JWT + bcrypt	—

설계 원칙 — 어떤 단계가 실패해도 서비스가 멈추지 않습니다. AI 실패 → 규칙 기반 폴백 · DB 없음 → 기록만 비활성화 · 서버 다운 → 로그인 로컬 폴백

실행

프론트엔드는 index.html 하나면 됩니다.

bash
cd server
npm install
cp .env.example .env      # 아래 값 입력
npm start

psql "$DATABASE_URL" -f db/schema.sql
bash
# .env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
DATABASE_URL=postgresql://...    # 없으면 기록 기능만 비활성화
JWT_SECRET=...
ADMIN_NAME=...
ADMIN_PIN=....
더 보기

ARCHITECTURE.md — 만든 이유, 설계 결정, 보안, DB 구조, 실사용자 피드백 반영 사례

<div align="center">

"틀려도 괜찮아요. 다시 눌러보면 됩니다. 오늘 하나, 같이 해봐요."

</div>
