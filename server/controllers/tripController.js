const graph = require('../utils/graph');
const optimizer = require('../utils/optimizer');

/**
 * Plan a trip based on user inputs
 * @param {Object} req - Request object
 * @param {Object} req.body - Request body
 * @param {number} req.body.days - Number of days for the trip
 * @param {string} req.body.destination - Main destination
 * @param {string} req.body.tripType - Type of trip (Historical, Adventure, Religious, Nature, Romantic)
 * @param {number} [req.body.budget] - Optional budget
 * @param {string} [req.body.travelTime] - Optional preferred time of travel
 * @param {Object} res - Response object
 */
const planTrip = async (req, res) => {
  try {
    const { days, destination, tripType, budget, travelTime, coordinates } = req.body;
    
    console.log('Backend received request with:', { 
      destination, 
      tripType, 
      days,
      coordinates: coordinates || 'No coordinates provided'
    });

    // Validate required inputs
    if (!days || !destination || !tripType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide days, destination, and trip type',
      });
    }

    try {
      // 1. Get points of interest (POIs) based on destination and trip type
      // Pass coordinates if available from frontend
      const pointsOfInterest = await graph.getPOIs(destination, tripType, coordinates);
      
      // Verify we got valid POIs back
      if (!pointsOfInterest || !Array.isArray(pointsOfInterest) || pointsOfInterest.length === 0) {
        console.error('Failed to get valid POIs from graph.getPOIs');
        throw new Error('No points of interest found for the destination');
      }
      
      console.log(`Retrieved ${pointsOfInterest.length} POIs:`, 
        pointsOfInterest.map(poi => ({ name: poi.name, location: poi.location })));
      
      // 2. Build location graph
      const locationGraph = graph.buildGraph(pointsOfInterest);

      // 3. Optimize the route using the enhanced algorithm with trip type
      const optimizedResult = optimizer.optimizeTrip(locationGraph, days, tripType);

      // 4. Return the optimized trip plan
      console.log('Optimization complete with metadata:', optimizedResult.metadata);
      
      return res.status(200).json({
        success: true,
        data: {
          destination,
          tripType,
          days,
          itinerary: optimizedResult.dailyItineraries,
          optimizationMetadata: optimizedResult.metadata
        },
      });
    } catch (innerError) {
      console.error('Error in POI processing:', innerError);
      throw new Error(`Failed to process trip data: ${innerError.message}`);
    }
  } catch (error) {
    console.error('Error planning trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while planning trip',
      error: error.message,
    });
  }
};

module.exports = {
  planTrip,
};
