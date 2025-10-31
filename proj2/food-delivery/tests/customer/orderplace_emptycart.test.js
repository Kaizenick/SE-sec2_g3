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

describe("POST /api/orders (Empty Cart)", () => {
  it("should return 400 when cart is empty", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({})
      .expect(400);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/cart is empty/i);
  });
});
