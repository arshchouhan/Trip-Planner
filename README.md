# Trip Planner Application

A fullstack web application that helps users plan optimized trips using graph algorithms like Dijkstra's algorithm.

## Features

- Input form for trip details (destination, number of days, trip type)
- Graph-based route optimization using DSA (Data Structures and Algorithms)
- Interactive map display using Google Maps
- Detailed trip itinerary with time estimations
- Responsive design with Tailwind CSS

## Technology Stack

### Frontend
- React.js
- Tailwind CSS
- Google Maps (@react-google-maps/api)
- Axios for API calls

### Backend
- Node.js
- Express
- Data Structures: Graphs, Priority Queue
- Algorithms: Dijkstra's, Nearest Neighbor

## Project Structure

```
trip-planner/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── TripForm.js
│   │   │   ├── MapView.js
│   │   │   └── TripSummary.js
│   │   ├── api/          # API service
│   │   │   └── tripApi.js
│   │   ├── App.js        # Main application component
│   │   └── index.css     # Styles with Tailwind CSS
│   └── .env              # Environment variables
└── server/               # Express backend
    ├── routes/           # API routes
    │   └── tripRoute.js
    ├── controllers/      # Request handlers
    │   └── tripController.js
    ├── utils/            # Utility functions
    │   ├── graph.js      # Graph implementation
    │   └── optimizer.js  # Route optimization algorithms
    ├── index.js          # Server entry point
    └── .env              # Environment variables
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)
- Google Maps API Key

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd trip-planner
```

2. Setup environment variables:
   - In client/.env: Add your Google Maps API key
   - In server/.env: Add your Google Maps API key

3. Install dependencies and start the server:
```
# Install and start the backend
cd server
npm install
npm start

# In a new terminal, install and start the frontend
cd ../client
npm install
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## How It Works

1. The user inputs trip details like destination, number of days, and trip type
2. The backend builds a graph representation of points of interest (POIs)
3. The optimizer applies algorithms to find the optimal route:
   - Dijkstra's algorithm for shortest paths
   - Nearest Neighbor algorithm for tour construction
4. The optimized itinerary is returned to the frontend
5. The itinerary is displayed on Google Maps and as a detailed day-by-day plan

## Using the Application

1. Enter your destination (e.g., Jaipur)
2. Specify the number of days for your trip
3. Select your trip type (Historical, Adventure, Religious, Nature, Romantic)
4. Optionally enter your budget and preferred time of travel
5. Click "Plan My Trip" to get your optimized itinerary
6. View your itinerary on the map and in the detailed breakdown

## API Endpoints

- `POST /api/plan-trip`: Plan a trip based on provided parameters
  - Request body: `{ days, destination, tripType, budget, travelTime }`
  - Response: Optimized itinerary with points of interest

## Data Structure and Algorithm Details

- **Graph Representation**: Each location (POI) is a node, with edges representing travel distance/time
- **Priority Queue**: Used in Dijkstra's algorithm for efficient path finding
- **Nearest Neighbor Algorithm**: Greedy approach for solving the Traveling Salesman Problem
- **Time Complexity**: O(E log V) where E is the number of edges and V is the number of vertices
