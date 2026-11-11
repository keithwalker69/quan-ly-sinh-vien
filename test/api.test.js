// Integration test: start the real HTTP server on a random port and call the API.
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

let server;
let base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(() => server.close());

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('GET /api/health', async () => {
  const res = await fetch(`${base}/health`);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
});

test('GET /api/students trả về dữ liệu mẫu', async () => {
  const list = await (await fetch(`${base}/students`)).json();
  assert.strictEqual(list.length, 3);
});

test('POST, PUT, DELETE một sinh viên', async () => {
  const sv = { maSV: 'SV0200', hoTen: 'Đặng Quốc Huy', email: 'huy@example.com', lop: 'CNTT3', gpa: 2.8 };

  let res = await fetch(`${base}/students`, json('POST', sv));
  assert.strictEqual(res.status, 201);

  res = await fetch(`${base}/students/SV0200`, json('PUT', { gpa: 3.9 }));
  assert.strictEqual((await res.json()).xepLoai, 'Xuất sắc');

  res = await fetch(`${base}/students/SV0200`, { method: 'DELETE' });
  assert.strictEqual(res.status, 204);

  res = await fetch(`${base}/students/SV0200`);
  assert.strictEqual(res.status, 404);
});

test('POST dữ liệu sai trả về 400', async () => {
  const res = await fetch(`${base}/students`, json('POST', { maSV: 'x' }));
  assert.strictEqual(res.status, 400);
  assert.ok((await res.json()).errors.length > 0);
});
