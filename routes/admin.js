// 관리자 전용 API. 일반 사용자 토큰으로는 접근할 수 없습니다 (requireAdmin).
//
// server.js에 연결:
//   const adminRoute = require('./routes/admin');
//   app.use('/api/admin', adminRoute);

const express = require('express');
const adminStore = require('../services/adminStore');
const { requireAdmin } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

router.use(requireAdmin);

router.get('/users', async (req, res) => {
  if (!db.isEnabled()) {
    return res.status(503).json({ error: '아직 준비되지 않았습니다.', dbEnabled: false });
  }
  const rows = await adminStore.listUsersWithActivity();
  res.json({ items: rows });
});

module.exports = router;
