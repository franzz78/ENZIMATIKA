// =========================================================================
// INTEGRASI INSTAN SERVER CLOUD FIREBASE REALTIME DATABASE (ASIA TENGGARA)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Konfigurasi Project Enzimatika Wilayah Server Singapura
const firebaseConfig = {
  apiKey: "AIzaSyAlrg63ku_wVg_NOQiX_xhYzeMVgbTNrIY", // GANTI dengan API Key baru hasil rotate demi keamanan!
  authDomain: "enzimatika-b6568.firebaseapp.com",
  databaseURL: "https://enzimatika-b6568-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "enzimatika-b6568",
  storageBucket: "enzimatika-b6568.firebasestorage.app",
  messagingSenderId: "342163459067",
  appId: "1:342163459067:web:5373bcaba2139a6881595e",
  measurementId: "G-7S0SD0WW5B"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// State Data Global Aplikasi
let studentProfile = { nama: "", kelas: "", skorAkhir: 0 };
let currentMateriIndex = 0;
let currentQuizIndex = 0;
let akumulasiSkorKuis = 0;
let selectedAnswersData = null; // Menyimpan jawaban sementara tiap soal

// =========================================================================
// DATA REPOSITORY: MATERI DAN KUIS INTERAKTIF BIOLOGI
// =========================================================================
const MATERI_BANK = [
  {
    title: "1. Pengertian & Karakteristik Enzim",
    text: "<ul><li><b>Biokatalisator:</b> Mengubah laju reaksi metabolik tubuh tanpa ikut bereaksi atau terkonsumsi di akhir proses.</li><li><b>Spesifisitas Tinggi:</b> Bekerja eksklusif menggunakan mekanisme <i>Lock and Key</i> (gembok dan kunci), di mana satu jenis enzim hanya berpasangan dengan satu substrat spesifik.</li><li><b>Termolabil:</b> Sangat sensitif terhadap suhu ekstrem; akan mengalami denaturasi (rusak) pada suhu tinggi (>40°C) dan tidak aktif pada suhu beku.</li></ul>",
    svg: `<svg viewBox="0 0 100 60"><rect x="5" y="5" width="90" height="50" rx="6" fill="#0f2b36" stroke="#2dd4bf" stroke-width="1"/><circle cx="35" cy="30" r="14" fill="#153c49" stroke="#f5b942" stroke-width="1.5"/><path d="M49 30 L65 18 L65 42 Z" fill="#2dd4bf"/><text x="50" y="54" fill="#9fc4c4" font-size="4" font-family="sans-serif" text-anchor="middle">Model Kompleks Enzim-Substrat</text></svg>`
  },
  {
    title: "2. Komponen Penyusun Enzim",
    text: "<ul><li>Enzim lengkap yang aktif secara biologis dinamakan <b>Holoenzim</b>.</li><li><b>Apoenzim:</b> Bagian utama berupa protein yang bersifat tidak tahan panas (termolabil).</li><li><b>Kofaktor (Non-Protein):</b> Komponen penyusun tambahan. Dapat berupa gugus prostetik organik (Koenzim seperti vitamin) maupun ion anorganik (seperti Mg²⁺, Fe²⁺) yang berfungsi mengaktifkan sisi aktif apoenzim.</li></ul>",
    svg: `<svg viewBox="0 0 100 60"><rect x="5" y="5" width="90" height="50" rx="6" fill="#0f2b36" stroke="#2dd4bf" stroke-width="1"/><path d="M20 20 H45 V40 H20 Z" fill="#153c49" stroke="#2dd4bf" stroke-width="1.5"/><circle cx="65" cy="30" r="10" fill="#f5b942"/><text x="50" y="54" fill="#9fc4c4" font-size="4" font-family="sans-serif" text-anchor="middle">Apoenzim (Protein) & Kofaktor (Non-Protein)</text></svg>`
  }
];

const QUIZ_BANK = [
  {
    type: "PG",
    question: "Manakah pernyataan di bawah ini yang menggambarkan sifat enzim sebagai biokatalisator yang tepat?",
    options: [
      "A. Meningkatkan energi aktivasi untuk mempercepat pembentukan produk metabolisme.",
      "B. Mengubah konstanta kesetimbangan akhir dari suatu reaksi biokimia makromolekul.",
      "C. Mempercepat laju jalannya reaksi biokimia tanpa ikut habis bereaksi dalam sistem.",
      "D. Bekerja secara generik untuk memecah segala macam bentuk ikatan protein dan karbohidrat."
    ],
    correct: 2, // Opsi C
    explanation: "Enzim bertindak sebagai biokatalisator, mempercepat laju reaksi dengan menurunkan energi aktivasi, tanpa ikut terkonsumsi/habis di akhir reaksi."
  },
  {
    type: "ISIAN",
    question: "Komponen penyusun enzim yang terdiri dari struktur protein murni dan memiliki sifat termolabil (sensitif suhu) dinamakan...",
    correctAnswer: "apoenzim",
    explanation: "Apoenzim adalah bagian protein dari enzim yang mengontrol spesifisitas substrat dan mudah terdenaturasi oleh panas."
  }
];

// =========================================================================
// ENGINE UTAMA: MANAJEMEN DAN RESPONSIVITAS LAYAR (16:9 LETTERBOX)
// =========================================================================
function handleScreenScaling() {
  const stage = document.getElementById("stage");
  const targetWidth = 1280;
  const targetHeight = 720;
  
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  const scaleX = windowWidth / targetWidth;
  const scaleY = windowHeight / targetHeight;
  const optimalScale = Math.min(scaleX, scaleY);
  
  stage.style.transform = `translate(-50%, -50%) scale(${optimalScale})`;
}

window.addEventListener("resize", handleScreenScaling);
window.addEventListener("load", handleScreenScaling);

function changeActiveScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

// =========================================================================
// LOGIKA PEMBELAJARAN: MODUL MATERI & DIAGRAM LIGHTBOX ZOOM
// =========================================================================
let zoomState = { scale: 1, isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 };

function renderMateriScreen() {
  const data = MATERI_BANK[currentMateriIndex];
  document.getElementById("materi-title").textContent = data.title;
  document.getElementById("materi-content-area").innerHTML = data.text;
  document.getElementById("diagram-svg-container").innerHTML = data.svg;
  
  // Render pagination dots
  const dotsContainer = document.getElementById("materi-dots");
  dotsContainer.innerHTML = "";
  MATERI_BANK.forEach((_, idx) => {
    const dot = document.createElement("span");
    if(idx === currentMateriIndex) dot.classList.add("on");
    dotsContainer.appendChild(dot);
  });
  
  document.getElementById("btn-prev-materi").disabled = (currentMateriIndex === 0);
  document.getElementById("btn-next-materi").textContent = (currentMateriIndex === MATERI_BANK.length - 1) ? "Selesai Membaca" : "Lanjut";
}

function configureLightboxSystem() {
  const lightbox = document.getElementById("materi-lightbox");
  const lbContent = document.getElementById("lb-content");
  const slider = document.getElementById("lb-zoom-slider");
  const pctReadout = document.getElementById("lb-zoom-pct");
  const stage = document.getElementById("lb-stage");

  document.getElementById("btn-zoom-diagram").addEventListener("click", () => {
    lbContent.innerHTML = MATERI_BANK[currentMateriIndex].svg;
    document.getElementById("lightbox-title").textContent = "Zoom Interaktif: " + MATERI_BANK[currentMateriIndex].title;
    lightbox.classList.add("show");
    resetZoomVariables();
  });

  const closeLightbox = () => lightbox.classList.remove("show");
  document.getElementById("btn-close-lightbox").addEventListener("click", closeLightbox);

  function applyTransformations() {
    lbContent.style.transform = `translate(${zoomState.posX}px, ${zoomState.posY}px) scale(${zoomState.scale})`;
    slider.value = Math.round(zoomState.scale * 100);
    pctReadout.textContent = `${Math.round(zoomState.scale * 100)}%`;
  }

  function resetZoomVariables() {
    zoomState = { scale: 1, isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 };
    applyTransformations();
  }

  slider.addEventListener("input", (e) => {
    zoomState.scale = parseFloat(e.target.value) / 100;
    applyTransformations();
  });

  document.getElementById("btn-zoom-in").addEventListener("click", () => {
    zoomState.scale = Math.min(3, zoomState.scale + 0.25);
    applyTransformations();
  });

  document.getElementById("btn-zoom-out").addEventListener("click", () => {
    zoomState.scale = Math.max(0.5, zoomState.scale - 0.25);
    applyTransformations();
  });

  document.getElementById("btn-zoom-reset").addEventListener("click", resetZoomVariables);

  // Mekanisme Dragging (Geser Diagram Gambar)
  stage.addEventListener("mousedown", (e) => {
    zoomState.isDragging = true;
    stage.style.cursor = "grabbing";
    zoomState.startX = e.clientX - zoomState.posX;
    zoomState.startY = e.clientY - zoomState.posY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!zoomState.isDragging) return;
    zoomState.posX = e.clientX - zoomState.startX;
    zoomState.posY = e.clientY - zoomState.startY;
    applyTransformations();
  });

  window.addEventListener("mouseup", () => {
    zoomState.isDragging = false;
    stage.style.cursor = "grab";
  });
}

// =========================================================================
// LOGIKA EVALUASI: ENGINE SOAL KUIS MULTI-TIPE & DYNAMIC RENDERING
// =========================================================================
function renderQuizScreen() {
  const quiz = QUIZ_BANK[currentQuizIndex];
  const zone = document.getElementById("quiz-answer-zone");
  const submitBtn = document.getElementById("btn-submit-answer");
  const nextBtn = document.getElementById("btn-next-quiz");
  
  // Reset komponen navigasi & banner feedback
  submitBtn.disabled = false;
  nextBtn.disabled = true;
  document.getElementById("quiz-feedback").className = "feedback-banner";
  document.getElementById("quiz-idx-readout").textContent = `${currentQuizIndex + 1}/${QUIZ_BANK.length}`;
  
  const progressPct = ((currentQuizIndex) / QUIZ_BANK.length) * 100;
  document.getElementById("quiz-progress-fill").style.width = `${progressPct}%`;

  zone.innerHTML = "";
  selectedAnswersData = null;

  if (quiz.type === "PG") {
    document.getElementById("quiz-type-tag").textContent = "Pilihan Ganda";
    document.getElementById("quiz-question-title").textContent = quiz.question;

    const grid = document.createElement("div");
    grid.className = "mc-grid";
    
    quiz.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "mc-opt";
      const letters = ["A", "B", "C", "D"];
      btn.innerHTML = `<span class="letter">${letters[idx]}</span> <span class="opt-text">${opt.substring(3)}</span>`;
      
      btn.addEventListener("click", () => {
        document.querySelectorAll(".mc-opt").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedAnswersData = idx;
      });
      grid.appendChild(btn);
    });
    zone.appendChild(grid);

  } else if (quiz.type === "ISIAN") {
    document.getElementById("quiz-type-tag").textContent = "Isian Singkat";
    document.getElementById("quiz-question-title").textContent = "Lengkapi bagian kalimat rumpang di bawah ini:";

    const wrap = document.createElement("div");
    wrap.className = "fill-wrap";
    wrap.innerHTML = `
      <div class="fill-sentence">
        ${quiz.question} <input type="text" id="blank-input" class="fill-input" placeholder="Ketik di sini..." autocomplete="off">
      </div>
      <div class="fill-hint">*Catatan: Gunakan huruf kecil semua dalam menjawab jawaban Anda.</div>
    `;
    zone.appendChild(wrap);
  }
}

function evaluasiJawabanSiswa() {
  const quiz = QUIZ_BANK[currentQuizIndex];
  const fb = document.getElementById("quiz-feedback");
  const fbIcon = document.getElementById("feedback-icon");
  const fbText = document.getElementById("feedback-text");
  const submitBtn = document.getElementById("btn-submit-answer");
  const nextBtn = document.getElementById("btn-next-quiz");

  let isBenar = false;

  if (quiz.type === "PG") {
    if (selectedAnswersData === null) {
      alert("Pilih salah satu jawaban terlebih dahulu!");
      return;
    }
    
    const opts = document.querySelectorAll(".mc-opt");
    opts.forEach((b, idx) => {
      b.disabled = true;
      if(idx === quiz.correct) b.classList.add("correct");
      if(idx === selectedAnswersData && idx !== quiz.correct) b.classList.add("wrong");
    });

    if (selectedAnswersData === quiz.correct) {
      isBenar = true;
      akumulasiSkorKuis += Math.round(100 / QUIZ_BANK.length);
    }
  } else if (quiz.type === "ISIAN") {
    const inputVal = document.getElementById("blank-input").value.trim().toLowerCase();
    if (!inputVal) {
      alert("Kolom isian tidak boleh kosong!");
      return;
    }
    document.getElementById("blank-input").disabled = true;
    if (inputVal === quiz.correctAnswer) {
      isBenar = true;
      akumulasiSkorKuis += Math.round(100 / QUIZ_BANK.length);
    }
  }

  // Tampilkan Banner Feedback Jawaban
  submitBtn.disabled = true;
  nextBtn.disabled = false;
  
  fb.className = "feedback-banner show " + (isBenar ? "correct" : "wrong");
  fbIcon.textContent = isBenar ? "⚡ BERHASIL:" : "❌ KURANG TEPAT:";
  fbText.textContent = isBenar ? `Luar biasa! ${quiz.explanation}` : `Jawaban salah. ${quiz.explanation}`;

  if (currentQuizIndex === QUIZ_BANK.length - 1) {
    nextBtn.textContent = "Lihat Rapor Nilai";
  }
}

function kirimSkorKeDatabaseSiswa() {
  studentProfile.skorAkhir = Math.min(100, akumulasiSkorKuis);
  
  // Render Halaman Ring
  document.getElementById("result-num").textContent = studentProfile.skorAkhir;
  document.getElementById("result-ring").style.setProperty('--pct', studentProfile.skorAkhir);
  
  const statusNode = document.getElementById("result-status");
  if(studentProfile.skorAkhir >= 75) {
    statusNode.textContent = "🎉 Selamat, Anda Lulus Kompetensi!";
    statusNode.style.color = "var(--teal)";
  } else {
    statusNode.textContent = "🔬 Butuh Belajar Lagi (Remedial)";
    statusNode.style.color = "var(--coral)";
  }
  
  changeActiveScreen("screen-result");

  // Eksekusi PUSH DATA ke Server Firebase
  if (!studentProfile.nama || !studentProfile.kelas) return;
  
  const rootNodeRef = ref(db, 'nilai_kuis');
  const dataAutoKeyRef = push(rootNodeRef);

  set(dataAutoKeyRef, {
    nama: studentProfile.nama,
    kelas: studentProfile.kelas,
    skor: studentProfile.skorAkhir,
    tanggalPengerjaan: new Date().toISOString()
  })
  .then(() => console.log("Hasil sinkronisasi cloud sukses."))
  .catch(err => console.error("Gagal terhubung cloud: ", err));
}

// =========================================================================
// GATEWAY RAHASIA & LIVE STREAM DATA PANEL ADMINISTRATOR
// =========================================================================
function inisialisasiLivePanelAdmin() {
  const tableBody = document.getElementById("admin-table-body");
  const totalStats = document.getElementById("admin-stats-total");
  const rootNodeRef = ref(db, 'nilai_kuis');

  // Menggunakan fungsi onValue agar data tersinkron tanpa refresh halaman
  onValue(rootNodeRef, (snapshot) => {
    tableBody.innerHTML = "";
    
    if (!snapshot.exists()) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px; font-family:var(--font-mono)">Belum ada log data pengisian masuk.</td></tr>`;
      totalStats.textContent = "Total Pengisi: 0";
      return;
    }

    let arrData = [];
    snapshot.forEach((child) => {
      arrData.push(child.val());
    });

    // Pengurutan (Terbaru diatas)
    arrData.sort((a, b) => new Date(b.tanggalPengerjaan) - new Date(a.tanggalPengerjaan));
    totalStats.textContent = `Total Pengisi: ${arrData.length}`;

    arrData.forEach((item) => {
      const d = new Date(item.tanggalPengerjaan);
      const stringJam = d.toLocaleDateString('id-ID') + " - " + d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) + " WIB";
      const kelasBadge = item.skor >= 75 ? "skor-lulus" : "skor-remidi";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 13px; color: var(--text-muted);">${stringJam}</td>
        <td style="font-weight: 600;">${item.nama}</td>
        <td><span class="pill">${item.kelas}</span></td>
        <td style="text-align: center;"><span class="skor-badge ${kelasBadge}">${item.skor}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  });
}

// =========================================================================
// ATTACH DOM EVENT LISTENERS & INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Tombol Splash Screen Utama
  document.getElementById("btn-start").addEventListener("click", () => {
    const nama = document.getElementById("input-nama").value.trim();
    const kelas = document.getElementById("input-kelas").value.trim();
    const err = document.getElementById("splash-error");

    if(!nama || !kelas) {
      err.textContent = "Data identitas pendaftaran wajib diisi lengkap!";
      return;
    }

    err.textContent = "";
    studentProfile.nama = nama;
    studentProfile.kelas = kelas;

    document.getElementById("splash-form").style.display = "none";
    const wrap = document.getElementById("loading-wrap");
    const fill = document.getElementById("loading-fill");
    const lbl = document.getElementById("loading-label");
    wrap.classList.add("show");

    let pct = 0;
    const loop = setInterval(() => {
      pct += 4;
      fill.style.width = `${pct}%`;
      lbl.textContent = `MENYIAPKAN LABORATORIUM REAKSI... ${pct}%`;
      if(pct >= 100) {
        clearInterval(loop);
        document.getElementById("home-greet").textContent = `Siswa: ${studentProfile.nama} (${studentProfile.kelas})`;
        changeActiveScreen("screen-home");
      }
    }, 80);
  });

  // Navigasi Hub Menu Utama
  document.getElementById("btn-goto-materi").addEventListener("click", () => {
    currentMateriIndex = 0;
    renderMateriScreen();
    changeActiveScreen("screen-materi");
  });

  document.getElementById("btn-goto-quiz").addEventListener("click", () => {
    currentQuizIndex = 0;
    akumulasiSkorKuis = 0;
    renderQuizScreen();
    changeActiveScreen("screen-quiz");
  });

  // Navigasi Materi Internal
  document.getElementById("btn-prev-materi").addEventListener("click", () => {
    if (currentMateriIndex > 0) { currentMateriIndex--; renderMateriScreen(); }
  });
  
  document.getElementById("btn-next-materi").addEventListener("click", () => {
    if (currentMateriIndex < MATERI_BANK.length - 1) {
      currentMateriIndex++;
      renderMateriScreen();
    } else {
      changeActiveScreen("screen-home");
    }
  });

  // Navigasi Kuis Internal
  document.getElementById("btn-submit-answer").addEventListener("click", evaluasiJawabanSiswa);
  document.getElementById("btn-next-quiz").addEventListener("click", () => {
    if (currentQuizIndex < QUIZ_BANK.length - 1) {
      currentQuizIndex++;
      renderQuizScreen();
    } else {
      kirimSkorKeDatabaseSiswa();
    }
  });

  document.getElementById("btn-goto-credits").addEventListener("click", () => changeActiveScreen("screen-credits"));

  // Pintu Masuk Keamanan Admin (Ganti kata kunci 'admin123' di bawah ini untuk mengubah password)
  document.getElementById("btn-admin-gate").addEventListener("click", () => {
    const kunciValidasi = "admin123";
    const userPrompt = prompt("Masukkan Kata Kunci Akses Otoritas Pengajar:");
    
    if (userPrompt === kunciValidasi) {
      changeActiveScreen("screen-admin");
      inisialisasiLivePanelAdmin();
    } else if (userPrompt !== null) {
      alert("Akses Ditolak: Kunci Otoritas Salah!");
    }
  });

  document.getElementById("btn-admin-logout").addEventListener("click", () => {
    window.location.reload();
  });

  // Inisialisasi Subsistem Tambahan
  configureLightboxSystem();
});

// Pendaftaran PWA Service Worker(Dapat Berjalan Offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log("Worker Aktif di scope:", reg.scope))
      .catch(err => console.error("Worker Error:", err));
  });
}
