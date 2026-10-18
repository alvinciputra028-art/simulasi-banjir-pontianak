import { initializeMap } from './map.js';
import { initializeReferenceLayers } from './layers.js';
import { initializeFloodSimulation } from './flood-simulation.js';

const map = initializeMap();

initializeReferenceLayers(map);
initializeFloodSimulation(map);
