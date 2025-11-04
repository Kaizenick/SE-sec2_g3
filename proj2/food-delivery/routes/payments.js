// routes/payments.js
import express from "express";
import Cart from "../models/CartItem.js";
import Order from "../models/Order.js";

const router = express.Router();

/**
 * POST /api/payments/mock-checkout
 * Simulates a successful payment and creates a paid order
 */
router.post("/mock-checkout", async (req, res) => {
  try {
    const customerId = req.session.customerId;
    if (!customerId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    //Fetch the user's cart and populate both menuItem and restaurant
    const items = await Cart.find({ userId: customerId })
      .populate({
        path: "menuItemId",
        populate: { path: "restaurantId", select: "name deliveryFee etaMins" }
      });

    if (!items.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + i.menuItemId.price * i.quantity, 0);
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;

    // Create an order: "placed" + "paid"
    const order = await Order.create({
      userId: customerId,
      restaurantId: items[0].menuItemId.restaurantId._id, // ensure it's the ID
      items: items.map(i => ({
        menuItemId: i.menuItemId._id,
        name: i.menuItemId.name,
        price: i.menuItemId.price,
        quantity: i.quantity
      })),
      subtotal,
      deliveryFee,
      total,
      status: "placed",         // valid enum
      paymentStatus: "paid"     // now tracked separately
    });

    //Clear the cart after successful order
    await Cart.deleteMany({ userId: customerId });

    return res.json({
      ok: true,
      message: "Payment successful! Your order has been placed.",
      orderId: order._id
    });
  } catch (err) {
    console.error("Payment error:", err);
    return res.status(500).json({ error: err.message || "Payment failed" });
  }
});

export default router;
