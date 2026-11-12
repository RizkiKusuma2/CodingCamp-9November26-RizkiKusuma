/**
 * Expense & Budget Visualizer — js/app.js
 * Seluruh logika aplikasi dienkapsulasi dalam satu file ini
 * menggunakan Module Pattern / IIFE. Tidak ada framework JS atau CSS.
 *
 * Requirements: 10.4 (single app.js), 10.6 (no frameworks)
 */

'use strict';

/* =============================================================
   KONSTANTA GLOBAL
   ============================================================= */

const CATEGORIES = ['Food', 'Transport', 'Fun'];

const STORAGE_KEYS = {
  TRANSACTIONS: 'evb_transactions',
  THEME: 'evb_theme'
};

const ERROR_MESSAGES = {
  name_empty:     'Nama transaksi tidak boleh kosong',
  name_too_long:  'Nama transaksi maksimal 100 karakter',
  amount_invalid: 'Jumlah harus berupa angka positif',
  amount_range:   'Jumlah harus berupa angka positif',
  category_empty: 'Kategori harus dipilih',
  date_invalid:   'Tanggal tidak valid',
  date_future:    'Tanggal tidak valid',
  storage_full:   'Penyimpanan penuh. Hapus beberapa transaksi terlebih dahulu.'
};

/* =============================================================
   STATE GLOBAL
   ============================================================= */

/** @type {{ key: 'date' | 'amount', direction: 'asc' | 'desc' }} */
let sortState = {
  key: 'date',
  direction: 'desc'
};

/* =============================================================
   StorageManager
   Bertanggung jawab atas semua operasi baca/tulis localStorage.
   ============================================================= */

/**
 * Memeriksa apakah sebuah objek merupakan transaksi yang valid.
 * Field wajib: id, name, amount, category, date.
 * Nilai category harus salah satu dari CATEGORIES.
 * @param {*} t
 * @returns {boolean}
 */
function isValidTransaction(t) {
  if (!t || typeof t !== 'object') return false;
  if (!t.id || !t.name || t.amount === undefined || !t.category || !t.date) {
    return false;
  }
  if (!CATEGORIES.includes(t.category)) return false;
  return true;
}

const StorageManager = {
  /**
   * Memuat daftar transaksi dari localStorage.
   * Mengembalikan [] jika tidak ada data, bukan array, atau parse error.
   * Transaksi tidak valid dibuang menggunakan isValidTransaction().
   * @returns {Transaction[]}
   */
  loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidTransaction);
    } catch (e) {
      return [];
    }
  },

  /**
   * Menyimpan daftar transaksi ke localStorage.
   * Menangkap QuotaExceededError jika storage penuh.
   * @param {Transaction[]} transactions
   */
  saveTransactions(transactions) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.error(ERROR_MESSAGES.storage_full);
        // Lempar ulang agar pemanggil dapat menampilkan pesan ke pengguna
        throw e;
      }
      throw e;
    }
  },

  /**
   * Memuat nilai tema dari localStorage.
   * Mengembalikan 'light' jika tidak ada nilai tersimpan.
   * @returns {'light' | 'dark'}
   */
  loadTheme() {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'dark' ? 'dark' : 'light';
  },

  /**
   * Menyimpan nilai tema ke localStorage.
   * @param {'light' | 'dark'} theme
   */
  saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
};

/* =============================================================
   TransactionManager
   Mengelola state daftar transaksi di memori dan mendelegasikan
   persistensi ke StorageManager.
   ============================================================= */

const TransactionManager = {
  /** @type {Transaction[]} State in-memory */
  transactions: [],

  /**
   * Membaca transaksi dari StorageManager ke memori.
   */
  load() {
    this.transactions = StorageManager.loadTransactions();
  },

  /**
   * Menambahkan transaksi baru.
   * Memvalidasi bahwa kategori adalah salah satu dari CATEGORIES (Req 8.3).
   * @param {{ name: string, amount: string|number, category: string, date: string }} data
   * @returns {Transaction}
   * @throws {Error} Jika kategori tidak valid
   */
  add(data) {
    if (!CATEGORIES.includes(data.category)) {
      throw new Error('Kategori tidak valid: ' + data.category);
    }

    /** @type {Transaction} */
    const transaction = {
      id:       Date.now().toString(),
      name:     data.name,
      amount:   Number(data.amount),
      category: data.category,
      date:     data.date
    };

    this.transactions.push(transaction);
    try {
      StorageManager.saveTransactions(this.transactions);
    } catch (error) {
      this.transactions.pop();
      throw error;
    }
    return transaction;
  },

  /**
   * Menghapus transaksi berdasarkan id.
   * Langsung memperbarui Storage setelah penghapusan dari memori (Req 3.3, 3.4).
   * @param {string} id
   */
  remove(id) {
    const previous = this.transactions;
    this.transactions = this.transactions.filter(t => t.id !== id);
    try {
      StorageManager.saveTransactions(this.transactions);
    } catch (error) {
      this.transactions = previous;
      throw error;
    }
  },

  /**
   * Mengembalikan seluruh transaksi (salinan array).
   * @returns {Transaction[]}
   */
  getAll() {
    return this.transactions.slice();
  },

  /**
   * Mengembalikan transaksi diurutkan berdasarkan key dan arah.
   * Pengurutan bersifat stabil: jika nilai sama, urutan asli dipertahankan.
   * @param {'date' | 'amount'} key
   * @param {'asc' | 'desc'} direction
   * @returns {Transaction[]}
   */
  getSorted(key, direction) {
    const sorted = this.transactions.slice();
    sorted.sort((a, b) => {
      let valA, valB;
      if (key === 'date') {
        // String YYYY-MM-DD diurutkan secara leksikografis (aman untuk ISO date)
        valA = a.date;
        valB = b.date;
      } else {
        valA = a.amount;
        valB = b.amount;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  },

  /**
   * Menghitung total seluruh pengeluaran (Req 5.1).
   * @returns {number}
   */
  getTotalAmount() {
    return this.transactions.reduce((sum, t) => sum + t.amount, 0);
  },

  /**
   * Menghitung total pengeluaran untuk satu kategori (Req 5.3, 8.4).
   * @param {string} category
   * @returns {number}
   */
  getTotalByCategory(category) {
    return this.transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  /**
   * Mengembalikan transaksi yang tanggalnya berada dalam bulan/tahun tertentu (Req 11.2).
   * @param {number} month  1–12
   * @param {number} year   contoh: 2024
   * @returns {Transaction[]}
   */
  getByMonthYear(month, year) {
    // Pad bulan menjadi dua digit, misal: 1 → "01"
    const mm = String(month).padStart(2, '0');
    const prefix = `${year}-${mm}-`;
    return this.transactions.filter(t => t.date.startsWith(prefix));
  }
};

/* =============================================================
   Validator
   Memvalidasi data input form sebelum transaksi dibuat.
   ============================================================= */

const Validator = {
  /**
   * Memvalidasi field nama transaksi.
   * Tolak jika kosong/hanya-spasi atau panjang > 100 karakter.
   * @param {string} name
   * @returns {{ valid: boolean, error?: string }}
   */
  validateName(name) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { valid: false, error: ERROR_MESSAGES.name_empty };
    }
    if (name.trim().length > 100) {
      return { valid: false, error: ERROR_MESSAGES.name_too_long };
    }
    return { valid: true };
  },

  /**
   * Memvalidasi field jumlah transaksi.
   * Tolak jika bukan numerik, atau nilainya < 1 atau > 999_999_999_999.
   * @param {string|number} amount
   * @returns {{ valid: boolean, error?: string }}
   */
  validateAmount(amount) {
    // Tolak string kosong, null, undefined, atau tipe yang tidak bisa dikonversi
    if (amount === '' || amount === null || amount === undefined) {
      return { valid: false, error: ERROR_MESSAGES.amount_invalid };
    }
    const num = Number(amount);
    if (isNaN(num) || !isFinite(num)) {
      return { valid: false, error: ERROR_MESSAGES.amount_invalid };
    }
    if (num < 1 || num > 999_999_999_999) {
      return { valid: false, error: ERROR_MESSAGES.amount_range };
    }
    return { valid: true };
  },

  /**
   * Memvalidasi field kategori transaksi.
   * Tolak jika bukan "Food", "Transport", atau "Fun".
   * @param {string} category
   * @returns {{ valid: boolean, error?: string }}
   */
  validateCategory(category) {
    if (!CATEGORIES.includes(category)) {
      return { valid: false, error: ERROR_MESSAGES.category_empty };
    }
    return { valid: true };
  },

  /**
   * Memvalidasi field tanggal transaksi.
   * Tolak jika format bukan YYYY-MM-DD atau tanggalnya di masa depan (setelah hari ini).
   * @param {string} date
   * @returns {{ valid: boolean, error?: string }}
   */
  validateDate(date) {
    // Periksa format YYYY-MM-DD menggunakan regex
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { valid: false, error: ERROR_MESSAGES.date_invalid };
    }

    // Periksa kevalidan tanggal (misalnya bukan 2024-02-30)
    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return { valid: false, error: ERROR_MESSAGES.date_invalid };
    }

    // Tolak tanggal masa depan: bandingkan string ISO dengan hari ini
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date > todayStr) {
      return { valid: false, error: ERROR_MESSAGES.date_future };
    }

    return { valid: true };
  },

  /**
   * Memvalidasi seluruh data form sekaligus.
   * Menjalankan keempat validasi field dan mengagregasi hasilnya.
   * @param {{ name: string, amount: string, category: string, date: string }} formData
   * @returns {{ valid: boolean, errors: Object.<string, string> }}
   */
  validate(formData) {
    const errors = {};

    const nameResult     = this.validateName(formData.name);
    const amountResult   = this.validateAmount(formData.amount);
    const categoryResult = this.validateCategory(formData.category);
    const dateResult     = this.validateDate(formData.date);

    if (!nameResult.valid)     errors.name     = nameResult.error;
    if (!amountResult.valid)   errors.amount   = amountResult.error;
    if (!categoryResult.valid) errors.category = categoryResult.error;
    if (!dateResult.valid)     errors.date     = dateResult.error;

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
};

/* =============================================================
   UIRenderer
   Bertanggung jawab atas semua manipulasi DOM untuk Summary Cards,
   Transaction Table, dan form.
   ============================================================= */

const UIRenderer = {
  /**
   * Memformat angka sebagai mata uang Rupiah.
   * Contoh: 1250000 → "Rp 1.250.000"
   * @param {number} amount
   * @returns {string}
   */
  formatCurrency(amount) {
    return 'Rp ' + Math.floor(amount).toLocaleString('id-ID', { maximumFractionDigits: 0 });
  },

  /**
   * Merender Summary Cards di Dashboard.
   * Menghitung total pengeluaran, total transaksi, dan total per kategori,
   * lalu memperbarui teks konten elemen DOM masing-masing card.
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   * @param {Transaction[]} transactions
   */
  renderSummaryCards(transactions) {
    // Total pengeluaran — Requirement 5.1
    const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
    const elTotalExpense = document.getElementById('value-total-expense');
    if (elTotalExpense) {
      elTotalExpense.textContent = this.formatCurrency(totalExpense);
    }

    // Total transaksi — Requirement 5.2
    const elTotalTransactions = document.getElementById('value-total-transactions');
    if (elTotalTransactions) {
      elTotalTransactions.textContent = transactions.length;
    }

    // Total per kategori — Requirement 5.3
    CATEGORIES.forEach(category => {
      const categoryTotal = transactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
      const elCategory = document.getElementById('value-' + category.toLowerCase());
      if (elCategory) {
        elCategory.textContent = this.formatCurrency(categoryTotal);
      }
    });
  },

  /**
   * Merender Transaction Table.
   * Setiap transaksi ditampilkan sebagai baris dengan kolom: Nama, Jumlah,
   * Kategori (badge), Tanggal, tombol Hapus.
   * Menampilkan indikator sort (▲/▼) pada header kolom aktif.
   * Requirements: 4.1, 4.2, 4.3, 4.4
   * @param {Transaction[]} transactions
   * @param {'date' | 'amount'} sortKey
   * @param {'asc' | 'desc'} sortDir
   */
  renderTransactionTable(transactions, sortKey, sortDir) {
    // Perbarui indikator sort pada header kolom
    const indicatorAmount = document.getElementById('sort-indicator-amount');
    const indicatorDate   = document.getElementById('sort-indicator-date');

    if (indicatorAmount) {
      indicatorAmount.textContent = sortKey === 'amount'
        ? (sortDir === 'asc' ? '▲' : '▼')
        : '';
    }
    if (indicatorDate) {
      indicatorDate.textContent = sortKey === 'date'
        ? (sortDir === 'asc' ? '▲' : '▼')
        : '';
    }

    // Tampilkan empty state jika tidak ada transaksi
    if (!transactions || transactions.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Sembunyikan pesan kosong, tampilkan tabel
    const tableEmpty = document.getElementById('table-empty');
    const tableBody  = document.getElementById('table-body');
    const table      = document.getElementById('transaction-table');

    if (tableEmpty) tableEmpty.style.display = 'none';
    if (table)      table.style.display = '';

    if (!tableBody) return;

    // Bangun baris tabel
    tableBody.innerHTML = '';
    transactions.forEach(t => {
      const tr = document.createElement('tr');

      // Kolom Nama
      const tdName = document.createElement('td');
      tdName.textContent = t.name;
      tr.appendChild(tdName);

      // Kolom Jumlah (format mata uang)
      const tdAmount = document.createElement('td');
      tdAmount.textContent = this.formatCurrency(t.amount);
      tr.appendChild(tdAmount);

      // Kolom Kategori (dengan badge berwarna)
      const tdCategory = document.createElement('td');
      const badge = document.createElement('span');
      badge.textContent = t.category;
      badge.className = 'category-badge category-badge--' + t.category.toLowerCase();
      tdCategory.appendChild(badge);
      tr.appendChild(tdCategory);

      // Kolom Tanggal
      const tdDate = document.createElement('td');
      tdDate.textContent = t.date;
      tr.appendChild(tdDate);

      // Kolom Aksi — tombol Hapus
      const tdAction = document.createElement('td');
      const btnDelete = document.createElement('button');
      btnDelete.textContent = 'Hapus';
      btnDelete.className = 'btn-delete';
      btnDelete.setAttribute('data-id', t.id);
      btnDelete.setAttribute('aria-label', 'Hapus transaksi ' + t.name);
      tdAction.appendChild(btnDelete);
      tr.appendChild(tdAction);

      tableBody.appendChild(tr);
    });
  },

  /**
   * Menampilkan pesan kosong pada Transaction Table dan menyembunyikan tabel.
   * Requirements: 4.4
   */
  renderEmptyState() {
    const tableEmpty = document.getElementById('table-empty');
    const tableBody  = document.getElementById('table-body');
    const table      = document.getElementById('transaction-table');

    if (tableEmpty) tableEmpty.style.display = '';
    if (table)      table.style.display = 'none';
    if (tableBody)  tableBody.innerHTML = '';
  },

  /**
   * Menghapus semua nilai input form ke kondisi default.
   * Requirements: 2.8
   */
  clearForm() {
    const inputName     = document.getElementById('input-name');
    const inputAmount   = document.getElementById('input-amount');
    const selectCategory = document.getElementById('select-category');
    const inputDate     = document.getElementById('input-date');

    if (inputName)       inputName.value = '';
    if (inputAmount)     inputAmount.value = '';
    if (selectCategory)  selectCategory.value = '';
    if (inputDate)       inputDate.value = '';
  },

  /**
   * Menampilkan pesan error di bawah field tertentu.
   * Mencari elemen `#error-<fieldId>` dan mengisi teks errornya.
   * Requirements: 2.3, 2.4, 2.5, 2.6
   * @param {string} fieldId  — nama field ('name', 'amount', 'category', 'date')
   * @param {string} message  — pesan kesalahan yang akan ditampilkan
   */
  showFieldError(fieldId, message) {
    const errorEl = document.getElementById('error-' + fieldId);
    if (errorEl) {
      errorEl.textContent = message;
    }
  },

  /**
   * Menghapus semua pesan error dari DOM.
   * Mengosongkan teks konten setiap elemen `.field-error`.
   * Requirements: 2.3, 2.4, 2.5, 2.6
   */
  clearFieldErrors() {
    const errorEls = document.querySelectorAll('.field-error');
    errorEls.forEach(el => {
      el.textContent = '';
    });
  }
};

/* =============================================================
   ChartRenderer
   Membungkus integrasi Chart.js.
   ============================================================= */

const ChartRenderer = {
  /** @type {Chart|null} Referensi instance Chart.js aktif */
  chartInstance: null,

  /** Warna tetap per kategori (konsisten dengan CSS variables) */
  COLORS: {
    Food:      '#F97316',
    Transport: '#3B82F6',
    Fun:       '#A855F7'
  },

  /**
   * Merender pie chart; destroy instance lama terlebih dahulu.
   * @param {Transaction[]} transactions
   */
  render(transactions) {
    const totals = CATEGORIES.map(category => transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + Number(t.amount), 0));
    if (totals.every(total => total === 0)) {
      this.destroy();
      this.showEmptyState();
      return;
    }
    const canvas = document.getElementById('chart-expense');
    const empty = document.getElementById('chart-empty');
    if (!canvas || typeof Chart === 'undefined') return;
    this.destroy();
    canvas.style.display = '';
    if (empty) empty.style.display = 'none';
    this.chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'pie',
      data: { labels: CATEGORIES, datasets: [{ data: totals, backgroundColor: CATEGORIES.map(category => this.COLORS[category]) }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  },

  /**
   * Menghancurkan instance Chart.js yang sedang aktif.
   */
  destroy() {
    if (this.chartInstance) this.chartInstance.destroy();
    this.chartInstance = null;
  },

  /**
   * Menampilkan empty state teks sebagai pengganti chart.
   */
  showEmptyState() {
    const canvas = document.getElementById('chart-expense');
    const empty = document.getElementById('chart-empty');
    if (canvas) canvas.style.display = 'none';
    if (empty) empty.style.display = '';
  }
};

/* =============================================================
   NavigationController
   Mengelola navigasi SPA dan perilaku hamburger menu pada mobile.
   ============================================================= */

const NavigationController = {
  /** @type {'dashboard' | 'transactions'} Seksi yang sedang aktif */
  currentSection: 'dashboard',

  /**
   * Inisialisasi event listener navigasi.
   * Pasang listener pada semua tautan [data-section], tombol hamburger,
   * dan overlay/document untuk closeSidebar.
   * Requirements: 7.1, 7.2, 7.4, 7.6
   */
  init() {
    // Pasang event listener pada semua tautan navigasi
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        this.navigateTo(section);
        // Tutup sidebar overlay setelah navigasi di mobile
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          const overlay = document.getElementById('sidebar-overlay');
          if (overlay) overlay.classList.remove('open');
        }
      });
    });

    // Pasang event listener pada tombol hamburger
    const btnHamburger = document.getElementById('btn-hamburger');
    if (btnHamburger) {
      btnHamburger.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // Pasang event listener pada overlay untuk menutup sidebar
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        this.closeSidebar(e);
      });
    }

    // Set seksi default ke "dashboard"
    this.navigateTo('dashboard');
  },

  /**
   * Navigasi ke seksi tertentu.
   * Tampilkan seksi yang sesuai (remove 'hidden'), sembunyikan yang lain.
   * @param {string} section — 'dashboard' | 'transactions'
   * Requirements: 7.2
   */
  navigateTo(section) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(el => {
      const sectionId = 'section-' + section;
      if (el.id === sectionId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    this.currentSection = section;
    this.updateActiveLink(section);
  },

  /**
   * Toggle sidebar overlay pada mobile.
   * Toggle class 'open' pada <aside> dan overlay.
   * Requirements: 7.5
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
    if (overlay) {
      overlay.classList.toggle('open');
    }
  },

  /**
   * Menutup sidebar overlay jika klik target di luar area sidebar.
   * @param {Event} event
   * Requirements: 7.6
   */
  closeSidebar(event) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    // Tutup jika sidebar sedang terbuka
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
    }
  },

  /**
   * Memperbarui gaya visual tautan navigasi aktif.
   * Tambah class 'active' dan aria-current="page" pada tautan aktif,
   * hapus dari yang lain.
   * @param {string} section
   * Requirements: 7.3
   */
  updateActiveLink(section) {
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
      if (link.getAttribute('data-section') === section) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }
};

/* =============================================================
   ThemeController  (Requirement 12 — Opsional)
   Mengelola dark/light mode dan persistensi preferensi tema.
   ============================================================= */

const ThemeController = {
  /** @type {'light' | 'dark'} Tema yang sedang aktif */
  currentTheme: 'light',

  /**
   * Inisialisasi: baca tema dari storage dan terapkan.
   */
  init() {
    // Stub — akan diimplementasikan pada Task 15.1
  },

  /**
   * Toggle antara tema light dan dark.
   */
  toggle() {
    // Stub — akan diimplementasikan pada Task 15.1
  },

  /**
   * Terapkan tema ke elemen <body> via data-theme attribute.
   * @param {'light' | 'dark'} theme
   */
  apply(theme) {
    // Stub — akan diimplementasikan pada Task 15.1
  }
};

/* =============================================================
   MonthlySummary  (Requirement 11 — Opsional)
   Filter dan tampilkan ringkasan pengeluaran per bulan.
   ============================================================= */

const MonthlySummary = {
  /** @type {number} Bulan terpilih (1–12) */
  selectedMonth: new Date().getMonth() + 1,

  /** @type {number} Tahun terpilih */
  selectedYear: new Date().getFullYear(),

  /**
   * Inisialisasi: set nilai default dan pasang event listener kontrol.
   */
  init() {
    // Stub — akan diimplementasikan pada Task 16.1
  },

  /**
   * Merender ringkasan bulanan berdasarkan filter aktif.
   * @param {Transaction[]} transactions
   */
  render(transactions) {
    // Stub — akan diimplementasikan pada Task 16.1
  },

  /**
   * Menghitung total per kategori untuk bulan/tahun terpilih.
   * @returns {{ Food: number, Transport: number, Fun: number, total: number }}
   */
  getFilteredTotals() {
    // Stub — akan diimplementasikan pada Task 16.1
    return { Food: 0, Transport: 0, Fun: 0, total: 0 };
  }
};

/* =============================================================
   renderAll
   Memperbarui seluruh tampilan berdasarkan state transaksi saat ini.
   Dipanggil setiap kali data berubah (tambah / hapus transaksi).
   ============================================================= */

function renderAll() {
  // Stub — akan diimplementasikan secara penuh pada Task 11.1
  // Implementasi penuh akan berisi:
  //   UIRenderer.renderSummaryCards(TransactionManager.transactions);
  //   UIRenderer.renderTransactionTable(TransactionManager.transactions, sortState.key, sortState.direction);
  //   ChartRenderer.render(TransactionManager.transactions);
  //   MonthlySummary.render(TransactionManager.transactions);
}

/* =============================================================
   init
   Fungsi inisialisasi utama yang dipanggil setelah DOM siap.
   ============================================================= */

function init() {
  // ThemeController.init();     — akan diaktifkan pada Task 15.1
  // TransactionManager.load();  — akan diaktifkan pada Task 11.1
  NavigationController.init();
  // renderAll();                 — akan diaktifkan pada Task 11.1
}

/* =============================================================
   ENTRY POINT
   Pasang event listener DOMContentLoaded untuk memanggil init().
   ============================================================= */

document.addEventListener('DOMContentLoaded', init);

/* =============================================================
   EXPORT UNTUK TESTING
   Kompatibilitas dengan Node.js / Vitest (CommonJS fallback).
   ============================================================= */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StorageManager,
    TransactionManager,
    Validator,
    UIRenderer,
    ChartRenderer,
    NavigationController,
    ThemeController,
    MonthlySummary,
    CATEGORIES,
    STORAGE_KEYS,
    ERROR_MESSAGES,
    isValidTransaction
  };
}
