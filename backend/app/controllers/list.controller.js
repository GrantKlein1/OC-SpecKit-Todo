import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const LIST_NAME_MAX = 100;

const normalizeListName = (name) => (typeof name === "string" ? name.trim() : "");

const validateListName = (name) => {
  if (!name) {
    return "List name is required.";
  }

  if (name.length > LIST_NAME_MAX) {
    return "List name must be 100 characters or fewer.";
  }

  return null;
};

const parseListId = (value) => {
  const listId = parseInt(value, 10);
  return Number.isNaN(listId) ? null : listId;
};

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    return res.send(lists);
  } catch (err) {
    logger.error(`Find lists failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to retrieve lists." });
  }
};

exports.create = async (req, res) => {
  try {
    const name = normalizeListName(req.body.name);
    const validationMessage = validateListName(name);

    if (validationMessage) {
      return res.status(400).send({ message: validationMessage });
    }

    const list = await db.list.create({
      name,
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (err) {
    logger.error(`Create list failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create list." });
  }
};

exports.update = async (req, res) => {
  try {
    const listId = parseListId(req.params.listId);

    if (listId === null) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const name = normalizeListName(req.body.name);
    const validationMessage = validateListName(name);

    if (validationMessage) {
      return res.status(400).send({ message: validationMessage });
    }

    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    list.name = name;
    await list.save();

    return res.send(list);
  } catch (err) {
    logger.error(`Update list failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update list." });
  }
};

exports.delete = async (req, res) => {
  try {
    const listId = parseListId(req.params.listId);

    if (listId === null) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();

    return res.status(200).send(list);
  } catch (err) {
    logger.error(`Delete list failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete list." });
  }
};

export default exports;
