import "./../setup.js";
import request from "supertest";
import app from "../../server.js";
import CustomerAuth from "../../models/CustomerAuth.js";

beforeEach(async () => {
  await CustomerAuth.deleteMany({});
});
test("POST /api/customer-auth/register → should register a new customer", async () => {
  const res = await request(app)
    .post("/api/customer-auth/register")
    .send({
      name: "John Doe",
      email: "john@example.com",
      password: "secret123",
      favoriteDishes: ["Pizza", "Burger"],
      dietRequirements: "Vegan",
      address: "123 Main Street",
    });
  expect(res.statusCode).toBe(201);
  expect(res.body.ok).toBe(true);
  expect(res.body.customer.email).toBe("john@example.com");
});
