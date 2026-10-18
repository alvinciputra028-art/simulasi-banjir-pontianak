# WebGIS Simulasi Banjir Kota Pontianak

Aplikasi WebGIS untuk memvisualisasikan simulasi genangan banjir di Kota Pontianak berdasarkan perubahan waktu. Aplikasi menampilkan peta interaktif, batas administrasi kecamatan, jaringan sungai, sungai besar, serta animasi data genangan dari 30 menit hingga 720 menit.

## Fitur

- Menampilkan peta dasar OpenStreetMap menggunakan Leaflet.
- Menampilkan batas administrasi kecamatan.
- Menampilkan jaringan sungai.
- Menampilkan sungai besar.
- Menampilkan data genangan banjir berdasarkan interval waktu 30 menit.
- Mengubah waktu simulasi menggunakan slider.
- Memutar simulasi secara otomatis menggunakan tombol **Putar (Play)**.
- Menghentikan simulasi menggunakan tombol **Jeda (Pause)**.
- Menampilkan waktu simulasi dalam format menit dan jam.
- Memuat seluruh data simulasi secara paralel sebelum pemutar diaktifkan.

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
        └── flood/
            ├── banjir-030-menit.geojson
            ├── banjir-060-menit.geojson
            ├── banjir-090-menit.geojson
            └── ...
```

### Penjelasan folder

- `index.html`: halaman utama dan struktur elemen antarmuka.
- `assets/css/style.css`: style layout, sidebar, peta, kontrol layer, dan pemutar simulasi.
- `assets/js/`: logika aplikasi yang dipisahkan berdasarkan tanggung jawab.
- `assets/data/reference/`: data geografis yang tidak berubah mengikuti waktu simulasi.
- `assets/data/flood/`: data genangan banjir berdasarkan waktu.

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
- Waktu awal simulasi.
- Waktu akhir simulasi.
- Interval waktu antar data.
- Kecepatan pergantian frame.
- Path data referensi dan data banjir.

Konfigurasi simulasi saat ini:

| Konfigurasi | Nilai |
|---|---:|
| Waktu awal | 30 menit |
| Waktu akhir | 720 menit |
| Interval data | 30 menit |
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

1. Membuat daftar waktu dari 30 sampai 720 menit.
2. Membentuk path file berdasarkan pola nama data.
3. Memuat seluruh file GeoJSON banjir secara paralel.
4. Mengaktifkan slider dan tombol setelah proses pemuatan selesai.
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
                  └── Memuat data/flood/banjir-XXX-menit.geojson
```

Saat aplikasi dibuka:

1. Peta Leaflet dibuat pada koordinat awal.
2. Layer referensi mulai dimuat.
3. Seluruh data simulasi banjir dimuat secara paralel.
4. Status pemuatan ditampilkan pada sidebar.
5. Setelah semua proses selesai, slider dan tombol Play diaktifkan.
6. Frame pertama, yaitu 30 menit, ditampilkan pada peta.

## Format Data Banjir

Nama file harus mengikuti pola berikut:

```text
banjir-{waktu tiga digit}-menit.geojson
```

Contoh:

```text
banjir-030-menit.geojson
banjir-060-menit.geojson
banjir-120-menit.geojson
banjir-720-menit.geojson
```

Format tiga digit wajib digunakan karena path file dibuat menggunakan `padStart(3, '0')`. Jika ingin menambahkan atau mengurangi waktu simulasi, sesuaikan nilai berikut pada [config.js](./assets/js/config.js):

```javascript
export const FLOOD_CONFIG = {
    startMinute: 30,
    endMinute: 720,
    stepMinute: 30,
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
- Nama file pada `assets/data/flood/` sesuai pola yang ditentukan.
- Path pada [config.js](./assets/js/config.js) benar.
- Buka Developer Tools browser dan periksa tab **Console** atau **Network**.

### Peta tidak tampil

Periksa koneksi internet karena tile OpenStreetMap dan library Leaflet dimuat dari CDN. Pastikan elemen `#map` tersedia dan memiliki tinggi pada [style.css](./assets/css/style.css).

### Tombol Play tidak aktif

Tombol Play baru diaktifkan setelah seluruh data banjir selesai diproses. Karena data GeoJSON cukup besar, proses awal dapat membutuhkan waktu dan memori browser yang signifikan.

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
