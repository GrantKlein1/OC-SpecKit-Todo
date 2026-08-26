import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    return res.send(lists);
  } catch (err) {
    logger.error(`List findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch lists." });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).send({ message: "List name is required." });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).send({ message: "List name must be 100 characters or fewer." });
    }

    const list = await db.list.create({
      name: trimmedName,
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (err) {
    logger.error(`List create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create list." });
  }
};

exports.update = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).send({ message: "List name is required." });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).send({ message: "List name must be 100 characters or fewer." });
    }

    list.name = trimmedName;
    await list.save();

    return res.send(list);
  } catch (err) {
    logger.error(`List update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update list." });
  }
};

exports.remove = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();

    return res.status(200).send({ message: "List deleted successfully." });
  } catch (err) {
    logger.error(`List delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete list." });
  }
};

export default exports;
