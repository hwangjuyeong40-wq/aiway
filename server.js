require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const promptCoachRoute = require('./routes/promptCoach');
const authRoute = require('./routes/auth');
const historyRoute = require('./routes/history');
const adminRoute = require('./routes/admin');
const { AI_PROVIDER } = require('./config/aiProvider');

const app = express();

app.use(cors());
app.use(express.json({ limit: '200kb' }));

// ===== API 라우트 =====
// Prompt Coach 분석 (AI 호출)
app.use('/api/prompt-coach', promptCoachRoute);
// 회원가입 / 로그인 / 관리자 로그인
app.use('/api/auth', authRoute);
// 관리자 전용 (실제 가입자 조회) — 일반 사용자 토큰으로는 접근 불가
app.use('/api/admin', adminRoute);
// 사용 내역 / 저장된 프롬프트 (경로가 /api/history, /api/saved-prompts라서 /api에 붙입니다)
app.use('/api', historyRoute);

// 프론트엔드(public/) 정적 서빙 — STEP 3 폴더 구조 기준.
// 지금 당장은 aiway-v8.html을 그대로 public/index.html로 옮기지 않아도,
// 이 서버만 따로 실행해 API 동작을 먼저 테스트할 수 있습니다.
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AIWAY 서버 실행 중: http://localhost:${PORT}`);
  console.log(`현재 AI_PROVIDER: ${AI_PROVIDER}`);
});
