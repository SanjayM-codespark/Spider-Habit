const HelpPage = require("../models/helpPageModel");

const list = async (req, res) => {
    try {
        const pages = await HelpPage.findAll();

        return res.status(200).json({
            success: true,
            data: pages
        });
    } catch (error) {
        console.error("List help pages error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch help pages"
        });
    }
};

const getOne = async (req, res) => {
    try {
        const page = await HelpPage.findBySlug(req.params.slug);

        // A page that has never been edited simply returns null so the admin
        // editor can start from an empty form.
        return res.status(200).json({
            success: true,
            data: page
        });
    } catch (error) {
        console.error("Get help page error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch help page"
        });
    }
};

const save = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (title === undefined && content === undefined) {
            return res.status(400).json({
                success: false,
                message: "Nothing to save"
            });
        }

        const page = await HelpPage.upsert(req.params.slug, {
            title,
            content
        });

        return res.status(200).json({
            success: true,
            message: "Help page saved successfully",
            data: page
        });
    } catch (error) {
        console.error("Save help page error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to save help page"
        });
    }
};

module.exports = {
    list,
    getOne,
    save
};