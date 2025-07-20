import React, { useState, useEffect, useRef } from 'react';
import Trie from '../utils/TrieDataStructure';
import debounce from 'lodash.debounce';

// Create a new Trie instance
const locationTrie = new Trie();

/**
 * LocationSearch component with auto-suggestions using Trie data structure
 * and real-time location search via Nominatim API
 */
const LocationSearch = ({ onLocationSelect, mapRef }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      recentSearches.forEach(place => {
        locationTrie.insert(place.name, place.metadata);
      });
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Handle clicks outside the suggestions dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Search for locations in the Nominatim API
   * @param {string} searchQuery - The search query
   */
  const searchLocations = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First check Trie for local matches
      const trieResults = locationTrie.searchPrefix(searchQuery);
      
      // If we have local results, use them
      if (trieResults.length > 0) {
        setSuggestions(trieResults);
        setLoading(false);
        return;
      }
      
      // Otherwise, search using Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and store the results in our Trie
      const results = data.map((place) => {
        const placeName = place.display_name;
        const metadata = {
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
          displayName: place.display_name,
          osmId: place.osm_id,
          type: place.type,
          importance: place.importance
        };
        
        // Add to Trie for future searches
        locationTrie.insert(placeName, metadata);
        
        return {
          name: placeName,
          metadata: metadata
        };
      });

      setSuggestions(results);
    } catch (error) {
      console.error('Error searching locations:', error);
      
      // Try fuzzy search as a fallback
      const fuzzyResults = locationTrie.fuzzySearch(searchQuery);
      setSuggestions(fuzzyResults);
    } finally {
      setLoading(false);
    }
  };

  // Debounce the search function to avoid excessive API calls
  const debouncedSearch = useRef(
    debounce((searchQuery) => {
      searchLocations(searchQuery);
    }, 300)
  ).current;

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.name.split(',')[0]); // Just show the first part of the name
    setShowSuggestions(false);
    
    // Call the callback with the selected location
    if (onLocationSelect) {
      onLocationSelect(suggestion);
    }
    
    // If we have a map reference, add a marker
    if (mapRef && mapRef.current) {
      const { lat, lon } = suggestion.metadata;
      
      // Clear existing markers (if any)
      mapRef.current.eachLayer(layer => {
        if (layer.options && layer.options.pane === 'markerPane') {
          mapRef.current.removeLayer(layer);
        }
      });
      
      // Add marker at the location
      const L = window.L; // Assuming Leaflet is loaded globally
      if (L) {
        L.marker([lat, lon])
          .addTo(mapRef.current)
          .bindPopup(suggestion.name)
          .openPopup();
        
        // Center map on the location
        mapRef.current.setView([lat, lon], 13);
      }
    }
    
    // Save to recent searches in localStorage
    try {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      // Check if this location is already saved
      const existingIndex = recentSearches.findIndex(
        place => place.name === suggestion.name
      );
      
      if (existingIndex !== -1) {
        // Remove the existing entry to put it at the top
        recentSearches.splice(existingIndex, 1);
      }
      
      // Add to the beginning of the array
      recentSearches.unshift({
        name: suggestion.name,
        metadata: suggestion.metadata
      });
      
      // Keep only the 10 most recent searches
      const limitedSearches = recentSearches.slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(limitedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  return (
    <div className="relative w-full">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full p-3 pr-10 border-2 border-border rounded-lg shadow-soft focus:ring-2 focus:ring-accent focus:border-accent bg-surface/70 backdrop-blur-sm hover:border-accent/50 transition-colors"
          placeholder="Search for a location..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setShowSuggestions(true);
            }
          }}
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent shadow-sm"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-md shadow-medium max-h-60 overflow-auto"
        >
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index} 
                  className="p-3 hover:bg-accent/10 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="font-medium text-text-primary">
                    {suggestion.name.split(',')[0]}
                  </div>
                  <div className="text-xs text-text-secondary truncate">
                    {suggestion.name}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-text-secondary text-center">
              {loading ? 'Searching...' : 'No results found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
