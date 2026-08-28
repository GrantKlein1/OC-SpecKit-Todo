/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 *
 * Feature 5 — Todo Due Date
 * Spec: features/feature-5-todo-due-date.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const createOwnedList = async (authHeader, name) => {
  const response = await request(app).post("/todo/lists").set(authHeader).send({ name });
  return response.body;
};

const createOwnedTodo = async (authHeader, listId, title) => {
  const response = await request(app)
    .post(`/todo/lists/${listId}/todos`)
    .set(authHeader)
    .send({ title });
  return response.body;
};

describe("Feature 3 — Todo API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "Buy milk" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        completed: false,
        userId: user.user.userId,
        listId: list.id,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");

      const emptyResponse = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "" });

      expect(emptyResponse.status).toBe(400);
      expect(emptyResponse.body.message).toBe("Todo title is required.");

      const whitespaceResponse = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "   " });

      expect(whitespaceResponse.status).toBe(400);
      expect(whitespaceResponse.body.message).toBe("Todo title is required.");

      const count = await db.todo.count({ where: { listId: list.id } });
      expect(count).toBe(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const listA = await createOwnedList(userA.authHeader, "Work");
      const listB = await createOwnedList(userB.authHeader, "Work");
      await createOwnedTodo(userA.authHeader, listA.id, "My task");
      await createOwnedTodo(userB.authHeader, listB.id, "Their task");

      const response = await request(app)
        .get(`/todo/lists/${listA.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.map((todo) => todo.title)).toEqual(["My task"]);
      expect(response.body.map((todo) => todo.title)).not.toContain("Their task");
      expect(response.body.every((todo) => todo.userId === userA.user.userId)).toBe(true);
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const todo = await createOwnedTodo(user.authHeader, list.id, "Buy milk");
      expect(todo.completed).toBe(false);

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(user.authHeader)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.id).toBe(todo.id);
    });

    it("User marks a completed todo as incomplete", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const todo = await createOwnedTodo(user.authHeader, list.id, "Buy milk");

      await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(user.authHeader)
        .send({ completed: true });

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(user.authHeader)
        .send({ completed: false });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const todo = await createOwnedTodo(user.authHeader, list.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(user.authHeader)
        .send({ title: "Buy oat milk" });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Buy oat milk");
      expect(response.body.id).toBe(todo.id);
    });

    it("User deletes a todo", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const todo = await createOwnedTodo(user.authHeader, list.id, "Buy milk");

      const response = await request(app)
        .delete(`/todo/todos/${todo.id}`)
        .set(user.authHeader);

      expect([200, 204]).toContain(response.status);

      const remaining = await db.todo.findByPk(todo.id);
      expect(remaining).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createOwnedList(userB.authHeader, "Secret");
      await createOwnedTodo(userB.authHeader, listB.id, "Hidden task");

      const response = await request(app)
        .get(`/todo/lists/${listB.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });
      expect(JSON.stringify(response.body)).not.toContain("Hidden task");
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createOwnedList(userB.authHeader, "Secret");

      const response = await request(app)
        .post(`/todo/lists/${listB.id}/todos`)
        .set(userA.authHeader)
        .send({ title: "Intruder task" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });

      const count = await db.todo.count({ where: { listId: listB.id } });
      expect(count).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createOwnedList(userB.authHeader, "Secret");
      const todoB = await createOwnedTodo(userB.authHeader, listB.id, "Original");

      const response = await request(app)
        .put(`/todo/todos/${todoB.id}`)
        .set(userA.authHeader)
        .send({ title: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Todo with id=${todoB.id} not found.`,
      });

      const unchanged = await db.todo.findByPk(todoB.id);
      expect(unchanged.title).toBe("Original");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createOwnedList(userB.authHeader, "Secret");
      const todoB = await createOwnedTodo(userB.authHeader, listB.id, "Keep me");

      const response = await request(app)
        .delete(`/todo/todos/${todoB.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Todo with id=${todoB.id} not found.`,
      });

      const remaining = await db.todo.findByPk(todoB.id);
      expect(remaining).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listA = await createOwnedList(userA.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${listA.id}/todos`)
        .set(userA.authHeader)
        .send({ title: "Buy milk", userId: userB.user.userId });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);
      expect(response.body.userId).not.toBe(userB.user.userId);

      const saved = await db.todo.findByPk(response.body.id);
      expect(saved.userId).toBe(userA.user.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const response = await request(app).get("/todo/lists/1/todos");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const milk = await createOwnedTodo(user.authHeader, list.id, "Buy milk");
      const eggs = await createOwnedTodo(user.authHeader, list.id, "Buy eggs");

      const response = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(user.authHeader);

      expect([200, 204]).toContain(response.status);

      expect(await db.todo.findByPk(milk.id)).toBeNull();
      expect(await db.todo.findByPk(eggs.id)).toBeNull();

      const query = await request(app)
        .get(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader);

      expect(query.status).toBe(404);
    });
  });
});

describe("Feature 5 — Todo Due Date", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "Buy milk", dueDate: "2026-07-15" });

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBe("2026-07-15");
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        completed: false,
        userId: user.user.userId,
        listId: list.id,
      });
    });

    it("User adds a todo without a due date", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "Buy milk" });

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on create", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "Task", dueDate: "not-a-date" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });

      const count = await db.todo.count({ where: { listId: list.id } });
      expect(count).toBe(0);
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const todo = await createOwnedTodo(user.authHeader, list.id, "Buy milk");
      expect(todo.dueDate).toBeNull();

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(user.authHeader)
        .send({ dueDate: "2026-07-20" });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe("2026-07-20");
    });

    it("User clears a due date when editing a todo", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const created = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "Buy milk", dueDate: "2026-07-20" });

      expect(created.body.dueDate).toBe("2026-07-20");

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: null });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on update", async () => {
      const user = await registerUser();
      const list = await createOwnedList(user.authHeader, "Groceries");
      const created = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(user.authHeader)
        .send({ title: "Buy milk", dueDate: "2026-07-15" });

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: "2026-99-99" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });

      const unchanged = await db.todo.findByPk(created.body.id);
      expect(unchanged.dueDate).toBe("2026-07-15");
    });

    it("User cannot set due date on another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createOwnedList(userB.authHeader, "Secret");
      const todoB = await createOwnedTodo(userB.authHeader, listB.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todoB.id}`)
        .set(userA.authHeader)
        .send({ dueDate: "2026-07-15" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Todo with id=${todoB.id} not found.`,
      });

      const unchanged = await db.todo.findByPk(todoB.id);
      expect(unchanged.dueDate).toBeNull();
    });
  });
});
