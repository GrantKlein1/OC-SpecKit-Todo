import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import listModel from "./list.model.js";
import todoModel from "./todo.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.list = listModel(sequelize, Sequelize);
db.todo = todoModel(sequelize, Sequelize);

db.user.hasMany(db.session, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
});

db.session.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

db.user.hasMany(db.list, {
  foreignKey: "userId",
  as: "lists",
  onDelete: "CASCADE",
});

db.list.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

db.list.hasMany(db.todo, {
  foreignKey: "listId",
  as: "todos",
  onDelete: "CASCADE",
});

db.todo.belongsTo(db.list, {
  foreignKey: "listId",
  as: "list",
});

db.user.hasMany(db.todo, {
  foreignKey: "userId",
  as: "todos",
  onDelete: "CASCADE",
});

db.todo.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

export default db;
