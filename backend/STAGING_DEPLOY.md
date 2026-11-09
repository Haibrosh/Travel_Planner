# Deploy Backend Staging lên Render (kết nối Aiven PostgreSQL)

Backend Spring Boot được build từ [`backend/Dockerfile`](./Dockerfile) theo Blueprint [`render.yaml`](../render.yaml) ở root repo.

## 1. Chuẩn bị (1 lần)

1. **Lấy thông tin Aiven**: Aiven Console → service PostgreSQL → *Overview* → *Connection information*: `Host`, `Port`, `Database name`, `User`, `Password`.
2. **Kiểm tra IP allowlist** của service Aiven (*Overview → Allowed IP addresses*). Render free không có IP tĩnh nên phải là `0.0.0.0/0` (mặc định của Aiven). Nếu team đã giới hạn IP thì staging sẽ không kết nối được.
3. Tài khoản Render đăng nhập bằng GitHub và được cấp quyền đọc repo `Haibrosh/Travel_Planner`.

## 2. Tạo service staging

1. Render Dashboard → **New → Blueprint** → chọn repo `Haibrosh/Travel_Planner`.
2. Chọn branch muốn deploy (khuyến nghị `main` sau khi merge PR; có thể chọn branch feature để test trước).
3. Render đọc `render.yaml` và hỏi các biến `sync: false`:

| Biến | Giá trị |
| :--- | :--- |
| `DB_HOST` | Host Aiven, ví dụ `pg-xxxx.aivencloud.com` |
| `DB_PORT` | Port Aiven (không phải 5432) |
| `DB_NAME` | Thường là `defaultdb` |
| `DB_USER` | Thường là `avnadmin` |
| `DB_PASS` | Password Aiven |
| `CORS_ALLOWED_ORIGINS` | Domain FE, phân tách bằng dấu phẩy, ví dụ `http://localhost:3000,https://travel-planner.vercel.app` |

`JWT_SECRET` được Render tự sinh, `SPRING_PROFILES_ACTIVE=staging` đã có sẵn trong Blueprint.

4. Bấm **Apply**. Lần build đầu mất khoảng 5–8 phút. Xong sẽ có URL dạng `https://travel-planner-backend-staging.onrender.com`.

## 3. Kiểm tra sau deploy

```bash
BASE=https://travel-planner-backend-staging.onrender.com

curl -i "$BASE/api/v1/destinations"                        # 200, 34 tỉnh/thành
curl -i "$BASE/api/v1/places?page=1&size=8&destinationId=79" # 200, trang đầu TP.HCM
curl -i "$BASE/api/v1/trips"                               # 401 (đúng, cần JWT)
```

Swagger UI: `$BASE/swagger-ui.html`

Trong log Render, Flyway sẽ in `Successfully applied 1 migration ... v8` (lần đầu) hoặc `... is up to date. No migration necessary` (các lần sau).

## 4. Nối Frontend vào staging

Đặt `NEXT_PUBLIC_API_URL=https://travel-planner-backend-staging.onrender.com` cho FE, và thêm domain FE vào `CORS_ALLOWED_ORIGINS` của service Render (Environment → Save → service tự redeploy).

## 5. Lưu ý

- **Render free ngủ sau 15 phút không có request**; request đầu tiên sau đó mất khoảng 1 phút để khởi động lại. Nên mở URL trước buổi demo.
- **DB Aiven dùng chung cả team**: profile `staging` giới hạn pool còn 5 connection (`DB_POOL_SIZE`) để không chiếm hết connection của Aiven free.
- Flyway chạy khi app khởi động, nên migration mới merge vào branch deploy sẽ được áp dụng lên DB Aiven dùng chung. Hãy test migration ở local trước khi merge.
- RAM 512MB: JVM đã được tinh chỉnh qua `JAVA_OPTS` trong Dockerfile; muốn ghi đè thì thêm biến `JAVA_OPTS` trên Render.
