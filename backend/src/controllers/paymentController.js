const Payment = require("../models/paymentModel");

const list = async (req, res) => {
    try {
        const payments = await Payment.findAll();

        return res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error("List payments error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch payments"
        });
    }
};

module.exports = { list };
