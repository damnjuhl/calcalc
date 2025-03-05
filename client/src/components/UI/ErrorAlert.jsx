// src/components/UI/ErrorAlert.jsx
import React from 'react';

const ErrorAlert = ({ message, onRetry }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
    <strong className="font-bold">Error! </strong>
    <span className="block sm:inline">{message}</span>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorAlert;