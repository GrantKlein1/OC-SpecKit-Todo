import apiClient from "./services.js";

const userServices = {
  getUser(userId) {
    return apiClient.get(`users/${userId}`);
  },

  updateUser(userId, payload) {
    return apiClient.put(`users/${userId}`, payload);
  },
};

export default userServices;
