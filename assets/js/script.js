// 1. Inisialisasi Peta
const map = L.map('map').setView([-0.0227, 109.3425], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 2. Layer Groups Referensi
const layerGroups = {
    kecamatan: L.layerGroup().addTo(map),
    sungai: L.layerGroup().addTo(map),
    sungaiBesar: L.layerGroup().addTo(map)
};

// Memuat Data Referensi
fetch('assets/data/reference/admin-kecamatan.json').then(r => r.json()).then(data => {
    L.geoJSON(data, {
        style: function (f) {
            const n = (f.properties.Ket || "").toUpperCase();
            let c = "#ccc";
            if (n.includes("BARAT")) c = "#e41a1c";
            else if (n.includes("KOTA")) c = "#377eb8";
            else if (n.includes("SELATAN")) c = "#4daf4a";
            else if (n.includes("TENGGARA")) c = "#984ea3";
            else if (n.includes("TIMUR")) c = "#ff7f00";
            else if (n.includes("UTARA")) c = "#f1c40f";
            return { color: "#2c3e50", weight: 2, fillColor: c, fillOpacity: 0.3 };
        },
        onEachFeature: (f, l) => l.bindPopup(`<b>Kecamatan ${f.properties.Ket.replace('PONTIANAK ', '')}</b>`)
    }).addTo(layerGroups.kecamatan);
});

fetch('assets/data/reference/sungai.geojson').then(r => r.json()).then(data => {
    L.geoJSON(data, { style: { color: "#3498db", weight: 1.5, opacity: 0.8 } }).addTo(layerGroups.sungai);
});

fetch('assets/data/reference/sungai-besar.geojson').then(r => r.json()).then(data => {
    L.geoJSON(data, { style: { color: "#2980b9", weight: 3, opacity: 1 } }).addTo(layerGroups.sungaiBesar);
});

// Toggle Layer Referensi
document.getElementById('layerKecamatan').addEventListener('change', function() { this.checked ? map.addLayer(layerGroups.kecamatan) : map.removeLayer(layerGroups.kecamatan); });
document.getElementById('layerSungai').addEventListener('change', function() { this.checked ? map.addLayer(layerGroups.sungai) : map.removeLayer(layerGroups.sungai); });
document.getElementById('layerSungaiBesar').addEventListener('change', function() { this.checked ? map.addLayer(layerGroups.sungaiBesar) : map.removeLayer(layerGroups.sungaiBesar); });


// 3. LOGIKA SIMULASI BANJIR BERDASARKAN WAKTU (TIME-SERIES ANIMATION)
const timeSteps = [];
for (let i = 30; i <= 720; i += 30) {
    timeSteps.push(i);
}

const floodLayers = {}; // Tempat menyimpan layer yang sudah diload
let currentStepIndex = 0; // Indeks waktu saat ini
let animationInterval = null; // Variabel pengontrol putaran interval
let isPlaying = false; // Status apakah sedang diputar

// Elemen UI
const timeDisplay = document.getElementById('time-display');
const loadingStatus = document.getElementById('loading-status');
const timeSlider = document.getElementById('time-slider');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
let activeFloodLayer = null; // Menyimpan layer banjir yang sedang tampil di peta

// A. Fungsi Mengubah Format Menit ke Jam & Menit
function formatWaktu(menit) {
    const h = Math.floor(menit / 60);
    const m = menit % 60;
    if (h === 0) return `${m} Menit`;
    if (m === 0) return `${h} Jam`;
    return `${h} Jam ${m} Menit`;
}

// B. Memuat Semua File GeoJSON Sekaligus Secara Paralel (Pre-loading)
const fetchPromises = timeSteps.map(menit => {
    const menitFormat = String(menit).padStart(3, '0');
    return fetch(`assets/data/flood/banjir-${menitFormat}-menit.geojson`)
        .then(response => {
            if (!response.ok) throw new Error(`File banjir-${menit}-menit.geojson tidak ditemukan`);
            return response.json();
        })
        .then(data => {
            floodLayers[menit] = L.geoJSON(data, {
                style: { color: "#3498db", weight: 0, fillOpacity: 0.55 }
            });
        })
        .catch(err => console.error("Error Loading Data:", err));
});

// C. Mengaktifkan Pemutar UI
Promise.all(fetchPromises).then(() => {
    loadingStatus.style.color = "#27ae60";
    loadingStatus.innerText = "Semua data siap! Silakan putar simulasi.";
    
    // Slider dan tombol
    timeSlider.disabled = false;
    btnPlay.disabled = false;
    
    // Menampilkan data pertama (menit ke-30) ke peta
    perbaruiPetaBanjir(0);
});

// D. Fungsi Utama Menampilkan Banjir Berdasarkan Indeks Slider
function perbaruiPetaBanjir(index) {
    const menit = timeSteps[index];
    
    // Hapus layer banjir yang tampil sebelumnya
    if (activeFloodLayer) {
        map.removeLayer(activeFloodLayer);
    }
    
    // Tambahkan layer banjir baru jika datanya ada
    if (floodLayers[menit]) {
        activeFloodLayer = floodLayers[menit];
        map.addLayer(activeFloodLayer);
    }

    // Perbarui teks UI & posisi slider
    timeDisplay.innerText = formatWaktu(menit);
    timeSlider.value = index;
    currentStepIndex = index;
}

// E. Logika Animasi Otomatis (Tombol Play)
btnPlay.addEventListener('click', () => {
    if (isPlaying) return;
    isPlaying = true;
    
    btnPlay.disabled = true;
    btnPause.disabled = false;

    // Putar interval setiap 1000 milidetik (1 detik per pergantian frame)
    animationInterval = setInterval(() => {
        let nextIndex = currentStepIndex + 1;
        
        // Jika sudah mencapai akhir (720 menit), putar ulang dari 0
        if (nextIndex >= timeSteps.length) {
            nextIndex = 0; 
        }
        
        perbaruiPetaBanjir(nextIndex);
    }, 1000); 
});

// F. Logika Jeda (Tombol Pause)
btnPause.addEventListener('click', () => {
    isPlaying = false;
    clearInterval(animationInterval);
    
    btnPlay.disabled = false;
    btnPause.disabled = true;
});

// G. Logika Saat Slider Digeser Secara Manual oleh Pengguna
timeSlider.addEventListener('input', (e) => {
    // Hentikan animasi jika sedang berjalan
    if (isPlaying) {
        btnPause.click(); 
    }
    // Perbarui peta ke titik waktu yang digeser
    const indexPilihan = parseInt(e.target.value);
    perbaruiPetaBanjir(indexPilihan);
});