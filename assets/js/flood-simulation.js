import { DATA_PATHS, FLOOD_CONFIG } from './config.js';

function createTimeSteps() {
    const timeSteps = [];

    for (
        let minute = FLOOD_CONFIG.startMinute;
        minute <= FLOOD_CONFIG.endMinute;
        minute += FLOOD_CONFIG.stepMinute
    ) {
        timeSteps.push(minute);
    }

    return timeSteps;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes} Menit`;
    if (remainingMinutes === 0) return `${hours} Jam`;
    return `${hours} Jam ${remainingMinutes} Menit`;
}

function getFloodDataPath(minutes) {
    const formattedMinutes = String(minutes).padStart(3, '0');
    return `${DATA_PATHS.flood}/banjir-${formattedMinutes}-menit.geojson`;
}

function loadFloodLayer(minutes) {
    return fetch(getFloodDataPath(minutes))
        .then(response => {
            if (!response.ok) {
                throw new Error(`File banjir-${minutes}-menit.geojson tidak ditemukan`);
            }
            return response.json();
        })
        .then(data => L.geoJSON(data, {
            style: { color: '#3498db', weight: 0, fillOpacity: 0.55 }
        }));
}

export function initializeFloodSimulation(map) {
    const timeSteps = createTimeSteps();
    const floodLayers = {};
    let currentStepIndex = 0;
    let animationInterval = null;
    let isPlaying = false;
    let activeFloodLayer = null;

    const timeDisplay = document.getElementById('time-display');
    const loadingStatus = document.getElementById('loading-status');
    const timeSlider = document.getElementById('time-slider');
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');

    const updateFloodMap = index => {
        const minute = timeSteps[index];

        if (activeFloodLayer) {
            map.removeLayer(activeFloodLayer);
        }

        if (floodLayers[minute]) {
            activeFloodLayer = floodLayers[minute];
            map.addLayer(activeFloodLayer);
        }

        timeDisplay.innerText = formatTime(minute);
        timeSlider.value = index;
        currentStepIndex = index;
    };

    const pauseSimulation = () => {
        isPlaying = false;
        clearInterval(animationInterval);
        animationInterval = null;
        btnPlay.disabled = false;
        btnPause.disabled = true;
    };

    btnPlay.addEventListener('click', () => {
        if (isPlaying) return;

        isPlaying = true;
        btnPlay.disabled = true;
        btnPause.disabled = false;

        animationInterval = setInterval(() => {
            let nextIndex = currentStepIndex + 1;

            if (nextIndex >= timeSteps.length) {
                nextIndex = 0;
            }

            updateFloodMap(nextIndex);
        }, FLOOD_CONFIG.animationDelay);
    });

    btnPause.addEventListener('click', pauseSimulation);

    timeSlider.addEventListener('input', event => {
        if (isPlaying) {
            pauseSimulation();
        }

        updateFloodMap(Number.parseInt(event.target.value, 10));
    });

    Promise.all(timeSteps.map(minutes =>
        loadFloodLayer(minutes)
            .then(layer => {
                floodLayers[minutes] = layer;
            })
            .catch(error => {
                console.error('Error loading flood data:', error);
            })
    )).then(() => {
        loadingStatus.style.color = '#27ae60';
        loadingStatus.innerText = 'Semua data siap! Silakan putar simulasi.';
        timeSlider.disabled = false;
        btnPlay.disabled = false;
        updateFloodMap(0);
    });
}
