# 🍔 BiteCode – Food Delivery Module

The **Food Delivery** component of **BiteCode** is a MERN-based web app that powers the “Order” side of the platform.  
It allows users to browse restaurants, add items to the cart, and place orders — while integrating with the coding challenge system that rewards users for solving problems before their food arrives.

---

## 🚀 Overview

This submodule serves as the **restaurant and order management system** for BiteCode.  
It provides APIs and a Bootstrap-powered frontend for core food delivery functionality, including menu browsing, cart management, and checkout.

When connected with the Judge0 frontend, the order experience becomes interactive — users can solve coding problems to **unlock discounts up to $20** on their current order.

---

## ✨ Features

- 🍴 Browse and search restaurants  
- 📋 View menus with item details and prices  
- 🛒 Add, update, or remove items from the cart  
- 💵 Checkout and create orders  
- 🧾 View past orders and receipts  
- 🧠 Optional integration with Judge0 for coding-based rewards  
- 🧹 Built-in seeding for sample data (restaurants, menus)

> Authentication is intentionally simplified for the prototype — a fixed demo user (`demo-user-1`) is used.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | HTML, Bootstrap, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Environment | dotenv |
| Integration | Judge0 API (optional for coding challenges) |

---

## 🧰 Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or MongoDB Atlas URI

---

## 🧑‍💻 Setup Instructions

1. **Open the project** in VS Code or terminal.
2. Copy `.env.sample` → `.env` and update the database connection if needed.  
   Default:  
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/food_delivery_app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Seed the database with sample data:
   ```bash
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Visit the app in your browser:  
   👉 http://localhost:3000

---

## 📁 Project Structure

```
food-delivery/
├── models/              # Mongoose models (Restaurant, MenuItem, Order)
├── public/              # Static frontend (HTML + Bootstrap)
│   ├── index.html
│   ├── restaurant.html
│   ├── cart.html
│   ├── orders.html
│   └── js/app.js
├── routes/              # Express routes (API endpoints)
├── seed/                # Seed scripts for sample data
├── server.js            # Express server entry point
├── package.json         # Dependencies & scripts
├── .env.sample          # Environment variable template
└── README.md
```

---

## 💡 Notes

- MongoDB must be running locally or accessible through the connection URI.  
- The frontend and backend run under the same origin — no CORS config needed.  
- Image placeholders are sourced from Unsplash; you can replace them with local assets.  
- For gamified functionality (discounts via coding), integrate with the **Judge0 frontend**.

---

## 🧾 License

This submodule is part of the **[BiteCode Platform](../README.md)**  
and is licensed under the **[MIT License](../LICENSE)**.

---

✅ *Order. Code. Earn. Every bite makes you smarter.*
