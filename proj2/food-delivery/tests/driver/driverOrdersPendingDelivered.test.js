import mongoose from "mongoose";
import {
  setupTestDB,
  closeTestDB,
  createRestaurant,
  registerAndLoginCustomer,
} from "../helpers/testUtils.js";

let agent, Order, driverId;
const hasChallenge = () => mongoose.modelNames().includes("ChallengeSession");

beforeAll(async () => {
  const setup = await setupTestDB();
  agent = setup.agent;
  Order = mongoose.model("Order");

  await agent
    .post("/api/driver/register")
    .send({
      fullName: "Pending Driver",
      address: "3 Pending Ln",
      vehicleType: "Bike",
      vehicleNumber: "PD-3",
      licenseNumber: "LIC-PD3",
      email: "pending@test.com",
      password: "secret123",
    })
    .expect(200);

  await agent
    .post("/api/driver/login")
    .send({
      email: "pending@test.com",
      password: "secret123",
    })
    .expect(200);

  const me = await agent.get("/api/driver/me").expect(200);
  driverId = me.body.driverId;

  await agent.patch("/api/driver/active").send({ isActive: true }).expect(200);
});

afterAll(async () => {
  await closeTestDB();
});

describe("Pending & Delivered flow", () => {
  test("pending includes assigned orders with allowed statuses", async () => {
    const restaurant = await createRestaurant();
    const { customer } = await registerAndLoginCustomer(agent, {
      email: `cust_${Date.now()}@t.com`,
    });

    const o1 = await Order.create({
      restaurantId: restaurant._id,
      userId: customer._id,
      status: "preparing",
      driverId,
      deliveryPayment: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const o2 = await Order.create({
      restaurantId: restaurant._id,
      userId: customer._id,
      status: "ready_for_pickup",
      driverId,
      deliveryPayment: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const list = await agent.get("/api/driver/orders/pending").expect(200);
    const ids = list.body.map((o) => String(o._id));
    expect(ids).toEqual(
      expect.arrayContaining([String(o1._id), String(o2._id)])
    );
  });

  test("cannot mark delivered unless status is out_for_delivery; succeeds after change", async () => {
    const restaurant = await createRestaurant({ name: "DeliverR" });
    const { customer } = await registerAndLoginCustomer(agent, {
      email: `cust2_${Date.now()}@t.com`,
    });

    const order = await Order.create({
      restaurantId: restaurant._id,
      userId: customer._id,
      status: "ready_for_pickup",
      driverId,
      deliveryPayment: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Early attempt blocked
    const early = await agent
      .post(`/api/driver/orders/delivered/${order._id}`)
      .expect(400);
    expect((early.body.error || "").toLowerCase()).toMatch(/out for delivery/);

    // Restaurant marks OFD
    await Order.findByIdAndUpdate(order._id, { status: "out_for_delivery" });

    // Seed an ACTIVE challenge session with all required fields, if model exists
    if (hasChallenge()) {
      const ChallengeSession = mongoose.model("ChallengeSession");
      // pick a safe difficulty from enum if present, else "EASY"
      const diffPath = ChallengeSession.schema.path("difficulty");
      const difficulty =
        (diffPath && diffPath.enumValues && diffPath.enumValues[0]) || "EASY";

      await ChallengeSession.create({
        orderId: order._id,
        userId: customer._id,                 // REQUIRED by your schema
        status: "ACTIVE",
        difficulty,                           // REQUIRED
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // REQUIRED (future)
      });
    }

    // Now deliver
    const ok = await agent
      .post(`/api/driver/orders/delivered/${order._id}`)
      .expect(200);
    expect((ok.body.message || "").toLowerCase()).toMatch(/delivered/);

    const done = await Order.findById(order._id).lean();
    expect(done.status).toBe("delivered");

    // Verify challenge sessions expired (if model exists)
    if (hasChallenge()) {
      const ChallengeSession = mongoose.model("ChallengeSession");
      const sessions = await ChallengeSession.find({ orderId: order._id }).lean();
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions.every((s) => s.status === "EXPIRED")).toBe(true);
      // expiresAt should be set by the route on expiry
      expect(sessions.every((s) => !!s.expiresAt)).toBe(true);
    }
  });
});
