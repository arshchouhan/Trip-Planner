/**
 * Test script for the enhanced trip optimizer
 * Tests the trip optimization algorithms with sample POI data
 */

const optimizer = require('../utils/optimizer');
const graph = require('../utils/graph');

// Sample POIs for testing
const samplePOIs = [
  {
    id: 'poi1',
    name: 'Historic Museum',
    description: 'A museum showcasing ancient artifacts and heritage items',
    location: { lat: 28.6139, lng: 77.2090 },
    rating: 4.5,
    visitDuration: 2.0,
    tags: { historic: 'museum', tourism: 'museum' }
  },
  {
    id: 'poi2',
    name: 'Adventure Park',
    description: 'Outdoor adventure activities and hiking trails',
    location: { lat: 28.6229, lng: 77.2100 },
    rating: 4.2,
    visitDuration: 3.0,
    tags: { leisure: 'park', sport: 'adventure' }
  },
  {
    id: 'poi3',
    name: 'Sacred Temple',
    description: 'Ancient temple with religious significance',
    location: { lat: 28.6180, lng: 77.2150 },
    rating: 4.8,
    visitDuration: 1.5,
    tags: { historic: 'temple', amenity: 'place_of_worship' }
  },
  {
    id: 'poi4',
    name: 'Romantic Garden',
    description: 'Beautiful garden with scenic views and peaceful atmosphere',
    location: { lat: 28.6150, lng: 77.2180 },
    rating: 4.3,
    visitDuration: 1.0,
    tags: { leisure: 'garden', tourism: 'viewpoint' }
  },
  {
    id: 'poi5',
    name: 'Nature Reserve',
    description: 'Protected area with diverse wildlife and natural beauty',
    location: { lat: 28.6100, lng: 77.2200 },
    rating: 4.6,
    visitDuration: 2.5,
    tags: { leisure: 'nature_reserve', natural: 'wood' }
  }
];

// Test function
async function testOptimizer() {
  console.log('===== TESTING TRIP OPTIMIZER =====');
  
  // Build location graph from sample POIs
  console.log('\nBuilding location graph from sample POIs...');
  const locationGraph = graph.buildGraph(samplePOIs);
  console.log(`Graph built with ${Object.keys(locationGraph.nodes).length} nodes`);
  
  // Test different trip types
  const tripTypes = ['Historical', 'Adventure', 'Religious', 'Nature', 'Romantic'];
  const days = 2;
  
  for (const tripType of tripTypes) {
    console.log(`\n===== TESTING ${tripType.toUpperCase()} TRIP TYPE =====`);
    
    // Optimize trip for this trip type
    const optimizedResult = optimizer.optimizeTrip(locationGraph, days, tripType);
    
    // Print optimization metadata
    console.log('\nOptimization Metadata:');
    console.log(JSON.stringify(optimizedResult.metadata, null, 2));
    
    // Print daily itineraries
    console.log('\nDaily Itineraries:');
    optimizedResult.dailyItineraries.forEach((day, index) => {
      console.log(`\nDay ${index + 1}:`);
      day.forEach(poi => {
        console.log(`- ${poi.name} (Rating: ${poi.rating}, Visit: ${poi.visitDuration}h, Travel: ${poi.travelTimeToNext || 0}h)`);
        if (poi.importance) {
          console.log(`  Importance: ${poi.importance.toFixed(2)}`);
        }
      });
    });
  }
}

// Run the test
testOptimizer()
  .then(() => console.log('\nTest completed successfully'))
  .catch(err => console.error('Test failed:', err));
