-- =============================================================================
-- V9: Bổ sung cột ghi chú (note) cho bảng app.itinerary_items
-- Phục vụ tính năng ghi chú tham quan trên từng thẻ địa điểm trong lịch trình
-- =============================================================================

ALTER TABLE app.itinerary_items
    ADD COLUMN IF NOT EXISTS note TEXT;
