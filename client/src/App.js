import React, { useState } from 'react';
import './App.css';
import TripForm from './components/TripForm';
import TripSummary from './components/TripSummary';
import { planTrip } from './api/tripApi';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: Results

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    
    // Debug logging for form data
    console.log('Submitting form data to backend:', formData);
    console.log('Coordinates being sent:', formData.coordinates);
    
    try {
      const response = await planTrip(formData);
      console.log('Response from backend:', response);
      
      if (response.success) {
        console.log('Backend POIs and itinerary:', response.data.itinerary);
        setTripData({
          ...response.data,
          formData
        });
        setStep(2); // Move to results page on success
      } else {
        setError(response.message || 'Failed to plan trip');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while planning your trip');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPlanner = () => {
    setTripData(null);
    setError(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto py-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                Trip Planner
              </h1>
              <p className="text-blue-100">Optimize your travel with graph algorithms</p>
            </div>
            {step === 2 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-md text-white font-medium transition-all"
                onClick={resetPlanner}
              >
                Plan New Trip
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6 sm:p-10">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Plan Your Perfect Trip</h2>
                  <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
                  
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md" 
                        role="alert"
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 sm:px-10">
                  <p className="text-white text-sm">Our algorithm uses graph theory to create the most efficient travel itinerary</p>
                </div>
              </div>
              
              <div className="mt-8 bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">How It Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Input Your Preferences</h4>
                    <p className="text-sm text-gray-600">Tell us your destination, duration, and trip type</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <span className="text-indigo-600 font-bold">2</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Algorithm Optimizes</h4>
                    <p className="text-sm text-gray-600">Our graph algorithm finds the optimal route</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-violet-50 border border-violet-100">
                    <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                      <span className="text-violet-600 font-bold">3</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Get Your Itinerary</h4>
                    <p className="text-sm text-gray-600">Receive a day-by-day optimized travel plan</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6 sm:p-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Your Trip to {tripData.destination}
                    </h2>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                      {tripData.tripType} Trip • {tripData.days} Days
                    </span>
                  </div>
                  
                  <TripSummary 
                    itinerary={tripData.itinerary}
                    destination={tripData.destination}
                    tripType={tripData.tripType}
                    days={tripData.days}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>Trip Planner - Powered by Graph Algorithms</p>
          <p className="text-sm mt-2">© {new Date().getFullYear()} - Data Structures and Algorithms Project</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
