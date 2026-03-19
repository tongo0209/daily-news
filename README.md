# Tin Việt Mỗi Ngày

Website tin tức đa chuyên mục bằng tiếng Việt, ưu tiên nguồn trong nước (VnExpress, Tuổi Trẻ, Vietnamnet) và tự cập nhật RSS theo lịch.

## Tính năng

- Trang nhất nổi bật + tin mới cập nhật liên tục.
- Chuyên mục: Thời sự, Công nghệ, Kinh doanh, Thể thao, Giải trí, Sức khỏe, Khoa học.
- Tìm kiếm bài viết theo từ khóa.
- Đọc nhanh 30s: hiển thị các ý chính ngay trên card và trang chi tiết.
- Lọc tin theo nguồn báo và mốc thời gian (`24h`, `7d`, `30d`).
- Đọc sau: lưu bài bằng local storage, có trang quản lý riêng.
- Bản tin cá nhân hóa theo chuyên mục quan tâm.
- Gom bài cùng chủ đề: hiển thị chủ đề nhiều báo cùng nhắc đến và bài liên quan.
- Trang chi tiết bài viết + liên kết bài gốc.
- Trang Tòa soạn theo dõi phiên ingestion và thống kê dữ liệu.
- API:
  - `GET /api/articles`
  - `POST /api/ingest`
  - `GET /api/health`
- Scheduler cập nhật định kỳ bằng `node-cron`.

## Stack

- `Next.js 16` + `TypeScript`
- `Tailwind CSS`
- `Prisma` + `SQLite`
- `rss-parser` + `node-cron`
- `Vitest`

## Chạy local

1. Cài dependency

```bash
npm install
```

2. Tạo file môi trường

```bash
cp .env.example .env
```

3. Đồng bộ schema và seed nguồn RSS

```bash
npm run db:push
npm run db:seed
```

4. Nạp tin lần đầu

```bash
npm run ingest
```

5. Chạy app

```bash
npm run dev:all
```

Hoặc chạy riêng từng tiến trình:

```bash
npm run dev
npm run ingest:watch
```

Mở [http://localhost:3000](http://localhost:3000)

## Scripts quan trọng

- `npm run dev`: Chạy web local.
- `npm run dev:all`: Chạy song song web + scheduler ingestion.
- `npm run ingest`: Chạy ingestion 1 lần.
- `npm run ingest:watch`: Chạy ingestion theo lịch `INGEST_CRON`.
- `npm run db:push`: Đồng bộ schema Prisma.
- `npm run db:seed`: Đồng bộ danh sách nguồn RSS theo cấu hình mới.
- `npm run test`: Chạy unit tests.
- `npm run lint`: Kiểm tra lint.
- `npm run build`: Build production.

## Biến môi trường

- `DATABASE_URL`: Mặc định `file:./dev.db`.
- `INGEST_CRON`: Cron expression, mặc định `0 */2 * * *`.
- `INGEST_TOKEN`: Nếu đặt giá trị, `POST /api/ingest` yêu cầu header `x-ingest-token`.

## Lưu ý

- Dữ liệu RSS phụ thuộc từng nguồn; một số bài có thể thiếu ảnh hoặc nội dung đầy đủ.
- Ingestion bỏ qua bài trùng theo `url`.
