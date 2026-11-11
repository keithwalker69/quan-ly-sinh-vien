// Business logic: validate and manage students in memory.

const MA_SV_RE = /^SV\d{4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Dữ liệu không hợp lệ'];
  if (!MA_SV_RE.test(data.maSV || '')) errors.push('Mã SV phải có dạng SV0001');
  if (!data.hoTen || String(data.hoTen).trim().length < 2) errors.push('Họ tên tối thiểu 2 ký tự');
  if (!EMAIL_RE.test(data.email || '')) errors.push('Email không hợp lệ');
  const gpa = Number(data.gpa);
  if (data.gpa === undefined || data.gpa === '' || Number.isNaN(gpa) || gpa < 0 || gpa > 4) {
    errors.push('GPA phải từ 0 đến 4');
  }
  return errors;
}

function xepLoai(gpa) {
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  return 'Yếu';
}

function createStore(seed = []) {
  const students = new Map();

  function toStudent(data) {
    const gpa = Number(data.gpa);
    return {
      maSV: data.maSV,
      hoTen: String(data.hoTen).trim(),
      email: data.email,
      lop: data.lop ? String(data.lop).trim() : '',
      gpa,
      xepLoai: xepLoai(gpa),
    };
  }

  function add(data) {
    const errors = validate(data);
    if (errors.length) return { errors };
    if (students.has(data.maSV)) return { errors: ['Mã SV đã tồn tại'] };
    const s = toStudent(data);
    students.set(s.maSV, s);
    return { student: s };
  }

  function update(maSV, data) {
    if (!students.has(maSV)) return { notFound: true };
    const merged = { ...students.get(maSV), ...data, maSV };
    const errors = validate(merged);
    if (errors.length) return { errors };
    const s = toStudent(merged);
    students.set(maSV, s);
    return { student: s };
  }

  function list({ q, lop } = {}) {
    let result = [...students.values()];
    if (lop) result = result.filter((s) => s.lop === lop);
    if (q) {
      const k = q.toLowerCase();
      result = result.filter((s) => s.hoTen.toLowerCase().includes(k) || s.maSV.toLowerCase().includes(k));
    }
    return result.sort((a, b) => a.maSV.localeCompare(b.maSV));
  }

  function stats() {
    const all = [...students.values()];
    const avg = all.length ? all.reduce((t, s) => t + s.gpa, 0) / all.length : 0;
    const byXepLoai = {};
    for (const s of all) byXepLoai[s.xepLoai] = (byXepLoai[s.xepLoai] || 0) + 1;
    return { total: all.length, gpaTrungBinh: Math.round(avg * 100) / 100, byXepLoai };
  }

  seed.forEach(add);

  return {
    add,
    update,
    list,
    stats,
    get: (maSV) => students.get(maSV),
    remove: (maSV) => students.delete(maSV),
  };
}

module.exports = { validate, xepLoai, createStore };
