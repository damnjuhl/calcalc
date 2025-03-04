import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const AnalyticsDashboard = () => {
  // State for filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('All');
  const [venue, setVenue] = useState('All');
  
  // State for sliders
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);
  const [eventFrequency, setEventFrequency] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    totalIncome: 15000,
    totalExpenses: 5000,
    netProfit: 10000,
    eventCount: 10,
    avgRevenue: 1500
  });
  
  // Filter options
  const categories = ['All', 'Wedding', 'Corporate', 'Club', 'Private Party'];
  const venues = ['All', 'Grand Ballroom', 'City Conference Center', 'Lakeside Pavilion'];
  
  // Apply filters
  const handleApplyFilters = () => {
    // This would fetch data from API with selected filters
    console.log('Applying filters:', { startDate, endDate, category, venue });
    
    // Mock update to metrics based on filters
    setMetrics({
      totalIncome: 15000,
      totalExpenses: 5000,
      netProfit: 10000,
      eventCount: 10,
      avgRevenue: 1500
    });
  };
  
  // Revenue Trend Chart Data
  const revenueTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Actual Revenue',
        data: [2000, 2200, 2100, 2300, 2500, 2700],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: true,
      },
      {
        label: 'Forecasted Revenue',
        data: [2000, 2200, 2100, 2300, 2600, 2800],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderDash: [5, 5],
        fill: false,
      }
    ],
  };
  
  // Event Type Breakdown Data
  const eventTypeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Wedding',
        data: [1000, 1200, 1100, 1300, 1500, 1400],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Corporate',
        data: [800, 600, 700, 900, 800, 1000],
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
      },
      {
        label: 'Club',
        data: [400, 500, 400, 300, 600, 500],
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      }
    ],
  };
  
  // Event Distribution Pie Chart
  const eventDistributionData = {
    labels: ['Wedding', 'Corporate', 'Club', 'Private Party'],
    datasets: [
      {
        data: [40, 30, 20, 10],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 205, 86, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 205, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Revenue by Venue Chart
  const revenueByVenueData = {
    labels: ['Grand Ballroom', 'Conference Center', 'Outdoor Garden', 'Club Lounge'],
    datasets: [
      {
        label: 'Revenue',
        data: [14000, 12000, 9000, 7000],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        barPercentage: 0.6,
      }
    ],
  };
  
  // Year-over-Year Comparison
  const yearOverYearData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'This Year',
        data: [15000, 20000, 18000, 22000],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Last Year',
        data: [12000, 17000, 15000, 18000],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      }
    ],
  };
  
  // ROI by Category
  const roiCategoryData = {
    labels: ['Wedding', 'Corporate', 'Club', 'Private', 'Holiday', 'Other'],
    datasets: [
      {
        label: 'ROI %',
        data: [22, 18, 20, 15, 12, 10],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      }
    ],
  };
  
  // ROI Trend
  const roiTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Wedding ROI',
        data: [22, 23, 21, 24, 22, 23],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: false,
      },
      {
        label: 'Corporate ROI',
        data: [18, 19, 17, 20, 18, 19],
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        fill: false,
      },
      {
        label: 'Club ROI',
        data: [15, 16, 15, 17, 16, 18],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        fill: false,
      }
    ],
  };
  
  // Quarterly Comparison
  const quarterlyData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Income',
        data: [15000, 18000, 16000, 19000],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Expenses',
        data: [8000, 9000, 8500, 10000],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      }
    ],
  };
  
  // Venue Revenue Growth
  const venueGrowthData = {
    labels: ['2018', '2019', '2020', '2021', '2022', '2023'],
    datasets: [
      {
        label: 'Grand Ballroom',
        data: [12000, 15000, 14000, 18000, 20000, 22000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: false,
      },
      {
        label: 'Conference Center',
        data: [10000, 12000, 11000, 14000, 16000, 18000],
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        fill: false,
      },
      {
        label: 'Club Lounge',
        data: [8000, 9000, 8500, 10000, 11000, 12000],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        fill: false,
      }
    ],
  };
  
  // Sensitivity Forecast Chart
  const sensitivityForecastData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Adjusted Forecast Revenue',
        data: [2000, 2200, 2400, 2600, 2800, 3000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }
    ],
  };
  
  // Handle slider changes
  const handleSliderChange = (name, value) => {
    switch(name) {
      case 'revenueGrowth':
        setRevenueGrowth(value);
        break;
      case 'expenseChange':
        setExpenseChange(value);
        break;
      case 'eventFrequency':
        setEventFrequency(value);
        break;
      case 'taxRate':
        setTaxRate(value);
        break;
      default:
        break;
    }
    
    // Recalculate adjusted metrics based on sliders
    const adjustedIncome = metrics.totalIncome * (1 + (revenueGrowth / 100));
    const adjustedExpenses = metrics.totalExpenses * (1 + (expenseChange / 100));
    const adjustedNetProfit = adjustedIncome - adjustedExpenses;
    const taxAmount = adjustedNetProfit * (taxRate / 100);
    
    setMetrics({
      ...metrics,
      adjustedIncome,
      adjustedExpenses,
      adjustedNetProfit,
      netProfitAfterTax: adjustedNetProfit - taxAmount
    });
  };
  
  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-semibold text-center mb-2">Robust Analytics Dashboard</h1>
      <p className="text-center text-gray-300 mb-6">Advanced Income Analysis & Projection</p>
      
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm mb-1">Start Date:</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End Date:</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Category:</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Venue:</label>
            <select 
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              {venues.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <button 
              onClick={handleApplyFilters}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      
      {/* Overview & Forecast */}
      <h2 className="text-xl font-semibold mb-4">Overview & Forecast</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-center">
          <h3 className="text-sm text-gray-400 mb-1">Total Income</h3>
          <p className="text-2xl font-semibold">${metrics.totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-center">
          <h3 className="text-sm text-gray-400 mb-1">Total Expenses</h3>
          <p className="text-2xl font-semibold">${metrics.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-center">
          <h3 className="text-sm text-gray-400 mb-1">Net Profit</h3>
          <p className="text-2xl font-semibold">${metrics.netProfit.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-center">
          <h3 className="text-sm text-gray-400 mb-1"># Events</h3>
          <p className="text-2xl font-semibold">{metrics.eventCount}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-center">
          <h3 className="text-sm text-gray-400 mb-1">Avg Revenue</h3>
          <p className="text-2xl font-semibold">${metrics.avgRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Revenue Trend & Forecast */}
      <h2 className="text-xl font-semibold mb-4">Revenue Trend & Forecast</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
        <div className="h-80">
          <Line data={revenueTrendData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
      
      {/* Data Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Breakdown by Categories & Venues */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Breakdown by Categories & Venues</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">Event Type Breakdown</h3>
            <div className="h-64">
              <Bar data={eventTypeData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Event Distribution</h3>
            <div className="h-64">
              <Pie data={eventDistributionData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        
        {/* Additional Insights */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Additional Insights</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Revenue by Venue</h3>
            <div className="h-64">
              <Bar 
                data={revenueByVenueData} 
                options={{ 
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                }} 
              />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Venue Revenue Growth</h3>
            <div className="h-64">
              <Line data={venueGrowthData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Historical Comparisons & ROI Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Historical Comparisons */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Historical Comparisons</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">Year-over-Year Comparison</h3>
            <div className="h-64">
              <Bar data={yearOverYearData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Quarterly Comparison</h3>
            <div className="h-64">
              <Bar data={quarterlyData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        
        {/* Variance & ROI Analysis */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Variance & ROI Analysis</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">ROI & Profit Margin by Category</h3>
            <div className="h-64">
              <Bar data={roiCategoryData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-2">ROI Trend by Category</h3>
            <div className="h-64">
              <Line data={roiTrendData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-center">
              <h3 className="text-sm text-gray-400 mb-1">Profit Margin</h3>
              <p className="text-2xl font-semibold">67%</p>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-center">
              <h3 className="text-sm text-gray-400 mb-1">Average ROI</h3>
              <p className="text-2xl font-semibold">22.5%</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* What-If Scenarios */}
      <h2 className="text-xl font-semibold mb-4">What-If Scenarios</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm mb-2">
              Revenue Growth (%): {revenueGrowth}%
            </label>
            <input 
              type="range" 
              min="-20" 
              max="20" 
              value={revenueGrowth} 
              onChange={(e) => handleSliderChange('revenueGrowth', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">
              Expense Change (%): {expenseChange}%
            </label>
            <input 
              type="range" 
              min="-20" 
              max="20" 
              value={expenseChange} 
              onChange={(e) => handleSliderChange('expenseChange', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">
              Event Frequency (%): {eventFrequency}%
            </label>
            <input 
              type="range" 
              min="-20" 
              max="20" 
              value={eventFrequency} 
              onChange={(e) => handleSliderChange('eventFrequency', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">
              Tax Rate (%): {taxRate}%
            </label>
            <input 
              type="range" 
              min="0" 
              max="40" 
              value={taxRate} 
              onChange={(e) => handleSliderChange('taxRate', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Sensitivity Forecast</h3>
        <div className="h-64 mb-6">
          <Line data={sensitivityForecastData} options={{ maintainAspectRatio: false }} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <h3 className="text-sm text-gray-400 mb-1">Adjusted Income</h3>
            <p className="text-xl font-semibold">${metrics.adjustedIncome?.toLocaleString() || metrics.totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <h3 className="text-sm text-gray-400 mb-1">Adjusted Expenses</h3>
            <p className="text-xl font-semibold">${metrics.adjustedExpenses?.toLocaleString() || metrics.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <h3 className="text-sm text-gray-400 mb-1">Adjusted Net Profit</h3>
            <p className="text-xl font-semibold">${metrics.adjustedNetProfit?.toLocaleString() || metrics.netProfit.toLocaleString()}</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <h3 className="text-sm text-gray-400 mb-1">Net Profit (After Tax)</h3>
            <p className="text-xl font-semibold">${metrics.netProfitAfterTax?.toLocaleString() || metrics.netProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;