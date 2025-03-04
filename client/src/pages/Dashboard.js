import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [startingBalance, setStartingBalance] = useState(0);
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    total: 0
  });
  
  // Fetch events data from API
  useEffect(() => {
    // This would be replaced with actual API call
    const fetchEvents = async () => {
      try {
        // const response = await axios.get('/api/events');
        // setEvents(response.data);
        
        // Mock data for now
        setEvents([
          {
            id: 1,
            title: 'Wedding at Grand Ballroom',
            start: new Date(2025, 2, 15),
            end: new Date(2025, 2, 16),
            income: 3000,
            expenses: 800
          },
          {
            id: 2,
            title: 'Corporate Event',
            start: new Date(2025, 2, 20),
            end: new Date(2025, 2, 20),
            income: 2500,
            expenses: 600
          }
        ]);
        
        setStats({
          income: 5500,
          expenses: 1400,
          total: 4100
        });
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Revenue trend chart data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: [500, 700, 800, 600, 900, 750],
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      },
      {
        label: 'Expenses',
        data: [300, 400, 500, 450, 650, 500],
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      }
    ]
  };
  
  // Income projection chart data
  const projectionData = {
    labels: ['Today', '7 Days', '14 Days', '21 Days', '30 Days'],
    datasets: [{
      label: 'Projected Income',
      data: [500, 1000, 1800, 2500, 3000],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      fill: true,
      tension: 0.3
    }]
  };
  
  // Handle adding a new event
  const handleAddEvent = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newEvent = {
      title: formData.get('title'),
      start: new Date(formData.get('date')),
      end: new Date(formData.get('date')),
      income: parseFloat(formData.get('income') || 0),
      expenses: parseFloat(formData.get('expenses') || 0),
      venue: formData.get('venue'),
      category: formData.get('category'),
      notes: formData.get('notes')
    };
    
    // This would be replaced with actual API call
    // axios.post('/api/events', newEvent)
    //   .then(response => {
    //     setEvents([...events, response.data]);
    //   })
    //   .catch(error => {
    //     console.error('Error adding event:', error);
    //   });
    
    // For now, just add to state
    newEvent.id = Date.now(); // temporary ID
    setEvents([...events, newEvent]);
    
    // Update stats
    setStats({
      income: stats.income + newEvent.income,
      expenses: stats.expenses + newEvent.expenses,
      total: stats.total + (newEvent.income - newEvent.expenses)
    });
    
    // Reset form
    event.target.reset();
  };
  
  // Handle starting balance change
  const handleBalanceChange = (e) => {
    setStartingBalance(parseFloat(e.target.value) || 0);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Area */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center bg-gray-700 p-4">
            <div className="text-2xl mr-4">☰</div>
            <h1 className="text-xl font-semibold text-white">CalCalc</h1>
            <p className="ml-auto text-white">Google Calendar Sync</p>
          </div>
          <div className="p-4 h-96">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
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
            <p className="text-white">Projected Income: <strong>$3,000</strong></p>
            <p className="text-white">Upcoming High-Paying Events: <strong>2</strong></p>
            <p className="text-white">Best Day for Earnings: <strong>Saturday</strong></p>
            <p className="text-white">Month-to-Month Growth: <strong>+12%</strong></p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Top Venues</h3>
            <p className="text-white">Grand Ballroom: <strong>$3,000</strong> (+10%)</p>
            <p className="text-white">City Conference Center: <strong>$2,500</strong> (-5%)</p>
            <p className="text-white">Lakeside Pavilion: <strong>$2,000</strong> (+7%)</p>
          </div>
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Quick Add */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Add Event</h2>
          <form onSubmit={handleAddEvent}>
            <div className="mb-3">
              <input 
                type="text" 
                name="title"
                placeholder="Event Title" 
                className="w-full p-2 rounded text-black"
                required
              />
            </div>
            <div className="mb-3">
              <input 
                type="date" 
                name="date"
                className="w-full p-2 rounded text-black"
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
              />
            </div>
            <div className="mb-3">
              <input 
                type="number" 
                name="expenses"
                placeholder="Expenses" 
                step="0.01" 
                className="w-full p-2 rounded text-black"
              />
            </div>
            <div className="mb-3">
              <select 
                name="venue"
                className="w-full p-2 rounded text-black"
                required
              >
                <option value="" disabled selected>Select Venue</option>
                <option value="Grand Ballroom">Grand Ballroom</option>
                <option value="City Conference Center">City Conference Center</option>
                <option value="Lakeside Pavilion">Lakeside Pavilion</option>
              </select>
            </div>
            <div className="mb-3">
              <select 
                name="category"
                className="w-full p-2 rounded text-black"
                required
              >
                <option value="" disabled selected>Select Category</option>
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
            {events.map(event => (
              <div key={event.id} className="text-white mb-2">
                {event.title} - {event.venue} - ${event.income}
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-white">No upcoming events</p>
            )}
          </div>
          
          {/* Income Projection */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-2">Income Projection</h2>
            <p className="text-white mb-4">
              Total Projected Income (Next 30 Days): <strong>$3,000.00</strong>
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
              <div className="text-xl text-white font-semibold">7</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Revenue This Month</div>
              <div className="text-xl text-white font-semibold">$5,200</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Avg Event Value</div>
              <div className="text-xl text-white font-semibold">$743</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Growth Rate</div>
              <div className="text-xl text-white font-semibold">+12%</div>
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