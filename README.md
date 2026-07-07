# NEXUS Terminal — Dashboard Multi-Aset Global

Dashboard dark-mode premium (ungu/hitam/neon-biru, glassmorphism) yang menggabungkan
gaya TradingView, DexScreener, CoinMarketCap, Trading Economics & Yahoo Finance —
tanpa login/registrasi, semua data ditampilkan langsung di dashboard.

## Cara menjalankan

Tidak perlu instalasi atau build tool. Cukup buka `index.html` langsung di browser,
atau jalankan local server sederhana (disarankan agar Service Worker/PWA berfungsi):

```bash
cd dex-dashboard
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

Bisa juga di-deploy langsung ke Netlify/Vercel/GitHub Pages (static hosting) — tidak
ada backend/API key yang dibutuhkan.

## Struktur proyek

```
dex-dashboard/
├── index.html        # shell aplikasi: sidebar, topbar, ticker
├── css/style.css      # semua styling & tema (dark/purple/neon glassmorphism)
├── js/data.js         # SEMUA DATA DI SINI ADALAH DATA CONTOH/SIMULASI
├── js/app.js          # routing, rendering tiap halaman, watchlist/portfolio/alert (localStorage)
├── manifest.json      # PWA manifest
├── sw.js              # service worker (offline caching dasar)
└── assets/icon.svg
```

## ⚠️ Tentang data

Semua angka (harga, market cap, volume, indikator teknikal, skor AI, dll) di proyek
ini **dibuat secara acak/simulasi** (deterministik, jadi konsisten setiap dibuka) —
bukan data pasar nyata. Ini adalah demo tampilan & interaksi UI, bukan produk data
finansial. Untuk data real-time sungguhan, `js/data.js` perlu diganti agar mengambil
data dari API pihak ketiga (mis. CoinGecko, Binance, Alpha Vantage, dsb) — panggilan
`fetch()` ke API publik bisa langsung ditambahkan di sana karena file ini berjalan di
browser pengguna (bukan di server saya).

## Fitur yang sudah berfungsi

- Sidebar hamburger dengan 30+ menu (Crypto, Forex, Saham, Komoditas, Ekonomi Dunia, dll)
- Dashboard ringkasan pasar, mini heatmap, trending
- Tabel aset dengan sorting per kolom (klik header)
- Screener dengan filter market cap / exchange / chain / sector
- AI Analysis (simulasi): confidence ring, pattern, ICT concepts, trade plan
- Watchlist & Portfolio offline tersimpan di Local Storage (tanpa login)
- Alert Center (tersimpan lokal, belum ada notifikasi push nyata)
- Economic / Earnings / IPO Calendar, News feed dengan filter kategori
- Live-clock, ticker tape berjalan, global search (crypto/forex/saham/indeks/komoditas)
- Chart candlestick ringan (canvas, tanpa dependency eksternal) di halaman Bitcoin & Ethereum
- Export CSV pada tabel crypto family
- Responsif mobile/tablet/desktop, PWA-ready (manifest + service worker dasar)

## Batasan yang perlu diketahui

- Tidak ada data real-time sungguhan / WebSocket ke exchange asli
- Tidak ada backend, sehingga Alert Center tidak benar-benar mengirim notifikasi
- Beberapa kategori (mis. rincian harga pangan per komoditas, indeks industri) tidak
  memiliki API publik gratis yang baku, sehingga tetap memakai data simulasi meski
  nanti dihubungkan ke sumber data nyata
