// 회원가입 / 로그인 API.
//
// server.js에 연결:
//   const authRoute = require('./routes/auth');
//   app.use('/api/auth', authRoute);

const express = require('express');
const userStore = require('../services/userStore');
const { issueToken, issueAdminToken, requireAuth } = require('../middleware/auth');
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

// 관리자 로그인. 일반 회원과 완전히 분리된 별도 체계이며, DB가 아니라
// 서버 환경변수(ADMIN_NAME, ADMIN_PIN)와 비교합니다 — 관리자는 한 명뿐이라
// users 테이블에 넣기보다 이쪽이 더 안전합니다(관리자 계정이 DB 유출과 무관해짐).
// DB 연결 여부와 무관하게 동작해야 하므로, 아래 DB 체크 미들웨어보다 앞에 둡니다.
router.post('/admin-login', (req, res) => {
  const v = validateCredentials(req.body);
  if (v.error) return res.status(400).json({ error: v.error });

  const adminName = process.env.ADMIN_NAME;
  const adminPin = process.env.ADMIN_PIN;
  if (!adminName || !adminPin) {
    return res.status(503).json({ error: '관리자 계정이 아직 설정되지 않았습니다.' });
  }

  // 보안상 "이름이 틀렸다" / "비밀번호가 틀렸다"를 구분해서 알려주지 않습니다.
  if (v.name !== adminName || v.pin !== adminPin) {
    return res.status(401).json({ error: '이름 또는 비밀번호가 맞지 않아요.' });
  }

  res.json({ token: issueAdminToken(v.name), admin: { name: v.name } });
});

// DB가 없으면 일반 회원 기능은 성립하지 않습니다 (관리자 로그인은 위에서 이미 처리되어 영향 없음).
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
