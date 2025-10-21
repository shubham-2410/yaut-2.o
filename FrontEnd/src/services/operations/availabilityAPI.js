import { apiConnector } from "../apiConnector";
import { availability } from "../apis";

export const getAvailabilitySummary = async (startDate, endDate, token) => {
  try {
    const response = await apiConnector(
      "GET",
      `${availability.GET_AVAILABILITY_SUMMARY}?startDate=${startDate}&endDate=${endDate}`,
      null,
      { Authorization: `Bearer ${token}` }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching availability summary:", error);
    throw error;
  }
};
