-- Habit icons can now be a user-uploaded image instead of one of the built-in
-- emoji slugs.
--
-- `icon` keeps holding the built-in slug ('runner', 'book', ...) and stays
-- NOT NULL so existing rows and clients keep working. `icon_image_url` holds
-- the public path of the uploaded file (e.g. '/uploads/habit-icons/abc.png')
-- and takes precedence when it is non-empty; an empty string means "no custom
-- image, fall back to the emoji".
ALTER TABLE habits
    ADD COLUMN IF NOT EXISTS icon_image_url TEXT NOT NULL DEFAULT '';