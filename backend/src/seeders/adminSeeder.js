const bcrypt = require("bcryptjs");
const pool = require("../config/database");

async function seedAdmin() {
    try {
        const name = "Spider Habit Admin";
        const email = "admin@spiderhabit.com";
        const password = "Admin@123";

        // Check if admin already exists
        const existingAdmin = await pool.query(
            `SELECT id FROM admins WHERE email = $1`,
            [email]
        );

        if (existingAdmin.rows.length > 0) {
            console.log("Admin already exists.");
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create admin
        const result = await pool.query(
            `INSERT INTO admins
                (name, email, password_hash, role)
             VALUES
                ($1, $2, $3, $4)
             RETURNING id, name, email, role`,
            [name, email, passwordHash, "admin"]
        );

        console.log("Admin created successfully:");
        console.log(result.rows[0]);

    } catch (error) {
        console.error("Failed to create admin:");
        console.error(error);
    } finally {
        await pool.end();
    }
}

seedAdmin();