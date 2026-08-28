import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const TODO_TITLE_MAX = 255;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const INVALID_DUE_DATE_MESSAGE = "Due date must be a valid date in YYYY-MM-DD format.";

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

const isValidCalendarDate = (value) => {
  if (typeof value !== "string" || !DATE_ONLY_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const parseDueDateField = (body) => {
  if (!Object.prototype.hasOwnProperty.call(body, "dueDate")) {
    return { omitted: true };
  }

  const dueDate = body.dueDate;

  if (dueDate === null) {
    return { value: null };
  }

  if (!isValidCalendarDate(dueDate)) {
    return { error: INVALID_DUE_DATE_MESSAGE };
  }

  return { value: dueDate };
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

    const dueDateField = parseDueDateField(req.body);

    if (dueDateField.error) {
      return res.status(400).send({ message: dueDateField.error });
    }

    const todo = await db.todo.create({
      title,
      completed: false,
      listId: list.id,
      userId: req.user.id,
      dueDate: dueDateField.omitted ? null : dueDateField.value,
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

    const dueDateField = parseDueDateField(req.body);

    if (dueDateField.error) {
      return res.status(400).send({ message: dueDateField.error });
    }

    if (!dueDateField.omitted) {
      todo.dueDate = dueDateField.value;
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
