// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// KONFIGURASI FIREBASE ANDA
// Ganti dengan data config dari Project Settings Firebase Console Anda
const firebaseConfig = {
  apiKey: "AIzaSyAlrg63ku_wVg_NOQiX_xhYzeMVgbTNrIY",
  authDomain: "enzimatika-b6568.firebaseapp.com",
  databaseURL: "https://enzimatika-b6568-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "enzimatika-b6568",
  storageBucket: "enzimatika-b6568.firebasestorage.app",
  messagingSenderId: "342163459067",
  appId: "1:342163459067:web:5373bcaba2139a6881595e",
  measurementId: "G-7S0SD0WW5B"
};
// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// State data user global
let userData = {
  nama: "",
  kelas: "",
  skorFinal: 0
};

// =========================================================
// REGISTER SERVICE WORKER (Bisa Dijadikan Aplikasi / PWA)
// =========================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker terdaftar!', reg.scope))
      .catch(err => console.error('Pendaftaran Service Worker gagal:', err));
  });
}

// =========================================================
// LOGIK INTERAKSI & NAVIGASI APLIKASI
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  const btnStart = document.getElementById("btn-start");
  const inputNama = document.getElementById("input-nama");
  const inputKelas = document.getElementById("input-kelas");
  const splashError = document.getElementById("splash-error");
  const splashForm = document.getElementById("splash-form");
  const loadingWrap = document.getElementById("loading-wrap");
  const loadingFill = document.getElementById("loading-fill");
  const loadingLabel = document.getElementById("loading-label");
  const homeGreet = document.getElementById("home-greet");

  // Penanganan Halaman Awal (Splash Screen)
  btnStart.addEventListener("click", () => {
    const nama = inputNama.value.trim();
    const kelas = inputKelas.value.trim();

    if (!nama || !kelas) {
      splashError.textContent = "Nama dan Kelas harus diisi!";
      return;
    }

    splashError.textContent = "";
    userData.nama = nama;
    userData.kelas = kelas;

    // Animasi simulasi loading laboratorium
    splashForm.style.display = "none";
    loadingWrap.classList.add("show");
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      loadingFill.style.width = `${progress}%`;
      loadingLabel.textContent = `MENYIAPKAN LABORATORIUM... ${progress}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        showScreen("screen-home");
        homeGreet.textContent = `Halo, ${userData.nama}!`;
      }
    }, 100);
  });

  // Navigasi menu utama ke materi atau kuis langsung
  document.getElementById("btn-goto-materi").addEventListener("click", () => showScreen("screen-materi"));
  document.getElementById("btn-goto-quiz").addEventListener("click", () => showScreen("screen-quiz"));

  // Contoh fungsi pemicu ketika kuis selesai (Kumpulkan skor)
  // Panggil fungsi ini saat logika penilaian kuis Anda mencapai soal terakhir.
  window.menyelesaikanKuis = function(skor) {
    userData.skorFinal = skor;
    
    // Tampilkan pada UI hasil
    document.getElementById("result-num").textContent = skor;
    document.getElementById("result-ring").style.setProperty('--pct', skor);
    showScreen("screen-result");

    // Kirim data secara real-time ke Firebase
    simpanKeDatabase();
  };
});

// Fungsi untuk berpindah layar panel
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

// =========================================================
// FUNGSI PUSH DATA KE FIREBASE REALTIME DATABASE
// =========================================================
function simpanKeDatabase() {
  if (!userData.nama || !userData.kelas) return;

  // Membuat node referensi baru di dalam tabel 'nilai_kuis'
  const nilaiRef = ref(db, 'nilai_kuis');
  const dataBaruRef = push(nilaiRef);

  set(dataBaruRef, {
    nama: userData.nama,
    kelas: userData.kelas,
    skor: userData.skorFinal,
    tanggalPengerjaan: new Date().toISOString()
  })
  .then(() => {
    console.log("Data hasil belajar berhasil disinkronkan ke cloud secara real-time!");
  })
  .catch((error) => {
    console.error("Gagal menyinkronkan data: ", error);
  });
}
