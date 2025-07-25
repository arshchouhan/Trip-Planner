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
    <div className="min-h-screen bg-background text-text-primary animate-fade-in">
      <header className="bg-gradient-to-r from-primary via-secondary to-primary text-white shadow-strong">
        <div className="container mx-auto py-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-slide-in-right">
              <div className="h-12 w-12 rounded-full bg-accent/20 backdrop-blur-sm flex items-center justify-center shadow-medium">
                <span className="text-2xl">✈️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Trip Planner
                </h1>
                <p className="text-white/80">Optimize your travel with graph algorithms</p>
              </div>
            </div>
            {step === 2 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent rounded-lg text-white font-medium transition-all shadow-medium flex items-center space-x-2"
                onClick={resetPlanner}
              >
                <span className="text-sm">🔄</span>
                <span>Plan New Trip</span>
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
              <div className="bg-surface rounded-xl shadow-strong overflow-hidden border border-border animate-slide-in-up">
                <div className="p-6 sm:p-10">
                  <h2 className="text-2xl font-bold text-text-primary mb-6">Plan Your Perfect Trip</h2>
                  <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
                  
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 bg-red-50 border-l-4 border-danger p-4 rounded-md animate-bounce-in" 
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
                
                <div className="bg-accent px-6 py-4 sm:px-10">
                  <p className="text-white text-sm">Our algorithm uses graph theory to create the most efficient travel itinerary</p>
                </div>
              </div>
              
              <div className="mt-8 bg-surface/90 backdrop-blur-md rounded-xl shadow-medium p-6 sm:p-8 border border-border animate-slide-in-up">
                <h3 className="text-xl font-semibold text-text-primary mb-4">How It Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="p-4 rounded-lg bg-background border border-border hover:shadow-soft transition-all duration-300 animate-fade-in">
                    <div className="h-12 w-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4 animate-float">
                      <span className="text-accent font-bold">1</span>
                    </div>
                    <h4 className="font-medium text-text-primary mb-2">Input Your Preferences</h4>
                    <p className="text-sm text-text-secondary">Tell us your destination, duration, and trip type</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border hover:shadow-soft transition-all duration-300 animate-fade-in" style={{animationDelay: '0.2s'}}>
                    <div className="h-12 w-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4 animate-float" style={{animationDelay: '1s'}}>
                      <span className="text-accent font-bold">2</span>
                    </div>
                    <h4 className="font-medium text-text-primary mb-2">Algorithm Optimizes</h4>
                    <p className="text-sm text-text-secondary">Our graph algorithm finds the optimal route</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border hover:shadow-soft transition-all duration-300 animate-fade-in" style={{animationDelay: '0.4s'}}>
                    <div className="h-12 w-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4 animate-float" style={{animationDelay: '2s'}}>
                      <span className="text-accent font-bold">3</span>
                    </div>
                    <h4 className="font-medium text-text-primary mb-2">Get Your Itinerary</h4>
                    <p className="text-sm text-text-secondary">Receive a day-by-day optimized travel plan</p>
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
              <div className="bg-surface rounded-xl shadow-strong overflow-hidden border border-border animate-slide-in-up">
                <div className="p-6 sm:p-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-text-primary">
                      Your Trip to {tripData.destination}
                    </h2>
                    <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
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
