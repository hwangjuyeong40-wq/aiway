// 회원 계정 데이터 접근 계층.
//
// 비밀번호(4자리 PIN)는 절대 그대로 저장하지 않습니다.
// bcrypt로 해시해서 저장하고, 로그인할 때는 "입력값을 같은 방식으로 해시해서 비교"합니다.
// 그래서 DB가 유출되어도 원래 PIN을 알아낼 수 없습니다.

const bcrypt = require('bcryptjs');
const db = require('../db');

const SALT_ROUNDS = 10;

// 이름으로 회원 찾기 (로그인 시 사용)
async function findByName(name) {
  if (!db.isEnabled()) return null;
  const res = await db.query(
    `SELECT id, name, pin_hash, created_at FROM users WHERE name = $1`,
    [name]
  );
  return res && res.rows.length ? res.rows[0] : null;
}

// 회원 가입
// 반환: {id, name} 또는 null(이미 있는 이름이거나 DB 문제)
async function createUser({ name, pin }) {
  if (!db.isEnabled()) return null;
  const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);
  const res = await db.query(
    `INSERT INTO users (name, pin_hash)
     VALUES ($1, $2)
     ON CONFLICT (name) DO NOTHING
     RETURNING id, name`,
    [name, pinHash]
  );
  // ON CONFLICT로 아무것도 삽입되지 않으면 rows가 비어 있습니다 = 이미 쓰는 이름
  return res && res.rows.length ? res.rows[0] : null;
}

// PIN이 맞는지 확인
async function verifyPin(user, pin) {
  if (!user || !user.pin_hash) return false;
  return bcrypt.compare(pin, user.pin_hash);
}

module.exports = { findByName, createUser, verifyPin };
