# Requirements Document

## Introduction

Expense & Budget Visualizer adalah aplikasi web finansial personal berbasis browser yang memungkinkan pengguna mencatat, mengelola, dan memvisualisasikan pengeluaran harian berdasarkan kategori. Aplikasi dibangun sepenuhnya dengan HTML5, CSS3, dan Vanilla JavaScript tanpa framework frontend maupun backend. Semua data disimpan di Browser Local Storage agar tetap tersedia setelah halaman di-refresh. Visualisasi data menggunakan Chart.js untuk menampilkan distribusi pengeluaran per kategori dalam bentuk pie chart. Antarmuka dirancang sebagai modern financial dashboard dengan sidebar navigasi, summary cards, dan layout responsif untuk desktop dan mobile.

## Glossary

- **App**: Aplikasi web Expense & Budget Visualizer secara keseluruhan.
- **Transaction**: Satu catatan pengeluaran yang terdiri dari nama, jumlah (amount), kategori, dan tanggal.
- **Transaction_Manager**: Modul JavaScript yang bertanggung jawab atas penambahan, penghapusan, dan pembacaan transaksi.
- **Storage**: Browser Local Storage API yang digunakan sebagai lapisan penyimpanan data.
- **Validator**: Komponen JavaScript yang memvalidasi input transaksi sebelum disimpan.
- **Dashboard**: Halaman utama aplikasi yang menampilkan ringkasan keuangan dan visualisasi data.
- **Chart_Renderer**: Komponen JavaScript yang mengintegrasikan Chart.js untuk merender pie chart.
- **Category**: Klasifikasi pengeluaran yang terdiri dari tiga nilai tetap: Food, Transport, dan Fun.
- **Summary_Card**: Elemen UI kartu yang menampilkan satu metrik ringkasan (total pengeluaran, jumlah transaksi, atau pengeluaran per kategori).
- **Sidebar**: Komponen navigasi vertikal yang menampilkan menu navigasi aplikasi.
- **Transaction_Table**: Komponen UI yang menampilkan daftar transaksi dalam format tabel atau list.
- **Monthly_Summary**: Ringkasan agregat pengeluaran yang difilter berdasarkan bulan dan tahun tertentu.
- **Theme**: Skema warna tampilan aplikasi, bernilai "light" atau "dark".

---

## Requirements

### Requirement 1: Penyimpanan Data Persisten

**User Story:** Sebagai pengguna, saya ingin data transaksi saya tersimpan secara otomatis di browser, sehingga data tidak hilang setelah halaman di-refresh atau browser ditutup dan dibuka kembali.

#### Acceptance Criteria

1. THE Storage SHALL menyimpan seluruh data transaksi dalam format JSON di bawah satu kunci Local Storage yang tetap (key: `"evb_transactions"`).
2. WHEN halaman aplikasi dimuat, THE Transaction_Manager SHALL membaca data transaksi dari Storage dan memuat seluruh transaksi ke dalam memori aplikasi.
3. WHEN sebuah transaksi berhasil ditambahkan atau dihapus, THE Transaction_Manager SHALL menulis ulang keseluruhan daftar transaksi ke Storage dalam siklus eksekusi yang sama dengan operasi tersebut.
4. IF Storage tidak mengandung data pada kunci `"evb_transactions"` atau data yang tersimpan tidak dapat di-parse sebagai JSON yang valid, THEN THE Transaction_Manager SHALL menginisialisasi daftar transaksi sebagai array kosong.
5. WHEN pengguna mengubah pilihan Theme, THE App SHALL menyimpan nilai Theme yang dipilih ke Storage dengan kunci `"evb_theme"`.
6. WHEN halaman aplikasi dimuat, THE App SHALL membaca nilai Theme dari Storage pada kunci `"evb_theme"` dan menerapkannya ke tampilan; IF kunci `"evb_theme"` tidak ditemukan di Storage, THEN THE App SHALL menerapkan Theme default `"light"`.

---

### Requirement 2: Manajemen Transaksi — Penambahan

**User Story:** Sebagai pengguna, saya ingin menambahkan catatan pengeluaran baru dengan mengisi form, sehingga saya dapat melacak setiap pengeluaran yang terjadi.

#### Acceptance Criteria

1. THE App SHALL menyediakan form input transaksi dengan empat field wajib: nama transaksi (teks, maksimum 100 karakter), jumlah pengeluaran (angka positif antara 1 hingga 999,999,999,999, dalam Rupiah), kategori (pilihan dari: Food, Transport, Fun), dan tanggal transaksi (format YYYY-MM-DD, tidak boleh melebihi tanggal hari ini).
2. WHEN pengguna mengklik tombol simpan pada form, THE Validator SHALL memeriksa bahwa seluruh empat field telah diisi sebelum menyimpan transaksi.
3. IF field nama kosong atau hanya berisi spasi, THEN THE Validator SHALL menampilkan pesan kesalahan "Nama transaksi tidak boleh kosong" di bawah field tersebut.
4. IF field jumlah kosong, bukan angka, atau bernilai di luar rentang 1 hingga 999,999,999,999, THEN THE Validator SHALL menampilkan pesan kesalahan "Jumlah harus berupa angka positif" di bawah field tersebut.
5. IF field tanggal kosong, format tanggal tidak sesuai YYYY-MM-DD, atau tanggal melebihi tanggal hari ini, THEN THE Validator SHALL menampilkan pesan kesalahan "Tanggal tidak valid" di bawah field tersebut.
6. IF field kategori tidak dipilih, THEN THE Validator SHALL menampilkan pesan kesalahan yang mengindikasikan bahwa kategori harus dipilih di bawah field tersebut.
7. WHEN semua field lulus validasi, THE Transaction_Manager SHALL membuat objek transaksi baru dengan properti: `id` (string unik berbasis timestamp), `name`, `amount` (number), `category`, dan `date` (string YYYY-MM-DD), lalu menyimpannya ke Storage.
8. WHEN transaksi baru berhasil disimpan, THE App SHALL mengosongkan form input dan memperbarui tampilan Dashboard serta Transaction_Table tanpa reload halaman.

---

### Requirement 3: Manajemen Transaksi — Penghapusan

**User Story:** Sebagai pengguna, saya ingin menghapus transaksi yang salah dicatat, sehingga data pengeluaran saya tetap akurat.

#### Acceptance Criteria

1. THE Transaction_Table SHALL menampilkan tombol hapus pada setiap baris transaksi yang terlihat di layar.
2. WHEN pengguna mengklik tombol hapus pada sebuah baris transaksi, THE App SHALL menampilkan dialog konfirmasi yang meminta pengguna memastikan penghapusan sebelum data diubah.
3. WHEN pengguna mengkonfirmasi penghapusan, THE Transaction_Manager SHALL menghapus transaksi dengan `id` yang sesuai dari daftar transaksi di memori.
4. WHEN sebuah transaksi dihapus dari memori, THE Transaction_Manager SHALL segera memperbarui data di Storage untuk mencerminkan penghapusan tersebut.
5. WHEN transaksi berhasil dihapus, THE App SHALL memperbarui tampilan Transaction_Table dan Dashboard dalam waktu kurang dari 1 detik tanpa reload halaman.
6. IF pengguna membatalkan dialog konfirmasi penghapusan, THEN THE App SHALL menutup dialog dan tidak melakukan perubahan pada data transaksi.

---

### Requirement 4: Tampilan Riwayat Transaksi

**User Story:** Sebagai pengguna, saya ingin melihat seluruh riwayat transaksi dalam satu tampilan, sehingga saya dapat memantau pengeluaran saya secara menyeluruh.

#### Acceptance Criteria

1. THE Transaction_Table SHALL menampilkan seluruh transaksi yang tersimpan dalam format tabel dengan kolom: Nama, Jumlah (diformat sebagai mata uang Rupiah), Kategori, Tanggal, dan Aksi (tombol hapus).
2. THE Transaction_Table SHALL menampilkan transaksi diurutkan berdasarkan nilai kolom Tanggal dari yang terbaru ke yang terlama secara default saat halaman dimuat.
3. WHERE fitur Transaction Sorting diaktifkan, WHEN pengguna memilih kolom Tanggal atau Jumlah sebagai kriteria pengurutan, THE Transaction_Table SHALL memperbarui urutan tampilan sesuai arah ascending atau descending yang dipilih dan menampilkan indikator visual pada header kolom yang aktif untuk menunjukkan kolom dan arah pengurutan yang sedang berlaku.
4. IF tidak ada transaksi yang tersimpan, THEN THE Transaction_Table SHALL menampilkan pesan "Belum ada transaksi" di area tabel.
5. THE App SHALL memformat nilai jumlah transaksi menggunakan format mata uang Indonesia dengan titik (.) sebagai pemisah ribuan dan koma (,) sebagai pemisah desimal, diawali dengan simbol "Rp" diikuti spasi (contoh: Rp 150.000 untuk nilai bulat, Rp 1.500,50 untuk nilai dengan sen).

---

### Requirement 5: Dashboard — Summary Cards

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan keuangan saya di halaman utama, sehingga saya dapat memahami kondisi pengeluaran secara sekilas.

#### Acceptance Criteria

1. THE Dashboard SHALL menampilkan Summary_Card untuk "Total Pengeluaran" yang berisi jumlah kumulatif seluruh nilai transaksi yang tersimpan, diformat sebagai mata uang Rupiah dengan prefiks "Rp", pemisah ribuan menggunakan titik, tanpa digit desimal (contoh: Rp 1.250.000).
2. THE Dashboard SHALL menampilkan Summary_Card untuk "Total Transaksi" yang berisi jumlah cacah seluruh transaksi yang tersimpan.
3. THE Dashboard SHALL menampilkan tiga Summary_Card kategori yang masing-masing menampilkan total pengeluaran untuk kategori Food, Transport, dan Fun secara terpisah, diformat menggunakan aturan format Rupiah yang sama seperti pada kriteria 1.
4. WHEN data transaksi berubah (penambahan atau penghapusan), THE Dashboard SHALL memperbarui semua nilai pada Summary_Card dalam waktu tidak lebih dari 300 milidetik tanpa reload halaman.
5. IF tidak ada transaksi yang tersimpan, THEN THE Dashboard SHALL menampilkan nilai "Rp 0" pada Summary_Card Total Pengeluaran, nilai "0" pada Summary_Card Total Transaksi, dan nilai "Rp 0" pada setiap Summary_Card kategori.

---

### Requirement 6: Dashboard — Visualisasi Pie Chart

**User Story:** Sebagai pengguna, saya ingin melihat distribusi pengeluaran per kategori dalam bentuk grafik, sehingga saya dapat memahami pola pengeluaran saya secara visual.

#### Acceptance Criteria

1. WHEN Dashboard dimuat, THE Dashboard SHALL merender satu pie chart menggunakan Chart.js, di mana setiap segmen mewakili total pengeluaran untuk tepat satu kategori dari tiga kategori yang tersedia: Food, Transport, dan Fun.
2. THE Chart_Renderer SHALL menetapkan satu warna tetap dan unik untuk setiap kategori — satu warna khusus untuk Food, satu warna khusus untuk Transport, dan satu warna khusus untuk Fun — sehingga warna yang sama selalu muncul untuk kategori yang sama pada setiap render.
3. WHEN pengguna menambahkan atau menghapus sebuah transaksi, THE Chart_Renderer SHALL menghancurkan instance Chart.js yang sedang aktif dan merender ulang pie chart baru yang mencerminkan data transaksi terkini.
4. IF semua nilai total pengeluaran untuk setiap kategori adalah nol, THEN THE Chart_Renderer SHALL menampilkan pesan teks "Belum ada data untuk ditampilkan" sebagai pengganti grafik dan tidak merender instance Chart.js.
5. WHEN Dashboard dimuat, THE Dashboard SHALL menampilkan legenda Chart.js di bawah pie chart yang memuat nama setiap kategori beserta warna segmen yang sesuai untuk kategori tersebut.

---

### Requirement 7: Navigasi dan Struktur Halaman

**User Story:** Sebagai pengguna, saya ingin berpindah antar bagian aplikasi dengan mudah, sehingga saya dapat mengakses fitur yang saya butuhkan tanpa kebingungan.

#### Acceptance Criteria

1. THE App SHALL menampilkan Sidebar navigasi vertikal yang berisi tautan ke tepat dua bagian: "Dashboard" dan "Transaksi".
2. WHEN pengguna mengklik tautan navigasi di Sidebar, THE App SHALL menampilkan bagian yang sesuai dalam waktu kurang dari 300 milidetik dan menyembunyikan bagian lain tanpa melakukan navigasi ke URL yang berbeda (single-page behavior).
3. THE Sidebar SHALL menandai tautan navigasi yang sedang aktif dengan gaya visual yang berbeda dari tautan yang tidak aktif, di mana perbedaan gaya tersebut dapat diidentifikasi secara visual tanpa bergantung pada warna saja (misalnya perubahan warna latar, border, atau indikator aktif).
4. WHEN lebar viewport kurang dari 768 piksel, THE App SHALL menyembunyikan Sidebar dan menampilkan tombol hamburger menu untuk membuka dan menutup Sidebar.
5. WHEN pengguna mengklik tombol hamburger menu pada viewport kurang dari 768 piksel, THE App SHALL menampilkan Sidebar sebagai overlay di atas konten utama dengan lebar minimum 200 piksel.
6. IF Sidebar ditampilkan sebagai overlay dan pengguna mengklik di luar area Sidebar, THEN THE App SHALL menutup Sidebar overlay tersebut.
7. THE App SHALL menampilkan nama aplikasi "Expense & Budget Visualizer" di area header atau bagian atas Sidebar dengan ukuran teks minimal 16px.

---

### Requirement 8: Kategori Pengeluaran

**User Story:** Sebagai pengguna, saya ingin mengklasifikasikan setiap pengeluaran ke dalam kategori yang relevan, sehingga saya dapat menganalisis pola pengeluaran berdasarkan jenis pengeluaran.

#### Acceptance Criteria

1. THE App SHALL mendefinisikan tiga kategori tetap yang tersedia untuk seluruh transaksi: "Food", "Transport", dan "Fun".
2. THE App SHALL menampilkan ketiga kategori tersebut sebagai pilihan dalam elemen `<select>` pada form input transaksi.
3. THE Transaction_Manager SHALL menolak penyimpanan transaksi yang nilai kategorinya bukan salah satu dari "Food", "Transport", atau "Fun".
4. THE Dashboard SHALL menampilkan ringkasan pengeluaran secara terpisah untuk masing-masing dari ketiga kategori tersebut.

---

### Requirement 9: Desain Antarmuka Responsif

**User Story:** Sebagai pengguna, saya ingin tampilan aplikasi tetap nyaman digunakan baik di layar desktop maupun di perangkat mobile, sehingga saya dapat mencatat pengeluaran dari perangkat apapun.

#### Acceptance Criteria

1. THE App SHALL menggunakan satu file CSS tunggal (berlokasi di `css/style.css`) untuk seluruh aturan tampilan aplikasi.
2. THE App SHALL menerapkan CSS media queries sehingga layout tampilan berubah secara adaptif untuk viewport dengan lebar di atas 768 piksel (desktop) dan di bawah atau sama dengan 768 piksel (mobile).
3. THE App SHALL menerapkan palet warna yang konsisten di seluruh komponen UI, dengan warna primer, warna aksen, dan warna latar belakang yang didefinisikan sebagai CSS custom properties (variabel CSS).
4. THE App SHALL menggunakan tipografi profesional dengan font yang terbaca dengan baik, ukuran font minimum 14px untuk teks isi, dan hierarki visual yang jelas antara judul dan konten.
5. THE Summary_Card SHALL menampilkan tampilan kartu dengan bayangan (box-shadow), sudut melengkung (border-radius), dan ikon atau label kategori yang terbaca dengan jelas.

---

### Requirement 10: Arsitektur File dan Struktur Folder

**User Story:** Sebagai pengembang, saya ingin proyek memiliki struktur folder yang bersih dan terorganisir, sehingga pemeliharaan dan pengembangan kode menjadi lebih mudah.

#### Acceptance Criteria

1. THE App SHALL memiliki struktur direktori sebagai berikut:
   ```
   project-root/
   ├── index.html
   ├── css/
   │   └── style.css
   └── js/
       └── app.js
   ```
2. THE App SHALL menggunakan tepat satu file HTML (`index.html`) sebagai entry point aplikasi.
3. THE App SHALL menggunakan tepat satu file CSS (`css/style.css`) untuk seluruh styling aplikasi.
4. THE App SHALL menggunakan tepat satu file JavaScript (`js/app.js`) untuk seluruh logika aplikasi, termasuk manajemen transaksi, rendering UI, dan integrasi Chart.js.
5. THE App SHALL memuat library Chart.js melalui CDN `<script>` tag di dalam `index.html` sebelum tag `<script>` untuk `js/app.js`.
6. THE App SHALL tidak menggunakan framework JavaScript (React, Vue, Angular) maupun CSS framework (Bootstrap, Tailwind) dalam implementasinya.

---

### Requirement 11: Fitur Opsional — Monthly Summary

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan pengeluaran berdasarkan bulan tertentu, sehingga saya dapat membandingkan pengeluaran antar bulan.

#### Acceptance Criteria

1. WHERE fitur Monthly Summary tersedia, THE App SHALL menyediakan kontrol pemilihan bulan dan tahun (misalnya elemen `<select>` atau `<input type="month">`) untuk memfilter tampilan ringkasan.
2. WHERE fitur Monthly Summary tersedia, WHEN pengguna memilih bulan dan tahun tertentu, THE App SHALL menghitung dan menampilkan total pengeluaran hanya untuk transaksi yang tanggalnya berada dalam bulan dan tahun yang dipilih.
3. WHERE fitur Monthly Summary tersedia, THE App SHALL menampilkan ringkasan bulanan per kategori (Food, Transport, Fun) untuk periode yang dipilih.

---

### Requirement 12: Fitur Opsional — Dark/Light Mode

**User Story:** Sebagai pengguna, saya ingin memilih tampilan gelap atau terang sesuai preferensi saya, sehingga pengalaman penggunaan aplikasi lebih nyaman di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. WHERE fitur Dark/Light Mode tersedia, THE App SHALL menampilkan tombol toggle yang memungkinkan pengguna berpindah antara Theme "light" dan Theme "dark".
2. WHERE fitur Dark/Light Mode tersedia, WHEN pengguna mengaktifkan Theme "dark", THE App SHALL menerapkan palet warna gelap pada seluruh komponen UI melalui perubahan atribut atau class pada elemen `<body>`.
3. WHERE fitur Dark/Light Mode tersedia, THE App SHALL menyimpan nilai Theme yang dipilih pengguna ke Storage sehingga preferensi dipertahankan setelah refresh.
4. WHERE fitur Dark/Light Mode tersedia, WHEN halaman dimuat, THE App SHALL membaca nilai Theme dari Storage dan menerapkan Theme yang tersimpan sebelum halaman ditampilkan kepada pengguna.
