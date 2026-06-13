import axiosClient from "./axiosClient";

const unwrapData = (response) => {
  if (!response) return null;
  if (response.data?.data !== undefined) return response.data.data;
  return response.data;
};

export const deviceApi = {
  async getDevices() {
    const response = await axiosClient.get("/devices");
    return unwrapData(response) ?? [];
  },

  async revokeDevice(sessionId) {
    const response = await axiosClient.delete(`/devices/${sessionId}`);
    return unwrapData(response);
  },

  async revokeOtherDevices() {
    const response = await axiosClient.delete("/devices/others");
    return unwrapData(response);
  },

  async revokeAllDevices() {
    const response = await axiosClient.delete("/devices/all");
    return unwrapData(response);
  },
};
