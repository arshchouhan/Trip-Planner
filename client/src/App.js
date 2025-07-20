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
    <div className="min-h-screen bg-primary-50 text-text-primary animate-fade-in">
      <header className="bg-primary-800 text-white shadow-strong">
        <div className="container mx-auto py-8 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="animate-slide-in-right">
              <h1 className="text-3xl font-bold text-white">
                Trip Planner
              </h1>
              <p className="text-primary-200 text-lg">Optimize your travel with graph algorithms</p>
            </div>
            {step === 2 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 rounded-button text-white font-semibold transition-all duration-300 shadow-card hover:shadow-card-hover"
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
              <div className="bg-surface rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden border border-border animate-slide-in-up">
                <div className="p-8 sm:p-12">
                  <h2 className="text-3xl font-bold text-text-primary mb-8">Plan Your Perfect Trip</h2>
                  <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
                  
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 bg-danger-50 border-l-4 border-danger-500 p-4 rounded-card animate-bounce-in" 
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
                
                <div className="bg-accent-500 px-8 py-6 sm:px-12">
                  <p className="text-white text-base font-medium">Our algorithm uses graph theory to create the most efficient travel itinerary</p>
                </div>
              </div>
              
              <div className="mt-12 bg-surface rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-300 p-8 sm:p-10 border border-border animate-slide-in-up">
                <h3 className="text-2xl font-bold text-text-primary mb-8 text-center">How It Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                  <div className="p-6 rounded-card bg-primary-50 border border-primary-100 hover:shadow-card-hover hover:bg-primary-100 transition-all duration-300 animate-fade-in group">
                    <div className="h-16 w-16 mx-auto rounded-full bg-accent-500 flex items-center justify-center mb-6 animate-float shadow-card group-hover:shadow-glow">
                      <span className="text-white font-bold text-xl">1</span>
                    </div>
                    <h4 className="font-semibold text-lg text-text-primary mb-3">Input Your Preferences</h4>
                    <p className="text-base text-text-secondary leading-relaxed">Tell us your destination, duration, and trip type</p>
                  </div>
                  <div className="p-6 rounded-card bg-primary-50 border border-primary-100 hover:shadow-card-hover hover:bg-primary-100 transition-all duration-300 animate-fade-in group" style={{animationDelay: '0.2s'}}>
                    <div className="h-16 w-16 mx-auto rounded-full bg-success-500 flex items-center justify-center mb-6 animate-float shadow-card group-hover:shadow-glow" style={{animationDelay: '1s'}}>
                      <span className="text-white font-bold text-xl">2</span>
                    </div>
                    <h4 className="font-semibold text-lg text-text-primary mb-3">Algorithm Optimizes</h4>
                    <p className="text-base text-text-secondary leading-relaxed">Our graph algorithm finds the optimal route</p>
                  </div>
                  <div className="p-6 rounded-card bg-primary-50 border border-primary-100 hover:shadow-card-hover hover:bg-primary-100 transition-all duration-300 animate-fade-in group" style={{animationDelay: '0.4s'}}>
                    <div className="h-16 w-16 mx-auto rounded-full bg-warning-500 flex items-center justify-center mb-6 animate-float shadow-card group-hover:shadow-glow" style={{animationDelay: '2s'}}>
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                    <h4 className="font-semibold text-lg text-text-primary mb-3">Get Your Itinerary</h4>
                    <p className="text-base text-text-secondary leading-relaxed">Receive a day-by-day optimized travel plan</p>
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
              <div className="bg-surface rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden border border-border animate-slide-in-up">
                <div className="p-8 sm:p-12">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-text-primary">
                      Your Trip to {tripData.destination}
                    </h2>
                    <span className="px-4 py-2 bg-accent-100 text-accent-700 rounded-button text-base font-semibold border border-accent-200">
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
      
      <footer className="bg-primary text-gray-300 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>Trip Planner - Powered by Graph Algorithms</p>
          <p className="text-sm mt-2">© {new Date().getFullYear()} - Data Structures and Algorithms Project</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
