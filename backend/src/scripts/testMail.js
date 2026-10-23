// Check the SMTP settings in .env without going through the app:
//   node src/scripts/testMail.js you@example.com
require("dotenv").config();
const nodemailer = require("nodemailer");

const to = process.argv[2];

const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((key) => !process.env[key]);
if (missing.length) {
    console.error(`Missing in .env: ${missing.join(", ")}`);
    process.exit(1);
}

const port = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

(async () => {
    try {
        await transporter.verify();
        console.log(`SMTP connection OK (${process.env.SMTP_HOST}:${port})`);

        if (to) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to,
                subject: "Spider Habit SMTP test",
                text: "If you can read this, SMTP is working."
            });
            console.log(`Test email sent to ${to}`);
        } else {
            console.log("Pass an email address to also send a test message.");
        }
    } catch (error) {
        console.error("SMTP failed:", error.message);
        process.exit(1);
    }
})();
