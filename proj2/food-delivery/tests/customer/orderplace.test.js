import request from "supertest";
import app from "../../server.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("POST /api/orders (Customer places order)", () => {
  it("should place an order successfully", async () => {
    //Create a menu item sample first
    const menuItem = {
      name: "Margherita Pizza",
      price: 10.99,
      restaurantId: "demo-restaurant-1",
      description: "Classic pizza with cheese and tomato sauce",
    };
    const menuRes = await request(app)
      .post("/api/menu/add")
      .send(menuItem)
      .expect(201);

    const createdItem = menuRes.body;
    //Place an order with that menu item
    const orderPayload = {
      customerId: "demo-user-1",
      restaurantId: "demo-restaurant-1",
      items: [
        {
          itemId: createdItem._id,
          name: createdItem.name,
          quantity: 2,
          price: createdItem.price,
        },
      ],
      totalAmount: 21.98,
      status: "Pending",
    };
    const res = await request(app)
      .post("/api/orders")
      .send(orderPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/order|placed|success/i);
  });
});
