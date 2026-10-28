export const MAP_CONFIG = {
    center: [-0.0227, 109.3425],
    zoom: 13
};

export const FLOOD_CONFIG = {
    frameCount: 25,
    stepMinutes: 60,
    animationDelay: 1000
};

export const SCENARIO_PARAMETER_VALUES = {
    rainfall: ['normal', 'heavy', 'extreme'],
    waterLevel: ['normal', 'high-tidal'],
    runoff: ['existing', 'worst'],
    initialCondition: ['dry', 'wet']
};

export const DATA_PATHS = {
    reference: {
        kecamatan: 'assets/data/reference/admin-kecamatan.json',
        sungai: 'assets/data/reference/sungai.geojson',
        sungaiBesar: 'assets/data/reference/sungai-besar.geojson'
    },
    scenarios: 'assets/data/scenarios',
    scenarioManifest: 'assets/data/scenarios/manifest.json'
};
