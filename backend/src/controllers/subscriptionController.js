const crypto = require("crypto");
const subscriptionModel = require("../models/subscriptionModel");
const User = require("../models/userModel");
const Settings = require("../models/settingsModel");
const Payment = require("../models/paymentModel");

/**
 * Read the Razorpay test/production keys saved under Payment Settings in the
 * admin panel (app_settings.razorpay_key / app_settings.razorpay_secret).
 */
async function getRazorpayCredentials() {
    const settings = await Settings.getAll();
    const keyId = String(settings.razorpay_key || "").trim();
    const keySecret = String(settings.razorpay_secret || "").trim();

    if (!keyId || !keySecret) {
        const error = new Error(
            "Razorpay is not configured. Add your Key ID and Key Secret under Payment Settings in the admin panel."
        );
        error.status = 503;
        throw error;
    }

    return { keyId, keySecret };
}

const normalizePayload = (body) => {
    const { name, duration, description, platform, pricing } = body;

    if (!name || !duration || !description || !platform) {
        return {
            error: "Name, duration, description and platform are required"
        };
    }

    if (
        !Array.isArray(pricing) ||
        pricing.length === 0 ||
        pricing.some(
            (price) =>
                !price.country ||
                !price.currency ||
                price.amount == null ||
                price.amount < 0
        )
    ) {
        return {
            error: "Pricing must include a valid country, currency and amount for each entry"
        };
    }

    return {
        data: {
            name: String(name),
            duration: String(duration),
            description: String(description),
            platform: String(platform).toLowerCase(),
            pricing: pricing.map((price) => ({
                country: String(price.country).toUpperCase(),
                currency: String(price.currency).toUpperCase(),
                amount: Number(price.amount)
            }))
        }
    };
};

const create = async (req, res) => {
    try {
        const { error, data } = normalizePayload(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const subscription = await subscriptionModel.create({
            ...data,
            createdBy: req.admin.id
        });

        return res.status(201).json({
            success: true,
            message: "Subscription created successfully",
            data: subscription
        });
    } catch (error) {
        console.error("Create subscription error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create subscription"
        });
    }
};

const getOne = async (req, res) => {
    try {
        const subscription = await subscriptionModel.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error("Get subscription error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch subscription"
        });
    }
};

const update = async (req, res) => {
    try {
        const { error, data } = normalizePayload(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const subscription = await subscriptionModel.update(req.params.id, data);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subscription updated successfully",
            data: subscription
        });
    } catch (error) {
        console.error("Update subscription error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update subscription"
        });
    }
};

const remove = async (req, res) => {
    try {
        const deleted = await subscriptionModel.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subscription deleted successfully"
        });
    } catch (error) {
        console.error("Delete subscription error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete subscription"
        });
    }
};

const list = async (req, res) => {
    try {
        const subscriptions = await subscriptionModel.findAll();

        return res.status(200).json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        console.error("List subscriptions error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch subscriptions"
        });
    }
};

const listActive = async (req, res) => {
    try {
        const country = req.query.country
            ? String(req.query.country).toUpperCase()
            : null;

        const subscriptions = await subscriptionModel.findActive(country);

        return res.status(200).json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        console.error("List active subscriptions error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch subscriptions"
        });
    }
};

/**
 * Step 1 of the Razorpay checkout — create a payment order against the
 * Razorpay Orders API using the admin-configured test/production keys.
 *
 * Returns the order id plus the public Key ID the mobile app needs to open
 * the Razorpay payment sheet. The mobile app then runs the checkout and
 * sends the payment + signature back to verifyPayment().
 */
const createOrder = async (req, res) => {
    try {
        const { subscriptionId, country, currency, amount } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                message: "subscriptionId is required"
            });
        }

        const subscription = await subscriptionModel.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription plan not found"
            });
        }

        const priceAmount = Number(amount);
        if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid amount is required"
            });
        }

        const { keyId, keySecret } = await getRazorpayCredentials();
        const orderCurrency = currency ? String(currency).toUpperCase() : "INR";

        // Razorpay accepts amounts in the smallest currency unit (paise/cents).
        const amountInSmallest = Math.round(priceAmount * 100);

        const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " +
                    Buffer.from(`${keyId}:${keySecret}`).toString("base64")
            },
            body: JSON.stringify({
                amount: amountInSmallest,
                currency: orderCurrency,
                receipt: `rcpt_${subscription.id}_${Date.now()}`,
                notes: {
                    subscriptionId: String(subscription.id),
                    planName: String(subscription.name),
                    country: country ? String(country) : ""
                }
            })
        });

        const order = await razorpayResponse.json();

        if (!razorpayResponse.ok) {
            console.error("Razorpay create order failed:", order);
            const message =
                order?.error?.description || "Failed to create payment order";
            return res.status(502).json({
                success: false,
                message
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment order created",
            data: {
                orderId: order.id,
                amount: priceAmount,
                amountInSmallest,
                currency: orderCurrency,
                keyId,
                subscriptionId: subscription.id,
                planName: subscription.name
            }
        });
    } catch (error) {
        console.error("Create payment order error:", error);
        const status = Number(error.status) || 500;
        return res.status(status).json({
            success: false,
            message: error.message || "Failed to create payment order"
        });
    }
};

/**
 * Step 3 of the Razorpay checkout — verify the payment signature returned by
 * the SDK. The signature is HMAC-SHA256("{order_id}|{payment_id}") computed
 * with the Razorpay key secret, and can only be reproduced by the backend.
 *
 * A verified signature proves the payment succeeded before the app registers
 * the user / unlocks the premium plan.
 */
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            email,
            subscriptionId,
            amount,
            currency
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message:
                    "razorpayOrderId, razorpayPaymentId and razorpaySignature are required"
            });
        }

        const { keySecret } = await getRazorpayCredentials();

        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed. Signature mismatch."
            });
        }

        // Persist the successful payment so the admin can report real revenue.
        try {
            await Payment.create({
                orderId: razorpayOrderId,
                paymentId: razorpayPaymentId,
                amount: Number(amount) || 0,
                currency,
                email,
                subscriptionId
            });
        } catch (recordError) {
            // Duplicate/record issues should not block the success response.
            console.error("Record payment error:", recordError);
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            data: {
                orderId: razorpayOrderId,
                paymentId: razorpayPaymentId
            }
        });
    } catch (error) {
        console.error("Verify payment error:", error);
        const status = Number(error.status) || 500;
        return res.status(status).json({
            success: false,
            message: error.message || "Failed to verify payment"
        });
    }
};

/**
 * Fetch the current subscription of a subscribed user. The mobile app has no
 * auth token, so the user is identified by their registered email (only the
 * logged-in device knows it).
 */
const current = async (req, res) => {
    try {
        const email = req.query.email
            ? String(req.query.email).trim().toLowerCase()
            : null;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "email is required"
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            is_subscribed: user.is_subscribed,
            subscription_id: user.subscription_id,
            created_at: user.created_at
        };

        if (!user.is_subscribed || !user.subscription_id) {
            return res.status(200).json({
                success: true,
                data: {
                    isSubscribed: false,
                    user: userData,
                    subscription: null
                }
            });
        }

        const subscription = await subscriptionModel.findById(
            user.subscription_id
        );

        return res.status(200).json({
            success: true,
            data: {
                isSubscribed: true,
                user: userData,
                subscription: subscription || null
            }
        });
    } catch (error) {
        console.error("Get current subscription error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch current subscription"
        });
    }
};

module.exports = {
    create,
    getOne,
    update,
    remove,
    list,
    listActive,
    createOrder,
    verifyPayment,
    current
};