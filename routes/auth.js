// 회원가입 / 로그인 API.
//
// server.js에 연결:
//   const authRoute = require('./routes/auth');
//   app.use('/api/auth', authRoute);

const express = require('express');
const userStore = require('../services/userStore');
const { issueToken, requireAuth } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// 입력값 검증 — 이름 1~20자, PIN은 정확히 숫자 4자리
function validateCredentials(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : String(body?.pin ?? '');

  if (name.length < 1 || name.length > 20) {
    return { error: '이름은 1~20자로 입력해주세요.' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { error: '비밀번호는 숫자 4자리로 입력해주세요.' };
  }
  return { name, pin };
}

// DB가 없으면 회원 기능 자체가 성립하지 않습니다.
router.use((req, res, next) => {
  if (!db.isEnabled()) {
    return res.status(503).json({ error: '회원 기능이 아직 준비되지 않았습니다.', dbEnabled: false });
  }
  next();
});

// 회원가입
router.post('/register', async (req, res) => {
  const v = validateCredentials(req.body);
  if (v.error) return res.status(400).json({ error: v.error });

  const user = await userStore.createUser({ name: v.name, pin: v.pin });
  if (!user) {
    // ON CONFLICT로 걸러진 경우 = 이미 쓰고 있는 이름
    return res.status(409).json({ error: '이미 사용 중인 이름이에요. 다른 이름을 써주세요.' });
  }

  res.status(201).json({ token: issueToken(user), user: { id: user.id, name: user.name } });
});

// 로그인
router.post('/login', async (req, res) => {
  const v = validateCredentials(req.body);
  if (v.error) return res.status(400).json({ error: v.error });

  const user = await userStore.findByName(v.name);
  const ok = user && (await userStore.verifyPin(user, v.pin));

  // 보안상 "이름이 없다" / "비밀번호가 틀렸다"를 구분해서 알려주지 않습니다.
  // 구분해주면 어떤 이름이 가입되어 있는지 알아낼 수 있기 때문입니다.
  if (!ok) {
    return res.status(401).json({ error: '이름 또는 비밀번호가 맞지 않아요.' });
  }

  res.json({ token: issueToken(user), user: { id: user.id, name: user.name } });
});

// 토큰이 아직 유효한지 확인 (페이지를 새로 열었을 때 자동 로그인용)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.uid, name: req.user.name } });
});

module.exports = router;
