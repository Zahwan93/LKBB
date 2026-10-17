import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAY-bJOK6QLFhpi5lQMLGNxsxIe8JNUvpg",
    authDomain: "tryout-kebun-ilmu.firebaseapp.com",
    projectId: "tryout-kebun-ilmu",
    storageBucket: "tryout-kebun-ilmu.firebasestorage.app",
    messagingSenderId: "497636674894",
    appId: "1:497636674894:web:82fb38cb615d8bf7b1a21f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let dataJuriCache = [];
let listMateriGlobalCache = [];

window.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("admin_logged_in") === "true") {
        bukaDashboard();
    }
});

function bukaDashboard() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    
    if(typeof muatDaftarJuri === "function") muatDaftarJuri();
    if(typeof muatDropdownAksesJuri === "function") muatDropdownAksesJuri();
    if(typeof muatDaftarSoal === "function") muatDaftarSoal();
    if(typeof muatDaftarNilaiPeserta === "function") muatDaftarNilaiPeserta();
}

window.logoutAdmin = function() {
    if(confirm("Keluar dari sesi admin?")) {
        localStorage.removeItem("admin_logged_in");
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_nama");
        location.reload(); 
    }
}

window.cekPilihanMateriGlobal = function(val) {
    const inputBaru = document.getElementById("adm-materi-global-baru");
    if(val === "TAMBAH_BARU") {
        inputBaru.classList.remove("hidden");
        inputBaru.value = "";
        inputBaru.focus();
    } else {
        inputBaru.classList.add("hidden");
        inputBaru.value = val;
    }
}

window.cekPilihanEditMateriGlobal = function(val) {
    const inputBaru = document.getElementById("edit-materi-global-baru");
    if(val === "TAMBAH_BARU") {
        inputBaru.classList.remove("hidden");
        inputBaru.value = "";
        inputBaru.focus();
    } else {
        inputBaru.classList.add("hidden");
        inputBaru.value = val;
    }
}

window.prosesLoginAdmin = async function(e) {
    e.preventDefault();
    const username = document.getElementById("login-user").value.trim().toLowerCase();
    const pass = document.getElementById("login-pass").value;
    const btnSubmit = document.getElementById("btn-submit-login");

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span>🌀 Memeriksa Akun...</span>`;

    try {
        const docRef = doc(db, "akun_admin", username);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().password !== pass) {
            alert("Username atau Password salah!");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<span>🔐 Masuk ke Dashboard</span>`;
            return;
        }

        localStorage.setItem("admin_logged_in", "true");
        localStorage.setItem("admin_user", username);
        bukaDashboard();
    } catch (err) {
        console.error(err);
        alert("Gagal Login: " + err.message);
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>🔐 Masuk ke Dashboard</span>`;
    }
};

window.tambahAkunJuri = async function() {
    const juriId = document.getElementById('adm-juri-id').value.trim().toLowerCase();
    const juriPass = document.getElementById('adm-juri-pass').value.trim();
    const juriNama = document.getElementById('adm-juri-nama').value.trim();

    if(!juriId || !juriPass || !juriNama) {
        alert("Semua kolom akun juri harus diisi!");
        return;
    }

    try {
        await setDoc(doc(db, "akun_juri", juriId), { idJuri: juriId, namaJuri: juriNama, password: juriPass }, { merge: true });
        alert(`Akun Juri (${juriId}) berhasil disimpan! ✅`);
        document.getElementById('adm-juri-id').value = '';
        document.getElementById('adm-juri-pass').value = '';
        document.getElementById('adm-juri-nama').value = '';
        muatDaftarJuri();
        muatDropdownAksesJuri();
    } catch(e) {
        console.error(e);
        alert("Gagal menyimpan akun juri.");
    }
}

window.muatDaftarJuri = async function() {
    const container = document.getElementById('list-juri-container');
    if (!container) return;
    container.innerHTML = '';
    dataJuriCache = [];

    try {
        const querySnapshot = await getDocs(collection(db, "akun_juri"));
        if(querySnapshot.empty) {
            container.innerHTML = `<p class="text-slate-400 text-sm">Belum ada akun juri terdaftar.</p>`;
            return;
        }

        let html = `<div class="space-y-2">`;
        querySnapshot.forEach(docSnap => {
            let data = docSnap.data();
            let jId = docSnap.id;
            let displayNama = data.namaJuri || data.nama || jId;
            dataJuriCache.push({ idJuri: jId, namaJuri: displayNama, password: data.password });

            html += `<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 text-sm gap-2 shadow-sm">
                <div>
                    <span class="font-extrabold text-indigo-700">${jId}</span> - <span class="font-semibold text-slate-800">${displayNama}</span> <span class="text-xs text-slate-400 font-mono">(Pass: ${data.password})</span>
                </div>
                <div class="flex gap-2 self-end sm:self-auto">
                    <button onclick="cetakKartuJuriSingle('${jId}')" class="text-indigo-700 font-extrabold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition border border-indigo-200 shadow-sm">🎴 Cetak Kartu</button>
                    <button onclick="hapusAkunJuri('${jId}')" class="text-rose-600 font-extrabold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition border border-rose-100">Hapus</button>
                </div>
            </div>`;
        });
        html += `</div>`;
        container.innerHTML = html;
    } catch(e) {
        console.error(e);
    }
}

window.hapusAkunJuri = async function(id) {
    if(confirm(`Yakin ingin menghapus akun juri ${id}?`)) {
        await deleteDoc(doc(db, "akun_juri", id));
        muatDaftarJuri();
        muatDropdownAksesJuri();
    }
}

window.muatDropdownAksesJuri = async function() {
    const selectJuri = document.getElementById('pilih-juri-akses');
    if (!selectJuri) return;
    
    try {
        const querySnapshot = await getDocs(collection(db, "akun_juri"));
        let html = `<option value="">-- Pilih Juri Terlebih Dahulu --</option>`;
        querySnapshot.forEach(docSnap => {
            let data = docSnap.data();
            let displayNama = data.namaJuri || data.nama || docSnap.id;
            html += `<option value="${docSnap.id}">${docSnap.id} -${displayNama}</option>`;
        });
        selectJuri.innerHTML = html;
    } catch(e) {
        console.error(e);
    }
};

window.muatPilihanMateriUntukJuri = async function(idJuri) {
    const container = document.getElementById('tree-materi-container');
    if(!idJuri) {
        container.innerHTML = `<p class="text-slate-400 text-sm">Silakan pilih juri di atas terlebih dahulu.</p>`;
        return;
    }

    try {
        const soalSnapshot = await getDocs(collection(db, "master_soal"));
        if(soalSnapshot.empty) {
            container.innerHTML = `<p class="text-slate-400 text-sm">Belum ada materi/soal yang dibuat di sistem.</p>`;
            return;
        }

        let aksesJizin = [];
        const juriDoc = await getDoc(doc(db, "akun_juri", idJuri));
        if(juriDoc.exists() && juriDoc.data().aksesSoal) {
            aksesJizin = juriDoc.data().aksesSoal;
        }

        let allItems = [];
        soalSnapshot.forEach(docSnap => {
            allItems.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Menggunakan urutan sorting yang persis sama dengan muatDaftarSoal
        allItems.sort((a, b) => (a.urutanGlobal || 99) - (b.urutanGlobal || 99) || (a.urutanKategori || 99) - (b.urutanKategori || 99) || (a.urutan || 99) - (b.urutan || 99));

        let dataMap = {};
        allItems.forEach(item => {
            let mg = item.materiGlobal || "UMUM";
            let kat = item.kategori || "LAINNYA";
            if(!dataMap[mg]) dataMap[mg] = {};
            if(!dataMap[mg][kat]) dataMap[mg][kat] = [];
            dataMap[mg][kat].push(item);
        });

        let html = ``;
        for(let mg in dataMap) {
            html += `<div class="border-2 border-indigo-200/60 rounded-3xl p-4 sm:p-6 bg-indigo-50/30 space-y-4 shadow-sm mb-4">
                <div class="border-b border-indigo-200/60 pb-2 flex justify-between items-center flex-wrap gap-2 select-none">
                    <label class="flex items-center gap-2.5 font-extrabold text-indigo-900 uppercase text-base tracking-wider cursor-pointer select-none">
                        <input type="checkbox" class="checkbox-materi-global w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" data-materi="${mg}" onchange="toggleMateriGlobal(this)">
                        📁 Materi Global: ${mg}
                    </label>
                </div>
                <div class="space-y-3">`;
            
            for(let kat in dataMap[mg]) {
                html += `<div class="border border-slate-200/80 rounded-2xl p-4 sm:p-5 bg-white/90 space-y-3 shadow-sm">
                    <div class="flex justify-between items-center flex-wrap gap-2 select-none">
                        <label class="flex items-center gap-2 font-extrabold text-amber-700 uppercase tracking-tight text-sm cursor-pointer select-none">
                            <input type="checkbox" class="checkbox-kategori w-4 h-4 rounded text-amber-500 focus:ring-amber-500" data-materi="${mg}" data-kategori="${kat}" onchange="toggleKategori(this)">
                            🔸 Kategori Besar: ${kat}
                        </label>
                    </div>
                    <div class="space-y-2">`;
                
                dataMap[mg][kat].forEach(item => {
                    let isChecked = aksesJizin.includes(item.id) ? "checked" : "";
                    html += `<label class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer gap-2 hover:border-amber-400 transition">
                        <div class="flex items-center gap-3">
                            <input type="checkbox" class="checkbox-item w-4 h-4 rounded text-slate-600 focus:ring-slate-500" data-materi="${mg}" data-kategori="${kat}" data-id="${item.id}" ${isChecked}>
                            <div>
                                <span class="font-extrabold text-slate-800">${item.nama}</span>
                                <div class="text-xs text-slate-500 mt-0.5">Opsi Skor: <span class="font-semibold text-slate-700">${item.scores.join(', ')}</span></div>
                            </div>
                        </div>
                        <span class="text-xs bg-slate-100 font-extrabold px-2.5 py-1 rounded-xl text-slate-600 border border-slate-200/60 self-end sm:self-auto">Urut: ${item.urutan || 1}</span>
                    </label>`;
                });
                html += `</div></div>`;
            }
            html += `</div></div>`;
        }
        container.innerHTML = html;
    } catch(e) {
        console.error(e);
    }
};

window.toggleMateriGlobal = function(masterEl) {
    const materi = masterEl.getAttribute('data-materi');
    const isChecked = masterEl.checked;
    const container = document.getElementById('tree-materi-container');
    const childCheckboxes = container.querySelectorAll(`input[type="checkbox"][data-materi="${materi}"]`);
    childCheckboxes.forEach(cb => cb.checked = isChecked);
};

window.toggleKategori = function(katEl) {
    const materi = katEl.getAttribute('data-materi');
    const kategori = katEl.getAttribute('data-kategori');
    const isChecked = katEl.checked;
    const container = document.getElementById('tree-materi-container');
    const childCheckboxes = container.querySelectorAll(`input[type="checkbox"][data-materi="${materi}"][data-kategori="${kategori}"]`);
    childCheckboxes.forEach(cb => cb.checked = isChecked);
};

window.simpanAksesMateriJuri = async function() {
    const idJuri = document.getElementById('pilih-juri-akses').value;
    if(!idJuri) {
        alert("Pilih akun juri terlebih dahulu pada dropdown!");
        return;
    }

    const container = document.getElementById('tree-materi-container');
    const itemCheckboxes = container.querySelectorAll('.checkbox-item:checked');
    
    let allowedSoalIds = [];
    itemCheckboxes.forEach(cb => {
        allowedSoalIds.push(cb.getAttribute('data-id'));
    });

    try {
        await updateDoc(doc(db, "akun_juri", idJuri), {
            aksesSoal: allowedSoalIds
        });
        alert(`Hak akses materi untuk juri (${idJuri}) berhasil disimpan! ✅`);
    } catch(e) {
        console.error(e);
        alert("Gagal menyimpan hak akses juri.");
    }
};

window.tambahItemPenilaian = async function() {
    const selectEl = document.getElementById('adm-materi-global');
    let materiGlobal = selectEl.value === "TAMBAH_BARU" ? document.getElementById('adm-materi-global-baru').value.trim().toUpperCase() : selectEl.value.trim().toUpperCase();
    const kategori = document.getElementById('adm-kategori').value.trim().toUpperCase();
    const nama = document.getElementById('adm-nama').value.trim().toUpperCase();
    const skorStr = document.getElementById('adm-skor').value.trim();
    const urutan = Number(document.getElementById('adm-urutan').value) || 1;

    if(!materiGlobal || !kategori || !nama || !skorStr) {
        alert("Semua kolom harus diisi!");
        return;
    }

    const scores = skorStr.split(',').map(s => Number(s.trim()));
    try {
        await addDoc(collection(db, "master_soal"), { materiGlobal, kategori, nama, scores, urutan, urutanGlobal: 1, urutanKategori: 1 });
        alert("Berhasil menambahkan hirarki butir penilaian! ✅");
        document.getElementById('adm-nama').value = '';
        muatDaftarSoal();
    } catch(e) {
        console.error(e);
        alert("Gagal menyimpan ke Firebase!");
    }
}

window.muatDaftarSoal = async function() {
    const container = document.getElementById('list-kategori-container');
    if (!container) return;
    container.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, "master_soal"));
        if(querySnapshot.empty) {
            container.innerHTML = `<p class="text-slate-400 text-sm">Belum ada materi/soal yang dibuat.</p>`;
            listMateriGlobalCache = [];
            updateDropdownMateri([]);
            return;
        }

        let allItems = [];
        querySnapshot.forEach((docSnap) => {
            allItems.push({ id: docSnap.id, ...docSnap.data() });
        });

        allItems.sort((a, b) => (a.urutanGlobal || 99) - (b.urutanGlobal || 99) || (a.urutanKategori || 99) - (b.urutanKategori || 99) || (a.urutan || 99) - (b.urutan || 99));

        let dataMap = {};
        let materiSet = new Set();

        allItems.forEach(item => {
            let mg = item.materiGlobal || "UMUM";
            materiSet.add(mg);
            let kat = item.kategori || "LAINNYA";
            if(!dataMap[mg]) dataMap[mg] = {};
            if(!dataMap[mg][kat]) dataMap[mg][kat] = [];
            dataMap[mg][kat].push(item);
        });

        listMateriGlobalCache = Array.from(materiSet);
        updateDropdownMateri(listMateriGlobalCache);

        let html = '';
        let indexGlobal = 1;
        for (let mg in dataMap) {
            html += `<div draggable="true" data-materi-global="${mg}" data-urutan-global="${indexGlobal}" class="materi-card border-2 border-indigo-200/60 rounded-3xl p-4 sm:p-6 bg-indigo-50/30 space-y-4 shadow-sm mb-4 cursor-grab active:cursor-grabbing">`;
            
            html += `<div class="border-b border-indigo-200/60 pb-2 flex justify-between items-center flex-wrap gap-2 select-none">
                <h3 class="font-extrabold text-indigo-900 text-base uppercase tracking-wider flex items-center gap-2">
                    <span class="text-indigo-400">☰</span> 📁 Materi Global: ${mg}
                </h3>
                <div class="flex items-center gap-2">
                    <button onclick="bukaModalEditMateri('${mg}')" class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl transition shadow-sm">✏️ Edit Materi Global</button>
                    <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">Tarik Materi ☰</span>
                </div>
            </div>`;
            
            let indexKat = 1;
            for (let kat in dataMap[mg]) {
                html += `<div draggable="true" data-kategori-nama="${kat}" data-urutan-kategori="${indexKat}" class="kategori-card border border-slate-200/80 rounded-2xl p-4 sm:p-5 bg-white/90 space-y-3 shadow-sm cursor-grab active:cursor-grabbing">`;
                
                html += `<div class="flex justify-between items-center flex-wrap gap-2 select-none">
                    <h4 class="font-extrabold text-amber-700 uppercase tracking-tight text-sm flex items-center gap-2">
                        <span class="text-slate-300">☰</span> 🔸 Kategori Besar: ${kat}
                    </h4>
                    <div class="flex items-center gap-2">
                        <button onclick="bukaModalEditKategori('${mg}', '${kat}')" class="text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold px-3 py-1.5 rounded-xl transition shadow-sm">✏️ Edit Kategori</button>
                        <span class="text-[10px] text-slate-400 font-bold">Tarik Kategori ☰</span>
                    </div>
                </div>`;

                html += `<ul class="space-y-2 sortable-list" data-materi="${mg}" data-kategori="${kat}">`;
                
                dataMap[mg][kat].forEach(item => {
                    html += `<li draggable="true" data-id="${item.id}" data-urutan="${item.urutan || 1}" class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm cursor-grab active:cursor-grabbing hover:border-amber-400 transition gap-2 select-none">
                        <div class="flex items-center gap-3">
                            <span class="text-slate-300 font-extrabold select-none text-base">☰</span>
                            <div>
                                <span class="font-extrabold text-slate-800">${item.nama}</span> 
                                <div class="text-xs text-slate-500 mt-0.5">Opsi Skor: <span class="font-semibold text-slate-700">${item.scores.join(', ')}</span></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 self-end sm:self-auto">
                            <span class="text-xs bg-slate-100 font-extrabold px-2.5 py-1 rounded-xl text-slate-600 border border-slate-200/60">Urut: ${item.urutan || 1}</span>
                            <button onclick="bukaModalEdit('${item.id}')" class="text-indigo-600 font-extrabold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition border border-indigo-100">Edit</button>
                            <button onclick="hapusSoal('${item.id}')" class="text-rose-600 font-extrabold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition border border-rose-100">Hapus</button>
                        </div>
                    </li>`;
                });
                html += `</ul></div>`;
                indexKat++;
            }
            html += `</div>`;
            indexGlobal++;
        }
        container.innerHTML = html;
        inisialisasiDragAndDrop();
    } catch(e) {
        console.error(e);
    }
}

function inisialisasiDragAndDrop() {
    const container = document.getElementById('list-kategori-container');
    if(!container) return;

    let draggedMateriCard = null;
    const materiCards = container.querySelectorAll('.materi-card');
    
    materiCards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            draggedMateriCard = card;
            card.classList.add('opacity-40');
        });
        card.addEventListener('dragend', async (e) => {
            e.stopPropagation();
            card.classList.remove('opacity-40');
            await simpanUrutanMateriGlobalBaru();
        });
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetCard = e.target.closest('.materi-card');
            if(targetCard && draggedMateriCard && targetCard !== draggedMateriCard) {
                const rect = targetCard.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                container.insertBefore(draggedMateriCard, next ? targetCard.nextSibling : targetCard);
            }
        });
    });

    let draggedKategoriCard = null;
    const kategoriCards = container.querySelectorAll('.kategori-card');

    kategoriCards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            draggedKategoriCard = card;
            card.classList.add('opacity-40');
        });
        card.addEventListener('dragend', async (e) => {
            e.stopPropagation();
            card.classList.remove('opacity-40');
            await simpanUrutanKategoriBaru();
        });
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetCard = e.target.closest('.kategori-card');
            const parentMateri = card.closest('.materi-card');
            const targetMateri = targetCard ? targetCard.closest('.materi-card') : null;

            if(targetCard && draggedKategoriCard && targetCard !== draggedKategoriCard && parentMateri === targetMateri) {
                const rect = targetCard.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                parentMateri.insertBefore(draggedKategoriCard, next ? targetCard.nextSibling : targetCard);
            }
        });
    });

    let draggedItemLi = null;
    const listUl = container.querySelectorAll('.sortable-list');

    listUl.forEach(ul => {
        const items = ul.querySelectorAll('li');
        items.forEach(li => {
            li.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                draggedItemLi = li;
                li.classList.add('opacity-40');
            });
            li.addEventListener('dragend', async (e) => {
                e.stopPropagation();
                li.classList.remove('opacity-40');
                await simpanUrutanItemBaru();
            });
            li.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetLi = e.target.closest('li');
                if (targetLi && draggedItemLi && targetLi !== draggedItemLi && targetLi.parentNode === ul) {
                    const rect = targetLi.getBoundingClientRect();
                    const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    ul.insertBefore(draggedItemLi, next ? targetLi.nextSibling : targetLi);
                }
            });
        });
    });
}

async function simpanUrutanMateriGlobalBaru() {
    const container = document.getElementById('list-kategori-container');
    const materiCards = container.querySelectorAll('.materi-card');
    let batchUpdates = [];

    materiCards.forEach((card, index) => {
        let mgNama = card.getAttribute('data-materi-global');
        let kategoriCards = card.querySelectorAll('.kategori-card');
        
        kategoriCards.forEach(katCard => {
            let katNama = katCard.getAttribute('data-kategori-nama');
            let items = katCard.querySelectorAll('li');
            
            items.forEach((li, itemIndex) => {
                let id = li.getAttribute('data-id');
                batchUpdates.push(updateDoc(doc(db, "master_soal", id), {
                    urutanGlobal: index + 1,
                    materiGlobal: mgNama,
                    kategori: katNama,
                    urutan: itemIndex + 1
                }));
            });
        });
    });

    try {
        await Promise.all(batchUpdates);
    } catch(e) {
        console.error("Gagal menyimpan urutan materi global:", e);
    }
}

async function simpanUrutanKategoriBaru() {
    const container = document.getElementById('list-kategori-container');
    const materiCards = container.querySelectorAll('.materi-card');
    let batchUpdates = [];

    materiCards.forEach(card => {
        let mgNama = card.getAttribute('data-materi-global');
        let kategoriCards = card.querySelectorAll('.kategori-card');
        
        kategoriCards.forEach((katCard, katIndex) => {
            let katNama = katCard.getAttribute('data-kategori-nama');
            let items = katCard.querySelectorAll('li');
            
            items.forEach((li, itemIndex) => {
                let id = li.getAttribute('data-id');
                batchUpdates.push(updateDoc(doc(db, "master_soal", id), {
                    materiGlobal: mgNama,
                    kategori: katNama,
                    urutanKategori: katIndex + 1,
                    urutan: itemIndex + 1
                }));
            });
        });
    });

    try {
        await Promise.all(batchUpdates);
    } catch(e) {
        console.error("Gagal menyimpan urutan kategori:", e);
    }
}

async function simpanUrutanItemBaru() {
    const container = document.getElementById('list-kategori-container');
    const listUls = container.querySelectorAll('.sortable-list');
    let batchUpdates = [];

    listUls.forEach(ul => {
        let mgNama = ul.getAttribute('data-materi');
        let katNama = ul.getAttribute('data-kategori');
        let items = ul.querySelectorAll('li');

        items.forEach((li, index) => {
            let id = li.getAttribute('data-id');
            batchUpdates.push(updateDoc(doc(db, "master_soal", id), {
                materiGlobal: mgNama,
                kategori: katNama,
                urutan: index + 1
            }));
        });
    });

    try {
        await Promise.all(batchUpdates);
    } catch(e) {
        console.error("Gagal menyimpan urutan item:", e);
    }
}

function updateDropdownMateri(listMateri) {
    const selectEl = document.getElementById('adm-materi-global');
    const selectEditEl = document.getElementById('edit-materi-global');
    if(!selectEl || !selectEditEl) return;
    let optionsHtml = `<option value="">-- Pilih Materi Global --</option>`;
    listMateri.forEach(m => { optionsHtml += `<option value="${m}">${m}</option>`; });
    optionsHtml += `<option value="TAMBAH_BARU">✨ + Tambah Materi Global Baru...</option>`;
    selectEl.innerHTML = optionsHtml;
    selectEditEl.innerHTML = optionsHtml;
}

window.bukaModalEditMateri = function(materiGlobal) {
    document.getElementById('edit-materi-lama').value = materiGlobal;
    document.getElementById('edit-materi-baru-input').value = materiGlobal;
    document.getElementById('modal-edit-materi').classList.remove('hidden');
}
window.tutupModalEditMateri = function() {
    document.getElementById('modal-edit-materi').classList.add('hidden');
}
window.simpanEditMateriGlobalMassal = async function() {
    const materiLama = document.getElementById('edit-materi-lama').value;
    const materiBaru = document.getElementById('edit-materi-baru-input').value.trim().toUpperCase();

    if(!materiBaru) {
        alert("Nama Materi Global tidak boleh kosong!");
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "master_soal"));
        let batchUpdates = [];
        querySnapshot.forEach(docSnap => {
            let data = docSnap.data();
            if(data.materiGlobal === materiLama) {
                batchUpdates.push(updateDoc(doc(db, "master_soal", docSnap.id), { materiGlobal: materiBaru }));
            }
        });

        await Promise.all(batchUpdates);
        alert("Semua materi global dan kategori di dalamnya berhasil diperbarui! ✅");
        tutupModalEditMateri();
        muatDaftarSoal();
    } catch(e) {
        console.error(e);
        alert("Gagal memperbarui materi global.");
    }
}

window.bukaModalEditKategori = function(materiGlobal, kategoriBesar) {
    document.getElementById('edit-kategori-lama').value = kategoriBesar;
    document.getElementById('edit-kategori-baru-input').value = kategoriBesar;
    document.getElementById('modal-edit-kategori').classList.remove('hidden');
}
window.tutupModalEditKategori = function() {
    document.getElementById('modal-edit-kategori').classList.add('hidden');
}
window.simpanEditKategoriMassal = async function() {
    const kategoriLama = document.getElementById('edit-kategori-lama').value;
    const kategoriBaru = document.getElementById('edit-kategori-baru-input').value.trim().toUpperCase();

    if(!kategoriBaru) {
        alert("Nama Kategori Besar tidak boleh kosong!");
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "master_soal"));
        let batchUpdates = [];
        querySnapshot.forEach(docSnap => {
            let data = docSnap.data();
            if(data.kategori === kategoriLama) {
                batchUpdates.push(updateDoc(doc(db, "master_soal", docSnap.id), { kategori: kategoriBaru }));
            }
        });

        await Promise.all(batchUpdates);
        alert("Kategori besar dan seluruh butir soal di dalamnya berhasil diperbarui! ✅");
        tutupModalEditKategori();
        muatDaftarSoal();
    } catch(e) {
        console.error(e);
        alert("Gagal memperbarui kategori.");
    }
}

window.bukaModalEdit = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "master_soal", id));
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        document.getElementById('edit-id').value = id;
        const selectEdit = document.getElementById('edit-materi-global');
        const inputBaruEdit = document.getElementById('edit-materi-global-baru');
        
        if (listMateriGlobalCache.includes(data.materiGlobal)) {
            selectEdit.value = data.materiGlobal;
            inputBaruEdit.classList.add("hidden");
        } else {
            selectEdit.value = "TAMBAH_BARU";
            inputBaruEdit.classList.remove("hidden");
            inputBaruEdit.value = data.materiGlobal || '';
        }
        document.getElementById('edit-kategori').value = data.kategori || '';
        document.getElementById('edit-nama').value = data.nama || '';
        document.getElementById('edit-skor').value = data.scores ? data.scores.join(', ') : '';
        document.getElementById('edit-urutan').value = data.urutan || 1;
        document.getElementById('modal-edit').classList.remove('hidden');
    } catch (e) {
        console.error(e);
    }
}

window.tutupModalEdit = function() {
    document.getElementById('modal-edit').classList.add("hidden");
}

window.simpanEditSekaligus = async function() {
    const id = document.getElementById('edit-id').value;
    const selectEdit = document.getElementById('edit-materi-global');
    let materiGlobalBaru = selectEdit.value === "TAMBAH_BARU" ? document.getElementById('edit-materi-global-baru').value.trim().toUpperCase() : selectEdit.value.trim().toUpperCase();
    const kategoriBaru = document.getElementById('edit-kategori').value.trim().toUpperCase();
    const namaBaru = document.getElementById('edit-nama').value.trim().toUpperCase();
    const skorBaruStr = document.getElementById('edit-skor').value.trim();
    const urutanBaru = Number(document.getElementById('edit-urutan').value) || 1;

    if(!materiGlobalBaru || !kategoriBaru || !namaBaru || !skorBaruStr) {
        alert("Semua kolom harus diisi!");
        return;
    }

    const scoresArray = skorBaruStr.split(',').map(s => Number(s.trim()));
    try {
        await updateDoc(doc(db, "master_soal", id), {
            materiGlobal: materiGlobalBaru,
            kategori: kategoriBaru,
            nama: namaBaru,
            scores: scoresArray,
            urutan: urutanBaru
        });
        alert("Data berhasil diperbarui! ✅");
        tutupModalEdit();
        muatDaftarSoal();
    } catch (e) {
        console.error(e);
        alert("Gagal menyimpan perubahan.");
    }
}

window.hapusSoal = async function(id) {
    if(confirm("Yakin ingin menghapus butir soal ini?")) {
        await deleteDoc(doc(db, "master_soal", id));
        muatDaftarSoal();
    }
}

window.muatDaftarNilaiPeserta = async function() {
    // Fungsi kelola nilai peserta
}
