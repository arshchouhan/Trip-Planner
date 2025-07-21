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
    
    // 3. Fetch POIs from Overpass API using a more robust query format
    const radius = 5000; // 5 km radius
    
    // Create a more specific and robust Overpass query
    const overpassQuery = `
      [out:json][timeout:90];
      (
        // Primary search based on trip type tags
        node[${osmParams.tags}](around:${radius},${location.lat},${location.lng});
        way[${osmParams.tags}](around:${radius},${location.lat},${location.lng});
        relation[${osmParams.tags}](around:${radius},${location.lat},${location.lng});
        
        // Additional searches for amenities
        node[amenity~"${osmParams.amenities}"](around:${radius},${location.lat},${location.lng});
        way[amenity~"${osmParams.amenities}"](around:${radius},${location.lat},${location.lng});
        
        // Tourism-related POIs (always useful)
        node[tourism=attraction](around:${radius},${location.lat},${location.lng});
        way[tourism=attraction](around:${radius},${location.lat},${location.lng});
        
        // Add specific keywords search for better results
        ${osmParams.keywords.split(',').map(keyword => 
          `node[name~"${keyword}",i](around:${radius},${location.lat},${location.lng});`
        ).join('\n        ')}
      );
      out body;
      >;
      out skel qt;
    `;
    
    console.log('Executing Overpass query:', overpassQuery);
    
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(overpassQuery)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 60000 // Increased timeout for complex queries
      }
    );
    
    // 4. Process and format results with improved filtering and scoring
    const pois = [];
    const usedNames = new Set(); // To avoid duplicate POIs
    let poiId = 1;
    
    if (response.data && response.data.elements) {
      console.log(`Found ${response.data.elements.length} raw elements from Overpass API`);
      
      // First pass: collect all POIs with complete data
      const validElements = response.data.elements.filter(element => {
        // Must have tags and a name
        if (!element.tags || !element.tags.name) return false;
        
        // Must have valid coordinates (either direct or center)
        const hasValidCoords = 
          (element.lat !== undefined && element.lon !== undefined) || 
          (element.center && element.center.lat !== undefined && element.center.lon !== undefined);
        
        return hasValidCoords;
      });
      
      console.log(`Found ${validElements.length} elements with valid data`);
      
      // Second pass: score and rank POIs by relevance to trip type
      const scoredElements = validElements.map(element => {
        // Calculate a relevance score based on tags matching trip type
        let relevanceScore = 0;
        
        // Check if name contains any keywords related to trip type
        const keywords = osmParams.keywords.split(',');
        const name = element.tags.name.toLowerCase();
        
        for (const keyword of keywords) {
          if (name.includes(keyword.toLowerCase())) {
            relevanceScore += 5; // Strong boost for keyword in name
          }
        }
        
        // Check for relevant tags
        if (element.tags.tourism) relevanceScore += 3;
        if (element.tags.historic) relevanceScore += (tripType === 'Historical' ? 5 : 2);
        if (element.tags.natural) relevanceScore += (tripType === 'Nature' ? 5 : 2);
        if (element.tags.leisure) relevanceScore += 2;
        if (element.tags.amenity === 'place_of_worship') relevanceScore += (tripType === 'Religious' ? 5 : 1);
        
        // Add rating based on OSM data if available
        const rating = element.tags.rating || element.tags.stars || 
                      (Math.random() * (4.8 - 3.8) + 3.8).toFixed(1);
        
        return {
          element,
          relevanceScore,
          rating
        };
      });
      
      // Sort by relevance score (highest first)
      scoredElements.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Take the top results and format them as POIs
      for (const scoredElement of scoredElements) {
        const element = scoredElement.element;
        
        // Skip duplicates
        if (usedNames.has(element.tags.name)) continue;
        usedNames.add(element.tags.name);
        
        // Get coordinates
        const lat = element.lat || (element.center ? element.center.lat : null);
        const lng = element.lon || (element.center ? element.center.lon : null);
        
        // Format POI with additional metadata
        pois.push({
          id: `poi_${poiId++}`,
          name: element.tags.name,
          location: { lat, lng },
          visitDuration: estimateVisitDuration(element.tags, tripType),
          rating: scoredElement.rating,
          relevanceScore: scoredElement.relevanceScore,
          // Include additional metadata if available
          description: element.tags.description || element.tags.tourism || element.tags.historic || '',
          website: element.tags.website || element.tags['contact:website'] || '',
          openingHours: element.tags.opening_hours || '',
          osmId: element.id
        });
        
        // Limit to max 20 POIs to avoid too much computation but ensure good coverage
        if (pois.length >= 20) break;
      }
    }
    
    // 5. If no POIs found, try a broader search, but if we have POIs, use them
    if (pois.length === 0) {
      console.log(`No POIs found for ${destination} (${tripType}). Trying broader search...`);
      // We'll try a broader search in the catch block if this happens
      throw new Error(`No POIs found for ${destination}`);
    } 
    
    // Even if we found just a few POIs, use them rather than falling back
    if (pois.length < 5) {
      console.log(`Only found ${pois.length} POIs for ${destination} (${tripType}), but proceeding with these.`);
    }
    
    console.log(`Successfully processed ${pois.length} POIs for ${destination} (${tripType})`);
    return pois;
  } catch (error) {
    console.error('Error getting POIs from OpenStreetMap:', error.message);
    console.error('Attempting to retry with simplified query...');
    
    try {
      // Try a more robust fallback query using POST method
      // This avoids URL length limitations and improves reliability
      const fallbackQuery = `
        [out:json][timeout:60];
        (
          // Simplified search for tourism attractions and key amenities
          node[tourism=attraction](around:10000,${location?.lat || 0},${location?.lng || 0});
          way[tourism=attraction](around:10000,${location?.lat || 0},${location?.lng || 0});
          node[tourism=museum](around:10000,${location?.lat || 0},${location?.lng || 0});
          node[tourism=viewpoint](around:10000,${location?.lat || 0},${location?.lng || 0});
          node[historic](around:10000,${location?.lat || 0},${location?.lng || 0});
          node[amenity=place_of_worship](around:10000,${location?.lat || 0},${location?.lng || 0});
          node[amenity=restaurant](around:10000,${location?.lat || 0},${location?.lng || 0});
          node[leisure=park](around:10000,${location?.lat || 0},${location?.lng || 0});
        );
        out body;
        >;
        out skel qt;
      `;
      
      console.log('Executing fallback Overpass query:', fallbackQuery);
      
      const simpleResponse = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(fallbackQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 45000
        }
      );
      
      // Process results with improved scoring
      const fallbackPois = [];
      const usedNames = new Set();
      let poiId = 1;
      
      if (simpleResponse.data && simpleResponse.data.elements) {
        console.log(`Found ${simpleResponse.data.elements.length} elements in fallback query`);
        
        // Filter valid elements
        const validElements = simpleResponse.data.elements.filter(element => {
          if (!element.tags || !element.tags.name) return false;
          
          const hasValidCoords = 
            (element.lat !== undefined && element.lon !== undefined) || 
            (element.center && element.center.lat !== undefined && element.center.lon !== undefined);
          
          return hasValidCoords;
        });
        
        // Score elements by relevance
        const scoredElements = validElements.map(element => {
          let score = 0;
          
          // Prioritize elements with more complete data
          if (element.tags.name) score += 2;
          if (element.tags.description) score += 1;
          if (element.tags.website) score += 1;
          
          // Prioritize by type
          if (element.tags.tourism === 'attraction') score += 3;
          if (element.tags.historic) score += 2;
          if (element.tags.amenity) score += 1;
          
          return { element, score };
        });
        
        // Sort by score
        scoredElements.sort((a, b) => b.score - a.score);
        
        // Take top results
        for (const scored of scoredElements) {
          const element = scored.element;
          
          if (usedNames.has(element.tags.name)) continue;
          usedNames.add(element.tags.name);
          
          fallbackPois.push({
            id: `poi_${poiId++}`,
            name: element.tags.name,
            location: {
              lat: element.lat || (element.center ? element.center.lat : null),
              lng: element.lon || (element.center ? element.center.lon : null)
            },
            visitDuration: estimateVisitDuration(element.tags, tripType),
            rating: element.tags.stars || (Math.random() * (4.8 - 3.8) + 3.8).toFixed(1),
            description: element.tags.description || element.tags.tourism || element.tags.historic || '',
            relevanceScore: scored.score,
            isFallback: true // Mark as fallback POI
          });
          
          if (fallbackPois.length >= 15) break;
        }
      }
      
      if (fallbackPois.length > 0) {
        console.log(`Found ${fallbackPois.length} POIs in fallback query for ${destination}`);
        return fallbackPois;
      }
      
      throw new Error('Fallback query also failed to find POIs');
    } catch (fallbackError) {
      console.error('Fallback query failed:', fallbackError.message);
      console.warn('Using emergency backup POIs with destination coordinates');
    
      // Use emergency backup POIs with the destination coordinates
      // This ensures we always return something usable
      const backupCoords = location || {
        lat: commonDestinations[destination.toLowerCase()]?.lat || commonDestinations.default.lat,
        lng: commonDestinations[destination.toLowerCase()]?.lng || commonDestinations.default.lng
      };
      
      // Create more realistic backup POIs based on trip type
      const backupPois = [];
      
      // Define backup POI templates by trip type
      const poiTemplates = {
        'Historical': [
          { name: 'Historical Museum', duration: 2.5 },
          { name: 'Ancient Fort', duration: 2 },
          { name: 'Heritage Palace', duration: 2 },
          { name: 'Old Town Square', duration: 1.5 },
          { name: 'Historical Monument', duration: 1 },
          { name: 'Archaeological Site', duration: 2.5 }
        ],
        'Religious': [
          { name: 'Grand Temple', duration: 1.5 },
          { name: 'Sacred Shrine', duration: 1 },
          { name: 'Holy Site', duration: 1.5 },
          { name: 'Ancient Monastery', duration: 2 },
          { name: 'Pilgrimage Center', duration: 2 }
        ],
        'Nature': [
          { name: 'National Park', duration: 3 },
          { name: 'Botanical Garden', duration: 2 },
          { name: 'Scenic Waterfall', duration: 1.5 },
          { name: 'Mountain Viewpoint', duration: 2 },
          { name: 'Nature Reserve', duration: 2.5 }
        ],
        'Adventure': [
          { name: 'Adventure Park', duration: 3 },
          { name: 'Hiking Trail', duration: 3.5 },
          { name: 'Zipline Experience', duration: 2 },
          { name: 'Rock Climbing Site', duration: 2.5 },
          { name: 'Water Sports Center', duration: 3 }
        ],
        'Romantic': [
          { name: 'Sunset Point', duration: 1.5 },
          { name: 'Lakeside Retreat', duration: 2 },
          { name: 'Garden Restaurant', duration: 2 },
          { name: 'Scenic Viewpoint', duration: 1 },
          { name: 'Couples Park', duration: 1.5 }
        ]
      };
      
      // Use the appropriate template or default to Historical
      const templates = poiTemplates[tripType] || poiTemplates['Historical'];
      
      // Create POIs with realistic offsets from the destination
      templates.forEach((template, index) => {
        // Create a more realistic distribution of POIs around the destination
        // Using a spiral pattern for better distribution
        const angle = index * (Math.PI / 2.5); // Distribute in a spiral
        const distance = 0.002 + (index * 0.001); // Increasing distance from center
        const latOffset = Math.cos(angle) * distance;
        const lngOffset = Math.sin(angle) * distance;
        
        backupPois.push({
          id: `poi_${index + 1}`,
          name: `${template.name} of ${destination}`,
          location: {
            lat: backupCoords.lat + latOffset,
            lng: backupCoords.lng + lngOffset
          },
          visitDuration: template.duration,
          rating: (Math.random() * (4.8 - 4.2) + 4.2).toFixed(1),
          description: `A popular ${tripType.toLowerCase()} attraction in ${destination}`,
          isEmergencyBackup: true // Mark as emergency backup
        });
      });
      
      console.log(`Created ${backupPois.length} emergency backup POIs for ${destination}`);
      return backupPois;
    }
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
