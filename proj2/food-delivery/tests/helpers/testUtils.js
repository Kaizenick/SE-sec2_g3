// tests/helpers/testUtils.js
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";

/** 🧱 Global Test Setup Helpers **/

let mongoServer;
let agent;

/**
 * Starts in-memory MongoDB and sets up a Supertest agent.
 */
export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  agent = request.agent(app); // ✅ persists cookies/session between requests
  return { agent };
}

/**
 * Cleanly close MongoDB + connections after all tests.
 */
export async function closeTestDB() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

/**
 * Registers + logs in a new customer and returns its document + session agent.
 */
export async function registerAndLoginCustomer(agent, overrides = {}) {
  const email = overrides.email || `user_${Date.now()}@test.com`;
  const password = overrides.password || "secret123";
  const address = overrides.address || "123 Main Street, Raleigh, NC";

  await agent
    .post("/api/customer-auth/register")
    .send({
      name: overrides.name || "Test User",
      email,
      password,
      address,
    })
    .expect(201);

  await agent
    .post("/api/customer-auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const customer = await mongoose.model("CustomerAuth").findOne({ email });
  return { customer, email, password };
}

/**
 * Creates a restaurant and returns its object.
 */
export async function createRestaurant(data = {}) {
  const Restaurant = mongoose.model("Restaurant");
  return await Restaurant.create({
    name: data.name || "Testaurant",
    cuisine: data.cuisine || "Italian",
    deliveryFee: data.deliveryFee ?? 2.99,
    address: data.address || "456 Curry Lane, Raleigh, NC",
  });
}

/**
 * ✅ Registers + logs in a new restaurant admin and returns its restaurant info.
 */
export async function registerAndLoginRestaurant(agent, overrides = {}) {
  const email = overrides.email || `rest_${Date.now()}@test.com`;
  const password = overrides.password || "flavor123";

  // Register new restaurant
  await agent
    .post("/api/restaurant-auth/register")
    .send({
      name: overrides.name || "Taste House",
      email,
      password,
      cuisine: overrides.cuisine || "Italian",
      address: overrides.address || "456 Curry Lane, Raleigh, NC",
    })
    .expect(201);

  // Login restaurant admin
  await agent
    .post("/api/restaurant-auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  // Verify session with /me
  const meRes = await agent.get("/api/restaurant-auth/me").expect(200);
  const restaurantId = meRes.body.restaurantId;

  return {
    restaurant: { name: overrides.name || "Taste House", _id: restaurantId },
    email,
    password,
  };
}
