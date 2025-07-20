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
 * Finds the shortest path that visits all points of interest
 * 
 * @param {Object} graph - Graph representation with nodes and adjacency list
 * @param {string} startNodeId - ID of the starting node
 * @returns {Array} - Optimized path as an array of node IDs
 */
const dijkstraShortestPath = (graph, startNodeId) => {
  const distances = {};
  const previous = {};
  const path = [];
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
    
    // If we've visited all nodes, break
    if (distances[current] === Infinity) break;
    
    // For each neighbor
    graph.adjacencyList[current].forEach(neighbor => {
      // Calculate new distance to neighbor
      let candidate = distances[current] + neighbor.travelTime;
      
      // If it's shorter than the current distance
      if (candidate < distances[neighbor.nodeId]) {
        // Update distance and previous
        distances[neighbor.nodeId] = candidate;
        previous[neighbor.nodeId] = current;
        
        // Update priority queue
        pq.enqueue(neighbor.nodeId, candidate);
      }
    });
  }
  
  return { distances, previous };
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
 * Generate a greedy nearest-neighbor tour of POIs
 * 
 * @param {Object} graph - Graph representation
 * @param {string} startNodeId - ID of the starting node (optional)
 * @returns {Array} - Array of ordered POIs
 */
const nearestNeighborTour = (graph, startNodeId = null) => {
  const nodes = Object.keys(graph.nodes);
  if (nodes.length === 0) return [];
  
  // Start from the first node if no start node provided
  const start = startNodeId || nodes[0];
  const visited = new Set([start]);
  const tour = [graph.nodes[start]];
  
  let currentNode = start;
  
  // Visit each node using nearest neighbor heuristic
  while (visited.size < nodes.length) {
    const nextNode = findNearestUnvisited(graph, currentNode, visited);
    
    if (nextNode) {
      // Add travel time info to the previous node
      const travelTime = graph.adjacencyList[currentNode].find(
        neighbor => neighbor.nodeId === nextNode
      ).travelTime;
      
      tour[tour.length - 1].travelTimeToNext = travelTime;
      
      // Add the next POI to our tour
      visited.add(nextNode);
      tour.push(graph.nodes[nextNode]);
      currentNode = nextNode;
    } else {
      // No more reachable unvisited nodes
      break;
    }
  }
  
  return tour;
};

/**
 * Organize an optimized tour into daily itineraries
 * 
 * @param {Array} tour - Optimized tour of POIs
 * @param {number} days - Number of days for the trip
 * @returns {Array} - Array of daily itineraries
 */
const organizeByDays = (tour, days) => {
  // If no POIs, return empty itinerary
  if (!tour || tour.length === 0) {
    return Array(days).fill([]);
  }
  
  const dailyItineraries = [];
  const avgTimePerDay = calculateTotalTime(tour) / days;
  
  let currentDay = [];
  let currentDayTime = 0;
  
  // Distribute POIs across days
  for (let i = 0; i < tour.length; i++) {
    const poi = tour[i];
    
    // Calculate time for this POI including visit and travel
    const poiTime = poi.visitDuration + (poi.travelTimeToNext || 0);
    
    // Check if adding this POI exceeds the day's time budget
    if (currentDayTime + poiTime > avgTimePerDay && currentDay.length > 0) {
      // This day is full, start a new day
      dailyItineraries.push(currentDay);
      currentDay = [poi];
      currentDayTime = poiTime;
    } else {
      // Add to current day
      currentDay.push(poi);
      currentDayTime += poiTime;
    }
  }
  
  // Add the last day if not empty
  if (currentDay.length > 0) {
    dailyItineraries.push(currentDay);
  }
  
  // If we have fewer itineraries than days, fill with empty arrays
  while (dailyItineraries.length < days) {
    dailyItineraries.push([]);
  }
  
  // If we have more itineraries than days, merge the last ones
  while (dailyItineraries.length > days) {
    const lastDay = dailyItineraries.pop();
    dailyItineraries[dailyItineraries.length - 1] = 
      dailyItineraries[dailyItineraries.length - 1].concat(lastDay);
  }
  
  return dailyItineraries;
};

/**
 * Main function to optimize a trip
 * 
 * @param {Object} graph - Graph representation with nodes and adjacency list
 * @param {number} days - Number of days for the trip
 * @returns {Array} - Optimized trip plan as daily itineraries
 */
const optimizeTrip = (graph, days) => {
  // 1. Find a good starting point (most central or highest rated POI)
  const nodes = Object.values(graph.nodes);
  const startNode = nodes.reduce((best, node) => 
    (node.rating > best.rating ? node : best), nodes[0]);
  
  // 2. Generate a tour using nearest neighbor algorithm
  const tour = nearestNeighborTour(graph, startNode.id);
  
  // 3. Organize the tour into daily itineraries
  const dailyItineraries = organizeByDays(tour, days);
  
  return dailyItineraries;
};

module.exports = {
  optimizeTrip,
  nearestNeighborTour,
  dijkstraShortestPath
};
