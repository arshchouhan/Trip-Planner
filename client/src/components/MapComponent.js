import React, { useEffect, useRef, useState } from 'react';
import LocationSearch from './LocationSearch';

/**
 * Map component using Leaflet.js
 * Displays a map and integrates with LocationSearch for search and suggestions
 */
const MapComponent = ({ onLocationSelect }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize the map
  useEffect(() => {
    // Ensure Leaflet is loaded before initializing the map
    if (!window.L) {
      // Load Leaflet CSS and JS if not already loaded
      const loadLeaflet = async () => {
        // Create link for Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Create script for Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        document.body.appendChild(script);

        // Wait for script to load
        return new Promise((resolve) => {
          script.onload = resolve;
        });
      };

      loadLeaflet().then(() => {
        initializeMap();
      });
    } else {
      initializeMap();
    }

    return () => {
      // Clean up map when component unmounts
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Initialize the map with Leaflet
  const initializeMap = () => {
    if (!window.L || !mapContainerRef.current) return;

    // Create map
    const L = window.L;
    const map = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 5); // Default to Delhi, India

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Save map reference
    mapRef.current = map;
    setMapLoaded(true);

    // Add a default welcome popup
    L.popup()
      .setLatLng([28.6139, 77.2090])
      .setContent('<p>Search for a destination to begin planning your trip!</p>')
      .openOn(map);
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 bg-surface shadow-medium z-10 border-b border-border">
        <LocationSearch 
          onLocationSelect={handleLocationSelect} 
          mapRef={mapRef}
        />
      </div>

      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="flex-grow w-full" 
        style={{ minHeight: '400px', height: '70vh' }}
      >
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-surface border-t border-border shadow-soft">
        <h3 className="text-lg font-semibold mb-2 text-text-primary">Instructions</h3>
        <ul className="text-sm text-text-secondary">
          <li className="mb-1">• Search for a destination in the search box above</li>
          <li className="mb-1">• Select from the suggestions that appear</li>
          <li className="mb-1">• A marker will be placed on the map for your selected location</li>
          <li>• Click "Plan Trip" to create an itinerary for your selected destination</li>
        </ul>
      </div>
    </div>
  );
};

export default MapComponent;
