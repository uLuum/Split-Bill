# Split Bill App
Aplikasi untuk membagi tagihan secara adil antar anggota, lengkap dengan perhitungan pajak, biaya layanan, diskon, serta export PDF.

Dibagi menjadi 2 bagian:

- Frontend: HTML, CSS, JS (tampilan input & hasil)
- Backend: Node.js + Express (perhitungan & export PDF)

# Struktur Folder
SPLIT BILL/
├── ASET IMAGE/ # Logo & gambar
├── back_split/ # Backend (Node.js + Express)
│ ├── server.js
│ ├── package.json
│ └── ...
├── public_frontend_php/ # Frontend (PHP + JS + CSS)
├── index.php
│ ├── script.js
│ └── style.css
├── .env # Konfigurasi environment
├── .gitignore # File & folder yang diabaikan Git
└── README.md # Dokumentasi project

## Cara Menjalankan
### Backend
```bash
cd back_splitt
npm install
npm start
```
Server default jalan di: http://localhost:3000

### Frontend
```bash
cd public_frontend_php
php -S localhost:8000
```
Akses di browser: http://localhost:8000

⚡ Fitur Utama

Tambah anggota & pesanan per orang
Hitung pajak, biaya layanan, dan diskon
Ringkasan total & split per anggota
Export hasil pembagian ke PDF
Tampilan tema hijau-putih
🛠️ Tech Stack

Backend: Node.js, Express, pdfkit, pdfkit-table
Frontend: PHP, JavaScript, CSS
Database: (opsional, saat ini hanya frontend & export PDF)