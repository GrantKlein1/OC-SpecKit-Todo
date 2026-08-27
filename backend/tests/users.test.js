/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const userA = {
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "password123",
};

const userB = {
  fName: "Bob",
  lName: "Bee",
  email: "b@example.com",
  username: "userb",
  password: "password456",
};

const profileFields = (overrides = {}) => ({
  fName: userA.fName,
  lName: userA.lName,
  email: userA.email,
  username: userA.username,
  ...overrides,
});

describe("Feature 4 — User Profile API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const a = await registerUser(userA);
      const userId = a.user.userId;
      const previousHash = (await db.user.unscoped().findByPk(userId)).password;

      const response = await request(app)
        .put(`/todo/users/${userId}`)
        .set(a.authHeader)
        .send({
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: userId,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findByPk(userId);
      expect(stored.fName).toBe("Janet");
      expect(stored.lName).toBe("Smith");
      expect(stored.email).toBe("janet@example.com");
      expect(stored.username).toBe("jsmith");
      expect(stored.password).toBe(previousHash);
    });

    it("User fetches their own profile", async () => {
      const a = await registerUser(userA);

      const response = await request(app)
        .get(`/todo/users/${a.user.userId}`)
        .set(a.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: a.user.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const a = await registerUser(userA);
      const b = await registerUser(userB);

      const response = await request(app)
        .get(`/todo/users/${b.user.userId}`)
        .set(a.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `User with id=${b.user.userId} not found.`,
      });
    });

    it("User attempts to update another user's profile", async () => {
      const a = await registerUser(userA);
      const b = await registerUser(userB);

      const response = await request(app)
        .put(`/todo/users/${b.user.userId}`)
        .set(a.authHeader)
        .send(profileFields({ fName: "Hacked" }));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `User with id=${b.user.userId} not found.`,
      });

      const stored = await db.user.findByPk(b.user.userId);
      expect(stored.fName).toBe("Bob");
      expect(stored.lName).toBe("Bee");
      expect(stored.email).toBe("b@example.com");
      expect(stored.username).toBe("userb");
    });

    it("Unauthenticated profile API request", async () => {
      const response = await request(app).get("/todo/users/1");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const a = await registerUser(userA);

      const response = await request(app)
        .put(`/todo/users/${a.user.userId}`)
        .set(a.authHeader)
        .send({ password: "short" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("Profile update rejects missing required fields", async () => {
      const a = await registerUser(userA);

      const response = await request(app)
        .put(`/todo/users/${a.user.userId}`)
        .set(a.authHeader)
        .send(profileFields({ fName: "" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "First name is required." });

      const stored = await db.user.findByPk(a.user.userId);
      expect(stored.fName).toBe("Jane");
    });

    it("Profile update rejects a duplicate username", async () => {
      const a = await registerUser(userA);
      await registerUser(userB);

      const response = await request(app)
        .put(`/todo/users/${a.user.userId}`)
        .set(a.authHeader)
        .send(profileFields({ username: "userb" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Username is already taken." });

      const storedB = await db.user.findOne({ where: { username: "userb" } });
      expect(storedB.email).toBe("b@example.com");
    });

    it("Profile update rejects a duplicate email", async () => {
      const a = await registerUser(userA);
      await registerUser(userB);

      const response = await request(app)
        .put(`/todo/users/${a.user.userId}`)
        .set(a.authHeader)
        .send(profileFields({ email: "b@example.com" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is already registered." });

      const storedB = await db.user.findOne({ where: { email: "b@example.com" } });
      expect(storedB.username).toBe("userb");
    });

    it("Unauthenticated profile update API request", async () => {
      const response = await request(app)
        .put("/todo/users/1")
        .send(profileFields());

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/unauthorized/i);
    });
  });
});
