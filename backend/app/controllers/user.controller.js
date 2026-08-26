import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;

const exports = {};

exports.findOne = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.send(user);
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch user profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const accessibleUser = await getAccessibleUserOrNull(req, userId);
    if (!accessibleUser) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const user = await db.user.unscoped().findByPk(userId);

    const { fName, lName, email, username, password } = req.body;

    if (!fName?.trim()) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (!lName?.trim()) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (!username?.trim()) {
      return res.status(400).send({ message: "Username is required." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim();

    const existingUsername = await db.user.findOne({
      where: {
        username: normalizedUsername,
        id: { [Op.ne]: user.id },
      },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await db.user.findOne({
      where: {
        email: trimmedEmail,
        id: { [Op.ne]: user.id },
      },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    if (password !== undefined && password !== null && password !== "") {
      if (password.length < 8) {
        return res.status(400).send({ message: "Password must be at least 8 characters." });
      }

      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    user.fName = fName.trim();
    user.lName = lName.trim();
    user.email = trimmedEmail;
    user.username = normalizedUsername;

    await user.save();

    const updatedUser = await db.user.findByPk(userId);
    return res.send(updatedUser);
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update user profile." });
  }
};

export default exports;
