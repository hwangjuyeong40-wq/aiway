// 로그인 토큰(JWT) 발급과 검증.
//
// 왜 쿠키가 아니라 토큰인가:
// 프론트엔드는 github.io, 백엔드는 onrender.com — 서로 다른 도메인입니다.
// 브라우저는 이런 "제3자 쿠키"를 기본적으로 차단하기 때문에 쿠키 방식은 동작하지 않습니다.
// 토큰은 Authorization 헤더로 직접 실어 보내므로 도메인이 달라도 문제가 없습니다.

const jwt = require('jsonwebtoken');

// 운영 환경에서는 반드시 환경변수로 지정해야 합니다.
// 이 값이 노출되면 누구나 남의 토큰을 위조할 수 있습니다.
const JWT_SECRET = process.env.JWT_SECRET || 'aiway-dev-only-secret-change-me';
const TOKEN_TTL = '30d'; // 시니어 사용자가 자주 로그인하지 않도록 넉넉하게

if (!process.env.JWT_SECRET) {
  console.warn('[Auth] JWT_SECRET이 설정되지 않았습니다 — 개발용 기본값을 사용합니다. 배포 시 반드시 지정하세요.');
}

function issueToken(user) {
  return jwt.sign({ uid: user.id, name: user.name }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// 헤더에서 토큰을 꺼내 검증합니다. 실패하면 null.
function readToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return jwt.verify(match[1], JWT_SECRET);
  } catch (err) {
    // 만료됐거나 위조된 토큰
    return null;
  }
}

// 라우트 보호용 미들웨어.
// 통과하면 req.user = {uid, name}이 채워집니다.
function requireAuth(req, res, next) {
  const payload = readToken(req);
  if (!payload) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  req.user = payload;
  next();
}

module.exports = { issueToken, readToken, requireAuth };
