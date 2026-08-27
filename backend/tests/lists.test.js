/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const createOwnedList = async (authHeader, name) => {
  const response = await request(app).post("/todo/lists").set(authHeader).send({ name });
  return response.body;
};

describe("Feature 2 — Todo List API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const user = await registerUser();

      const response = await request(app)
        .post("/todo/lists")
        .set(user.authHeader)
        .send({ name: "Groceries" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: user.user.userId,
      });
    });

    it("User creates a list with an empty name", async () => {
      const user = await registerUser();

      const emptyResponse = await request(app)
        .post("/todo/lists")
        .set(user.authHeader)
        .send({ name: "" });

      expect(emptyResponse.status).toBe(400);
      expect(emptyResponse.body.message).toBe("List name is required.");

      const whitespaceResponse = await request(app)
        .post("/todo/lists")
        .set(user.authHeader)
        .send({ name: "   " });

      expect(whitespaceResponse.status).toBe(400);
      expect(whitespaceResponse.body.message).toBe("List name is required.");

      const count = await db.list.count({ where: { userId: user.user.userId } });
      expect(count).toBe(0);
    });

    it("User creates a list with a name that is too long", async () => {
      const user = await registerUser();
      const name = "a".repeat(101);

      const response = await request(app)
        .post("/todo/lists")
        .set(user.authHeader)
        .send({ name });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "List name must be 100 characters or fewer.",
      });
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const user = await registerUser();
      await createOwnedList(user.authHeader, "Work");
      await createOwnedList(user.authHeader, "Personal");

      const response = await request(app).get("/todo/lists").set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
      expect(response.body.every((list) => list.userId === user.user.userId)).toBe(true);
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

      await createOwnedList(userB.authHeader, "Secret Project");
      await createOwnedList(userA.authHeader, "Mine");

      const response = await request(app).get("/todo/lists").set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.every((list) => list.userId === userA.user.userId)).toBe(true);
      expect(response.body.map((list) => list.name)).not.toContain("Secret Project");
      expect(response.body.map((list) => list.name)).toEqual(["Mine"]);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");

      const response = await request(app)
        .put(`/todo/lists/${list.id}`)
        .set(user.authHeader)
        .send({ name: "Shopping" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: list.id,
        name: "Shopping",
        userId: user.user.userId,
      });
    });

    it("User deletes a list", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");

      const response = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(user.authHeader);

      expect([200, 204]).toContain(response.status);

      const remaining = await db.list.findByPk(list.id);
      expect(remaining).toBeNull();
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
      const listB = await createOwnedList(userB.authHeader, "Secret Project");

      const response = await request(app)
        .put(`/todo/lists/${listB.id}`)
        .set(userA.authHeader)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });

      const unchanged = await db.list.findByPk(listB.id);
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
      const listB = await createOwnedList(userB.authHeader, "Secret Project");

      const response = await request(app)
        .delete(`/todo/lists/${listB.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });

      const remaining = await db.list.findByPk(listB.id);
      expect(remaining).not.toBeNull();
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

      const saved = await db.list.findByPk(response.body.id);
      expect(saved.userId).toBe(userA.user.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const response = await request(app).get("/todo/lists");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
