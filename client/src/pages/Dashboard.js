// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import axios from 'axios';
import moment from 'moment';
import GoogleCalendarSync from '../components/calendar/GoogleCalendarSync';
import CalendarContainer from '../components/calendar/CalendarContainer';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [startingBalance, setStartingBalance] = useState(0);
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    total: 0
  });
  
  // Quick add form state
  const [quickAddForm, setQuickAddForm] = useState({
    title: '',
    date: moment().format('YYYY-MM-DD'),
    income: '',
    expenses: '',
    venue: '',
    category: '',
    notes: ''
  });
  
  // Form ref to reset it
  const formRef = useRef(null);
  
  // Update stats when events change
  const updateStats = useCallback((eventList) => {
    // Calculate stats from events
    let totalIncome = 0;
    let totalExpenses = 0;
    
    eventList.forEach(event => {
      totalIncome += Number(event.income) || 0;
      totalExpenses += Number(event.expenses) || 0;
    });
    
    setStats({
      income: totalIncome,
      expenses: totalExpenses,
      total: totalIncome - totalExpenses
    });
    
    console.log('Updated stats:', {
      income: totalIncome,
      expenses: totalExpenses,
      total: totalIncome - totalExpenses
    });
  }, []);
  
  // Update events from calendar
  const handleEventsUpdate = useCallback((updatedEvents) => {
    setEvents(updatedEvents);
    updateStats(updatedEvents);
  }, [updateStats]);
  
  // Handle calendar slot selection - wrapped in useCallback
  const handleCalendarSelect = useCallback(({ start }) => {
    // Update the quick add form with the selected date
    setQuickAddForm(prev => ({
      ...prev,
      date: moment(start).format('YYYY-MM-DD')
    }));
    
    // Scroll to the quick add form
    const quickAddSection = document.getElementById('quick-add-section');
    if (quickAddSection) {
      quickAddSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Handle form field changes - wrapped in useCallback
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setQuickAddForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Handle adding a new event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    
    try {
      // Format data for API
      const eventData = {
        summary: quickAddForm.title,
        description: quickAddForm.notes,
        location: quickAddForm.venue,
        start_time: new Date(quickAddForm.date).toISOString(),
        end_time: new Date(quickAddForm.date).toISOString(),
        all_day: false,
        calendar_id: 1, // Default calendar ID
        // Include financial data
        income: Number(quickAddForm.income) || 0,
        expenses: Number(quickAddForm.expenses) || 0,
        category: quickAddForm.category
      };
      
      console.log('Creating event with data:', eventData);
      
      // Create event in API
      try {
        const response = await axios.post('/api/events', eventData);
        console.log('Event created successfully:', response.data);
        
        // Add the new event to the events state
        const newEvent = {
          id: response.data.event_id || response.data.id || Date.now(),
          title: response.data.summary || response.data.title || eventData.summary,
          start: new Date(response.data.start_time || response.data.start || eventData.start_time),
          end: new Date(response.data.end_time || response.data.end || eventData.end_time),
          allDay: response.data.all_day || response.data.allDay || eventData.all_day || false,
          income: Number(response.data.income || eventData.income) || 0,
          expenses: Number(response.data.expenses || eventData.expenses) || 0,
          venue: response.data.location || response.data.venue || eventData.location,
          description: response.data.description || eventData.description
        };
        
        // Update events and stats
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        updateStats(updatedEvents);
        
        // Success message
        alert('Event added successfully!');
      } catch (error) {
        console.error('API Error creating event:', error);
        
        // Fallback: add locally if API fails
        const newEvent = {
          id: Date.now(),
          title: eventData.summary,
          start: new Date(eventData.start_time),
          end: new Date(eventData.end_time),
          allDay: eventData.all_day || false,
          income: Number(eventData.income) || 0,
          expenses: Number(eventData.expenses) || 0,
          venue: eventData.location,
          description: eventData.description
        };
        
        // Update events and stats
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        updateStats(updatedEvents);
        
        // Show API error but confirm local addition
        alert('Added event locally (API error)');
      }
      
      // Reset form regardless of success/failure
      setQuickAddForm({
        title: '',
        date: moment().format('YYYY-MM-DD'),
        income: '',
        expenses: '',
        venue: '',
        category: '',
        notes: ''
      });
      
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error) {
      console.error('Error in handleAddEvent:', error);
      alert('Failed to add event. Please try again.');
    }
  };
  
  // Handle starting balance change
  const handleBalanceChange = (e) => {
    setStartingBalance(parseFloat(e.target.value) || 0);
  };
  
  // Generate revenue trend data based on actual events
  const getRevenueData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Initialize data structure
    const monthlyData = months.map(month => ({
      month,
      income: 0,
      expenses: 0
    }));
    
    // Fill with actual data from events
    events.forEach(event => {
      const eventDate = new Date(event.start);
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth();
      
      // Only count events from current year
      if (eventYear === currentYear) {
        monthlyData[eventMonth].income += Number(event.income) || 0;
        monthlyData[eventMonth].expenses += Number(event.expenses) || 0;
      }
    });
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          backgroundColor: 'rgba(75, 192, 192, 0.5)'
        },
        {
          label: 'Expenses',
          data: monthlyData.map(d => d.expenses),
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }
      ]
    };
  }, [events]);
  
  // Generate projection data based on actual events
  const getProjectionData = useCallback(() => {
    const today = new Date();
    const projectionDays = [0, 7, 14, 21, 30];
    const projectionData = projectionDays.map(days => {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      
      // Sum income from events between today and target date
      let projectedIncome = 0;
      events.forEach(event => {
        const eventDate = new Date(event.start);
        if (eventDate >= today && eventDate <= targetDate) {
          projectedIncome += Number(event.income) || 0;
        }
      });
      
      return projectedIncome;
    });
    
    return {
      labels: ['Today', '7 Days', '14 Days', '21 Days', '30 Days'],
      datasets: [{
        label: 'Projected Income',
        data: projectionData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: true,
        tension: 0.3
      }]
    };
  }, [events]);
  
  // Calculate analytics metrics based on actual events
  const getAnalyticsMetrics = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Events this month
    const eventsThisMonth = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
    
    // Revenue this month
    const revenueThisMonth = eventsThisMonth.reduce((sum, event) => sum + (Number(event.income) || 0), 0);
    
    // Average event value
    const avgEventValue = eventsThisMonth.length > 0 
      ? revenueThisMonth / eventsThisMonth.length
      : 0;
    
    // Calculate growth rate (compare to previous month)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const eventsLastMonth = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
    });
    
    const revenueLastMonth = eventsLastMonth.reduce((sum, event) => sum + (Number(event.income) || 0), 0);
    
    let growthRate = 0;
    if (revenueLastMonth > 0) {
      growthRate = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
    }
    
    return {
      eventsCount: eventsThisMonth.length,
      revenue: revenueThisMonth,
      avgValue: avgEventValue,
      growthRate: growthRate
    };
  }, [events]);
  
  // Calculate venue performance based on actual events
  const getVenuePerformance = useCallback(() => {
    // Group events by venue
    const venueMap = {};
    
    events.forEach(event => {
      const venueName = event.venue || 'Unknown Venue';
      if (!venueMap[venueName]) {
        venueMap[venueName] = {
          revenue: 0,
          count: 0,
          growth: 0
        };
      }
      
      venueMap[venueName].revenue += Number(event.income) || 0;
      venueMap[venueName].count += 1;
    });
    
    // Sort venues by revenue
    const sortedVenues = Object.entries(venueMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
    
    // Just assign random growth for now (would need historical data to calculate real growth)
    sortedVenues.forEach(venue => {
      venue.growth = Math.floor(Math.random() * 20) - 5; // Random between -5% and +15%
    });
    
    return sortedVenues.slice(0, 3); // Return top 3 venues
  }, [events]);
  
  // Dynamic data for charts and analytics
  const revenueData = getRevenueData();
  const projectionData = getProjectionData();
  const analyticsMetrics = getAnalyticsMetrics();
  const venuePerformance = getVenuePerformance();
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Area */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between bg-gray-700 p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-4">☰</div>
              <h1 className="text-xl font-semibold text-white">CalCalc</h1>
            </div>
            <button
              onClick={() => document.getElementById('sync-modal').classList.toggle('hidden')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Google Calendar Sync
            </button>
            
            {/* Google Calendar Sync Modal */}
            <div id="sync-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Google Calendar Sync</h2>
                  <button
                    onClick={() => document.getElementById('sync-modal').classList.add('hidden')}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <GoogleCalendarSync 
                  onSyncComplete={() => {
                    // Close modal
                    document.getElementById('sync-modal').classList.add('hidden');
                  }}
                />
              </div>
            </div>
          </div>
          <div className="p-4" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
            {/* Pass event update handler to calendar */}
            <CalendarContainer 
              onSelectSlot={handleCalendarSelect} 
              onAddEvent={handleEventsUpdate}
            />
          </div>
        </div>
        
        {/* Analytics Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-white mb-4">Data Analysis</h2>
          <div className="mb-4">
            <label className="block text-white mb-1">
              Starting Balance:
              <input 
                type="number" 
                value={startingBalance}
                onChange={handleBalanceChange}
                className="ml-2 p-1 rounded w-24 text-black"
                step="0.01"
              />
            </label>
          </div>
          <p className="text-white mb-2">Income: <strong>${stats.income.toFixed(2)}</strong></p>
          <p className="text-white mb-2">Expenses: <strong>${stats.expenses.toFixed(2)}</strong></p>
          <p className="text-white mb-4">Total: <strong>${stats.total.toFixed(2)}</strong></p>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Revenue Trend</h3>
            <div className="h-48">
              <Bar data={revenueData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Financial Insights</h3>
            <p className="text-white">Top Earning Month: <strong>May</strong></p>
            <p className="text-white">Projected Income: <strong>${projectionData.datasets[0].data[4].toFixed(2)}</strong></p>
            <p className="text-white">Upcoming High-Paying Events: <strong>{
              events.filter(e => 
                new Date(e.start) >= new Date() && 
                (Number(e.income) || 0) > 1000
              ).length
            }</strong></p>
            <p className="text-white">Best Day for Earnings: <strong>Saturday</strong></p>
            <p className="text-white">Month-to-Month Growth: <strong>{analyticsMetrics.growthRate.toFixed(1)}%</strong></p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Top Venues</h3>
            {venuePerformance.map((venue, index) => (
              <p key={index} className="text-white">{venue.name}: <strong>${venue.revenue.toFixed(2)}</strong> ({venue.growth > 0 ? '+' : ''}{venue.growth.toFixed(1)}%)</p>
            ))}
            {venuePerformance.length === 0 && (
              <p className="text-white">No venue data available</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Quick Add */}
        <div id="quick-add-section" className="bg-gray-800 rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Add Event</h2>
          <form ref={formRef} onSubmit={handleAddEvent}>
            <div className="mb-3">
              <input 
                type="text" 
                name="title"
                placeholder="Event Title" 
                className="w-full p-2 rounded text-black"
                value={quickAddForm.title}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="mb-3">
              <input 
                type="date" 
                name="date"
                className="w-full p-2 rounded text-black"
                value={quickAddForm.date}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="mb-3">
              <input 
                type="number" 
                name="income"
                placeholder="Income" 
                step="0.01" 
                className="w-full p-2 rounded text-black"
                value={quickAddForm.income}
                onChange={handleFormChange}
              />
            </div>
            <div className="mb-3">
              <input 
                type="number" 
                name="expenses"
                placeholder="Expenses" 
                step="0.01" 
                className="w-full p-2 rounded text-black"
                value={quickAddForm.expenses}
                onChange={handleFormChange}
              />
            </div>
            <div className="mb-3">
              <select 
                name="venue"
                className="w-full p-2 rounded text-black"
                value={quickAddForm.venue}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Venue</option>
                <option value="Grand Ballroom">Grand Ballroom</option>
                <option value="City Conference Center">City Conference Center</option>
                <option value="Lakeside Pavilion">Lakeside Pavilion</option>
              </select>
            </div>
            <div className="mb-3">
              <select 
                name="category"
                className="w-full p-2 rounded text-black"
                value={quickAddForm.category}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Wedding">Wedding</option>
                <option value="Club">Club</option>
                <option value="Corporate">Corporate</option>
                <option value="Private Party">Private Party</option>
              </select>
            </div>
            <div className="mb-3">
              <textarea 
                name="notes"
                placeholder="Notes" 
                rows="3" 
                className="w-full p-2 rounded text-black"
                value={quickAddForm.notes}
                onChange={handleFormChange}
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Add Event
            </button>
          </form>
        </div>
        
        {/* Middle Column */}
        <div className="flex flex-col gap-4">
          {/* Upcoming Events */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Upcoming Events</h2>
            {events
              .filter(event => new Date(event.start) >= new Date())
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className="text-white mb-2">
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-sm">{moment(event.start).format('MMM DD, YYYY')} - {event.venue}</div>
                  <div className="text-sm text-green-400">Income: ${Number(event.income).toFixed(2)}</div>
                </div>
              ))}
            {events.filter(event => new Date(event.start) >= new Date()).length === 0 && (
              <p className="text-white">No upcoming events</p>
            )}
          </div>
          
          {/* Income Projection */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-2">Income Projection</h2>
            <p className="text-white mb-4">
              Total Projected Income (Next 30 Days): <strong>${projectionData.datasets[0].data[4].toFixed(2)}</strong>
            </p>
            <div className="h-48">
              <Line data={projectionData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        
        {/* Analytics Column extended */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Analytics</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Events This Month</div>
              <div className="text-xl text-white font-semibold">{analyticsMetrics.eventsCount}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Revenue This Month</div>
              <div className="text-xl text-white font-semibold">${analyticsMetrics.revenue.toFixed(2)}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Avg Event Value</div>
              <div className="text-xl text-white font-semibold">${analyticsMetrics.avgValue.toFixed(2)}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Growth Rate</div>
              <div className="text-xl text-white font-semibold">{analyticsMetrics.growthRate > 0 ? '+' : ''}{analyticsMetrics.growthRate.toFixed(1)}%</div>
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Category Distribution</h3>
            <div className="flex justify-between">
              <div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 mr-2"></div>
                  <span className="text-white">Wedding</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 mr-2"></div>
                  <span className="text-white">Corporate</span>
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 mr-2"></div>
                  <span className="text-white">Club</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 mr-2"></div>
                  <span className="text-white">Private</span>
                </div>
              </div>
            </div>
          </div>
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-2"
            onClick={() => window.location.href = '/analytics'}
          >
            View Full Analytics
          </button>
          <button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
            onClick={() => window.location.href = '/venues'}
          >
            Manage Venues
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;