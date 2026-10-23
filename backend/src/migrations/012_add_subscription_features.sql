ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Plans created before feature toggles existed keep every feature, so current
-- subscribers don't lose anything.
UPDATE subscriptions
SET features = '{"unlimited_habits": true, "custom_icons": true, "advanced_progress": true}'::jsonb
WHERE features = '{}'::jsonb;
