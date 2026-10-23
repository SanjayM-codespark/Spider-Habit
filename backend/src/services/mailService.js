const nodemailer = require("nodemailer");

/**
 * SMTP settings come from the environment:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE ("true" for port 465),
 *   SMTP_USER, SMTP_PASS, SMTP_FROM (defaults to SMTP_USER)
 */
const isConfigured = () => !!process.env.SMTP_HOST;

let transporter = null;
const getTransporter = () => {
    if (!transporter) {
        const port = Number(process.env.SMTP_PORT) || 587;
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: String(process.env.SMTP_SECURE).toLowerCase() === "true" || port === 465,
            auth: process.env.SMTP_USER
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined
        });
    }
    return transporter;
};

/**
 * Send an email. When SMTP is not configured outside production, the message
 * is printed to the server console instead so the flow can be tested locally.
 */
const sendMail = async ({ to, subject, text, html }) => {
    if (!isConfigured()) {
        if (process.env.NODE_ENV === "production") {
            const error = new Error("Email service is not configured");
            error.status = 503;
            throw error;
        }
        console.warn(`[mail] SMTP not configured - email to ${to} not sent.\n${subject}\n${text}`);
        return { delivered: false };
    }

    await getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html
    });
    return { delivered: true };
};

module.exports = { sendMail, isConfigured };
