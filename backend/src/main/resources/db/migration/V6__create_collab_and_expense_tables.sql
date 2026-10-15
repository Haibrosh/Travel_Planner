ALTER TABLE app.trips
DROP CONSTRAINT IF EXISTS chk_trips_status;

ALTER TABLE app.trips
    ADD CONSTRAINT chk_trips_status
        CHECK (status IN ('PLANNING', 'COMPLETED'));


-- 1. TRIP MEMBERS (Quản lý thành viên chuyến đi)
CREATE TABLE IF NOT EXISTS app.trip_members (
    trip_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,

    role        VARCHAR(20) NOT NULL DEFAULT 'COLLABORATOR',
    -- ACTIVE: Đang tham gia | LEFT: Đã rời hoặc bị kick (giữ lại để bảo toàn lịch sử chi tiêu)
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_trip_members
    PRIMARY KEY (trip_id, user_id),

    CONSTRAINT fk_trip_members_trip
    FOREIGN KEY (trip_id)
    REFERENCES app.trips(trip_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_trip_members_user
    FOREIGN KEY (user_id)
    REFERENCES app.users(user_id)
    ON DELETE CASCADE,

    CONSTRAINT chk_trip_members_role
    CHECK (role IN ('OWNER', 'COLLABORATOR')),

    CONSTRAINT chk_trip_members_status
    CHECK (status IN ('ACTIVE', 'LEFT'))
    );

-- Một chuyến đi chỉ có tối đa một OWNER
CREATE UNIQUE INDEX IF NOT EXISTS uq_trip_members_owner
    ON app.trip_members(trip_id)
    WHERE role = 'OWNER';

-- Tìm các chuyến đi mà một user đang tham gia
CREATE INDEX IF NOT EXISTS idx_trip_members_user
    ON app.trip_members(user_id, status);


-- 2. EXPENSES (Các khoản chi thực tế)
CREATE TABLE IF NOT EXISTS app.expenses (
    expense_id      BIGSERIAL PRIMARY KEY,

    trip_id         BIGINT NOT NULL,
    paid_by_user_id BIGINT NOT NULL,

    title           VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    amount          NUMERIC(15, 0) NOT NULL,

    -- chế độ chia tiền: Chia đều (EQUAL) hoặc Tự nhập (CUSTOM)
    split_method    VARCHAR(20) NOT NULL DEFAULT 'EQUAL',

    expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    notes           TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_expenses_trip
    FOREIGN KEY (trip_id)
    REFERENCES app.trips(trip_id)
    ON DELETE CASCADE,

    -- Người trả tiền phải là thành viên của chuyến đi
    CONSTRAINT fk_expenses_payer_member
    FOREIGN KEY (trip_id, paid_by_user_id)
    REFERENCES app.trip_members(trip_id, user_id),

    CONSTRAINT chk_expenses_amount
    CHECK (amount > 0),

    CONSTRAINT chk_expenses_split_method
    CHECK (split_method IN ('EQUAL', 'CUSTOM')),

    -- Hỗ trợ khóa ngoại kép từ bảng expense_splits
    CONSTRAINT uq_expenses_id_trip
    UNIQUE (expense_id, trip_id)
    );

CREATE INDEX IF NOT EXISTS idx_expenses_trip_date
    ON app.expenses(trip_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_payer
    ON app.expenses(trip_id, paid_by_user_id);

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON app.expenses
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at();


-- 3. EXPENSE SPLITS (Chi tiết chia tiền cho từng thành viên)
CREATE TABLE IF NOT EXISTS app.expense_splits (
    split_id        BIGSERIAL PRIMARY KEY,

    expense_id      BIGINT NOT NULL,
    trip_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,

    split_amount    NUMERIC(15, 0) NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_expense_splits_expense_user
    UNIQUE (expense_id, user_id),

    CONSTRAINT fk_expense_splits_expense
    FOREIGN KEY (expense_id, trip_id)
    REFERENCES app.expenses(expense_id, trip_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_expense_splits_member
    FOREIGN KEY (trip_id, user_id)
    REFERENCES app.trip_members(trip_id, user_id),

    CONSTRAINT chk_expense_splits_amount
    CHECK (split_amount > 0)
    );

CREATE INDEX IF NOT EXISTS idx_expense_splits_trip_user
    ON app.expense_splits(trip_id, user_id);


-- 4. SETTLEMENTS (Lịch sử thanh toán / trả nợ giữa 2 thành viên)
CREATE TABLE IF NOT EXISTS app.settlements (
    settlement_id   BIGSERIAL PRIMARY KEY,

    trip_id         BIGINT NOT NULL,
    from_user_id    BIGINT NOT NULL,
    to_user_id      BIGINT NOT NULL,

    amount          NUMERIC(15, 0) NOT NULL,
    settled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_settlements_trip
    FOREIGN KEY (trip_id)
    REFERENCES app.trips(trip_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_settlements_from_member
    FOREIGN KEY (trip_id, from_user_id)
    REFERENCES app.trip_members(trip_id, user_id),

    CONSTRAINT fk_settlements_to_member
    FOREIGN KEY (trip_id, to_user_id)
    REFERENCES app.trip_members(trip_id, user_id),

    CONSTRAINT chk_settlements_amount
    CHECK (amount > 0),

    CONSTRAINT chk_settlements_different_users
    CHECK (from_user_id <> to_user_id)
    );

CREATE INDEX IF NOT EXISTS idx_settlements_trip_date
    ON app.settlements(trip_id, settled_at DESC);

CREATE INDEX IF NOT EXISTS idx_settlements_from_user
    ON app.settlements(trip_id, from_user_id);

CREATE INDEX IF NOT EXISTS idx_settlements_to_user
    ON app.settlements(trip_id, to_user_id);

-- TRIGGER
CREATE OR REPLACE FUNCTION app.add_trip_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
INSERT INTO app.trip_members (trip_id, user_id, role, status)
VALUES (NEW.trip_id, NEW.owner_id, 'OWNER', 'ACTIVE')
    ON CONFLICT (trip_id, user_id)
    DO UPDATE SET role = 'OWNER', status = 'ACTIVE';

RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_add_trip_owner_as_member ON app.trips;
CREATE TRIGGER trg_add_trip_owner_as_member
    AFTER INSERT ON app.trips
    FOR EACH ROW
    EXECUTE FUNCTION app.add_trip_owner_as_member();
