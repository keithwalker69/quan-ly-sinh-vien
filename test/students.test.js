const test = require('node:test');
const assert = require('node:assert');
const { validate, xepLoai, createStore } = require('../src/students');

const valid = { maSV: 'SV0100', hoTen: 'Phạm Minh Đức', email: 'duc@example.com', lop: 'CNTT1', gpa: 3.3 };

test('validate: dữ liệu hợp lệ không có lỗi', () => {
  assert.deepStrictEqual(validate(valid), []);
});

test('validate: bắt lỗi mã SV, email, GPA', () => {
  const errors = validate({ maSV: 'abc', hoTen: 'A', email: 'sai', gpa: 5 });
  assert.strictEqual(errors.length, 4);
});

test('validate: GPA rỗng là lỗi', () => {
  assert.ok(validate({ ...valid, gpa: '' }).includes('GPA phải từ 0 đến 4'));
});

test('xepLoai: đúng theo ngưỡng GPA', () => {
  assert.strictEqual(xepLoai(3.6), 'Xuất sắc');
  assert.strictEqual(xepLoai(3.2), 'Giỏi');
  assert.strictEqual(xepLoai(2.5), 'Khá');
  assert.strictEqual(xepLoai(2.0), 'Trung bình');
  assert.strictEqual(xepLoai(1.9), 'Yếu');
});

test('store: thêm, lấy, không cho trùng mã', () => {
  const store = createStore();
  assert.strictEqual(store.add(valid).student.xepLoai, 'Giỏi');
  assert.strictEqual(store.get('SV0100').hoTen, 'Phạm Minh Đức');
  assert.deepStrictEqual(store.add(valid).errors, ['Mã SV đã tồn tại']);
});

test('store: cập nhật tính lại xếp loại', () => {
  const store = createStore([valid]);
  assert.strictEqual(store.update('SV0100', { gpa: 3.8 }).student.xepLoai, 'Xuất sắc');
  assert.ok(store.update('SV9999', { gpa: 1 }).notFound);
  assert.ok(store.update('SV0100', { gpa: 9 }).errors);
});

test('store: tìm kiếm, lọc theo lớp, thống kê', () => {
  const store = createStore([
    valid,
    { maSV: 'SV0101', hoTen: 'Võ Thị Hoa', email: 'hoa@example.com', lop: 'CNTT2', gpa: 2.7 },
  ]);
  assert.strictEqual(store.list({ q: 'hoa' }).length, 1);
  assert.strictEqual(store.list({ lop: 'CNTT1' })[0].maSV, 'SV0100');
  assert.deepStrictEqual(store.stats(), { total: 2, gpaTrungBinh: 3, byXepLoai: { Giỏi: 1, Khá: 1 } });
  assert.ok(store.remove('SV0100'));
  assert.strictEqual(store.list().length, 1);
});
