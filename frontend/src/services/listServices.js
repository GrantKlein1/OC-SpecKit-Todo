import apiClient from "./services.js";

const listServices = {
  getLists() {
    return apiClient.get("lists");
  },

  createList(name) {
    return apiClient.post("lists", { name });
  },

  updateList(listId, name) {
    return apiClient.put(`lists/${listId}`, { name });
  },

  deleteList(listId) {
    return apiClient.delete(`lists/${listId}`);
  },
};

export default listServices;
