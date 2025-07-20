import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TripSummary = ({ itinerary, destination, tripType, days }) => {
  // Always define hooks at the top level before any conditional returns
  const [expandedDay, setExpandedDay] = useState(0); // Default to first day expanded
  
  // Helper icons
  const icons = {
    historical: <span>🏛️</span>,
    adventure: <span>🧗</span>,
    religious: <span>🕌</span>,
    nature: <span>🌲</span>,
    romantic: <span>💖</span>,
    visit: <span>⏱️</span>,
    travel: <span>🚗</span>,
    rating: <span>⭐</span>,
    location: <span>📍</span>,
    calendar: <span>📅</span>
  };
  
  if (!itinerary || !itinerary.length) {
    return null;
  }

  // Helper function to format time (convert decimal hours to hours and minutes)
  const formatTime = (timeInHours) => {
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  };

  // Calculate total visit time and travel time for the trip
  const calculateTripStats = () => {
    let totalVisitTime = 0;
    let totalTravelTime = 0;
    
    itinerary.forEach(day => {
      day.forEach(place => {
        totalVisitTime += place.visitDuration || 0;
        totalTravelTime += place.travelTimeToNext || 0;
      });
    });
    
    return {
      totalVisitTime: formatTime(totalVisitTime),
      totalTravelTime: formatTime(totalTravelTime),
      totalTime: formatTime(totalVisitTime + totalTravelTime)
    };
  };

  const tripStats = calculateTripStats();

  const toggleDay = (dayIndex) => {
    setExpandedDay(expandedDay === dayIndex ? -1 : dayIndex);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="p-0 sm:p-4 rounded-xl">
        {/* Trip Statistics */}
        <div className="mb-6 px-4 py-5 bg-gradient-to-br from-secondary to-accent backdrop-blur-sm text-white rounded-xl shadow-strong">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-1 flex items-center">
                {icons[tripType.toLowerCase()]} <span className="ml-2">Your {tripType} Trip to {destination}</span>
              </h3>
              <p className="text-white font-light">{days}-day optimized itinerary</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/30 backdrop-blur-md rounded-lg px-4 py-2 text-center flex items-center shadow-soft">
                <span className="mr-2 text-xl">📍</span>
                <div>
                  <p className="text-xs text-white">Destination</p>
                  <p className="font-medium">{destination}</p>
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-lg px-4 py-2 text-center flex items-center shadow-soft">
                <span className="mr-2 text-xl">⏱️</span>
                <div>
                  <p className="text-xs text-white">Visit Time</p>
                  <p className="font-medium">{tripStats.totalVisitTime}</p>
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-lg px-4 py-2 text-center flex items-center shadow-soft">
                <span className="mr-2 text-xl">🚗</span>
                <div>
                  <p className="text-xs text-white">Travel Time</p>
                  <p className="font-medium">{tripStats.totalTravelTime}</p>
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-lg px-4 py-2 text-center flex items-center shadow-soft">
                <span className="mr-2 text-xl">{icons.calendar}</span>
                <div>
                  <p className="text-xs text-white">Total Time</p>
                  <p className="font-medium">{tripStats.totalTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress timeline */}
        <div className="mb-6 px-1">
          <div className="flex justify-between items-center overflow-x-auto pb-3 hide-scrollbar">
            {itinerary.map((day, idx) => (
              <motion.button
                key={`day-btn-${idx}`}
                onClick={() => toggleDay(idx)}
                className={`flex flex-col items-center min-w-[60px] ${expandedDay === idx ? 'scale-110' : 'opacity-70'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1
                    ${expandedDay === idx 
                      ? 'bg-accent text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600'}`}
                >
                  {idx + 1}
                </div>
                <span className={`text-xs font-medium ${expandedDay === idx ? 'text-accent-dark' : 'text-gray-500'}`}>Day {idx + 1}</span>
              </motion.button>
            ))}
          </div>
          {/* Progress bar */}
          <div className="relative h-1.5 bg-gray-200 rounded-full mt-2">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-accent rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((expandedDay + 1) / itinerary.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      
        {/* Day-by-day Itinerary */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {itinerary.map((day, dayIndex) => (
              expandedDay === dayIndex && (
                <motion.div 
                  key={`day-${dayIndex}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-medium border border-border overflow-hidden"
                >
                  <div onClick={() => toggleDay(dayIndex)} className={`flex justify-between items-center p-4 cursor-pointer rounded-t-lg transition-colors ${ expandedDay === dayIndex ? 'bg-accent/20 text-accent' : 'bg-white hover:bg-accent/5' }`}>
                    <h4 className="font-semibold flex items-center">
                      <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center mr-3">
                        {dayIndex + 1}
                      </span>
                      Day {dayIndex + 1}
                    </h4>
                    <div className="text-xs px-2 py-1 bg-accent/20 text-accent font-medium rounded-full">
                      {day.length} {day.length === 1 ? 'Location' : 'Locations'}
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {day.map((place, placeIndex) => (
                      <motion.div 
                        key={`place-${place.id}-${dayIndex}-${placeIndex}`} 
                        className="p-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: placeIndex * 0.1 }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            <div className="h-10 w-10 bg-gradient-to-br from-gradient-start to-gradient-end text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 shadow-medium">
                              {placeIndex + 1}
                            </div>
                            <div>
                              <h5 className="font-medium text-text-primary">{place.name}</h5>
                              <div className="text-sm text-text-secondary mt-2 space-y-1">
                                <p className="flex items-center">
                                  {icons.visit} <span className="ml-2">Visit duration: {formatTime(place.visitDuration)}</span>
                                </p>
                                {place.rating && (
                                  <p className="flex items-center">
                                    {icons.rating} <span className="ml-2">Rating: {place.rating}/5</span>
                                  </p>
                                )}
                                {place.location && place.location.lat !== 0 && place.location.lng !== 0 ? (
                                  <p className="flex items-center">
                                    {icons.location} <span className="ml-2">Location: {place.location.lat.toFixed(4)}, {place.location.lng.toFixed(4)}</span>
                                  </p>
                                ) : place.location ? (
                                  <p className="flex items-center text-yellow-600">
                                    {icons.location} <span className="ml-2">Location data needs updating</span>
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Show travel time to next location */}
                        {place.travelTimeToNext && placeIndex < day.length - 1 && (
                          <div className="mt-3 ml-12 flex items-center text-sm text-text-secondary">
                            <div className="mr-2">{icons.travel}</div>
                            <div className="flex-1">
                              <p className="font-medium">Travel to next location: {formatTime(place.travelTimeToNext)}</p>
                              <div className="relative w-full h-0.5 bg-border my-2">
                                <div className="absolute top-0 left-0 h-full bg-accent/40" style={{ width: '100%' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {day.length === 0 && (
                      <div className="p-6 text-center text-text-secondary">
                        <span className="text-2xl block mb-2">🏖️</span>
                        <p>Free day! No activities scheduled - explore on your own.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Trip Notes */}
        <motion.div 
          className="mt-6 p-5 bg-primary/5 border border-border rounded-xl shadow-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h4 className="font-semibold text-text-primary mb-3 flex items-center">
            <span className="text-lg mr-2">💡</span> Trip Notes
          </h4>
          <ul className="text-sm text-text-secondary space-y-2 ml-7">
            <li className="relative">             
              <span className="absolute -left-7 top-0">🗺️</span>
              This itinerary has been optimized to minimize travel time between locations.
            </li>
            <li className="relative">
              <span className="absolute -left-7 top-0">⏱️</span>
              Visit durations are estimates and can be adjusted according to your preferences.
            </li>
            <li className="relative">
              <span className="absolute -left-7 top-0">🚦</span>
              Consider local traffic conditions which may affect actual travel times.
            </li>
            <li className="relative">
              <span className="absolute -left-7 top-0">🌦️</span>
              Weather conditions may affect your experience at certain locations.
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TripSummary;
