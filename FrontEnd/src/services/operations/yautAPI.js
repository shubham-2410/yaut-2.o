import { apiConnector } from "../apiConnector";
import { yaut } from "../apis";

/**
 * Create a new yacht
 * @param {Object} yachtData - Yacht details including File objects in `photos`
 * @param {string} token - Auth token
 */
export const createYacht = async (yachtData, token) => {
  try {
    const formData = new FormData();

    Object.entries(yachtData).forEach(([key, value]) => {
      if (key === "photos" && Array.isArray(value)) {
        value.forEach((file) => formData.append("yachtPhotos", file)); // backend expects yachtPhotos
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // 🔹 DEBUG: print all FormData entries
    console.log("===== FormData contents =====");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    console.log("=============================");

    const response = await apiConnector("POST", yaut.CREATE_YACHT_API, formData, {
      Authorization: `Bearer ${token}`,
      // Content-Type is automatically set by Axios for FormData
    });

    return response?.data;
  } catch (error) {
    console.error("❌ Error creating yacht:", error.response?.data || error);
    throw error;
  }
};

/**
 * Get all yachts for the logged-in user's company
 * @param {string} token - Auth token
 * @returns {Promise} - Axios response
 */
export const getAllYachtsAPI = async (token) => {
  try {
    const response = await apiConnector("GET", yaut.GET_ALL_YACHTS_API, null, {
      Authorization: `Bearer ${token}`,
    });
    return response;
  } catch (error) {
    console.error("❌ Failed to fetch yachts:", error.response?.data || error);
    throw error;
  }
};
