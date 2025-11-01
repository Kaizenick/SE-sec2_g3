import express from "express";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";

const router = express.Router();
//Middleware: ensure restaurant is logged in
function requireRestaurant(req, res, next) {
  if (!req.session.restaurantId)
    return res.status(401).json({ error: "Not logged in as restaurant" });
  next();
}
//Fetch restaurant dashboard data
router.get("/data", requireRestaurant, async (req, res) => {
  try {
    const restaurantId = req.session.restaurantId;

    const menuItems = await MenuItem.find({ restaurantId });
    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });

    res.json({
      ok: true,
      restaurantName: req.session.restaurantName,
      menuItems,
      orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Create new menu item
router.post("/menu", requireRestaurant, async (req, res) => {
  try {
    const { name, description, price, imageUrl } = req.body;
    const restaurantId = req.session.restaurantId;

    const item = await MenuItem.create({
      restaurantId,
      name,
      description,
      price,
      imageUrl,
    });

    res.status(201).json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Edit menu item
router.put("/menu/:id", requireRestaurant, async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.session.restaurantId },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Delete menu item
router.delete("/menu/:id", requireRestaurant, async (req, res) => {
  try {
    const deleted = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.session.restaurantId,
    });
    if (!deleted) return res.status(404).json({ error: "Item not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Update order status
router.put("/order/:id/status", requireRestaurant, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.session.restaurantId },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Fetch all orders for a given restaurant
router.get("/orders", async (req, res) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Update order status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
