import apiClient from "./services.js";

const listServices = {
  getLists() {
    return apiClient.get("lists");
  },

  createList(payload) {
    return apiClient.post("lists", payload);
  },

  updateList(listId, payload) {
    return apiClient.put(`lists/${listId}`, payload);
  },

  deleteList(listId) {
    return apiClient.delete(`lists/${listId}`);
  },
};

export default listServices;
