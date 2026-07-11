const express = require('express');
const pool = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { parsePoint } = require('../utils/geo');

const router = express.Router();

const ALLOWED_COLUMNS = [
  'id', 'full_name', 'phone', 'blood_group', 'is_organ_donor', 'role', 'is_doctor',
  'hospital_name', 'nmr_id', 'doctor_verified', 'age', 'gender', 'has_health_condition',
  'health_issues', 'is_available', 'created_at', 'updated_at'
];

router.get('/', authRequired, async (req, res) => {
  const { select, order, limit, id, is_doctor } = req.query;
  const columns = select
    ? select.split(',').map(c => c.trim()).filter(c => ALLOWED_COLUMNS.includes(c))
    : ALLOWED_COLUMNS;

  const clauses = [];
  const values = [];
  let idx = 1;

  if (id) {
    clauses.push(`id = $${idx++}`);
    values.push(id);
  }
  if (is_doctor !== undefined) {
    clauses.push(`is_doctor = $${idx++}`);
    values.push(is_doctor === 'true');
  }

  let sql = `SELECT ${columns.map(c => `"${c}"`).join(', ')} FROM profiles`;
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
  if (order) {
    const [col, dir] = order.split('.');
    if (ALLOWED_COLUMNS.includes(col)) sql += ` ORDER BY "${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  }
  if (limit) sql += ` LIMIT ${parseInt(limit, 10)}`;

  const result = await pool.query(sql, values);
  res.json(result.rows);
});

router.patch('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const updates = [];
  const values = [];
  let idx = 1;

  if (body.location !== undefined) {
    const point = parsePoint(body.location);
    updates.push(`location = ${point ? `ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)::geography` : 'NULL'}`);
    if (point) values.push(point.lng, point.lat);
  }
  if (body.full_name !== undefined) { updates.push(`full_name = $${idx++}`); values.push(body.full_name); }
  if (body.phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(body.phone); }
  if (body.is_available !== undefined) { updates.push(`is_available = $${idx++}`); values.push(body.is_available); }
  if (body.doctor_verified !== undefined) { updates.push(`doctor_verified = $${idx++}`); values.push(body.doctor_verified); }

  if (updates.length === 0) return res.json({ ok: true });

  values.push(id);
  await pool.query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx}`, values);
  res.json({ ok: true });
});

module.exports = router;
