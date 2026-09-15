/* ============================================================
   ADMIN PANEL JS — Fajar Portfolio
   - Password login (SHA-256)
   - GitHub API integration
   - CRUD: About, Skills, Projects, Contact, Settings
   ============================================================ */

'use strict';

// ── CONFIG ────────────────────────────────────────────────
const GITHUB_USER   = 'Fajarbiasaaja';
const GITHUB_REPO   = 'portofoliofajar.io';
const GITHUB_BRANCH = 'main';
const DATA_PATH     = 'data.json';

// Default password: fajar2026
const DEFAULT_PWD_HASH = 'a4e1b2e4c2b7a8d0f3a3c8d0e6b2d8d2f4a6e2b4c0d8a2e4b6c2d0f8a4b2e6';

// ── STATE ─────────────────────────────────────────────────
let portfolioData  = null;
let deleteCallback = null;

// ── HELPERS ───────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function showToast(msg, isError = false) {
    const toast = $('toast');
    $('toastMsg').textContent = msg;
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

function openModal(id) {
    $(id).classList.remove('hidden');
}

function closeModal(id) {
    $(id).classList.add('hidden');
}

function getStoredHash() {
    return localStorage.getItem('admin_pwd_hash') || DEFAULT_PWD_HASH;
}

function getToken() {
    return sessionStorage.getItem('gh_token') || '';
}

// ── LOGIN ─────────────────────────────────────────────────
async function initLogin() {
    const form  = $('loginForm');
    const input = $('loginPassword');
    const err   = $('loginError');
    const toggle = $('togglePwd');

    toggle.addEventListener('click', () => {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        toggle.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hash = await sha256(input.value.trim());
        if (hash === getStoredHash()) {
            $('loginScreen').classList.add('hidden');
            $('dashboard').classList.remove('hidden');
            await loadData();
            populateAll();
        } else {
            err.classList.remove('hidden');
            input.value = '';
            input.focus();
            setTimeout(() => err.classList.add('hidden'), 3000);
        }
    });
}

// ── DATA LAYER ────────────────────────────────────────────
async function loadData() {
    try {
        // Try fetching fresh from GitHub (bypass cache)
        const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_PATH}?t=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        portfolioData = await res.json();
    } catch {
        // Fallback: load locally
        try {
            const res = await fetch('../data.json');
            portfolioData = await res.json();
        } catch {
            portfolioData = { about: {}, skills: [], projects: [], contact: {}, meta: {} };
        }
    }
}

async function saveData() {
    const token = getToken();
    if (!token) {
        showToast('⚠️ Masukkan GitHub Token di Settings terlebih dahulu!', true);
        switchSection('settings');
        return;
    }

    const saveBtn = $('globalSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        // Get current file SHA
        const metaRes = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_PATH}`,
            { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
        );

        if (metaRes.status === 401) {
            showToast('Token tidak valid atau kadaluarsa. Perbarui di Settings.', true);
            return;
        }

        const meta = await metaRes.json();
        const sha  = meta.sha;

        // Encode content
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(portfolioData, null, 2))));

        // Push update
        const putRes = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_PATH}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: '✏️ Update portfolio content via Admin Panel',
                    content,
                    sha,
                    branch: GITHUB_BRANCH
                })
            }
        );

        if (!putRes.ok) {
            const err = await putRes.json();
            throw new Error(err.message || 'GitHub API error');
        }

        showToast('✅ Berhasil! Website akan diperbarui dalam ~1 menit.');
    } catch (err) {
        showToast('❌ Gagal menyimpan: ' + err.message, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Simpan & Publish</span>';
    }
}

// ── POPULATE ALL FORMS ────────────────────────────────────
function populateAll() {
    populateAbout();
    populateSkills();
    populateProjects();
    populateContact();
}

// ── ABOUT ─────────────────────────────────────────────────
function populateAbout() {
    const a = portfolioData.about || {};
    $('aboutName').value      = a.name || '';
    $('aboutLocation').value  = a.location || '';
    $('aboutEducation').value = a.education || '';
    $('aboutSchool').value    = a.school || '';
    $('aboutDesc').value      = a.description || '';
    $('aboutQuote').value     = a.quote || '';
    renderRoles(a.roles || []);
}

function renderRoles(roles) {
    const container = $('rolesContainer');
    container.innerHTML = '';
    roles.forEach((role, i) => {
        const div = document.createElement('div');
        div.className = 'role-item';
        div.innerHTML = `
            <input type="text" value="${role}" placeholder="Contoh: Web Developer" data-role-index="${i}">
            <button class="btn-icon delete" data-delete-role="${i}" title="Hapus">
                <i class="fas fa-trash"></i>
            </button>`;
        container.appendChild(div);
    });
}

function collectAbout() {
    const roles = [...document.querySelectorAll('[data-role-index]')].map(i => i.value.trim()).filter(Boolean);
    portfolioData.about = {
        ...portfolioData.about,
        name:        $('aboutName').value.trim(),
        location:    $('aboutLocation').value.trim(),
        education:   $('aboutEducation').value.trim(),
        school:      $('aboutSchool').value.trim(),
        description: $('aboutDesc').value.trim(),
        quote:       $('aboutQuote').value.trim(),
        roles
    };
}

// ── SKILLS ────────────────────────────────────────────────
function populateSkills() {
    const grid = $('skillsGrid');
    grid.innerHTML = '';
    (portfolioData.skills || []).forEach(skill => {
        grid.appendChild(createSkillCard(skill));
    });
}

function createSkillCard(skill) {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.dataset.id = skill.id;
    div.innerHTML = `
        <div class="item-card-header">
            <div class="item-icon ${skill.colorClass}"><i class="${skill.icon}"></i></div>
            <div class="item-info">
                <div class="item-name">${skill.name}</div>
                <div class="item-sub">${skill.description}</div>
            </div>
        </div>
        <div class="skill-bar-container">
            <div class="skill-bar-fill" style="width:${skill.percentage}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.8rem;color:var(--text-muted)">${skill.percentage}%</span>
            <div class="item-actions">
                <button class="btn-icon edit" data-edit-skill="${skill.id}" title="Edit"><i class="fas fa-pen"></i></button>
                <button class="btn-icon delete" data-delete-skill="${skill.id}" data-name="${skill.name}" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    return div;
}

function openSkillModal(skillId = null) {
    if (skillId) {
        const skill = portfolioData.skills.find(s => s.id === skillId);
        if (!skill) return;
        $('skillModalTitle').textContent = 'Edit Skill';
        $('skillName').value   = skill.name;
        $('skillPct').value    = skill.percentage;
        $('skillIcon').value   = skill.icon;
        $('skillColor').value  = skill.colorClass;
        $('skillDesc').value   = skill.description;
        $('skillEditId').value = skill.id;
    } else {
        $('skillModalTitle').textContent = 'Tambah Skill';
        $('skillName').value   = '';
        $('skillPct').value    = '';
        $('skillIcon').value   = '';
        $('skillColor').value  = 'skill-icon-blue';
        $('skillDesc').value   = '';
        $('skillEditId').value = '';
    }
    openModal('skillModal');
}

function saveSkill() {
    const id  = $('skillEditId').value;
    const obj = {
        id:         id || uid(),
        name:       $('skillName').value.trim(),
        percentage: parseInt($('skillPct').value) || 0,
        icon:       $('skillIcon').value.trim(),
        colorClass: $('skillColor').value,
        description: $('skillDesc').value.trim()
    };
    if (!obj.name || !obj.icon) { showToast('Nama dan icon wajib diisi!', true); return; }

    if (id) {
        const idx = portfolioData.skills.findIndex(s => s.id === id);
        if (idx !== -1) portfolioData.skills[idx] = obj;
    } else {
        portfolioData.skills.push(obj);
    }
    populateSkills();
    closeModal('skillModal');
}

// ── PROJECTS ──────────────────────────────────────────────
function populateProjects() {
    const grid = $('projectsGrid');
    grid.innerHTML = '';
    (portfolioData.projects || []).forEach(proj => {
        grid.appendChild(createProjectCard(proj));
    });
}

function createProjectCard(proj) {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.dataset.id = proj.id;
    const imgSrc = `../${proj.image}`;
    div.innerHTML = `
        <img src="${imgSrc}" alt="${proj.title}" class="project-thumb"
             onerror="this.src='https://via.placeholder.com/400x200/${proj.placeholderColor || '6387ff'}/fff?text=${encodeURIComponent(proj.placeholderText || proj.title)}'">
        <div class="item-card-header" style="padding:0">
            <div class="item-info">
                <div style="margin-bottom:4px"><span class="project-tag-badge">${proj.tag}</span></div>
                <div class="item-name">${proj.title}</div>
                <div class="item-sub">${proj.description}</div>
            </div>
        </div>
        <div class="item-actions">
            <button class="btn-icon edit" data-edit-project="${proj.id}" title="Edit"><i class="fas fa-pen"></i></button>
            <button class="btn-icon delete" data-delete-project="${proj.id}" data-name="${proj.title}" title="Hapus"><i class="fas fa-trash"></i></button>
        </div>`;
    return div;
}

function openProjectModal(projId = null) {
    if (projId) {
        const proj = portfolioData.projects.find(p => p.id === projId);
        if (!proj) return;
        $('projectModalTitle').textContent = 'Edit Proyek';
        $('projectTitle').value   = proj.title;
        $('projectTag').value     = proj.tag;
        $('projectImage').value   = proj.image;
        $('projectDesc').value    = proj.description;
        $('projectEditId').value  = proj.id;
    } else {
        $('projectModalTitle').textContent = 'Tambah Proyek';
        $('projectTitle').value   = '';
        $('projectTag').value     = '';
        $('projectImage').value   = '';
        $('projectDesc').value    = '';
        $('projectEditId').value  = '';
    }
    openModal('projectModal');
}

function saveProject() {
    const id  = $('projectEditId').value;
    const obj = {
        id:          id || uid(),
        title:       $('projectTitle').value.trim(),
        tag:         $('projectTag').value.trim(),
        image:       $('projectImage').value.trim(),
        description: $('projectDesc').value.trim(),
        placeholderText:  $('projectTitle').value.trim().replace(/\s+/g, '+'),
        placeholderColor: '6387ff'
    };
    if (!obj.title) { showToast('Judul proyek wajib diisi!', true); return; }

    if (id) {
        const idx = portfolioData.projects.findIndex(p => p.id === id);
        if (idx !== -1) portfolioData.projects[idx] = obj;
    } else {
        portfolioData.projects.push(obj);
    }
    populateProjects();
    closeModal('projectModal');
}

// ── CONTACT ───────────────────────────────────────────────
function populateContact() {
    const c = portfolioData.contact || {};
    $('contactWA').value    = c.whatsapp   || '';
    $('contactEmail').value = c.email      || '';
    $('contactIG').value    = c.instagram  || '';
}

function collectContact() {
    portfolioData.contact = {
        whatsapp:  $('contactWA').value.trim(),
        email:     $('contactEmail').value.trim(),
        instagram: $('contactIG').value.trim()
    };
}

// ── SETTINGS ──────────────────────────────────────────────
function initSettings() {
    // Change password
    $('changePwdBtn').addEventListener('click', async () => {
        const cur     = $('currentPwd').value;
        const nw      = $('newPwd').value;
        const confirm = $('confirmPwd').value;
        const msg     = $('pwdMsg');

        const curHash = await sha256(cur);
        if (curHash !== getStoredHash()) {
            showMsg(msg, 'Password saat ini salah!', 'error'); return;
        }
        if (nw.length < 6) {
            showMsg(msg, 'Password baru minimal 6 karakter!', 'error'); return;
        }
        if (nw !== confirm) {
            showMsg(msg, 'Konfirmasi password tidak cocok!', 'error'); return;
        }
        const newHash = await sha256(nw);
        localStorage.setItem('admin_pwd_hash', newHash);
        showMsg(msg, '✅ Password berhasil diubah!', 'success');
        $('currentPwd').value = '';
        $('newPwd').value = '';
        $('confirmPwd').value = '';
    });

    // Token visibility toggle
    $('toggleToken').addEventListener('click', () => {
        const inp  = $('githubToken');
        const type = inp.type === 'password' ? 'text' : 'password';
        inp.type = type;
        $('toggleToken').querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // Show existing token if any
    const existingToken = getToken();
    if (existingToken) {
        $('githubToken').value = existingToken;
        showTokenStatus('✅ Token aktif untuk sesi ini.', 'ok');
    }

    // Save token
    $('saveTokenBtn').addEventListener('click', async () => {
        const token = $('githubToken').value.trim();
        if (!token) { showTokenStatus('Token tidak boleh kosong!', 'err'); return; }

        showTokenStatus('🔄 Memverifikasi token...', 'ok');

        // Verify token by calling GitHub API
        const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`, {
            headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
        });

        if (res.ok) {
            sessionStorage.setItem('gh_token', token);
            showTokenStatus('✅ Token valid! Siap digunakan untuk Simpan & Publish.', 'ok');
            showToast('Token GitHub berhasil disimpan!');
        } else if (res.status === 401) {
            showTokenStatus('❌ Token tidak valid. Pastikan token sudah benar.', 'err');
        } else {
            showTokenStatus('❌ Gagal verifikasi: ' + res.status, 'err');
        }
    });
}

function showMsg(el, text, type) {
    el.textContent = text;
    el.className   = 'msg ' + type;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function showTokenStatus(text, type) {
    const el = $('tokenStatus');
    el.textContent = text;
    el.className   = 'token-status ' + type;
    el.classList.remove('hidden');
}

// ── NAVIGATION ────────────────────────────────────────────
function switchSection(name) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.section === name);
    });
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.toggle('active', el.id === 'section-' + name);
    });
    $('topbarTitle').textContent = name.charAt(0).toUpperCase() + name.slice(1);

    // Close sidebar on mobile
    $('sidebar').classList.remove('open');
}

// ── DELETE FLOW ───────────────────────────────────────────
function triggerDelete(type, id, name) {
    $('deleteItemName').textContent = name;
    deleteCallback = () => {
        if (type === 'skill') {
            portfolioData.skills = portfolioData.skills.filter(s => s.id !== id);
            populateSkills();
        } else if (type === 'project') {
            portfolioData.projects = portfolioData.projects.filter(p => p.id !== id);
            populateProjects();
        } else if (type === 'role') {
            portfolioData.about.roles.splice(id, 1);
            renderRoles(portfolioData.about.roles);
        }
        closeModal('deleteModal');
        showToast('Item dihapus. Klik "Simpan & Publish" untuk menyimpan.');
    };
    openModal('deleteModal');
}

// ── GLOBAL SAVE ───────────────────────────────────────────
function collectAll() {
    collectAbout();
    collectContact();
}

// ── EVENT LISTENERS ───────────────────────────────────────
function initEvents() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(el.dataset.section);
        });
    });

    // Sidebar toggle (mobile)
    $('menuToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));
    $('sidebarClose').addEventListener('click', () => $('sidebar').classList.remove('open'));

    // Logout
    $('logoutBtn').addEventListener('click', () => {
        if (confirm('Yakin ingin logout?')) {
            sessionStorage.removeItem('gh_token');
            location.reload();
        }
    });

    // Global save
    $('globalSaveBtn').addEventListener('click', () => {
        collectAll();
        saveData();
    });

    // ── About: add role
    $('addRoleBtn').addEventListener('click', () => {
        if (!portfolioData.about.roles) portfolioData.about.roles = [];
        portfolioData.about.roles.push('');
        renderRoles(portfolioData.about.roles);
        // Focus last input
        const inputs = document.querySelectorAll('[data-role-index]');
        if (inputs.length) inputs[inputs.length - 1].focus();
    });

    // ── Skills
    $('addSkillBtn').addEventListener('click', () => openSkillModal());
    $('saveSkillBtn').addEventListener('click', saveSkill);

    // ── Projects
    $('addProjectBtn').addEventListener('click', () => openProjectModal());
    $('saveProjectBtn').addEventListener('click', saveProject);

    // ── Delete confirm
    $('confirmDeleteBtn').addEventListener('click', () => deleteCallback && deleteCallback());

    // ── Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.modal;
            if (id) closeModal(id);
        });
    });

    // ── Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });

    // ── Event delegation for dynamic buttons
    document.addEventListener('click', (e) => {
        // Edit skill
        const editSkill = e.target.closest('[data-edit-skill]');
        if (editSkill) { openSkillModal(editSkill.dataset.editSkill); return; }

        // Delete skill
        const delSkill = e.target.closest('[data-delete-skill]');
        if (delSkill) { triggerDelete('skill', delSkill.dataset.deleteSkill, delSkill.dataset.name); return; }

        // Edit project
        const editProj = e.target.closest('[data-edit-project]');
        if (editProj) { openProjectModal(editProj.dataset.editProject); return; }

        // Delete project
        const delProj = e.target.closest('[data-delete-project]');
        if (delProj) { triggerDelete('project', delProj.dataset.deleteProject, delProj.dataset.name); return; }

        // Delete role
        const delRole = e.target.closest('[data-delete-role]');
        if (delRole) {
            const idx = parseInt(delRole.dataset.deleteRole);
            collectAbout(); // sync first
            triggerDelete('role', idx, portfolioData.about.roles[idx] || 'item ini');
            return;
        }
    });

    // Sync role inputs on change
    $('rolesContainer').addEventListener('input', (e) => {
        if (e.target.dataset.roleIndex !== undefined) {
            const idx = parseInt(e.target.dataset.roleIndex);
            if (!portfolioData.about.roles) portfolioData.about.roles = [];
            portfolioData.about.roles[idx] = e.target.value;
        }
    });
}

// ── BOOT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initSettings();
    initEvents();
});
