import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VenueManagement = () => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef(null);
  
  // Mock data - would come from API
  const initialVenues = [
    {
      id: 1,
      name: 'Grand Ballroom',
      type: 'Wedding',
      capacity: 300,
      location: 'Downtown',
      baseRate: 5000,
      keywords: 'Banquet, Gala',
      typicalRevenue: 7000
    },
    {
      id: 2,
      name: 'City Conference Center',
      type: 'Corporate',
      capacity: 500,
      location: 'Midtown',
      baseRate: 8000,
      keywords: 'Expo, Seminar',
      typicalRevenue: 10000
    }
  ];
  
  // Chart data for venue revenue
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue',
      data: [5000, 6000, 5500, 7000, 6500, 8000],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      fill: true,
      tension: 0.3
    }]
  };
  
  // Load venues on component mount
  useEffect(() => {
    // This would be replaced with actual API call
    // const fetchVenues = async () => {
    //   try {
    //     const response = await axios.get('/api/venues');
    //     setVenues(response.data);
    //   } catch (error) {
    //     console.error('Error fetching venues:', error);
    //   }
    // };
    
    // fetchVenues();
    
    // For now, use mock data
    setVenues(initialVenues);
  }, []);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const venueData = {
      name: formData.get('venueName'),
      type: formData.get('venueType'),
      capacity: parseInt(formData.get('capacity')),
      baseRate: parseFloat(formData.get('baseRate')),
      location: formData.get('location'),
      keywords: formData.get('eventKeywords'),
      typicalRevenue: parseFloat(formData.get('typicalRevenue') || 0)
    };
    
    if (isEditing && selectedVenue) {
      // Update existing venue
      const updatedVenue = { ...selectedVenue, ...venueData };
      
      // This would be replaced with actual API call
      // axios.put(`/api/venues/${selectedVenue.id}`, updatedVenue)
      //   .then(response => {
      //     setVenues(venues.map(venue => 
      //       venue.id === selectedVenue.id ? response.data : venue
      //     ));
      //     setSelectedVenue(null);
      //     setIsEditing(false);
      //   })
      //   .catch(error => {
      //     console.error('Error updating venue:', error);
      //   });
      
      // For now, just update state
      setVenues(venues.map(venue => 
        venue.id === selectedVenue.id ? { ...updatedVenue, id: selectedVenue.id } : venue
      ));
    } else {
      // Add new venue
      // This would be replaced with actual API call
      // axios.post('/api/venues', venueData)
      //   .then(response => {
      //     setVenues([...venues, response.data]);
      //   })
      //   .catch(error => {
      //     console.error('Error adding venue:', error);
      //   });
      
      // For now, just add to state with a mock ID
      const newVenue = { ...venueData, id: Date.now() };
      setVenues([...venues, newVenue]);
    }
    
    // Reset form and state
    e.target.reset();
    setSelectedVenue(null);
    setIsEditing(false);
  };
  
  // Handle edit button click
  const handleEdit = (venue) => {
    setSelectedVenue(venue);
    setIsEditing(true);
    
    // Fill form with venue data
    if (formRef.current) {
      formRef.current.venueName.value = venue.name;
      formRef.current.venueType.value = venue.type;
      formRef.current.capacity.value = venue.capacity;
      formRef.current.baseRate.value = venue.baseRate;
      formRef.current.location.value = venue.location;
      formRef.current.eventKeywords.value = venue.keywords;
      formRef.current.typicalRevenue.value = venue.typicalRevenue;
    }
  };
  
  // Handle delete button click
  const handleDelete = (venueId) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      // This would be replaced with actual API call
      // axios.delete(`/api/venues/${venueId}`)
      //   .then(() => {
      //     setVenues(venues.filter(venue => venue.id !== venueId));
      //   })
      //   .catch(error => {
      //     console.error('Error deleting venue:', error);
      //   });
      
      // For now, just update state
      setVenues(venues.filter(venue => venue.id !== venueId));
    }
  };
  
  // Handle selecting a venue for chart
  const handleSelectVenueForChart = (venue) => {
    setSelectedVenue(venue);
    // In a real app, you'd fetch revenue data for this venue
    // and update the chart
  };
  
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Venue Management</h1>
        <p className="text-gray-300">Manage your venues, their details, and event revenue associations</p>
      </div>
      
      {/* Add/Edit Venue Form */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {isEditing ? 'Edit Venue' : 'Add New Venue'}
        </h2>
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-1" htmlFor="venueName">Venue Name</label>
            <input 
              type="text" 
              id="venueName" 
              name="venueName" 
              className="w-full p-2 rounded text-black"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1" htmlFor="venueType">Venue Type</label>
            <select 
              id="venueType" 
              name="venueType" 
              className="w-full p-2 rounded text-black"
              required
            >
              <option value="" disabled>Select Type</option>
              <option value="Wedding">Wedding</option>
              <option value="Corporate">Corporate</option>
              <option value="Club">Club</option>
              <option value="Private Party">Private Party</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-white mb-1" htmlFor="capacity">Capacity</label>
            <input 
              type="number" 
              id="capacity" 
              name="capacity" 
              className="w-full p-2 rounded text-black"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1" htmlFor="baseRate">Average Earnings / Base Rate ($)</label>
            <input 
              type="number" 
              id="baseRate" 
              name="baseRate" 
              step="0.01" 
              className="w-full p-2 rounded text-black"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1" htmlFor="location">Location</label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              className="w-full p-2 rounded text-black"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1" htmlFor="eventKeywords">Event Matching Keywords</label>
            <input 
              type="text" 
              id="eventKeywords" 
              name="eventKeywords" 
              placeholder="e.g., Gala, Banquet, Expo" 
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div>
            <label className="block text-white mb-1" htmlFor="typicalRevenue">Typical Revenue for Matched Events ($)</label>
            <input 
              type="number" 
              id="typicalRevenue" 
              name="typicalRevenue" 
              step="0.01" 
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div className="md:col-span-2">
            <button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              {isEditing ? 'Update Venue' : 'Add Venue'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Venue List Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 overflow-x-auto">
        <h2 className="text-xl font-semibold text-white mb-4">Venue List</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="p-2 bg-gray-700 text-white">Venue Name</th>
              <th className="p-2 bg-gray-700 text-white">Type</th>
              <th className="p-2 bg-gray-700 text-white">Capacity</th>
              <th className="p-2 bg-gray-700 text-white">Location</th>
              <th className="p-2 bg-gray-700 text-white">Base Rate ($)</th>
              <th className="p-2 bg-gray-700 text-white">Keywords</th>
              <th className="p-2 bg-gray-700 text-white">Typical Revenue ($)</th>
              <th className="p-2 bg-gray-700 text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.id} className="border-b border-gray-700">
                <td className="p-2 text-white">{venue.name}</td>
                <td className="p-2 text-white">{venue.type}</td>
                <td className="p-2 text-white">{venue.capacity}</td>
                <td className="p-2 text-white">{venue.location}</td>
                <td className="p-2 text-white">{venue.baseRate.toFixed(2)}</td>
                <td className="p-2 text-white">{venue.keywords}</td>
                <td className="p-2 text-white">{venue.typicalRevenue?.toFixed(2)}</td>
                <td className="p-2 flex">
                  <button 
                    onClick={() => handleEdit(venue)}
                    className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(venue.id)}
                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Venue Analytics / Revenue Trend Chart */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 overflow-x-auto">
        <h2 className="text-xl font-semibold text-white mb-4">Venue Revenue Trend</h2>
        <p className="text-white mb-4">
          {selectedVenue 
            ? `Showing revenue trend for ${selectedVenue.name}` 
            : 'Select a venue from the list to view its revenue trend.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {venues.map(venue => (
            <button
              key={venue.id}
              onClick={() => handleSelectVenueForChart(venue)}
              className={`p-2 rounded text-white ${
                selectedVenue?.id === venue.id 
                  ? 'bg-blue-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {venue.name}
            </button>
          ))}
        </div>
        <div className="h-64">
          <Line data={revenueChartData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
      
      {/* Year-over-Year Comparison */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Year-over-Year Venue Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Revenue Growth</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="p-2 bg-gray-700 text-white">Venue</th>
                  <th className="p-2 bg-gray-700 text-white">Last Year</th>
                  <th className="p-2 bg-gray-700 text-white">This Year</th>
                  <th className="p-2 bg-gray-700 text-white">Growth</th>
                </tr>
              </thead>
              <tbody>
                {venues.map(venue => (
                  <tr key={venue.id} className="border-b border-gray-700">
                    <td className="p-2 text-white">{venue.name}</td>
                    <td className="p-2 text-white">${(venue.baseRate * 0.9).toFixed(2)}</td>
                    <td className="p-2 text-white">${venue.baseRate.toFixed(2)}</td>
                    <td className="p-2 text-white">
                      <span className="text-green-500">+10%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Venue Utilization</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="p-2 bg-gray-700 text-white">Venue</th>
                  <th className="p-2 bg-gray-700 text-white">Events</th>
                  <th className="p-2 bg-gray-700 text-white">Avg. Revenue</th>
                  <th className="p-2 bg-gray-700 text-white">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {venues.map(venue => (
                  <tr key={venue.id} className="border-b border-gray-700">
                    <td className="p-2 text-white">{venue.name}</td>
                    <td className="p-2 text-white">12</td>
                    <td className="p-2 text-white">${venue.baseRate.toFixed(2)}</td>
                    <td className="p-2 text-white">68%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueManagement;