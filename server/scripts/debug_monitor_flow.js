// Test script to verify admin pickup approval flow and approved requests endpoint
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bingo_db',
  });

  const [ins] = await db.query(
    "INSERT INTO household_pickups (user_id, full_name, phone, ward, house_number, full_address, status) VALUES (1, 'Test Citizen', '9800000000', '1', 'H-1', 'Test Address', 'pending')"
  );
  const id = ins.insertId;
  console.log('created_pickup_id=' + id);
  await db.end();

  const login = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@bingo.com',
      password: 'Admin@123',
      role: 'admin',
    }),
  });
  const l = await login.json();
  const token = l.token;

  const upd = await fetch(`http://localhost:5000/api/admin/requests/${id}/pickup/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  console.log('update_status=' + upd.status);
  console.log(await upd.text());

  const approved = await fetch('http://localhost:5000/api/admin/requests/approved', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const a = await approved.json();
  const found = (a.requests || []).find(
    (r) => Number(r.id) === Number(id) && String(r.type).toLowerCase() === 'pickup'
  );

  console.log('approved_count=' + (a.requests || []).length);
  console.log('found_new_pickup=' + !!found);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
