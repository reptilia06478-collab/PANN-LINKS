// PANN LINKS — Link Hub
// Developer: PANN

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ═══ STATE ═══
const state = {
  links: JSON.parse(localStorage.getItem("pann_links") || "[]"),
  filter: "all",
  search: "",
  editingId: null,
  detailId: null,
};

// ═══ HELPERS ═══
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getInitials(domain) {
  // Ambil huruf pertama dari setiap kata domain
  const parts = domain.split(".").filter(Boolean);
  const main = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return main.slice(0, 2).toUpperCase();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function saveLinks() {
  try {
    localStorage.setItem("pann_links", JSON.stringify(state.links));
  } catch (e) {
    toast("Gagal menyimpan", "error");
  }
}

// ═══ TOAST ═══
let toastTimer;
function toast(msg, type = "") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}

// ═══ RENDER ═══
function render() {
  renderFilters();
  renderLinks();
}

function renderFilters() {
  const row = $("#filter-row");
  const categories = new Set();
  state.links.forEach(l => {
    if (l.category) categories.add(l.category);
  });

  row.innerHTML = "";

  // "Semua" chip
  const allChip = document.createElement("button");
  allChip.className = "filter-chip" + (state.filter === "all" ? " active" : "");
  allChip.dataset.filter = "all";
  allChip.textContent = "Semua (" + state.links.length + ")";
  allChip.onclick = () => { state.filter = "all"; render(); };
  row.appendChild(allChip);

  // Category chips
  [...categories].sort().forEach(cat => {
    const count = state.links.filter(l => l.category === cat).length;
    const chip = document.createElement("button");
    chip.className = "filter-chip" + (state.filter === cat ? " active" : "");
    chip.dataset.filter = cat;
    chip.textContent = cat + " (" + count + ")";
    chip.onclick = () => { state.filter = cat; render(); };
    row.appendChild(chip);
  });
}

function getFilteredLinks() {
  let list = [...state.links];

  // Filter kategori
  if (state.filter !== "all") {
    list = list.filter(l => l.category === state.filter);
  }

  // Filter search
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(l =>
      (l.title || "").toLowerCase().includes(q) ||
      (l.url || "").toLowerCase().includes(q) ||
      (l.category || "").toLowerCase().includes(q) ||
      (l.note || "").toLowerCase().includes(q)
    );
  }

  // Sort: newest first
  list.sort((a, b) => (b.created || 0) - (a.created || 0));

  return list;
}

function renderLinks() {
  const grid = $("#link-grid");
  const empty = $("#empty-state");
  const list = getFilteredLinks();

  if (list.length === 0) {
    grid.innerHTML = "";
    if (state.links.length === 0) {
      empty.querySelector("h3").textContent = "Belum ada link";
      empty.querySelector("p").textContent = "Tap tombol + di kanan bawah untuk tambah link pertama kamu.";
    } else {
      empty.querySelector("h3").textContent = "Tidak ada hasil";
      empty.querySelector("p").textContent = "Coba kata kunci lain atau ubah filter.";
    }
    empty.classList.add("show");
    return;
  }
  empty.classList.remove("show");

  grid.innerHTML = "";
  list.forEach(link => {
    grid.appendChild(buildLinkCard(link));
  });
}

function buildLinkCard(link) {
  const card = document.createElement("div");
  card.className = "link-card";
  card.dataset.id = link.id;

  const domain = getDomain(link.url);
  const initials = getInitials(domain);

  card.innerHTML = `
    <div class="link-head">
      <div class="link-favicon">
        <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64"
             onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(initials)}';">
      </div>
      <div class="link-info">
        <div class="link-title">${escapeHtml(link.title)}</div>
        <div class="link-url">${escapeHtml(domain)}</div>
      </div>
    </div>
    ${link.note ? `<div class="link-note">${escapeHtml(link.note)}</div>` : ""}
    <div class="link-foot">
      <span class="link-category">${escapeHtml(link.category || "Lainnya")}</span>
      <div class="link-actions">
        <button class="link-action-btn" data-action="copy" title="Copy">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </button>
        <button class="link-action-btn" data-action="edit" title="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="link-action-btn danger" data-action="delete" title="Hapus">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>
  `;

  // Click on card → detail
  card.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action) {
      e.stopPropagation();
      if (action === "copy") copyLink(link);
      else if (action === "edit") openEditModal(link);
      else if (action === "delete") deleteLink(link);
      return;
    }
    openDetailModal(link);
  });

  return card;
}

// ═══ ACTIONS ═══
function copyLink(link) {
  navigator.clipboard.writeText(link.url).then(() => {
    toast("Link disalin");
  }).catch(() => {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = link.url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("Link disalin");
  });
}

function deleteLink(link) {
  if (!confirm(`Hapus "${link.title}"?`)) return;
  state.links = state.links.filter(l => l.id !== link.id);
  saveLinks();
  render();
  toast("Link dihapus");
}

// ═══ MODAL FORM (Add / Edit) ═══
function openAddModal() {
  state.editingId = null;
  $("#modal-title").textContent = "Tambah Link";
  $("#link-title").value = "";
  $("#link-url").value = "";
  $("#link-category").value = "";
  $("#link-note").value = "";
  updateCategoryList();
  $("#modal-form").classList.add("active");
  setTimeout(() => $("#link-title").focus(), 200);
}

function openEditModal(link) {
  state.editingId = link.id;
  $("#modal-title").textContent = "Edit Link";
  $("#link-title").value = link.title || "";
  $("#link-url").value = link.url || "";
  $("#link-category").value = link.category || "";
  $("#link-note").value = link.note || "";
  updateCategoryList();
  $("#modal-form").classList.add("active");
}

function updateCategoryList() {
  const list = $("#category-list");
  const cats = new Set();
  state.links.forEach(l => {
    if (l.category) cats.add(l.category);
  });
  // Tambah preset
  ["Sosmed", "Video", "Musik", "Tools", "Game", "Belajar", "Berita", "Lainnya"].forEach(c => cats.add(c));
  list.innerHTML = "";
  [...cats].sort().forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    list.appendChild(opt);
  });
}

function closeFormModal() {
  $("#modal-form").classList.remove("active");
  state.editingId = null;
}

function saveForm() {
  const title = $("#link-title").value.trim();
  let url = $("#link-url").value.trim();
  const category = $("#link-category").value.trim() || "Lainnya";
  const note = $("#link-note").value.trim();

  if (!title) return toast("Judul harus diisi", "error");
  if (!url) return toast("URL harus diisi", "error");

  // Auto-prepend https:// kalau nggak ada protocol
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  // Validasi URL
  try {
    new URL(url);
  } catch {
    return toast("URL tidak valid", "error");
  }

  if (state.editingId) {
    // Edit
    const idx = state.links.findIndex(l => l.id === state.editingId);
    if (idx >= 0) {
      state.links[idx] = {
        ...state.links[idx],
        title, url, category, note,
        updated: Date.now(),
      };
    }
    toast("Link diupdate");
  } else {
    // Add
    state.links.push({
      id: uid(),
      title, url, category, note,
      created: Date.now(),
    });
    toast("Link ditambah");
  }

  saveLinks();
  render();
  closeFormModal();
}

// ═══ MODAL DETAIL ═══
function openDetailModal(link) {
  state.detailId = link.id;
  const domain = getDomain(link.url);

  $("#detail-body").innerHTML = `
    <div class="detail-row">
      <div class="detail-label">Judul</div>
      <div class="detail-value">${escapeHtml(link.title)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">URL</div>
      <div class="detail-value mono">${escapeHtml(link.url)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Domain</div>
      <div class="detail-value mono">${escapeHtml(domain)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Kategori</div>
      <div class="detail-value">${escapeHtml(link.category || "Lainnya")}</div>
    </div>
    ${link.note ? `
    <div class="detail-row">
      <div class="detail-label">Catatan</div>
      <div class="detail-value">${escapeHtml(link.note)}</div>
    </div>` : ""}
  `;

  $("#modal-detail").classList.add("active");
}

function closeDetailModal() {
  $("#modal-detail").classList.remove("active");
  state.detailId = null;
}

// ═══ IMPORT / EXPORT ═══
function exportJSON() {
  if (state.links.length === 0) return toast("Tidak ada link untuk diexport", "error");

  const data = JSON.stringify({
    exported: new Date().toISOString(),
    developer: "PANN",
    total: state.links.length,
    links: state.links,
  }, null, 2);

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pann-links-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Export berhasil");
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const links = Array.isArray(data) ? data : data.links || [];

      if (!Array.isArray(links) || links.length === 0) {
        return toast("File tidak berisi link", "error");
      }

      // Merge (skip duplikat URL)
      const existingUrls = new Set(state.links.map(l => l.url));
      let added = 0;
      links.forEach(l => {
        if (!l.title || !l.url) return;
        if (existingUrls.has(l.url)) return;
        state.links.push({
          id: l.id || uid(),
          title: l.title,
          url: l.url,
          category: l.category || "Lainnya",
          note: l.note || "",
          created: l.created || Date.now(),
        });
        existingUrls.add(l.url);
        added++;
      });

      saveLinks();
      render();
      toast(`Import: ${added} link ditambahkan`);
    } catch (err) {
      toast("File JSON tidak valid", "error");
    }
  };
  reader.readAsText(file);
}

// ═══ EVENT LISTENERS ═══
$("#fab-add").onclick = openAddModal;
$("#btn-close-modal").onclick = closeFormModal;
$("#btn-cancel-form").onclick = closeFormModal;
$("#btn-save-form").onclick = saveForm;

$("#btn-close-detail").onclick = closeDetailModal;

$("#btn-edit-detail").onclick = () => {
  const link = state.links.find(l => l.id === state.detailId);
  if (link) {
    closeDetailModal();
    openEditModal(link);
  }
};

$("#btn-open-detail").onclick = () => {
  const link = state.links.find(l => l.id === state.detailId);
  if (link) {
    window.open(link.url, "_blank", "noopener");
    closeDetailModal();
  }
};

// Search
$("#search-input").addEventListener("input", (e) => {
  state.search = e.target.value.trim();
  $("#search-clear").classList.toggle("show", state.search.length > 0);
  renderLinks();
});
$("#search-clear").onclick = () => {
  $("#search-input").value = "";
  state.search = "";
  $("#search-clear").classList.remove("show");
  renderLinks();
};

// Export
$("#btn-export").onclick = exportJSON;

// Import
$("#btn-import").onclick = () => $("#import-file").click();
$("#import-file").onchange = (e) => {
  const file = e.target.files[0];
  if (file) importJSON(file);
  e.target.value = "";
};

// Enter di form
$("#link-url").addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveForm();
});
$("#link-title").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#link-url").focus();
});

// Close modal on backdrop click
$$(".modal").forEach(m => {
  m.addEventListener("click", (e) => {
    if (e.target === m) m.classList.remove("active");
  });
});

// ═══ INIT ═══
render();
console.log("[PANN LINKS] Ready. Total:", state.links.length);
