CREATE TABLE IF NOT EXISTS habits (
    id BIGSERIAL PRIMARY KEY,

    client_user_id VARCHAR(100) NOT NULL,

    title VARCHAR(200) NOT NULL,

    frequency VARCHAR(50) NOT NULL,

    target_days JSONB NOT NULL DEFAULT '[]'::jsonb,

    reminder_time VARCHAR(50) NOT NULL DEFAULT '',

    goal_details TEXT NOT NULL DEFAULT '',

    icon VARCHAR(50) NOT NULL DEFAULT 'runner',

    streak INTEGER NOT NULL DEFAULT 0,

    completed_dates JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_habits_client_user_id ON habits(client_user_id);