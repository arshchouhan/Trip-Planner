/**
 * Trip route optimizer using graph algorithms
 * Implements Dijkstra's algorithm and other optimization techniques
 * to find the best route for a trip based on POIs
 */

/**
 * Priority Queue implementation for Dijkstra's algorithm
 */
class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }

  dequeue() {
    return this.values.shift();
  }

  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }

  isEmpty() {
    return this.values.length === 0;
  }
}

/**
 * Optimize a trip route using Dijkstra's algorithm
 * Finds the optimal path between POIs considering travel time, POI ratings, and trip type
 * 
 * @param {Object} graph - Graph representation with nodes and adjacency list
 * @param {string} startNodeId - ID of the starting node
 * @param {string} tripType - Type of trip (Historical, Adventure, etc.)
 * @returns {Object} - Optimized path information
 */
const dijkstraShortestPath = (graph, startNodeId, tripType = 'Historical') => {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const pq = new PriorityQueue();
  
  // Initialize distances
  for (let node in graph.nodes) {
    if (node === startNodeId) {
      distances[node] = 0;
      pq.enqueue(node, 0);
    } else {
      distances[node] = Infinity;
      pq.enqueue(node, Infinity);
    }
    previous[node] = null;
  }
  
  // Find shortest path
  while (!pq.isEmpty()) {
    let current = pq.dequeue().val;
    
    // Mark as visited
    visited.add(current);
    
    // If we've visited all nodes, break
    if (distances[current] === Infinity) break;
    
    // For each neighbor
    graph.adjacencyList[current].forEach(neighbor => {
      // Skip if already visited
      if (visited.has(neighbor.nodeId)) return;
      
      // Calculate weighted cost based on trip type and POI characteristics
      const travelTimeCost = neighbor.travelTime;
      
      // Get POI information for the neighbor
      const poi = graph.nodes[neighbor.nodeId];
      
      // Calculate POI relevance score based on trip type
      let relevanceScore = poi.relevanceScore || 1;
      
      // If POI has a relevance score from Overpass API, use it
      // Otherwise, calculate a basic score based on POI properties and trip type
      if (!poi.relevanceScore) {
        relevanceScore = calculatePOIRelevance(poi, tripType);
      }
      
      // Invert the relevance score (higher relevance = lower cost)
      const relevanceCost = 1 / (relevanceScore + 0.5);
      
      // Calculate rating factor (higher rating = lower cost)
      const ratingFactor = 1 / (parseFloat(poi.rating) || 4.0);
      
      // Weight factors based on trip type
      const weights = getTripTypeWeights(tripType);
      
      // Calculate combined cost with weights
      // Lower cost = more desirable path
      const combinedCost = 
        (weights.travelTime * travelTimeCost) +
        (weights.relevance * relevanceCost) +
        (weights.rating * ratingFactor);
      
      // Calculate new total cost to this neighbor
      const candidate = distances[current] + combinedCost;
      
      // If it's better than the current best path
      if (candidate < distances[neighbor.nodeId]) {
        // Update distance and previous
        distances[neighbor.nodeId] = candidate;
        previous[neighbor.nodeId] = current;
        
        // Update priority queue
        pq.enqueue(neighbor.nodeId, candidate);
      }
    });
  }
  
  return { distances, previous, visited };
};

/**
 * Calculate POI relevance score based on trip type
 * 
 * @param {Object} poi - Point of Interest
 * @param {string} tripType - Type of trip
 * @returns {number} - Relevance score (higher is better)
 */
const calculatePOIRelevance = (poi, tripType) => {
  // Default score
  let score = 1;
  
  // Check if POI name or description contains keywords related to trip type
  const name = (poi.name || '').toLowerCase();
  const description = (poi.description || '').toLowerCase();
  
  // Define keywords for each trip type
  const keywords = {
    'Historical': ['historic', 'ancient', 'heritage', 'museum', 'monument', 'palace', 'fort', 'ruins', 'archaeology'],
    'Religious': ['temple', 'church', 'mosque', 'shrine', 'holy', 'sacred', 'worship', 'pilgrimage', 'spiritual'],
    'Nature': ['park', 'garden', 'mountain', 'lake', 'river', 'forest', 'beach', 'waterfall', 'wildlife', 'scenic'],
    'Adventure': ['trek', 'hike', 'climb', 'adventure', 'sport', 'rafting', 'camping', 'zipline', 'safari', 'outdoor'],
    'Romantic': ['sunset', 'view', 'romantic', 'couple', 'garden', 'scenic', 'restaurant', 'retreat', 'peaceful']
  };
  
  // Get keywords for this trip type
  const typeKeywords = keywords[tripType] || keywords['Historical'];
  
  // Check for keyword matches in name and description
  for (const keyword of typeKeywords) {
    if (name.includes(keyword)) score += 2;
    if (description.includes(keyword)) score += 1;
  }
  
  return score;
};

/**
 * Get weight factors for different trip types
 * These determine how much each factor influences path selection
 * 
 * @param {string} tripType - Type of trip
 * @returns {Object} - Weight factors for different criteria
 */
const getTripTypeWeights = (tripType) => {
  // Default weights prioritize travel time
  const defaultWeights = {
    travelTime: 0.6,  // Travel time importance
    relevance: 0.3,   // POI relevance to trip type
    rating: 0.1       // POI rating importance
  };
  
  // Customize weights based on trip type
  switch (tripType) {
    case 'Historical':
      return {
        travelTime: 0.4,  // Less emphasis on travel time
        relevance: 0.5,   // More emphasis on historical relevance
        rating: 0.1
      };
    case 'Religious':
      return {
        travelTime: 0.3,  // Less emphasis on travel time
        relevance: 0.6,   // High emphasis on religious site relevance
        rating: 0.1
      };
    case 'Nature':
      return {
        travelTime: 0.5,  // Balanced approach
        relevance: 0.3,
        rating: 0.2       // Slightly more emphasis on ratings
      };
    case 'Adventure':
      return {
        travelTime: 0.3,  // Less emphasis on travel time
        relevance: 0.5,   // Focus on adventure-related POIs
        rating: 0.2
      };
    case 'Romantic':
      return {
        travelTime: 0.4,
        relevance: 0.3,
        rating: 0.3       // Higher emphasis on ratings for romantic spots
      };
    default:
      return defaultWeights;
  }
};

/**
 * Find the nearest unvisited node
 * 
 * @param {Object} graph - Graph representation
 * @param {string} currentNode - Current node ID
 * @param {Set} visited - Set of visited node IDs
 * @returns {string} - ID of the nearest unvisited node
 */
const findNearestUnvisited = (graph, currentNode, visited) => {
  let nearestNode = null;
  let minDistance = Infinity;
  
  graph.adjacencyList[currentNode].forEach(neighbor => {
    if (!visited.has(neighbor.nodeId) && neighbor.travelTime < minDistance) {
      nearestNode = neighbor.nodeId;
      minDistance = neighbor.travelTime;
    }
  });
  
  return nearestNode;
};

/**
 * Calculate the total time required for an itinerary
 * Including visit duration and travel time
 * 
 * @param {Array} itinerary - Array of POIs with travel times
 * @returns {number} - Total time in hours
 */
const calculateTotalTime = (itinerary) => {
  let totalTime = 0;
  
  for (let i = 0; i < itinerary.length; i++) {
    // Add visit duration
    totalTime += itinerary[i].visitDuration;
    
    // Add travel time to next POI if there is one
    if (i < itinerary.length - 1 && itinerary[i].travelTimeToNext) {
      totalTime += itinerary[i].travelTimeToNext;
    }
  }
  
  return totalTime;
};

/**
 * Generate an optimized tour of POIs using enhanced nearest-neighbor with Dijkstra's algorithm
 * Takes into account trip type, POI relevance, and ratings
 * 
 * @param {Object} graph - Graph representation
 * @param {string} startNodeId - ID of the starting node (optional)
 * @param {string} tripType - Type of trip (Historical, Adventure, etc.)
 * @returns {Array} - Array of ordered POIs
 */
const nearestNeighborTour = (graph, startNodeId = null, tripType = 'Historical') => {
  const nodes = Object.keys(graph.nodes);
  if (nodes.length === 0) return [];
  
  // Start from the first node if no start node provided
  const start = startNodeId || nodes[0];
  const visited = new Set([start]);
  const tour = [graph.nodes[start]];
  
  let currentNode = start;
  
  console.log(`Starting tour optimization with trip type: ${tripType}`);
  console.log(`Starting node: ${graph.nodes[start].name}`);
  
  // Visit each node using enhanced nearest neighbor with Dijkstra
  while (visited.size < nodes.length) {
    // Use Dijkstra to find the best next node based on trip type and POI characteristics
    const { nextNode, travelTime, score } = findBestNextNode(graph, currentNode, visited, tripType);
    
    if (nextNode) {
      // Add travel time info to the previous node
      tour[tour.length - 1].travelTimeToNext = travelTime;
      tour[tour.length - 1].nextNodeScore = score; // Store the score for debugging
      
      // Add the next POI to our tour
      visited.add(nextNode);
      tour.push(graph.nodes[nextNode]);
      currentNode = nextNode;
      
      console.log(`Added ${graph.nodes[nextNode].name} to tour (score: ${score.toFixed(2)})`);
    } else {
      // No more reachable unvisited nodes
      console.log('No more reachable nodes, tour complete');
      break;
    }
  }
  
  return tour;
};

/**
 * Find the best next node to visit based on trip type and POI characteristics
 * Uses a weighted scoring system that considers travel time, POI relevance, and ratings
 * 
 * @param {Object} graph - Graph representation
 * @param {string} currentNode - Current node ID
 * @param {Set} visited - Set of visited node IDs
 * @param {string} tripType - Type of trip
 * @returns {Object} - Best next node info {nextNode, travelTime, score}
 */
const findBestNextNode = (graph, currentNode, visited, tripType) => {
  let bestNode = null;
  let bestScore = -Infinity;
  let bestTravelTime = 0;
  
  // Get weight factors based on trip type
  const weights = getTripTypeWeights(tripType);
  
  // Evaluate each unvisited neighbor
  graph.adjacencyList[currentNode].forEach(neighbor => {
    if (visited.has(neighbor.nodeId)) return;
    
    const poi = graph.nodes[neighbor.nodeId];
    
    // Skip if POI is invalid
    if (!poi) return;
    
    // Calculate travel time cost (lower is better)
    // Normalize to a 0-1 scale with diminishing returns for longer times
    const travelTimeCost = 1 / (1 + neighbor.travelTime);
    
    // Calculate POI relevance score
    let relevanceScore = poi.relevanceScore || 1;
    if (!poi.relevanceScore) {
      relevanceScore = calculatePOIRelevance(poi, tripType);
    }
    
    // Calculate rating factor (higher rating = better score)
    const rating = parseFloat(poi.rating) || 4.0;
    const ratingFactor = rating / 5.0; // Normalize to 0-1 scale
    
    // Calculate combined score (higher is better)
    const score = 
      (weights.travelTime * travelTimeCost) +
      (weights.relevance * (relevanceScore / 10)) + // Normalize to roughly 0-1 scale
      (weights.rating * ratingFactor);
    
    // Update best node if this one has a better score
    if (score > bestScore) {
      bestNode = neighbor.nodeId;
      bestScore = score;
      bestTravelTime = neighbor.travelTime;
    }
  });
  
  return { nextNode: bestNode, travelTime: bestTravelTime, score: bestScore };
};

/**
 * Organize an optimized tour into daily itineraries
 * Intelligently distributes POIs across days based on visit duration,
 * travel time, and POI characteristics
 * 
 * @param {Array} tour - Optimized tour of POIs
 * @param {number} days - Number of days for the trip
 * @param {string} tripType - Type of trip (optional)
 * @returns {Array} - Array of daily itineraries
 */
const organizeByDays = (tour, days, tripType = 'Historical') => {
  // If no POIs, return empty itinerary
  if (!tour || tour.length === 0) {
    return Array(days).fill([]);
  }
  
  console.log(`Organizing ${tour.length} POIs across ${days} days for ${tripType} trip`);
  
  // Calculate total time and average time per day
  const totalTime = calculateTotalTime(tour);
  const avgTimePerDay = totalTime / days;
  
  console.log(`Total trip time: ${totalTime.toFixed(2)} hours, average ${avgTimePerDay.toFixed(2)} hours per day`);
  
  // Create a more balanced distribution by considering POI characteristics
  const dailyItineraries = [];
  let currentDay = [];
  let currentDayTime = 0;
  
  // First pass: Distribute major POIs (high relevance/rating) across days
  for (let i = 0; i < tour.length; i++) {
    const poi = tour[i];
    
    // Calculate time for this POI including visit and travel
    const poiTime = poi.visitDuration + (poi.travelTimeToNext || 0);
    
    // Get POI importance based on relevance score and rating
    const relevanceScore = poi.relevanceScore || calculatePOIRelevance(poi, tripType);
    const rating = parseFloat(poi.rating) || 4.0;
    const importance = (relevanceScore * 0.7) + (rating * 0.3);
    
    // Add metadata to POI for debugging and frontend display
    poi.importance = importance;
    poi.timeRequired = poiTime;
    
    // Check if adding this POI exceeds the day's time budget
    // Allow more important POIs to exceed the budget slightly
    const importanceFactor = Math.min(1.3, 1 + (importance / 10)); // Max 30% over budget for very important POIs
    const adjustedBudget = avgTimePerDay * importanceFactor;
    
    if (currentDayTime + poiTime > adjustedBudget && currentDay.length > 0) {
      // This day is full, start a new day
      dailyItineraries.push(currentDay);
      currentDay = [poi];
      currentDayTime = poiTime;
      
      console.log(`Day ${dailyItineraries.length} complete with ${currentDay.length} POIs and ${currentDayTime.toFixed(2)} hours`);
    } else {
      // Add to current day
      currentDay.push(poi);
      currentDayTime += poiTime;
    }
  }
  
  // Add the last day if not empty
  if (currentDay.length > 0) {
    dailyItineraries.push(currentDay);
    console.log(`Final day ${dailyItineraries.length} complete with ${currentDay.length} POIs and ${currentDayTime.toFixed(2)} hours`);
  }
  
  // Balance the days if needed
  balanceDays(dailyItineraries, days);
  
  // Add day metadata for the frontend
  dailyItineraries.forEach((day, index) => {
    const dayTime = day.reduce((total, poi) => total + poi.visitDuration + (poi.travelTimeToNext || 0), 0);
    console.log(`Day ${index + 1}: ${day.length} POIs, ${dayTime.toFixed(2)} hours`);
  });
  
  return dailyItineraries;
};

/**
 * Balance days to ensure we have exactly the requested number of days
 * and that the POIs are distributed as evenly as possible
 * 
 * @param {Array} dailyItineraries - Current daily itineraries
 * @param {number} targetDays - Number of days for the trip
 */
const balanceDays = (dailyItineraries, targetDays) => {
  // If we have fewer itineraries than days, fill with empty arrays
  while (dailyItineraries.length < targetDays) {
    dailyItineraries.push([]);
  }
  
  // If we have more itineraries than days, merge the smallest days
  while (dailyItineraries.length > targetDays) {
    // Find the two days with the least POIs to merge
    let minDay1Index = 0;
    let minDay2Index = 1;
    let minTotalPOIs = dailyItineraries[0].length + dailyItineraries[1].length;
    
    for (let i = 0; i < dailyItineraries.length - 1; i++) {
      for (let j = i + 1; j < dailyItineraries.length; j++) {
        const totalPOIs = dailyItineraries[i].length + dailyItineraries[j].length;
        if (totalPOIs < minTotalPOIs) {
          minDay1Index = i;
          minDay2Index = j;
          minTotalPOIs = totalPOIs;
        }
      }
    }
    
    // Merge the two days with the least POIs
    dailyItineraries[minDay1Index] = dailyItineraries[minDay1Index].concat(dailyItineraries[minDay2Index]);
    dailyItineraries.splice(minDay2Index, 1);
    
    console.log(`Merged days ${minDay1Index + 1} and ${minDay2Index + 1} to balance itinerary`);
  }
  
  // Try to balance very uneven days by moving POIs
  balanceUnevenDays(dailyItineraries);
};

/**
 * Balance uneven days by moving POIs from overloaded days to underloaded ones
 * 
 * @param {Array} dailyItineraries - Daily itineraries to balance
 */
const balanceUnevenDays = (dailyItineraries) => {
  if (dailyItineraries.length <= 1) return;
  
  // Calculate average POIs per day
  const totalPOIs = dailyItineraries.reduce((sum, day) => sum + day.length, 0);
  const avgPOIsPerDay = totalPOIs / dailyItineraries.length;
  
  // Calculate average time per day
  const dayTimes = dailyItineraries.map(day => 
    day.reduce((total, poi) => total + poi.visitDuration + (poi.travelTimeToNext || 0), 0)
  );
  
  const totalTime = dayTimes.reduce((sum, time) => sum + time, 0);
  const avgTimePerDay = totalTime / dailyItineraries.length;
  
  console.log(`Balancing days: Avg ${avgPOIsPerDay.toFixed(1)} POIs and ${avgTimePerDay.toFixed(2)} hours per day`);
  
  // Identify overloaded and underloaded days
  for (let i = 0; i < dailyItineraries.length; i++) {
    const day = dailyItineraries[i];
    const dayTime = dayTimes[i];
    
    // If this day is significantly overloaded (>30% more than average)
    if (dayTime > avgTimePerDay * 1.3 && day.length > 1) {
      // Find the least important POI in this day
      let leastImportantIndex = 0;
      let leastImportance = day[0].importance || 1;
      
      for (let j = 1; j < day.length; j++) {
        const importance = day[j].importance || 1;
        if (importance < leastImportance) {
          leastImportantIndex = j;
          leastImportance = importance;
        }
      }
      
      // Find the most underloaded day
      let mostUnderloadedIndex = -1;
      let lowestTime = Infinity;
      
      for (let j = 0; j < dailyItineraries.length; j++) {
        if (j !== i && dayTimes[j] < avgTimePerDay * 0.8) {
          if (dayTimes[j] < lowestTime) {
            mostUnderloadedIndex = j;
            lowestTime = dayTimes[j];
          }
        }
      }
      
      // Move the POI if we found an underloaded day
      if (mostUnderloadedIndex >= 0) {
        const poiToMove = day[leastImportantIndex];
        const poiTime = poiToMove.visitDuration + (poiToMove.travelTimeToNext || 0);
        
        // Remove from overloaded day
        day.splice(leastImportantIndex, 1);
        dayTimes[i] -= poiTime;
        
        // Add to underloaded day
        dailyItineraries[mostUnderloadedIndex].push(poiToMove);
        dayTimes[mostUnderloadedIndex] += poiTime;
        
        console.log(`Moved POI "${poiToMove.name}" from day ${i + 1} to day ${mostUnderloadedIndex + 1} to balance workload`);
      }
    }
  }
};

/**
 * Main function to optimize a trip
 * 
 * @param {Object} graph - Graph representation with nodes and adjacency list
 * @param {number} days - Number of days for the trip
 * @param {string} tripType - Type of trip (Historical, Adventure, etc.)
 * @returns {Array} - Optimized trip plan as daily itineraries
 */
const optimizeTrip = (graph, days, tripType = 'Historical') => {
  console.log(`Optimizing trip for ${days} days with trip type: ${tripType}`);
  
  // 1. Find the best starting point based on trip type and POI characteristics
  const nodes = Object.values(graph.nodes);
  
  if (nodes.length === 0) {
    console.error('No POIs available for trip optimization');
    return Array(days).fill([]);
  }
  
  // Find the best starting point based on rating and relevance to trip type
  let bestStartNode = nodes[0];
  let bestStartScore = 0;
  
  for (const node of nodes) {
    // Calculate relevance score for this POI
    const relevanceScore = node.relevanceScore || calculatePOIRelevance(node, tripType);
    
    // Calculate rating factor
    const rating = parseFloat(node.rating) || 4.0;
    
    // Combine scores with weights based on trip type
    const weights = getTripTypeWeights(tripType);
    const score = (weights.relevance * (relevanceScore / 5)) + (weights.rating * (rating / 5));
    
    if (score > bestStartScore) {
      bestStartNode = node;
      bestStartScore = score;
    }
  }
  
  console.log(`Selected starting point: ${bestStartNode.name} (score: ${bestStartScore.toFixed(2)})`);
  
  // 2. Generate a tour using our enhanced nearest neighbor algorithm with trip type
  const tour = nearestNeighborTour(graph, bestStartNode.id, tripType);
  
  // 3. Organize the tour into daily itineraries
  const dailyItineraries = organizeByDays(tour, days);
  
  // 4. Add metadata about the optimization
  const optimizationMetadata = {
    tripType,
    startingPoint: bestStartNode.name,
    totalPOIs: tour.length,
    optimizationMethod: 'Enhanced Nearest Neighbor with Dijkstra'
  };
  
  console.log('Trip optimization complete:', optimizationMetadata);
  
  // Return both the itineraries and metadata
  return {
    dailyItineraries,
    metadata: optimizationMetadata
  };
};

module.exports = {
  optimizeTrip,
  dijkstraShortestPath,
  nearestNeighborTour,
  organizeByDays,
  calculatePOIRelevance,
  getTripTypeWeights,
  findBestNextNode,
  balanceDays,
  balanceUnevenDays
};
