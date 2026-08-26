import db from "../models/index.js";
import logger from "../config/logger.js";
import { parseDueDateInput } from "../utils/dueDate.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const exports = {};

exports.findAllByList = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
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
    logger.error(`Todo findAllByList failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch todos." });
  }
};

exports.create = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const { title, dueDate } = req.body;

    if (!title?.trim()) {
      return res.status(400).send({ message: "Todo title is required." });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 255) {
      return res.status(400).send({ message: "Todo title must be 255 characters or fewer." });
    }

    const parsedDueDate = parseDueDateInput(dueDate);
    if (parsedDueDate.error) {
      return res.status(400).send({ message: parsedDueDate.error });
    }

    const todo = await db.todo.create({
      listId: list.id,
      title: trimmedTitle,
      completed: false,
      userId: req.user.id,
      dueDate: parsedDueDate.provided ? parsedDueDate.value : null,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Todo create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    const { title, completed, dueDate } = req.body;

    if (title !== undefined) {
      if (!title?.trim()) {
        return res.status(400).send({ message: "Todo title is required." });
      }

      const trimmedTitle = title.trim();
      if (trimmedTitle.length > 255) {
        return res.status(400).send({ message: "Todo title must be 255 characters or fewer." });
      }

      todo.title = trimmedTitle;
    }

    if (completed !== undefined) {
      todo.completed = Boolean(completed);
    }

    if (dueDate !== undefined) {
      const parsedDueDate = parseDueDateInput(dueDate);
      if (parsedDueDate.error) {
        return res.status(400).send({ message: parsedDueDate.error });
      }

      todo.dueDate = parsedDueDate.value;
    }

    await todo.save();

    return res.send(todo);
  } catch (err) {
    logger.error(`Todo update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update todo." });
  }
};

exports.remove = async (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();

    return res.status(200).send({ message: "Todo deleted successfully." });
  } catch (err) {
    logger.error(`Todo delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete todo." });
  }
};

export default exports;
