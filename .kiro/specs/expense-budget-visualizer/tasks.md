# Implementation Plan: Expense & Budget Visualizer

## Overview

Implementasi aplikasi web finansial personal berbasis browser menggunakan HTML5, CSS3, dan Vanilla JavaScript dengan pola Module Pattern. Semua logika bisnis dienkapsulasi dalam modul-modul di `js/app.js`, data disimpan di Browser Local Storage, dan visualisasi menggunakan Chart.js via CDN.

## Tasks

- [x] 1. Setup struktur folder dan file dasar
  - [x] 1.1 Buat direktori `css/` dan `js/` di dalam project root
    - Buat file `index.html` dengan boilerplate HTML5 (`<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport">`)
    - Tambahkan `<link>` ke `css/style.css`
    - Tambahkan `<script>` CDN Chart.js sebelum `<script src="js/app.js">`
    - Tambahkan placeholder `<title>Expense & Budget Visualizer</title>`
    - _Requirements: 10.1, 10.2, 10.5_
  - [x] 1.2 Buat file `css/style.css` dengan CSS custom properties (variabel tema)
    - Definisikan variabel `:root` untuk light theme: `--color-primary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-shadow`
    - Definisikan variabel `--color-food`, `--color-transport`, `--color-fun` untuk warna kategori
    - Definisikan blok `[data-theme="dark"]` dengan override variabel warna
    - _Requirements: 9.3, 12.2_
  - [x] 1.3 Buat file `js/app.js` dengan struktur modul awal menggunakan IIFE atau module pattern
    - Deklarasikan konstanta `CATEGORIES`, `STORAGE_KEYS`, dan `ERROR_MESSAGES`
    - Buat fungsi `renderAll()` sebagai stub kosong
    - Pasang event listener `DOMContentLoaded` yang memanggil fungsi init
    - _Requirements: 10.4, 10.6_

- [x] 2. Implementasi StorageManager
  - [x] 2.1 Implementasikan `StorageManager` dengan metode baca/tulis transaksi
    - Implementasikan `loadTransactions()`: baca key `"evb_transactions"`, parse JSON, filter transaksi tidak valid dengan `isValidTransaction()`, kembalikan `[]` jika kosong atau parse error
    - Implementasikan `saveTransactions(transactions)`: serialisasi array ke JSON dan tulis ke key `"evb_transactions"`; tangkap QuotaExceededError
    - Implementasikan `loadTheme()`: baca key `"evb_theme"`, kembalikan `'light'` jika tidak ada
    - Implementasikan `saveTheme(theme)`: tulis nilai tema ke key `"evb_theme"`
    - Implementasikan helper `isValidTransaction(t)`: cek keberadaan `id`, `name`, `amount`, `category`, `date` dan nilai kategori valid
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
 

- [x] 3. Implementasi TransactionManager dan data model
  - [x] 3.1 Definisikan data model `Transaction` dan implementasikan `TransactionManager`
    - Deklarasikan `transactions` sebagai array state in-memory
    - Implementasikan `load()`: panggil `StorageManager.loadTransactions()` dan isi state
    - Implementasikan `add(data)`: buat objek Transaction baru dengan `id = Date.now().toString()`, `name`, `amount` (Number), `category`, `date`; push ke array; panggil `StorageManager.saveTransactions()`
    - Implementasikan `remove(id)`: filter array berdasarkan id; panggil `StorageManager.saveTransactions()`
    - Implementasikan `getAll()`, `getTotalAmount()`, `getTotalByCategory(category)`, `getByMonthYear(month, year)`, `getSorted(key, direction)`
    - Implementasikan validasi kategori dalam `add()`: lempar atau tolak jika kategori bukan "Food", "Transport", "Fun"
    - _Requirements: 2.7, 3.3, 3.4, 8.3_
  
- [x] 4. Implementasi Validator
  - [x] 4.1 Implementasikan `Validator` dengan semua metode validasi field
    - Implementasikan `validateName(name)`: tolak empty/whitespace-only; tolak panjang > 100; kembalikan `FieldResult`
    - Implementasikan `validateAmount(amount)`: tolak non-numerik; tolak nilai < 1 atau > 999_999_999_999; kembalikan `FieldResult`
    - Implementasikan `validateCategory(category)`: tolak jika bukan "Food", "Transport", "Fun"; kembalikan `FieldResult`
    - Implementasikan `validateDate(date)`: tolak format non-YYYY-MM-DD; tolak tanggal masa depan; kembalikan `FieldResult`
    - Implementasikan `validate(formData)`: jalankan semua 4 validasi field, kembalikan `ValidationResult` agregat `{ valid, errors }`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_


- [x] 5. Checkpoint — Pastikan semua unit modul berfungsi
  - Pastikan semua unit test dan property test yang sudah ada lulus, tanyakan kepada user jika ada masalah.

- [x] 6. Implementasi struktur HTML
  - [x] 6.1 Buat struktur DOM lengkap di `index.html`
    - Tambahkan `<body data-theme="light">` sebagai root tema
    - Buat `<aside class="sidebar">` dengan: nama aplikasi (teks "Expense & Budget Visualizer", ukuran ≥ 16px), dua tautan navigasi (`data-section="dashboard"` dan `data-section="transactions"`), tombol toggle dark mode
    - Buat `<button class="hamburger">` di area header untuk mobile
    - Buat section `#section-dashboard` berisi: grid Summary Cards (total pengeluaran, total transaksi, Food, Transport, Fun) dan container canvas Chart.js (`<canvas id="chart-expense">`)
    - Buat section `#section-transactions` berisi: form input dengan `#input-name`, `#input-amount`, `#select-category`, `#input-date`, tombol Simpan; dan `<table>` atau `<div>` Transaction Table dengan header kolom Nama, Jumlah, Kategori, Tanggal, Aksi
    - _Requirements: 7.1, 7.4, 7.5, 7.7, 5.1, 5.2, 5.3, 2.1, 4.1, 6.5_

- [x] 7. Implementasi NavigationController
  - [x] 7.1 Implementasikan `NavigationController` untuk SPA routing
    - Implementasikan `init()`: pasang event listener pada semua tautan `[data-section]` di sidebar; set seksi default ke "dashboard"; pasang event listener klik luar sidebar untuk `closeSidebar()`
    - Implementasikan `navigateTo(section)`: tampilkan section yang sesuai (remove `hidden`), sembunyikan yang lain; perbarui active link
    - Implementasikan `updateActiveLink(section)`: tambah/hapus class `active` atau `aria-current` pada tautan navigasi
    - Implementasikan `toggleSidebar()`: toggle class `open` pada `<aside>` untuk overlay mobile
    - Implementasikan `closeSidebar()`: hapus class `open` jika klik target di luar area sidebar
    - Pasang event listener pada tombol hamburger untuk memanggil `toggleSidebar()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 8. Implementasi UIRenderer
  - [x] 8.1 Implementasikan `UIRenderer.formatCurrency(amount)` dan rendering Summary Cards
    - Implementasikan `formatCurrency(amount)`: kembalikan `"Rp " + Math.floor(amount).toLocaleString('id-ID', { maximumFractionDigits: 0 })`
    - Implementasikan `renderSummaryCards(transactions)`: hitung total pengeluaran, total transaksi, total per kategori; update teks konten elemen DOM masing-masing card
    - Tangani kasus kosong: tampilkan "Rp 0" untuk amount dan "0" untuk count
    - _Requirements: 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.3 Implementasikan `UIRenderer.renderTransactionTable(transactions, sortKey, sortDir)`
    - Render setiap transaksi sebagai baris tabel dengan kolom: Nama, Jumlah (via `formatCurrency`), Kategori (dengan badge warna kategori), Tanggal, tombol Hapus (`data-id` attribute)
    - Tampilkan indikator sort (▲/▼) pada header kolom Tanggal dan Jumlah sesuai `sortKey` dan `sortDir`
    - Tampilkan pesan "Belum ada transaksi" jika array kosong (`renderEmptyState()`)
    - Default sort: Tanggal descending
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 8.4 Implementasikan `UIRenderer.showFieldError`, `clearFieldErrors`, dan `clearForm`
    - Implementasikan `showFieldError(fieldId, message)`: tampilkan teks error di bawah field yang sesuai
    - Implementasikan `clearFieldErrors()`: hapus semua pesan error dari DOM
    - Implementasikan `clearForm()`: reset semua nilai input form ke kosong/default
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 9. Implementasi ChartRenderer
  - [x] 9.1 Implementasikan `ChartRenderer` dengan integrasi Chart.js
    - Deklarasikan `chartInstance: null` dan `COLORS: { Food, Transport, Fun }` sesuai CSS variables
    - Implementasikan `render(transactions)`: hitung total per kategori; jika semua nol panggil `showEmptyState()`; jika ada data, panggil `destroy()` lalu buat `new Chart()` bertipe `'pie'` dengan data kategori dan warna tetap; aktifkan legenda di bawah chart
    - Implementasikan `destroy()`: panggil `chartInstance.destroy()` jika tidak null, set ke null
    - Implementasikan `showEmptyState()`: tampilkan teks "Belum ada data untuk ditampilkan" di container chart, sembunyikan `<canvas>`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Implementasi form tambah transaksi dan hapus transaksi
  - [x] 10.1 Implementasikan submit form tambah transaksi
    - Pasang event listener `submit` pada form transaksi (atau klik tombol Simpan)
    - Kumpulkan nilai form ke objek `{ name, amount, category, date }`
    - Panggil `Validator.validate(formData)`: jika tidak valid, panggil `UIRenderer.showFieldError()` untuk setiap error dan hentikan
    - Jika valid, panggil `clearFieldErrors()`, `TransactionManager.add(formData)`, `UIRenderer.clearForm()`, lalu `renderAll()`
    - _Requirements: 2.2, 2.7, 2.8_
  - [x] 10.2 Implementasikan delete transaksi dengan dialog konfirmasi
    - Pasang event listener delegasi pada Transaction Table untuk klik tombol Hapus (`[data-id]`)
    - Tampilkan `confirm()` dialog dengan pesan konfirmasi sebelum menghapus
    - Jika dikonfirmasi: panggil `TransactionManager.remove(id)` lalu `renderAll()`
    - Jika dibatalkan: tutup dialog tanpa perubahan data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Hubungkan semua modul dalam `renderAll()`
  - [x] 11.1 Implementasikan fungsi `renderAll()` dan fungsi init utama
    - Implementasikan `renderAll()`: panggil `UIRenderer.renderSummaryCards(transactions)`, `UIRenderer.renderTransactionTable(transactions, sortState.key, sortState.direction)`, dan `ChartRenderer.render(transactions)`
    - Implementasikan fungsi init di `DOMContentLoaded`: panggil `StorageManager` load tema, `TransactionManager.load()`, `NavigationController.init()`, `ThemeController.init()`, dan `renderAll()`
    - Pastikan semua perubahan data (tambah, hapus) memanggil `renderAll()` sebagai langkah terakhir
    - _Requirements: 2.8, 3.5, 5.4_

- [ ] 12. Checkpoint — Pastikan semua fungsi inti berjalan
  - Pastikan semua unit test dan property test lulus. Verifikasi alur: tambah transaksi → tampil di tabel dan chart diperbarui. Hapus transaksi → hilang dari tabel dan summary cards diperbarui. Tanyakan kepada user jika ada masalah.

- [x] 13. Implementasi CSS lengkap
  - [x] 13.1 Implementasikan layout utama dan komponen Sidebar di `css/style.css`
    - Buat layout dua-kolom (sidebar + main content) menggunakan CSS Grid atau Flexbox
    - Style Sidebar: lebar tetap (misalnya 240px), background `var(--color-surface)`, border-right, padding, font ≥ 16px untuk nama app
    - Style tautan navigasi aktif: gunakan `background`, `border-left`, atau indikator non-warna saja agar dapat diidentifikasi tanpa bergantung warna
    - _Requirements: 7.1, 7.3, 7.7, 9.1, 9.3, 9.4_
  - [x] 13.2 Implementasikan style Summary Cards dan Dashboard
    - Style card: `box-shadow`, `border-radius`, padding, label kategori terbaca, ikon atau warna badge per kategori
    - Style grid cards: 2–3 kolom pada desktop
    - _Requirements: 9.5, 5.1, 5.2, 5.3_
  - [x] 13.3 Implementasikan style Transaction Table dan form input
    - Style tabel: header, baris alternating color atau border, tombol hapus terlihat jelas
    - Style form: label, input, select, tombol dengan ukuran minimum 14px; pesan error berwarna merah di bawah field
    - _Requirements: 4.1, 9.4_
  - [x] 13.4 Implementasikan media queries untuk mobile responsif (≤ 768px)
    - Sembunyikan Sidebar pada `max-width: 768px`; tampilkan tombol hamburger
    - Sidebar mobile tampil sebagai overlay dengan lebar minimum 200px dan class `open`
    - Stack cards dan tabel agar scrollable secara horizontal pada layar kecil
    - _Requirements: 7.4, 7.5, 7.6, 9.2_

- [x] 14. Implementasi hamburger menu mobile
  - [x] 14.1 Pastikan `NavigationController.toggleSidebar()` dan `closeSidebar()` berfungsi pada mobile
    - Verifikasi tombol hamburger visible hanya pada ≤ 768px via CSS
    - Verifikasi class `open` pada `<aside>` menampilkan sidebar sebagai overlay dengan `position: fixed` atau `absolute`, z-index cukup tinggi
    - Verifikasi klik di luar sidebar memanggil `closeSidebar()`
    - _Requirements: 7.4, 7.5, 7.6_

- [x] 15. Implementasi fitur opsional — ThemeController (Dark/Light Mode)
  - [x] 15.1 Implementasikan `ThemeController` untuk toggle dark/light mode
    - Implementasikan `init()`: baca tema dari `StorageManager.loadTheme()`, panggil `apply(theme)`
    - Implementasikan `apply(theme)`: set `document.body.setAttribute('data-theme', theme)` agar CSS variables dark override aktif
    - Implementasikan `toggle()`: balik tema saat ini, panggil `apply()` dan `StorageManager.saveTheme()`
    - Pasang event listener pada tombol toggle dark mode di sidebar untuk memanggil `ThemeController.toggle()`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 16. Implementasi fitur opsional — MonthlySummary
  - [x] 16.1 Implementasikan `MonthlySummary` untuk filter dan tampilkan ringkasan per bulan
    - Tambahkan kontrol `<input type="month">` atau dua `<select>` bulan/tahun di section Dashboard
    - Implementasikan `init()`: set `selectedMonth` dan `selectedYear` ke bulan/tahun saat ini; pasang event listener perubahan kontrol
    - Implementasikan `render(transactions)`: panggil `TransactionManager.getByMonthYear(month, year)`, hitung total per kategori, tampilkan di UI
    - Pastikan `renderAll()` memanggil `MonthlySummary.render(transactions)` jika modul aktif
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 17. Implementasi fitur opsional — Transaction Sorting
  - [x] 17.1 Implementasikan sorting kolom Tanggal dan Jumlah pada Transaction Table
    - Deklarasikan `sortState = { key: 'date', direction: 'desc' }` sebagai state modul
    - Pasang event listener pada header kolom Tanggal dan Jumlah: toggle direction jika kolom sama, reset ke 'desc' jika kolom berbeda
    - Perbarui `sortState` lalu panggil `renderAll()` agar tabel dan indikator sort diperbarui
    - Pastikan `UIRenderer.renderTransactionTable()` menggunakan `TransactionManager.getSorted(key, direction)` alih-alih `getAll()`
    - _Requirements: 4.2, 4.3_

- [ ] 18. Checkpoint — Pastikan semua fitur terintegrasi
  - Pastikan semua property test dan unit test lulus. Verifikasi alur end-to-end: load halaman, tambah transaksi, hapus transaksi, sort tabel, toggle dark mode, filter bulanan. Tanyakan kepada user jika ada masalah.

- [ ] 19. Setup testing dan property-based tests
  - [ ] 19.1 Setup test environment dengan Vitest dan fast-check
    - Inisialisasi `package.json` (jika belum ada) dengan `npm init`
    - Install `vitest` dan `fast-check` sebagai devDependencies
    - Buat `vitest.config.js` dengan environment `jsdom` untuk simulasi DOM dan localStorage
    - Buat struktur direktori:
      ```
      tests/
      ├── unit/
      │   ├── StorageManager.test.js
      │   ├── TransactionManager.test.js
      │   ├── Validator.test.js
      │   └── UIRenderer.test.js
      └── property/
          ├── storage.property.test.js
          ├── validator.property.test.js
          ├── transaction.property.test.js
          ├── currency.property.test.js
          └── monthly.property.test.js
      ```
    - Pastikan `js/app.js` mengekspor modul-modul yang dibutuhkan untuk testing
    - _Requirements: (testing infrastructure)_


- [ ] 20. Final polish dan review
  - [ ] 20.1 Verifikasi semua requirements tercakup di implementasi
    - Periksa Requirements 1–12 satu per satu, pastikan semua acceptance criteria terpenuhi
    - Pastikan tidak ada framework JS atau CSS framework yang digunakan (Requirement 10.6)
    - Pastikan Chart.js dimuat via CDN sebelum `app.js` (Requirement 10.5)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  - [ ] 20.2 Lakukan perbaikan aksesibilitas dan kualitas kode
    - Tambahkan `aria-label` pada tombol hapus dan tombol hamburger
    - Tambahkan `aria-current="page"` pada tautan navigasi aktif
    - Pastikan semua input form memiliki `<label>` yang terhubung via `for`/`id`
    - Periksa kontras warna minimal WCAG 2.1 AA pada teks dan background
    - _Requirements: 7.3, 9.4_

## Notes

- Task bertanda `*` adalah opsional dan dapat dilewati untuk implementasi MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Checkpoint memastikan validasi inkremental setelah tahap utama selesai
- Property tests memvalidasi properti universal kebenaran sistem (Property 1–11 dari design.md)
- Unit tests memvalidasi contoh spesifik dan edge cases
- Gunakan `vitest --run` (bukan `vitest --watch`) untuk menjalankan tests sekali jalan

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "6.1"] },
    { "id": 5, "tasks": ["7.1", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 7, "tasks": ["10.1", "10.2"] },
    { "id": 8, "tasks": ["11.1"] },
    { "id": 9, "tasks": ["13.1"] },
    { "id": 10, "tasks": ["13.2", "13.3"] },
    { "id": 11, "tasks": ["13.4", "14.1"] },
    { "id": 12, "tasks": ["15.1", "16.1", "17.1"] },
    { "id": 13, "tasks": ["19.1"] },
    { "id": 14, "tasks": ["19.2", "19.3", "19.4"] },
    { "id": 15, "tasks": ["20.1", "20.2"] }
  ]
}
```
