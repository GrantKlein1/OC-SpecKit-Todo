import apiClient from "./services.js";

const todoServices = {
  getTodos(listId) {
    return apiClient.get(`lists/${listId}/todos`);
  },

  createTodo(listId, title, dueDate) {
    const payload = { title };

    if (dueDate) {
      payload.dueDate = dueDate;
    }

    return apiClient.post(`lists/${listId}/todos`, payload);
  },

  updateTodo(todoId, payload) {
    return apiClient.put(`todos/${todoId}`, payload);
  },

  deleteTodo(todoId) {
    return apiClient.delete(`todos/${todoId}`);
  },
};

export default todoServices;
