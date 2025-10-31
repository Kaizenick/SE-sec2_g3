import request from "supertest";
import app from "../../server.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import CartItem from "../../models/CartItem.js"
import Restaurant from "../../models/Restaurant.js";

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
    const restaurantId = new mongoose.Types.ObjectId();
    const customerId = "demo-user-1";
     const restaurant = await Restaurant.create({
      _id: restaurantId,
      name: "Testaurant",
      cuisine: "Italian",
      deliveryFee: 2.99,
    });
    //Create a menu item sample first
    const menuItem = {
      name: "Margherita Pizza",
      price: 10.99,
      restaurantId,
      description: "Classic pizza with cheese and tomato sauce",
    };
    const menuRes = await request(app)
      .post("/api/menu")
      .send(menuItem)
      .expect(201);

    const createdItem = menuRes.body.item;
    expect(createdItem).toHaveProperty("_id");

    
    //Add the menu item to the user's cart
    await CartItem.create({
      userId: customerId,
      restaurantId,
      menuItemId: createdItem._id,
      quantity: 2,
    });

    //Place an order from that cart
    const res = await request(app)
      .post("/api/orders")
      .send({}) // no need to send payload since cart is used
      .expect(201);

    //Validate response
    expect(res.body).toHaveProperty("_id");
    expect(res.body.status).toBe("placed");
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.total).toBeDefined();
  });
});
