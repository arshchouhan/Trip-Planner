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
        className="peer w-full px-3 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-accent transition-colors bg-surface/70 backdrop-blur-sm hover:border-accent/50"
      />
      <label 
        htmlFor={id}
        className={`absolute transition-all duration-200 ${isOccupied 
          ? 'transform -translate-y-[calc(100%+0.15rem)] left-3 text-xs font-semibold text-accent bg-surface px-1'
          : 'left-3 top-3 text-text-secondary'
        } pointer-events-none`}
      >
        {label}{required && <span className="text-red-500 ml-1">*</span>}
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
        <label className="block text-sm font-medium text-text-primary mb-2">
          Destination <span className="text-danger">*</span>
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
        <label className="block text-sm font-medium text-text-primary mb-2">
          Number of Days <span className="text-danger">*</span>
        </label>
        <div className="flex items-center">
          <button 
            type="button" 
            onClick={() => setFormData(prev => ({ ...prev, days: Math.max(1, prev.days - 1) }))} 
            className="h-10 w-10 rounded-l-lg bg-accent/20 hover:bg-accent/30 flex items-center justify-center text-accent transition-colors"
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
            className="h-10 w-20 text-center border-y-2 border-border focus:outline-none focus:border-accent bg-surface"
          />
          <button 
            type="button" 
            onClick={() => setFormData(prev => ({ ...prev, days: Math.min(14, prev.days + 1) }))} 
            className="h-10 w-10 rounded-r-lg bg-accent/20 hover:bg-accent/30 flex items-center justify-center text-accent transition-colors"
          >
            +
          </button>
          <span className="ml-3 text-text-secondary text-sm">(1-14 days)</span>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">
          Trip Type <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {tripTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tripType: type.value }))}
              className={`p-2 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${formData.tripType === type.value 
                ? 'border-accent bg-accent/10 text-accent shadow-soft' 
                : 'border-border hover:border-accent hover:bg-accent/10 hover:shadow-soft'}`}
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
        className={`w-full py-3 px-6 rounded-lg text-white font-medium mt-6
          ${ isLoading ? 'bg-accent/70' : 'bg-accent hover:bg-accent-hover'}
          transition-all duration-300 transform hover:scale-[1.01] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent`}
        whileHover={{ scale: isLoading ? 1 : 1.01 }}
        whileTap={{ scale: isLoading ? 1 : 0.99 }}
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
