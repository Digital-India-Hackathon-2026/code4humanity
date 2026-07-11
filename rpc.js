const express = require('express');
const pool = require('../db/pool');
const { authOptional } = require('../middleware/auth');

const router = express.Router();

router.post('/nearby_donors', authOptional, async (req, res) => {
  const { target_blood_group, lat, lng, radius_km } = req.body;
  const result = await pool.query(
    'SELECT * FROM nearby_donors($1, $2, $3, $4)',
    [target_blood_group || null, lat, lng, radius_km]
  );
  res.json(result.rows);
});

router.post('/nearby_hospitals', authOptional, async (req, res) => {
  const { lat, lng, radius_km } = req.body;
  const result = await pool.query('SELECT * FROM nearby_hospitals($1, $2, $3)', [lat, lng, radius_km]);
  res.json(result.rows);
});

router.post('/nearby_blood_banks', authOptional, async (req, res) => {
  const { lat, lng, radius_km } = req.body;
  const result = await pool.query('SELECT * FROM nearby_blood_banks($1, $2, $3)', [lat, lng, radius_km]);
  res.json(result.rows);
});

module.exports = router;
