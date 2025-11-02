import express from "express";
import CartItem from "../models/CartItem.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

/* ======================================================
   GET /api/orders  →  list all orders for logged-in user
   ====================================================== */
router.get("/", async (req, res) => {
  try {
    console.log("Session:", req.session);
    const userId = req.session.customerId || req.session.userId; // ✅ accept either key

    if (!userId) return res.status(401).json({ message: "Not logged in" });

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    console.log("Found orders:", orders.length);
    res.json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   POST /api/orders  →  place a new order from cart
   ====================================================== */
router.post("/", async (req, res) => {
  console.log("🔥 inside POST /api/orders handler");
  try {
    const customerId = req.session.customerId || req.session.userId; // ✅ unified session id
    if (!customerId) {
      return res.status(401).json({ error: "Customer not logged in" });
    }

    // ✅ use the same key everywhere
    const cartItems = await CartItem.find({ userId: customerId }).lean();
    console.log("🛒 Cart items found:", cartItems.length);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Ensure single-restaurant cart
    const restaurantSet = new Set(cartItems.map((ci) => String(ci.restaurantId)));
    if (restaurantSet.size > 1) {
      return res
        .status(400)
        .json({ error: "Cart must contain items from a single restaurant" });
    }

    const restaurantId = cartItems[0].restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Build order items from current menu prices
    const menuIds = cartItems.map((ci) => ci.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuIds } });
    const menuMap = new Map(menuItems.map((m) => [String(m._id), m]));

    let subtotal = 0;
    const items = cartItems.map((ci) => {
      const mi = menuMap.get(String(ci.menuItemId));
      const price = mi?.price ?? 0;
      const qty = ci.quantity;
      subtotal += price * qty;
      return {
        menuItemId: ci.menuItemId,
        name: mi?.name || "Item",
        price,
        quantity: qty,
      };
    });

    const deliveryFee = restaurant.deliveryFee ?? 0;
    const total = subtotal + deliveryFee;

    // ✅ store correct userId
    const order = await Order.create({
      userId: customerId,
      restaurantId,
      items,
      subtotal,
      deliveryFee,
      total,
      status: "placed",
    });

    // ✅ clear the same user's cart
    await CartItem.deleteMany({ userId: customerId });

    console.log("✅ Order created:", order._id.toString());
    res.status(201).json(order);
  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
