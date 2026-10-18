import { DATA_PATHS } from './config.js';

function createReferenceLayerGroups(map) {
    return {
        kecamatan: L.layerGroup().addTo(map),
        sungai: L.layerGroup().addTo(map),
        sungaiBesar: L.layerGroup().addTo(map)
    };
}

function getKecamatanStyle(feature) {
    const name = (feature.properties.Ket || '').toUpperCase();
    let fillColor = '#ccc';

    if (name.includes('BARAT')) fillColor = '#e41a1c';
    else if (name.includes('KOTA')) fillColor = '#377eb8';
    else if (name.includes('SELATAN')) fillColor = '#4daf4a';
    else if (name.includes('TENGGARA')) fillColor = '#984ea3';
    else if (name.includes('TIMUR')) fillColor = '#ff7f00';
    else if (name.includes('UTARA')) fillColor = '#f1c40f';

    return {
        color: '#2c3e50',
        weight: 2,
        fillColor,
        fillOpacity: 0.3
    };
}

function loadGeoJson(path, options, targetLayer) {
    return fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Data referensi tidak ditemukan: ${path}`);
            }
            return response.json();
        })
        .then(data => L.geoJSON(data, options).addTo(targetLayer))
        .catch(error => {
            console.error('Error loading reference data:', error);
        });
}

function setupLayerToggle(map, layerGroups, elementId, layerName) {
    const checkbox = document.getElementById(elementId);

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            map.addLayer(layerGroups[layerName]);
        } else {
            map.removeLayer(layerGroups[layerName]);
        }
    });
}

export function initializeReferenceLayers(map) {
    const layerGroups = createReferenceLayerGroups(map);

    loadGeoJson(DATA_PATHS.reference.kecamatan, {
        style: getKecamatanStyle,
        onEachFeature: (feature, layer) => {
            const name = feature.properties.Ket || '';
            layer.bindPopup(`<b>Kecamatan ${name.replace('PONTIANAK ', '')}</b>`);
        }
    }, layerGroups.kecamatan);

    loadGeoJson(DATA_PATHS.reference.sungai, {
        style: { color: '#3498db', weight: 1.5, opacity: 0.8 }
    }, layerGroups.sungai);

    loadGeoJson(DATA_PATHS.reference.sungaiBesar, {
        style: { color: '#2980b9', weight: 3, opacity: 1 }
    }, layerGroups.sungaiBesar);

    setupLayerToggle(map, layerGroups, 'layerKecamatan', 'kecamatan');
    setupLayerToggle(map, layerGroups, 'layerSungai', 'sungai');
    setupLayerToggle(map, layerGroups, 'layerSungaiBesar', 'sungaiBesar');

    return layerGroups;
}
