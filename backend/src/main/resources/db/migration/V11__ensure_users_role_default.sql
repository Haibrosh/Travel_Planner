-- =============================================================================
-- V11: Đảm bảo cột role trên app.users luôn tồn tại và có DEFAULT 'ROLE_USER'
-- Khắc phục lỗi NOT NULL constraint khi đăng ký tài khoản trên Aiven DB
-- (cột role đã tồn tại từ trước nhưng chưa có DEFAULT) và đồng bộ cho DB mới từ V3.
-- =============================================================================

ALTER TABLE app.users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER';

ALTER TABLE app.users
    ALTER COLUMN role SET DEFAULT 'ROLE_USER';

UPDATE app.users
    SET role = 'ROLE_USER'
    WHERE role IS NULL OR BTRIM(role) = '';
