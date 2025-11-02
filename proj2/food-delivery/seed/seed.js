import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_delivery_app';

const sample = {
  restaurants: [
    {
      name: 'Spice Route Kitchen',
      cuisine: 'Indian',
      imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=870&q=80',
      rating: 4.7,
      deliveryFee: 2.99,
      etaMins: 35,
      address: '123 Curry Lane, Raleigh, NC',
      menu: [
        {
          name: 'Butter Chicken',
          description: 'Creamy tomato sauce',
          price: 12.99,
          imageUrl: 'https://plus.unsplash.com/premium_photo-1661419883163-bb4df1c10109?auto=format&fit=crop&w=870&q=80',
        },
        {
          name: 'Paneer Tikka',
          description: 'Grilled cottage cheese',
          price: 10.49,
          imageUrl: 'https://images.unsplash.com/photo-1666001120694-3ebe8fd207be?auto=format&fit=crop&w=870&q=80',
        },
        {
          name: 'Garlic Naan',
          description: 'Fresh baked naan with garlic',
          price: 3.49,
          imageUrl: 'https://images.unsplash.com/photo-1697155406014-04dc649b0953?auto=format&fit=crop&w=870&q=80',
        },
      ],
    },
    {
      name: 'Bella Italia',
      cuisine: 'Italian',
      imageUrl: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=870&q=80',
      rating: 4.6,
      deliveryFee: 3.49,
      etaMins: 30,
      address: '789 Olive Street, Cary, NC',
      menu: [
        {
          name: 'Margherita Pizza',
          description: 'Tomato, mozzarella, basil',
          price: 11.99,
          imageUrl: 'https://images.unsplash.com/photo-1601924582971-c9e8eafc0d9b?auto=format&fit=crop&w=870&q=80',
        },
        {
          name: 'Pasta Alfredo',
          description: 'Creamy alfredo sauce',
          price: 13.49,
          imageUrl: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=870&q=80',
        },
        {
          name: 'Tiramisu',
          description: 'Classic dessert',
          price: 6.99,
          imageUrl: 'https://images.unsplash.com/photo-1605478601423-3a4c34c7f9ea?auto=format&fit=crop&w=870&q=80',
        },
      ],
    },
    {
      name: 'Sushi Zen',
      cuisine: 'Japanese',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=870&q=80',
      rating: 4.8,
      deliveryFee: 1.99,
      etaMins: 25,
      address: '101 Sakura Avenue, Durham, NC',
      menu: [
        {
          name: 'California Roll',
          description: 'Crab, avocado, cucumber',
          price: 8.99,
          imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=870&q=80',
        },
        {
          name: 'Salmon Nigiri',
          description: 'Fresh salmon over rice',
          price: 12.49,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=870&q=80',
        },
        {
          name: 'Miso Soup',
          description: 'Traditional soup',
          price: 2.99,
          imageUrl: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=870&q=80',
        },
      ],
    },
  ],
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB for seeding');

  // Clear existing collections
  await Promise.all([
    Restaurant.deleteMany({}),
    MenuItem.deleteMany({}),
    User.deleteMany({}),
  ]);

  // Demo user
  await User.create({
    _id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@example.com',
  });

  // Populate restaurants + menu items
  for (const r of sample.restaurants) {
    const created = await Restaurant.create({
      name: r.name,
      cuisine: r.cuisine,
      imageUrl: r.imageUrl,
      rating: r.rating,
      deliveryFee: r.deliveryFee,
      etaMins: r.etaMins,
      address: r.address, // ✅ added missing field
    });

    for (const m of r.menu) {
      await MenuItem.create({
        restaurantId: created._id,
        name: m.name,
        description: m.description,
        price: m.price,
        imageUrl: m.imageUrl,
      });
    }
  }

  console.log('🌱 Seed complete.');
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

main().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
