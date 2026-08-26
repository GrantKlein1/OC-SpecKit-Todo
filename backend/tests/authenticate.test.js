/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

describe("Feature 1 — authenticate middleware", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const user = await registerUser();

      const response = await request(app)
        .post("/todo/logout")
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Signed out successfully.");
    });

    it("Expired or invalid session token", async () => {
      const user = await registerUser();

      await db.session.update(
        { expirationDate: new Date(Date.now() - 1000) },
        { where: { token: user.token } }
      );

      const expiredResponse = await request(app)
        .post("/todo/logout")
        .set(user.authHeader);

      expect(expiredResponse.status).toBe(401);
      expect(expiredResponse.body.message).toBe("Unauthorized! Invalid or expired token.");

      const user2 = await registerUser({
        email: "other@example.com",
        username: "otheruser",
      });

      await db.session.update({ token: "" }, { where: { token: user2.token } });

      const revokedResponse = await request(app)
        .post("/todo/logout")
        .set(user2.authHeader);

      expect(revokedResponse.status).toBe(401);
      expect(revokedResponse.body.message).toBe("Unauthorized! Invalid or expired token.");
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .get("/todo/lists")
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const response = await request(app).post("/todo/logout");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized! No token provided.");
    });
  });
});
