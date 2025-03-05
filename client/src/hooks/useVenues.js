// src/hooks/useVenues.js
import { useState, useEffect, useCallback } from 'react';
import { venueService } from '../services/venueService';

export const useVenues = (initialParams = {}) => {
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  
  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await venueService.getVenues(params);
      setVenues(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch venues');
    } finally {
      setIsLoading(false);
    }
  }, [params]);
  
  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);
  
  const createVenue = async (venueData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newVenue = await venueService.createVenue(venueData);
      setVenues(prevVenues => [...prevVenues, newVenue]);
      return newVenue;
    } catch (err) {
      setError(err.message || 'Failed to create venue');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateVenue = async (id, venueData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedVenue = await venueService.updateVenue(id, venueData);
      setVenues(prevVenues => 
        prevVenues.map(venue => venue.id === id ? updatedVenue : venue)
      );
      return updatedVenue;
    } catch (err) {
      setError(err.message || `Failed to update venue ${id}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteVenue = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await venueService.deleteVenue(id);
      setVenues(prevVenues => prevVenues.filter(venue => venue.id !== id));
    } catch (err) {
      setError(err.message || `Failed to delete venue ${id}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    venues,
    isLoading,
    error,
    fetchVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    setParams
  };
};