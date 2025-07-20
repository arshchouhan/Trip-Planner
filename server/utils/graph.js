/**
 * Graph utility for building and managing the location graph structure
 * Each node represents a Point of Interest (POI)
 * Edges represent travel distances/times between POIs
 * Now using OpenStreetMap/Nominatim API to fetch real POI data
 */

const axios = require('axios');

// Define emergency backup POIs for when all API calls fail
// These are only used as an absolute last resort
// Enhanced backup POIs with custom coordinates for popular destinations
const commonDestinations = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'default': { lat: 20.5937, lng: 78.9629 } // Center of India as fallback
};

const getDestinationBackupPOIs = (destination) => {
  // Basic info for different trip types
  const poiTypes = {
    'Historical': ['Historical Fort', 'Ancient Temple', 'Heritage Museum', 'Old Palace', 'Monument'],
    'Religious': ['Temple', 'Shrine', 'Sacred Site', 'Holy River', 'Pilgrimage Center'],
    'Nature': ['National Park', 'Garden', 'Waterfall', 'Mountain Peak', 'Lake'],
    'Adventure': ['Trekking Trail', 'Camping Site', 'Zipline', 'Adventure Park', 'Wildlife Safari'],
    'Romantic': ['Sunset Point', 'Lakeside Retreat', 'Garden Restaurant', 'Scenic Viewpoint', 'Couples Park']
  };

  // Default to Historical if no match
  return poiTypes['Historical'];
};

const emergencyBackupPOIs = [
  { id: 'backup_poi_1', name: 'BACKUP: Tourist Spot 1', location: { lat: 0, lng: 0 }, visitDuration: 2, rating: 4.5 },
  { id: 'backup_poi_2', name: 'BACKUP: Tourist Spot 2', location: { lat: 0, lng: 0 }, visitDuration: 1.5, rating: 4.3 },
  { id: 'backup_poi_3', name: 'BACKUP: Tourist Spot 3', location: { lat: 0, lng: 0 }, visitDuration: 2.5, rating: 4.6 },
  { id: 'backup_poi_4', name: 'BACKUP: Tourist Spot 4', location: { lat: 0, lng: 0 }, visitDuration: 1, rating: 4.2 },
  { id: 'backup_poi_5', name: 'BACKUP: Tourist Spot 5', location: { lat: 0, lng: 0 }, visitDuration: 3, rating: 4.7 }
];

/**
 * Get destination coordinates from name using Nominatim API
 * @param {string} destination - Destination name (e.g., "Jaipur")
 * @returns {Object} - Location coordinates {lat, lng}
 */
const getDestinationCoordinates = async (destination) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'TripPlannerApp/1.0' } }
    );
    
    if (response.data && response.data.length > 0) {
      return { 
        lat: parseFloat(response.data[0].lat), 
        lng: parseFloat(response.data[0].lon),
        displayName: response.data[0].display_name
      };
    } else {
      throw new Error(`Destination ${destination} not found`);
    }
  } catch (error) {
    console.error(`Error fetching coordinates for ${destination}:`, error.message);
    // Instead of hardcoding Jaipur coordinates, throw the error
    // This will trigger proper fallback mechanisms in the getPOIs function
    throw new Error(`Could not get coordinates for ${destination}: ${error.message}`);
  }
};

/**
 * Map trip types to OSM POI tags/categories
 * @param {string} tripType - Type of trip (Historical, Adventure, etc.)
 * @returns {Object} - OSM tags and search terms
 */
const mapTripTypeToOsmTags = (tripType) => {
  const typeMapping = {
    'Historical': {
      tags: 'historic=*|tourism=museum|tourism=attraction',
      keywords: 'historic,fort,palace,monument,museum',
      amenities: 'museum,place_of_worship,archaeological_site' 
    },
    'Religious': {
      tags: 'amenity=place_of_worship|historic=temple|historic=shrine',
      keywords: 'temple,mosque,church,shrine,religious',
      amenities: 'place_of_worship'
    },
    'Nature': {
      tags: 'leisure=park|natural=*|tourism=viewpoint',
      keywords: 'park,garden,nature,lake,mountain,viewpoint',
      amenities: 'park,garden'
    },
    'Adventure': {
      tags: 'sport=*|leisure=sports_centre|tourism=wilderness_hut',
      keywords: 'adventure,trek,safari,hiking,climbing',
      amenities: 'sports_centre'
    },
    'Romantic': {
      tags: 'tourism=viewpoint|leisure=garden|amenity=cafe|amenity=restaurant',
      keywords: 'romantic,cafe,restaurant,viewpoint,sunset',
      amenities: 'restaurant,cafe'
    }
  };
  
  return typeMapping[tripType] || typeMapping['Historical'];
};

/**
 * Get Points of Interest (POIs) based on destination and trip type
 * @param {string} destination - Main destination
 * @param {string} tripType - Type of trip
 * @returns {Array} - Array of POIs
 */
/**
 * Get Points of Interest (POIs) based on destination and trip type
 * Uses OpenStreetMap Nominatim and Overpass APIs to fetch real POI data
 * @param {string} destination - Main destination
 * @param {string} tripType - Type of trip
 * @param {Object} [coordinates] - Optional coordinates {lat, lon}
 * @returns {Array} - Array of POIs
 */
const getPOIs = async (destination, tripType, coordinates = null) => {
  let location; // Declare location here to make it accessible in the catch block
  console.log('========== STARTING POI FETCH ==========');
  console.log(`Destination: ${destination}, Trip Type: ${tripType}`);
  console.log('Coordinates provided:', coordinates);

  try {
    // 1. Get destination coordinates - use provided coordinates if available
    if (coordinates && coordinates.lat && coordinates.lon) {
      console.log(`Using provided coordinates for ${destination}: (${coordinates.lat}, ${coordinates.lon})`);
      location = { lat: coordinates.lat, lng: coordinates.lon, displayName: destination };
      console.log('Location object set to:', location);
    } else {
      console.log(`No coordinates provided for ${destination}, fetching from Nominatim`);
      location = await getDestinationCoordinates(destination);
      console.log('Location fetched from Nominatim:', location);
    }
    console.log(`Fetching POIs for ${destination} (${location.lat}, ${location.lng}) - Trip type: ${tripType}`);
    
    // 2. Map trip type to OSM tags and keywords
    const osmParams = mapTripTypeToOsmTags(tripType);
    
    // 3. Fetch POIs from Overpass API
    // Construct a query to find POIs within ~5km radius
    const radius = 5000; // 5 km radius
    const response = await axios.get(
      'https://overpass-api.de/api/interpreter',
      {
        params: {
          data: `
            [out:json];
            (
              // Search for POIs based on tags relevant to the trip type
              node[${osmParams.tags}](around:${radius},${location.lat},${location.lng});
              way[${osmParams.tags}](around:${radius},${location.lat},${location.lng});
              relation[${osmParams.tags}](around:${radius},${location.lat},${location.lng});
              // Additional searches for amenities
              node[amenity~"${osmParams.amenities}"](around:${radius},${location.lat},${location.lng});
              way[amenity~"${osmParams.amenities}"](around:${radius},${location.lat},${location.lng});
            );
            out body;
            >;
            out skel qt;
          `
        },
        timeout: 30000
      }
    );
    
    // 4. Process and format results
    const pois = [];
    const usedNames = new Set(); // To avoid duplicate POIs
    let poiId = 1;
    
    if (response.data && response.data.elements) {
      for (const element of response.data.elements) {
        // Skip elements without tags or names
        if (!element.tags || !element.tags.name) continue;
        
        // Skip duplicates
        if (usedNames.has(element.tags.name)) continue;
        usedNames.add(element.tags.name);
        
        // Format POI
        pois.push({
          id: `poi_${poiId++}`,
          name: element.tags.name,
          location: {
            lat: element.lat || (element.center ? element.center.lat : null),
            lng: element.lon || (element.center ? element.center.lon : null)
          },
          // Estimate visit duration based on the POI type (just a rough estimate)
          visitDuration: estimateVisitDuration(element.tags, tripType),
          // Assign a random rating between 3.8-4.8 for now
          rating: (Math.random() * (4.8 - 3.8) + 3.8).toFixed(1)
        });
        
        // Limit to max 15 POIs to avoid too much computation
        if (pois.length >= 15) break;
      }
    }
    
    // 5. If no POIs found, try a broader search, but if we have POIs, use them
    if (pois.length === 0) {
      console.log(`No POIs found for ${destination} (${tripType}). Trying broader search...`);
      // We'll try a broader search in the catch block if this happens
      throw new Error(`No POIs found for ${destination}`);
    } 
    
    // Even if we found just 1 or 2 POIs, use them rather than falling back
    if (pois.length < 3) {
      console.log(`Only found ${pois.length} POIs for ${destination} (${tripType}), but proceeding with these.`);
    }
    
    console.log(`Found ${pois.length} POIs for ${destination} (${tripType})`);
    return pois;
  } catch (error) {
    console.error('Error getting POIs from OpenStreetMap:', error.message);
    console.error('Attempting to retry with simplified query...');
    
    try {
      // Try a simpler query as a fallback
      const simpleResponse = await axios.get(
        'https://overpass-api.de/api/interpreter',
        {
          params: {
            data: `
              [out:json];
              // Simpler query just looking for tourism and amenities
              (
                node[tourism](around:8000,${location.lat},${location.lng});
                way[tourism](around:8000,${location.lat},${location.lng});
                node[amenity~"restaurant|cafe|place_of_worship"](around:8000,${location.lat},${location.lng});
              );
              out body;
              >;
              out skel qt;
            `
          },
          timeout: 30000
        }
      );

      const simplePois = [];
      const usedNames = new Set();
      let poiId = 1;
      
      if (simpleResponse.data && simpleResponse.data.elements) {
        for (const element of simpleResponse.data.elements) {
          if (!element.tags || !element.tags.name) continue;
          if (usedNames.has(element.tags.name)) continue;
          
          usedNames.add(element.tags.name);
          simplePois.push({
            id: `poi_${poiId++}`,
            name: element.tags.name,
            location: {
              lat: element.lat || (element.center ? element.center.lat : null),
              lng: element.lon || (element.center ? element.center.lon : null)
            },
            visitDuration: estimateVisitDuration(element.tags, tripType),
            rating: (Math.random() * (4.8 - 3.8) + 3.8).toFixed(1)
          });
          
          if (simplePois.length >= 10) break;
        }
      }
      
      // If we found some POIs with the simple query, use those instead of fallback
      if (simplePois.length > 0) {
        console.log(`Found ${simplePois.length} POIs using simplified query for ${destination}`);
        return simplePois;
      }
    } catch (retryError) {
      console.error('Retry also failed:', retryError.message);
    }
    
    // Only use emergency backup POIs if all else fails
    console.log('All attempts to get POIs failed. Using emergency backup POIs.');
    
    // Get coordinates based on destination name, or use provided location, or fall back to default
    let baseLat, baseLng;
    
    // Try to find the destination in our common destinations list
    const destinationLower = destination.toLowerCase();
    const knownDestination = Object.keys(commonDestinations).find(key => 
      destinationLower.includes(key) || key.includes(destinationLower)
    );
    
    // Use coordinates from commonDestinations if found, otherwise use provided location or default
    if (knownDestination) {
      console.log(`Found known destination match: ${knownDestination}`);
      baseLat = commonDestinations[knownDestination].lat;
      baseLng = commonDestinations[knownDestination].lng;
    } else if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      baseLat = location.lat;
      baseLng = location.lng;
    } else {
      console.log('No matching destination found, using default India coordinates');
      baseLat = commonDestinations.default.lat;
      baseLng = commonDestinations.default.lng;
    }
    
    console.log('Using emergency backup POIs with base coordinates:', { baseLat, baseLng });
    
    // Get POI names based on trip type
    const poiTypes = {
      'Historical': ['Historical Fort', 'Ancient Temple', 'Heritage Museum', 'Old Palace', 'Monument'],
      'Religious': ['Temple', 'Shrine', 'Sacred Site', 'Holy River', 'Pilgrimage Center'],
      'Nature': ['National Park', 'Garden', 'Waterfall', 'Mountain Peak', 'Lake'],
      'Adventure': ['Trekking Trail', 'Camping Site', 'Zipline Adventure', 'Adventure Park', 'Wildlife Safari'],
      'Romantic': ['Sunset Point', 'Lakeside Retreat', 'Garden Restaurant', 'Scenic Viewpoint', 'Couples Park']
    };
    
    // Default to Historical if no match
    const poiNames = poiTypes[tripType] || poiTypes['Historical'];
    
    // Create POIs with the appropriate names and coordinates
    return poiNames.map((poiName, index) => {
      // Add some variability to coordinates so they're not all on top of each other
      const latOffset = (index - 2) * 0.002;
      const lngOffset = (index - 2) * 0.003;
      
      return {
        id: `poi_${index + 1}`,
        name: `${poiName} in ${destination}`,
        location: {
          lat: baseLat + latOffset,
          lng: baseLng + lngOffset
        },
        visitDuration: 1.5 + (Math.random() * 1.5),
        rating: (Math.random() * (4.8 - 4.2) + 4.2).toFixed(1)
      };
    });
  }
};

/**
 * Estimate POI visit duration based on its tags and trip type
 * @param {Object} tags - OSM tags
 * @param {string} tripType - Trip type
 * @returns {number} - Estimated duration in hours
 */
const estimateVisitDuration = (tags, tripType) => {
  // These are rough estimates and can be refined
  if (tags.historic === 'castle' || tags.historic === 'fort' || tags.tourism === 'museum') {
    return 2.5; // Major sites need more time
  } else if (tags.amenity === 'place_of_worship' || tags.historic === 'monument') {
    return 1.5; // Religious sites and monuments
  } else if (tags.natural || tags.leisure === 'park' || tags.leisure === 'garden') {
    return 2; // Natural sites
  } else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe') {
    return 1.5; // Dining
  }
  
  // Default durations by trip type
  const defaultDurations = {
    'Historical': 2,
    'Religious': 1.5,
    'Nature': 2,
    'Adventure': 3,
    'Romantic': 1.5
  };
  
  return defaultDurations[tripType] || 2;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - First point with lat and lng
 * @param {Object} point2 - Second point with lat and lng
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (point1, point2) => {
  // Check if either point is null/undefined or has null/undefined coordinates
  if (!point1 || !point2 || 
      typeof point1.lat !== 'number' || typeof point1.lng !== 'number' || 
      typeof point2.lat !== 'number' || typeof point2.lng !== 'number') {
    console.error('Invalid coordinates:', point1, point2);
    return 1; // Return a default small distance
  }
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

/**
 * Calculate time to travel between two points
 * @param {Object} point1 - First point with lat and lng
 * @param {Object} point2 - Second point with lat and lng
 * @param {number} speedFactor - Average speed in km/h (default: 30km/h for city travel)
 * @returns {number} - Time in hours
 */
const calculateTravelTime = (point1, point2, speedFactor = 30) => {
  const distance = calculateDistance(point1, point2);
  return distance / speedFactor; // Time in hours
};

/**
 * Build a graph from points of interest
 * @param {Array} pois - Array of Points of Interest
 * @returns {Object} - Graph representation with nodes and adjacency list
 */
const buildGraph = (pois) => {
  const graph = {
    nodes: {},
    adjacencyList: {}
  };

  // Add all POIs as nodes
  pois.forEach(poi => {
    graph.nodes[poi.id] = poi;
    graph.adjacencyList[poi.id] = [];
  });

  // Create edges between all nodes (fully connected graph)
  pois.forEach(poi1 => {
    pois.forEach(poi2 => {
      if (poi1.id !== poi2.id) {
        const distance = calculateDistance(poi1.location, poi2.location);
        const travelTime = calculateTravelTime(poi1.location, poi2.location);
        
        graph.adjacencyList[poi1.id].push({
          nodeId: poi2.id,
          distance,
          travelTime
        });
      }
    });
  });

  return graph;
};

module.exports = {
  getPOIs,
  buildGraph,
  calculateDistance,
  calculateTravelTime
};
