ALTER TABLE users ADD COLUMN IF NOT EXISTS client_user_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_users_client_user_id ON users(client_user_id);