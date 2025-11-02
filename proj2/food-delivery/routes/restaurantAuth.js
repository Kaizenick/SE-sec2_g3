import express from 'express';
import bcrypt from 'bcrypt';
import RestaurantAdmin from '../models/RestaurantAdmin.js';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();
//Register new restaurant + admin
router.post('/register', async (req, res) => {
  try {
    const { name, cuisine, email, password, address } = req.body;
    if (!name || !cuisine || !email || !password || !address)
      return res.status(400).json({ error: 'name, cuisine, email, password and address required' });

    const exists = await RestaurantAdmin.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const restaurant = await Restaurant.create({
      name,
      cuisine,
      rating: 4.5,
      deliveryFee: 0,
      etaMins: 30,
      address
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await RestaurantAdmin.create({ email, passwordHash, restaurantId: restaurant._id });

    req.session.adminId = admin._id.toString();
    req.session.restaurantId = restaurant._id.toString();
    req.session.restaurantName = restaurant.name;

    res.status(201).json({
      ok: true,
      message: `Welcome ${restaurant.name}! Registration successful.`,
      restaurant: { id: restaurant._id, name: restaurant.name, cuisine },
      admin: { email }
    });
  } catch (err) {
    console.error("❌ Restaurant Registration Error:", err);
    res.status(500).json({ error: err.message });
  }
});
//Login existing restaurant admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });

    const admin = await RestaurantAdmin.findOne({ email }).populate('restaurantId');
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.adminId = admin._id.toString();
    req.session.restaurantId = admin.restaurantId._id.toString();
    req.session.restaurantName = admin.restaurantId.name;
    res.json({
      ok: true,
      message: `Welcome ${admin.restaurantId.name}!`,
      restaurant: { name: admin.restaurantId.name, cuisine: admin.restaurantId.cuisine }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Check session
router.get('/me', (req, res) => {
  if (!req.session.adminId)
    return res.status(401).json({ error: 'Not logged in' });
  res.json({
    ok: true,
    message: `Welcome ${req.session.restaurantName}!`,
    restaurantId: req.session.restaurantId
  });
});
//Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true, message: 'Logged out' });
  });
});

export default router;
