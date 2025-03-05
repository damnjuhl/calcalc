// src/services/venueService.js
import api from './api';

export const venueService = {
  getVenues: async (params = {}) => {
    try {
      const response = await api.get('/venues', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }
  },
  
  getVenue: async (id) => {
    try {
      const response = await api.get(`/venues/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching venue ${id}:`, error);
      throw error;
    }
  },
  
  createVenue: async (venueData) => {
    try {
      const response = await api.post('/venues', venueData);
      return response.data;
    } catch (error) {
      console.error('Error creating venue:', error);
      throw error;
    }
  },
  
  updateVenue: async (id, venueData) => {
    try {
      const response = await api.put(`/venues/${id}`, venueData);
      return response.data;
    } catch (error) {
      console.error(`Error updating venue ${id}:`, error);
      throw error;
    }
  },
  
  deleteVenue: async (id) => {
    try {
      const response = await api.delete(`/venues/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting venue ${id}:`, error);
      throw error;
    }
  }
};