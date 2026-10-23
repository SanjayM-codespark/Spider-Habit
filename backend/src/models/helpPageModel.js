const pool = require("../config/database");

const HelpPage = {
    async findAll() {
        const result = await pool.query(
            `SELECT slug, title, updated_at
             FROM help_pages
             ORDER BY slug`
        );

        return result.rows;
    },

    async findBySlug(slug) {
        const result = await pool.query(
            `SELECT slug, title, content, updated_at
             FROM help_pages
             WHERE slug = $1
             LIMIT 1`,
            [slug]
        );

        return result.rows[0] || null;
    },

    /** Create a page, deriving a unique slug from its title. */
    async create({ title, content }) {
        const base =
            String(title)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") || "page";

        let slug = base;
        for (let n = 2; await HelpPage.findBySlug(slug); n += 1) {
            slug = `${base}_${n}`;
        }

        return HelpPage.upsert(slug, { title, content });
    },

    async remove(slug) {
        const result = await pool.query(
            `DELETE FROM help_pages WHERE slug = $1 RETURNING slug`,
            [slug]
        );

        return result.rows[0] || null;
    },

    async upsert(slug, { title, content }) {
        const result = await pool.query(
            `INSERT INTO help_pages (slug, title, content, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (slug)
             DO UPDATE SET title = EXCLUDED.title,
                           content = EXCLUDED.content,
                           updated_at = CURRENT_TIMESTAMP
             RETURNING slug, title, content, updated_at`,
            [
                slug,
                title !== undefined ? String(title) : "",
                content !== undefined ? String(content) : ""
            ]
        );

        return result.rows[0];
    }
};

module.exports = HelpPage;