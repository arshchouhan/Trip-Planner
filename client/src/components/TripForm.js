import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import LocationSearch from './LocationSearch';

const FloatingLabelInput = ({ id, name, type, value, onChange, label, required, min, max, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isOccupied = isFocused || value !== '';
  
  return (
    <div className="relative mb-6">
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        // Only show placeholder when focused and empty
        placeholder={isFocused ? placeholder : ''}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="peer w-full px-4 py-4 border-2 border-border rounded-button focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all duration-300 bg-surface shadow-card hover:shadow-card-hover hover:border-accent-300"
      />
      <label 
        htmlFor={id}
        className={`absolute transition-all duration-300 ${isOccupied 
          ? 'transform -translate-y-[calc(100%+0.15rem)] left-4 text-sm font-semibold text-accent-600 bg-surface px-2 rounded'
          : 'left-4 top-4 text-text-secondary'
        } pointer-events-none`}
      >
        {label}{required && <span className="text-danger-500 ml-1">*</span>}
      </label>
    </div>
  );
};

const TripForm = ({ onSubmit, isLoading }) => {
  const mapRef = useRef(null);
  const [formData, setFormData] = useState({
    days: 3,
    destination: '',
    coordinates: null,
    tripType: 'Historical',
    budget: '',
    travelTime: ''
  });
  
  const tripTypes = [
    { value: 'Historical', label: 'Historical', icon: '🏛️' },
    { value: 'Adventure', label: 'Adventure', icon: '🧗' },
    { value: 'Religious', label: 'Religious', icon: '🕌' },
    { value: 'Nature', label: 'Nature', icon: '🌲' },
    { value: 'Romantic', label: 'Romantic', icon: '💖' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="mb-6">
        <label className="block text-base font-semibold text-text-primary mb-3">
          Destination <span className="text-danger-500">*</span>
        </label>
        <LocationSearch 
          onLocationSelect={(location) => {
            // Set both the destination name and coordinates
            setFormData(prev => ({
              ...prev,
              destination: location.name.split(',')[0], // Use just the main part of the name
              coordinates: location.metadata ? { lat: location.metadata.lat, lon: location.metadata.lon } : null
            }));
          }}
          mapRef={mapRef}
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-base font-semibold text-text-primary mb-3">
          Number of Days <span className="text-danger-500">*</span>
        </label>
        <div className="flex items-center">
          <button 
            type="button" 
            onClick={() => setFormData(prev => ({ ...prev, days: Math.max(1, prev.days - 1) }))} 
            className="h-12 w-12 rounded-l-button bg-accent-100 hover:bg-accent-200 flex items-center justify-center text-accent-700 transition-all duration-300 shadow-card hover:shadow-card-hover font-semibold"
          >
            –
          </button>
          <input
            type="number"
            id="days"
            name="days"
            value={formData.days}
            onChange={handleChange}
            min="1"
            max="14"
            required
            className="h-12 w-24 text-center border-y-2 border-border focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 bg-surface font-semibold text-lg transition-all duration-300"
          />
          <button 
            type="button" 
            onClick={() => setFormData(prev => ({ ...prev, days: Math.min(14, prev.days + 1) }))} 
            className="h-12 w-12 rounded-r-button bg-accent-100 hover:bg-accent-200 flex items-center justify-center text-accent-700 transition-all duration-300 shadow-card hover:shadow-card-hover font-semibold"
          >
            +
          </button>
          <span className="ml-4 text-text-secondary text-base font-medium">(1-14 days)</span>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-base font-semibold text-text-primary mb-3">
          Trip Type <span className="text-danger-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {tripTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tripType: type.value }))}
              className={`p-4 rounded-card border-2 transition-all duration-300 transform hover:scale-105 ${formData.tripType === type.value 
                ? 'border-accent-500 bg-accent-100 text-accent-700 shadow-card-focus' 
                : 'border-border hover:border-accent-300 hover:bg-accent-50 hover:shadow-card-hover bg-surface'}`}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="text-xs font-medium">{type.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <FloatingLabelInput
        id="budget"
        name="budget"
        type="number"
        value={formData.budget}
        onChange={handleChange}
        label="Budget (Optional)"
        placeholder="Your budget in USD"
      />

      <FloatingLabelInput
        id="travelTime"
        name="travelTime"
        type="text"
        value={formData.travelTime}
        onChange={handleChange}
        label="Preferred Time of Travel (Optional)"
        placeholder="e.g., Morning, Evening, Winter"
      />

      <motion.button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 px-8 rounded-button text-white font-semibold text-lg mt-8
          ${ isLoading ? 'bg-accent-400 cursor-not-allowed' : 'bg-accent-500 hover:bg-accent-600'}
          transition-all duration-300 transform hover:scale-[1.02] shadow-card hover:shadow-card-focus focus:outline-none focus:ring-4 focus:ring-accent-200 disabled:transform-none`}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Planning your trip...</span>
          </div>
        ) : 'Plan My Trip'}
      </motion.button>
    </motion.form>
  );
};

export default TripForm;
