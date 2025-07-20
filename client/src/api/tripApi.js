import axios from 'axios';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Plan a trip by sending trip details to the backend
 * @param {Object} tripData - Trip data from form submission
 * @param {number} tripData.days - Number of days for the trip
 * @param {string} tripData.destination - Main destination
 * @param {string} tripData.tripType - Type of trip (Historical, Adventure, Religious, Nature, Romantic)
 * @param {number} [tripData.budget] - Optional budget
 * @param {string} [tripData.travelTime] - Optional preferred time of travel
 * @returns {Promise<Object>} - Optimized itinerary
 */
export const planTrip = async (tripData) => {
  try {
    const response = await api.post('/plan-trip', tripData);
    return response.data;
  } catch (error) {
    console.error('Error planning trip:', error);
    
    // More detailed error handling
    if (error.code === 'ECONNABORTED') {
      throw { success: false, message: 'Request timed out. Please try again.' };
    } else if (!error.response) {
      throw { success: false, message: 'Network error occurred. Please check your internet connection.' };
    } else if (error.response.status === 500) {
      throw { success: false, message: 'Server error. The team has been notified.' };
    } else if (error.response.data && error.response.data.message) {
      throw error.response.data;
    } else {
      throw { success: false, message: 'An unexpected error occurred. Please try again later.' };
    }
  }
};

const tripApi = {
  planTrip,
};

export default tripApi;
