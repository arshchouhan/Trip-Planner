import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import MapComponent from './MapComponent';
import TripForm from './TripForm';

/**
 * MapView component that combines the map, search functionality and trip form
 * This serves as the main interface for users to plan their trips
 */
const MapView = ({ onPlanTrip, isLoading }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handlePlanTrip = (formData) => {
    // Combine form data with selected location coordinates
    if (selectedLocation && selectedLocation.metadata) {
      const enhancedFormData = {
        ...formData,
        coordinates: {
          lat: selectedLocation.metadata.lat,
          lon: selectedLocation.metadata.lon
        }
      };
      onPlanTrip(enhancedFormData);
    } else {
      onPlanTrip(formData); // Fallback to just using the form data
    }
  };

  return (
    <div className="container mx-auto p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="flex flex-col md:flex-row">
          {/* Map section (takes 60% on larger screens) */}
          <div className="w-full md:w-3/5">
            <MapComponent 
              onLocationSelect={handleLocationSelect} 
              ref={mapRef}
            />
          </div>
          
          {/* Trip form section (takes 40% on larger screens) */}
          <div className="w-full md:w-2/5 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Plan Your Trip</h2>
            <TripForm 
              onSubmit={handlePlanTrip} 
              isLoading={isLoading} 
              preselectedLocation={selectedLocation}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MapView;
