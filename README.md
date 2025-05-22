# Facebook Clone

Đây là một ứng dụng clone Facebook được xây dựng bằng Spring Boot (Backend) và React (Frontend).

## Yêu cầu hệ thống

- JDK 17 hoặc cao hơn
- Node.js 16.x hoặc cao hơn
- Maven
- MySQL 8.0 hoặc cao hơn
- Git

## Cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/[username]/facebook-clone.git
cd facebook-clone
```

### 2. Cài đặt Backend

```bash
cd backend
mvn clean install
```

### 3. Cấu hình Database

1. Tạo database MySQL mới:
```sql
CREATE DATABASE facebook_clone;
```

2. Cấu hình file `application.properties` trong thư mục `backend/src/main/resources/`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/facebook_clone
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 4. Cài đặt Frontend

```bash
cd frontend
npm install
```

## Chạy ứng dụng

### 1. Chạy Backend

```bash
cd backend
mvn spring-boot:run
```

Backend sẽ chạy tại: http://localhost:8080

### 2. Chạy Frontend

```bash
cd frontend
npm start
```

Frontend sẽ chạy tại: http://localhost:3000

## Tính năng chính

- Đăng ký và đăng nhập tài khoản
- Đăng bài viết với hình ảnh và video
- Like và comment bài viết
- Chia sẻ bài viết
- Xem thông báo
- Tìm kiếm người dùng
- Xem trang cá nhân

## Cấu trúc thư mục

```
facebook-clone/
├── backend/                 # Spring Boot Backend
│   ├── src/
│   └── pom.xml
├── frontend/               # React Frontend
│   ├── src/
│   └── package.json
└── README.md
```

## API Endpoints

### Posts
- `POST /api/posts` - Tạo bài viết mới
- `GET /api/posts` - Lấy danh sách bài viết
- `DELETE /api/posts/{id}` - Xóa bài viết
- `POST /api/posts/{id}/like` - Like/Unlike bài viết
- `POST /api/posts/{id}/share` - Chia sẻ bài viết
- `POST /api/posts/{id}/comments` - Thêm bình luận
- `GET /api/posts/user/{id}` - Lấy bài viết của người dùng

### Upload
- `POST /api/posts/upload-image` - Upload hình ảnh
- `POST /api/posts/upload-video` - Upload video

## Xử lý lỗi thường gặp

1. Lỗi kết nối database:
   - Kiểm tra thông tin kết nối trong `application.properties`
   - Đảm bảo MySQL đang chạy
   - Kiểm tra quyền truy cập database

2. Lỗi port đã được sử dụng:
   - Thay đổi port trong file cấu hình
   - Hoặc tắt ứng dụng đang sử dụng port đó

3. Lỗi npm install:
   - Xóa thư mục node_modules và file package-lock.json
   - Chạy lại npm install

## Đóng góp

Mọi đóng góp đều được hoan nghênh. Vui lòng tạo issue hoặc pull request để đóng góp.

## Giấy phép

Dự án này được cấp phép theo MIT License. 