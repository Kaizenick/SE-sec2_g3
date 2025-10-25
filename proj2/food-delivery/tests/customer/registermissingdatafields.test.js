import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
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

describe("POST /api/customer-auth/register (missing fields)", () => {
  it("should return 400 if required fields are missing", async () => {
    const incompleteCustomer = {
      name: "Sam",
      // email missing
      password: "test123",
      address: "456 Main Road",
    };

    const res = await request(app)
      .post("/api/customer-auth/register")
      .send(incompleteCustomer);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/missing|required/i);
  });
});
