import {
    DATA_PATHS,
    FLOOD_CONFIG,
    SCENARIO_PARAMETER_VALUES
} from './config.js';

const FLOOD_STYLE = {
    color: '#3498db',
    weight: 0,
    fillOpacity: 0.55
};

class ScenarioValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ScenarioValidationError';
    }
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours} Jam`;
    return `${hours} Jam ${remainingMinutes} Menit`;
}

function validateScenarioManifest(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.scenarios)) {
        throw new ScenarioValidationError(
            'Manifest skenario tidak mengikuti schemaVersion 1.'
        );
    }

    data.scenarios.forEach(scenario => {
        if (!scenario || typeof scenario.id !== 'string' ||
            typeof scenario.file !== 'string' ||
            typeof scenario.label !== 'string' ||
            !hasValidParameters(scenario.parameters)) {
            throw new ScenarioValidationError(
                'Manifest memiliki skenario dengan id, file, atau label yang tidak valid.'
            );
        }
    });

    return data.scenarios;
}

function hasValidParameters(parameters) {
    return parameters &&
        Object.entries(SCENARIO_PARAMETER_VALUES).every(([key, values]) =>
            values.includes(parameters[key])
        );
}

function validateScenario(data) {
    if (!data || data.schemaVersion !== 1 ||
        !data.scenario || typeof data.scenario.id !== 'string' ||
        !hasValidParameters(data.scenario.parameters) ||
        !data.spatial || data.spatial.crs !== 'EPSG:4326' ||
        !data.time || data.time.stepMinutes !== FLOOD_CONFIG.stepMinutes ||
        data.time.frameCount !== FLOOD_CONFIG.frameCount ||
        !Array.isArray(data.frames) ||
        data.frames.length !== FLOOD_CONFIG.frameCount) {
        throw new ScenarioValidationError(
            'Data skenario tidak memenuhi kontrak 25 frame, interval 60 menit, dan EPSG:4326.'
        );
    }

    data.frames.forEach((frame, index) => {
        if (!frame || frame.index !== index ||
            frame.elapsedMinutes !== index * FLOOD_CONFIG.stepMinutes ||
            !frame.data || frame.data.type !== 'FeatureCollection' ||
            !Array.isArray(frame.data.features)) {
            throw new ScenarioValidationError(
                `Frame ${index} tidak valid atau urutannya tidak lengkap.`
            );
        }
    });

    return data;
}

async function fetchJson(url, signal, errorMessage) {
    let response;

    try {
        response = await fetch(url, { signal });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error(errorMessage);
    }

    if (!response.ok) {
        throw new Error(`${errorMessage} (HTTP ${response.status}).`);
    }

    try {
        return await response.json();
    } catch {
        throw new ScenarioValidationError('Respons server bukan JSON yang valid.');
    }
}

export async function loadScenario(scenario, signal) {
    const scenarioData = await fetchJson(
        `${DATA_PATHS.scenarios}/${scenario.file}`,
        signal,
        `File skenario "${scenario.file}" tidak dapat dimuat`
    );

    const validatedScenario = validateScenario(scenarioData);
    if (validatedScenario.scenario.id !== scenario.id) {
        throw new ScenarioValidationError(
            `ID file skenario "${scenario.file}" tidak cocok dengan manifest.`
        );
    }

    return validatedScenario;
}

export function initializeFloodSimulation(map) {
    let currentScenario = null;
    let currentStepIndex = 0;
    let activeFloodLayer = null;
    let animationInterval = null;
    let isPlaying = false;
    let scenarioAbortController = null;

    const scenarioSelect = document.getElementById('scenario-select');
    const timeDisplay = document.getElementById('time-display');
    const loadingStatus = document.getElementById('loading-status');
    const timeSlider = document.getElementById('time-slider');
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');

    const setStatus = (message, type) => {
        loadingStatus.textContent = message;
        loadingStatus.dataset.status = type;
    };

    const clearActiveLayer = () => {
        if (activeFloodLayer) {
            map.removeLayer(activeFloodLayer);
            activeFloodLayer = null;
        }
    };

    const pauseSimulation = () => {
        isPlaying = false;
        clearInterval(animationInterval);
        animationInterval = null;
        btnPlay.disabled = !currentScenario;
        btnPause.disabled = true;
    };

    const updateFloodMap = index => {
        if (!currentScenario || !currentScenario.frames[index]) return;

        clearActiveLayer();
        activeFloodLayer = L.geoJSON(
            currentScenario.frames[index].data,
            { style: FLOOD_STYLE }
        );
        activeFloodLayer.addTo(map);

        timeDisplay.textContent = formatTime(
            currentScenario.frames[index].elapsedMinutes
        );
        timeSlider.value = index;
        currentStepIndex = index;
    };

    const setPlayerEnabled = enabled => {
        timeSlider.disabled = !enabled;
        btnPlay.disabled = !enabled;
        btnPause.disabled = true;
    };

    const loadSelectedScenario = async scenario => {
        pauseSimulation();
        clearActiveLayer();
        currentScenario = null;
        currentStepIndex = 0;
        setPlayerEnabled(false);
        setStatus(`Memuat skenario "${scenario.label}"...`, 'loading');

        if (scenarioAbortController) scenarioAbortController.abort();
        scenarioAbortController = new AbortController();
        const requestController = scenarioAbortController;

        try {
            const data = await loadScenario(scenario, requestController.signal);
            if (requestController !== scenarioAbortController) return;

            currentScenario = data;
            timeSlider.max = String(data.frames.length - 1);
            updateFloodMap(0);
            setPlayerEnabled(true);
            setStatus('Skenario siap. Silakan putar simulasi.', 'success');
        } catch (error) {
            if (error.name === 'AbortError') return;

            console.error('Gagal memuat skenario:', error);
            const isValidationError = error.name === 'ScenarioValidationError';
            setStatus(
                isValidationError
                    ? `Validation error: ${error.message}`
                    : `Network error: ${error.message}`,
                'error'
            );
        }
    };

    const loadScenarioManifest = async () => {
        setStatus('Memuat daftar skenario...', 'loading');

        try {
            const manifest = await fetchJson(
                DATA_PATHS.scenarioManifest,
                new AbortController().signal,
                'Manifest skenario tidak dapat dimuat'
            );
            const scenarios = validateScenarioManifest(manifest);

            scenarioSelect.replaceChildren();
            scenarios.forEach(scenario => {
                const option = document.createElement('option');
                option.value = scenario.id;
                option.textContent = scenario.label;
                scenarioSelect.append(option);
            });

            if (scenarios.length === 0) {
                scenarioSelect.disabled = true;
                setStatus('Validation error: belum ada skenario yang tersedia.', 'error');
                return;
            }

            scenarioSelect.disabled = false;
            scenarioSelect.addEventListener('change', () => {
                const selectedScenario = scenarios.find(
                    scenario => scenario.id === scenarioSelect.value
                );
                if (selectedScenario) loadSelectedScenario(selectedScenario);
            });
            loadSelectedScenario(scenarios[0]);
        } catch (error) {
            console.error('Gagal memuat manifest skenario:', error);
            const isValidationError = error.name === 'ScenarioValidationError';
            setStatus(
                isValidationError
                    ? `Validation error: ${error.message}`
                    : `Network error: ${error.message}`,
                'error'
            );
        }
    };

    btnPlay.addEventListener('click', () => {
        if (isPlaying || !currentScenario) return;

        isPlaying = true;
        btnPlay.disabled = true;
        btnPause.disabled = false;
        animationInterval = setInterval(() => {
            const nextIndex = (currentStepIndex + 1) % currentScenario.frames.length;
            updateFloodMap(nextIndex);
        }, FLOOD_CONFIG.animationDelay);
    });

    btnPause.addEventListener('click', pauseSimulation);

    timeSlider.addEventListener('input', event => {
        if (isPlaying) pauseSimulation();
        updateFloodMap(Number.parseInt(event.target.value, 10));
    });

    loadScenarioManifest();
}
