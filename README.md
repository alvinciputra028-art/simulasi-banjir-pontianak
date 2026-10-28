# WebGIS Simulasi Banjir Kota Pontianak

Aplikasi WebGIS untuk memvisualisasikan hasil pre-calculated genangan banjir di
Kota Pontianak berdasarkan perubahan waktu. Aplikasi menampilkan peta
interaktif, layer referensi, dan 25 frame hasil Global Mapper dari menit ke-0
hingga menit ke-1440.

## Fitur

- Menampilkan peta dasar OpenStreetMap menggunakan Leaflet.
- Menampilkan batas administrasi kecamatan.
- Menampilkan jaringan sungai.
- Menampilkan sungai besar.
- Memilih satu skenario yang terdaftar pada manifest melalui dropdown.
- Menampilkan data genangan banjir berdasarkan interval waktu 60 menit.
- Mengubah waktu simulasi menggunakan slider.
- Memutar simulasi secara otomatis menggunakan tombol **Putar (Play)**.
- Menghentikan simulasi menggunakan tombol **Jeda (Pause)**.
- Menampilkan waktu simulasi dalam format menit dan jam.
- Memuat satu file JSON skenario setelah skenario dipilih.
- Membatalkan pemuatan skenario lama saat pilihan diganti dengan cepat.

## Teknologi

- HTML5
- CSS3
- JavaScript ES Modules
- Leaflet 1.9.4
- GeoJSON
- OpenStreetMap
- XAMPP sebagai server lokal

Leaflet dan tile OpenStreetMap dimuat melalui CDN pada [index.html](./index.html). Aplikasi tidak menggunakan framework JavaScript atau proses build sehingga dapat dijalankan sebagai aplikasi web statis.

## Struktur Folder

```text
simulasi_banjir/
├── index.html
├── README.md
│
└── assets/
    ├── css/
    │   └── style.css
    │
    ├── js/
    │   ├── app.js
    │   ├── config.js
    │   ├── flood-simulation.js
    │   ├── layers.js
    │   └── map.js
    │
    └── data/
        ├── reference/
        │   ├── admin-kecamatan.json
        │   ├── sungai.geojson
        │   └── sungai-besar.geojson
        │
        └── scenarios/
            └── manifest.json
```

### Penjelasan folder

- `index.html`: halaman utama dan struktur elemen antarmuka.
- `assets/css/style.css`: style layout, sidebar, peta, kontrol layer, dan pemutar simulasi.
- `assets/js/`: logika aplikasi yang dipisahkan berdasarkan tanggung jawab.
- `assets/data/reference/`: data geografis yang tidak berubah mengikuti waktu simulasi.
- `assets/data/scenarios/`: manifest dan satu file JSON untuk setiap skenario
  yang sudah tersedia.

## Arsitektur JavaScript

### `app.js`

Merupakan entry point aplikasi. Modul ini menginisialisasi peta, layer referensi, dan simulasi banjir.

```javascript
const map = initializeMap();

initializeReferenceLayers(map);
initializeFloodSimulation(map);
```

File ini dimuat menggunakan:

```html
<script type="module" src="assets/js/app.js"></script>
```

### `config.js`

Menyimpan konfigurasi terpusat:

- Koordinat tengah dan zoom awal peta.
- Jumlah frame dan interval waktu antarframe.
- Kecepatan pergantian frame.
- Path data referensi dan skenario.

Konfigurasi simulasi saat ini:

| Konfigurasi | Nilai |
|---|---:|
| Frame | 0 sampai 24 (25 frame) |
| Durasi simulasi | 0 sampai 1440 menit |
| Interval data | 60 menit |
| Kecepatan animasi | 1 detik per frame |

### `map.js`

Menyiapkan peta Leaflet pada elemen HTML dengan ID `map`, menetapkan posisi awal Kota Pontianak, dan menambahkan tile layer OpenStreetMap.

### `layers.js`

Menangani layer referensi:

- Membuat grup layer kecamatan, sungai, dan sungai besar.
- Memuat file GeoJSON.
- Memberikan style pada setiap layer.
- Menampilkan popup nama kecamatan.
- Menghubungkan checkbox pada sidebar dengan visibilitas layer.

### `flood-simulation.js`

Menangani seluruh proses simulasi:

1. Memuat manifest dan hanya menampilkan skenario yang terdaftar.
2. Memuat satu file JSON saat skenario dipilih.
3. Memvalidasi schema, CRS, jumlah frame, urutan waktu, dan FeatureCollection.
4. Membatalkan request skenario lama dengan `AbortController`.
5. Menampilkan frame banjir yang sesuai.
6. Mengatur pemutaran berulang menggunakan `setInterval`.
7. Menghentikan animasi saat tombol pause ditekan atau slider digeser.

## Alur Data Aplikasi

```text
index.html
    │
    └── assets/js/app.js
            ├── map.js
            │     └── Membuat peta Leaflet
            │
            ├── layers.js
            │     └── Memuat data/reference/*.geojson
            │
            └── flood-simulation.js
                  ├── Memuat data/scenarios/manifest.json
                  └── Memuat satu data/scenarios/{scenario}.json
```

Saat aplikasi dibuka:

1. Peta Leaflet dibuat pada koordinat awal.
2. Layer referensi mulai dimuat.
3. Manifest skenario dimuat.
4. Status pemuatan ditampilkan pada sidebar.
5. Skenario yang dipilih dimuat dan divalidasi.
6. Setelah berhasil, slider dan tombol Play diaktifkan.
7. Frame pertama, yaitu menit ke-0, ditampilkan pada peta.

## Format Data Skenario

Nama file harus mengikuti pola berikut:

```text
[hujan]__[pasang]__[limpasan]__[awal].json
```

Contoh:

```text
ekstrem__tinggi__terburuk__jenuh.json
```

Setiap file harus mengikuti struktur `schemaVersion`, `scenario`, `spatial`,
`time`, `provenance`, dan `frames` yang dijelaskan pada
[ARSITEKTUR-REVISI-SIMULASI-BANJIR.md](./ARSITEKTUR-REVISI-SIMULASI-BANJIR.md).
Daftarkan hanya file yang benar-benar tersedia di
`assets/data/scenarios/manifest.json`.

Setiap entri manifest juga wajib mencantumkan kode kategori
`rainfall`, `waterLevel`, `runoff`, dan `initialCondition`. Kode yang valid
adalah `normal`, `heavy`, `extreme`; `normal`, `high-tidal`; `existing`,
`worst`; serta `dry`, `wet`, secara berurutan. Label yang ditampilkan kepada
pengguna dapat tetap menggunakan Bahasa Indonesia.

```javascript
export const FLOOD_CONFIG = {
    frameCount: 25,
    stepMinutes: 60,
    animationDelay: 1000
};
```

## Cara Menjalankan

### Prasyarat

- XAMPP telah terpasang.
- Apache XAMPP dapat dijalankan.
- Browser modern yang mendukung JavaScript ES Modules.

### Langkah menjalankan

1. Pastikan folder proyek berada di:

   ```text
   C:\xampp_new\htdocs\simulasi_banjir
   ```

2. Buka **XAMPP Control Panel**.
3. Jalankan modul **Apache**.
4. Buka alamat berikut pada browser:

   ```text
   http://localhost/simulasi_banjir/
   ```

Jangan membuka `index.html` langsung menggunakan `file://`. JavaScript menggunakan `fetch()` untuk memuat GeoJSON, sehingga aplikasi perlu dijalankan melalui server HTTP seperti Apache.

## Pengembangan

### Mengubah posisi awal peta

Edit `MAP_CONFIG` pada [config.js](./assets/js/config.js):

```javascript
export const MAP_CONFIG = {
    center: [-0.0227, 109.3425],
    zoom: 13
};
```

### Mengubah kecepatan animasi

Edit `animationDelay`. Nilai menggunakan satuan milidetik:

```javascript
animationDelay: 1000
```

Contoh `500` berarti pergantian frame setiap setengah detik.

### Menambahkan layer referensi

1. Simpan file GeoJSON baru di `assets/data/reference/`.
2. Tambahkan path file pada `DATA_PATHS.reference` di [config.js](./assets/js/config.js).
3. Muat file menggunakan pola yang sudah tersedia di [layers.js](./assets/js/layers.js).
4. Tambahkan checkbox pada [index.html](./index.html) jika layer perlu dikontrol pengguna.

### Mengubah tampilan

Style dapat diperbarui pada [style.css](./assets/css/style.css). Struktur utama halaman terdiri dari:

- `.sidebar`: panel kontrol.
- `.control-group`: kelompok kontrol.
- `.player-section`: kontrol simulasi waktu.
- `#map`: area peta.

## Troubleshooting

### Data tidak selesai dimuat

Periksa hal berikut:

- Apache sedang berjalan.
- URL yang digunakan diawali `http://localhost/`.
- File skenario terdaftar pada `assets/data/scenarios/manifest.json`.
- Path dan nama file pada manifest benar.
- Buka Developer Tools browser dan periksa tab **Console** atau **Network**.

### Peta tidak tampil

Periksa koneksi internet karena tile OpenStreetMap dan library Leaflet dimuat dari CDN. Pastikan elemen `#map` tersedia dan memiliki tinggi pada [style.css](./assets/css/style.css).

### Tombol Play tidak aktif

Tombol Play baru diaktifkan setelah satu file skenario berhasil dimuat dan
divalidasi. Jika manifest masih kosong, aplikasi menampilkan validation error
dan pemutar tetap nonaktif sampai hasil Global Mapper didaftarkan.

### Perubahan JavaScript tidak terlihat

Lakukan hard refresh pada browser:

- Windows/Linux: `Ctrl + F5`
- macOS: `Cmd + Shift + R`

## Catatan Performa

Data simulasi banjir terdiri dari banyak file GeoJSON berukuran besar dan saat ini seluruh frame dimuat sebelum simulasi dimulai. Total data flood pada repository berukuran sekitar 138 MB.

Pendekatan ini membuat perpindahan frame lebih lancar setelah pemuatan selesai, tetapi membutuhkan waktu awal dan memori browser yang lebih besar. Jika jumlah data bertambah, pertimbangkan:

- Memuat data sesuai kebutuhan saat slider berpindah.
- Menggunakan cache browser atau IndexedDB.
- Menyederhanakan geometri GeoJSON.
- Menggunakan format spasial yang lebih efisien.
- Menyediakan endpoint API untuk data simulasi.

## Status Implementasi

- [x] Peta interaktif.
- [x] Layer batas kecamatan.
- [x] Layer jaringan sungai.
- [x] Layer sungai besar.
- [x] Simulasi banjir 30 sampai 720 menit.
- [x] Slider waktu.
- [x] Kontrol Play/Pause.
- [x] Pemisahan JavaScript ke dalam beberapa modul.
- [x] Dokumentasi proyek.

## Lisensi dan Atribusi

- Data peta dasar menggunakan OpenStreetMap. Atribusi ditampilkan pada peta sesuai ketentuan penggunaan OpenStreetMap.
- Data geografis dan data simulasi mengikuti sumber atau ketentuan penggunaan yang berlaku pada proyek ini.
