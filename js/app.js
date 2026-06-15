document.addEventListener('DOMContentLoaded', () => {

    // --- Lightbox Image Viewer ---
    function openLightbox(imgSrc, caption = '') {
        const overlay = document.getElementById('lightbox-overlay');
        const img = document.getElementById('lightbox-img');
        const cap = document.getElementById('lightbox-caption');
        const openNew = document.getElementById('lightbox-open-new');
        if (!overlay || !img) return;

        img.src = imgSrc;
        cap.textContent = caption;
        openNew.href = imgSrc;
        overlay.classList.add('active');
    }

    window.openLightbox = openLightbox;

    function closeLightbox() {
        const overlay = document.getElementById('lightbox-overlay');
        if (!overlay) return;
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.classList.remove('active');
            overlay.classList.remove('closing');
        }, 300);
    }

    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox-overlay') closeLightbox();
    });
    document.getElementById('lightbox-img')?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // --- Toast Notification System ---
    function showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        const bgColor = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        }[type] || '#3b82f6';

        toast.style.backgroundColor = bgColor;
        toast.innerHTML = message;

        // Add animation keyframe if not exists
        if (!document.getElementById('toast-animation')) {
            const style = document.createElement('style');
            style.id = 'toast-animation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    window.showToast = showToast; // Make globally available

    // --- Professional Custom Confirm Dialog ---
    function showConfirm({
        title = 'Konfirmasi',
        message = 'Apakah Anda yakin?',
        confirmText = 'Ya, Hapus',
        cancelText = 'Batal',
        type = 'danger',  // 'danger' | 'warning' | 'info'
        icon = '🗑️'
    } = {}) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirm-dialog-overlay');
            const titleEl = document.getElementById('confirm-dialog-title');
            const msgEl = document.getElementById('confirm-dialog-message');
            const iconEl = document.getElementById('confirm-dialog-icon');
            const okBtn = document.getElementById('confirm-dialog-ok');
            const cancelBtn = document.getElementById('confirm-dialog-cancel');
            if (!overlay) { resolve(false); return; }

            // Set content
            titleEl.textContent = title;
            msgEl.innerHTML = message;
            iconEl.textContent = icon;
            okBtn.textContent = confirmText;
            cancelBtn.textContent = cancelText;

            // Style based on type
            const colorMap = {
                danger: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', btn: 'linear-gradient(135deg,#ef4444,#dc2626)', shadow: 'rgba(239,68,68,0.4)' },
                warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', btn: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.4)' },
                info: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', btn: 'linear-gradient(135deg,#6366f1,#4f46e5)', shadow: 'rgba(99,102,241,0.4)' }
            };
            const c = colorMap[type] || colorMap.danger;
            iconEl.style.background = c.bg;
            iconEl.style.borderColor = c.border;
            okBtn.style.background = c.btn;
            okBtn.style.boxShadow = `0 4px 15px ${c.shadow}`;

            // Show dialog (re-trigger animation)
            const box = document.getElementById('confirm-dialog-box');
            box.style.animation = 'none';
            overlay.classList.add('active');
            requestAnimationFrame(() => { box.style.animation = ''; });

            // Handlers
            function done(result) {
                overlay.classList.remove('active');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKey);
                resolve(result);
            }
            function onOk() { done(true); }
            function onCancel() { done(false); }
            function onKey(e) { if (e.key === 'Escape') done(false); if (e.key === 'Enter') done(true); }

            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
            document.addEventListener('keydown', onKey);
        });
    }
    window.showConfirm = showConfirm;

    // --- Authentication & Session Management ---
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');

    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userAvatarInitial = document.getElementById('user-avatar-initial');

    // --- Sidebar Navigation DOM ---
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title-text');
    const pageSubtitle = document.getElementById('page-subtitle-text');

    function checkSession() {
        const session = localStorage.getItem('erp_session');
        if (session) {
            const user = JSON.parse(session);
            applyUserSession(user);
        } else {
            loginOverlay.classList.add('active');
        }
    }

    function applyUserSession(user) {
        loginOverlay.classList.remove('active');
        userNameDisplay.textContent = user.nama;
        userRoleDisplay.textContent = user.role;
        userAvatarInitial.textContent = user.nama.charAt(0).toUpperCase();

        // Role-based Access Control
        const isPurchasing = user.role.toLowerCase().includes('purchasing');
        const isProduksi = user.role.toLowerCase().includes('produksi') || user.role.toLowerCase().includes('gudang');
        const isFinance = user.role.toLowerCase().includes('finance') || user.role.toLowerCase().includes('accounting');
        const isSales = user.role.toLowerCase().includes('marketing');
        const isAdmin = ['direktur', 'admin', 'management'].some(r => user.role.toLowerCase().includes(r));
        const isSuperAdmin = ['super admin'].some(r => user.role.toLowerCase().includes(r));

        navItems.forEach(item => {
            const target = item.getAttribute('data-target');
            item.style.display = 'flex'; // Reset display

            if (!isAdmin) {
                if (isPurchasing && target !== 'dashboard' && target !== 'purchasing') item.style.display = 'none';
                if (isProduksi && target !== 'dashboard' && target !== 'produksi' && target !== 'bom') item.style.display = 'none';
                if (isFinance && target !== 'dashboard' && target !== 'finance') item.style.display = 'none';
                if (isSales && target !== 'dashboard' && target !== 'sales') item.style.display = 'none';
                if (item.classList.contains('admin-only')) item.style.display = 'none';
            } else {
                if (item.classList.contains('admin-only')) item.style.display = 'flex';
            }

            // Super Admin Only items
            if (item.classList.contains('super-admin-only')) {
                item.style.display = isSuperAdmin ? 'flex' : 'none';
            }
        });

        // Restore saved page — use hash first (from browser URL), then localStorage
        // save=false to avoid re-writing history on initial restore
        const hashView = location.hash.replace('#', '').trim();
        const savedView = hashView || localStorage.getItem('erp_active_view') || 'dashboard';

        // Check if the target nav is visible for this user
        const targetNav = document.querySelector(`.nav-item[data-target="${savedView}"]`);
        const isVisible = targetNav && getComputedStyle(targetNav).display !== 'none';
        switchView(isVisible ? savedView : 'dashboard', false);

        checkAdminVisibility();
    }

    function checkAdminVisibility() {
        const session = localStorage.getItem('erp_session');
        if (!session) return;
        const user = JSON.parse(session);
        const isAdmin = ['direktur', 'admin', 'management'].some(r => user.role.toLowerCase().includes(r));
        const isSuperAdmin = ['super admin'].some(r => user.role.toLowerCase().includes(r));

        document.querySelectorAll('.admin-only:not(.nav-item)').forEach(el => {
            el.style.display = isAdmin ? '' : 'none';
        });

        document.querySelectorAll('.super-admin-only:not(.nav-item)').forEach(el => {
            el.style.display = isSuperAdmin ? '' : 'none';
        });
    }

    // --- Number Format Utility ---
    function formatRibuan(numStr) {
        let clean = String(numStr).replace(/\D/g, '');
        if (!clean) return '';
        return parseInt(clean, 10).toLocaleString('id-ID');
    }

    document.addEventListener('input', (e) => {
        if (e.target.classList && e.target.classList.contains('number-format')) {
            e.target.value = formatRibuan(e.target.value);
        }
    });

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        btnSubmit.disabled = true;
        loginError.style.display = 'none';

        const res = await window.ERPAPI.request('login', { username, password });

        btnSubmit.innerHTML = 'Masuk <i class="fa-solid fa-arrow-right-to-bracket"></i>';
        btnSubmit.disabled = false;

        if (res.status === 'success') {
            const userSession = { username, role: res.role, nama: res.nama };
            localStorage.setItem('erp_session', JSON.stringify(userSession));
            applyUserSession(userSession);
            loginForm.reset();
        } else {
            loginError.textContent = res.message || 'Username/Password salah.';
            loginError.style.display = 'block';
        }
    });

    const logoutModal = document.getElementById('logout-modal');

    function handleLogoutClick() {
        logoutModal.classList.add('active');
        document.getElementById('sheet-more')?.classList.remove('active');
        document.getElementById('sheet-overlay')?.classList.remove('active');
    }

    btnLogout?.addEventListener('click', handleLogoutClick);
    document.getElementById('btn-logout-mobile')?.addEventListener('click', handleLogoutClick);

    document.getElementById('btn-cancel-logout')?.addEventListener('click', () => {
        logoutModal.classList.remove('active');
    });

    document.getElementById('btn-confirm-logout')?.addEventListener('click', () => {
        logoutModal.classList.remove('active');
        localStorage.removeItem('erp_session');
        loginOverlay.classList.add('active');
    });

    // checkSession() will be called AFTER nav listeners are set up below
    // so that switchView() can properly restore the saved page on refresh.

    // --- Sidebar Navigation ---

    const titles = {
        'dashboard': { title: 'Dashboard Overview', sub: 'Selamat datang kembali, Tim Operasional.' },
        'sales': { title: 'Penawaran & Sales', sub: 'Manajemen Penawaran kepada Customer.' },
        'purchasing': { title: 'Bahan Baku', sub: 'Manajemen pengadaan bahan baku.' },
        'bom': { title: 'PMO & BOM Sampel', sub: 'Manajemen Komposisi Material dan Tahapan Produksi.' },
        'produksi': { title: 'Produksi & Gudang', sub: 'Surat Perintah Kerja dan pemotongan stok.' },
        'finance': { title: 'Finance & Kasir', sub: 'Penagihan, Invoice, dan Petty Cash.' },
        'admin': { title: 'Manajemen Pengguna', sub: 'Pengaturan Role Akses Aplikasi.' },
        'profil': { title: 'Profil Perusahaan', sub: 'Informasi dasar identitas perusahaan.' },
        'coa': { title: 'Kategori COA & Akuntansi', sub: 'Master data pos biaya akuntansi.' },
        'approval': { title: 'Alur Approval', sub: 'Pengaturan hierarki dan rute persetujuan.' },
        'barang-jadi': { title: 'Inventori Barang Jadi', sub: 'Stok produk jadi siap kirim / jual.' },
        'customer': { title: 'Master Customer', sub: 'Database referensi klien / customer perusahaan.' }
    };

    // --- Core View Switcher (must be defined before event listeners & checkSession) ---
    function switchView(targetViewId, save = true) {
        if (!targetViewId) return;

        // Persist
        if (save) {
            localStorage.setItem('erp_active_view', targetViewId);
            history.replaceState(null, '', '#' + targetViewId);
        }

        // Update active nav link
        navItems.forEach(nav => {
            if (nav.id === 'menu-produk-toggle' || nav.id === 'menu-pengaturan-toggle') return;
            const isActive = nav.getAttribute('data-target') === targetViewId;
            nav.classList.toggle('active', isActive);

            // If this nav item is active and it is inside the submenu, ensure submenu is open
            if (isActive && nav.closest('.submenu')) {
                const parentSubmenu = nav.closest('.submenu');
                parentSubmenu.classList.add('open');
                if (parentSubmenu.id === 'submenu-produk') {
                    document.getElementById('menu-produk-toggle').classList.add('open');
                } else if (parentSubmenu.id === 'submenu-pengaturan') {
                    document.getElementById('menu-pengaturan-toggle').classList.add('open');
                }
            }
        });

        // Switch visible view panel
        views.forEach(view => {
            view.classList.remove('active');
            if (view.id === `view-${targetViewId}`) view.classList.add('active');
        });

        // Update header text
        if (titles[targetViewId]) {
            pageTitle.textContent = titles[targetViewId].title;
            pageSubtitle.textContent = titles[targetViewId].sub;
        }

        // Load data
        if (targetViewId === 'purchasing') loadPurchasingData();
        else if (targetViewId === 'admin') loadAdminData();
        else if (targetViewId === 'sales') loadPenawaranData();
        else if (targetViewId === 'bom') loadBOMData();
        else if (targetViewId === 'produksi') loadProduksiData();
        else if (targetViewId === 'po-internal') loadPOInternalData();
        else if (targetViewId === 'barang-jadi') loadBarangJadiData();
        else if (targetViewId === 'profil' || targetViewId === 'coa') loadSettingsData();
        else if (targetViewId === 'approval') loadApprovalData();
        else if (targetViewId === 'customer') loadCustomerData();
        else if (targetViewId === 'dashboard') loadDashboardData();

        if (typeof updateGlobalFAB === 'function') updateGlobalFAB(targetViewId);
    }

    async function loadDashboardData() {
        try {
            const poRes = await window.ERPAPI.request('get_po_internal');
            if (poRes.status === 'success' && poRes.data) {
                const poOut = poRes.data.filter(p => String(p.status).toUpperCase() !== 'SELESAI').length;
                const poEl = document.getElementById('dashboard-po');
                if (poEl) poEl.textContent = poOut;
            }

            const rmRes = await window.ERPAPI.request('get_stock');
            if (rmRes.status === 'success' && rmRes.data) {
                const rmKritis = rmRes.data.filter(s => parseFloat(s.stok) <= 10).length; // Stok <= 10 dianggap kritis
                const rmEl = document.getElementById('dashboard-rm');
                if (rmEl) rmEl.textContent = rmKritis;
            }

            const pnwRes = await window.ERPAPI.request('get_penawaran');
            if (pnwRes.status === 'success' && pnwRes.data) {
                const invUnpaid = pnwRes.data.filter(p => String(p.status).toUpperCase() === 'PENAWARAN').length;
                const invEl = document.getElementById('dashboard-invoice');
                if (invEl) invEl.textContent = invUnpaid;
            }

            const bomRes = await window.ERPAPI.request('get_bom');
            if (bomRes.status === 'success' && bomRes.data) {
                const bmoCount = bomRes.data.length;
                const bmoEl = document.getElementById('dashboard-bmo');
                if (bmoEl) bmoEl.textContent = bmoCount;
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.id === 'menu-produk-toggle') {
                item.classList.toggle('open');
                document.getElementById('submenu-produk').classList.toggle('open');
                return; // Do not switch view for parent menu
            }
            if (item.id === 'menu-pengaturan-toggle') {
                item.classList.toggle('open');
                document.getElementById('submenu-pengaturan').classList.toggle('open');
                return; // Do not switch view for parent menu
            }
            switchView(item.getAttribute('data-target'));
        });
    });

    // NOW initialize session — event listeners & switchView are ready
    checkSession();

    // --- UI Interactions (Theme, Profile, Mobile Nav) ---
    const handleMyProfile = () => {
        const user = JSON.parse(localStorage.getItem('erp_session') || '{}');
        openUserModal('Profil Saya', user);
        document.getElementById('sheet-more')?.classList.remove('active');
        document.getElementById('sheet-overlay')?.classList.remove('active');
        const profileMenu = document.getElementById('profile-action-menu');
        if (profileMenu) profileMenu.style.display = 'none';
    };
    
    const btnSidebarProfile = document.getElementById('btn-sidebar-profile');
    btnSidebarProfile?.addEventListener('click', handleMyProfile);
    
    document.getElementById('btn-my-profile-mobile')?.addEventListener('click', handleMyProfile);

    // Theme Toggle
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Initialize Theme from localStorage
    const savedTheme = localStorage.getItem('erp_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }

    btnThemeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
            localStorage.setItem('erp_theme', 'light');
        } else {
            if (themeIcon) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
            localStorage.setItem('erp_theme', 'dark');
        }
    });

    // Sync Data
    const btnSync = document.getElementById('btn-sync');
    btnSync?.addEventListener('click', () => {
        const icon = btnSync.querySelector('i');
        icon.classList.add('spin');
        showToast('Sinkronisasi data sedang berjalan...', 'info');
        setTimeout(() => {
            icon.classList.remove('spin');
            showToast('Sinkronisasi selesai!', 'success');
        }, 1500);
    });

    // Mobile Bottom Nav Logic
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-target]');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state in bottom nav
            document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            switchView(item.getAttribute('data-target'));
        });
    });

    // Mobile Bottom Sheets
    const sheetOverlay = document.getElementById('sheet-overlay');
    const sheetProduk = document.getElementById('sheet-produk');
    const sheetMore = document.getElementById('sheet-more');

    const openSheet = (sheet) => {
        sheetOverlay.classList.add('active');
        sheet.classList.add('active');
        document.body.classList.add('sheet-open');
    };

    const closeSheets = () => {
        sheetOverlay.classList.remove('active');
        sheetProduk.classList.remove('active');
        sheetMore.classList.remove('active');
        document.body.classList.remove('sheet-open');
    };

    document.getElementById('btn-mobile-produk')?.addEventListener('click', (e) => {
        document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
        e.currentTarget.classList.add('active');
        openSheet(sheetProduk);
    });

    document.getElementById('btn-mobile-more')?.addEventListener('click', (e) => {
        document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
        e.currentTarget.classList.add('active');
        openSheet(sheetMore);
    });

    document.querySelectorAll('.btn-close-sheet').forEach(btn => {
        btn.addEventListener('click', closeSheets);
    });
    sheetOverlay?.addEventListener('click', closeSheets);

    document.querySelectorAll('.sheet-item[data-target]').forEach(item => {
        item.addEventListener('click', () => {
            switchView(item.getAttribute('data-target'));
            closeSheets();
        });
    });

    // Global FAB Logic
    function updateGlobalFAB(viewId) {
        // Mappings for FAB per view
        const fabMappings = {
            'purchasing': [
                { id: 'btn-add-stock', label: 'Tambah Bahan', icon: 'fa-plus', color: 'var(--secondary)' },
                { id: 'btn-import-stock', label: 'Import Data', icon: 'fa-file-import', color: 'var(--info)' },
                { id: 'btn-export-stock', label: 'Export Data', icon: 'fa-file-export', color: 'var(--warning)' }
            ],
            'sales': [{ id: 'btn-add-penawaran', label: 'Buat Penawaran', icon: 'fa-plus', color: 'var(--secondary)' }],
            'po-internal': [{ id: 'btn-add-po-internal', label: 'Buat Pengajuan', icon: 'fa-plus', color: 'var(--primary)' }],
            'bom': [{ id: 'btn-add-bom', label: 'Buat BOM Baru', icon: 'fa-plus', color: 'var(--accent)' }],
            'produksi': [{ id: 'btn-run-spk', label: 'Selesaikan SPK', icon: 'fa-play', color: 'var(--secondary)' }],
            'finance': [{ id: 'btn-add-cash', label: 'Mutasi Kas', icon: 'fa-plus', color: 'var(--primary)' }],
            'coa': [{ id: 'btn-add-coa', label: 'Tambah COA', icon: 'fa-plus', color: 'var(--primary)' }],
            'admin': [{ id: 'btn-add-user', label: 'Tambah User', icon: 'fa-user-plus', color: 'var(--primary)' }],
            'customer': [{ id: 'btn-add-customer', label: 'Tambah Customer', icon: 'fa-user-plus', color: 'var(--primary)' }],
            'approval': [
                { id: 'btn-add-kategori', label: 'Tambah Kategori', icon: 'fa-plus', color: 'var(--primary)' },
                { id: 'btn-add-jabatan', label: 'Tambah Jabatan', icon: 'fa-plus', color: 'var(--secondary)' }
            ]
        };

        const fabWrapper = document.getElementById('global-fab-wrapper');
        const fabMain = document.getElementById('global-fab-main');
        const fabActions = document.getElementById('global-fab-actions');

        if (!fabWrapper) return;

        // Hide FAB on desktop, rely on CSS media query, but in JS we just populate the actions
        const actions = fabMappings[viewId];

        // Handle special cases (e.g., Approval where buttons depend on tabs)
        // If view doesn't have mappings here, we hide FAB
        if (!actions || actions.length === 0) {
            fabWrapper.style.display = 'none';
            closeFAB();
            return;
        }

        fabWrapper.style.display = 'flex';
        fabActions.innerHTML = ''; // Clear old actions

        if (actions.length === 1) {
            // Single Action Mode (No Speed Dial)
            const action = actions[0];
            fabMain.innerHTML = `<i class="fa-solid ${action.icon}"></i>`;
            fabMain.style.background = action.color || 'var(--primary)';

            // Remove old listeners by cloning
            const newFabMain = fabMain.cloneNode(true);
            fabMain.parentNode.replaceChild(newFabMain, fabMain);

            newFabMain.addEventListener('click', () => {
                const targetBtn = document.getElementById(action.id);
                if (targetBtn) targetBtn.click();
            });

            // Update reference
            document.getElementById('global-fab-main').id = 'global-fab-main';
        } else {
            // Speed Dial Mode
            fabMain.innerHTML = '<i class="fa-solid fa-plus"></i>';
            fabMain.style.background = 'var(--primary)';

            actions.forEach(action => {
                const wrapper = document.createElement('div');
                wrapper.className = 'fab-action-wrapper';
                wrapper.innerHTML = `
                    <span class="fab-label">${action.label}</span>
                    <button class="fab-action-btn" style="color: ${action.color || 'var(--primary)'}">
                        <i class="fa-solid ${action.icon}"></i>
                    </button>
                `;
                wrapper.querySelector('button').addEventListener('click', () => {
                    closeFAB();
                    const targetBtn = document.getElementById(action.id);
                    if (targetBtn) targetBtn.click();
                });
                fabActions.appendChild(wrapper);
            });

            // Reattach listener to toggle speed dial
            const newFabMain = fabMain.cloneNode(true);
            fabMain.parentNode.replaceChild(newFabMain, fabMain);
            newFabMain.addEventListener('click', () => toggleFAB());
        }
    }

    function toggleFAB() {
        const fabWrapper = document.getElementById('global-fab-wrapper');
        const fabBackdrop = document.getElementById('fab-backdrop');
        if (!fabWrapper || !fabBackdrop) return;

        if (fabWrapper.classList.contains('active')) {
            closeFAB();
        } else {
            fabWrapper.classList.add('active');
            fabBackdrop.classList.add('active');
        }
    }

    function closeFAB() {
        document.getElementById('global-fab-wrapper')?.classList.remove('active');
        document.getElementById('fab-backdrop')?.classList.remove('active');
    }

    document.getElementById('fab-backdrop')?.addEventListener('click', closeFAB);

    // --- Bahan Baku State ---
    let bahanBakuData = [];
    let bahanBakuCurrentPage = 1;
    const bahanBakuRowsPerPage = 10;

    // Purchasing - Load Stock
    async function loadPurchasingData(isBackgroundSync = false) {
        const tbody = document.getElementById('table-bahan-baku');
        if (!isBackgroundSync) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        }

        const response = await window.ERPAPI.request('get_stock');

        if (response.status === 'success' && response.data) {
            const lokasiList = document.getElementById('lokasi-list');
            if (lokasiList) {
                lokasiList.innerHTML = '';
                const uniqueLokasi = [...new Set(response.data.map(item => item.lokasi).filter(Boolean))];
                uniqueLokasi.forEach(lok => {
                    const option = document.createElement('option');
                    option.value = lok;
                    lokasiList.appendChild(option);
                });
            }

            const satuanList = document.getElementById('satuan-list');
            if (satuanList) {
                const uniqueSatuan = [...new Set(response.data.map(item => item.satuan).filter(Boolean))];
                uniqueSatuan.forEach(sat => {
                    // Hanya tambahkan jika belum ada di opsi default
                    if (![...satuanList.options].some(opt => opt.value.toLowerCase() === sat.toLowerCase())) {
                        const option = document.createElement('option');
                        option.value = sat;
                        satuanList.appendChild(option);
                    }
                });
            }

            const filterGudangEl = document.getElementById('filter-gudang');
            if (filterGudangEl) {
                // Simpan opsi yang dipilih
                const currentVal = filterGudangEl.value;
                filterGudangEl.innerHTML = '<option value="">Semua Gudang</option>';
                const uniqueLokasi = [...new Set(response.data.map(item => item.lokasi).filter(Boolean))];
                uniqueLokasi.forEach(lok => {
                    const option = document.createElement('option');
                    option.value = lok;
                    if (lok === currentVal) option.selected = true;
                    option.textContent = lok;
                    filterGudangEl.appendChild(option);
                });
            }

            bahanBakuData = response.data;
            bahanBakuCurrentPage = 1; // Reset to page 1 on load
            renderPurchasingTable();
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Gagal memuat data / data kosong</td></tr>';
        }
    }

    // --- Event Listeners for Bahan Baku Search, Filter, Pagination ---
    document.getElementById('search-bahan-baku')?.addEventListener('input', () => {
        bahanBakuCurrentPage = 1;
        renderPurchasingTable();
    });

    document.getElementById('filter-gudang')?.addEventListener('change', () => {
        bahanBakuCurrentPage = 1;
        renderPurchasingTable();
    });

    document.getElementById('btn-prev-bahan-baku')?.addEventListener('click', () => {
        if (bahanBakuCurrentPage > 1) {
            bahanBakuCurrentPage--;
            renderPurchasingTable();
        }
    });

    document.getElementById('btn-next-bahan-baku')?.addEventListener('click', () => {
        bahanBakuCurrentPage++;
        renderPurchasingTable();
    });

    function renderPurchasingTable() {
        const tbody = document.getElementById('table-bahan-baku');
        const searchInput = document.getElementById('search-bahan-baku');
        const filterGudang = document.getElementById('filter-gudang');
        const paginationInfo = document.getElementById('pagination-info-bahan-baku');

        const query = searchInput ? searchInput.value.toLowerCase() : '';
        const gudangFilter = filterGudang ? filterGudang.value : '';

        // Filter Data
        let filteredData = bahanBakuData.filter(item => {
            const matchesSearch = item.kode.toLowerCase().includes(query) || item.nama.toLowerCase().includes(query);
            const matchesGudang = gudangFilter === '' || item.lokasi === gudangFilter;
            return matchesSearch && matchesGudang;
        });

        // Calculate Pagination
        const totalRows = filteredData.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / bahanBakuRowsPerPage));
        if (bahanBakuCurrentPage > totalPages) bahanBakuCurrentPage = totalPages;

        const startIndex = (bahanBakuCurrentPage - 1) * bahanBakuRowsPerPage;
        const endIndex = startIndex + bahanBakuRowsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        if (paginatedData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Tidak ada data yang cocok.</td></tr>';
        } else {
            paginatedData.forEach(item => {
                const tr = document.createElement('tr');
                const isKritis = item.stok < 10;
                let actionBtns = `<button class="btn btn-edit-stock" data-kode="${item.kode}" data-nama="${item.nama}" data-stok="${item.stok}" data-satuan="${item.satuan || ''}" data-lokasi="${item.lokasi}" data-harga="${item.harga || 0}" data-spesifikasi="${item.spesifikasi || ''}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>`;
                
                const session = localStorage.getItem('erp_session');
                const user = session ? JSON.parse(session) : {};
                const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));
                
                if (isAdmin) {
                    actionBtns += `<button class="btn btn-delete-stock" data-kode="${item.kode}" data-nama="${item.nama}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>`;
                }

                tr.innerHTML = `
                    <td>${item.kode}</td>
                    <td style="font-weight: 500;">${item.nama}</td>
                    <td>
                        <span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')} ${item.satuan || ''}</span>
                    </td>
                    <td>Rp ${parseInt(item.harga || 0).toLocaleString('id-ID')}</td>
                    <td>${item.lokasi}</td>
                    <td>${actionBtns}</td>
                `;
                tr.style.cursor = 'pointer';
                tr.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', e => e.stopPropagation());
                });
                tr.addEventListener('click', () => {
                    openStockDetail(item);
                });
                tbody.appendChild(tr);
            });
        }

        // Update Pagination Info & Buttons
        if (paginationInfo) {
            paginationInfo.textContent = `Menampilkan ${startIndex + 1}-${Math.min(endIndex, totalRows)} dari ${totalRows} data (Hal ${bahanBakuCurrentPage}/${totalPages})`;
        }
        const btnPrev = document.getElementById('btn-prev-bahan-baku');
        const btnNext = document.getElementById('btn-next-bahan-baku');
        if (btnPrev) btnPrev.disabled = bahanBakuCurrentPage <= 1;
        if (btnNext) btnNext.disabled = bahanBakuCurrentPage >= totalPages;

        // Bind edit/delete buttons
        document.querySelectorAll('.btn-edit-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const b = e.currentTarget;
                openDataModal('Edit Bahan Baku', {
                    kode: b.getAttribute('data-kode'),
                    nama: b.getAttribute('data-nama'),
                    stok: b.getAttribute('data-stok'),
                    satuan: b.getAttribute('data-satuan'),
                    lokasi: b.getAttribute('data-lokasi'),
                    harga: b.getAttribute('data-harga'),
                    spesifikasi: b.getAttribute('data-spesifikasi')
                });
            });
        });

        document.querySelectorAll('.btn-delete-stock').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const kode = e.currentTarget.getAttribute('data-kode');
                const nama = e.currentTarget.getAttribute('data-nama') || kode;
                const ok = await showConfirm({
                    title: 'Hapus Bahan Baku',
                    message: `Yakin ingin menghapus bahan baku:<br><strong style="color:#fff">${nama}</strong>?<br><span style="font-size:0.82rem;color:rgba(255,255,255,0.4);">Data akan dihapus permanen.</span>`,
                    icon: '🗑️',
                    type: 'danger',
                    confirmText: 'Ya, Hapus'
                });
                if (ok) {
                    bahanBakuData = bahanBakuData.filter(s => s.kode !== kode);
                    renderPurchasingTable();

                    window.ERPAPI.request('delete_stock', { kode }).then(res => {
                        showToast(res.status === 'success' ? `✅ ${res.message}` : `❌ ${res.message}`, res.status === 'success' ? 'success' : 'error', 3000);
                        if (res.status !== 'success') loadPurchasingData(true);
                        else loadPurchasingData(true);
                    });
                }
            });
        });
    }

    // --- Modal Logic ---
    const dataModal = document.getElementById('data-modal');
const dataForm = document.getElementById('data-form');

function openDataModal(title, data = null) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('f_kode').value = data ? data.kode : '';
    document.getElementById('f_kode').readOnly = !!data; // readonly if editing
    document.getElementById('f_nama').value = data ? data.nama : '';
    document.getElementById('f_stok').value = data && data.stok ? formatRibuan(data.stok) : '';
    document.getElementById('f_satuan').value = data && data.satuan ? data.satuan : '';
    document.getElementById('f_lokasi').value = data ? data.lokasi : '';
    document.getElementById('f_harga').value = data && data.harga ? formatRibuan(data.harga) : '';
    document.getElementById('f_spesifikasi').value = data && data.spesifikasi && data.spesifikasi !== 'undefined' ? data.spesifikasi : '';

    dataModal.classList.add('active');
}

document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    dataModal.classList.remove('active');
});

dataForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const session = localStorage.getItem('erp_session');
    const user = session ? JSON.parse(session) : {};
    const payload = {
        kode: document.getElementById('f_kode').value,
        nama: document.getElementById('f_nama').value,
        stok: parseInt(String(document.getElementById('f_stok').value).replace(/\D/g, '')) || 0,
        satuan: document.getElementById('f_satuan').value,
        lokasi: document.getElementById('f_lokasi').value,
        harga: parseInt(String(document.getElementById('f_harga').value).replace(/\D/g, '')) || 0,
        spesifikasi: document.getElementById('f_spesifikasi').value,
        username: user.username,
        user_nama: user.nama
    };

    const existingIdx = bahanBakuData.findIndex(s => s.kode === payload.kode);
    if (existingIdx !== -1) {
        bahanBakuData[existingIdx] = { ...bahanBakuData[existingIdx], ...payload };
    } else {
        bahanBakuData.push(payload);
    }

    renderPurchasingTable();
    dataModal.classList.remove('active');

    window.ERPAPI.request('save_stock', payload).then(res => {
        if (res.status !== 'success') {
            showToast(`❌ ${res.message}`, 'error', 3000);
            loadPurchasingData(true);
        } else {
            showToast(`✅ ${res.message}`, 'success', 3000);
            loadPurchasingData(true);
        }
    });
});

// Buttons interactions
document.getElementById('btn-add-stock')?.addEventListener('click', () => {
    openDataModal('Tambah Bahan Baku Baru');
});

document.getElementById('btn-import-stock')?.addEventListener('click', () => {
    document.getElementById('file-import-stock').click();
});

document.getElementById('btn-export-stock')?.addEventListener('click', () => {
    const tbody = document.getElementById('table-bahan-baku');
    if (!tbody) return;
    const table = tbody.closest('table');
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll('td, th');
        if (cols.length === 1 && cols[0].colSpan > 1) continue;

        // Skip last column (Aksi)
        for (let j = 0; j < cols.length - 1; j++) {
            let data = cols[j].innerText.replace(/"/g, '""');
            row.push('"' + data + '"');
        }
        csv.push(row.join(','));
    }
    
    const csvFile = new Blob([csv.join('\n')], {type: "text/csv"});
    const downloadLink = document.createElement("a");
    downloadLink.download = "Data_Bahan_Baku_" + new Date().toISOString().split('T')[0] + ".csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

document.getElementById('file-import-stock')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const btnImport = document.getElementById('btn-import-stock');
    const oldHtml = btnImport.innerHTML;
    btnImport.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btnImport.disabled = true;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            const items = json.map(row => {
                const getVal = (keys) => {
                    for (let key in row) {
                        if (keys.some(k => key.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k))) return row[key];
                    }
                    return "";
                };
                return {
                    kode: getVal(['kode']),
                    nama: getVal(['nama', 'material', 'bahan']),
                    stok: parseInt(getVal(['stok', 'qty', 'jumlah'])) || 0,
                    satuan: getVal(['satuan', 'unit']),
                    harga: parseInt(getVal(['harga', 'price'])) || 0,
                    lokasi: getVal(['lokasi', 'rak', 'zona']),
                    spesifikasi: getVal(['spesifikasi', 'spek', 'desc'])
                };
            }).filter(item => item.kode && item.nama);

            if (items.length > 0) {
                const session = localStorage.getItem('erp_session');
                const user = session ? JSON.parse(session) : {};
                const res = await window.ERPAPI.request('import_stock', { items, username: user.username, user_nama: user.nama });
                alert(res.message);
                if (res.status === 'success') loadPurchasingData();
            } else {
                alert('Tidak ada data valid yang bisa diimpor. Pastikan ada kolom Kode dan Nama Material.');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat memproses file.');
        }
        btnImport.innerHTML = oldHtml;
        btnImport.disabled = false;
        document.getElementById('file-import-stock').value = '';
    };
    reader.readAsArrayBuffer(file);
});

// =============================================
// Flow 0: PO Internal (Pengajuan Belanja)
// =============================================

// Datalist bahan baku — shared across BOM and PO
let poStockData = []; // cache stock data for autocomplete

async function loadPOStockData() {
    const stockRes = await window.ERPAPI.request('get_stock');
    if (stockRes.status === 'success' && stockRes.data) {
        poStockData = stockRes.data;
        // Fill shared datalist
        const list = document.getElementById('bom-bahan-baku-list');
        if (list) {
            list.innerHTML = '';
            poStockData.forEach(s => {
                const option = document.createElement('option');
                option.value = s.nama;
                option.setAttribute('data-kode', s.kode || '');
                option.setAttribute('data-harga', s.harga || 0);
                list.appendChild(option);
            });
        }
    }
}

async function loadPOInternalData(isBackgroundSync = false) {
    const tbody = document.getElementById('table-po-internal');
    if (!tbody) return;
    if (!isBackgroundSync) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    }

    await loadPOStockData();

    const response = await window.ERPAPI.request('get_po_internal');
    if (response.status === 'success' && response.data) {
        tbody.innerHTML = '';
        if (response.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada pengajuan belanja.</td></tr>';
            return;
        }

        const session = localStorage.getItem('erp_session');
        const user = session ? JSON.parse(session) : {};
        const isAtasan = ['Admin', 'Management', 'Super Admin', 'Super', 'super'].includes(user.role);
        const isPurchasing = ['Admin', 'Purchasing', 'Super Admin', 'Super', 'super'].includes(user.role);
        const isAdmin = ['Admin', 'Super Admin', 'Super', 'super'].includes(user.role);

        // Sort newest first
        const sorted = [...response.data].reverse();

        sorted.forEach(item => {
            const tr = document.createElement('tr');
            const items = item.items_parsed || [];
            const jumlahItem = items.length;
            const totalEst = parseInt(item.total_estimasi || 0);

            let badgeClass = 'badge-warning';
            let badgeIcon = '⏳';
            if (item.status === 'Disetujui (Sedang Dibelikan)') { badgeClass = 'badge-success'; badgeIcon = '✅'; }
            else if (item.status === 'Selesai (Barang Diterima)') { badgeClass = 'badge-success'; badgeIcon = '📦'; }
            else if (item.status === 'Ditolak') { badgeClass = 'badge-danger'; badgeIcon = '❌'; }

            let actionBtns = `<button class="btn btn-detail-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--accent);" title="Lihat Detail"><i class="fa-solid fa-eye"></i> Detail</button>`;
            actionBtns += `<button class="btn btn-print-po" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background:var(--info);" title="Print PO"><i class="fa-solid fa-print"></i></button>`;

            if (item.status === 'Menunggu Approval' && isAtasan) {
                actionBtns += `<button class="btn btn-approve-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;" title="Approve"><i class="fa-solid fa-check"></i></button>`;
                actionBtns += `<button class="btn btn-reject-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var(--danger); margin-right: 5px;" title="Tolak"><i class="fa-solid fa-times"></i></button>`;
            } else if (item.status === 'Disetujui (Sedang Dibelikan)' && isPurchasing) {
                actionBtns += `<button class="btn btn-selesai-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var(--info); margin-right: 5px;" title="Selesai - Terima Barang"><i class="fa-solid fa-box-open"></i> Terima</button>`;
            }

            // Tombol hapus hanya untuk Admin / Super Admin
            if (isAdmin) {
                actionBtns += `<button class="btn btn-delete-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var(--danger);" title="Hapus PO"><i class="fa-solid fa-trash"></i></button>`;
            }

            tr.innerHTML = `
                    <td style="font-weight:500; font-size:0.85rem;">${item.no_po}</td>
                    <td style="font-size:0.82rem;">${item.tanggal || '-'}</td>
                    <td>${item.pemohon || '-'}</td>
                    <td style="text-align:center;"><span style="background:rgba(255,255,255,0.08); border-radius:12px; padding:2px 10px; font-size:0.82rem;">${jumlahItem} item</span></td>
                    <td style="font-weight:600; color:var(--primary);">Rp ${totalEst.toLocaleString('id-ID')}</td>
                    <td><span class="badge ${badgeClass}">${badgeIcon} ${item.status}</span></td>
                    <td>${actionBtns}</td>
                `;
            tbody.appendChild(tr);
        });

        // Event delegation
        tbody.querySelectorAll('.btn-detail-po').forEach(btn => {
            btn.addEventListener('click', () => openPODetail(btn.getAttribute('data-no'), response.data));
        });
        tbody.querySelectorAll('.btn-print-po').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemStr = e.currentTarget.getAttribute('data-item');
                if (itemStr) {
                    const item = JSON.parse(itemStr);
                    printPOInternal(item);
                }
            });
        });
        tbody.querySelectorAll('.btn-approve-po').forEach(btn => {
            btn.addEventListener('click', () => updatePOStatusAction(btn.getAttribute('data-no'), 'Disetujui (Sedang Dibelikan)'));
        });
        tbody.querySelectorAll('.btn-reject-po').forEach(btn => {
            btn.addEventListener('click', () => updatePOStatusAction(btn.getAttribute('data-no'), 'Ditolak'));
        });
        tbody.querySelectorAll('.btn-selesai-po').forEach(btn => {
            btn.addEventListener('click', () => updatePOStatusAction(btn.getAttribute('data-no'), 'Selesai (Barang Diterima)'));
        });
        tbody.querySelectorAll('.btn-delete-po').forEach(btn => {
            btn.addEventListener('click', (e) => deletePOInternal(btn.getAttribute('data-no'), e.currentTarget.closest('tr')));
        });
    }
}

function printPOInternal(item) {
    let info = {};
    try {
        info = typeof item.info_tambahan === 'string' ? JSON.parse(item.info_tambahan) : (item.info_tambahan || {});
    } catch (e) { }

    document.getElementById('print_po_company_name').textContent = cachedSettings['NAMA_PERUSAHAAN'] || 'NAMA PERUSAHAAN';
    document.getElementById('print_po_company_address').textContent = cachedSettings['ALAMAT'] || 'Alamat Perusahaan';
    document.getElementById('print_po_company_phone').textContent = cachedSettings['NO_TELP'] || 'No. Telp';

    document.getElementById('print_po_no').textContent = item.no_po || '-';
    document.getElementById('print_po_date').textContent = item.tanggal ? item.tanggal.split(' ')[0] : '-';

    document.getElementById('print_po_to').textContent = info.po_to || '-';
    document.getElementById('print_po_attn').textContent = info.po_attn || '-';
    document.getElementById('print_po_enq').textContent = info.po_enq_no || '-';
    document.getElementById('print_po_maker').textContent = info.po_maker || '-';
    document.getElementById('print_po_delivery').textContent = info.po_delivery || '-';
    document.getElementById('print_po_incoterm').textContent = info.po_incoterm || '-';
    document.getElementById('print_po_payment').textContent = info.po_payment_term || '-';
    document.getElementById('print_po_validity').textContent = info.po_validity || '-';

    document.getElementById('print_po_pemohon').textContent = item.pemohon || '-';
    document.getElementById('print_po_ack').textContent = item.disetujui_oleh || '-';

    let items = [];
    try {
        items = typeof item.items_parsed === 'object' ? item.items_parsed : JSON.parse(item.items || '[]');
    } catch (e) { }

    const tbody = document.getElementById('po-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        items.forEach((it, i) => {
            const sub = (it.qty || 0) * (it.harga || 0);
            tbody.innerHTML += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${i + 1}</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${it.kode || '-'}</td>
                        <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${it.nama || '-'}</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${it.qty || 0}</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: right;">${parseInt(it.harga || 0).toLocaleString('id-ID')}</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: right;">${sub.toLocaleString('id-ID')}</td>
                    </tr>
                `;
        });
    }
    window.print();
}

async function deletePOInternal(noPO, trElement = null) {
    const ok = await showConfirm({
        title: 'Hapus Pengajuan Belanja',
        message: `Hapus pengajuan <strong style="color:#fff">${noPO}</strong>?<br><span style="font-size:0.82rem;color:rgba(255,255,255,0.4);">Data akan dihapus permanen dan tidak bisa dikembalikan.</span>`,
        icon: '🗑️',
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal'
    });
    if (!ok) return;

    if (trElement) trElement.style.display = 'none';
    if (typeof showToast !== 'undefined') showToast('Menghapus PO Internal...', 'info', 2000);

    window.ERPAPI.request('delete_po_internal', { no_po: noPO }).then(res => {
        if (res.status === 'success') {
            showToast?.(`🗑️ ${noPO} berhasil dihapus.`, 'success', 3000);
            loadPOInternalData(true);
        } else {
            showToast?.(`❌ ${res.message}`, 'error', 4000);
            loadPOInternalData(true); // Revert
        }
    });
}

function openPODetail(noPO, allData) {
    const item = allData.find(d => d.no_po === noPO);
    if (!item) return;
    const items = item.items_parsed || [];
    document.getElementById('po-detail-title').textContent = `Detail: ${noPO}`;

    const totalEst = parseInt(item.total_estimasi || 0);
    let statusClass = 'badge-warning';
    if (item.status?.includes('Disetujui') || item.status?.includes('Selesai')) statusClass = 'badge-success';
    if (item.status === 'Ditolak') statusClass = 'badge-danger';

    const itemsHtml = items.map((it, i) => `
            <tr>
                <td style="padding:0.5rem;">${i + 1}</td>
                <td style="padding:0.5rem;">${it.kode || '-'}</td>
                <td style="padding:0.5rem; font-weight:500;">${it.nama}</td>
                <td style="padding:0.5rem; text-align:right;">${it.qty} ${it.satuan || 'pcs'}</td>
                <td style="padding:0.5rem; text-align:right;">Rp ${parseInt(it.harga || 0).toLocaleString('id-ID')}</td>
                <td style="padding:0.5rem; text-align:right; font-weight:600;">Rp ${(parseInt(it.qty || 0) * parseInt(it.harga || 0)).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

    document.getElementById('po-detail-content').innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; padding:1rem; background:rgba(255,255,255,0.04); border-radius:10px;">
                <div><div style="font-size:0.72rem; color:var(--text-muted);">PEMOHON</div><div style="font-weight:600;">${item.pemohon || '-'}</div></div>
                <div><div style="font-size:0.72rem; color:var(--text-muted);">TANGGAL</div><div style="font-weight:600;">${item.tanggal || '-'}</div></div>
                <div><div style="font-size:0.72rem; color:var(--text-muted);">STATUS</div><div><span class="badge ${statusClass}">${item.status}</span></div></div>
                ${item.disetujui_oleh ? `<div><div style="font-size:0.72rem; color:var(--text-muted);">DISETUJUI OLEH</div><div style="font-weight:600;">${item.disetujui_oleh} <span style="font-size:0.8rem;color:var(--text-muted);">(${item.tanggal_approve || ''})</span></div></div>` : ''}
                ${item.catatan ? `<div style="grid-column:1/-1;"><div style="font-size:0.72rem; color:var(--text-muted);">CATATAN</div><div>${item.catatan}</div></div>` : ''}
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.06);">
                        <th style="padding:0.5rem; text-align:left;">#</th>
                        <th style="padding:0.5rem; text-align:left;">Kode</th>
                        <th style="padding:0.5rem; text-align:left;">Nama Barang</th>
                        <th style="padding:0.5rem; text-align:right;">Qty</th>
                        <th style="padding:0.5rem; text-align:right;">Harga Satuan</th>
                        <th style="padding:0.5rem; text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                    <tr style="border-top:2px solid var(--primary);">
                        <td colspan="5" style="padding:0.75rem; text-align:right; color:var(--text-muted);">TOTAL ESTIMASI</td>
                        <td style="padding:0.75rem; text-align:right; font-size:1.1rem; font-weight:700; color:var(--primary);">Rp ${totalEst.toLocaleString('id-ID')}</td>
                    </tr>
                </tfoot>
            </table>
            <div style="text-align:right; margin-top:1.5rem;">
                <button class="btn" onclick="document.getElementById('po-detail-modal').classList.remove('active')" style="background:var(--bg-glass);">Tutup</button>
            </div>
        `;
    document.getElementById('po-detail-modal').classList.add('active');
}

async function updatePOStatusAction(noPO, status) {
    const isSelesai = status === 'Selesai (Barang Diterima)';
    const isTolak = status === 'Ditolak';
    const ok = await showConfirm({
        title: isSelesai ? '📦 Konfirmasi Terima Barang' : isTolak ? '❌ Tolak Pengajuan' : '✅ Approve Pengajuan',
        message: isSelesai
            ? `Konfirmasi <strong style="color:#fff">TERIMA BARANG</strong> untuk <strong style="color:#fff">${noPO}</strong>?<br><span style="font-size:0.82rem;color:rgba(255,255,255,0.4);">Semua item akan otomatis masuk ke stok gudang.</span>`
            : `Ubah status <strong style="color:#fff">${noPO}</strong> menjadi:<br><strong style="color:#fff">${status}</strong>?`,
        icon: isSelesai ? '📦' : isTolak ? '❌' : '✅',
        type: isSelesai ? 'info' : isTolak ? 'danger' : 'info',
        confirmText: isSelesai ? 'Ya, Terima Barang' : isTolak ? 'Ya, Tolak' : 'Ya, Approve'
    });
    if (!ok) return;

    const session = localStorage.getItem('erp_session');
    const user = session ? JSON.parse(session) : {};

    const btn = document.querySelector(`[data-no="${noPO}"].btn-approve-po, [data-no="${noPO}"].btn-selesai-po, [data-no="${noPO}"].btn-reject-po`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }

    const res = await window.ERPAPI.request('update_po_status', {
        no_po: noPO,
        status,
        user_nama: user.nama || user.username || 'System'
    });

    if (res.status === 'success') {
        showToast?.(`✅ ${res.message}`, 'success', 5000);
        loadPOInternalData();
    } else {
        showToast?.(`❌ ${res.message}`, 'error', 5000);
        if (btn) { btn.disabled = false; }
    }
}

// Modal handlers
const poModal = document.getElementById('po-modal');
const poForm = document.getElementById('po-form');
const poItemsTbody = document.getElementById('po-items-tbody');

function calculatePOTotal() {
    let total = 0;
    document.querySelectorAll('.po-item-row').forEach(row => {
        const harga = parseFloat(String(row.querySelector('.po-harga')?.value || '0').replace(/\./g, '').replace(',', '.')) || 0;
        const qty = parseFloat(row.querySelector('.po-qty')?.value || '0') || 0;
        const subtotal = harga * qty;
        total += subtotal;
        const subtotalEl = row.querySelector('.po-subtotal');
        if (subtotalEl) subtotalEl.textContent = 'Rp ' + Math.round(subtotal).toLocaleString('id-ID');
    });
    const totalDisplay = document.getElementById('po-total-display');
    if (totalDisplay) totalDisplay.textContent = 'Rp ' + Math.round(total).toLocaleString('id-ID');
}

function addPOItemRow(kode = '', nama = '', harga = '', qty = '1', satuan = 'pcs') {
    const tr = document.createElement('tr');
    tr.className = 'po-item-row';
    tr.innerHTML = `
            <td style="padding:0.4rem;">
                <input type="text" list="bom-bahan-baku-list" class="po-nama" placeholder="Cari / ketik nama barang..." value="${nama}"
                    style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem;">
            </td>
            <td style="padding:0.4rem;">
                <input type="text" class="po-kode" placeholder="Auto" value="${kode}"
                    style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem;">
            </td>
            <td style="padding:0.4rem;">
                <input type="text" class="po-harga number-format" placeholder="0" value="${harga}"
                    style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem; text-align:right;">
            </td>
            <td style="padding:0.4rem;">
                <input type="number" class="po-qty" value="${qty}" min="1" placeholder="1"
                    style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem; text-align:right;">
            </td>
            <td style="padding:0.4rem;">
                <input type="text" class="po-satuan" placeholder="pcs" value="${satuan}"
                    style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem;">
            </td>
            <td style="padding:0.4rem; text-align:right;">
                <span class="po-subtotal" style="font-weight:600; color:var(--primary); font-size:0.83rem;">Rp 0</span>
            </td>
            <td style="padding:0.4rem; text-align:center;">
                <button type="button" class="po-remove-item" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1rem; padding:0.25rem;" title="Hapus baris">✕</button>
            </td>
        `;

    // Auto-fill from stock datalist
    tr.querySelector('.po-nama').addEventListener('input', (e) => {
        const val = e.target.value;
        const match = poStockData.find(s => s.nama === val);
        if (match) {
            tr.querySelector('.po-kode').value = match.kode || '';
            const hargaFormatted = parseInt(match.harga || 0).toLocaleString('id-ID');
            tr.querySelector('.po-harga').value = hargaFormatted;
            if (match.satuan) tr.querySelector('.po-satuan').value = match.satuan;
        }
        calculatePOTotal();
    });
    tr.querySelector('.po-harga').addEventListener('input', calculatePOTotal);
    tr.querySelector('.po-qty').addEventListener('input', calculatePOTotal);
    tr.querySelector('.po-remove-item').addEventListener('click', () => {
        tr.remove();
        calculatePOTotal();
        if (document.querySelectorAll('.po-item-row').length === 0) addPOItemRow();
    });

    poItemsTbody.appendChild(tr);
    calculatePOTotal();
}

document.getElementById('btn-add-po-item')?.addEventListener('click', () => addPOItemRow());

document.getElementById('btn-add-po-internal')?.addEventListener('click', () => {
    poForm.reset();
    poItemsTbody.innerHTML = '';
    addPOItemRow();
    calculatePOTotal();

    // Fill header info
    const session = localStorage.getItem('erp_session');
    const user = session ? JSON.parse(session) : {};
    document.getElementById('po-info-pemohon').textContent = user.nama || user.username || '-';
    const now = new Date();
    document.getElementById('po-info-tanggal').textContent = now.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    poModal.classList.add('active');
});

document.getElementById('btn-close-po-modal')?.addEventListener('click', () => poModal.classList.remove('active'));
document.getElementById('btn-close-po-modal-footer')?.addEventListener('click', () => poModal.classList.remove('active'));
document.getElementById('btn-close-po-detail')?.addEventListener('click', () => document.getElementById('po-detail-modal').classList.remove('active'));

poForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const session = localStorage.getItem('erp_session');
    const user = session ? JSON.parse(session) : {};

    const items = [];
    let hasError = false;
    document.querySelectorAll('.po-item-row').forEach(row => {
        const nama = row.querySelector('.po-nama')?.value.trim();
        const kode = row.querySelector('.po-kode')?.value.trim();
        const harga = parseFloat(String(row.querySelector('.po-harga')?.value || '0').replace(/\./g, '').replace(',', '.')) || 0;
        const qty = parseFloat(row.querySelector('.po-qty')?.value) || 0;
        const satuan = row.querySelector('.po-satuan')?.value.trim() || 'pcs';

        if (!nama) { hasError = true; return; }
        if (qty <= 0) { hasError = true; return; }
        items.push({ kode, nama, harga, qty, satuan });
    });

    if (hasError || items.length === 0) {
        showToast?.('❌ Pastikan semua baris terisi nama barang dan qty > 0', 'error');
        return;
    }

    const payload = {
        pemohon: user.nama || user.username || 'System',
        po_to: document.getElementById('po_to')?.value || '',
        po_attn: document.getElementById('po_attn')?.value || '',
        po_enq_no: document.getElementById('po_enq_no')?.value || '',
        po_maker: document.getElementById('po_maker')?.value || '',
        po_delivery: document.getElementById('po_delivery')?.value || '',
        po_incoterm: document.getElementById('po_incoterm')?.value || '',
        po_payment_term: document.getElementById('po_payment_term')?.value || '',
        po_validity: document.getElementById('po_validity')?.value || '',
        items,
        catatan: document.getElementById('po_catatan')?.value || ''
    };

    const btnSubmit = poForm.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengajukan...';
        btnSubmit.disabled = true;
    }

    poModal.classList.remove('active');
    if (typeof showToast !== 'undefined') showToast('Sinkronisasi PO Internal ke server...', 'info', 3000);

    // Optimistic insert
    const tbody = document.getElementById('table-po-internal');
    if (tbody) {
        const tr = document.createElement('tr');
        tr.style.opacity = '0.6';
        tr.innerHTML = `
            <td><i class="fa-solid fa-spinner fa-spin"></i></td>
            <td>Hari ini</td>
            <td style="font-weight: 500;">${payload.pemohon}</td>
            <td>${payload.po_to}</td>
            <td>${items.length}</td>
            <td><span class="badge badge-warning">Menyimpan...</span></td>
            <td></td>
        `;
        tbody.insertBefore(tr, tbody.firstChild);
    }

    window.ERPAPI.request('create_po_internal', payload).then(res => {
        if (btnSubmit) {
            btnSubmit.innerHTML = 'Kirim Pengajuan PO Internal';
            btnSubmit.disabled = false;
        }

        if (res.status === 'success') {
            showToast?.(`✅ ${res.message}`, 'success', 4000);
            loadPOInternalData(true);
        } else {
            showToast?.(`❌ ${res.message}`, 'error', 5000);
            loadPOInternalData(true);
        }
    });
});



// Flow: Inventori Barang Jadi
async function loadBarangJadiData(isBackgroundSync = false) {
    const tbody = document.getElementById('table-barang-jadi');
    if (!tbody) return;
    if (!isBackgroundSync) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    }

    const response = await window.ERPAPI.request('get_barang_jadi');
    if (response.status === 'success' && response.data) {
        tbody.innerHTML = '';
        if (response.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada data barang jadi.</td></tr>';
            return;
        }

        const session = localStorage.getItem('erp_session');
        const user = session ? JSON.parse(session) : {};
        const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));

        response.data.forEach(item => {
            const tr = document.createElement('tr');
            const isKritis = parseInt(item.stok) < 5;
            
            let actionBtns = '';
            if (isAdmin) {
                actionBtns = `<button class="btn btn-delete-barang-jadi" data-kode="${item.kode_barang || item.kode}" data-nama="${item.nama_barang || item.nama}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--danger);"><i class="fa-solid fa-trash"></i></button>`;
            } else {
                actionBtns = '-';
            }

            tr.innerHTML = `
                    <td style="font-weight: 500;">${item.kode_barang || item.kode || '-'}</td>
                    <td>${item.nama_barang || item.nama || '-'}</td>
                    <td>
                        <span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')}</span>
                    </td>
                    <td>Rp ${parseInt(item.harga_jual || 0).toLocaleString('id-ID')}</td>
                    <td>${item.lokasi_gudang || item.lokasi || '-'}</td>
                    <td>${actionBtns}</td>
                `;
                tr.style.cursor = 'pointer';
                tr.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', e => e.stopPropagation());
                });
                tr.addEventListener('click', () => {
                    openBarangJadiDetail(item);
                });
                tbody.appendChild(tr);

            if (isAdmin) {
                const btnDel = tr.querySelector('.btn-delete-barang-jadi');
                if (btnDel) {
                    btnDel.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const kode = btnDel.getAttribute('data-kode');
                        const nama = btnDel.getAttribute('data-nama');
                        const ok = await showConfirm({
                            title: 'Hapus Barang Jadi',
                            message: `Yakin ingin menghapus Barang Jadi <strong>${nama} (${kode})</strong>?`,
                            icon: '🗑️', confirmText: 'Ya, Hapus', cancelText: 'Batal'
                        });
                        if (!ok) return;
                        
                        tr.style.display = 'none';
                        if (typeof showToast !== 'undefined') showToast('Menghapus Barang Jadi...', 'info');
                        window.ERPAPI.request('delete_barang_jadi', { kode: kode }).then(res => {
                            if (res.status === 'success') {
                                if (typeof showToast !== 'undefined') showToast(`✅ ${nama} dihapus`, 'success');
                                loadBarangJadiData(true);
                            } else {
                                if (typeof showToast !== 'undefined') showToast('❌ Gagal menghapus Barang Jadi', 'error');
                                loadBarangJadiData(true);
                            }
                        });
                    });
                }
            }
        });
    }
}

// Flow 1: Penawaran
async function loadPenawaranData(isBackgroundSync = false) {
    // Fetch BOM and Stock for datalist
    const [bomRes, stockRes] = await Promise.all([
        window.ERPAPI.request('get_bom'),
        window.ERPAPI.request('get_stock')
    ]);

    const list = document.getElementById('bom-items-list');
    if (list) {
        list.innerHTML = '';
        if (bomRes.status === 'success' && bomRes.data) {
            bomRes.data.forEach(b => {
                const option = document.createElement('option');
                option.value = b.nama_barang;
                option.setAttribute('data-harga', b.total_biaya || 0);
                list.appendChild(option);
            });
        }
    }

    const tbody = document.getElementById('table-penawaran');
    if (!tbody) return;
    
    if (!isBackgroundSync) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    }

    const response = await window.ERPAPI.request('get_penawaran');
    const custRes = await window.ERPAPI.request('get_customers');
    
    if (response.status === 'success' && response.data) {
        const customerSelect = document.getElementById('p_customer');
        if (customerSelect) {
            // Store selected value if any
            const prevValue = customerSelect.tomselect ? customerSelect.tomselect.getValue() : customerSelect.value;
            
            if (customerSelect.tomselect) {
                customerSelect.tomselect.destroy();
            }
            
            customerSelect.innerHTML = '<option value="">Pilih atau ketik nama Customer...</option>';
            
            let customers = [];
            if (custRes.status === 'success' && custRes.data) {
                customers = custRes.data.map(c => c.nama_customer);
            } else {
                customers = [...new Set(response.data.map(item => item.customer).filter(Boolean))];
            }
            
            customers.forEach(cust => {
                const option = document.createElement('option');
                option.value = cust;
                option.textContent = cust;
                customerSelect.appendChild(option);
            });
            
            new TomSelect('#p_customer', {
                create: true,
                sortField: {
                    field: 'text',
                    direction: 'asc'
                },
                maxOptions: 50
            });
            
            if (prevValue && customerSelect.tomselect) {
                customerSelect.tomselect.addOption({value: prevValue, text: prevValue});
                customerSelect.tomselect.setValue(prevValue);
            }
        }

        tbody.innerHTML = '';
        if (response.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Belum ada data penawaran.</td></tr>';
            return;
        }
        response.data.forEach(item => {
            let badgeClass = 'badge-warning';
            if (item.status === 'Approved' || item.status === 'Finish') badgeClass = 'badge-success';
            else if (item.status === 'Rejected') badgeClass = 'badge-danger';
            else if (item.status === 'Proses') badgeClass = 'badge-info';

            const session = localStorage.getItem('erp_session');
            const user = session ? JSON.parse(session) : {};
            const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));

            let actionBtns = `<button class="btn btn-print-penawaran" data-item='${JSON.stringify(item)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--info);" title="Print / Ekspor PDF"><i class="fa-solid fa-print"></i></button>
                              <button class="btn btn-edit-penawaran" data-item='${JSON.stringify(item)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>`;
            
            if (isAdmin) {
                actionBtns += `<button class="btn btn-delete-penawaran" data-no="${item.no_penawaran}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-trash"></i></button>`;
            }
            
            let has_shortage = false;
            let shortage_items = [];

            if (item.status === 'Approved') {
                try {
                    let rincianItem = [];
                    if (typeof item.rincian_item === 'string') {
                        rincianItem = JSON.parse(item.rincian_item || '[]');
                    } else if (Array.isArray(item.rincian_item)) {
                        rincianItem = item.rincian_item;
                    }

                    let requiredMaterials = {};

                    // Calculate total raw materials required
                    rincianItem.forEach(rj => {
                        const namaProduk = (rj.nama_barang || '').trim().toLowerCase();
                        const qtyProduk = parseFloat(rj.qty) || 0;
                        
                        // Find BOM for this product
                        if (bomRes && bomRes.data) {
                            const bom = bomRes.data.find(b => (b.nama_barang || '').trim().toLowerCase() === namaProduk);
                            if (bom) {
                                let rincianMaterial = [];
                                if (typeof bom.rincian_material === 'string') {
                                    try { rincianMaterial = JSON.parse(bom.rincian_material || '[]'); } catch(e) {}
                                } else if (Array.isArray(bom.rincian_material)) {
                                    rincianMaterial = bom.rincian_material;
                                }

                                rincianMaterial.forEach(mat => {
                                    const namaMat = (mat.nama || '').trim();
                                    if (namaMat) {
                                        const qtyMat = parseFloat(mat.qty) || 0;
                                        requiredMaterials[namaMat] = (requiredMaterials[namaMat] || 0) + (qtyMat * qtyProduk);
                                    }
                                });
                            }
                        }
                    });

                    // Compare with current stock
                    if (stockRes && stockRes.data) {
                        for (const [namaMat, reqQty] of Object.entries(requiredMaterials)) {
                            // Find stock for this material
                            const stockItem = stockRes.data.find(s => (s.nama_material || '').trim().toLowerCase() === namaMat.toLowerCase());
                            const currentStock = stockItem ? (parseFloat(String(stockItem.stok).replace(/[^0-9.-]+/g,"")) || 0) : 0;
                            
                            if (reqQty > currentStock) {
                                has_shortage = true;
                                shortage_items.push({
                                    nama: stockItem ? stockItem.nama_material : namaMat,
                                    kode: stockItem ? stockItem.kode_material : ('RM' + Math.floor(Math.random()*10000)),
                                    qty: reqQty - currentStock,
                                    satuan: 'pcs',
                                    harga: stockItem ? stockItem.harga_satuan : 0
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error calculating shortages:', e);
                }
            }

            if (item.status === 'Approved') {
                actionBtns += `<button class="btn btn-spk-penawaran" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--warning);" title="Lanjut ke SPK Produksi"><i class="fa-solid fa-industry"></i></button>`;
                if (has_shortage) {
                    const shortageStr = JSON.stringify(shortage_items).replace(/'/g, "&#39;");
                    actionBtns += `<button class="btn btn-po-penawaran" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}' data-shortage='${shortageStr}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--warning);" title="Buat Permintaan Barang (PO Internal) untuk Komponen Kurang"><i class="fa-solid fa-cart-shopping"></i></button>`;
                }
            }

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                    <td>${item.no_penawaran || '-'}</td>
                    <td>${item.tanggal || '-'}</td>
                    <td style="font-weight: 500;">${item.customer}</td>
                    <td>${item.narasi || '-'}</td>
                    <td>Rp ${ (parseInt(String(item.total_harga || '0').replace(/\D/g, '')) || 0).toLocaleString('id-ID') }</td>
                    <td>Rp ${ (parseInt(String(item.down_payment || item.dp || '0').replace(/\D/g, '')) || 0).toLocaleString('id-ID') }</td>
                    <td><span class="badge ${badgeClass}">${item.status || 'Penawaran'}</span></td>
                    <td style="white-space: nowrap;">${actionBtns}</td>
                `;
            
            // Prevent row click when clicking buttons
            tr.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', e => e.stopPropagation());
            });

            // Open detail on row click
            tr.addEventListener('click', () => {
                openDetailPenawaran(item);
            });

            tbody.appendChild(tr);
        });

        // Bind edit and delete buttons
        document.querySelectorAll('.btn-edit-penawaran').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                document.getElementById('penawaran-modal-title').textContent = 'Edit Penawaran';
                document.getElementById('p_no_penawaran').value = item.no_penawaran;
                const custSelect = document.getElementById('p_customer');
                if (custSelect && custSelect.tomselect) {
                    custSelect.tomselect.addOption({value: item.customer, text: item.customer});
                    custSelect.tomselect.setValue(item.customer);
                } else if (custSelect) {
                    custSelect.value = item.customer;
                }
                document.getElementById('p_total_harga_display').textContent = (parseInt(String(item.total_harga || '0').replace(/[^0-9]/g, '')) || 0).toLocaleString('id-ID');
                document.getElementById('p_dp').value = formatRibuan(parseInt(String(item.down_payment || item.dp || '0').replace(/[^0-9]/g, '')) || 0);
                document.getElementById('p_narasi').value = item.narasi || '';
                document.getElementById('p_status').value = item.status || 'Penawaran';
                
                let info = {};
                try {
                    info = typeof item.info_tambahan === 'string' ? JSON.parse(item.info_tambahan) : (item.info_tambahan || {});
                } catch (e) {}

                document.getElementById('p_attn').value = info.attn || '';
                document.getElementById('p_enq_no').value = info.enq_no || '';
                document.getElementById('p_rev_date').value = info.rev_date || '';
                document.getElementById('p_maker').value = info.maker || '';
                document.getElementById('p_delivery').value = info.delivery || '';
                document.getElementById('p_incoterm').value = info.incoterm || '';
                document.getElementById('p_payment').value = info.payment || '';
                document.getElementById('p_validity').value = info.validity || '';

                pItemsContainer.innerHTML = '';
                let items = [];
                try {
                    let parsed = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : item.rincian_item;
                    if (Array.isArray(parsed)) items = parsed;
                } catch (e) { }

                if (!items || items.length === 0) addPenawaranItemRow();
                else items.forEach(it => addPenawaranItemRow({
                    part_number: it.part_number || '',
                    part_name: it.part_name || it.nama || '',
                    moq_pcs: it.moq_pcs || it.qty || 1,
                    price_usd: it.price_usd || '',
                    price_idr: it.price_idr || it.harga || 0
                }));

                penawaranModal.classList.add('active');
            });
        });

        document.querySelectorAll('.btn-delete-penawaran').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const no_penawaran = e.currentTarget.getAttribute('data-no');
                const ok = await showConfirm({
                    title: 'Hapus Penawaran',
                    message: `Yakin ingin menghapus penawaran <strong style="color:#fff">${no_penawaran}</strong>?<br><span style="font-size:0.82rem;color:rgba(255,255,255,0.4);">Data akan dihapus permanen.</span>`,
                    icon: '📄',
                    confirmText: 'Ya, Hapus',
                    cancelText: 'Batal'
                });
                
                if (ok) {
                    // Optimistic Delete
                    const tr = e.currentTarget.closest('tr');
                    if (tr) tr.style.display = 'none'; // Hide immediately
                    if (typeof showToast !== 'undefined') showToast('Menghapus penawaran di background...', 'info', 2000);

                    // Run async background sync without await blocking
                    window.ERPAPI.request('delete_penawaran', { no_penawaran }).then(res => {
                        if (res.status === 'success') {
                            if (typeof showToast !== 'undefined') showToast('✅ Penawaran berhasil dihapus', 'success', 2000);
                            loadPenawaranData(true);
                        } else {
                            alert('Gagal hapus: ' + res.message);
                            loadPenawaranData(true); // Revert table to show the row again
                        }
                    });
                }
            });
        });

        // Bind SPK
        document.querySelectorAll('.btn-spk-penawaran').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                document.getElementById('produksi-form').reset();
                const selectKode = document.getElementById('spk_kode_jadi');
                
                if (cachedBOMData.length === 0 || cachedInventoryData.length === 0) {
                    if (selectKode) selectKode.innerHTML = '<option value="" disabled selected>Memuat data BOM...</option>';
                    const [resBom, resInv] = await Promise.all([
                        window.ERPAPI.request('get_bom'),
                        window.ERPAPI.request('get_inventory')
                    ]);
                    if (resInv.status === 'success' && resInv.data) cachedInventoryData = resInv.data;
                    if (resBom.status === 'success' && resBom.data) {
                        cachedBOMData = resBom.data;
                        if (selectKode) {
                            selectKode.innerHTML = '<option value="" disabled selected>-- Pilih Barang Jadi --</option>';
                            resBom.data.forEach(bom => {
                                const opt = document.createElement('option');
                                opt.value = bom.kode_barang;
                                opt.textContent = `${bom.kode_barang} - ${bom.nama_barang}`;
                                selectKode.appendChild(opt);
                            });
                        }
                    }
                }
                
                let partNames = '';
                try {
                    const rincian = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : item.rincian_item;
                    if(Array.isArray(rincian)) partNames = rincian.map(x => x.part_name || x.nama || '').filter(Boolean).join(', ');
                } catch(err){}
                
                if(selectKode) {
                    if (selectKode.tomselect) {
                        selectKode.tomselect.destroy();
                    }
                    
                    let matchedBom = cachedBOMData.find(b => String(b.nama_barang).trim().toLowerCase() === String(partNames).trim().toLowerCase());
                    if (matchedBom) {
                        selectKode.value = matchedBom.kode_barang;
                    } else {
                        let existingCustom = Array.from(selectKode.options).find(o => o.value === 'Custom');
                        if (!existingCustom) {
                            const option = document.createElement('option');
                            option.value = 'Custom';
                            option.text = partNames || 'Dari Penawaran ' + item.no_penawaran;
                            selectKode.add(option);
                        } else {
                            existingCustom.text = partNames || 'Dari Penawaran ' + item.no_penawaran;
                        }
                        selectKode.value = 'Custom';
                    }
                    
                    new TomSelect('#spk_kode_jadi', {
                        create: true,
                        sortField: {
                            field: 'text',
                            direction: 'asc'
                        },
                        maxOptions: 50
                    });
                }
                
                const qtyInput = document.getElementById('spk_qty_jadi');
                if(qtyInput) qtyInput.value = '1';
                
                // Trigger calculation explicitly after setting values
                if (typeof calculateSPKEstimasi === 'function') {
                    calculateSPKEstimasi();
                }
                
                const pemintaInput = document.getElementById('spk_peminta');
                if(pemintaInput) pemintaInput.value = item.customer;

                populateKruGudangDropdown();
                document.getElementById('produksi-modal-title').textContent = 'SPK Produksi (Referensi Penawaran: ' + item.no_penawaran + ')';
                document.getElementById('produksi-modal').classList.add('active');
            });
        });

        // Bind PO Internal
        document.querySelectorAll('.btn-po-penawaran').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                const shortageStr = e.currentTarget.getAttribute('data-shortage');
                const shortageItems = shortageStr ? JSON.parse(shortageStr) : [];

                const poFormEl = document.getElementById('po-form');
                if(poFormEl) poFormEl.reset();
                const poItemsTbodyEl = document.getElementById('po-items-tbody');
                if(poItemsTbodyEl) poItemsTbodyEl.innerHTML = '';
                
                if (shortageItems && shortageItems.length > 0) {
                    shortageItems.forEach(short => {
                        addPOItemRow(short.kode, short.nama, short.harga, short.qty, short.satuan);
                    });
                } else {
                    addPOItemRow();
                }
                
                calculatePOTotal();

                const session = localStorage.getItem('erp_session');
                const user = session ? JSON.parse(session) : {};
                const pemohonEl = document.getElementById('po-info-pemohon');
                if(pemohonEl) pemohonEl.textContent = user.nama || user.username || '-';
                
                const tanggalEl = document.getElementById('po-info-tanggal');
                if(tanggalEl) {
                    const now = new Date();
                    tanggalEl.textContent = now.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                }

                const catEl = document.getElementById('po_catatan');
                if(catEl) catEl.value = `Permintaan Barang Mentah (Komponen Kurang) untuk Penawaran: ${item.no_penawaran} - ${item.customer}`;

                document.getElementById('po-modal').classList.add('active');
            });
        });

        // Bind Print
        document.querySelectorAll('.btn-print-penawaran').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = JSON.parse(e.currentTarget.getAttribute('data-item'));

                let info = {};
                try {
                    info = typeof item.info_tambahan === 'string' ? JSON.parse(item.info_tambahan) : (item.info_tambahan || {});
                } catch (e) {}

                // Header settings
                document.getElementById('print_company_name').textContent = cachedSettings['NAMA_PERUSAHAAN'] || 'NAMA PERUSAHAAN';
                document.getElementById('print_company_address').textContent = cachedSettings['ALAMAT'] || 'Alamat Perusahaan';
                document.getElementById('print_company_phone').textContent = cachedSettings['NO_TELP'] || 'No. Telp';

                document.getElementById('print_no').textContent = item.no_penawaran;
                document.getElementById('print_tanggal').textContent = item.tanggal ? new Date(item.tanggal).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-') : '-';
                document.getElementById('print_to_customer').textContent = item.customer;
                
                // Get customer address if available from DB Customer
                let custAddress = '-';
                if (window.ERPAPI.getCached('get_customers')) {
                    const custData = window.ERPAPI.getCached('get_customers').data;
                    const cMatch = custData.find(c => String(c.nama).toLowerCase() === String(item.customer).toLowerCase());
                    if (cMatch) custAddress = cMatch.alamat || '-';
                }
                document.getElementById('print_to_address').textContent = custAddress;

                document.getElementById('print_to_attn').textContent = info.attn || '-';
                document.getElementById('print_enq_no').textContent = info.enq_no || '-';
                document.getElementById('print_rev_date').textContent = info.rev_date || '-';
                document.getElementById('print_maker').textContent = info.maker || '-';
                document.getElementById('print_delivery').textContent = info.delivery || '-';
                document.getElementById('print_incoterm').textContent = info.incoterm || '-';
                document.getElementById('print_payment').textContent = info.payment || '-';
                document.getElementById('print_validity').textContent = info.validity || '-';

                // Items mapping
                let items = [];
                try {
                    items = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : (item.rincian_item || []);
                } catch (ex) { }

                const tbody = document.getElementById('print-items-tbody');
                tbody.innerHTML = '';

                if (items.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" style="border: 1px solid #000; padding: 8px; text-align: center;">Penawaran Harga / Kesepakatan Khusus</td></tr>`;
                } else {
                    items.forEach((it, idx) => {
                        const partNumber = it.part_number || '';
                        const partName = it.part_name || it.nama || '';
                        const moq = it.moq_pcs || it.qty || 1;
                        const pUsd = it.price_usd ? it.price_usd : '';
                        const pIdr = it.price_idr || it.harga || 0;

                        tbody.innerHTML += `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${idx + 1}</td>
                                    <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">${partNumber}</td>
                                    <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">${partName}</td>
                                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${moq}</td>
                                    <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">${pUsd ? 'USD ' + parseInt(pUsd).toLocaleString('en-US') : ''}</td>
                                    <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">IDR ${parseInt(pIdr).toLocaleString('id-ID')}</td>
                                </tr>
                            `;
                    });
                }

                document.getElementById('print_narasi').textContent = item.narasi || '';
                document.getElementById('print_ttd_company').textContent = cachedSettings['NAMA_PERUSAHAAN'] || 'PT Orion Karya Sejahtera';
                document.getElementById('print_ttd_customer').textContent = item.customer;

                window.print();
            });
        });

        // Bind Pay
        document.querySelectorAll('.btn-pay-penawaran').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                document.getElementById('payment-form').reset();
                document.getElementById('pay_ref').value = item.no_penawaran;
                document.getElementById('pay_customer').value = item.customer;
                document.getElementById('pay_total').value = item.total_harga;
                document.getElementById('pay_ref_display').textContent = item.no_penawaran + ' - ' + item.customer;
                document.getElementById('payment-modal').classList.add('active');
            });
        });
    }
}
// --- Flow 1: Penawaran & Sales ---
const penawaranModal = document.getElementById('penawaran-modal');
const penawaranForm = document.getElementById('penawaran-form');
const pItemsContainer = document.getElementById('p-items-container');
let cachedSettings = {};

async function loadSettingsData() {
    const res = await window.ERPAPI.request('get_settings');
    if (res.status === 'success') {
        cachedSettings = res.data;
        document.getElementById('set_nama').value = cachedSettings['NAMA_PERUSAHAAN'] || '';
        document.getElementById('set_alamat').value = cachedSettings['ALAMAT'] || '';
        document.getElementById('set_telepon').value = cachedSettings['NO_TELP'] || '';
    }
}

document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        'NAMA_PERUSAHAAN': document.getElementById('set_nama').value,
        'ALAMAT': document.getElementById('set_alamat').value,
        'NO_TELP': document.getElementById('set_telepon').value
    };
    const res = await window.ERPAPI.request('save_settings', payload);
    alert(res.message);
    if (res.status === 'success') loadSettingsData();
});

function calculatePenawaranTotal() {
    let total = 0;
    pItemsContainer.querySelectorAll('.p-item-row').forEach(row => {
        const qty = parseInt(String(row.querySelector('.pi-moq').value).replace(/\D/g, '')) || 0;
        const harga = parseInt(String(row.querySelector('.pi-idr').value).replace(/\D/g, '')) || 0;
        const subtotal = qty * harga;
        // if pi-subtotal exists, update it. For new layout, we don't display subtotal per row to save space.
        const subEl = row.querySelector('.pi-subtotal');
        if (subEl) subEl.textContent = subtotal.toLocaleString('id-ID');
        total += subtotal;
    });
    document.getElementById('p_total_harga').value = total;
    document.getElementById('p_total_harga_display').textContent = total.toLocaleString('id-ID');
}

function addPenawaranItemRow(itemData = {}) {
    const pName = itemData.part_name || '';
    const pMoq = itemData.moq_pcs || 1;
    const pIdr = itemData.price_idr || 0;

    const div = document.createElement('div');
    div.className = 'p-item-row';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '3fr 1fr 2fr auto';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.style.alignItems = 'center';

    const list = document.getElementById('bom-items-list');
    let optionsHtml = '<option value="">Pilih Produk / Item</option>';
    let found = false;
    if (list) {
        Array.from(list.options).forEach(opt => {
            const isSelected = opt.value === pName;
            if (isSelected) found = true;
            optionsHtml += `<option value="${opt.value}" data-harga="${opt.getAttribute('data-harga') || 0}" ${isSelected ? 'selected' : ''}>${opt.value}</option>`;
        });
    }
    if (pName && !found) {
        optionsHtml += `<option value="${pName}" selected>${pName}</option>`;
    }

    div.innerHTML = `
            <select class="pi-part-name" required style="padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
                ${optionsHtml}
            </select>
            <input type="text" class="pi-moq number-format" placeholder="Qty (PCS)" value="${pMoq ? formatRibuan(pMoq) : ''}" required style="padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="pi-idr number-format" placeholder="Harga (Rp)" value="${pIdr ? formatRibuan(pIdr) : ''}" required style="padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <button type="button" class="btn btn-remove-p-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;
    div.querySelector('.btn-remove-p-row').addEventListener('click', () => {
        div.remove();
        calculatePenawaranTotal();
    });

    div.querySelector('.pi-moq').addEventListener('input', calculatePenawaranTotal);
    div.querySelector('.pi-idr').addEventListener('input', calculatePenawaranTotal);

    const inputName = div.querySelector('.pi-part-name');
    inputName.addEventListener('change', (e) => {
        const selectedOpt = inputName.options[inputName.selectedIndex];
        if (selectedOpt && selectedOpt.getAttribute('data-harga')) {
            const hg = parseInt(selectedOpt.getAttribute('data-harga')) || 0;
            div.querySelector('.pi-idr').value = formatRibuan(hg);
            calculatePenawaranTotal();
        }
    });
    
    // Initialize Tom Select
    new TomSelect(inputName, {
        create: true,
        sortField: {
            field: 'text',
            direction: 'asc'
        },
        maxOptions: 50,
        onChange: function(value) {
            const selectedOpt = this.options[value];
            // Using dataset or matching from original datalist logic
            const listOpt = Array.from(document.getElementById('bom-items-list')?.options || []).find(o => o.value === value);
            if (listOpt && listOpt.getAttribute('data-harga')) {
                const hg = parseInt(listOpt.getAttribute('data-harga')) || 0;
                div.querySelector('.pi-idr').value = formatRibuan(hg);
                calculatePenawaranTotal();
            }
        }
    });

    pItemsContainer.appendChild(div);
    calculatePenawaranTotal();
}

document.getElementById('btn-add-p-item')?.addEventListener('click', () => addPenawaranItemRow());

document.getElementById('btn-add-penawaran')?.addEventListener('click', () => {
    document.getElementById('penawaran-form').reset();
    document.getElementById('penawaran-modal-title').textContent = 'Buat Penawaran Baru';
    document.getElementById('p_no_penawaran').value = '';
    
    // Set default date to today
    const pRevDate = document.getElementById('p_rev_date');
    if (pRevDate) pRevDate.value = new Date().toISOString().split('T')[0];
    
    pItemsContainer.innerHTML = '';
    addPenawaranItemRow();
    penawaranModal.classList.add('active');
});

document.getElementById('btn-close-penawaran')?.addEventListener('click', () => {
    penawaranModal.classList.remove('active');
});

penawaranForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const items = [];
    pItemsContainer.querySelectorAll('.p-item-row').forEach(row => {
        const part_number = '';
        const part_name = row.querySelector('.pi-part-name').value;
        const moq_pcs = parseInt(String(row.querySelector('.pi-moq').value).replace(/\D/g, '')) || 0;
        const price_usd = 0;
        const price_idr = parseInt(String(row.querySelector('.pi-idr').value).replace(/\D/g, '')) || 0;
        if (part_name) items.push({ part_number, part_name, moq_pcs, price_usd, price_idr });
    });

    const payload = {
        no_penawaran: document.getElementById('p_no_penawaran').value,
        customer: document.getElementById('p_customer').value,
        total_harga: parseInt(String(document.getElementById('p_total_harga').value).replace(/\D/g, '')) || 0,
        rincian_item: items,
        narasi: document.getElementById('p_narasi').value,
        dp: parseInt(String(document.getElementById('p_dp').value).replace(/\D/g, '')) || 0,
        status: document.getElementById('p_status').value,
        info_tambahan: {
            attn: document.getElementById('p_attn').value,
            enq_no: document.getElementById('p_enq_no').value,
            rev_date: document.getElementById('p_rev_date').value,
            maker: document.getElementById('p_maker').value,
            delivery: document.getElementById('p_delivery').value,
            incoterm: document.getElementById('p_incoterm').value,
            payment: document.getElementById('p_payment').value,
            validity: document.getElementById('p_validity').value
        }
    };

    const isEdit = !!payload.no_penawaran;
    
    // Close modal instantly for optimistic UI
    penawaranModal.classList.remove('active');
    if (typeof showToast !== 'undefined') showToast('Sinkronisasi data ke server di background...', 'info', 3000);

    const tbody = document.getElementById('table-penawaran');
    if (tbody) {
        if (!isEdit) {
            // Optimistic Add
            const tr = document.createElement('tr');
            tr.style.opacity = '0.6';
            tr.innerHTML = `
                <td><i class="fa-solid fa-spinner fa-spin"></i></td>
                <td>Hari ini</td>
                <td style="font-weight: 500;">${payload.customer}</td>
                <td>${payload.narasi || '-'}</td>
                <td>Rp ${payload.total_harga.toLocaleString('id-ID')}</td>
                <td>Rp ${payload.dp.toLocaleString('id-ID')}</td>
                <td><span class="badge badge-warning">Menyimpan...</span></td>
                <td></td>
            `;
            tbody.insertBefore(tr, tbody.firstChild);
        } else {
            // Optimistic Edit
            const rows = tbody.querySelectorAll('.btn-delete-penawaran');
            const targetRow = Array.from(rows).find(btn => btn.getAttribute('data-no') === payload.no_penawaran)?.closest('tr');
            if (targetRow) {
                targetRow.style.opacity = '0.5';
                const cells = targetRow.querySelectorAll('td');
                if (cells.length > 6) {
                    cells[2].textContent = payload.customer;
                    cells[4].textContent = 'Rp ' + payload.total_harga.toLocaleString('id-ID');
                    cells[6].innerHTML = '<span class="badge badge-warning">Mengubah...</span>';
                }
            }
        }
    }

    const btnSubmit = penawaranForm.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;
    }

    // Run async background sync without await blocking
    window.ERPAPI.request('save_penawaran', payload).then(res => {
        if (btnSubmit) {
            btnSubmit.innerHTML = 'Simpan';
            btnSubmit.disabled = false;
        }
        
        if (res.status === 'success') {
            if (typeof showToast !== 'undefined') showToast('✅ Data berhasil tersinkronisasi!', 'success', 3000);
            loadPenawaranData(true); // Background reload
        } else {
            alert('Gagal sinkronisasi: ' + res.message);
            loadPenawaranData(true); // Revert table
        }
    });
});

const paymentModal = document.getElementById('payment-modal');
const paymentForm = document.getElementById('payment-form');
document.getElementById('btn-close-payment')?.addEventListener('click', () => {
    paymentModal.classList.remove('active');
});

paymentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        customer: document.getElementById('pay_customer').value,
        ref_surat_jalan: document.getElementById('pay_ref').value,
        total_harga: parseInt(String(document.getElementById('pay_total').value).replace(/\D/g, '')) || 0,
        dp: parseInt(String(document.getElementById('pay_nominal').value).replace(/\D/g, '')) || 0
    };

    const btnSubmit = paymentForm.querySelector('button[type="submit"]');
    const oldHtml = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btnSubmit.disabled = true;

    const res = await window.ERPAPI.request('save_invoice', payload);

    btnSubmit.innerHTML = oldHtml;
    btnSubmit.disabled = false;

    if (res.status === 'success') {
        paymentModal.classList.remove('active');
        alert(res.message);
        loadPenawaranData(); // Reload table
    } else {
        alert(res.message);
    }
});

// Flow 2: GRN
document.getElementById('btn-grn')?.addEventListener('click', async () => {
    const kode = prompt("Masukkan Kode Material yang diterima (contoh: RM001):");
    const qty = prompt("Masukkan Qty yang diterima:");
    if (kode && qty) {
        const res = await window.ERPAPI.request('receive_grn', { no_po: 'PO-Dummy', kode_material: kode, qty: qty });
        alert(res.message);
        if (res.status === 'success') loadPurchasingData();
    }
});

// --- BOM & PMO Sampel Logic ---
async function loadBOMData(isBackgroundSync = false) {
    const tbody = document.getElementById('table-bom');
    if (!tbody) return;
    if (!isBackgroundSync) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    }

    const render = (response) => {
        if (response.status === 'success') {
            tbody.innerHTML = '';
            if (!response.data || response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada data BOM.</td></tr>';
                return;
            }

            const session = localStorage.getItem('erp_session');
            const user = session ? JSON.parse(session) : {};
            const canEdit = ['Admin', 'Management', 'Produksi', 'Super', 'Super Admin'].some(r => (user.role || '').includes(r));

            const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));

            response.data.forEach((item, itemIdx) => {
                const tr = document.createElement('tr');

                let b = item;
                let gambarUrl = b.gambar || '';

                // Auto-convert old Drive export=download URLs to thumbnail format
                if (gambarUrl.includes('drive.google.com/uc') && gambarUrl.includes('export=download')) {
                    const match = gambarUrl.match(/id=([^&]+)/);
                    if (match && match[1]) {
                        gambarUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
                    }
                }

                let imgHtml;
                if (gambarUrl && String(gambarUrl).trim() !== '') {
                    imgHtml = `<a href="javascript:void(0)" onclick="openLightbox('${gambarUrl}', '${b.nama_barang || ''}')" title="Klik untuk memperbesar"><img src="${gambarUrl}" alt="${b.nama_barang || ''}" style="max-width:50px;max-height:50px;border-radius:5px;object-fit:cover;cursor:pointer;" onerror="console.error('[BOM TABLE IMG ERROR] Gambar gagal dimuat'); this.onerror=null;this.outerHTML='<span style=\\'color:gray;font-size:0.75rem;\\'>Gagal load</span>';"></a>`;
                } else {
                    imgHtml = '<span style="color:var(--text-muted);font-size:0.8rem;">Tidak ada</span>';
                }

                let actionBtns = `<button class="btn btn-detail-bom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--accent);"><i class="fa-solid fa-eye"></i> Detail</button>`;
                if (canEdit) {
                    actionBtns += `<button class="btn btn-edit-bom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>`;
                }
                if (isAdmin) {
                    actionBtns += `<button class="btn btn-delete-bom" data-kode="${item.kode_barang}" data-nama="${item.nama_barang}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--danger);"><i class="fa-solid fa-trash"></i></button>`;
                }

                tr.innerHTML = `
                        <td style="font-weight: 500;">${item.kode_barang}</td>
                        <td>${item.nama_barang}</td>
                        <td>${imgHtml}</td>
                        <td>Rp ${parseInt(item.total_biaya || 0).toLocaleString('id-ID')}</td>
                        <td>${actionBtns}</td>
                    `;
                tbody.appendChild(tr);

                tr.querySelector('.btn-detail-bom').addEventListener('click', () => openBOMDetail(item));
                if (canEdit) {
                    tr.querySelector('.btn-edit-bom').addEventListener('click', () => openBOMEdit(item));
                }
                if (isAdmin) {
                    const btnDel = tr.querySelector('.btn-delete-bom');
                    btnDel.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const kode = btnDel.getAttribute('data-kode');
                        const nama = btnDel.getAttribute('data-nama');
                        const ok = await showConfirm({
                            title: 'Hapus BOM',
                            message: `Yakin ingin menghapus BOM <strong>${nama} (${kode})</strong>?`,
                            icon: '🗑️', confirmText: 'Ya, Hapus', cancelText: 'Batal'
                        });
                        if (!ok) return;
                        
                        tr.style.display = 'none';
                        if (typeof showToast !== 'undefined') showToast('Menghapus BOM...', 'info');
                        window.ERPAPI.request('delete_bom', { kode_barang: kode }).then(res => {
                            if (res.status === 'success') {
                                if (typeof showToast !== 'undefined') showToast(`✅ ${nama} dihapus`, 'success');
                                loadBOMData(true);
                            } else {
                                if (typeof showToast !== 'undefined') showToast('❌ Gagal menghapus BOM', 'error');
                                loadBOMData(true);
                            }
                        });
                    });
                }
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Error: ${response.message}</td></tr>`;
        }
    };

    const cached = window.ERPAPI.getCached('get_bom');
    if (cached) {
        render(cached);
    } else {
        if (!isBackgroundSync) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        }
    }

    // Fetch Stock for datalist concurrently
    window.ERPAPI.request('get_stock').then(stockRes => {
        if (stockRes.status === 'success' && stockRes.data) {
            const list = document.getElementById('bom-bahan-baku-list');
            if (list) {
                list.innerHTML = '';
                stockRes.data.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.nama;
                    option.setAttribute('data-kode', s.kode || '');
                    option.setAttribute('data-harga', s.harga || 0);
                    list.appendChild(option);
                });
            }
        }
    });

    const response = await window.ERPAPI.request('get_bom');
    if (!cached || JSON.stringify(cached.data) !== JSON.stringify(response.data)) {
        render(response);
    }
}

function openBOMDetail(item) {
    console.log('[BOM DETAIL] Membuka detail untuk:', item.kode_barang);
    console.log('[BOM DETAIL] item.gambar:', item.gambar, '(type:', typeof item.gambar, ', length:', item.gambar ? item.gambar.length : 0 + ')');

    let materials = [];
    let proses = [];
    try {
        let rm = item.rincian_material;
        if (typeof rm === 'string' && rm.trim() !== '') {
            materials = JSON.parse(rm);
        } else if (rm && typeof rm === 'object') {
            materials = rm;
        }
    } catch (e) { }
    if (!Array.isArray(materials)) materials = [];

    try {
        let rp = item.rincian_proses;
        if (typeof rp === 'string' && rp.trim() !== '') {
            proses = JSON.parse(rp);
        } else if (rp && typeof rp === 'object') {
            proses = rp;
        }
    } catch (e) { console.error('[BOM DETAIL] Parse error rincian_proses:', e.message); }
    if (!Array.isArray(proses)) proses = [];
    console.log('[BOM DETAIL] proses count:', proses.length, '| items:', JSON.stringify(proses.map((p, idx) => ({ idx, nama: p.nama, gambar: p.gambar ? 'ADA (' + p.gambar.substring(0, 40) + '...)' : 'KOSONG' }))));

    let matHtml = materials.map((m, i) => `<tr><td>${i + 1}</td><td>${m.kode || '-'}</td><td>${m.nama}</td><td>${parseInt(m.qty || 0).toLocaleString('id-ID')}</td><td>Rp ${parseInt(m.harga || 0).toLocaleString('id-ID')}</td></tr>`).join('');
    const prosPlaceholder = '<span style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:60px;background:rgba(255,255,255,0.05);border-radius:5px;color:var(--text-muted);font-size:0.75rem;text-align:center;line-height:1.2;">Tidak ada<br>gambar</span>';
    let prosHtml = proses.map((p, i) => {
        let gambarUrl = p.gambar || '';
        if (gambarUrl.includes('drive.google.com/uc') && gambarUrl.includes('export=download')) {
            const match = gambarUrl.match(/id=([^&]+)/);
            if (match && match[1]) {
                gambarUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
            }
        }

        let gambarCell;
        if (gambarUrl && String(gambarUrl).trim() !== '') {
            gambarCell = `<a href="javascript:void(0)" title="Klik untuk memperbesar" onclick="openLightbox('${gambarUrl}', '${p.nama || ''}')"><img src="${gambarUrl}" alt="${p.nama || ''}" style="max-width:80px;max-height:60px;border-radius:5px;object-fit:cover;display:block;background:rgba(255,255,255,0.05); cursor: pointer;" onerror="console.error('[BOM DETAIL PROSES IMG ERROR] Proses #${i} gambar gagal dimuat'); this.onerror=null;this.outerHTML='<span style=\\'color:gray;font-size:0.75rem;\\'>Gagal load</span>';"></a>`;
        } else {
            gambarCell = prosPlaceholder;
        }
        return `<tr><td>${i + 1}</td><td>${p.nama || '-'}</td><td>${gambarCell}</td></tr>`;
    }).join('');

    let mainImgUrl = item.gambar || '';
    if (mainImgUrl.includes('drive.google.com/uc') && mainImgUrl.includes('export=download')) {
        const match = mainImgUrl.match(/id=([^&]+)/);
        if (match && match[1]) {
            mainImgUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
    }

    let imgHtml = '';
    if (mainImgUrl && String(mainImgUrl).trim() !== '') {
        imgHtml = `<div style="margin-bottom: 15px; text-align: center;"><img src="${mainImgUrl}" alt="${item.nama_barang || ''}" style="max-width: 100%; max-height: 200px; border-radius: 10px; background: rgba(255,255,255,0.05); cursor: pointer;" onclick="openLightbox('${mainImgUrl}', '${item.nama_barang || ''}')" title="Klik untuk memperbesar" onerror="console.error('[BOM DETAIL MAIN IMG ERROR] Gambar utama gagal dimuat dari: ${mainImgUrl}'); this.onerror=null;this.style.display='none';"></div>`;
        console.log('[BOM DETAIL] Main image URL kosong atau undefined');
    }

    const detailOverlay = document.createElement('div');
    detailOverlay.className = 'login-overlay active';
    detailOverlay.innerHTML = `
            <div class="login-box" style="max-width: 650px; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 1rem;">Detail BOM: ${item.kode_barang}</h2>
                <p style="color: var(--text-muted); margin-bottom: 15px;">${item.nama_barang}</p>
                ${imgHtml}
                <div style="border-top: 1px solid var(--glass-border); padding-top: 15px; margin-bottom: 15px;">
                    <h4 style="color: var(--primary); margin-bottom: 10px;">Rincian Material</h4>
                    <table style="width: 100%; font-size: 0.85rem;">
                        <thead><tr><th>#</th><th>Kode</th><th>Nama</th><th>Qty</th><th>Biaya</th></tr></thead>
                        <tbody>${matHtml || '<tr><td colspan="5" style="text-align:center;">-</td></tr>'}</tbody>
                    </table>
                    <p style="text-align: right; margin-top: 8px; font-weight: bold;">Total: Rp ${parseInt(item.total_biaya || 0).toLocaleString('id-ID')}</p>
                </div>
                <div style="border-top: 1px solid var(--glass-border); padding-top: 15px; margin-bottom: 15px;">
                    <h4 style="color: var(--secondary); margin-bottom: 10px;">Rincian Proses Produksi</h4>
                    <table style="width: 100%; font-size: 0.85rem;">
                        <thead><tr><th>#</th><th>Tahapan</th><th>Gambar</th></tr></thead>
                        <tbody>${prosHtml || '<tr><td colspan="3" style="text-align:center;">-</td></tr>'}</tbody>
                    </table>
                </div>
                <button class="btn" id="btn-close-bom-detail" style="width: 100%; justify-content: center; background: var(--bg-glass);">Tutup</button>
            </div>
        `;
    document.body.appendChild(detailOverlay);
    detailOverlay.querySelector('#btn-close-bom-detail').addEventListener('click', () => detailOverlay.remove());
}

function openBOMEdit(item) {
    document.getElementById('bom-modal-title').textContent = 'Edit BOM: ' + item.kode_barang;
    document.getElementById('bom_kode').value = item.kode_barang;
    document.getElementById('bom_kode').readOnly = true;
    document.getElementById('bom_nama').value = item.nama_barang;

    bomGambarBase64 = null;
    bomGambarMime = null;
    const preview = document.getElementById('bom_gambar_preview');
    if (item.gambar) {
        preview.style.display = 'block';
        preview.querySelector('img').src = item.gambar;
    } else {
        preview.style.display = 'none';
    }

    materialsContainer.innerHTML = '';
    prosesContainer.innerHTML = '';

    let materials = [];
    let proses = [];
    try { materials = typeof item.rincian_material === 'string' ? JSON.parse(item.rincian_material) : (item.rincian_material || []); } catch (e) { }
    try { proses = typeof item.rincian_proses === 'string' ? JSON.parse(item.rincian_proses) : (item.rincian_proses || []); } catch (e) { }

    if (materials.length > 0) {
        materials.forEach(m => addMaterialRow(m.kode || '', m.nama || '', m.qty || '1', m.harga || ''));
    } else {
        addMaterialRow();
    }

    if (proses.length > 0) {
        proses.forEach(p => addProsesRow(p.nama || '', p.gambar || ''));
    } else {
        addProsesRow();
    }

    calculateTotalBiaya();
    bomModal.classList.add('active');
}

const bomModal = document.getElementById('bom-modal');
const bomForm = document.getElementById('bom-form');
const materialsContainer = document.getElementById('bom-materials-container');
const prosesContainer = document.getElementById('bom-proses-container');
const totalBiayaDisplay = document.getElementById('bom_total_biaya');

function calculateTotalBiaya() {
    let total = 0;
    const prices = materialsContainer.querySelectorAll('.mat-harga');
    prices.forEach(input => {
        total += parseInt(String(input.value).replace(/\D/g, '')) || 0;
    });
    totalBiayaDisplay.textContent = total.toLocaleString('id-ID');
}

function addMaterialRow(kode = '', nama = '', qty = '1', harga = '') {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.innerHTML = `
            <input type="text" class="mat-kode" placeholder="Kode Mat" value="${kode}" style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" list="bom-bahan-baku-list" class="mat-nama" placeholder="Nama Material" value="${nama}" required style="flex: 2; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="mat-qty number-format" placeholder="Qty" value="${qty ? formatRibuan(qty) : ''}" required style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="mat-harga number-format" placeholder="Total Biaya Mat." value="${harga ? formatRibuan(harga) : ''}" required style="flex: 1.5; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <button type="button" class="btn btn-remove-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;
    div.querySelector('.btn-remove-row').addEventListener('click', () => {
        div.remove();
        calculateTotalBiaya();
    });
    div.querySelector('.mat-harga').addEventListener('input', calculateTotalBiaya);

    // Auto-fill kode and harga from datalist
    div.querySelector('.mat-nama').addEventListener('input', (e) => {
        const val = e.target.value;
        const list = document.getElementById('bom-bahan-baku-list');
        if (list) {
            const options = Array.from(list.options);
            const match = options.find(opt => opt.value === val);
            if (match) {
                const hrg = match.getAttribute('data-harga');
                const kod = match.getAttribute('data-kode');
                if (hrg) div.querySelector('.mat-harga').value = formatRibuan(hrg);
                if (kod) div.querySelector('.mat-kode').value = kod;
                calculateTotalBiaya();
            }
        }
    });

    materialsContainer.appendChild(div);
}

// Kompres gambar dengan resolusi tinggi (untuk diunggah ke Google Drive)
function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                width = Math.round(width);
                height = Math.round(height);

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
        };
        reader.onerror = error => reject(error);
    });
}

function addProsesRow(nama = '', gambarUrl = '') {
    const div = document.createElement('div');
    div.style.marginBottom = '10px';
    div.innerHTML = `
            <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                <input type="text" class="pros-nama" placeholder="Deskripsi Tahapan Proses" value="${nama}" required style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
                <label class="btn" style="padding: 0.5rem 0.8rem; font-size: 0.75rem; cursor: pointer; background: var(--accent);">
                    <i class="fa-solid fa-image"></i>
                    <input type="file" class="pros-gambar-file" accept="image/*" style="display: none;">
                </label>
                <button type="button" class="btn btn-remove-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="pros-gambar-preview" style="display: ${gambarUrl ? 'block' : 'none'}; margin-left: 5px;">
                <img src="${gambarUrl}" style="max-width: 100px; max-height: 60px; border-radius: 5px; object-fit: cover;">
            </div>
            <input type="hidden" class="pros-gambar-url" value="${gambarUrl}">
            <input type="hidden" class="pros-gambar-base64" value="">
            <input type="hidden" class="pros-gambar-mime" value="">
        `;
    div.querySelector('.btn-remove-row').addEventListener('click', () => div.remove());
    div.querySelector('.pros-gambar-file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 5MB per image)
            if (file.size > 5 * 1024 * 1024) {
                showToast('❌ Ukuran file terlalu besar (max 5MB). Silakan pilih file yang lebih kecil.', 'error', 5000);
                return;
            }
            prosesImageCompressionInProgress++;
            const compressedDataUrl = await compressImage(file, 800, 800, 0.8);

            div.querySelector('.pros-gambar-base64').value = compressedDataUrl.split(',')[1];
            div.querySelector('.pros-gambar-mime').value = file.type;
            div.querySelector('.pros-gambar-preview').style.display = 'block';
            div.querySelector('.pros-gambar-preview img').src = compressedDataUrl;
            prosesImageCompressionInProgress = Math.max(0, prosesImageCompressionInProgress - 1);
        }
    });
    prosesContainer.appendChild(div);
}

document.getElementById('btn-add-material')?.addEventListener('click', () => addMaterialRow());
document.getElementById('btn-add-proses')?.addEventListener('click', () => addProsesRow());

let bomGambarBase64 = null;
let bomGambarMime = null;
let bomImageCompressionInProgress = false;
let prosesImageCompressionInProgress = 0;

document.getElementById('bom_gambar')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ Ukuran file terlalu besar (max 5MB). Silakan pilih file yang lebih kecil.', 'error', 5000);
            document.getElementById('bom_gambar').value = '';
            bomGambarBase64 = null;
            bomGambarMime = null;
            document.getElementById('bom_gambar_preview').style.display = 'none';
            return;
        }
        bomGambarMime = file.type;
        bomImageCompressionInProgress = true;

        const compressedDataUrl = await compressImage(file, 1024, 1024, 0.8);
        bomGambarBase64 = compressedDataUrl.split(',')[1];
        document.getElementById('bom_gambar_preview').style.display = 'block';
        document.getElementById('bom_gambar_preview').querySelector('img').src = compressedDataUrl;
        bomImageCompressionInProgress = false;
    } else {
        bomGambarBase64 = null;
        bomGambarMime = null;
        document.getElementById('bom_gambar_preview').style.display = 'none';
    }
});

document.getElementById('btn-add-bom')?.addEventListener('click', () => {
    document.getElementById('bom-modal-title').textContent = 'Form BOM & PMO Sampel';
    bomForm.reset();
    document.getElementById('bom_kode').readOnly = false;
    bomGambarBase64 = null;
    bomGambarMime = null;
    document.getElementById('bom_gambar_preview').style.display = 'none';
    materialsContainer.innerHTML = '';
    prosesContainer.innerHTML = '';
    totalBiayaDisplay.textContent = '0';
    addMaterialRow(); // add 1 default row
    addProsesRow(); // add 1 default row
    bomModal.classList.add('active');
});

document.getElementById('btn-close-bom')?.addEventListener('click', () => {
    bomModal.classList.remove('active');
});

bomForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validasi input dasar
    const kodeBOM = document.getElementById('bom_kode')?.value?.trim();
    const namaBOM = document.getElementById('bom_nama')?.value?.trim();

    if (!kodeBOM || !namaBOM) {
        showToast('❌ Kode dan Nama BOM harus diisi', 'error');
        return;
    }

    const materials = [];
    materialsContainer.querySelectorAll('div').forEach(div => {
        const kode = div.querySelector('.mat-kode')?.value;
        const nama = div.querySelector('.mat-nama')?.value;
        const qty = parseInt(String(div.querySelector('.mat-qty')?.value).replace(/\D/g, '')) || 0;
        const harga = parseInt(String(div.querySelector('.mat-harga')?.value).replace(/\D/g, '')) || 0;
        if (nama) materials.push({ kode: kode || '', nama, qty: qty || 1, harga: harga || 0 });
    });

    if (materials.length === 0) {
        showToast('❌ Minimal ada 1 Material yang harus diisi', 'error');
        return;
    }

    if (bomImageCompressionInProgress || prosesImageCompressionInProgress > 0) {
        showToast('⏳ Tunggu sampai semua gambar selesai diproses sebelum menyimpan.', 'warning', 5000);
        return;
    }

    const proses = [];
    prosesContainer.querySelectorAll(':scope > div').forEach(div => {
        const nama = div.querySelector('.pros-nama')?.value;
        if (nama) {
            proses.push({
                nama,
                gambar: div.querySelector('.pros-gambar-url')?.value || '',
                gambar_base64: div.querySelector('.pros-gambar-base64')?.value || '',
                gambar_mime: div.querySelector('.pros-gambar-mime')?.value || ''
            });
        }
    });

    if (proses.length === 0) {
        showToast('❌ Minimal ada 1 Tahapan Proses yang harus diisi', 'error');
        return;
    }

    const payload = {
        kode_barang: kodeBOM,
        nama_barang: namaBOM,
        rincian_material: materials,
        total_biaya: parseInt(totalBiayaDisplay.textContent.replace(/,/g, '').replace(/\./g, '')) || 0,
        rincian_proses: proses,
        gambar_base64: bomGambarBase64,
        gambar_mime: bomGambarMime
    };

    // Check payload size
    const payloadStr = JSON.stringify(payload);
    const payloadSize = new Blob([payloadStr]).size;
    const payloadSizeMB = (payloadSize / (1024 * 1024)).toFixed(2);

    console.log('[BOM SUBMIT] Mulai submit dengan data:', {
        kodeBOM,
        namaBOM,
        jumlahMaterial: materials.length,
        jumlahProses: proses.length,
        hasMainImage: !!bomGambarBase64,
        mainImageSize: bomGambarBase64 ? bomGambarBase64.length : 0,
        prosesImages: proses.map((p, i) => ({ nama: p.nama, hasImage: !!p.gambar_base64, size: p.gambar_base64 ? p.gambar_base64.length : 0 })),
        totalPayloadSize: payloadSizeMB + ' MB'
    });

    // Warn if payload is large (> 5MB)
    if (payloadSize > 5 * 1024 * 1024) {
        showToast(`⚠️ Data sangat besar (${payloadSizeMB} MB). Proses mungkin memakan waktu lama. Harap tunggu...`, 'warning', 4000);
    }

    const btnSubmit = bomForm.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;
    }

    // Optimistic UI: Close modal and add/update row
    bomModal.classList.remove('active');
    showToast('Sinkronisasi data BOM ke server di background...', 'info', 3000);
    
    const tbody = document.getElementById('table-bom');
    if (tbody) {
        const isEdit = bomForm.dataset.mode === 'edit';
        if (!isEdit) {
            const tr = document.createElement('tr');
            tr.style.opacity = '0.6';
            tr.innerHTML = `
                <td><i class="fa-solid fa-spinner fa-spin"></i></td>
                <td>${namaBOM}</td>
                <td><span class="badge badge-warning">Menyimpan...</span></td>
                <td>Rp ${parseInt(totalBiaya).toLocaleString('id-ID')}</td>
                <td></td>
            `;
            tbody.insertBefore(tr, tbody.firstChild);
        } else {
            // Edit mode optimistic
            const rows = tbody.querySelectorAll('tr');
            const targetRow = Array.from(rows).find(row => {
                const cell = row.querySelector('td:first-child');
                return cell && cell.textContent.trim() === kodeBOM;
            });
            if (targetRow) {
                targetRow.style.opacity = '0.5';
                const cells = targetRow.querySelectorAll('td');
                if (cells.length > 3) {
                    cells[1].textContent = namaBOM;
                    cells[3].textContent = 'Rp ' + parseInt(totalBiaya).toLocaleString('id-ID');
                }
            }
        }
    }

    // Async background save
    window.ERPAPI.request('save_bom', payload, 120000).then(res => {
        if (btnSubmit) {
            btnSubmit.innerHTML = 'Simpan Komposisi BOM';
            btnSubmit.disabled = false;
        }

        console.log('[BOM SUBMIT] Response dari server:', res);

        if (res.status === 'success') {
            showToast('✅ Data BOM berhasil disinkronisasi!', 'success', 3000);
            loadBOMData(true); // Background reload
        } else {
            const errorMsg = res.message || 'Terjadi kesalahan saat menyimpan data';
            showToast('❌ Gagal sinkronisasi: ' + errorMsg, 'error', 5000);
            loadBOMData(true); // Revert table
            console.error('[BOM SUBMIT] Error response:', res);
        }
    }).catch(error => {
        if (btnSubmit) {
            btnSubmit.innerHTML = 'Simpan Komposisi BOM';
            btnSubmit.disabled = false;
        }
        console.error('[BOM SUBMIT] Exception:', error);
        showToast('❌ Koneksi gagal: ' + error.message, 'error', 5000);
        loadBOMData(true); // Revert table
    });
});

// Flow 3: SPK Auto-Deduct
async function loadProduksiData(isBackgroundSync = false) {
    const tbody = document.getElementById('table-produksi');
    if (!tbody) return;
    if (!isBackgroundSync) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    }

    try {
        const response = await window.ERPAPI.request('get_produksi');
        if (response.status === 'success' && response.data) {
            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Belum ada SPK Produksi.</td></tr>';
                return;
            }

        const session = localStorage.getItem('erp_session');
        const user = session ? JSON.parse(session) : {};
        const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));

        response.data.forEach(item => {
            const tr = document.createElement('tr');
            
            let statusBadge = `<span class="badge badge-success">${item.status}</span>`;
            let actionBtns = '';
            
            if (item.status === 'Menunggu Pengambilan') {
                statusBadge = `<span class="badge badge-warning">${item.status}</span>`;
                actionBtns += `<button class="btn btn-ambil-bahan" data-no="${item.no_spk}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--warning); margin-right: 5px;">Ambil Bahan</button>`;
            } else if (item.status === 'Dalam Proses') {
                statusBadge = `<span class="badge badge-info" style="background: var(--info);">${item.status}</span>`;
                actionBtns += `<button class="btn btn-selesaikan-spk" data-no="${item.no_spk}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--primary); margin-right: 5px;">Selesaikan</button>`;
            }

            if (isAdmin) {
                actionBtns += `<button class="btn btn-delete-spk" data-no="${item.no_spk}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--danger);"><i class="fa-solid fa-trash"></i></button>`;
            } else if (!actionBtns) {
                actionBtns = '-';
            }

            tr.innerHTML = `
                    <td>${item.no_spk || '-'}</td>
                    <td>${item.tanggal || '-'}</td>
                    <td style="font-weight: 500;">${item.kode_barang_jadi || item.kode_barang || '-'}</td>
                    <td>${item.qty_produksi || item.qty || '-'}</td>
                    <td>${statusBadge}</td>
                    <td>${actionBtns}</td>
                `;
                tr.style.cursor = 'pointer';
                tr.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', e => e.stopPropagation());
                });
                tr.addEventListener('click', () => {
                    openSPKDetail(item);
                });
                tbody.appendChild(tr);

            // Button Event Listeners
            const btnAmbil = tr.querySelector('.btn-ambil-bahan');
            if (btnAmbil) {
                btnAmbil.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const noSPK = btnAmbil.getAttribute('data-no');
                    const ok = await showConfirm({
                        title: 'Ambil Bahan Baku',
                        message: `Yakin ingin memotong stok bahan baku untuk <strong>${noSPK}</strong> sekarang?`,
                        icon: '📦', confirmText: 'Ya, Ambil', cancelText: 'Batal'
                    });
                    if (!ok) return;
                    
                    btnAmbil.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    btnAmbil.disabled = true;
                    if (typeof showToast !== 'undefined') showToast('Mengambil bahan baku...', 'info');
                    window.ERPAPI.request('ambil_bahan_spk', { no_spk: noSPK }).then(res => {
                        if (res.status === 'success') {
                            if (typeof showToast !== 'undefined') showToast(`✅ ${noSPK} bahan baku dipotong`, 'success');
                            loadProduksiData(true);
                        } else {
                            if (typeof showToast !== 'undefined') showToast('❌ Gagal mengambil bahan', 'error');
                            btnAmbil.innerHTML = 'Ambil Bahan';
                            btnAmbil.disabled = false;
                        }
                    });
                });
            }

            const btnSelesaikan = tr.querySelector('.btn-selesaikan-spk');
            if (btnSelesaikan) {
                btnSelesaikan.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const noSPK = btnSelesaikan.getAttribute('data-no');
                    const ok = await showConfirm({
                        title: 'Selesaikan Produksi',
                        message: `Yakin produksi <strong>${noSPK}</strong> sudah selesai dan ingin menambah stok Barang Jadi?`,
                        icon: '✅', confirmText: 'Ya, Selesaikan', cancelText: 'Batal'
                    });
                    if (!ok) return;
                    
                    btnSelesaikan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    btnSelesaikan.disabled = true;
                    if (typeof showToast !== 'undefined') showToast('Menyelesaikan SPK...', 'info');
                    window.ERPAPI.request('selesaikan_spk', { no_spk: noSPK }).then(res => {
                        if (res.status === 'success') {
                            if (typeof showToast !== 'undefined') showToast(`✅ ${noSPK} selesai diproduksi`, 'success');
                            loadProduksiData(true);
                        } else {
                            if (typeof showToast !== 'undefined') showToast('❌ Gagal menyelesaikan SPK', 'error');
                            btnSelesaikan.innerHTML = 'Selesaikan';
                            btnSelesaikan.disabled = false;
                        }
                    });
                });
            }

            if (isAdmin) {
                const btnDel = tr.querySelector('.btn-delete-spk');
                if (btnDel) {
                    btnDel.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const noSPK = btnDel.getAttribute('data-no');
                        const ok = await showConfirm({
                            title: 'Hapus SPK Produksi',
                            message: `Yakin ingin menghapus <strong>${noSPK}</strong>?`,
                            icon: '🗑️', confirmText: 'Ya, Hapus', cancelText: 'Batal'
                        });
                        if (!ok) return;
                        
                        tr.style.display = 'none';
                        if (typeof showToast !== 'undefined') showToast('Menghapus SPK...', 'info');
                        window.ERPAPI.request('delete_spk', { no_spk: noSPK }).then(res => {
                            if (res.status === 'success') {
                                if (typeof showToast !== 'undefined') showToast(`✅ ${noSPK} dihapus`, 'success');
                                loadProduksiData(true);
                            } else {
                                if (typeof showToast !== 'undefined') showToast('❌ Gagal menghapus SPK', 'error');
                                loadProduksiData(true);
                            }
                        });
                    });
                }
            }
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat data: ${response.message || 'Error'}</td></tr>`;
    }
  } catch (err) {
    console.error('[loadProduksiData] Error:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Koneksi gagal: ${err.message || 'Internal error'}</td></tr>`;
  }
}

const produksiModal = document.getElementById('produksi-modal');
const produksiForm = document.getElementById('produksi-form');
let cachedBOMData = [];
let cachedInventoryData = [];

async function populateKruGudangDropdown() {
    const select = document.getElementById('spk_pemberi');
    if (!select) return;
    
    // Only fetch if empty
    if (select.options.length <= 1) {
        select.innerHTML = '<option value="" disabled selected>Memuat data user...</option>';
        try {
            const res = await window.ERPAPI.request('get_users');
            select.innerHTML = '<option value="" disabled selected>Pilih Kru Gudang (Penyetuju)</option>';
            if (res.status === 'success' && res.data) {
                res.data.forEach(user => {
                    const opt = document.createElement('option');
                    opt.value = user.nama;
                    opt.textContent = `${user.nama} (${user.role})`;
                    select.appendChild(opt);
                });
                if (select.tomselect) {
                    select.tomselect.destroy();
                }
                new TomSelect('#spk_pemberi', {
                    create: false,
                    placeholder: 'Pilih Kru Gudang (Penyetuju)',
                    maxItems: null,
                    plugins: ['remove_button']
                });
            }
        } catch (err) {
            select.innerHTML = '<option value="" disabled selected>Gagal memuat user</option>';
        }
    }
}

document.getElementById('btn-run-spk')?.addEventListener('click', async () => {
    populateKruGudangDropdown();
    document.getElementById('produksi-form').reset();
    document.getElementById('spk-bahan-container').innerHTML = 'Pilih barang dan isi Qty untuk melihat estimasi...';
    document.getElementById('spk_total_biaya').textContent = '0';

    const select = document.getElementById('spk_kode_jadi');
    select.innerHTML = '<option value="" disabled selected>Memuat data BOM & Inventory...</option>';
    produksiModal.classList.add('active');

    const [resBom, resInv] = await Promise.all([
        window.ERPAPI.request('get_bom'),
        window.ERPAPI.request('get_inventory')
    ]);

    cachedBOMData = [];
    cachedInventoryData = [];

    if (resInv.status === 'success' && resInv.data) {
        cachedInventoryData = resInv.data;
    }

    if (resBom.status === 'success' && resBom.data) {
        cachedBOMData = resBom.data;
        
        if (select.tomselect) {
            select.tomselect.destroy();
        }
        
        select.innerHTML = '<option value="">-- Pilih Barang Jadi --</option>';
        resBom.data.forEach(bom => {
            const opt = document.createElement('option');
            opt.value = bom.kode_barang;
            opt.textContent = `${bom.kode_barang} - ${bom.nama_barang}`;
            select.appendChild(opt);
        });
        
        new TomSelect('#spk_kode_jadi', {
            create: true,
            sortField: {
                field: 'text',
                direction: 'asc'
            },
            maxOptions: 50
        });
    } else {
        if (select.tomselect) {
            select.tomselect.destroy();
        }
        select.innerHTML = '<option value="" disabled selected>Gagal memuat BOM</option>';
    }
});

function calculateSPKEstimasi() {
    const kode = document.getElementById('spk_kode_jadi').value;
    const qty = parseInt(String(document.getElementById('spk_qty_jadi').value).replace(/\D/g, '')) || 0;
    const container = document.getElementById('spk-bahan-container');
    const totalDisp = document.getElementById('spk_total_biaya');
    const btnSubmit = produksiForm.querySelector('button[type="submit"]');

    if (!kode || qty <= 0) {
        container.innerHTML = 'Pilih barang dan isi Qty untuk melihat estimasi...';
        totalDisp.textContent = '0';
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Terbitkan SPK';
        return;
    }

    const bom = cachedBOMData.find(b => b.kode_barang === kode);
    if (!bom) {
        container.innerHTML = '<span style="color:var(--warning);"><i class="fa-solid fa-circle-info"></i> Produk Custom atau tidak ada di BOM. Estimasi penggunaan material tidak tersedia.</span>';
        totalDisp.textContent = '0';
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Terbitkan SPK';
        return;
    }

    let matArray = [];
    try {
        matArray = typeof bom.rincian_material === 'string' ? JSON.parse(bom.rincian_material) : bom.rincian_material;
    } catch (e) { }

    if (!matArray || matArray.length === 0) {
        container.innerHTML = 'Tidak ada rincian material pada BOM ini.';
        totalDisp.textContent = '0';
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Terbitkan SPK';
        return;
    }

    let html = '';
    let totalCost = 0;
    let hasShortage = false;

    matArray.forEach(m => {
        const reqQty = (m.qty || 1) * qty;
        const cost = (m.harga || 0) * qty;
        totalCost += cost;

        const invItem = cachedInventoryData.find(inv => inv.kode_material === m.kode);
        const currentStock = invItem ? invItem.stok : 0;
        const shortage = reqQty - currentStock;

        if (shortage > 0) {
            hasShortage = true;
            html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color: var(--danger);">
                    <span><i class="fa-solid fa-triangle-exclamation"></i> ${m.kode || '-'} | ${m.nama}</span>
                    <span><strong>${reqQty}</strong> unit (Stok: ${currentStock}, Kurang: ${shortage})</span>
                </div>`;
        } else {
            html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color: var(--success);">
                    <span><i class="fa-solid fa-check"></i> ${m.kode || '-'} | ${m.nama}</span>
                    <span><strong>${reqQty}</strong> unit (Stok: ${currentStock}, Cukup)</span>
                </div>`;
        }
    });

    container.innerHTML = html;
    totalDisp.textContent = totalCost.toLocaleString('id-ID');

    if (hasShortage) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Stok Tidak Cukup';
    } else {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Terbitkan SPK';
    }
}

document.getElementById('spk_kode_jadi').addEventListener('change', calculateSPKEstimasi);
document.getElementById('spk_qty_jadi').addEventListener('input', calculateSPKEstimasi);

document.getElementById('btn-close-produksi')?.addEventListener('click', () => {
    produksiModal.classList.remove('active');
});

produksiForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const kode = document.getElementById('spk_kode_jadi').value;
    const qty = parseInt(String(document.getElementById('spk_qty_jadi').value).replace(/\D/g, '')) || 0;

    const bom = cachedBOMData.find(b => b.kode_barang === kode);
    let calculatedBahan = [];
    if (bom) {
        let matArray = typeof bom.rincian_material === 'string' ? JSON.parse(bom.rincian_material) : bom.rincian_material;
        calculatedBahan = matArray.map(m => ({
            kode: m.kode || '',
            nama: m.nama,
            qty: (m.qty || 1) * qty
        }));
    }

    const payload = {
        kode_barang: kode,
        qty: qty,
        bahan_baku: calculatedBahan,
        peminta: document.getElementById('spk_peminta').value,
        pemberi: Array.from(document.getElementById('spk_pemberi').selectedOptions).map(o => o.value).join(', ')
    };

    const btnSubmit = produksiForm.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;
    }

    produksiModal.classList.remove('active');
    if (typeof showToast !== 'undefined') showToast('Sinkronisasi SPK ke server...', 'info', 3000);

    // Optimistic Add
    const tbody = document.getElementById('table-produksi');
    if (tbody) {
        const tr = document.createElement('tr');
        tr.style.opacity = '0.6';
        tr.innerHTML = `
            <td><i class="fa-solid fa-spinner fa-spin"></i></td>
            <td>Hari ini</td>
            <td style="font-weight: 500;">${kode}</td>
            <td>${qty}</td>
            <td><span class="badge badge-warning">Menyimpan...</span></td>
        `;
        tbody.insertBefore(tr, tbody.firstChild);
    }

    window.ERPAPI.request('save_spk', payload).then(res => {
        if (btnSubmit) {
            btnSubmit.innerHTML = 'Terbitkan SPK';
            btnSubmit.disabled = false;
        }

        if (res.status === 'success') {
            showToast?.(`✅ SPK Berhasil Terbit`, 'success', 3000);
            loadProduksiData(true); // Reload table background
        } else {
            alert('Gagal: ' + res.message);
            loadProduksiData(true); // Revert table
        }
    });
});

// Flow 5: Invoice
document.getElementById('btn-invoice')?.addEventListener('click', async () => {
    const total = prompt("Total Tagihan Keseluruhan:");
    const dp = prompt("Potongan DP yang sudah masuk:");
    if (total && dp) {
        const res = await window.ERPAPI.request('save_invoice', {
            customer: 'PT Klien Maju',
            ref_surat_jalan: 'SJ-Dummy-001',
            total_harga: total,
            dp: dp
        });
        alert(res.message);
    }
});

// --- Admin (User Management) Logic ---
async function loadAdminData() {
    const tbody = document.getElementById('table-users');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data pengguna...</td></tr>';

    const response = await window.ERPAPI.request('get_users');
    if (response.status === 'success' && response.data) {
        tbody.innerHTML = '';
        response.data.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                    <td style="font-weight: 500;">${user.username}</td>
                    <td>${user.nama_lengkap || user.nama || ''}</td>
                    <td><span class="badge badge-success">${user.role}</span></td>
                    <td>
                        <button class="btn btn-edit-user" data-user='${JSON.stringify(user)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-delete-user" data-username="${user.username}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', (e) => {
                if (e.target.closest('.btn')) return;
                openUserDetail(user);
            });
            tbody.appendChild(tr);
        });

        // Bind edit/delete user
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const user = JSON.parse(e.currentTarget.getAttribute('data-user'));
                openUserModal('Edit Pengguna', user);
            });
        });
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const username = e.currentTarget.getAttribute('data-username');
                const ok = await showConfirm({
                    title: 'Hapus Akun Pengguna',
                    message: `Yakin ingin menghapus akun <strong style="color:#fff">${username}</strong>?<br><span style="font-size:0.82rem;color:rgba(255,255,255,0.4);">Akun ini tidak bisa dipulihkan setelah dihapus.</span>`,
                    icon: '👤',
                    type: 'danger',
                    confirmText: 'Ya, Hapus Akun'
                });
                if (ok) {
                    window.ERPAPI.request('delete_user', { username }).then(res => {
                        showToast(res.status === 'success' ? `✅ ${res.message}` : `❌ ${res.message}`, res.status === 'success' ? 'success' : 'error', 3000);
                        loadAdminData();
                    });
                }
            });
        });
    }
}

const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');

function openUserModal(title, data = null) {
    document.getElementById('user-modal-title').textContent = title;
    document.getElementById('u_username').value = data ? data.username : '';
    document.getElementById('u_username').readOnly = !!data;
    document.getElementById('u_nama').value = data ? (data.nama_lengkap || data.nama || '') : '';
    document.getElementById('u_role').value = data ? data.role : 'Staff Purchasing';
    document.getElementById('u_password').value = '';
    document.getElementById('u_password').required = !data; // required for new user

    const roleSelect = document.getElementById('u_role');
    if (title === 'Profil Saya') {
        roleSelect.setAttribute('disabled', 'true');
    } else {
        roleSelect.removeAttribute('disabled');
    }

    userModal.classList.add('active');
}

document.getElementById('btn-add-user')?.addEventListener('click', () => {
    openUserModal('Tambah Pengguna Baru');
});

document.getElementById('btn-close-user')?.addEventListener('click', () => {
    userModal.classList.remove('active');
});

userForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
        username: document.getElementById('u_username').value,
        password: document.getElementById('u_password').value,
        nama_lengkap: document.getElementById('u_nama').value,
        nama: document.getElementById('u_nama').value,
        role: document.getElementById('u_role').value
    };

    userModal.classList.remove('active');

    window.ERPAPI.request('save_user', payload).then(res => {
        if (res.status !== 'success') {
            showToast(`❌ ${res.message}`, 'error', 3000);
        } else {
            showToast(`✅ ${res.message}`, 'success', 3000);
            // Update session if it's the current user
            const session = JSON.parse(localStorage.getItem('erp_session') || '{}');
            if (session.username === payload.username) {
                session.nama = payload.nama;
                session.nama_lengkap = payload.nama_lengkap;
                // Note: Role usually isn't changed by normal users, but if it is, we could update it too.
                localStorage.setItem('erp_session', JSON.stringify(session));
                const nameDisplay = document.getElementById('user-name-display');
                if (nameDisplay) nameDisplay.textContent = session.nama_lengkap || session.nama;
            }
        }
        if (typeof loadAdminData === 'function') {
            loadAdminData();
        }
    });
});

// Petty Cash Modal
const pettyCashModal = document.getElementById('petty-cash-modal');
document.getElementById('btn-add-cash')?.addEventListener('click', () => {
    document.getElementById('pc_nominal').value = '';
    document.getElementById('pc_keterangan').value = '';
    document.getElementById('pc_coa').value = '';
    pettyCashModal.classList.add('active');
});

document.getElementById('btn-close-petty-cash')?.addEventListener('click', () => {
    pettyCashModal.classList.remove('active');
});

document.getElementById('petty-cash-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const jenis = document.getElementById('pc_jenis').value;
    const nominal = document.getElementById('pc_nominal').value;
    const keterangan = document.getElementById('pc_keterangan').value;
    const coa = document.getElementById('pc_coa').value;

    const session = localStorage.getItem('erp_session');
    const user = session ? JSON.parse(session).username : 'Unknown';

    const payload = {
        jenis: jenis,
        jumlah: nominal,
        keterangan: keterangan,
        coa: coa,
        user: user
    };

    const res = await window.ERPAPI.request('add_petty_cash', payload);
    if (res.status === 'success') {
        pettyCashModal.classList.remove('active');
        showToast('Mutasi kas berhasil disimpan', 'success');
    } else {
        showToast(res.message, 'error');
    }
});

// =============================================
// Alur Approval
// =============================================

let allApprovalData = {};
let activeKategoriId = null;
let daftarJabatan = [];
let masterCOA = [];

// Helper to get active pipeline
function getActivePipeline() {
    if (!activeKategoriId) return [];
    return allApprovalData[activeKategoriId] || [];
}

async function loadApprovalData() {
    const session = localStorage.getItem('erp_session');
    const user = session ? JSON.parse(session) : {};
    const isAdmin = ['Direktur', 'Admin', 'Management', 'Super Admin', 'super'].some(r => user.role.toLowerCase().includes(r.toLowerCase()));

    const btnTabFlow = document.getElementById('btn-tab-flow');
    const btnTabJabatan = document.getElementById('btn-tab-jabatan');
    const btnAddKat = document.getElementById('btn-add-kategori');
    const btnAddJab = document.getElementById('btn-add-jabatan');

    if (isAdmin) {
        if (btnTabFlow) btnTabFlow.style.display = 'inline-flex';
        if (btnTabJabatan) btnTabJabatan.style.display = 'inline-flex';
        if (btnAddKat) btnAddKat.style.display = 'inline-flex';
        if (btnAddJab) btnAddJab.style.display = 'inline-flex';
    }

    // Ambil data settings dari backend
    const res = await window.ERPAPI.request('get_settings');
    if (res.status === 'success' && res.data) {
        if (res.data.approval_graph) {
            try {
                allApprovalData = JSON.parse(res.data.approval_graph);
                // Migrasi ke struktur linear pipeline jika masih format lama
                if (!allApprovalData._order || !Array.isArray(allApprovalData._order)) {
                    allApprovalData = { "_order": ["Pengajuan Belanja"], "Pengajuan Belanja": [] };
                }
            } catch (e) {
                console.error("Gagal parsing approval_graph", e);
                allApprovalData = { "_order": ["Pengajuan Belanja"], "Pengajuan Belanja": [] };
            }
        } else {
            allApprovalData = { "_order": ["Pengajuan Belanja"], "Pengajuan Belanja": [] };
        }

        if (res.data.daftar_jabatan) {
            try {
                daftarJabatan = JSON.parse(res.data.daftar_jabatan);
            } catch (e) {
                daftarJabatan = [];
            }
        } else {
            daftarJabatan = [];
        }

        if (res.data.master_coa) {
            try {
                masterCOA = JSON.parse(res.data.master_coa);
            } catch (e) {
                masterCOA = [];
            }
        } else {
            masterCOA = [];
        }
    }

    if (!allApprovalData._order) allApprovalData._order = [];
    if (allApprovalData._order.length > 0) {
        activeKategoriId = allApprovalData._order[0];
    }

    // Kalau kosong, coba extract dari graph lama sebagai initial data
    if (daftarJabatan.length === 0) {
        const tempSet = new Set();
        Object.keys(allApprovalData).forEach(k => {
            if (k !== '_order') {
                const arr = allApprovalData[k] || [];
                arr.forEach(r => tempSet.add(r));
            }
        });
        daftarJabatan = Array.from(tempSet);
    }

    renderKategoriList();
    renderDaftarJabatan();
    renderMermaidDiagram();
    updateRoleDatalist();

    renderMasterCOA();
    updateCOADatalist();
}

async function saveApprovalData() {
    const payload = {
        approval_graph: JSON.stringify(allApprovalData),
        daftar_jabatan: JSON.stringify(daftarJabatan),
        master_coa: JSON.stringify(masterCOA)
    };
    const res = await window.ERPAPI.request('save_settings', payload);

    if (res.status === 'success') {
        showToast('✅ Rute Approval berhasil disimpan.', 'success');
        renderMermaidDiagram();
        // Kumpulkan semua role unik untuk autocomplete datalist
        updateRoleDatalist();
    } else {
        showToast('❌ Gagal menyimpan rute.', 'error');
    }
}

function updateRoleDatalist() {
    const datalist = document.getElementById('role-datalist');
    if (!datalist) return;
    datalist.innerHTML = '';

    daftarJabatan.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        datalist.appendChild(opt);
    });
}

// Modal Kategori
const kategoriModal = document.getElementById('kategori-modal');
document.getElementById('btn-add-kategori')?.addEventListener('click', () => {
    document.getElementById('kat_name').value = '';
    kategoriModal.classList.add('active');
});

document.getElementById('btn-close-kategori')?.addEventListener('click', () => {
    kategoriModal.classList.remove('active');
});

document.getElementById('kategori-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const katName = document.getElementById('kat_name').value.trim();
    if (!katName) return;

    if (allApprovalData[katName]) {
        showToast('Tipe Pengajuan tersebut sudah ada.', 'warning');
        return;
    }

    allApprovalData[katName] = [];
    if (!allApprovalData._order.includes(katName)) {
        allApprovalData._order.push(katName);
    }

    activeKategoriId = katName;
    kategoriModal.classList.remove('active');
    saveApprovalData();
    renderKategoriList();
    renderFlowBuilder();
});
// Tabs
document.getElementById('btn-tab-diagram')?.addEventListener('click', (e) => {
    e.target.style.background = 'var(--primary)';
    document.getElementById('btn-tab-flow').style.background = 'var(--bg-glass)';
    document.getElementById('btn-tab-jabatan').style.background = 'var(--bg-glass)';
    document.getElementById('tab-diagram').style.display = 'block';
    document.getElementById('tab-flow').style.display = 'none';
    document.getElementById('tab-jabatan').style.display = 'none';
    renderMermaidDiagram();
});

document.getElementById('btn-tab-flow')?.addEventListener('click', (e) => {
    e.target.style.background = 'var(--primary)';
    document.getElementById('btn-tab-diagram').style.background = 'var(--bg-glass)';
    document.getElementById('btn-tab-jabatan').style.background = 'var(--bg-glass)';
    document.getElementById('tab-diagram').style.display = 'none';
    document.getElementById('tab-flow').style.display = 'block';
    document.getElementById('tab-jabatan').style.display = 'none';
    renderKategoriList();
    renderFlowBuilder();
});

document.getElementById('btn-tab-jabatan')?.addEventListener('click', (e) => {
    e.target.style.background = 'var(--primary)';
    document.getElementById('btn-tab-diagram').style.background = 'var(--bg-glass)';
    document.getElementById('btn-tab-flow').style.background = 'var(--bg-glass)';
    document.getElementById('tab-diagram').style.display = 'none';
    document.getElementById('tab-flow').style.display = 'none';
    document.getElementById('tab-jabatan').style.display = 'block';
    renderDaftarJabatan();
});

// Modals
const atasanModal = document.getElementById('atasan-modal');
const jabatanModal = document.getElementById('jabatan-modal');

document.getElementById('btn-add-jabatan')?.addEventListener('click', () => {
    document.getElementById('jabatan-modal-title').textContent = 'Tambah Jabatan';
    document.getElementById('jab_old_name').value = '';
    document.getElementById('jab_name').value = '';
    jabatanModal.classList.add('active');
});

document.getElementById('btn-close-jabatan')?.addEventListener('click', () => {
    jabatanModal.classList.remove('active');
});

document.getElementById('jabatan-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldName = document.getElementById('jab_old_name').value;
    const newName = document.getElementById('jab_name').value.trim();
    if (!newName) return;

    if (oldName && oldName !== newName) {
        // Edit
        if (daftarJabatan.includes(newName)) {
            showToast('Nama jabatan sudah ada.', 'warning');
            return;
        }
        const idx = daftarJabatan.indexOf(oldName);
        if (idx > -1) daftarJabatan[idx] = newName;

        // Cascade update in approval routes
        Object.keys(allApprovalData).forEach(k => {
            if (k === '_order') return;
            const arr = allApprovalData[k];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === oldName) arr[i] = newName;
            }
        });
    } else if (!oldName) {
        // Baru
        if (daftarJabatan.includes(newName)) {
            showToast('Nama jabatan sudah ada.', 'warning');
            return;
        }
        daftarJabatan.push(newName);
    }

    jabatanModal.classList.remove('active');
    saveApprovalData();
    renderDaftarJabatan();
    updateRoleDatalist();
});

function renderDaftarJabatan() {
    const listContainer = document.getElementById('masterJabatanList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (daftarJabatan.length === 0) {
        listContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem; grid-column: 1 / -1;">Belum ada daftar jabatan.</div>';
        return;
    }

    daftarJabatan.forEach(jab => {
        const div = document.createElement('div');
        div.style.cssText = `
                background: rgba(255,255,255,0.05); 
                border: 1px solid var(--glass-border); 
                padding: 15px; 
                border-radius: 10px; 
                display: flex; justify-content: space-between; align-items: center;
            `;

        const title = document.createElement('div');
        title.textContent = jab;
        title.style.fontWeight = '500';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';

        const btnEdit = document.createElement('button');
        btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
        btnEdit.className = 'btn admin-only';
        btnEdit.style.cssText = 'padding: 5px 8px; font-size: 0.75rem; background: transparent; color: var(--text-muted); box-shadow: none;';
        btnEdit.onmouseover = () => btnEdit.style.color = '#fff';
        btnEdit.onmouseout = () => btnEdit.style.color = 'var(--text-muted)';
        btnEdit.onclick = () => {
            document.getElementById('jabatan-modal-title').textContent = 'Edit Jabatan';
            document.getElementById('jab_old_name').value = jab;
            document.getElementById('jab_name').value = jab;
            jabatanModal.classList.add('active');
        };

        const btnDel = document.createElement('button');
        btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnDel.className = 'btn admin-only';
        btnDel.style.cssText = 'padding: 5px 8px; font-size: 0.75rem; background: transparent; color: var(--danger); box-shadow: none;';
        btnDel.onmouseover = () => btnDel.style.background = 'rgba(239, 68, 68, 0.2)';
        btnDel.onmouseout = () => btnDel.style.background = 'transparent';
        btnDel.onclick = async () => {
            const ok = await window.showConfirm({
                title: 'Hapus Jabatan',
                message: `Yakin ingin menghapus <b>${jab}</b> dari Master?<br>Ini juga akan menghapus nama ini dari rute approval manapun yang menggunakannya.`,
                type: 'danger'
            });
            if (ok) {
                daftarJabatan = daftarJabatan.filter(j => j !== jab);

                // Cascade delete
                Object.keys(allApprovalData).forEach(k => {
                    if (k === '_order') return;
                    allApprovalData[k] = allApprovalData[k].filter(r => r !== jab);
                });

                saveApprovalData();
                renderDaftarJabatan();
                updateRoleDatalist();
            }
        };

        actions.appendChild(btnEdit);
        actions.appendChild(btnDel);
        div.appendChild(title);
        div.appendChild(actions);
        listContainer.appendChild(div);
    });

    checkAdminVisibility();
}

// Modal COA
const coaModal = document.getElementById('coa-modal');
document.getElementById('btn-add-coa')?.addEventListener('click', () => {
    document.getElementById('coa-modal-title').textContent = 'Tambah Kategori COA';
    document.getElementById('coa_old_name').value = '';
    document.getElementById('coa_name').value = '';
    coaModal.classList.add('active');
});

document.getElementById('btn-close-coa')?.addEventListener('click', () => {
    coaModal.classList.remove('active');
});

document.getElementById('coa-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldName = document.getElementById('coa_old_name').value;
    const newName = document.getElementById('coa_name').value.trim();
    if (!newName) return;

    if (oldName && oldName !== newName) {
        // Edit
        if (masterCOA.includes(newName)) {
            showToast('Kategori COA sudah ada.', 'warning');
            return;
        }
        const idx = masterCOA.indexOf(oldName);
        if (idx > -1) masterCOA[idx] = newName;
    } else if (!oldName) {
        // Baru
        if (masterCOA.includes(newName)) {
            showToast('Kategori COA sudah ada.', 'warning');
            return;
        }
        masterCOA.push(newName);
    }

    coaModal.classList.remove('active');
    saveApprovalData();
    renderMasterCOA();
    updateCOADatalist();
});

function renderMasterCOA() {
    const listContainer = document.getElementById('coaListGroup');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (masterCOA.length === 0) {
        listContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem;">Belum ada COA.</div>';
        return;
    }

    masterCOA.forEach(coa => {
        const div = document.createElement('div');
        div.style.cssText = `
                padding: 12px 15px; 
                background: rgba(255,255,255,0.05); 
                border: 1px solid var(--glass-border); 
                border-radius: 8px; 
                display: flex; justify-content: space-between; align-items: center;
            `;

        const title = document.createElement('div');
        title.textContent = coa;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';

        const btnEdit = document.createElement('button');
        btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
        btnEdit.className = 'btn admin-only';
        btnEdit.style.cssText = 'padding: 5px 8px; font-size: 0.75rem; background: transparent; color: var(--text-muted); box-shadow: none;';
        btnEdit.onmouseover = () => btnEdit.style.color = '#fff';
        btnEdit.onmouseout = () => btnEdit.style.color = 'var(--text-muted)';
        btnEdit.onclick = () => {
            document.getElementById('coa-modal-title').textContent = 'Edit Kategori COA';
            document.getElementById('coa_old_name').value = coa;
            document.getElementById('coa_name').value = coa;
            coaModal.classList.add('active');
        };

        const btnDel = document.createElement('button');
        btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnDel.className = 'btn admin-only';
        btnDel.style.cssText = 'padding: 5px 8px; font-size: 0.75rem; background: transparent; color: var(--danger); box-shadow: none;';
        btnDel.onmouseover = () => btnDel.style.background = 'rgba(239, 68, 68, 0.2)';
        btnDel.onmouseout = () => btnDel.style.background = 'transparent';
        btnDel.onclick = async () => {
            const ok = await window.showConfirm({
                title: 'Hapus COA',
                message: `Yakin ingin menghapus COA <b>${coa}</b>?`,
                type: 'danger'
            });
            if (ok) {
                masterCOA = masterCOA.filter(c => c !== coa);
                saveApprovalData();
                renderMasterCOA();
                updateCOADatalist();
            }
        };

        actions.appendChild(btnEdit);
        actions.appendChild(btnDel);
        div.appendChild(title);
        div.appendChild(actions);
        listContainer.appendChild(div);
    });
    checkAdminVisibility();
}

function updateCOADatalist() {
    const datalist = document.getElementById('coa-datalist');
    if (!datalist) return;
    datalist.innerHTML = '';

    masterCOA.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        datalist.appendChild(opt);
    });
}

document.getElementById('btn-close-atasan')?.addEventListener('click', () => {
    atasanModal.classList.remove('active');
});

document.getElementById('atasan-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const sel = document.getElementById('atasan_input').value.trim();
    if (!sel || !activeKategoriId) return;

    const pipeline = getActivePipeline();

    // Cek duplikasi berurutan (boleh duplikat kalau tidak bersebelahan, tapi lebih baik cegah saja)
    if (pipeline.includes(sel)) {
        showToast('Role/Jabatan ini sudah ada di dalam rute.', 'warning');
        return;
    }

    pipeline.push(sel);
    atasanModal.classList.remove('active');
    saveApprovalData();
    renderFlowBuilder();
});

function renderKategoriList() {
    const listGroup = document.getElementById('kategoriListGroup');
    if (!listGroup) return;
    listGroup.innerHTML = '';

    if (allApprovalData._order.length === 0) {
        listGroup.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem;">Belum ada Tipe Pengajuan.</div>';
        document.getElementById('flowBuilderActive').style.display = 'none';
        document.getElementById('flowBuilderEmpty').style.display = 'flex';
        return;
    }

    allApprovalData._order.forEach(kat => {
        const div = document.createElement('div');
        const isActive = kat === activeKategoriId;
        div.style.cssText = `
                padding: 12px 15px; 
                background: ${isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)'}; 
                border: 1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}; 
                border-radius: 8px; 
                display: flex; justify-content: space-between; align-items: center; 
                cursor: pointer; transition: all 0.2s;
            `;

        div.onclick = (e) => {
            if (e.target.closest('button')) return;
            activeKategoriId = kat;
            renderKategoriList();
            renderFlowBuilder();
        };

        const title = document.createElement('div');
        title.textContent = kat;
        title.style.fontWeight = isActive ? '600' : '400';
        if (isActive) title.style.color = 'var(--primary)';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';

        const btnDel = document.createElement('button');
        btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnDel.className = 'btn admin-only';
        btnDel.style.cssText = 'padding: 5px 8px; font-size: 0.75rem; background: transparent; color: var(--danger); box-shadow: none;';
        btnDel.onmouseover = () => btnDel.style.background = 'rgba(239, 68, 68, 0.2)';
        btnDel.onmouseout = () => btnDel.style.background = 'transparent';
        btnDel.onclick = async () => {
            if (allApprovalData._order.length <= 1) {
                showToast('Minimal harus ada 1 Tipe Pengajuan.', 'warning');
                return;
            }
            const ok = await window.showConfirm({
                title: 'Hapus Tipe Pengajuan',
                message: `Yakin ingin menghapus kategori <b>${kat}</b>?<br>Seluruh rute approval-nya akan terhapus.`,
                type: 'danger'
            });
            if (ok) {
                delete allApprovalData[kat];
                allApprovalData._order = allApprovalData._order.filter(k => k !== kat);

                if (activeKategoriId === kat) activeKategoriId = allApprovalData._order[0];
                saveApprovalData();
                renderKategoriList();
                renderFlowBuilder();
            }
        };

        actions.appendChild(btnDel);
        div.appendChild(title);
        div.appendChild(actions);
        listGroup.appendChild(div);
    });
}

function renderFlowBuilder() {
    if (!activeKategoriId) {
        document.getElementById('flowBuilderActive').style.display = 'none';
        document.getElementById('flowBuilderEmpty').style.display = 'flex';
        return;
    }

    document.getElementById('flowBuilderEmpty').style.display = 'none';
    document.getElementById('flowBuilderActive').style.display = 'block';
    document.getElementById('activeKategoriTitle').textContent = activeKategoriId;

    const cardsContainer = document.getElementById('flowBuilderCards');
    cardsContainer.innerHTML = '';

    const pipeline = getActivePipeline();

    pipeline.forEach((role, index) => {
        if (index > 0) {
            const arrow = document.createElement('div');
            arrow.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
            arrow.style.color = 'var(--text-muted)';
            cardsContainer.appendChild(arrow);
        }

        const card = document.createElement('div');
        const isPemohon = index === 0;
        card.style.cssText = `background: ${isPemohon ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-glass)'}; border: 1px solid ${isPemohon ? 'var(--primary)' : 'var(--glass-border)'}; padding: 15px 20px; border-radius: 10px; text-align: center; position: relative; min-width: 150px;`;
        card.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:5px;">${isPemohon ? 'PEMOHON' : 'APPROVER ' + index}</div><div style="font-weight:600;">${role}</div>`;

        const btnDel = document.createElement('button');
        btnDel.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        btnDel.className = 'admin-only';
        btnDel.style.cssText = 'position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: var(--danger); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; box-shadow: 0 2px 5px rgba(0,0,0,0.5);';
        btnDel.onclick = () => {
            pipeline.splice(index, 1);
            saveApprovalData();
            renderFlowBuilder();
        };

        card.appendChild(btnDel);
        cardsContainer.appendChild(card);
    });

    // Add Button Card
    if (pipeline.length > 0) {
        const arrowAdd = document.createElement('div');
        arrowAdd.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
        arrowAdd.style.color = 'var(--text-muted)';
        cardsContainer.appendChild(arrowAdd);
    }

    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn admin-only';
    btnAdd.innerHTML = `<i class="fa-solid fa-plus"></i> Tambah ${pipeline.length === 0 ? 'Pemohon' : 'Urutan'}`;
    btnAdd.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px dashed var(--glass-border); box-shadow: none; display: inline-flex;';
    btnAdd.onclick = () => {
        document.getElementById('atasan_input').value = '';
        atasanModal.classList.add('active');
    };
    cardsContainer.appendChild(btnAdd);

    // Re-check admin visibility for new elements
    checkAdminVisibility();
}

function renderMermaidDiagram() {
    const container = document.getElementById('mermaidContainer');
    if (!container) return;

    let sessionRole = '';
    try {
        const session = localStorage.getItem('erp_session');
        if (session) sessionRole = JSON.parse(session).role;
    } catch (e) { }

    if (!allApprovalData._order || allApprovalData._order.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); padding-top: 10vh;">Belum ada rute approval untuk kategori ini. Silakan atur di Tab Pengaturan Rute.</div>';
        return;
    }

    let graphDef = 'graph TD\n';
    const sanitizeNode = (name) => name.replace(/[^a-zA-Z0-9]/g, '');
    let hasEdges = false;
    let isSessionInvolved = false;

    allApprovalData._order.forEach((kat, i) => {
        const pipeline = allApprovalData[kat] || [];
        if (pipeline.length === 0) return;

        // Subgraph for each category
        const subId = `sub_${i}`;
        // Use sanitizeNode for the title to avoid syntax errors in Mermaid 11.15.0
        const katLabel = sanitizeNode(kat);
        graphDef += `  subgraph ${subId} [${katLabel}]\n`;

        if (pipeline.length === 1) {
            const node = sanitizeNode(`${kat}_${pipeline[0]}`);
            graphDef += `    ${node}["${pipeline[0]}"]\n`;
            if (pipeline[0] === sessionRole) isSessionInvolved = true;
        } else {
            for (let j = 0; j < pipeline.length - 1; j++) {
                const nodeA = sanitizeNode(`${kat}_${pipeline[j]}`);
                const nodeB = sanitizeNode(`${kat}_${pipeline[j + 1]}`);

                if (!graphDef.includes(`${nodeA}["${pipeline[j]}"]`)) {
                    graphDef += `    ${nodeA}["${pipeline[j]}"]\n`;
                }
                if (!graphDef.includes(`${nodeB}["${pipeline[j + 1]}"]`)) {
                    graphDef += `    ${nodeB}["${pipeline[j + 1]}"]\n`;
                }

                graphDef += `    ${nodeA} --> ${nodeB}\n`;
                hasEdges = true;

                if (pipeline[j] === sessionRole || pipeline[j + 1] === sessionRole) {
                    isSessionInvolved = true;
                }
            }
        }
        graphDef += `  end\n`;
    });

    if (!hasEdges && allApprovalData._order.every(k => (allApprovalData[k] || []).length === 0)) {
        container.innerHTML = '<div style="color:var(--text-muted); padding-top: 10vh;">Rute approval kosong. Silakan atur di Tab Pengaturan Rute.</div>';
        return;
    }

    if (sessionRole) {
        graphDef += `\n  classDef highlight fill:#3b82f666,stroke:#3b82f6,stroke-width:2px,color:#fff;\n`;

        allApprovalData._order.forEach(kat => {
            const pipeline = allApprovalData[kat] || [];
            pipeline.forEach(role => {
                if (role === sessionRole) {
                    const rNode = sanitizeNode(`${kat}_${role}`);
                    graphDef += `  class ${rNode} highlight\n`;
                }
            });
        });
    }

    // Custom ERPORION theme for mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
            primaryColor: 'rgba(255,255,255,0.05)',
            primaryTextColor: '#f8fafc',
            primaryBorderColor: 'rgba(255,255,255,0.2)',
            lineColor: '#94a3b8',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a'
        },
        flowchart: {
            curve: 'basis'
        }
    });

    container.innerHTML = `<div class="mermaid">${graphDef}</div>`;
    try {
        const renderPromise = mermaid.run ? mermaid.run({ querySelector: '.mermaid' }) : mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        if (renderPromise && renderPromise.catch) {
            renderPromise.catch(error => {
                console.error('Mermaid render error (promise):', error);
                container.innerHTML = '<div style="color:var(--danger); padding-top: 10vh;">Gagal me-render diagram. Ada kesalahan sintaks.</div>';
            });
        }
    } catch (error) {
        console.error('Mermaid render error:', error);
        container.innerHTML = '<div style="color:var(--danger); padding-top: 10vh;">Gagal me-render diagram.</div>';
    }
}

// --- MASTER CUSTOMER ---
let customerData = [];

async function loadCustomerData(isBackgroundSync = false) {
    const tbody = document.getElementById('table-customer');
    if (!tbody) return;
    if (!isBackgroundSync) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    }

    const response = await window.ERPAPI.request('get_customers');
    if (response.status === 'success' && response.data) {
        customerData = response.data;
        renderCustomerTable();
    } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Gagal memuat data customer</td></tr>';
    }
}

function renderCustomerTable() {
    const tbody = document.getElementById('table-customer');
    const searchInput = document.getElementById('search-customer');
    const query = searchInput ? searchInput.value.toLowerCase() : '';

    let filtered = customerData.filter(c => {
        return (c.id_customer || '').toLowerCase().includes(query) || (c.nama_customer || '').toLowerCase().includes(query);
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Tidak ada data customer.</td></tr>';
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement('tr');
        let actionBtns = `<button class="btn btn-edit-customer" data-id="${c.id_customer}" data-nama="${c.nama_customer}" data-alamat="${c.alamat_keterangan || c['alamat_/_keterangan'] || ''}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>`;
        
        const session = localStorage.getItem('erp_session');
        const user = session ? JSON.parse(session) : {};
        const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));
        
        if (isAdmin) {
            actionBtns += `<button class="btn btn-delete-customer" data-id="${c.id_customer}" data-nama="${c.nama_customer}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>`;
        }

        tr.innerHTML = `
            <td>${c.id_customer || '-'}</td>
            <td style="font-weight: 500;">${c.nama_customer || '-'}</td>
            <td>${c.alamat_keterangan || c['alamat_/_keterangan'] || '-'}</td>
            <td>${c.tanggal_terdaftar || '-'}</td>
            <td>${actionBtns}</td>
        `;
        tr.style.cursor = 'pointer';
        tr.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', e => e.stopPropagation());
        });
        tr.addEventListener('click', () => {
            openCustomerDetail(c);
        });
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit-customer').forEach(btn => {
        btn.addEventListener('click', e => {
            const b = e.currentTarget;
            document.getElementById('customer-modal-title').textContent = 'Edit Customer';
            document.getElementById('c_id').value = b.getAttribute('data-id');
            document.getElementById('c_nama').value = b.getAttribute('data-nama');
            document.getElementById('c_alamat').value = b.getAttribute('data-alamat');
            document.getElementById('customer-modal').classList.add('active');
        });
    });

    document.querySelectorAll('.btn-delete-customer').forEach(btn => {
        btn.addEventListener('click', async e => {
            const id = e.currentTarget.getAttribute('data-id');
            const nama = e.currentTarget.getAttribute('data-nama');
            const ok = await showConfirm({
                title: 'Hapus Customer',
                message: `Yakin ingin menghapus customer <strong>${nama}</strong>?<br><span style="font-size:0.8rem; color:rgba(255,255,255,0.5);">Aksi ini tidak dapat dibatalkan.</span>`,
                icon: '🗑️', confirmText: 'Hapus', cancelText: 'Batal'
            });
            if (ok) {
                // Optimistic Delete
                const tr = e.currentTarget.closest('tr');
                if (tr) tr.style.display = 'none';

                if (typeof showToast !== 'undefined') showToast('Menghapus Customer di background...', 'info');
                
                window.ERPAPI.request('delete_customer', { id }).then(res => {
                    if (res.status === 'success') {
                        if (typeof showToast !== 'undefined') showToast('✅ Customer berhasil dihapus!', 'success');
                        loadCustomerData(true);
                    } else {
                        if (typeof showToast !== 'undefined') showToast('❌ Gagal: ' + (res.message || 'Gagal menghapus customer'), 'danger');
                        loadCustomerData(true); // Revert
                    }
                });
            }
        });
    });
}

document.getElementById('search-customer')?.addEventListener('input', renderCustomerTable);

document.getElementById('btn-add-customer')?.addEventListener('click', () => {
    document.getElementById('customer-modal-title').textContent = 'Tambah Customer Baru';
    document.getElementById('customer-form').reset();
    document.getElementById('c_id').value = '';
    document.getElementById('customer-modal').classList.add('active');
});

document.getElementById('btn-close-customer-modal')?.addEventListener('click', () => {
    document.getElementById('customer-modal').classList.remove('active');
});

document.getElementById('customer-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    document.getElementById('customer-modal').classList.remove('active');
    
    const payload = {
        id: document.getElementById('c_id').value,
        nama: document.getElementById('c_nama').value,
        alamat: document.getElementById('c_alamat').value
    };
    
    // Optimistic Save
    const isEdit = !!payload.id;
    const tbody = document.getElementById('table-customer');
    if (tbody) {
        if (!isEdit) {
            const tr = document.createElement('tr');
            tr.style.opacity = '0.6';
            tr.innerHTML = `
                <td><i class="fa-solid fa-spinner fa-spin"></i></td>
                <td style="font-weight: 500;">${payload.nama}</td>
                <td>${payload.alamat}</td>
                <td>Hari ini</td>
                <td><span class="badge badge-warning">Menyimpan...</span></td>
            `;
            tbody.insertBefore(tr, tbody.firstChild);
        } else {
            const rows = tbody.querySelectorAll('.btn-edit-customer');
            const targetRow = Array.from(rows).find(btn => btn.getAttribute('data-id') === payload.id)?.closest('tr');
            if (targetRow) {
                targetRow.style.opacity = '0.5';
                const cells = targetRow.querySelectorAll('td');
                if (cells.length > 2) {
                    cells[1].textContent = payload.nama;
                    cells[2].textContent = payload.alamat;
                }
            }
        }
    }
    
    if (typeof showToast !== 'undefined') showToast('Sinkronisasi Customer ke server...', 'info');
    
    window.ERPAPI.request('save_customer', payload).then(res => {
        if(res.status === 'success') {
            if (typeof showToast !== 'undefined') showToast('✅ Customer berhasil disinkronisasi!', 'success');
            loadCustomerData(true);
        } else {
            if (typeof showToast !== 'undefined') showToast('❌ Gagal: ' + (res.message || 'Gagal menyimpan customer'), 'danger');
            loadCustomerData(true);
        }
    });
});

let currentDetailItem = null;

async function openDetailPenawaran(item) {
    currentDetailItem = item;
    
    document.getElementById('detail-modal-title').textContent = 'Detail Penawaran: ' + (item.no_penawaran || '-');
    document.getElementById('detail_status').value = item.status || 'Penawaran';
    
    document.getElementById('detail_customer').textContent = item.customer || '-';
    document.getElementById('detail_tanggal').textContent = item.tanggal || '-';
    document.getElementById('detail_narasi').textContent = item.narasi || '-';
    
    document.getElementById('detail_total_harga').textContent = 'Rp ' + (parseInt(String(item.total_harga || '0').replace(/\D/g, '')) || 0).toLocaleString('id-ID');
    document.getElementById('detail_dp').textContent = 'Rp ' + (parseInt(String(item.down_payment || item.dp || '0').replace(/\D/g, '')) || 0).toLocaleString('id-ID');

    // Reset UI
    const bomCheckWrapper = document.getElementById('detail_bom_check_wrapper');
    const bomCheckContainer = document.getElementById('detail_bom_check_container');
    bomCheckWrapper.style.display = 'block';
    bomCheckContainer.innerHTML = '<p style="margin:0; color:#aaa;">Memeriksa ketersediaan stok material...</p>';
    
    document.getElementById('detail-penawaran-modal').classList.add('active');

    // Render items
    const tbody = document.getElementById('detail_items_tbody');
    tbody.innerHTML = '';
    
    let items = [];
    try {
        items = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : (item.rincian_item || []);
    } catch(e) {}

    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada item</td></tr>';
        bomCheckWrapper.style.display = 'none';
    } else {
        items.forEach(it => {
            const tr = document.createElement('tr');
            const qty = parseInt(it.qty || it.moq_pcs || 0);
            const harga = parseInt(it.harga || it.price_idr || 0);
            const subtotal = qty * harga;
            tr.innerHTML = `
                <td>${it.nama || it.part_name || '-'}</td>
                <td style="text-align: right;">${qty.toLocaleString('id-ID')}</td>
                <td style="text-align: right;">${harga.toLocaleString('id-ID')}</td>
                <td style="text-align: right; font-weight: 600;">${subtotal.toLocaleString('id-ID')}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Process BOM Check
    let hasShortage = false;
    let allCustom = true;

    if (items && items.length > 0) {
        // Fetch if empty
        if (cachedBOMData.length === 0 || cachedInventoryData.length === 0) {
            const [resBom, resInv] = await Promise.all([
                window.ERPAPI.request('get_bom'),
                window.ERPAPI.request('get_inventory')
            ]);
            if (resBom.status === 'success' && resBom.data) cachedBOMData = resBom.data;
            if (resInv.status === 'success' && resInv.data) cachedInventoryData = resInv.data;
        }

        // Aggregate materials
        const aggregatedMaterials = {};
        
        items.forEach(it => {
            const partName = String(it.nama || it.part_name || '').trim().toLowerCase();
            const reqQty = parseInt(it.qty || it.moq_pcs || 0);
            
            const matchedBom = cachedBOMData.find(b => String(b.nama_barang).trim().toLowerCase() === partName);
            if (matchedBom) {
                allCustom = false;
                let matArray = [];
                try {
                    matArray = typeof matchedBom.rincian_material === 'string' ? JSON.parse(matchedBom.rincian_material) : matchedBom.rincian_material;
                } catch(e) {}

                if (matArray && matArray.length > 0) {
                    matArray.forEach(m => {
                        const matCode = m.kode || 'UNKNOWN';
                        const matName = m.nama || 'Material Tidak Diketahui';
                        const qtyPerUnit = m.qty || 1;
                        const totalReqQty = qtyPerUnit * reqQty;
                        
                        if (!aggregatedMaterials[matCode]) {
                            aggregatedMaterials[matCode] = { nama: matName, reqQty: 0 };
                        }
                        aggregatedMaterials[matCode].reqQty += totalReqQty;
                    });
                }
            }
        });

        if (allCustom) {
            bomCheckContainer.innerHTML = '<span style="color:var(--warning);"><i class="fa-solid fa-circle-info"></i> Seluruh produk Custom atau tidak terdaftar di Master BOM.</span>';
        } else if (Object.keys(aggregatedMaterials).length === 0) {
            bomCheckContainer.innerHTML = '<span style="color:var(--warning);"><i class="fa-solid fa-circle-info"></i> Tidak ada rincian material pada BOM produk-produk ini.</span>';
        } else {
            let html = '';
            Object.keys(aggregatedMaterials).forEach(kode => {
                const mat = aggregatedMaterials[kode];
                const invItem = cachedInventoryData.find(inv => inv.kode_material === kode);
                const currentStock = invItem ? parseInt(invItem.stok || 0) : 0;
                const shortage = mat.reqQty - currentStock;

                if (shortage > 0) {
                    hasShortage = true;
                    html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color: var(--danger);">
                            <span><i class="fa-solid fa-triangle-exclamation"></i> ${kode} | ${mat.nama}</span>
                            <span>Butuh: <strong>${mat.reqQty.toLocaleString('id-ID')}</strong> (Stok: ${currentStock.toLocaleString('id-ID')}, <strong>Kurang: ${shortage.toLocaleString('id-ID')}</strong>)</span>
                        </div>`;
                } else {
                    html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color: var(--success);">
                            <span><i class="fa-solid fa-check"></i> ${kode} | ${mat.nama}</span>
                            <span>Butuh: <strong>${mat.reqQty.toLocaleString('id-ID')}</strong> (Stok: ${currentStock.toLocaleString('id-ID')}, Cukup)</span>
                        </div>`;
                }
            });
            bomCheckContainer.innerHTML = html;
        }
    }

    const actionDiv = document.getElementById('detail-action-produksi');
    const btnPO = document.getElementById('btn-detail-po');
    
    if ((item.status || '').toLowerCase() === 'approved') {
        actionDiv.style.display = 'flex';
        
        // Show PR Barang button if there's a shortage
        if (hasShortage) {
            btnPO.style.display = 'inline-flex';
        } else {
            btnPO.style.display = 'none';
        }

        document.getElementById('btn-detail-spk').onclick = (e) => {
            e.stopPropagation();
            document.querySelector(`.btn-spk-penawaran[data-item*="${item.no_penawaran}"]`)?.click();
            document.getElementById('detail-penawaran-modal').classList.remove('active');
        };
        btnPO.onclick = (e) => {
            e.stopPropagation();
            document.querySelector(`.btn-po-penawaran[data-item*="${item.no_penawaran}"]`)?.click();
            document.getElementById('detail-penawaran-modal').classList.remove('active');
        };
    } else {
        actionDiv.style.display = 'none';
    }
}

document.getElementById('btn-update-detail-status')?.addEventListener('click', async () => {
    if (!currentDetailItem) return;
    const newStatus = document.getElementById('detail_status').value;
    
    const payload = { ...currentDetailItem, status: newStatus };
    
    showToast('Memperbarui status...', 'info');
    document.getElementById('detail-penawaran-modal').classList.remove('active');
    
    const res = await window.ERPAPI.request('save_penawaran', payload);
    if (res.status === 'success') {
        showToast('Status berhasil diperbarui!', 'success');
        loadPenawaranData();
    } else {
        showToast(res.message || 'Gagal mengupdate status', 'danger');
    }
});

});

// Global event listener for table row clicks to trigger detail/edit actions
document.addEventListener('click', (e) => {
    const tr = e.target.closest('tbody tr');
    if (!tr) return;

    // Ignore if clicking a button, input, link, or badge (like status badges)
    if (e.target.closest('button, .btn, input, select, textarea, a, .badge')) return;

    // Find the primary action button in this row
    // Prioritize Detail buttons over Edit buttons
    const actionBtn = tr.querySelector('.btn-detail-po, .btn-detail-bom, .btn-detail-penawaran');
    
    if (actionBtn) {
        actionBtn.click();
    }
});

// === DETAIL MODALS FUNCTIONS ===
function openStockDetail(item) {
    const content = document.getElementById('stock-detail-content');
    const isKritis = item.stok < 10;
    content.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; padding:1rem; background:rgba(255,255,255,0.04); border-radius:10px;">
            <div><div style="font-size:0.75rem; color:var(--text-muted);">KODE</div><div style="font-weight:600;">${item.kode || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">NAMA BARANG</div><div style="font-weight:600;">${item.nama || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">STOK</div><div><span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')} ${item.satuan || ''}</span></div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">HARGA</div><div style="font-weight:600; color:var(--primary);">Rp ${parseInt(item.harga || 0).toLocaleString('id-ID')}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">LOKASI GUDANG</div><div style="font-weight:600;">${item.lokasi || '-'}</div></div>
            <div style="grid-column:1/-1;"><div style="font-size:0.75rem; color:var(--text-muted);">SPESIFIKASI</div><div>${item.spesifikasi || '-'}</div></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem;">
            <button class="btn" onclick="document.getElementById('stock-detail-modal').classList.remove('active'); document.querySelector('.btn-edit-stock[data-kode=\\'${item.kode}\\']')?.click()" style="background:var(--accent);"><i class="fa-solid fa-pen"></i> Edit</button>
        </div>
    `;
    document.getElementById('stock-detail-modal').classList.add('active');
}

function openCustomerDetail(item) {
    const content = document.getElementById('customer-detail-content');
    content.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; padding:1rem; background:rgba(255,255,255,0.04); border-radius:10px;">
            <div><div style="font-size:0.75rem; color:var(--text-muted);">ID CUSTOMER</div><div style="font-weight:600;">${item.id_customer || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">NAMA CUSTOMER</div><div style="font-weight:600;">${item.nama_customer || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">TANGGAL TERDAFTAR</div><div style="font-weight:600;">${item.tanggal_terdaftar || '-'}</div></div>
            <div style="grid-column:1/-1;"><div style="font-size:0.75rem; color:var(--text-muted);">ALAMAT / KETERANGAN</div><div>${item.alamat_keterangan || item['alamat_/_keterangan'] || '-'}</div></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem;">
            <button class="btn" onclick="document.getElementById('customer-detail-modal').classList.remove('active'); document.querySelector('.btn-edit-customer[data-id=\\'${item.id_customer}\\']')?.click()" style="background:var(--accent);"><i class="fa-solid fa-pen"></i> Edit</button>
        </div>
    `;
    document.getElementById('customer-detail-modal').classList.add('active');
}

function openBarangJadiDetail(item) {
    const content = document.getElementById('barang-jadi-detail-content');
    const isKritis = parseInt(item.stok) < 5;
    content.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; padding:1rem; background:rgba(255,255,255,0.04); border-radius:10px;">
            <div><div style="font-size:0.75rem; color:var(--text-muted);">KODE BARANG</div><div style="font-weight:600;">${item.kode_barang || item.kode || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">NAMA BARANG</div><div style="font-weight:600;">${item.nama_barang || item.nama || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">STOK</div><div><span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')}</span></div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">HARGA JUAL</div><div style="font-weight:600; color:var(--primary);">Rp ${parseInt(item.harga_jual || 0).toLocaleString('id-ID')}</div></div>
            <div style="grid-column:1/-1;"><div style="font-size:0.75rem; color:var(--text-muted);">LOKASI GUDANG</div><div style="font-weight:600;">${item.lokasi_gudang || item.lokasi || '-'}</div></div>
        </div>
    `;
    document.getElementById('barang-jadi-detail-modal').classList.add('active');
}

function openSPKDetail(item) {
    const content = document.getElementById('spk-detail-content');
    content.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; padding:1rem; background:rgba(255,255,255,0.04); border-radius:10px;">
            <div><div style="font-size:0.75rem; color:var(--text-muted);">NO SPK</div><div style="font-weight:600;">${item.no_spk || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">TANGGAL</div><div style="font-weight:600;">${item.tanggal || '-'}</div></div>
            <div style="grid-column:1/-1;"><div style="font-size:0.75rem; color:var(--text-muted);">BARANG JADI</div><div style="font-weight:600;">${item.kode_barang_jadi || item.kode_barang || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">QTY PRODUKSI</div><div style="font-weight:600;">${item.qty_produksi || item.qty || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">STATUS</div><div><span class="badge badge-success">${item.status || '-'}</span></div></div>
        </div>
    `;
    document.getElementById('spk-detail-modal').classList.add('active');
}

function openUserDetail(item) {
    const content = document.getElementById('user-detail-content');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; color:var(--text-main); font-size:1.2rem;">${item.nama_lengkap || item.nama || item.username}</h3>
            <span class="badge badge-success">${item.role}</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr; gap:1rem; padding:1rem; background:rgba(255,255,255,0.04); border-radius:10px; margin-bottom:1.5rem;">
            <div><div style="font-size:0.75rem; color:var(--text-muted);">USERNAME</div><div style="font-weight:600;">${item.username}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">NAMA LENGKAP</div><div style="font-weight:600;">${item.nama_lengkap || item.nama || '-'}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted);">ROLE AKSES</div><div style="font-weight:600;">${item.role}</div></div>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button class="btn admin-only" onclick="document.getElementById('user-detail-modal').classList.remove('active'); document.querySelector('.btn-edit-user[data-username=\\'${item.username}\\']')?.click()" style="background:var(--accent);"><i class="fa-solid fa-pen"></i> Edit</button>
        </div>
    `;
    document.getElementById('user-detail-modal').classList.add('active');
}

document.getElementById('btn-close-stock-detail')?.addEventListener('click', () => document.getElementById('stock-detail-modal').classList.remove('active'));
document.getElementById('btn-close-customer-detail')?.addEventListener('click', () => document.getElementById('customer-detail-modal').classList.remove('active'));
document.getElementById('btn-close-user-detail')?.addEventListener('click', () => document.getElementById('user-detail-modal').classList.remove('active'));
document.getElementById('btn-close-barang-jadi-detail')?.addEventListener('click', () => document.getElementById('barang-jadi-detail-modal').classList.remove('active'));
document.getElementById('btn-close-spk-detail')?.addEventListener('click', () => document.getElementById('spk-detail-modal').classList.remove('active'));
