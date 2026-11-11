# Báo cáo bài thực hành số 2 — Jenkins CI với Docker và GitHub

**Dự án:** Quản lý sinh viên (Node.js + Express)
**Repository:** `https://github.com/keithwalker69/quan-ly-sinh-vien`
**Phương án:** Triển khai Jenkins dưới dạng Docker Container

> Chỗ ghi `📷 Ảnh:` là nơi chèn ảnh chụp màn hình minh chứng.

---

## 1. Giới thiệu dự án

Ứng dụng web quản lý sinh viên gồm:

- REST API (Express): thêm / sửa / xóa / tìm kiếm sinh viên, kiểm tra dữ liệu (mã SV dạng `SV0001`, email, GPA 0–4), tự xếp loại theo GPA, thống kê.
- Giao diện web HTML/JS gọi API.
- 11 test tự động: unit test cho logic nghiệp vụ (`test/students.test.js`) và integration test gọi API qua HTTP thật (`test/api.test.js`).

Cấu trúc thư mục:

```
quan-ly-sinh-vien/
├── src/            # students.js (logic), app.js (API), server.js
├── public/         # index.html (giao diện)
├── test/           # unit + integration test
├── jenkins/        # Dockerfile, plugins.txt, docker-compose.yml
├── Jenkinsfile     # định nghĩa pipeline
└── package.json
```

📷 Ảnh: giao diện ứng dụng tại `http://localhost:3000`

---

## 2. Thiết lập Jenkins dưới dạng Docker Container

Thay vì cài Jenkins trực tiếp, nhóm build một image riêng từ `jenkins/jenkins:lts-jdk21`, cài sẵn Node.js 24 và các plugin cần thiết (file `jenkins/Dockerfile`, `jenkins/plugins.txt`).

```bash
cd jenkins
docker compose up -d --build
```

Lấy mật khẩu admin lần đầu:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Mở `http://localhost:8080` → dán mật khẩu → **Install suggested plugins** → tạo tài khoản admin.

📷 Ảnh: `docker ps` thấy container `jenkins` đang chạy
📷 Ảnh: màn hình Unlock Jenkins / Dashboard Jenkins

---

## 3. Cài đặt Plugins (bao gồm Testing Framework)

Các plugin đã cài sẵn qua `plugins.txt`:

| Plugin | Công dụng |
|---|---|
| Git, GitHub | Kết nối và lấy mã nguồn từ GitHub |
| Pipeline (workflow-aggregator) | Chạy pipeline từ Jenkinsfile |
| Pipeline: Stage View | Hiển thị các stage dạng bảng |
| **JUnit** | **Đọc kết quả test (file XML), vẽ biểu đồ test pass/fail** |
| Timestamper | Thêm thời gian vào log |

Kiểm tra: **Manage Jenkins → Plugins → Installed plugins**.

📷 Ảnh: danh sách plugin đã cài (có JUnit, Git, Pipeline)

---

## 4. Tích hợp Jenkins với GitHub

1. Đẩy mã nguồn lên GitHub (repo public).
2. Trong Jenkins: **New Item** → tên `quan-ly-sinh-vien` → chọn **Pipeline** → OK.
3. Phần **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/keithwalker69/quan-ly-sinh-vien.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
4. **Save**.

> Nếu repo private: tạo Personal Access Token trên GitHub, thêm vào **Manage Jenkins → Credentials** dạng *Username with password*, rồi chọn credential đó ở bước 3.

📷 Ảnh: cấu hình Pipeline script from SCM

---

## 5. Tự động lấy mã nguồn từ Git Repository

Jenkinsfile khai báo:

```groovy
triggers {
    pollSCM('H/2 * * * *')
}
```

Jenkins tự kiểm tra GitHub khoảng mỗi 2 phút; khi có commit mới sẽ tự `checkout` và chạy pipeline. Nhóm dùng Poll SCM vì Jenkins chạy trên máy cá nhân, GitHub không gọi webhook vào được (không có IP public).

Lần đầu cần bấm **Build Now** một lần để Jenkins đọc Jenkinsfile và đăng ký trigger.

📷 Ảnh: build được kích hoạt tự động ("Started by an SCM change")

---

## 6. Xây dựng Jenkins Pipeline thông qua Jenkinsfile

Pipeline gồm các stage:

| Stage | Lệnh | Mục đích |
|---|---|---|
| Checkout | `checkout scm` | Lấy mã nguồn từ GitHub |
| Môi trường | `node --version` | Xác nhận Node.js có trong agent |
| Build | `npm ci`, `npm run lint` | Cài thư viện theo lock file, kiểm tra cú pháp |
| Test | `npm run test:ci` | Chạy 11 test, đo coverage, xuất `test-results.xml` |
| Smoke test | chạy server, `curl /api/health` | Kiểm tra app khởi động được |
| post | `junit`, `archiveArtifacts` | Hiển thị kết quả test, lưu file kết quả |

(Nội dung đầy đủ trong file `Jenkinsfile`.)

📷 Ảnh: Stage View tất cả stage màu xanh

---

## 7. Tự động hóa Build và Test

- **Build:** `npm ci` cài đúng phiên bản thư viện trong `package-lock.json`; `npm run lint` kiểm tra cú pháp các file nguồn.
- **Test:** `node --test` chạy unit test và integration test. Reporter `junit` ghi file `test-results.xml`, plugin JUnit đọc file này và hiển thị **Test Result** + biểu đồ **Test Result Trend** qua các lần build. Coverage được in ra trong Console Output (≈ 99% dòng code).

📷 Ảnh: Console Output phần test (11 pass, bảng coverage)
📷 Ảnh: trang Test Result (11 tests, 0 failures)

---

## 8. Phân tích kết quả và xử lý lỗi phát sinh

### 8.1 Kết quả build thành công

- Tất cả stage đạt, 11/11 test pass, coverage ≈ 99% dòng.
- Thời gian một lần chạy: khoảng ___ giây (điền theo thực tế).

### 8.2 Lỗi cố ý: test thất bại

Để kiểm tra Jenkins phát hiện lỗi, nhóm sửa ngưỡng xếp loại trong `src/students.js`:

```js
if (gpa >= 3.6) return 'Xuất sắc';   // đổi thành 3.5
```

Push lên GitHub → Jenkins tự chạy → stage **Test** đỏ, build **FAILURE**. Trang Test Result chỉ rõ test `xepLoai: đúng theo ngưỡng GPA` lỗi, kèm giá trị mong đợi và thực tế. Sửa lại → push → build xanh trở lại.

📷 Ảnh: build đỏ, Test Result báo 1 failure
📷 Ảnh: build xanh sau khi sửa, biểu đồ Test Result Trend

### 8.3 Các lỗi thường gặp khi thiết lập và cách xử lý

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `npm: not found` | Image Jenkins gốc không có Node.js | Build image riêng có Node.js (`jenkins/Dockerfile`) hoặc dùng NodeJS plugin |
| `Couldn't find any revision to build` | Sai tên nhánh (`master` thay vì `main`) | Sửa Branch Specifier thành `*/main` |
| `Authentication failed` / `repository not found` | Repo private chưa có credential | Thêm GitHub token vào Credentials |
| `No test report files were found` | Test lỗi trước khi ghi file XML | Xem Console Output; `allowEmptyResults: true` để không che lỗi gốc |
| `npm ci` lỗi thiếu lock file | Chưa commit `package-lock.json` | Commit `package-lock.json` lên repo |
| `EADDRINUSE` ở smoke test | Cổng đã bị chiếm | Dùng cổng riêng (`PORT=3100`) |
| Pipeline không tự chạy | Chưa build lần đầu nên trigger chưa đăng ký | Bấm Build Now một lần |

(Ghi thêm các lỗi thực tế nhóm gặp, kèm ảnh.)

---

## 9. Kết luận

Nhóm đã triển khai Jenkins bằng Docker, kết nối GitHub, cài plugin JUnit cho testing, xây dựng pipeline bằng Jenkinsfile để tự động lấy mã nguồn, build, test và báo cáo kết quả. Mỗi khi có commit mới, Jenkins tự kiểm tra và báo ngay commit nào làm hỏng test.
