# DuckBear — Frontend

DuckBear là giao diện web cho nền tảng học tập trực tuyến. Frontend cung cấp các màn hình đăng nhập, duyệt sách và xem nội dung sách theo chương, bài học; giáo viên có thể quản lý nội dung sách, chương và bài học.

## Công nghệ

- [Vue 3](https://vuejs.org/) với Single-File Components và Composition API
- [Vite](https://vite.dev/) để phát triển và build ứng dụng
- [Vue Router](https://router.vuejs.org/) cho điều hướng
- [Pinia](https://pinia.vuejs.org/) để quản lý trạng thái
- [Vuetify](https://vuetifyjs.com/) cho giao diện
- `fetch` để gọi REST API

## Yêu cầu

- Node.js và npm
- Backend DuckBear có thể truy cập được để đăng nhập và tải dữ liệu

## Cài đặt và chạy

Mở terminal tại thư mục frontend (`FE/FE`), sau đó cài dependencies:

```bash
npm install
```

Tạo file `.env` nếu cần cấu hình địa chỉ backend:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Nếu không khai báo biến này, frontend mặc định gọi API tại `http://localhost:3000`.

Chạy ứng dụng ở chế độ phát triển:

```bash
npm run dev
```

Vite sẽ in địa chỉ local trong terminal sau khi khởi động.

## Các lệnh

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy máy chủ phát triển Vite |
| `npm run build` | Build ứng dụng cho production vào `dist/` |
| `npm run preview` | Chạy thử bản build production tại local |

## Điều hướng chính

| Đường dẫn | Màn hình |
| --- | --- |
| `/login` | Đăng nhập và đăng ký |
| `/` | Danh sách sách |
| `/books/:id` | Chi tiết sách, chương và bài học |
| `/lessons/:id` | Nội dung bài học |
| Các đường dẫn khác | Trang không tìm thấy |

Các trang ngoài `/login` yêu cầu có access token. Token và thông tin người dùng được lưu trong `localStorage`; khi token hết hạn, ứng dụng xóa phiên đăng nhập và chuyển về trang đăng nhập.

## Cấu trúc source

```text
src/
├── components/   # Thành phần giao diện dùng chung
├── plugins/      # Cấu hình plugin, bao gồm i18n
├── router/       # Khai báo routes và điều hướng
├── services/     # Hàm gọi API
├── stores/       # Trạng thái ứng dụng và xác thực (Pinia)
├── views/        # Các màn hình của ứng dụng
├── App.vue       # Component gốc
├── main.js       # Khởi tạo Vue, Pinia, Router và Vuetify
└── style.css     # Styles toàn cục
```

## Kết nối backend

Đặt `VITE_API_BASE_URL` thành URL của backend trước khi chạy hoặc build frontend. Ví dụ:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Frontend gọi các API xác thực, sách, chương và bài học tại địa chỉ này. Đảm bảo backend đang chạy và cho phép frontend kết nối (CORS).
