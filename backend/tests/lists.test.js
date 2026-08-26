/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  resetTestDatabase,
  registerUser,
  createList,
} from "./helpers.js";

describe("Feature 2 — List API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const user = await registerUser();

      const response = await createList(user.authHeader, "Groceries");

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "Groceries",
        userId: user.user.userId,
      });
      expect(response.body.id).toBeDefined();
    });

    it("User creates a list with an empty name", async () => {
      const user = await registerUser();

      const response = await createList(user.authHeader, "   ");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("List name is required.");
    });

    it("User creates a list with a name that is too long", async () => {
      const user = await registerUser();
      const longName = "a".repeat(101);

      const response = await createList(user.authHeader, longName);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("List name must be 100 characters or fewer.");
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      await createList(userB.authHeader, "Secret Project");
      await createList(userA.authHeader, "Work");
      await createList(userA.authHeader, "Personal");

      const response = await request(app)
        .get("/todo/lists")
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
      expect(response.body.every((list) => list.userId === userA.user.userId)).toBe(true);
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      await createList(userB.authHeader, "Secret Project");
      await createList(userA.authHeader, "Work");

      const response = await request(app)
        .get("/todo/lists")
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const user = await registerUser();
      const created = await createList(user.authHeader, "Groceries");

      const response = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(user.authHeader)
        .send({ name: "Shopping" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Shopping");
      expect(response.body.userId).toBe(user.user.userId);
    });

    it("User deletes a list", async () => {
      const user = await registerUser();
      const created = await createList(user.authHeader, "Groceries");

      const response = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List deleted successfully.");

      const deleted = await db.list.findByPk(created.body.id);
      expect(deleted).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const secretList = await createList(userB.authHeader, "Secret Project");

      const response = await request(app)
        .put(`/todo/lists/${secretList.body.id}`)
        .set(userA.authHeader)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${secretList.body.id} not found.`);

      const unchanged = await db.list.findByPk(secretList.body.id);
      expect(unchanged.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const secretList = await createList(userB.authHeader, "Secret Project");

      const response = await request(app)
        .delete(`/todo/lists/${secretList.body.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${secretList.body.id} not found.`);

      const preserved = await db.list.findByPk(secretList.body.id);
      expect(preserved).not.toBeNull();
      expect(preserved.name).toBe("Secret Project");
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .post("/todo/lists")
        .set(userA.authHeader)
        .send({ name: "Groceries", userId: userB.user.userId });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);
      expect(response.body.userId).not.toBe(userB.user.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const response = await request(app).get("/todo/lists");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
