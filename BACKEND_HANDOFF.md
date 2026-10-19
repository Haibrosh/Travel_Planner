# BACKEND HANDOFF SPECIFICATION: TRAVEL DATA & POI SERVICE

> **Ngày kiểm tra & xác thực DB**: 2026-10-18  
> **Trạng thái kết nối**: PostgreSQL 18.6 (PostGIS 3.6.4, pg_trgm 1.6) qua kết nối SSL Read-Only.  
> **Đối tượng người đọc**: Đội ngũ phát triển Backend (Java Spring Boot) và Frontend (Next.js). Tài liệu này độc lập, không yêu cầu người đọc phải hiểu chi tiết nội bộ của data pipeline.

---

## 1. Tổng quan Kiến trúc

```
+---------------------------+       +----------------------------+
|  OpenStreetMap (OSM) PBF  |       |  SerpAPI (Google Maps v2)  |
+-------------+-------------+       +--------------+-------------+
              |                                    |
              v                                    v
     [OSM POI Ingestion]                 [Enrichment Matcher]
              \                                    /
               v                                  v
+----------------------------------------------------------------+
|                 DATA PIPELINE (Batch Offline)                  |
|  - Ingestion, Deduplication, PostGIS Geometry Assignment       |
|  - Matching (name trgm, spatial distance threshold)            |
|  - Computation of display score (scripts/enrichment/step9)     |
+--------------------------------+-------------------------------+
                                 | (Write / Upsert transactions)
                                 v
+----------------------------------------------------------------+
|             POSTGRESQL DATABASE (Schema: analytics)            |
|  - analytics.destinations_v2  (34 provinces/cities)            |
|  - analytics.places_v2        (35,516 POIs, OSM + enriched)    |
|  - analytics.place_rankings   (derived display score, upsert)  |
+--------------------------------+-------------------------------+
                                 |
                                 | [READ-ONLY connection via pool]
                                 v
+----------------------------------------------------------------+
|               BACKEND API (Java Spring Boot 3.x)               |
|  - User: read-only DB role                                     |
|  - Endpoints: Filter, Sort, Pagination, Search, Detail JSON    |
+--------------------------------+-------------------------------+
                                 | (REST JSON over HTTPS)
                                 v
+----------------------------------------------------------------+
|                    FRONTEND (Next.js 14/15)                    |
|  - Server Components / Client Map rendering (Leaflet/MapLibre) |
|  - Attribution: "© OpenStreetMap contributors"                 |
+----------------------------------------------------------------+
```

### Nguyên tắc vận hành cốt lõi

1. **Phân tách trách nhiệm**: Pipeline chịu trách nhiệm trích xuất dữ liệu thô, gán toạ độ không gian, làm giàu (rating, reviews, photos) và tính toán điểm xếp hạng dẫn xuất (`ranking_score`). Backend **tuyệt đối không chạy thuật toán tính điểm phức tạp hay gọi API bên thứ ba** lúc runtime; Backend chỉ việc `JOIN`, `FILTER`, `ORDER BY ranking_score DESC` và trả JSON về Client.
2. **Quyền truy cập Cơ sở dữ liệu**: Backend chỉ sử dụng tài khoản DB có quyền **READ-ONLY** trên schema `analytics`. Không cấp quyền `INSERT`, `UPDATE`, `DELETE`, `DROP` hay `ALTER` cho Backend service trên các bảng dữ liệu địa điểm.

---

## 2. Chi tiết Database Schema & Sơ đồ quan hệ

Tất cả bảng đều nằm trong schema `analytics`. Số liệu được truy vấn thực tế từ `information_schema` ngày **2026-10-18**.

### Sơ đồ quan hệ bảng (ERD)

```
+---------------------------------------+
|       analytics.destinations_v2       |
+---------------------------------------+
| PK  province_code VARCHAR(2)          | <---+
|     slug          VARCHAR(100) UNIQUE |     |
|     name          VARCHAR(255)        |     |
|     geometry      GEOMETRY(MultiPoly) |     |
+---------------------------------------+     |
                                              | 1:N (FK)
+---------------------------------------+     |
|          analytics.places_v2          |     |
+---------------------------------------+     |
| PK  place_id      BIGSERIAL           |     |
| FK  province_code VARCHAR(2) ---------+-----+
|     name          VARCHAR(500)        |
|     category      VARCHAR(50)         |
|     subcategory   VARCHAR(100)        |
|     latitude      DOUBLE PRECISION    |
|     longitude     DOUBLE PRECISION    |
|     geometry      GEOMETRY(Point)     |
|     rating        NUMERIC(3,2)        |
|     review_count  INTEGER             |
|     photo_url     TEXT                |
+---------------------------------------+
  |
  | 1:1 (FK, ON DELETE CASCADE)
  v
+---------------------------------------+
|       analytics.place_rankings        |
+---------------------------------------+
| PK,FK place_id    BIGINT              |
|       ranking_score NUMERIC(5,4)      |
|       subcat_part   NUMERIC(5,4)      |
|       wiki_part     NUMERIC(5,4)      |
|       rating_part   NUMERIC(5,4)      |
|       review_part   NUMERIC(5,4)      |
|       formula_version VARCHAR(50)     |
+---------------------------------------+
```

---

### 2.1. Bảng `analytics.destinations_v2` [Đã có]

- **Hiện trạng**: Đã tạo và nạp dữ liệu đầy đủ **34 dòng** (tương ứng 34 tỉnh/thành trọng điểm du lịch).
- **Mục đích**: Danh mục các tỉnh/thành phố, ranh giới hành chính Polygon/MultiPolygon chuẩn WGS84 (SRID 4326).
- **Cấu trúc bảng**:

| Tên cột          | Kiểu dữ liệu                   | Nullable | Khóa / Index                              | Ý nghĩa & Ghi chú                                                       |
| ---------------- | ------------------------------ | -------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `province_code`  | `VARCHAR(2)`                   | `NO`     | **PK** (`destinations_v2_pkey`)           | Mã tỉnh 2 chữ số chuẩn Tổng cục Thống kê (VD: `'79'`, `'01'`, `'48'`).  |
| `slug`           | `VARCHAR(100)`                 | `NO`     | **UNIQUE** (`destinations_v2_slug_key`)   | Định danh URL không dấu (VD: `'ho_chi_minh'`, `'ha_noi'`, `'da_nang'`). |
| `name`           | `VARCHAR(255)`                 | `NO`     |                                           | Tên tiếng Việt hiển thị (VD: `"Hồ Chí Minh"`, `"Hà Nội"`, `"Đà Nẵng"`). |
| `name_en`        | `VARCHAR(255)`                 | `YES`    |                                           | Tên tiếng Anh (VD: `"Ho Chi Minh"`, `"Hanoi"`).                         |
| `full_name`      | `VARCHAR(255)`                 | `YES`    |                                           | Tên đầy đủ hành chính (VD: `"Thành phố Hồ Chí Minh"`).                  |
| `area_km2`       | `DOUBLE PRECISION`             | `YES`    |                                           | Diện tích tự nhiên tính theo $\text{km}^2$.                             |
| `geometry`       | `GEOMETRY(MultiPolygon, 4326)` | `NO`     | **GiST** (`idx_destinations_v2_geometry`) | Ranh giới đa giác không gian WGS84.                                     |
| `source_version` | `VARCHAR(200)`                 | `YES`    |                                           | Nguồn gốc ranh giới hành chính.                                         |
| `created_at`     | `TIMESTAMPTZ`                  | `NO`     | Default `NOW()`                           | Thời gian khởi tạo dòng.                                                |

---

### 2.2. Bảng `analytics.places_v2` [Đã có]

- **Hiện trạng**: Đã nạp chính thức **35,516 dòng** POI.
- **Mục đích**: Bảng dữ liệu địa điểm du lịch, ẩm thực, lưu trú nền từ OSM và làm giàu từ Google Maps (qua SerpAPI).
- **Cấu trúc bảng**:

| Tên cột                     | Kiểu dữ liệu            | Nullable | Khóa / Index                                            | Ý nghĩa & Ghi chú                                                                               |
| --------------------------- | ----------------------- | -------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `place_id`                  | `BIGSERIAL`             | `NO`     | **PK** (`places_v2_pkey`)                               | Khóa chính tự tăng duy nhất của POI.                                                            |
| `source`                    | `VARCHAR(50)`           | `NO`     | Part of **UQ** (`uq_places_v2_source_source_id`)        | Nguồn gốc dữ liệu gốc (hiện tại toàn bộ là `'osm'`).                                            |
| `source_id`                 | `VARCHAR(100)`          | `NO`     | Part of **UQ**                                          | ID thực thể gốc của nguồn (VD: `'node/123456'`, `'way/987654'`).                                |
| `osm_type`                  | `VARCHAR(20)`           | `YES`    |                                                         | Kiểu đối tượng OSM (`'node'`, `'way'`, `'relation'`).                                           |
| `osm_id`                    | `BIGINT`                | `YES`    |                                                         | ID số nguyên của OSM.                                                                           |
| `fetched_at`                | `TIMESTAMPTZ`           | `NO`     |                                                         | Thời điểm snapshot trích xuất OSM PBF.                                                          |
| `name`                      | `VARCHAR(500)`          | `NO`     | **GIN** (`idx_places_v2_name_trgm` dùng `gin_trgm_ops`) | Tên địa điểm hiển thị cho người dùng. Đã đánh chỉ mục fuzzy search.                             |
| `category`                  | `VARCHAR(50)`           | `NO`     | **B-Tree** (`idx_places_v2_category`)                   | 4 nhóm lớn: `'restaurant'`, `'hotel'`, `'cafe'`, `'attraction'`.                                |
| `subcategory`               | `VARCHAR(100)`          | `YES`    |                                                         | Phân loại chi tiết (VD: `'museum'`, `'beach'`, `'resort'`, `'theme_park'`).                     |
| `address`                   | `TEXT`                  | `YES`    |                                                         | Địa chỉ số nhà/đường phố (nếu OSM có khai báo).                                                 |
| `phone`                     | `TEXT`                  | `YES`    |                                                         | Số điện thoại liên hệ.                                                                          |
| `website`                   | `TEXT`                  | `YES`    |                                                         | Đường dẫn website / link mạng xã hội.                                                           |
| `opening_hours`             | `TEXT`                  | `YES`    |                                                         | Chuỗi giờ mở cửa chuẩn OSM (VD: `"Mo-Su 08:00-17:00"`).                                         |
| `latitude`                  | `DOUBLE PRECISION`      | `NO`     |                                                         | Vĩ độ WGS84 (đã kiểm tra hợp lệ $\in [8.0, 24.0]$).                                             |
| `longitude`                 | `DOUBLE PRECISION`      | `NO`     |                                                         | Kinh độ WGS84 (đã kiểm tra hợp lệ $\in [102.0, 116.0]$).                                        |
| `geometry`                  | `GEOMETRY(Point, 4326)` | `NO`     | **GiST** (`idx_places_v2_geometry`)                     | Toạ độ điểm không gian PostGIS phục vụ tìm kiếm bán kính/ST_DWithin.                            |
| `province_code`             | `VARCHAR(2)`            | `NO`     | **FK** references `destinations_v2`                     | Gắn với tỉnh/thành. Có index tổ hợp `idx_places_v2_province_category(province_code, category)`. |
| `province_method`           | `VARCHAR(20)`           | `NO`     |                                                         | Phương pháp gán tỉnh (`'within'` nằm trong ranh giới hoặc `'nearest'` gần nhất).                |
| `rating`                    | `NUMERIC(3,2)`          | `YES`    |                                                         | Điểm đánh giá sao từ Google Maps (thang điểm $0.00 \to 5.00$).                                  |
| `review_count`              | `INTEGER`               | `YES`    |                                                         | Tổng số lượt nhận xét từ Google Maps ($\ge 0$).                                                 |
| `photo_url`                 | `TEXT`                  | `YES`    |                                                         | URL ảnh đại diện chất lượng cao (CDN Google).                                                   |
| `enrichment_provider`       | `VARCHAR(50)`           | `YES`    |                                                         | Nhà cung cấp dữ liệu làm giàu (hiện là `'serpapi'`).                                            |
| `enrichment_provider_id`    | `VARCHAR(200)`          | `YES`    |                                                         | ID định danh Google Maps Place ID/Data CID.                                                     |
| `match_confidence`          | `NUMERIC(4,3)`          | `YES`    |                                                         | Độ tin cậy khớp nối thuật toán ($\in [0.0, 1.0]$).                                              |
| `enriched_at`               | `TIMESTAMPTZ`           | `YES`    |                                                         | Thời điểm thực hiện khớp nối làm giàu.                                                          |
| `created_at` / `updated_at` | `TIMESTAMPTZ`           | `NO`     | Default `NOW()`                                         | Dấu vết cập nhật dòng.                                                                          |

---

### 2.3. Bảng `analytics.place_rankings` [Đã có cấu trúc schema, Dữ liệu sẵn sàng nạp]

- **Hiện trạng**: Bảng đã được tạo migration DDL thành công (`analytics.place_rankings`). Hiện tại DB có **0 dòng**; dữ liệu được tính và nạp định kỳ tự động thông qua script [step9_compute_ranking.py](file:///d:/travel%20data%20pipeline/scripts/enrichment/step9_compute_ranking.py).
- **Mục đích**: Bảng dẫn xuất (derived data), lưu điểm xếp hạng tổng hợp `ranking_score` phục vụ Backend sắp xếp địa điểm nổi tiếng theo tỉnh.
- **Cấu trúc bảng**:

| Tên cột           | Kiểu dữ liệu   | Nullable | Khóa / Index                                                       | Ý nghĩa & Ghi chú                               |
| ----------------- | -------------- | -------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `place_id`        | `BIGINT`       | `NO`     | **PK** / **FK** references `places_v2(place_id)` ON DELETE CASCADE | Khóa chính tham chiếu 1:1 sang `places_v2`.     |
| `ranking_score`   | `NUMERIC(5,4)` | `NO`     | **B-Tree DESC** (`idx_place_rankings_score`)                       | Điểm hiển thị tổng hợp $\in [0.0000, 1.0000]$.  |
| `subcat_part`     | `NUMERIC(5,4)` | `NO`     | Default `0`                                                        | Điểm chuẩn hóa loại hình du lịch ($[0, 1]$).    |
| `wiki_part`       | `NUMERIC(5,4)` | `NO`     | Default `0`                                                        | Điểm hiện diện bách khoa toàn thư ($[0, 1]$).   |
| `rating_part`     | `NUMERIC(5,4)` | `NO`     | Default `0`                                                        | Điểm chuẩn hóa từ rating ($[0, 1]$).            |
| `review_part`     | `NUMERIC(5,4)` | `NO`     | Default `0`                                                        | Điểm chuẩn hóa log lượng review ($[0, 1]$).     |
| `formula_version` | `VARCHAR(50)`  | `NO`     |                                                                    | Phiên bản công thức tính (VD: `'v1_20261018'`). |
| `computed_at`     | `TIMESTAMPTZ`  | `NO`     | Default `NOW()`                                                    | Thời điểm tính toán.                            |

---

### 2.4. Bảng `analytics.place_contents` [Chưa có - Đề xuất cho tương lai]

- **Hiện trạng**: **[Chưa có]** trong Database (đã xác thực qua `information_schema.tables`).
- **Mục đích dự kiến**: Lưu nội dung bài viết mô tả chi tiết, lịch sử, văn hóa cho các địa danh tiêu biểu từ Wikidata/Wikipedia (bản quyền Creative Commons BY-SA).
- **Schema đề xuất khi triển khai**:
  ```sql
  CREATE TABLE IF NOT EXISTS analytics.place_contents (
      place_id        BIGINT PRIMARY KEY REFERENCES analytics.places_v2(place_id) ON DELETE CASCADE,
      language        VARCHAR(10) NOT NULL DEFAULT 'vi',
      summary         TEXT NOT NULL,
      description_md  TEXT,
      source_wiki_url TEXT,
      license         VARCHAR(50) NOT NULL DEFAULT 'CC BY-SA 4.0',
      attribution     TEXT NOT NULL,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

---

## 3. Hiện trạng Dữ liệu Thực tế (Data Profile)

Các số liệu dưới đây được đo lường chính xác từ DB vào ngày **2026-10-18**:

### 3.1. Phân bố POI theo Category (Tổng: 35,516 POIs)

| Category     | Tổng số POI | Tỷ lệ | Số POI có Rating/Review | Max Review Count |
| ------------ | ----------: | ----: | ----------------------: | ---------------: |
| `restaurant` |      10,600 | 29.8% |                     176 |           32,727 |
| `hotel`      |       9,680 | 27.3% |                     201 |           17,351 |
| `cafe`       |       8,233 | 23.2% |                     121 |           17,143 |
| `attraction` |       7,003 | 19.7% |                     257 |           87,682 |

### 3.2. Top 10 Tỉnh/Thành phố có số lượng POI lớn nhất

| STT | Mã tỉnh (`province_code`) | Tên hiển thị (`name`) | Slug          | Số lượng POI (`poi_count`) |
| --- | ------------------------- | --------------------- | ------------- | -------------------------: |
| 1   | `79`                      | Hồ Chí Minh           | `ho_chi_minh` |                      6,877 |
| 2   | `01`                      | Hà Nội                | `ha_noi`      |                      4,631 |
| 3   | `48`                      | Đà Nẵng               | `da_nang`     |                      4,258 |
| 4   | `68`                      | Lâm Đồng              | `lam_dong`    |                      2,970 |
| 5   | `56`                      | Khánh Hoà             | `khanh_hoa`   |                      1,675 |
| 6   | `91`                      | An Giang              | `an_giang`    |                      1,468 |
| 7   | `46`                      | Huế                   | `hue`         |                      1,095 |
| 8   | `92`                      | Cần Thơ               | `can_tho`     |                      1,086 |
| 9   | `31`                      | Hải Phòng             | `hai_phong`   |                      1,007 |
| 10  | `15`                      | Lào Cai               | `lao_cai`     |                        947 |

### 3.3. Tỷ lệ phủ thuộc tính (Attribute Coverage) & Xử lý Null ở Backend

Trên tổng số **35,516** bản ghi POI:

| Tên trường                                                   | Số bản ghi có dữ liệu | Tỷ lệ phủ (%) | Hệ quả đối với Backend & Frontend                                                                                                                                                                        |
| ------------------------------------------------------------ | --------------------: | ------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `category`, `latitude`, `longitude`, `province_code` |                35,516 |    **100.0%** | **Không bao giờ NULL**. Backend có thể dùng trực tiếp mà không sợ `NullPointerException`.                                                                                                                |
| `address`                                                    |                11,421 |     **32.2%** | **Thường xuyên NULL** (67.8%). Frontend phải có fallback (VD: fallback hiển thị `"Đang cập nhật địa chỉ"` hoặc chỉ hiện tên tỉnh/thành).                                                                 |
| `phone`                                                      |                 4,352 |     **12.3%** | **Có thể NULL**. Ẩn nút "Gọi điện" trên UI nếu trường này là null.                                                                                                                                       |
| `opening_hours`                                              |                 3,839 |     **10.8%** | **Có thể NULL**. Frontend chỉ parse chuỗi giờ mở cửa khi có dữ liệu.                                                                                                                                     |
| `website`                                                    |                 2,166 |      **6.1%** | **Có thể NULL**. Ẩn nút "Truy cập website" nếu null.                                                                                                                                                     |
| `rating` & `review_count`                                    |                   755 |      **2.1%** | **Phần lớn là NULL** (97.9%). Đây là đặc thù của pha pilot enrichment (chỉ làm giàu các POI nổi tiếng). Frontend không hiển thị "0 sao" mà nên hiển thị badge `"Chưa có đánh giá"` khi `rating == null`. |
| `photo_url`                                                  |                   756 |      **2.1%** | **Phần lớn là NULL**. Frontend **bắt buộc** chuẩn bị sẵn ảnh placeholder mặc định theo từng `category` (VD: ảnh mặc định cho nhà hàng, quán cafe, khách sạn, điểm tham quan).                            |

---

## 4. Đặc tả RESTful API Backend Gợi ý

Tất cả các câu truy vấn SQL bên dưới đều được thiết kế tối ưu, tận dụng các chỉ mục có sẵn trong DB (`idx_places_v2_province_category`, `idx_places_v2_name_trgm`, `idx_place_rankings_score`).

### 4.1. Endpoint 1: Danh sách tỉnh / điểm đến (đã viết endpoint này)

- **URL**: `GET /api/destinations`
- **Mô tả**: Trả về danh sách 34 tỉnh/thành phố du lịch kèm toạ độ trung tâm (centroid) để hiển thị danh sách và định vị bản đồ.
- **Query Parameters**: Không có.
- **SQL Tham khảo**:
  ```sql
  SELECT
      province_code,
      slug,
      name,
      name_en,
      full_name,
      area_km2,
      ROUND(ST_Y(ST_Centroid(geometry))::numeric, 6) AS center_lat,
      ROUND(ST_X(ST_Centroid(geometry))::numeric, 6) AS center_lng
  FROM analytics.destinations_v2
  ORDER BY name ASC;
  ```
- **Mẫu Response JSON (Thực tế từ DB)**:
  ```json
  [
    {
      "provinceCode": "48",
      "slug": "da_nang",
      "name": "Đà Nẵng",
      "nameEn": "Da Nang",
      "fullName": "Thành phố Đà Nẵng",
      "areaKm2": 11859.59,
      "centerLat": 15.670125,
      "centerLng": 108.180989
    },
    {
      "provinceCode": "01",
      "slug": "ha_noi",
      "name": "Hà Nội",
      "nameEn": "Hanoi",
      "fullName": "Thành phố Hà Nội",
      "areaKm2": 3359.84,
      "centerLat": 21.000103,
      "centerLng": 105.698007
    },
    {
      "provinceCode": "79",
      "slug": "ho_chi_minh",
      "name": "Hồ Chí Minh",
      "nameEn": "Ho Chi Minh",
      "fullName": "Thành phố Hồ Chí Minh",
      "areaKm2": 6772.59,
      "centerLat": 10.864358,
      "centerLng": 106.843627
    }
  ]
  ```

---

### 4.2. Endpoint 2: Đề xuất địa điểm theo tỉnh (Mục tiêu 1)

- **URL**: `GET /api/destinations/{slug}/places`
- **Mô tả**: Lấy danh sách địa điểm nổi tiếng theo tỉnh, sắp xếp giảm dần theo điểm hiển thị `ranking_score` (tie-break theo `p.place_id ASC`), hỗ trợ lọc danh mục và phân trang.
- **Query Parameters**:
  - `category` _(optional, string)_: Lọc theo `'attraction'`, `'hotel'`, `'restaurant'`, `'cafe'`.
  - `limit` _(optional, int, default: 20, max: 100)_: Số bản ghi một trang.
  - `offset` _(optional, int, default: 0)_: Vị trí bắt đầu.
- **SQL Tham khảo**:
  ```sql
  SELECT
      p.place_id,
      p.name,
      p.category,
      p.subcategory,
      p.address,
      p.latitude,
      p.longitude,
      p.rating,
      p.review_count,
      p.photo_url,
      COALESCE(r.ranking_score, 0.0) AS ranking_score
  FROM analytics.destinations_v2 d
  JOIN analytics.places_v2 p ON d.province_code = p.province_code
  LEFT JOIN analytics.place_rankings r ON p.place_id = r.place_id
  WHERE d.slug = :slug
    AND (:category IS NULL OR p.category = :category)
  ORDER BY ranking_score DESC, p.place_id ASC
  LIMIT :limit OFFSET :offset;
  ```
- **Mẫu Request**: `GET /api/destinations/da_nang/places?category=attraction&limit=2`
- **Mẫu Response JSON (Thực tế từ DB)**:
  ```json
  {
    "destinationSlug": "da_nang",
    "category": "attraction",
    "total": 512,
    "limit": 2,
    "offset": 0,
    "items": [
      {
        "placeId": 78039,
        "name": "Trung tâm Giải trí Phức hợp Helio Center",
        "category": "attraction",
        "subcategory": "theme_park",
        "address": "Đường 2 Tháng 9, Hòa Cường Bắc, Hải Châu",
        "latitude": 16.035412,
        "longitude": 108.223841,
        "rating": 4.3,
        "reviewCount": 3208,
        "photoUrl": "https://lh3.googleusercontent.com/p/AF1QipN...",
        "rankingScore": 0.6714
      },
      {
        "placeId": 96481,
        "name": "Bãi Biển Sơn Trà",
        "category": "attraction",
        "subcategory": "beach",
        "address": null,
        "latitude": 16.113524,
        "longitude": 108.271182,
        "rating": 4.8,
        "reviewCount": 448,
        "photoUrl": "https://lh3.googleusercontent.com/p/AF1QipP...",
        "rankingScore": 0.6705
      }
    ]
  }
  ```

---

### 4.3. Endpoint 3: Tìm kiếm địa điểm (Mục tiêu 2)

- **URL**: `GET /api/search`
- **Mô tả**: Tìm kiếm địa điểm theo từ khóa (hỗ trợ tiếng Việt không dấu hoặc có dấu thông qua `unaccent` và `pg_trgm`). Hỗ trợ lọc theo tỉnh và nhóm danh mục.
- **Query Parameters**:
  - `q` _(required, string)_: Từ khóa tìm kiếm (VD: `"chợ bến thành"`, `"cho ben thanh"`).
  - `province` _(optional, string)_: Lọc theo mã tỉnh (`province_code`) hoặc slug.
  - `category` _(optional, string)_: Lọc theo category.
  - `limit` _(optional, int, default: 20)_.
- **Kiểm tra Extension**:
  - `pg_trgm`: **[Đã có]** (version 1.6). Index GIN `idx_places_v2_name_trgm` đã sẵn sàng trên cột `name`.
  - `unaccent`: **[Chưa cài vào DB]** (đã có sẵn trong hệ thống PostgreSQL phiên bản 1.1 nhưng chưa chạy lệnh `CREATE EXTENSION IF NOT EXISTS unaccent;`).
    > **Khuyến nghị cho Backend**: Có thể chạy `CREATE EXTENSION IF NOT EXISTS unaccent;` bằng quyền superuser/admin DB, hoặc chuẩn hóa chuỗi tìm kiếm bằng toán tử `%` của `pg_trgm` kết hợp `ILIKE` trên index GIN hiện hành.
- **SQL Tham khảo**:
  ```sql
  SELECT
      p.place_id,
      p.name,
      p.category,
      p.subcategory,
      p.address,
      p.province_code,
      p.rating,
      p.review_count,
      p.photo_url,
      similarity(p.name, :q) AS match_similarity,
      COALESCE(r.ranking_score, 0.0) AS ranking_score
  FROM analytics.places_v2 p
  LEFT JOIN analytics.place_rankings r ON p.place_id = r.place_id
  WHERE (p.name % :q OR p.name ILIKE '%' || :q || '%')
    AND (:provinceCode IS NULL OR p.province_code = :provinceCode)
    AND (:category IS NULL OR p.category = :category)
  ORDER BY match_similarity DESC, ranking_score DESC
  LIMIT :limit;
  ```
- **Mẫu Request**: `GET /api/search?q=cho+ben+thanh&limit=2`
- **Mẫu Response JSON (Thực tế từ DB)**:
  ```json
  [
    {
      "placeId": 96426,
      "name": "Chè Thanh",
      "category": "restaurant",
      "subcategory": "restaurant",
      "address": "78, Mai Thúc Loan",
      "provinceCode": "46",
      "rating": null,
      "reviewCount": null,
      "photoUrl": null,
      "matchSimilarity": 0.5,
      "rankingScore": 0.14
    },
    {
      "placeId": 86589,
      "name": "Thanh Thanh",
      "category": "restaurant",
      "subcategory": "restaurant",
      "address": null,
      "provinceCode": "79",
      "rating": null,
      "reviewCount": null,
      "photoUrl": null,
      "matchSimilarity": 0.43,
      "rankingScore": 0.14
    }
  ]
  ```

---

### 4.4. Endpoint 4: Chi tiết địa điểm (Mục tiêu 3)

- **URL**: `GET /api/places/{placeId}`
- **Mô tả**: Lấy đầy đủ thông tin chi tiết của 1 địa điểm cụ thể.
- **Path Parameter**: `placeId` _(int/long)_: Khóa chính của POI.
- **SQL Tham khảo**:
  ```sql
  SELECT
      p.place_id,
      p.name,
      p.category,
      p.subcategory,
      p.address,
      p.phone,
      p.website,
      p.opening_hours,
      p.latitude,
      p.longitude,
      p.province_code,
      d.name AS province_name,
      d.slug AS destination_slug,
      p.rating,
      p.review_count,
      p.photo_url,
      COALESCE(r.ranking_score, 0.0) AS ranking_score,
      -- Dự kiến khi có place_contents:
      NULL AS description
  FROM analytics.places_v2 p
  JOIN analytics.destinations_v2 d ON p.province_code = d.province_code
  LEFT JOIN analytics.place_rankings r ON p.place_id = r.place_id
  WHERE p.place_id = :placeId;
  ```
- **Mẫu Request**: `GET /api/places/101584`
- **Mẫu Response JSON (Thực tế từ DB)**:
  ```json
  {
    "placeId": 101584,
    "name": "Bảo tàng Chứng tích Chiến tranh",
    "category": "attraction",
    "subcategory": "museum",
    "address": "28, Võ Văn Tần, Ho Chi Minh City",
    "phone": null,
    "website": "https://www.baotangchungtichchientranh.vn/contact.html",
    "openingHours": "Mo-Su 07:30-12:00, 13:30-17:00",
    "latitude": 10.779365,
    "longitude": 106.692281,
    "provinceCode": "79",
    "provinceName": "Hồ Chí Minh",
    "destinationSlug": "ho_chi_minh",
    "rating": 4.5,
    "reviewCount": 41595,
    "photoUrl": "https://lh3.googleusercontent.com/grass-cs/AABkmLdiYwgagfrCrBa5x0TF2fkW5v1h6Ly3034OBiUX2PfTBdGEF9gQSTuHwWqFZGtV_rFqtIcks6bnJB7w70C-u-ON6gmyhBT4KFH9e6vZeEerUgwLZTcTsLDemQwHwMMJ-aFmpRun=w1000-h1000-c-n",
    "rankingScore": 0.6977,
    "description": null
  }
  ```

---

## 5. Các vấn đề cần giải quyết & Khuyến nghị

| Hạng mục                              | Bằng chứng thực tế                                                                                | Đề xuất giải quyết                                                                                                                                                                                                           | Bên phụ trách                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Mô tả địa điểm (`place_contents`)** | Hiện tại bảng `analytics.place_contents` chưa tồn tại trong DB (`404 not found`).                 | Tuyệt đối **không dùng LLM tự sinh mô tả** vì dễ gây hallucination sai lệch lịch sử/địa lý. Khuyến nghị crawl tóm tắt từ Wikipedia/Wikidata theo giấy phép CC BY-SA và ghi rõ nguồn.                                         | **Data Pipeline** (crawl/insert) & **Backend** (expose API) |
| **Bản quyền ảnh (`photo_url`)**       | 756 URL ảnh hiện có là URL CDN Google Maps (`lh3.googleusercontent.com`).                         | URL này có thể hết hạn hoặc bị hạn chế hotlink theo thời gian. Frontend cần xử lý sự kiện `onError` của thẻ `<img>` để tự động fallback về ảnh mặc định. Về lâu dài cần pipeline tải về S3/MinIO.                            | **Frontend** (xử lý lỗi ảnh) & **Pipeline** (cache S3)      |
| **Extension `unaccent` tiếng Việt**   | Đã kiểm tra: `pg_trgm` đã cài, nhưng `unaccent` chưa được kích hoạt (`installed_version = NULL`). | Cần chạy lệnh `CREATE EXTENSION IF NOT EXISTS unaccent;` trong DB bằng quyền quản trị để tối ưu hóa tìm kiếm không dấu hiệu quả hơn `ILIKE`.                                                                                 | **DevOps / DBA**                                            |
| **Độ phủ dữ liệu làm giàu**           | Hiện mới chỉ có 755 / 35,516 POI (2.13%) được làm giàu rating/review/photo.                       | Đây là kết quả có chủ đích ở pha crawl ưu tiên các địa điểm nổi tiếng. Frontend phải thiết kế UI để các địa điểm chưa enrich trông vẫn tự nhiên (không để lộ placeholder rỗng).                                              | **Frontend** (UX design)                                    |
| **Rate Limiting & CORS**              | Backend phục vụ các API tìm kiếm và lọc danh sách cho người dùng web.                             | Cần áp dụng thư viện `Bucket4j` (Spring Boot) hoặc cấu hình Nginx/Cloudflare Rate Limit (VD: 60 req/phút/IP) để chống bot cào dữ liệu hàng loạt.                                                                             | **Backend**                                                 |
| **Spatial Query Performance**         | Bảng `places_v2` có 35,516 điểm với chỉ mục GiST `idx_places_v2_geometry`.                        | Khi làm tính năng "Tìm quanh đây" (Nearby POIs), Backend nên dùng `ST_DWithin(geometry, ST_MakePoint(lon, lat)::geography, distance_meters)` để tận dụng chỉ mục GiST, không dùng công thức tính khoảng cách bằng code Java. | **Backend**                                                 |

---

## 7. Danh sách các mục "[Chưa xác nhận]" (Unconfirmed Items)

Theo đúng quy tắc kiểm tra thực tế, các mục sau hiện **chưa có trong cơ sở dữ liệu** hoặc **chưa thể xác minh**:

1. **Bảng `analytics.place_contents`**: `[Chưa xác nhận / Chưa có]` — Bảng lưu trữ mô tả chi tiết, bài viết lịch sử cho POI chưa tồn tại trong DB.
2. **Dữ liệu `wikidata` / `wikipedia` trong POI**: `[Chưa xác nhận / Chưa có]` — Cả bảng `places_v2` và các file candidate parquet hiện tại đều chưa lưu tag/ID Wikidata. Do đó điểm thành phần `wiki_part` hiện bằng `0.0`.
3. **Mức độ ổn định lâu dài của URL ảnh Google (`photo_url`)**: `[Chưa xác nhận]` — Chưa đo lường được thời gian sống (TTL) của các liên kết ảnh CDN từ SerpAPI/Google Maps.
