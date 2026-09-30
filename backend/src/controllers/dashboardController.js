const Dashboard = require("../models/dashboardModel");

const getOverview = async (req, res) => {
    try {
        const days = Number(req.query.days) || 7;

        const data = await Dashboard.getOverview(days);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Dashboard overview error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch dashboard overview"
        });
    }
};

module.exports = {
    getOverview
};