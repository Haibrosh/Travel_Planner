CREATE TABLE IF NOT EXISTS app.users (
    user_id         BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    username        VARCHAR(100) NOT NULL,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON app.users
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.trips (
    trip_id         BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL,
    destination_id  BIGINT NOT NULL,

    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,

    status          VARCHAR(50) NOT NULL DEFAULT 'PLANNING',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_trips_owner FOREIGN KEY (owner_id) REFERENCES app.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_trips_destination FOREIGN KEY (destination_id) REFERENCES analytics.destinations(destination_id),
    CONSTRAINT chk_trips_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_trips_status CHECK (status IN ('PLANNED', 'COMPLETED'))
    );

CREATE TRIGGER trg_trips_updated_at
    BEFORE UPDATE ON app.trips
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();