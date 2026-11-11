# Quản lý sinh viên

Ứng dụng web quản lý sinh viên: thêm, sửa, xóa, tìm kiếm, tự xếp loại theo GPA và thống kê.
Dùng cho bài thực hành số 2: tích hợp Jenkins CI (Docker) với GitHub.

- Backend: Node.js + Express (REST API)
- Frontend: HTML + JavaScript thuần
- Test: Node.js test runner (`node:test`), xuất báo cáo JUnit cho Jenkins

## Chạy ứng dụng

```bash
npm install
npm start          # http://localhost:3000
npm test           # chạy unit + integration test
```

## API

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/health` | Kiểm tra server |
| GET | `/api/students?q=&lop=` | Danh sách, tìm kiếm, lọc theo lớp |
| GET | `/api/students/stats` | Thống kê GPA, xếp loại |
| GET | `/api/students/:maSV` | Chi tiết sinh viên |
| POST | `/api/students` | Thêm sinh viên |
| PUT | `/api/students/:maSV` | Cập nhật sinh viên |
| DELETE | `/api/students/:maSV` | Xóa sinh viên |

## Jenkins

Xem `jenkins/` (Dockerfile, docker-compose) và `Jenkinsfile`. Hướng dẫn từng bước trong [BAO_CAO.md](BAO_CAO.md).
