import { apiConnector } from "../apiConnector";
import { availability } from "../apis";

export const getAvailabilitySummary = async (startDate, endDate, token) => {
  try {
    if (!token) {
      throw new Error("Authorization token is missing");
    }
    const url = `${availability.GET_AVAILABILITY_SUMMARY}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

    const response = await apiConnector(
      "GET",
      url,
      null,
      { Authorization: `Bearer ${token}` }
    );

    return response?.data;
  } catch (error) {
    console.error("Error fetching availability summary:", error);
    throw error;
  }
};
