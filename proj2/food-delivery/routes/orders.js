import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import CartItem from "../models/CartItem.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

// GET /api/orders → fetch all orders for the logged-in customer
router.get("/", async (req, res) => {
  try {
    const customerId = req.session.customerId;
    if (!customerId) return res.status(401).json({ message: "Not logged in" });

    const orders = await Order.find({ userId: customerId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders → place a new order (supports subset via { itemIds })
router.post("/", async (req, res) => {
  try {
    const customerId = req.session.customerId;
    if (!customerId) return res.status(401).json({ error: "Customer not logged in" });

    // Optional subset: { itemIds: [...] }
    let itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : null;
    if (itemIds && itemIds.length) {
      // cast to ObjectId for reliable $in match
      itemIds = itemIds
        .filter(Boolean)
        .map(id => {
          try { return new mongoose.Types.ObjectId(id); }
          catch { return null; }
        })
        .filter(Boolean);
      if (!itemIds.length) {
        return res.status(400).json({ error: "No matching items found to checkout" });
      }
    }

    // Build query: all items vs only selected ones
    const cartQuery = itemIds?.length
      ? { userId: customerId, _id: { $in: itemIds } }
      : { userId: customerId };

    const cartItems = await CartItem.find(cartQuery).lean();
    if (!cartItems.length) {
      return res.status(400).json({
        error: itemIds?.length ? "No matching items found to checkout" : "Cart is empty",
      });
    }

    // Authoritative menu data (names, prices, and restaurant ownership)
    const menuIds = cartItems.map(ci => ci.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuIds } }).lean();
    const menuMap = new Map(menuItems.map(m => [String(m._id), m]));

    // Derive restaurantIds from MenuItem docs (robust even if CartItem.restaurantId is missing)
    const restIdSet = new Set(
      cartItems.map(ci => {
        const mi = menuMap.get(String(ci.menuItemId));
        return mi?.restaurantId ? String(mi.restaurantId) : undefined;
      }).filter(Boolean)
    );

    if (!restIdSet.size) {
      return res.status(400).json({ error: "Unable to determine restaurant for selected items" });
    }
    if (restIdSet.size > 1) {
      return res.status(400).json({ error: "Selected items must be from a single restaurant" });
    }

    const restaurantId = [...restIdSet][0];
    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    // Build order lines and compute subtotal from authoritative menu data
    let subtotal = 0;
    const items = cartItems.map(ci => {
      const mi = menuMap.get(String(ci.menuItemId));
      const price = Number(mi?.price ?? 0);
      const qty = Number(ci.quantity ?? 1);
      subtotal += price * qty;
      return {
        menuItemId: ci.menuItemId,
        name: mi?.name || "Item",
        price,
        quantity: qty,
      };
    });

    const deliveryFee = Number(restaurant.deliveryFee ?? 0);
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      userId: customerId,
      restaurantId,
      items,
      subtotal,
      deliveryFee,
      total,
      status: "placed",
      paymentStatus: "paid"
    });

    // Remove only the checked-out items when subset was provided; otherwise clear entire cart
    if (itemIds?.length) {
      await CartItem.deleteMany({ userId: customerId, _id: { $in: itemIds } });
    } else {
      await CartItem.deleteMany({ userId: customerId });
    }

    return res.status(201).json(order);
  } catch (err) {
    // Optional: log diagnostics while developing
    // console.error("Order error:", err);
    res.status(500).json({ error: err.message });
  }
});
// DELETE /api/orders -> delete ALL orders for current customer
router.delete("/", async (req, res) => {
  try {
    const customerId = req.session.customerId;
    if (!customerId) return res.status(401).json({ error: "Not logged in" });

    await Order.deleteMany({ userId: customerId });
    return res.json({ ok: true, message: "Order history cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id -> delete ONE order (owned by current customer)
router.delete("/:id", async (req, res) => {
  try {
    const customerId = req.session.customerId;
    if (!customerId) return res.status(401).json({ error: "Not logged in" });

    const { id } = req.params;
    const result = await Order.deleteOne({ _id: id, userId: customerId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json({ ok: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
