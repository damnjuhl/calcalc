// src/components/Venues/VenueList.jsx
import React, { useState } from 'react';
import { useVenues } from '../../hooks/useVenues';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorAlert from '../UI/ErrorAlert';
import VenueForm from './VenueForm';

const VenueList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  
  const {
    venues,
    isLoading,
    error,
    fetchVenues,
    createVenue,
    updateVenue,
    deleteVenue
  } = useVenues();
  
  const handleOpenModal = (venue = null) => {
    setSelectedVenue(venue);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setSelectedVenue(null);
    setIsModalOpen(false);
  };
  
  const handleSubmit = async (venueData) => {
    try {
      if (selectedVenue) {
        await updateVenue(selectedVenue.id, venueData);
      } else {
        await createVenue(venueData);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save venue:', err);
      // Error handling is managed by the hook
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      try {
        await deleteVenue(id);
      } catch (err) {
        console.error('Failed to delete venue:', err);
        // Error handling is managed by the hook
      }
    }
  };
  
  if (isLoading && venues.length === 0) {
    return <LoadingSpinner />;
  }
  
  if (error && venues.length === 0) {
    return (
      <ErrorAlert 
        message={error} 
        onRetry={fetchVenues}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Venues</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Venue
        </button>
      </div>
      
      {venues.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No venues found. Add your first venue!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {venues.map(venue => (
              <li key={venue.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {venue.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {venue.address}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(venue)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(venue.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isModalOpen && (
        <VenueForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          venue={selectedVenue}
        />
      )}
    </div>
  );
};

export default VenueList;