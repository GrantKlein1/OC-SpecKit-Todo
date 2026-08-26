import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const resetTestDatabase = async () => {
  if (db.todo) {
    await db.todo.destroy({ where: {} });
  }
  if (db.list) {
    await db.list.destroy({ where: {} });
  }
  await db.session.destroy({ where: {} });
  await db.user.destroy({ where: {} });
};

export const registerUser = async (overrides = {}) => {
  const payload = {
    fName: "Test",
    lName: "User",
    email: "test@example.com",
    username: "testuser",
    password: "password123",
    ...overrides,
  };

  const response = await request(app).post("/todo/register").send(payload);

  return {
    response,
    user: response.body,
    token: response.body.token,
    authHeader: { Authorization: `Bearer ${response.body.token}` },
  };
};

export const createList = async (authHeader, name) => {
  return request(app).post("/todo/lists").set(authHeader).send({ name });
};

export const createTodo = async (authHeader, listId, title, dueDate) => {
  const payload = { title };

  if (dueDate !== undefined) {
    payload.dueDate = dueDate;
  }

  return request(app).post(`/todo/lists/${listId}/todos`).set(authHeader).send(payload);
};

export const updateProfile = async (authHeader, userId, payload) => {
  return request(app).put(`/todo/users/${userId}`).set(authHeader).send(payload);
};
