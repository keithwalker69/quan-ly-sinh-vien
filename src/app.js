const path = require('node:path');
const express = require('express');
const { createStore } = require('./students');

const SEED = [
  { maSV: 'SV0001', hoTen: 'Nguyễn Văn An', email: 'an@example.com', lop: 'CNTT1', gpa: 3.7 },
  { maSV: 'SV0002', hoTen: 'Trần Thị Bình', email: 'binh@example.com', lop: 'CNTT1', gpa: 3.1 },
  { maSV: 'SV0003', hoTen: 'Lê Hoàng Cường', email: 'cuong@example.com', lop: 'CNTT2', gpa: 2.4 },
];

function createApp(store = createStore(SEED)) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.get('/api/students', (req, res) => res.json(store.list(req.query)));

  app.get('/api/students/stats', (req, res) => res.json(store.stats()));

  app.get('/api/students/:maSV', (req, res) => {
    const s = store.get(req.params.maSV);
    if (!s) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json(s);
  });

  app.post('/api/students', (req, res) => {
    const r = store.add(req.body);
    if (r.errors) return res.status(400).json({ errors: r.errors });
    res.status(201).json(r.student);
  });

  app.put('/api/students/:maSV', (req, res) => {
    const r = store.update(req.params.maSV, req.body);
    if (r.notFound) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    if (r.errors) return res.status(400).json({ errors: r.errors });
    res.json(r.student);
  });

  app.delete('/api/students/:maSV', (req, res) => {
    if (!store.remove(req.params.maSV)) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.status(204).end();
  });

  return app;
}

module.exports = { createApp };
