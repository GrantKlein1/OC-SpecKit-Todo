/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const validRegistration = {
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "password123",
};

describe("Feature 1 — Auth API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const response = await request(app).post("/todo/register").send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
        token: expect.any(String),
      });

      const userRecord = await db.user.unscoped().findByPk(response.body.userId);
      expect(userRecord).not.toBeNull();
      expect(await bcrypt.compare("password123", userRecord.password)).toBe(true);

      const sessionCount = await db.session.count({
        where: { userId: response.body.userId, token: response.body.token },
      });
      expect(sessionCount).toBe(1);
    });

    it("User submits registration with missing email", async () => {
      const response = await request(app).post("/todo/register").send({
        fName: "Jane",
        lName: "Doe",
        username: "jdoe",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is required.");
    });

    it("User submits registration with password too short", async () => {
      const response = await request(app)
        .post("/todo/register")
        .send({ ...validRegistration, password: "short" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at least 8 characters.");
    });

    it("User registers with a duplicate username", async () => {
      await request(app).post("/todo/register").send(validRegistration);

      const response = await request(app)
        .post("/todo/register")
        .send({
          ...validRegistration,
          email: "other@example.com",
          username: "jdoe",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username is already taken.");
    });

    it("User registers with a duplicate email", async () => {
      await request(app).post("/todo/register").send(validRegistration);

      const response = await request(app)
        .post("/todo/register")
        .send({
          ...validRegistration,
          email: "jane@example.com",
          username: "otheruser",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is already registered.");
    });
  });

  describe("US-1.2 — Sign in", () => {
    beforeEach(async () => {
      await request(app).post("/todo/register").send(validRegistration);
    });

    it("User signs in with valid credentials", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jane@example.com",
        role: "worker",
        token: expect.any(String),
      });
    });

    it("User signs in with invalid password", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe", password: "wrongpassword" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid username or password.");
    });

    it("User signs in with missing username", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username is required.");
    });

    it("User signs in with missing password", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password is required.");
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const user = await registerUser(validRegistration);

      const response = await request(app)
        .post("/todo/logout")
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Signed out successfully.");

      const revokedSession = await db.session.findOne({
        where: { userId: user.user.userId },
      });
      expect(revokedSession.token).toBe("");

      const retry = await request(app)
        .post("/todo/logout")
        .set(user.authHeader);

      expect(retry.status).toBe(401);
    });
  });
});
