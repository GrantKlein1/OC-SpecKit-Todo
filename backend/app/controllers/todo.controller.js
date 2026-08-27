import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const TODO_TITLE_MAX = 255;

const normalizeTodoTitle = (title) => (typeof title === "string" ? title.trim() : "");

const validateTodoTitle = (title) => {
  if (!title) {
    return "Todo title is required.";
  }

  if (title.length > TODO_TITLE_MAX) {
    return "Todo title must be 255 characters or fewer.";
  }

  return null;
};

const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);

    if (listId === null) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await db.todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    return res.send(todos);
  } catch (err) {
    logger.error(`Find todos failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to retrieve todos." });
  }
};

exports.create = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);

    if (listId === null) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const title = normalizeTodoTitle(req.body.title);
    const validationMessage = validateTodoTitle(title);

    if (validationMessage) {
      return res.status(400).send({ message: validationMessage });
    }

    const todo = await db.todo.create({
      title,
      completed: false,
      listId: list.id,
      userId: req.user.id,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Create todo failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);

    if (todoId === null) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);

    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    const list = await getAccessibleListOrNull(req, todo.listId);

    if (!list) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const title = normalizeTodoTitle(req.body.title);
      const validationMessage = validateTodoTitle(title);

      if (validationMessage) {
        return res.status(400).send({ message: validationMessage });
      }

      todo.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    await todo.save();

    return res.send(todo);
  } catch (err) {
    logger.error(`Update todo failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update todo." });
  }
};

exports.delete = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);

    if (todoId === null) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);

    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    const list = await getAccessibleListOrNull(req, todo.listId);

    if (!list) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();

    return res.status(200).send(todo);
  } catch (err) {
    logger.error(`Delete todo failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete todo." });
  }
};

export default exports;
