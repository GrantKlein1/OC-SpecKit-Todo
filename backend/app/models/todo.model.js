export default (sequelize, Sequelize) => {
  const Todo = sequelize.define(
    "todo",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      listId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        get() {
          const value = this.getDataValue("dueDate");
          if (value == null || value === "") {
            return null;
          }
          if (value instanceof Date) {
            const year = value.getUTCFullYear();
            const month = String(value.getUTCMonth() + 1).padStart(2, "0");
            const day = String(value.getUTCDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          }
          return String(value).slice(0, 10);
        },
      },
    },
    {
      tableName: "todos",
    }
  );

  return Todo;
};
