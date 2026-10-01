# AIWAY

> **AI가 스스로 질문을 잘할 수 있게 방법을 알려줍니다.**

디지털 신호등처럼 3분 안에 첫 번째 결과물을 만들 수 있게  
AI 리터러시를 실제 결과물 중심으로 연습할 수 있는 플랫폼입니다.

[▶ 사이트 열기](https://hwangjuyeong40-wq.github.io/aiway/)

---

## 뭐가 다른가

|  | 일반 AI 도구 | AIWAY |
|---|---|---|
| 결과 | 답을 대신해서 줌 | **왜 이렇게 물어야 하는지 보여줌** |
| 점수 | 기준이 불분명 | **5개 항목 × 20점, 기준표 표시** |
| 학습 | 다시 막힘 | **채점 피드백으로 학습** |

**채점 5개 항목** — 명확성 · 맥락 · 출력 조건 · 세부 정보 · 역할 부여

등급 카드의 색과 태그의 색을 일부러 통일했습니다.  
“이 색 = 이 개념”을 반복해서 구분하는 것이 이 서비스의 핵심 UX입니다.

---

## 주요 기능

- **프롬프트 코치** — 입력 → 코스 선택 → 단계별 질문 → 프롬프트 개선
- **AI별 최적화** — ChatGPT · Claude · Gemini · Copilot 용 버전 생성 후 Gemini API 선택
- **입력** — 모든 질문칸에 마이크(브라우저 내장, API 키 불필요)
- **사용 내역** — 원본 → 개선본 → 개선 이유를 저장
- **시니어** — 큰 글씨, 복사 버튼, 첫 방문 안내

---

## 기술 스택

| 영역 | 기술 | 배포 |
|---|---|---|
| 프론트 | HTML / CSS / JS (프레임워크 없음) | GitHub Pages |
| 백엔드 | Node.js + Express | Render |
| DB | PostgreSQL | Neon |
| 외부 AI | Gemini / Claude / OpenAI | — |
| 인증 | JWT + bcrypt | — |

---

## 실행

현재 저장소는 `server.js`와 `package.json`이 루트에 있는 구조입니다.

### 1. 저장소 클론

```bash
git clone <repository-url>
cd aiway
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

로컬 실행에 필요한 환경 변수를 설정합니다.

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
DATABASE_URL=postgresql://...
JWT_SECRET=...
ADMIN_NAME=...
ADMIN_PIN=...
```

`DATABASE_URL`은 PostgreSQL(Neon) 연결에 사용합니다.

### 4. 서버 실행

```bash
npm start
```

---

## 더 보기

[ARCHITECTURE.md](./ARCHITECTURE.md) — 시스템 구조와 기술 설계

## 📚 문서

- [사이트 바로가기](https://hwangjuyeong40-wq.github.io/aiway/)
- [아키텍처](./ARCHITECTURE.md) — 시스템 구조와 기술 설계
- [프로젝트 스토리](./STORY.md)
- [디자인 프로세스](./DESIGN.md)

---

> **“틀려도 괜찮아요. 다시 오늘 같이 해봐요.”**
