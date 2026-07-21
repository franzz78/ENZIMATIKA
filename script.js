// =========================================================================
// REALTIME DATABASE CLOUD INTEGRATION & SWEETALERT2 POPUPS
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// State Aplikasi Global
let studentProfile = { nama: "", kelas: "", skorAkhir: 0 };
let currentMateriIndex = 0;
let currentQuizIndex = 0;
let akumulasiSkorKuis = 0;
let selectedAnswersData = null;

const MATERI_BANK = [
  {
    title: "1. Pengertian & Karakteristik Enzim",
    text: "<ul><li><b>Biokatalisator:</b> Mempercepat reaksi metabolik tanpa ikut habis bereaksi.</li><li><b>Spesifisitas Tinggi:</b> Bekerja secara spesifik seperti mekanisme kunci dan gembok (Lock & Key).</li><li><b>Termolabil:</b> Sensitif terhadap suhu tinggi (mengalami denaturasi jika di atas 40°C).</li></ul>",
    svg: `<svg viewBox="0 0 100 60"><rect x="5" y="5" width="90" height="50" rx="6" fill="#0f2b36" stroke="#2dd4bf" stroke-width="1"/><circle cx="35" cy="30" r="14" fill="#153c49" stroke="#f5b942" stroke-width="1.5"/><path d="M49 30 L65 18 L65 42 Z" fill="#2dd4bf"/><text x="50" y="54" fill="#9fc4c4" font-size="4" text-anchor="middle">Kompleks Enzim-Substrat</text></svg>`
  },
  {
    title: "2. Komponen Penyusun Enzim",
    text: "<ul><li><b>Holoenzim:</b> Enzim utuh yang aktif secara biologis.</li><li><b>Apoenzim:</b> Bagian utama enzim yang terbuat dari protein (sensitif suhu).</li><li><b>Kofaktor:</b> Komponen non-protein berupa gugus prostetik atau ion anorganik.</li></ul>",
    svg: `<svg viewBox="0 0 100 60"><rect x="5" y="5" width="90" height="50" rx="6" fill="#0f2b36" stroke="#2dd4bf" stroke-width="1"/><path d="M20 20 H45 V40 H20 Z" fill="#153c49" stroke="#2dd4bf" stroke-width="1.5"/><circle cx="65" cy="30" r="10" fill="#f5b942"/><text x="50" y="54" fill="#9fc4c4" font-size="4" text-anchor="middle">Apoenzim & Kofaktor</text></svg>`
  }
];

const QUIZ_BANK = [
  {
    type: "PG",
    question: "Sifat enzim sebagai biokatalisator bermakna...",
    options: [
      "A. Meningkatkan energi aktivasi sistem.",
      "B. Mengubah titik kesetimbangan akhir reaksi.",
      "C. Mempercepat reaksi tanpa ikut terpakai habis.",
      "D. Memecah semua molekul substrat secara acak."
    ],
    correct: 2,
    explanation: "Enzim bertindak mempercepat laju reaksi tanpa ikut terkonsumsi."
  },
  {
    type: "ISIAN",
    question: "Bagian protein murni pada enzim dinamakan...",
    correctAnswer: "apoenzim",
    explanation: "Apoenzim adalah bagian struktur protein pada enzim."
  }
];

function changeActiveScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) target.classList.add("active");
  
  document.getElementById("nav-dropdown").classList.remove("show");
  document.getElementById("nav-toggle").classList.remove("open");
}

function setupNavbarNavigation() {
  const toggleBtn = document.getElementById("nav-toggle");
  const dropdown = document.getElementById("nav-dropdown");

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBtn.classList.toggle("open");
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    toggleBtn.classList.remove("open");
    dropdown.classList.remove("show");
  });

  document.getElementById("menu-home").addEventListener("click", () => changeActiveScreen("screen-home"));
  document.getElementById("menu-materi").addEventListener("click", () => {
    currentMateriIndex = 0;
    renderMateriScreen();
    changeActiveScreen("screen-materi");
  });
  document.getElementById("menu-quiz").addEventListener("click", () => {
    currentQuizIndex = 0;
    akumulasiSkorKuis = 0;
    renderQuizScreen();
    changeActiveScreen("screen-quiz");
  });

  // AKSES ADMIN DENGAN SWEETALERT2 POPUP & PASSWORD
  document.getElementById("menu-admin").addEventListener("click", async () => {
    const passwordValidasi = "ENZIMCLASSXII##";

    const { value: inputPass } = await Swal.fire({
      title: '🔑 Panel Administrator',
      text: 'Masukkan password otentikasi admin:',
      input: 'password',
      inputPlaceholder: 'Password di sini...',
      showCancelButton: true,
      confirmButtonText: 'Verifikasi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2dd4bf'
    });

    if (inputPass === passwordValidasi) {
      Swal.fire({
        title: 'Akses Diterima!',
        text: 'Selamat datang kembali, Administrator.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      changeActiveScreen("screen-admin");
      inisialisasiLivePanelAdmin();
    } else if (inputPass !== undefined) {
      Swal.fire({
        title: 'Akses Ditolak!',
        text: 'Password administrator salah.',
        icon: 'error',
        confirmButtonColor: '#ff6b6b'
      });
    }
  });
}

function renderMateriScreen() {
  const data = MATERI_BANK[currentMateriIndex];
  document.getElementById("materi-title").textContent = data.title;
  document.getElementById("materi-content-area").innerHTML = data.text;
  document.getElementById("diagram-svg-container").innerHTML = data.svg;
  
  const dotsContainer = document.getElementById("materi-dots");
  dotsContainer.innerHTML = "";
  MATERI_BANK.forEach((_, idx) => {
    const dot = document.createElement("span");
    if(idx === currentMateriIndex) dot.classList.add("on");
    dotsContainer.appendChild(dot);
  });
  
  document.getElementById("btn-prev-materi").disabled = (currentMateriIndex === 0);
  document.getElementById("btn-next-materi").textContent = (currentMateriIndex === MATERI_BANK.length - 1) ? "Selesai" : "Lanjut";
}

function renderQuizScreen() {
  const quiz = QUIZ_BANK[currentQuizIndex];
  const zone = document.getElementById("quiz-answer-zone");
  const submitBtn = document.getElementById("btn-submit-answer");
  const nextBtn = document.getElementById("btn-next-quiz");
  
  submitBtn.disabled = false;
  nextBtn.disabled = true;
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
      btn.innerHTML = `<span>${opt}</span>`;
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
    document.getElementById("quiz-question-title").textContent = quiz.question;

    zone.innerHTML = `
      <input type="text" id="blank-input" style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--bg-card-border); background:rgba(0,0,0,0.4); color:#fff;" placeholder="Ketik jawaban kamu...">
    `;
  }
}

function evaluasiJawabanSiswa() {
  const quiz = QUIZ_BANK[currentQuizIndex];
  const submitBtn = document.getElementById("btn-submit-answer");
  const nextBtn = document.getElementById("btn-next-quiz");
  let isBenar = false;

  if (quiz.type === "PG") {
    if (selectedAnswersData === null) {
      return Swal.fire({ title: 'Peringatan!', text: 'Silakan pilih salah satu jawaban terlebih dahulu.', icon: 'warning', confirmButtonColor: '#f5b942' });
    }
    if (selectedAnswersData === quiz.correct) {
      isBenar = true;
      akumulasiSkorKuis += Math.round(100 / QUIZ_BANK.length);
    }
  } else if (quiz.type === "ISIAN") {
    const inputVal = document.getElementById("blank-input").value.trim().toLowerCase();
    if (!inputVal) {
      return Swal.fire({ title: 'Peringatan!', text: 'Kolom jawaban tidak boleh kosong.', icon: 'warning', confirmButtonColor: '#f5b942' });
    }
    if (inputVal === quiz.correctAnswer) {
      isBenar = true;
      akumulasiSkorKuis += Math.round(100 / QUIZ_BANK.length);
    }
  }

  submitBtn.disabled = true;
  nextBtn.disabled = false;

  Swal.fire({
    title: isBenar ? 'Jawaban Benar! 🎉' : 'Kurang Tepat! ❌',
    text: quiz.explanation,
    icon: isBenar ? 'success' : 'error',
    confirmButtonColor: '#2dd4bf'
  });

  if (currentQuizIndex === QUIZ_BANK.length - 1) {
    nextBtn.textContent = "Lihat Nilai";
  }
}

function kirimSkorKeDatabaseSiswa() {
  studentProfile.skorAkhir = Math.min(100, akumulasiSkorKuis);
  document.getElementById("result-num").textContent = studentProfile.skorAkhir;
  document.getElementById("result-ring").style.setProperty('--pct', studentProfile.skorAkhir);
  document.getElementById("result-status").textContent = studentProfile.skorAkhir >= 75 ? "🎉 Selamat, Anda Lulus!" : "🔬 Perlu Remedial";
  
  changeActiveScreen("screen-result");

  if (!studentProfile.nama || !studentProfile.kelas) return;
  
  const rootNodeRef = ref(db, 'nilai_kuis');
  push(rootNodeRef, {
    nama: studentProfile.nama,
    kelas: studentProfile.kelas,
    skor: studentProfile.skorAkhir,
    tanggalPengerjaan: new Date().toISOString()
  });
}

function inisialisasiLivePanelAdmin() {
  const tableBody = document.getElementById("admin-table-body");
  const totalStats = document.getElementById("admin-stats-total");
  const rootNodeRef = ref(db, 'nilai_kuis');

  onValue(rootNodeRef, (snapshot) => {
    tableBody.innerHTML = "";
    if (!snapshot.exists()) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada data nilai masuk.</td></tr>`;
      totalStats.textContent = "Total Pengisi: 0";
      return;
    }

    let arrData = [];
    snapshot.forEach((child) => { arrData.push(child.val()); });
    arrData.sort((a, b) => new Date(b.tanggalPengerjaan) - new Date(a.tanggalPengerjaan));
    totalStats.textContent = `Total Pengisi: ${arrData.length}`;

    arrData.forEach((item) => {
      const d = new Date(item.tanggalPengerjaan);
      const stringJam = d.toLocaleDateString('id-ID') + " - " + d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); color: var(--text-muted);">${stringJam}</td>
        <td style="font-weight: 600;">${item.nama}</td>
        <td><span class="badge">${item.kelas}</span></td>
        <td style="text-align: center; font-weight: bold; color: ${item.skor >= 75 ? 'var(--teal-main)' : 'var(--coral-accent)'}">${item.skor}</td>
      `;
      tableBody.appendChild(tr);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavbarNavigation();

  document.getElementById("btn-start").addEventListener("click", () => {
    const nama = document.getElementById("input-nama").value.trim();
    const kelas = document.getElementById("input-kelas").value.trim();

    if(!nama || !kelas) {
      return Swal.fire({
        title: 'Data Belum Lengkap!',
        text: 'Harap isi Nama dan Kelas sebelum masuk ke lab.',
        icon: 'warning',
        confirmButtonColor: '#f5b942'
      });
    }

    studentProfile.nama = nama;
    studentProfile.kelas = kelas;
    document.getElementById("splash-form").style.display = "none";
    
    const wrap = document.getElementById("loading-wrap");
    const fill = document.getElementById("loading-fill");
    const lbl = document.getElementById("loading-label");
    wrap.classList.add("show");

    let pct = 0;
    const loop = setInterval(() => {
      pct += 10;
      fill.style.width = `${pct}%`;
      lbl.textContent = `MENYIAPKAN RUANG LAB... ${pct}%`;
      if(pct >= 100) {
        clearInterval(loop);
        document.getElementById("nav-user-display").textContent = `${studentProfile.nama} (${studentProfile.kelas})`;
        changeActiveScreen("screen-home");
      }
    }, 40);
  });

  document.getElementById("btn-goto-materi").addEventListener("click", () => { currentMateriIndex = 0; renderMateriScreen(); changeActiveScreen("screen-materi"); });
  document.getElementById("btn-goto-quiz").addEventListener("click", () => { currentQuizIndex = 0; akumulasiSkorKuis = 0; renderQuizScreen(); changeActiveScreen("screen-quiz"); });

  document.getElementById("btn-prev-materi").addEventListener("click", () => { if (currentMateriIndex > 0) { currentMateriIndex--; renderMateriScreen(); } });
  document.getElementById("btn-next-materi").addEventListener("click", () => {
    if (currentMateriIndex < MATERI_BANK.length - 1) { currentMateriIndex++; renderMateriScreen(); }
    else { changeActiveScreen("screen-home"); }
  });

  document.getElementById("btn-submit-answer").addEventListener("click", evaluasiJawabanSiswa);
  document.getElementById("btn-next-quiz").addEventListener("click", () => {
    if (currentQuizIndex < QUIZ_BANK.length - 1) { currentQuizIndex++; renderQuizScreen(); }
    else { kirimSkorKeDatabaseSiswa(); }
  });

  document.getElementById("btn-goto-credits").addEventListener("click", () => changeActiveScreen("screen-credits"));
  document.getElementById("btn-admin-logout").addEventListener("click", () => window.location.reload());
});
    
