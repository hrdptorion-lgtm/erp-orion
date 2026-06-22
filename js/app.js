document.addEventListener('DOMContentLoaded', () => {

    // --- SHA-256 Hashing Utility (untuk hash password di browser) ---
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    window.sha256 = sha256;

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

    document.getElementById('edit-barang-jadi-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            kode_barang: document.getElementById('edit_bj_kode').value,
            nama_barang: document.getElementById('edit_bj_nama').value,
            stok: document.getElementById('edit_bj_stok').value,
            lokasi_gudang: document.getElementById('edit_bj_lokasi').value
        };
        const btn = e.target.querySelector('button[type="submit"]');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btn.disabled = true;

        const response = await window.ERPAPI.request('edit_barang_jadi', payload);
        btn.innerHTML = ogText;
        btn.disabled = false;

        if (response.status === 'success') {
            showToast?.(`✅ ${response.message}`, 'success', 3000);
            document.getElementById('edit-barang-jadi-modal').classList.remove('active');
            loadBarangJadiData();
        } else {
            showToast?.(`❌ ${response.message}`, 'error', 5000);
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
    // Login Handling
    const loginForm = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function (e) {
            const passwordInput = document.getElementById('login-password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    }

    if (loginForm) {
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

    async function checkSession() {
        const session = localStorage.getItem('erp_session');
        if (session) {
            let user = JSON.parse(session);
            applyUserSession(user);

            // Auto sync permissions in background
            try {
                const rolePermRes = await window.ERPAPI.request('get_role_permissions', { role: user.role });
                if (rolePermRes.status === 'success') {
                    user.permissions = rolePermRes.data;
                    localStorage.setItem('erp_session', JSON.stringify(user));
                    applyUserSession(user);
                }
            } catch (e) {
                console.log('Background RBAC sync failed', e);
            }
        } else {
            loginOverlay.classList.add('active');
        }
    }
    window.checkSession = checkSession;

    // Background interval to sync RBAC across devices without overloading server (every 2 minutes)
    setInterval(async () => {
        // Only sync if tab is active/visible
        if (document.visibilityState === 'visible') {
            const session = localStorage.getItem('erp_session');
            if (session) {
                try {
                    let user = JSON.parse(session);
                    const rolePermRes = await window.ERPAPI.request('get_role_permissions', { role: user.role });
                    if (rolePermRes.status === 'success') {
                        // Check if permissions actually changed to avoid unnecessary UI updates
                        if (JSON.stringify(user.permissions) !== JSON.stringify(rolePermRes.data)) {
                            user.permissions = rolePermRes.data;
                            localStorage.setItem('erp_session', JSON.stringify(user));
                            applyUserSession(user);
                        }
                    }
                } catch (e) {
                    console.log('Interval RBAC sync failed', e);
                }
            }
        }
    }, 120000); // 120,000 ms = 2 menit

    function applyUserSession(user) {
        loginOverlay.classList.remove('active');
        userNameDisplay.textContent = user.nama;
        userRoleDisplay.textContent = user.role;
        userAvatarInitial.textContent = user.nama.charAt(0).toUpperCase();

        // Role-based Access Control Fallback
        const isPurchasing = user.role.toLowerCase().includes('purchasing');
        const isProduksi = user.role.toLowerCase().includes('produksi') || user.role.toLowerCase().includes('gudang');
        const isFinance = user.role.toLowerCase().includes('finance') || user.role.toLowerCase().includes('accounting');
        const isSales = user.role.toLowerCase().includes('marketing');
        const isAdmin = ['direktur', 'admin', 'management'].some(r => user.role.toLowerCase().includes(r));
        const isSuperAdmin = ['super admin'].some(r => user.role.toLowerCase().includes(r));

        const hasPermissions = user.permissions && Object.keys(user.permissions).length > 0;

        navItems.forEach(item => {
            const target = item.getAttribute('data-target');
            item.style.display = 'flex'; // Reset display

            // Selalu tampilkan dashboard dan profil untuk semua user
            if (target === 'dashboard' || target === 'profil') return;

            if (hasPermissions) {
                // Menu khusus super admin
                if (item.classList.contains('super-admin-only')) {
                    item.style.display = isSuperAdmin ? 'flex' : 'none';
                    return;
                }

                // Menu pengaturan (admin-only class)
                if (item.classList.contains('admin-only')) {
                    item.style.display = isAdmin ? 'flex' : 'none';
                    return;
                }

                // Gunakan RBAC dari database
                if (user.permissions[target] && user.permissions[target].can_view === false) {
                    item.style.display = 'none';
                } else if (!user.permissions[target]) {
                    // Jika tidak ada di DB Hak Akses, default hidden (kecuali admin)
                    item.style.display = isAdmin ? 'flex' : 'none';
                }
            } else {
                // Fallback jika DB Hak Akses kosong
                if (!isAdmin) {
                    if (isPurchasing && !['dashboard', 'purchasing', 'po-internal', 'supplier'].includes(target)) item.style.display = 'none';
                    if (isProduksi && !['dashboard', 'produksi', 'bom', 'grn', 'surat-jalan', 'barang-jadi'].includes(target)) item.style.display = 'none';
                    if (isFinance && !['dashboard', 'finance', 'invoice', 'laporan-kas', 'coa'].includes(target)) item.style.display = 'none';
                    if (isSales && !['dashboard', 'sales', 'po-customer', 'customer'].includes(target)) item.style.display = 'none';
                    if (item.classList.contains('admin-only')) item.style.display = 'none';
                } else {
                    if (item.classList.contains('admin-only')) item.style.display = 'flex';
                }

                if (item.classList.contains('super-admin-only')) {
                    item.style.display = isSuperAdmin ? 'flex' : 'none';
                }
            }
        });

        // Apply RBAC to Bottom Nav Items on Mobile
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            const target = item.getAttribute('data-target');
            if (!target) return; // Profil has no target, always show

            if (target === 'dashboard' || target === 'menu-more') {
                item.style.display = 'flex'; // always show
                return;
            }

            if (hasPermissions) {
                if (target === 'menu-finance') {
                    // Check if they have access to any finance child
                    const hasFinanceAccess = ['finance', 'invoice', 'laporan-kas'].some(k => user.permissions[k] && user.permissions[k].can_view !== false);
                    item.style.display = hasFinanceAccess ? 'flex' : 'none';
                } else {
                    if (user.permissions[target] && user.permissions[target].can_view === false) {
                        item.style.display = 'none';
                    } else if (!user.permissions[target]) {
                        item.style.display = isAdmin ? 'flex' : 'none';
                    } else {
                        item.style.display = 'flex';
                    }
                }
            } else {
                // Fallback logic
                if (!isAdmin) {
                    if (target === 'menu-finance' && !isFinance) item.style.display = 'none';
                    if (target === 'sales' && !isSales) item.style.display = 'none';
                } else {
                    item.style.display = 'flex';
                }
            }
        });

        // Restore saved page — use hash first (from browser URL), then localStorage
        // save=false to avoid re-writing history on initial restore
        const hashView = location.hash.replace('#', '').trim();
        const savedView = hashView || localStorage.getItem('erp_active_view') || 'dashboard';

        // Check if the target nav is visible for this user
        const targetNav = document.querySelector(`.nav-item[data-target="${savedView}"]`);
        const isVisible = targetNav && targetNav.style.display !== 'none';
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
    window.formatRibuan = function (numStr) {
        let clean = String(numStr).replace(/\D/g, '');
        if (!clean) return '';
        return parseInt(clean, 10).toLocaleString('id-ID');
    };

    window.formatRupiah = function (num) {
        if (!num) return 'Rp 0';
        return 'Rp ' + window.formatRibuan(num);
    };

    window.parseRupiah = function (str) {
        if (!str) return 0;
        let clean = String(str).replace(/[^\d]/g, '');
        return parseInt(clean, 10) || 0;
    };

    window.parseRibuan = window.parseRupiah;

    document.addEventListener('input', (e) => {
        if (e.target.classList && e.target.classList.contains('number-format')) {
            e.target.value = window.formatRibuan(e.target.value);
        }
    });

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const passwordRaw = document.getElementById('login-password').value;

        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        btnSubmit.disabled = true;
        loginError.style.display = 'none';

        // Hash password di browser sebelum dikirim ke server
        const hashedPassword = await sha256(passwordRaw);
        const res = await window.ERPAPI.request('login', { username, password: hashedPassword });

        btnSubmit.innerHTML = 'Masuk <i class="fa-solid fa-arrow-right-to-bracket"></i>';
        btnSubmit.disabled = false;

        if (res.status === 'success') {
            // Simpan token autentikasi SEGERA sebelum request lain
            if (res.token) {
                localStorage.setItem('erp_token', res.token);
            }

            const permissions = res.permissions || {};

            const userSession = { username, role: res.role, nama: res.nama, permissions };
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
    window.handleLogoutClick = handleLogoutClick;

    btnLogout?.addEventListener('click', handleLogoutClick);
    document.getElementById('btn-logout-mobile')?.addEventListener('click', handleLogoutClick);

    document.getElementById('btn-cancel-logout')?.addEventListener('click', () => {
        logoutModal.classList.remove('active');
    });

    document.getElementById('btn-confirm-logout')?.addEventListener('click', () => {
        logoutModal.classList.remove('active');
        localStorage.removeItem('erp_session');
        localStorage.removeItem('erp_token');
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
        'finance': { title: 'Finance & Kasir', sub: 'Mutasi Kasir dan Petty Cash.' },
        'laporan-kas': { title: 'Laporan Kas', sub: 'Monitoring aliran dana masuk dan keluar.' },
        'admin': { title: 'Manajemen Pengguna', sub: 'Pengaturan Role Akses Aplikasi.' },
        'profil': { title: 'Profil Perusahaan', sub: 'Informasi dasar identitas perusahaan.' },
        'coa': { title: 'Kategori COA & Akuntansi', sub: 'Master data pos biaya akuntansi.' },
        'approval': { title: 'Alur Approval', sub: 'Pengaturan hierarki dan rute persetujuan.' },
        'barang-jadi': { title: 'Inventori Barang Jadi', sub: 'Stok produk jadi siap kirim / jual.' },
        'customer': { title: 'Master Customer', sub: 'Database referensi klien / customer perusahaan.' },
        'po-customer': { title: 'PO Customer', sub: 'Purchase Order dari Customer.' },
        'po-internal': { title: 'Permintaan Belanja', sub: 'Pengajuan Purchase Order Internal.' },
        'surat-jalan': { title: 'Surat Jalan (DO)', sub: 'Delivery Order dan Pengiriman.' },
        'invoice': { title: 'Invoice Penagihan', sub: 'Daftar tagihan ke customer.' },
        'supplier': { title: 'Data Supplier', sub: 'Database vendor dan pemasok.' },
        'menu-produk': { title: 'Produk & Logistik', sub: 'Silakan pilih menu manajemen produk dan logistik.' },
        'menu-pengaturan': { title: 'Pengaturan', sub: 'Pengaturan konfigurasi dan hak akses sistem.' },
        'menu-more': { title: 'Menu Lainnya', sub: 'Pilihan menu tambahan.' },
        'menu-lainnya': { title: 'Lainnya', sub: 'Menu lainnya' }
    };

    // --- Core View Switcher (must be defined before event listeners & checkSession) ---
    function switchView(targetViewId, save = true) {
        if (!targetViewId) return;
        if (targetViewId === 'pengaturan') targetViewId = 'menu-pengaturan';

        // Persist
        if (save) {
            localStorage.setItem('erp_active_view', targetViewId);
            if (location.hash !== '#' + targetViewId) {
                history.pushState({ page: targetViewId }, '', '#' + targetViewId);
            }
        }

        // Update active nav link
        document.querySelectorAll('.nav-item').forEach(nav => {
            if (nav.id === 'menu-produk-toggle' || nav.id === 'menu-pengaturan-toggle' || nav.id === 'menu-finance-toggle') return;
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
                } else if (parentSubmenu.id === 'submenu-finance') {
                    document.getElementById('menu-finance-toggle').classList.add('open');
                }
            }
        });

        // Switch visible view panel
        let activeViewNode = null;
        views.forEach(view => {
            view.classList.remove('active');
            if (view.id === `view-${targetViewId}`) {
                view.classList.add('active');
                activeViewNode = view;
            }
        });

        // Apply RBAC to buttons immediately
        if (activeViewNode && targetViewId !== 'admin' && targetViewId !== 'rbac' && targetViewId !== 'profil' && targetViewId !== 'dashboard') {
            if (typeof window.applyRBACToButtons === 'function') {
                window.applyRBACToButtons(targetViewId, activeViewNode);
            }
        }

        // Update header text
        if (titles[targetViewId]) {
            pageTitle.textContent = titles[targetViewId].title;
            pageSubtitle.textContent = titles[targetViewId].sub;
        }



        // Load data
        if (targetViewId === 'purchasing') loadPurchasingData();
        else if (targetViewId === 'admin') loadAdminData();
        else if (targetViewId === 'sales') loadPenawaranData();
        else if (targetViewId === 'po-customer') loadPOCustomerData();
        else if (targetViewId === 'bom') loadBOMData();
        else if (targetViewId === 'produksi') loadProduksiData();
        else if (targetViewId === 'po-internal') loadPOInternalData();
        else if (targetViewId === 'transaksi-gudang') loadTransaksiGudangData();
        else if (targetViewId === 'barang-jadi') loadBarangJadiData();
        else if (targetViewId === 'profil') loadSettingsData();
        else if (targetViewId === 'coa') loadCOAData();
        else if (targetViewId === 'approval') loadApprovalData();
        else if (targetViewId === 'customer') loadCustomerData();
        else if (targetViewId === 'supplier') loadSupplierData();
        else if (targetViewId === 'surat-jalan') loadSuratJalanData();
        else if (targetViewId === 'invoice') loadInvoiceData();
        else if (targetViewId === 'dashboard') loadDashboardData();
        else if (targetViewId === 'rbac') loadRBACData();
        else if (targetViewId === 'grn') loadGRNData();
        else if (targetViewId === 'finance') loadCOAData();
        else if (targetViewId === 'laporan-kas') loadLaporanKasData();

        if (typeof updateGlobalFAB === 'function') updateGlobalFAB(targetViewId);
    }

    window.switchView = switchView;

    async function loadDashboardData() {
        try {
            // Jalankan request secara paralel untuk mempercepat loading
            const [poReq, rmReq, pnwReq, bomReq] = await Promise.allSettled([
                window.ERPAPI.request('get_po_internal'),
                window.ERPAPI.request('get_stock'),
                window.ERPAPI.request('get_penawaran'),
                window.ERPAPI.request('get_bom')
            ]);

            if (poReq.status === 'fulfilled' && poReq.value.status === 'success' && poReq.value.data) {
                const poOut = poReq.value.data.filter(p => String(p.status).toUpperCase() !== 'SELESAI').length;
                const poEl = document.getElementById('dashboard-po');
                if (poEl) poEl.textContent = poOut;
            }

            if (rmReq.status === 'fulfilled' && rmReq.value.status === 'success' && rmReq.value.data) {
                const rmKritis = rmReq.value.data.filter(s => parseFloat(s.stok) <= 10).length; // Stok <= 10 dianggap kritis
                const rmEl = document.getElementById('dashboard-rm');
                if (rmEl) rmEl.textContent = rmKritis;
            }

            if (pnwReq.status === 'fulfilled' && pnwReq.value.status === 'success' && pnwReq.value.data) {
                const invUnpaid = pnwReq.value.data.filter(p => String(p.status).toUpperCase() === 'PENAWARAN').length;
                const invEl = document.getElementById('dashboard-invoice');
                if (invEl) invEl.textContent = invUnpaid;
            }

            if (bomReq.status === 'fulfilled' && bomReq.value.status === 'success' && bomReq.value.data) {
                const bmoCount = bomReq.value.data.length;
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
            if (item.id === 'menu-finance-toggle') {
                item.classList.toggle('open');
                document.getElementById('submenu-finance').classList.toggle('open');
                return; // Do not switch view for parent menu
            }
            switchView(item.getAttribute('data-target'));
        });
    });

    // NOW initialize session — event listeners & switchView are ready
    checkSession();

    // --- History Navigation (Popstate & Hardware Back) ---
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            switchView(e.state.page, false);
        } else {
            const hashView = location.hash.replace('#', '').trim();
            if (hashView) {
                switchView(hashView, false);
            }
        }
    });

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', () => {
            const mainPages = ['dashboard', 'sales', 'finance', 'menu-more'];
            const currentView = localStorage.getItem('erp_active_view') || 'dashboard';
            if (mainPages.includes(currentView)) {
                window.Capacitor.Plugins.App.exitApp();
            } else {
                window.history.back();
            }
        });
    }

    // --- UI Interactions (Theme, Profile, Mobile Nav) ---
    const handleMyProfile = () => {
        const user = JSON.parse(localStorage.getItem('erp_session') || '{}');
        openUserModal('Profil Saya', user);
        document.getElementById('sheet-more')?.classList.remove('active');
        document.getElementById('sheet-overlay')?.classList.remove('active');
        const profileMenu = document.getElementById('profile-action-menu');
        if (profileMenu) profileMenu.style.display = 'none';
    };
    window.handleMyProfile = handleMyProfile;

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

    // Bottom sheets removed, grid views replace them.

    // Global FAB Logic
    function updateGlobalFAB(viewId) {
        // Mappings for FAB per view
        const fabMappings = {
            'purchasing': [
                { id: 'btn-add-stock', label: 'Tambah Bahan', icon: 'fa-plus', color: 'var(--secondary)' },
                { id: 'btn-import-stock', label: 'Import Data', icon: 'fa-file-import', color: 'var(--info)' },
                { id: 'btn-export-stock', label: 'Export Data', icon: 'fa-file-export', color: 'var(--warning)' }
            ],
            'transaksi-gudang': [{ id: 'btn-add-transaksi', label: 'Buat Transaksi', icon: 'fa-plus', color: 'var(--secondary)' }],
            'sales': [{ id: 'btn-add-penawaran', label: 'Buat Penawaran', icon: 'fa-plus', color: 'var(--secondary)' }],
            'po-customer': [{ id: 'btn-add-po-customer', label: 'Buat PO dari Penawaran', icon: 'fa-plus', color: 'var(--secondary)' }],
            'surat-jalan': [{ id: 'btn-add-surat-jalan', label: 'Buat Surat Jalan Manual', icon: 'fa-plus', color: 'var(--accent)' }],
            'po-internal': [{ id: 'btn-add-po-internal', label: 'Buat Pengajuan', icon: 'fa-plus', color: 'var(--primary)' }],
            'bom': [{ id: 'btn-add-bom', label: 'Buat BOM Baru', icon: 'fa-plus', color: 'var(--accent)' }],
            'produksi': [{ id: 'btn-run-spk', label: 'Selesaikan SPK', icon: 'fa-play', color: 'var(--secondary)' }],
            'finance': [{ id: 'btn-add-cash', label: 'Mutasi Kas', icon: 'fa-plus', color: 'var(--primary)' }],
            'coa': [{ id: 'btn-add-coa', label: 'Tambah COA', icon: 'fa-plus', color: 'var(--primary)' }],
            'admin': [{ id: 'btn-add-user', label: 'Tambah User', icon: 'fa-plus', color: 'var(--primary)' }],
            'customer': [{ id: 'btn-add-customer', label: 'Tambah Customer', icon: 'fa-plus', color: 'var(--primary)' }],
            'supplier': [{ id: 'btn-add-supplier', label: 'Tambah Supplier', icon: 'fa-plus', color: 'var(--primary)' }],
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
        let actions = fabMappings[viewId];

        // Check RBAC to see if user is allowed to ADD
        // Admin, rbac, and profil don't use this strict RBAC check in the same way, but let's check for standard views
        if (viewId !== 'admin' && viewId !== 'rbac' && viewId !== 'profil' && viewId !== 'dashboard') {
            const canAdd = typeof window.checkRBACAction === 'function' ? window.checkRBACAction('can_add', viewId) : true;
            if (!canAdd) {
                // If they can't add, clear all actions that start with btn-add
                actions = actions ? actions.filter(a => !a.id.startsWith('btn-add')) : [];
            }
        }

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
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
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
                let actionBtns = `<button class="btn btn-edit-stock" data-kode="${item.kode}" data-nama="${item.nama}" data-stok="${item.stok}" data-satuan="${item.satuan || ''}" data-lokasi="${item.lokasi}" data-harga="${item.harga || 0}" data-spesifikasi="${item.spesifikasi || ''}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;" title="Edit Bahan Baku"><i class="fa-solid fa-pen"></i></button>`;

                const session = localStorage.getItem('erp_session');
                const user = session ? JSON.parse(session) : {};
                const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));

                if (isAdmin) {
                    actionBtns += `<button class="btn btn-delete-stock" data-kode="${item.kode}" data-nama="${item.nama}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;" title="Hapus Bahan Baku"><i class="fa-solid fa-trash"></i></button>`;
                }

                tr.innerHTML = `
                    <td>${item.kode}</td>
                    <td style="font-weight: 500;">${item.nama}</td>
                    <td style="white-space: nowrap !important;">
                        <span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')} ${item.satuan || ''}</span>
                    </td>
                    <td style="white-space: nowrap !important;">Rp ${parseInt(item.harga || 0).toLocaleString('id-ID')}</td>
                    <td>${item.lokasi}</td>
                    <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
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
        document.getElementById('f_stok').value = data && data.stok ? window.formatRibuan(data.stok) : '';
        document.getElementById('f_satuan').value = data && data.satuan ? data.satuan : '';
        document.getElementById('f_lokasi').value = data ? data.lokasi : '';
        document.getElementById('f_harga').value = data && data.harga ? window.formatRibuan(data.harga) : '';
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

        const csvFile = new Blob([csv.join('\n')], { type: "text/csv" });
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
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
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
                else if (item.status === 'Parsial') { badgeClass = 'badge-warning'; badgeIcon = '📦'; }

                let actionBtns = `<button class="btn btn-detail-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--accent);" title="Lihat Detail"><i class="fa-solid fa-eye"></i> Detail</button>`;
                actionBtns += `<button class="btn btn-print-po" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background:var(--info);" title="Print PO"><i class="fa-solid fa-print"></i></button>`;

                if (item.status === 'Menunggu Approval' && isAtasan) {
                    actionBtns += `<button class="btn btn-approve-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;" title="Approve"><i class="fa-solid fa-check"></i></button>`;
                    actionBtns += `<button class="btn btn-reject-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var(--danger); margin-right: 5px;" title="Tolak"><i class="fa-solid fa-times"></i></button>`;
                } else if ((item.status === 'Disetujui (Sedang Dibelikan)' || item.status === 'Parsial') && isPurchasing) {
                    actionBtns += `<button class="btn btn-grn-po" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var(--secondary); margin-right: 5px;" title="Terima Barang (GRN)"><i class="fa-solid fa-truck"></i> Terima</button>`;
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
                    <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
                `;
                tbody.appendChild(tr);
            });

            // Event delegation
            tbody.querySelectorAll('.btn-grn-po').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemStr = e.currentTarget.getAttribute('data-item');
                    if (itemStr) {
                        const item = JSON.parse(itemStr);
                        openGRNModal(item);
                    }
                });
            });

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

            tbody.querySelectorAll('.btn-delete-po').forEach(btn => {
                btn.addEventListener('click', (e) => deletePOInternal(btn.getAttribute('data-no'), e.currentTarget.closest('tr')));
            });
        }
    }

    function openGRNModal(item) {
        document.getElementById('grn-no-po').textContent = item.no_po;
        document.getElementById('grn_no_po_input').value = item.no_po;
        
        const tbody = document.getElementById('grn-items-tbody');
        tbody.innerHTML = '';
        
        let items = [];
        try {
            items = typeof item.items_parsed === 'object' ? item.items_parsed : JSON.parse(item.items || '[]');
        } catch(e){}

        items.forEach((it, idx) => {
            const qtyPesan = parseFloat(it.qty) || 0;
            const qtyTerima = parseFloat(it.qty_received) || 0;
            const sisa = Math.max(0, qtyPesan - qtyTerima);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${it.kode || '-'}</strong><br>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${it.nama || '-'}</span>
                    <input type="hidden" name="grn_kode[]" value="${it.kode || ''}">
                </td>
                <td style="text-align: center;">${qtyPesan} ${it.satuan || ''}</td>
                <td style="text-align: center; color: var(--success);">${qtyTerima}</td>
                <td>
                    <input type="number" name="grn_qty_in[]" class="form-control" style="width: 100px; padding: 0.2rem 0.5rem;" min="0" max="${sisa}" value="${sisa > 0 ? sisa : 0}" ${sisa === 0 ? 'readonly' : ''} step="any">
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('grn-modal').classList.add('active');
    }

    document.querySelector('.btn-close-grn')?.addEventListener('click', () => {
        document.getElementById('grn-modal').classList.remove('active');
    });

    document.getElementById('grn-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const no_po = document.getElementById('grn_no_po_input').value;
        const form = e.target;
        const kodes = form.querySelectorAll('input[name="grn_kode[]"]');
        const qtys = form.querySelectorAll('input[name="grn_qty_in[]"]');
        
        const receivedItems = [];
        for(let i=0; i<kodes.length; i++) {
            const q = parseFloat(qtys[i].value) || 0;
            if (q > 0) {
                receivedItems.push({ kode: kodes[i].value, qty_in: q });
            }
        }
        
        if (receivedItems.length === 0) {
            alert('Tidak ada jumlah barang masuk yang diisi.');
            return;
        }

        const btnSubmit = document.getElementById('btn-save-grn');
        const oldHtml = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;

        const res = await window.ERPAPI.request('process_grn', {
            no_po: no_po,
            received_items: receivedItems
        });

        btnSubmit.innerHTML = oldHtml;
        btnSubmit.disabled = false;

        alert(res.message);
        if (res.status === 'success') {
            document.getElementById('grn-modal').classList.remove('active');
            loadPOInternalData();
            loadPurchasingData(); // Reload stock
            loadTransaksiGudangData(); // Reload history
        }
    });

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
        document.getElementById('print_po_address').textContent = info.po_alamat || '-';
        document.getElementById('print_po_attn').textContent = info.po_attn || '-';

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
        let infoTambahan = {};
        try { infoTambahan = item.info_tambahan ? JSON.parse(item.info_tambahan) : {}; } catch (e) { }

        document.getElementById('po-detail-title').textContent = `Detail: ${noPO}`;

        const totalEst = parseInt(item.total_estimasi || 0);
        let statusClass = 'badge-warning';
        if (item.status?.includes('Disetujui') || item.status?.includes('Selesai')) statusClass = 'badge-success';
        if (item.status === 'Ditolak') statusClass = 'badge-danger';

        const itemsHtml = items.map((it, i) => `
            <tr>
                <td style="padding:0.5rem;">${i + 1}</td>
                <td style="padding:0.5rem; font-weight:500;">${it.nama}</td>
                <td style="padding:0.5rem; text-align:right;">${it.qty} ${it.satuan || 'pcs'}</td>
                <td style="padding:0.5rem; text-align:right;">Rp ${parseInt(it.harga || 0).toLocaleString('id-ID')}</td>
                <td style="padding:0.5rem; text-align:right; color:var(--info);">Rp ${parseInt(it.harga_aktual || 0).toLocaleString('id-ID')}</td>
                <td style="padding:0.5rem; text-align:right; font-weight:600;">Rp ${(parseInt(it.qty || 0) * parseInt(it.harga || 0)).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        document.getElementById('po-detail-content').innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; padding:1rem; background:rgba(255,255,255,0.04); border-radius:10px;">
                <div><div style="font-size:0.72rem; color:var(--text-muted);">PEMOHON</div><div style="font-weight:600;">${item.pemohon || '-'}</div></div>
                <div><div style="font-size:0.72rem; color:var(--text-muted);">TANGGAL</div><div style="font-weight:600;">${item.tanggal || '-'}</div></div>
                <div><div style="font-size:0.72rem; color:var(--text-muted);">STATUS</div><div><span class="badge ${statusClass}">${item.status}</span></div></div>
                ${item.disetujui_oleh ? `<div><div style="font-size:0.72rem; color:var(--text-muted);">DISETUJUI OLEH</div><div style="font-weight:600;">${item.disetujui_oleh} <span style="font-size:0.8rem;color:var(--text-muted);">(${item.tanggal_approve || ''})</span></div></div>` : ''}
                ${infoTambahan.po_customer_ref ? `<div><div style="font-size:0.72rem; color:var(--text-muted);">REF PO CUSTOMER</div><div style="font-weight:600;">${infoTambahan.po_customer_ref}</div></div>` : ''}
                ${item.catatan ? `<div style="grid-column:1/-1;"><div style="font-size:0.72rem; color:var(--text-muted);">CATATAN</div><div>${item.catatan}</div></div>` : ''}
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.06);">
                        <th style="padding:0.5rem; text-align:left;">#</th>
                        <th style="padding:0.5rem; text-align:left;">Nama Barang</th>
                        <th style="padding:0.5rem; text-align:right;">Qty</th>
                        <th style="padding:0.5rem; text-align:right;">Harga Satuan</th>
                        <th style="padding:0.5rem; text-align:right;">Harga Aktual</th>
                        <th style="padding:0.5rem; text-align:right;">Subtotal (Est)</th>
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
            const harga = parseFloat(String(row.querySelector('.po-harga-aktual')?.value || '0').replace(/\./g, '').replace(',', '.')) || 0;
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
                <input type="text" class="po-harga number-format" placeholder="0" value="${harga}" readonly
                    style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem; text-align:right;">
            </td>
            <td style="padding:0.4rem;">
                <input type="text" class="po-harga-aktual number-format" placeholder="0" value="${harga}"
                    style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem; text-align:right;">
            </td>
            <td style="padding:0.4rem;">
                <input type="text" inputmode="numeric" class="po-qty" value="${qty}" placeholder="1"
                    style="width:100%; min-width:80px; padding:0.5rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:0.83rem; text-align:right;">
            </td>
                <input type="hidden" class="po-satuan" value="${satuan}">
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
                const hargaFormatted = parseInt(match.harga || 0).toLocaleString('id-ID');
                tr.querySelector('.po-harga').value = hargaFormatted;
                tr.querySelector('.po-harga-aktual').value = hargaFormatted;
                if (match.satuan) tr.querySelector('.po-satuan').value = match.satuan;
            }
            calculatePOTotal();
        });
        tr.querySelector('.po-harga').addEventListener('input', calculatePOTotal);
        tr.querySelector('.po-harga-aktual').addEventListener('input', calculatePOTotal);
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
        if (supplierData.length === 0) loadSupplierData(true);
        const session = localStorage.getItem('erp_session');
        const user = session ? JSON.parse(session) : {};
        document.getElementById('po-info-pemohon').textContent = user.nama || user.username || 'System';
        document.getElementById('po-info-tanggal').textContent = new Date().toLocaleString('id-ID');

        // Populate Ref PO Customer dropdown
        const refSelect = document.getElementById('po_customer_ref');
        if (refSelect) {
            const populateRef = (data) => {
                refSelect.innerHTML = '<option value="">-- Pilih PO Customer --</option>' +
                    data.map(po => `<option value="${po.id_po_customer}">${po.id_po_customer} - ${po.nama_customer || '-'}</option>`).join('');
            };
            if (window.poCustomerData && window.poCustomerData.length > 0) {
                populateRef(window.poCustomerData);
            } else {
                window.ERPAPI.request('get_po_customer').then(res => {
                    if (res.status === 'success') {
                        window.poCustomerData = res.data;
                        populateRef(res.data);
                    }
                });
            }
        }

        poForm.reset();
        poItemsTbody.innerHTML = '';
        addPOItemRow();
        calculatePOTotal();

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
            const kode = (row.querySelector('.po-kode')?.value || '').trim();
            const harga = parseFloat(String(row.querySelector('.po-harga')?.value || '0').replace(/\./g, '').replace(',', '.')) || 0;
            const harga_aktual = parseFloat(String(row.querySelector('.po-harga-aktual')?.value || '0').replace(/\./g, '').replace(',', '.')) || 0;
            const qty = parseFloat(row.querySelector('.po-qty')?.value) || 0;
            const satuan = row.querySelector('.po-satuan')?.value.trim() || 'pcs';

            if (!nama) { hasError = true; return; }
            if (qty <= 0) { hasError = true; return; }
            items.push({ kode, nama, harga, harga_aktual, qty, satuan });
        });

        if (hasError || items.length === 0) {
            showToast?.('❌ Pastikan semua baris terisi nama barang dan qty > 0', 'error');
            return;
        }

        const payload = {
            pemohon: user.nama || user.username || 'System',
            po_to: document.getElementById('po_to')?.value || '',
            po_attn: document.getElementById('po_attn')?.value || '',
            po_alamat: document.getElementById('po_alamat')?.value || '',
            po_customer_ref: document.getElementById('po_customer_ref')?.value || '',
            po_incoterm: document.getElementById('po_incoterm')?.value || '',
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
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
        }

        const response = await window.ERPAPI.request('get_barang_jadi');
        if (response.status === 'success' && response.data) {
            window.barangJadiData = response.data;
            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada data barang jadi.</td></tr>';
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
                    actionBtns = `
                <button class="btn btn-edit-barang-jadi" data-kode="${item.kode_barang || item.kode}" data-nama="${item.nama_barang || item.nama}" data-stok="${item.stok}" data-lokasi="${item.lokasi_gudang}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--warning); margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-reset-barang-jadi" data-kode="${item.kode_barang || item.kode}" data-nama="${item.nama_barang || item.nama}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--danger);"><i class="fa-solid fa-rotate-left"></i></button>
                `;
                } else {
                    actionBtns = '-';
                }

                tr.innerHTML = `
                    <td style="font-weight: 500;">${item.kode_barang || item.kode || '-'}</td>
                    <td>${item.nama_barang || item.nama || '-'}</td>
                    <td>
                        <span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')}</span>
                    </td>
                    <td>${item.lokasi_gudang || item.lokasi || '-'}</td>
                    <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
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
                    const btnEdit = tr.querySelector('.btn-edit-barang-jadi');
                    if (btnEdit) {
                        btnEdit.addEventListener('click', (e) => {
                            e.stopPropagation();
                            document.getElementById('edit_bj_kode').value = btnEdit.getAttribute('data-kode');
                            document.getElementById('edit_bj_nama').value = btnEdit.getAttribute('data-nama');
                            document.getElementById('edit_bj_stok').value = btnEdit.getAttribute('data-stok');
                            document.getElementById('edit_bj_lokasi').value = btnEdit.getAttribute('data-lokasi');
                            document.getElementById('edit-barang-jadi-modal').classList.add('active');
                        });
                    }

                    const btnReset = tr.querySelector('.btn-reset-barang-jadi');
                    if (btnReset) {
                        btnReset.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const kode = btnReset.getAttribute('data-kode');
                            const nama = btnReset.getAttribute('data-nama');
                            const ok = await showConfirm({
                                title: 'Reset Stok Barang Jadi',
                                message: `Yakin ingin mereset stok Barang Jadi <strong>${nama} (${kode})</strong> menjadi 0?`,
                                icon: '🔄', confirmText: 'Ya, Reset', cancelText: 'Batal'
                            });
                            if (!ok) return;

                            if (typeof showToast !== 'undefined') showToast('Mereset stok Barang Jadi...', 'info');
                            window.ERPAPI.request('edit_barang_jadi', { kode_barang: kode, stok: 0 }).then(res => {
                                if (res.status === 'success') {
                                    if (typeof showToast !== 'undefined') showToast(`✅ Stok ${nama} direset ke 0`, 'success');
                                    loadBarangJadiData(true);
                                } else {
                                    if (typeof showToast !== 'undefined') showToast('❌ Gagal mereset stok', 'error');
                                    loadBarangJadiData(true);
                                }
                            });
                        });
                    }
                }
            });
        }
    }


    // ==========================================
    // PO CUSTOMER LOGIC
    // ==========================================
    window.poCustomerData = [];

    async function loadPOCustomerData() {
        const tbody = document.getElementById('table-po-customer');
        if (!tbody) return;
        if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        }

        // Make sure penawaran is loaded for references
        // And load tracking data for Progress calculation
        const [resPoc, resPen, resSpk, resSj, resInv] = await Promise.all([
            window.ERPAPI.request('get_po_customer'),
            window.ERPAPI.request('get_penawaran'),
            window.ERPAPI.request('get_produksi'),
            window.ERPAPI.request('get_surat_jalan'),
            window.ERPAPI.request('get_invoices')
        ]);

        if (resPoc.status === 'success' && resPoc.data) {
            window.poCustomerData = resPoc.data.reverse();

            const spkList = resSpk.data || [];
            const sjList = resSj.data || [];
            const invList = resInv.data || [];

            tbody.innerHTML = '';
            if (window.poCustomerData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada data PO Customer.</td></tr>';
                return;
            }
            window.poCustomerData.forEach(item => {
                let progress = 0;
                let progressLabel = "PO Diterima";
                let progressColor = "var(--secondary)";

                const relatedSPK = spkList.filter(s => s.no_penawaran === item.no_penawaran || s.no_penawaran === item.id_po_customer);
                const relatedSJ = sjList.filter(s => s.no_penawaran === item.no_penawaran || s.no_penawaran === item.id_po_customer);
                const relatedInv = invList.filter(s => s.no_penawaran === item.no_penawaran || s.no_penawaran === item.id_po_customer);

                if (relatedInv.length > 0 && relatedInv.every(i => i.status_pembayaran === 'Lunas')) {
                    progress = 100;
                    progressLabel = "Lunas / Selesai";
                    progressColor = "var(--success)";
                } else if (relatedSJ.length > 0) {
                    progress = 75;
                    progressLabel = "Tahap Pengiriman";
                    progressColor = "var(--info)";
                } else if (relatedSPK.length > 0 && relatedSPK.every(s => s.status === 'Selesai')) {
                    progress = 50;
                    progressLabel = "Produksi Selesai";
                    progressColor = "#10b981"; // distinct green
                } else if (relatedSPK.length > 0) {
                    progress = 25;
                    progressLabel = "Proses Produksi";
                    progressColor = "var(--warning)";
                } else {
                    progress = 0;
                    progressLabel = "Menunggu SPK";
                    progressColor = "var(--text-muted)";
                }

                // UI Progress Bar
                const progressHtml = `
                    <div style="display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                            <span style="font-weight: 600; color: ${progressColor};">${progressLabel}</span>
                            <span>${progress}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                            <div style="width: ${progress}%; height: 100%; background: ${progressColor}; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                `;

                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.onclick = (e) => {
                    if (!e.target.closest('.btn') && !e.target.closest('a')) {
                        if (typeof openDetailPOCustomer === 'function') {
                            openDetailPOCustomer(item);
                        }
                    }
                };
                tr.innerHTML = `
                <td style="vertical-align: middle;">${progressHtml}</td>
                <td style="font-weight: 500;">${item.id_po_customer || '-'}</td>
                <td><span class="badge badge-info">${item.no_penawaran || '-'}</span></td>
                <td>${item.nama_customer || '-'}</td>
                <td>Rp ${window.formatRupiah(item.total_harga || 0)}</td>
                <td><span class="badge badge-${item.status === 'Selesai' ? 'success' : (item.status === 'Proses' ? 'warning' : 'info')}">${item.status || 'Pending'}</span></td>
                <td style="white-space: nowrap;">
                    <div style="display: flex; gap: 5px; flex-wrap: nowrap; align-items: center;">
                        <button class="btn btn-print" title="Cetak PO" onclick="printPOCustomer('${item.id_po_customer}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--info);"><i class="fa-solid fa-print"></i></button>
                        <button class="btn btn-edit" title="Edit" onclick="openPOCustomerModal('${item.id_po_customer}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--primary);"><i class="fa-solid fa-edit"></i></button>
                        <button class="btn btn-delete" title="Hapus" onclick="deletePOCustomer('${item.id_po_customer}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger);"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Gagal memuat data.</td></tr>';
        }
    }

    document.getElementById('btn-add-po-customer')?.addEventListener('click', async () => {
        document.getElementById('po-customer-modal').classList.add('active'); // Open immediately
        document.getElementById('po-customer-form').reset();
        document.getElementById('poc_file_pdf_existing').value = '';
        document.getElementById('poc_file_pdf_link').innerHTML = '';

        document.getElementById('poc_id').value = '';

        // Set default date to today
        const pocTanggal = document.getElementById('poc_tanggal');
        if (pocTanggal) {
            pocTanggal.value = new Date().toISOString().split('T')[0];
        }
        document.getElementById('poc-items-container').innerHTML = '';
        document.getElementById('poc_total_harga_display').innerText = '0';
        document.getElementById('poc_total_harga').value = '0';
        document.getElementById('po-customer-modal-title').innerText = 'Buat PO dari Penawaran';

        // Load Customers and Penawaran
        const custSel = document.getElementById('poc_customer_select');
        const sel = document.getElementById('poc_no_penawaran');
        if (custSel) {
            custSel.closest('.input-group').style.display = '';
            custSel.required = true;
        }
        if (custSel && custSel.tomselect) custSel.tomselect.destroy();
        if (sel && sel.tomselect) sel.tomselect.destroy();
        if (custSel) custSel.innerHTML = '<option value="">Memuat data...</option>';
        if (sel) sel.innerHTML = '<option value="">Memuat data...</option>';

        const penawaranRes = await window.ERPAPI.request('get_penawaran');
        let allApprovedPenawaran = [];
        if (penawaranRes.status === 'success' && penawaranRes.data) {
            allApprovedPenawaran = penawaranRes.data.filter(p => p.status === 'Approve' || p.status === 'Approved');
            if (custSel) custSel.innerHTML = '<option value="">Pilih Customer...</option>';
            if (sel) sel.innerHTML = '<option value="">Pilih Penawaran...</option>';
            const uniqueCustomers = [...new Set(allApprovedPenawaran.map(p => p.customer).filter(Boolean))];
            uniqueCustomers.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.text = c;
                if (custSel) custSel.appendChild(opt);
            });
        }

        if (custSel) {
            new TomSelect('#poc_customer_select', {
                create: false,
                onChange: function (value) {
                    if (sel.tomselect) sel.tomselect.destroy();
                    sel.innerHTML = '<option value="">Pilih Penawaran...</option>';
                    const filteredPenawaran = allApprovedPenawaran.filter(p => p.customer === value);
                    filteredPenawaran.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.no_penawaran;
                        opt.text = p.no_penawaran;
                        opt.dataset.customer = p.customer;
                        opt.dataset.items = JSON.stringify(p.rincian_item || []);
                        sel.appendChild(opt);
                    });
                    new TomSelect('#poc_no_penawaran', {
                        create: false,
                        onChange: function (val) {
                            const option = this.getOption(val);
                            if (option && option.dataset.items) {
                                document.getElementById('poc_customer').value = option.dataset.customer || '';
                                const items = JSON.parse(option.dataset.items);
                                document.getElementById('poc-items-container').innerHTML = '';
                                items.forEach(it => {
                                    addPOCustomerItemRow(it.nama_barang, it.qty, it.harga, it.satuan);
                                });
                                calculatePOCTotal();
                            }
                        }
                    });

                    if (window._pendingAutoFillPO && window._pendingAutoFillPO.no_penawaran) {
                        setTimeout(() => {
                            if (sel.tomselect) {
                                sel.tomselect.setValue(window._pendingAutoFillPO.no_penawaran);
                                window._pendingAutoFillPO = null;
                            }
                        }, 100);
                    }
                }
            });

            if (window._pendingAutoFillPO && window._pendingAutoFillPO.customer) {
                setTimeout(() => {
                    custSel.tomselect.setValue(window._pendingAutoFillPO.customer);
                }, 100);
            }
            // Ensure container is displayed
            custSel.closest('.input-group').style.display = 'block';
        }

        if (sel) new TomSelect('#poc_no_penawaran', { create: false });
    });

    document.getElementById('poc_no_penawaran')?.addEventListener('change', (e) => {
        const sel = e.target;
        const val = sel.value;
        if (!val) return;

        // Find the selected option to get datasets
        let opt = null;
        if (sel.tomselect) {
            const optionEl = sel.tomselect.getOption(val);
            // It's tricky to get dataset from TomSelect directly sometimes, better find original element
            const originalSelect = document.getElementById('poc_no_penawaran');
            for (let i = 0; i < originalSelect.options.length; i++) {
                if (originalSelect.options[i].value === val) opt = originalSelect.options[i];
            }
        } else {
            opt = sel.options[sel.selectedIndex];
        }

        if (opt) {
            document.getElementById('poc_customer').value = opt.dataset.customer || '';
            let items = [];
            try {
                let parsed = JSON.parse(opt.dataset.items || '[]');
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                if (Array.isArray(parsed)) items = parsed;
            } catch (e) {
                console.error('Error parsing items:', e);
            }
            renderPOCustomerItems(items);
        }
    });

    function renderPOCustomerItems(items) {
        const container = document.getElementById('poc-items-container');
        container.innerHTML = '';
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'poc-item-row';
            div.style.display = 'grid';
            div.style.gridTemplateColumns = '2fr 1fr 1fr 1fr';
            div.style.gap = '10px';
            div.style.marginBottom = '10px';
            div.style.alignItems = 'center';

            const nama = item.nama || item.part_name || '-';
            const harga = item.harga || item.price_idr || item.harga_satuan || 0;
            const qty = item.qty || item.moq_pcs || 1;

            div.innerHTML = `
            <input type="text" class="poc-item-nama" value="${nama}" readonly style="background:rgba(255,255,255,0.05);">
            <input type="text" class="poc-item-harga number-format" value="${window.formatRupiah(harga)}" readonly style="background:rgba(255,255,255,0.05);">
            <input type="number" class="poc-item-qty" value="${qty}" min="1" onchange="calculatePOCTotal()">
            <input type="text" class="poc-item-subtotal" value="${window.formatRupiah(harga * qty)}" readonly style="background:rgba(255,255,255,0.05); font-weight:bold;">
        `;
            container.appendChild(div);
        });
        calculatePOCTotal();
    }

    window.calculatePOCTotal = function () {
        let total = 0;
        const rows = document.querySelectorAll('.poc-item-row');
        rows.forEach(row => {
            const harga = window.parseRupiah(row.querySelector('.poc-item-harga').value);
            const qty = parseFloat(row.querySelector('.poc-item-qty').value) || 0;
            const subtotal = harga * qty;
            row.querySelector('.poc-item-subtotal').value = window.formatRupiah(subtotal);
            total += subtotal;
        });
        document.getElementById('poc_total_harga').value = total;
        document.getElementById('poc_total_harga_display').innerText = window.formatRupiah(total);
    };

    document.getElementById('btn-close-po-customer')?.addEventListener('click', () => {
        document.getElementById('po-customer-modal').classList.remove('active');
    });

    document.getElementById('po-customer-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btn.disabled = true;

        const items = [];
        document.querySelectorAll('.poc-item-row').forEach(row => {
            items.push({
                nama: row.querySelector('.poc-item-nama').value,
                harga: window.parseRupiah(row.querySelector('.poc-item-harga').value),
                qty: parseFloat(row.querySelector('.poc-item-qty').value)
            });
        });

        const payload = {
            id_po_customer: document.getElementById('poc_id').value,
            no_penawaran: document.getElementById('poc_no_penawaran').value,
            nama_customer: document.getElementById('poc_customer').value,
            tanggal_po: document.getElementById('poc_tanggal').value,
            item_po: items,
            total_harga: document.getElementById('poc_total_harga').value,
            status: document.getElementById('poc_status').value
        };

        const res = await window.ERPAPI.request('save_po_customer', payload);
        btn.innerText = originalText;
        btn.disabled = false;

        if (res.status === 'success') {
            window.showToast(res.message, 'success');
            document.getElementById('po-customer-modal').classList.remove('active');
            loadPOCustomerData();
        } else {
            window.showToast(res.message, 'error');
        }
    });

    window.openDetailPOCustomer = async function (item) {
        window.currentDetailPOC = item;
        // 1. Set Basic Info
        const infoDiv = document.getElementById('detail-poc-info');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <div><strong>No PO Customer:</strong> ${item.id_po_customer || '-'}</div>
                <div><strong>No Penawaran:</strong> ${item.no_penawaran || '-'}</div>
                <div><strong>Customer:</strong> ${item.nama_customer || item.customer || '-'}</div>
                <div><strong>Tanggal:</strong> ${item.tanggal_po || '-'}</div>
                <div><strong>Status:</strong> ${item.status || '-'}</div>
                <div><strong>Total Harga:</strong> Rp ${window.formatRupiah(item.total_harga || 0)}</div>
            `;
        }

        // 2. Set Items
        const itemsTbody = document.getElementById('detail-poc-items-tbody');
        let rincian = [];
        try {
            rincian = typeof item.item_po === 'string' ? JSON.parse(item.item_po) : item.item_po;
        } catch (e) { }

        if (itemsTbody) {
            itemsTbody.innerHTML = '';
            if (Array.isArray(rincian) && rincian.length > 0) {
                rincian.forEach(poItem => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${poItem.nama || poItem.nama_barang || '-'}</td>
                        <td>${poItem.qty || 1}</td>
                    `;
                    itemsTbody.appendChild(tr);
                });
            } else {
                itemsTbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Tidak ada rincian item.</td></tr>';
            }
        }

        const shortageTbody = document.getElementById('detail-poc-shortage-tbody');
        if (shortageTbody) {
            shortageTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Menghitung kebutuhan bahan baku...</td></tr>';
        }

        document.getElementById('detail-poc-modal').classList.add('active');

        // 3. Shortage Analysis
        try {
            const [resBom, resStock] = await Promise.all([
                window.ERPAPI.request('get_bom'),
                window.ERPAPI.request('get_stock')
            ]);
            const boms = resBom.data || [];
            const stocks = resStock.data || [];
            window.stockData = stocks;

            let totalShortageData = {};

            if (Array.isArray(rincian)) {
                rincian.forEach(poItem => {
                    const matchedBom = boms.find(b => String(b.nama_barang).trim().toLowerCase() === String(poItem.nama || poItem.nama_barang).trim().toLowerCase());
                    if (matchedBom) {
                        const mats = typeof matchedBom.rincian_material === 'string' ? JSON.parse(matchedBom.rincian_material) : (matchedBom.rincian_material || []);
                        mats.forEach(mat => {
                            const matName = (mat.nama || mat.nama_material || '').trim();
                            const reqQty = parseFloat(mat.qty || 0) * parseFloat(poItem.qty || 1);

                            if (!totalShortageData[matName]) {
                                const stockItem = stocks.find(s => (s.nama || s.nama_material || '').trim().toLowerCase() === matName.toLowerCase());
                                const currentStock = stockItem ? (parseFloat(String(stockItem.stok).replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0) : 0;
                                totalShortageData[matName] = {
                                    required: 0,
                                    stock: currentStock,
                                    satuan: mat.satuan || (stockItem ? stockItem.satuan : 'pcs')
                                };
                            }
                            totalShortageData[matName].required += reqQty;
                        });
                    }
                });
            }

            if (shortageTbody) {
                shortageTbody.innerHTML = '';
                window.currentShortageData = totalShortageData; // Expose globally for auto-fill
                const matKeys = Object.keys(totalShortageData);
                if (matKeys.length === 0) {
                    shortageTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Tidak ada material BOM yang terdeteksi.</td></tr>';
                } else {
                    matKeys.forEach(matName => {
                        const data = totalShortageData[matName];
                        const tr = document.createElement('tr');
                        const isShortage = data.required > data.stock;
                        const formatQty = (qty) => Number(qty).toLocaleString('id-ID');
                        const statusBadge = isShortage
                            ? `<span class="badge badge-danger">Kurang ${formatQty(data.required - data.stock)} ${data.satuan}</span>`
                            : `<span class="badge badge-success">Aman</span>`;

                        tr.innerHTML = `
                            <td>${matName}</td>
                            <td style="text-align: right;">${formatQty(data.required)} ${data.satuan}</td>
                            <td style="text-align: right;">${formatQty(data.stock)} ${data.satuan}</td>
                            <td style="text-align: center;">${statusBadge}</td>
                        `;
                        shortageTbody.appendChild(tr);
                    });
                }
            }
        } catch (e) {
            console.error(e);
            if (shortageTbody) {
                shortageTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--danger);">Gagal menghitung kebutuhan material.</td></tr>';
            }
        }

        // 4. End-to-End Tracking
        try {
            const [resProduksi, resSJ, resInv] = await Promise.all([
                window.ERPAPI.request('get_produksi'),
                window.ERPAPI.request('get_surat_jalan'),
                window.ERPAPI.request('get_invoices')
            ]);

            const spkList = resProduksi.data || [];
            const sjList = resSJ.data || [];
            const invList = resInv.data || [];

            // Find related records based on no_penawaran or id_po_customer
            const relatedSPK = spkList.filter(s => s.no_penawaran === item.no_penawaran || s.no_penawaran === item.id_po_customer);
            const relatedSJ = sjList.filter(s => s.no_penawaran === item.no_penawaran || s.no_penawaran === item.id_po_customer);
            const relatedInv = invList.filter(s => s.no_penawaran === item.no_penawaran || s.no_penawaran === item.id_po_customer);

            // SPK Status
            const spkStatusEl = document.getElementById('track-spk-status');
            const spkDescEl = document.getElementById('track-spk-desc');
            if (relatedSPK.length === 0) {
                if (spkStatusEl) spkStatusEl.innerHTML = `<span class="badge badge-secondary" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">Belum Ada SPK</span>`;
                if (spkDescEl) spkDescEl.innerText = '-';
            } else {
                const isProses = relatedSPK.some(s => s.status !== 'Selesai');
                if (isProses) {
                    if (spkStatusEl) spkStatusEl.innerHTML = `<span class="badge badge-warning" style="background: var(--warning); color: #000;">Dalam Proses</span>`;
                } else {
                    if (spkStatusEl) spkStatusEl.innerHTML = `<span class="badge badge-success">Selesai</span>`;
                }
                if (spkDescEl) spkDescEl.innerText = `${relatedSPK.length} SPK ditemukan`;
            }

            // SJ Status
            const sjStatusEl = document.getElementById('track-sj-status');
            const sjDescEl = document.getElementById('track-sj-desc');
            if (relatedSJ.length === 0) {
                if (sjStatusEl) sjStatusEl.innerHTML = `<span class="badge badge-secondary" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">Belum Ada DO</span>`;
                if (sjDescEl) sjDescEl.innerText = '-';
            } else {
                const isSelesai = relatedSJ.every(s => s.status === 'Selesai (Diterima)');
                if (isSelesai) {
                    if (sjStatusEl) sjStatusEl.innerHTML = `<span class="badge badge-success">Diterima Penuh</span>`;
                } else {
                    if (sjStatusEl) sjStatusEl.innerHTML = `<span class="badge badge-warning" style="background: var(--info); color: #fff;">Sedang Dikirim</span>`;
                }
                if (sjDescEl) sjDescEl.innerText = `${relatedSJ.length} Surat Jalan`;
            }

            // Invoice Status
            const invStatusEl = document.getElementById('track-inv-status');
            const invDescEl = document.getElementById('track-inv-desc');
            if (relatedInv.length === 0) {
                if (invStatusEl) invStatusEl.innerHTML = `<span class="badge badge-secondary" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">Belum Ditagih</span>`;
                if (invDescEl) invDescEl.innerText = '-';
            } else {
                const isPaid = relatedInv.every(s => s.status_pembayaran === 'Lunas');
                const isPartial = relatedInv.some(s => s.status_pembayaran === 'Sebagian');
                if (isPaid) {
                    if (invStatusEl) invStatusEl.innerHTML = `<span class="badge badge-success">Lunas</span>`;
                } else if (isPartial) {
                    if (invStatusEl) invStatusEl.innerHTML = `<span class="badge badge-warning" style="background: var(--warning); color: #000;">Dibayar Sebagian</span>`;
                } else {
                    if (invStatusEl) invStatusEl.innerHTML = `<span class="badge badge-danger">Belum Lunas</span>`;
                }
                if (invDescEl) invDescEl.innerText = `${relatedInv.length} Invoice`;
            }

        } catch (e) {
            console.error(e);
            const errBadge = `<span class="badge badge-danger">Gagal memuat</span>`;
            if (document.getElementById('track-spk-status')) document.getElementById('track-spk-status').innerHTML = errBadge;
            if (document.getElementById('track-sj-status')) document.getElementById('track-sj-status').innerHTML = errBadge;
            if (document.getElementById('track-inv-status')) document.getElementById('track-inv-status').innerHTML = errBadge;
        }
    };

    document.getElementById('btn-close-detail-poc')?.addEventListener('click', () => {
        document.getElementById('detail-poc-modal').classList.remove('active');
    });

    // Quick Action Listeners for PO Customer Detail
    document.getElementById('btn-detail-act-spk')?.addEventListener('click', () => {
        if (!window.currentDetailPOC) return;
        document.getElementById('detail-poc-modal').classList.remove('active');
        // Navigasi ke menu Produksi lalu buka form Tambah SPK
        document.querySelector('[data-target="produksi"]')?.click();
        setTimeout(() => {
            const btn = document.getElementById('btn-run-spk');
            if (btn) btn.click();

            setTimeout(() => {
                document.getElementById('spk_no_penawaran').value = window.currentDetailPOC.id_po_customer || window.currentDetailPOC.no_penawaran || '';
                document.getElementById('produksi-modal-title').textContent = 'SPK Produksi (Referensi PO: ' + (window.currentDetailPOC.id_po_customer || window.currentDetailPOC.no_penawaran) + ')';

                try {
                    const items = typeof window.currentDetailPOC.item_po === 'string' ? JSON.parse(window.currentDetailPOC.item_po) : (window.currentDetailPOC.item_po || []);
                    if (items.length > 0) {
                        const iname = String(items[0].nama || items[0].part_name || '').trim();
                        const qty = parseInt(items[0].qty || items[0].moq_pcs || 0);

                        const checkInterval = setInterval(() => {
                            const select = document.getElementById('spk_kode_jadi');
                            if (select && select.options.length > 1) {
                                clearInterval(checkInterval);
                                const opts = Array.from(select.options);
                                const match = opts.find(o => o.text.toLowerCase().includes(iname.toLowerCase()));
                                if (match) {
                                    if (select.tomselect) {
                                        select.tomselect.setValue(match.value);
                                    } else {
                                        select.value = match.value;
                                        select.dispatchEvent(new Event('change'));
                                    }
                                    document.getElementById('spk_qty_jadi').value = qty;
                                    document.getElementById('spk_qty_jadi').dispatchEvent(new Event('input'));
                                }
                            }
                        }, 200);
                        setTimeout(() => clearInterval(checkInterval), 5000);
                    }
                } catch (e) { }
            }, 300);
        }, 500);
    });

    document.getElementById('btn-detail-act-po')?.addEventListener('click', async () => {
        if (!window.currentDetailPOC) return;

        if (window.currentShortageData) {
            const keys = Object.keys(window.currentShortageData);
            const shortages = keys.filter(k => window.currentShortageData[k].required > window.currentShortageData[k].stock);
            if (shortages.length === 0) {
                const proceed = await window.showConfirm({
                    title: 'Stok Aman',
                    message: 'Stok semua bahan baku sudah aman. Tetap ingin membuat pengajuan belanja manual?',
                    confirmText: 'Lanjutkan',
                    cancelText: 'Batal',
                    type: 'info',
                    icon: '✅'
                });
                if (!proceed) return;
            }
        }

        document.getElementById('detail-poc-modal').classList.remove('active');
        // Navigasi ke Purchasing -> Pengajuan Belanja
        document.querySelector('[data-target="po-internal"]')?.click();
        setTimeout(() => {
            const btn = document.getElementById('btn-add-po-internal');
            if (btn) btn.click();
            // Pre-fill catatan & items
            setTimeout(() => {
                const notes = document.getElementById('po_catatan');
                if (notes) notes.value = 'Pengajuan belanja untuk produksi.';
                const ref = document.getElementById('po_customer_ref');
                if (ref) {
                    const pocId = window.currentDetailPOC?.id_po_customer || '';
                    if (pocId) {
                        // Check if option exists
                        let exists = Array.from(ref.options).some(opt => opt.value === pocId);
                        if (!exists) {
                            ref.insertAdjacentHTML('beforeend', `<option value="${pocId}">${pocId}</option>`);
                        }
                        ref.value = pocId;
                    }
                }

                // Pre-fill items based on shortage
                if (window.currentShortageData) {
                    const keys = Object.keys(window.currentShortageData);
                    const shortages = keys.filter(k => window.currentShortageData[k].required > window.currentShortageData[k].stock);
                    if (shortages.length > 0) {
                        const tbody = document.getElementById('po-items-tbody');
                        if (tbody) tbody.innerHTML = ''; // clear default empty row
                        shortages.forEach(matName => {
                            const data = window.currentShortageData[matName];
                            const kur = data.required - data.stock;

                            // Ambil harga dari master stock jika ada
                            let hargaEstimasi = '0';
                            if (window.stockData && Array.isArray(window.stockData)) {
                                const stockItem = window.stockData.find(s => s.nama.toLowerCase() === matName.toLowerCase());
                                if (stockItem && stockItem.harga) {
                                    const hargaNum = parseInt(String(stockItem.harga).replace(/\D/g, '')) || 0;
                                    hargaEstimasi = hargaNum.toLocaleString('id-ID');
                                }
                            }

                            if (typeof addPOItemRow === 'function') {
                                addPOItemRow('', matName, hargaEstimasi, kur, data.satuan);
                            }
                        });
                        if (typeof calculatePOTotal === 'function') calculatePOTotal();
                    }
                }
            }, 300);
        }, 500);
    });

    document.getElementById('btn-detail-act-sj')?.addEventListener('click', async () => {
        if (!window.currentDetailPOC) return;

        let isKosong = false;
        try {
            const items = typeof window.currentDetailPOC.item_po === 'string' ? JSON.parse(window.currentDetailPOC.item_po) : (window.currentDetailPOC.item_po || []);
            items.forEach(it => {
                const name = (it.nama || it.part_name || '').trim().toLowerCase();
                const fg = (window.barangJadiData || []).find(b => (b.nama_barang || b.nama || '').trim().toLowerCase() === name);
                const req = parseInt(it.qty || it.moq_pcs || 0);
                const st = fg ? parseInt(String(fg.stok).replace(/\D/g, '')) : 0;
                if (st < req) isKosong = true;
            });
        } catch (e) { }

        if (isKosong) {
            const proceed = await window.showConfirm({
                title: 'Stok Barang Jadi Kurang',
                message: 'Stok Barang Jadi masih kosong atau belum mencukupi untuk pesanan ini. Tetap ingin membuat Surat Jalan?',
                confirmText: 'Lanjutkan',
                cancelText: 'Batal',
                type: 'warning',
                icon: '⚠️'
            });
            if (!proceed) return;
        }

        document.getElementById('detail-poc-modal').classList.remove('active');
        // Navigasi ke Surat Jalan
        document.querySelector('[data-target="surat-jalan"]')?.click();
        setTimeout(() => {
            document.getElementById('surat-jalan-form').reset();
            document.getElementById('sj_no_penawaran').value = window.currentDetailPOC.id_po_customer || window.currentDetailPOC.no_penawaran || '';
            document.getElementById('sj_customer').value = window.currentDetailPOC.nama_customer || window.currentDetailPOC.customer || '';

            const tbody = document.getElementById('sj-items-tbody');
            if (tbody) {
                tbody.innerHTML = '';
                try {
                    const items = typeof window.currentDetailPOC.item_po === 'string' ? JSON.parse(window.currentDetailPOC.item_po) : (window.currentDetailPOC.item_po || []);
                    if (items.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada item</td></tr>';
                    } else {
                        items.forEach(it => {
                            const iname = String(it.nama || it.part_name || '').trim();
                            const fg = (window.barangJadiData || []).find(b => (b.nama_barang || b.nama || '').trim().toLowerCase() === iname.toLowerCase());
                            const st = fg ? parseInt(String(fg.stok).replace(/[^0-9-]/g, '')) : 0;
                            const qty = parseInt(it.qty || it.moq_pcs || 0);
                            const terkirim = parseInt(it.qty_delivered || 0);
                            const sisa = Math.max(0, qty - terkirim);
                            const defaultQty = Math.min(sisa, Math.max(0, st));
                            
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>
                                    ${iname}<br>
                                    <span style="font-size:0.75rem; color:var(--text-muted)">Stok Tersedia: <strong style="color: ${st > 0 ? 'var(--success)' : 'var(--danger)'}">${st.toLocaleString('id-ID')}</strong></span>
                                    <input type="hidden" class="sj-item-name" value="${iname}">
                                </td>
                                <td style="text-align: right;">${qty.toLocaleString('id-ID')}</td>
                                <td style="text-align: right; color: var(--success);">${terkirim.toLocaleString('id-ID')}</td>
                                <td>
                                    <input type="number" class="sj-item-qty" min="0" max="${Math.max(0, st)}" value="${defaultQty}" style="width: 100%; padding: 0.4rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--glass-border); border-radius: 4px;">
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                    }
                } catch (e) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Gagal memuat rincian item</td></tr>';
                }
            }

            document.getElementById('surat-jalan-modal').classList.add('active');
        }, 500);
    });

    document.getElementById('btn-detail-act-inv')?.addEventListener('click', () => {
        if (!window.currentDetailPOC) return;
        document.getElementById('detail-poc-modal').classList.remove('active');
        // Navigasi ke Invoice
        document.querySelector('[data-target="invoice"]')?.click();
        setTimeout(() => {
            document.getElementById('invoice-form').reset();
            document.getElementById('inv_no_penawaran').value = window.currentDetailPOC.no_penawaran || window.currentDetailPOC.id_po_customer || '';
            document.getElementById('inv_customer').value = window.currentDetailPOC.nama_customer || window.currentDetailPOC.customer || '';
            document.getElementById('inv_jumlah').value = window.currentDetailPOC.total_harga || 0;
            document.getElementById('invoice-modal').classList.add('active');
        }, 500);
    });

    window.openPOCustomerModal = function (id) {
        const item = window.poCustomerData.find(i => i.id_po_customer === id);
        if (!item) return;

        document.getElementById('po-customer-form').reset();
        document.getElementById('poc_file_pdf_existing').value = '';
        document.getElementById('poc_file_pdf_link').innerHTML = '';

        document.getElementById('poc_id').value = item.id_po_customer;
        document.getElementById('po-customer-modal-title').innerText = 'Edit PO Customer';

        const sel = document.getElementById('poc_no_penawaran');
        const custSel = document.getElementById('poc_customer_select');

        // Hide customer select during Edit
        if (custSel) {
            custSel.closest('.input-group').style.display = 'none';
            custSel.required = false;
        }

        if (sel && sel.tomselect) sel.tomselect.destroy();
        if (sel) sel.innerHTML = `<option value="${item.no_penawaran}">${item.no_penawaran}</option>`;
        if (sel) new TomSelect('#poc_no_penawaran', { create: false });

        document.getElementById('poc_customer').value = item.nama_customer || '';

        let tgl = '';
        if (item.tanggal_po) {
            const parts = item.tanggal_po.split('/');
            if (parts.length === 3) tgl = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        document.getElementById('poc_tanggal').value = tgl;
        document.getElementById('poc_status').value = item.status;

        let items = [];
        try {
            let parsed = item.item_po;
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            if (Array.isArray(parsed)) items = parsed;
        } catch (e) {
            console.error('Error parsing item_po:', e);
        }
        renderPOCustomerItems(items);

        document.getElementById('po-customer-modal').classList.add('active');
    };

    window.deletePOCustomer = async function (id) {
        if (!confirm('Hapus PO Customer ini?')) return;
        const res = await window.ERPAPI.request('delete_po_customer', { id: id });
        if (res.status === 'success') {
            window.showToast(res.message, 'success');
            loadPOCustomerData();
        } else {
            window.showToast(res.message, 'error');
        }
    };

    window.printPOCustomer = function (id) {
        window.showToast('Fitur cetak sedang dikembangkan.', 'info');
    };

    // Event delegation for PO Customer actions
    document.getElementById('table-po-customer')?.addEventListener('click', async (e) => {
        const btnSpk = e.target.closest('.btn-spk-po');
        const btnPo = e.target.closest('.btn-po-internal-po');
        const btnSj = e.target.closest('.btn-sj-po');
        const btnInv = e.target.closest('.btn-inv-po');

        if (btnSpk) {
            const item = JSON.parse(btnSpk.getAttribute('data-item'));
            document.getElementById('produksi-form').reset();
            document.getElementById('spk_no_penawaran').value = item.no_penawaran || item.id_po_customer || '';
            const selectKode = document.getElementById('spk_kode_jadi');

            if (cachedBOMData.length === 0 || cachedInventoryData.length === 0) {
                if (selectKode) selectKode.innerHTML = '<option value="" disabled selected>Memuat data BOM...</option>';
                const [resBom, resInv] = await Promise.all([
                    window.ERPAPI.request('get_bom'),
                    window.ERPAPI.request('get_inventory')
                ]);
                if (resInv.status === 'success' && resInv.data) cachedInventoryData = resInv.data;
                if (resBom.status === 'success' && resBom.data) cachedBOMData = resBom.data;
            }

            if (selectKode) {
                selectKode.innerHTML = '<option value="" disabled selected>-- Pilih Barang Jadi --</option>';
                cachedBOMData.forEach(bom => {
                    const opt = document.createElement('option');
                    opt.value = bom.kode_barang;
                    opt.textContent = `${bom.kode_barang} - ${bom.nama_barang}`;
                    selectKode.appendChild(opt);
                });
            }

            let partNames = '';
            try {
                const rincian = typeof item.item_po === 'string' ? JSON.parse(item.item_po) : item.item_po;
                if (Array.isArray(rincian)) partNames = rincian.map(x => x.nama || '').filter(Boolean).join(', ');
            } catch (err) { }

            if (selectKode) {
                if (selectKode.tomselect) {
                    selectKode.tomselect.destroy();
                }

                let matchedBom = cachedBOMData.find(b => String(b.nama_barang).trim().toLowerCase() === String(partNames).trim().toLowerCase());
                if (matchedBom) {
                    selectKode.value = matchedBom.kode_barang;
                } else {
                    let existingCustom = Array.from(selectKode.options).find(o => o.value === partNames);
                    if (!existingCustom) {
                        const option = document.createElement('option');
                        option.value = partNames || ('Custom-' + (item.no_penawaran || item.id_po_customer));
                        option.text = partNames || 'Dari PO ' + (item.no_penawaran || item.id_po_customer);
                        selectKode.add(option);
                    } else {
                        existingCustom.text = partNames || 'Dari PO ' + (item.no_penawaran || item.id_po_customer);
                    }
                    selectKode.value = partNames || ('Custom-' + (item.no_penawaran || item.id_po_customer));
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
            if (qtyInput) qtyInput.value = '1';

            if (typeof calculateSPKEstimasi === 'function') calculateSPKEstimasi();

            const pemintaInput = document.getElementById('spk_peminta');
            if (pemintaInput) pemintaInput.value = item.nama_customer || item.customer || '';

            if (typeof populateKruGudangDropdown === 'function') populateKruGudangDropdown();
            document.getElementById('produksi-modal-title').textContent = 'SPK Produksi (Referensi PO: ' + (item.id_po_customer || item.no_penawaran) + ')';
            document.getElementById('produksi-modal').classList.add('active');
        } else if (btnPo) {
            const item = JSON.parse(btnPo.getAttribute('data-item'));
            const poFormEl = document.getElementById('po-form');
            if (poFormEl) poFormEl.reset();
            const poItemsTbodyEl = document.getElementById('po-items-tbody');
            if (poItemsTbodyEl) poItemsTbodyEl.innerHTML = '';

            let shortageItems = [];
            try {
                const [resBom, resStock] = await Promise.all([
                    window.ERPAPI.request('get_bom'),
                    window.ERPAPI.request('get_stock')
                ]);
                const boms = resBom.data || [];
                const stocks = resStock.data || [];
                const rincian = typeof item.item_po === 'string' ? JSON.parse(item.item_po) : item.item_po;
                if (Array.isArray(rincian)) {
                    rincian.forEach(poItem => {
                        const matchedBom = boms.find(b => String(b.nama_barang).trim().toLowerCase() === String(poItem.nama).trim().toLowerCase());
                        if (matchedBom) {
                            const mats = typeof matchedBom.rincian_material === 'string' ? JSON.parse(matchedBom.rincian_material) : (matchedBom.rincian_material || []);
                            mats.forEach(mat => {
                                const reqQty = parseFloat(mat.qty || 0) * parseFloat(poItem.qty || 1);
                                const stockItem = stocks.find(s => (s.nama_material || '').trim().toLowerCase() === (mat.nama_material || '').trim().toLowerCase());
                                const currentStock = stockItem ? (parseFloat(String(stockItem.stok).replace(/[^0-9.-]+/g, "")) || 0) : 0;
                                if (reqQty > currentStock) {
                                    shortageItems.push({
                                        nama: stockItem ? stockItem.nama_material : mat.nama_material,
                                        kode: stockItem ? stockItem.kode_material : ('RM' + Math.floor(Math.random() * 10000)),
                                        qty: reqQty - currentStock,
                                        satuan: mat.satuan || 'pcs',
                                        harga: stockItem ? stockItem.harga_satuan : 0
                                    });
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.error(e);
            }

            if (shortageItems && shortageItems.length > 0) {
                shortageItems.forEach(short => {
                    if (typeof addPOItemRow === 'function') addPOItemRow(short.kode, short.nama, short.harga, short.qty, short.satuan);
                });
            } else {
                if (typeof addPOItemRow === 'function') addPOItemRow();
            }

            if (typeof calculatePOTotal === 'function') calculatePOTotal();

            const session = localStorage.getItem('erp_session');
            const user = session ? JSON.parse(session) : {};
            const pemohonEl = document.getElementById('po-info-pemohon');
            if (pemohonEl) pemohonEl.textContent = user.nama || user.username || '-';

            const tanggalEl = document.getElementById('po-info-tanggal');
            if (tanggalEl) {
                const now = new Date();
                tanggalEl.textContent = now.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            const catEl = document.getElementById('po_catatan');
            if (catEl) catEl.value = `Permintaan Barang Mentah (Komponen Kurang) dari PO Customer: ${item.id_po_customer} - ${item.nama_customer || ''}`;

            document.getElementById('po-modal').classList.add('active');
        } else if (btnSj) {
            const item = JSON.parse(btnSj.getAttribute('data-item'));
            document.getElementById('surat-jalan-form').reset();
            const poSelect = document.getElementById('sj_id_po_customer');
            if (poSelect) {
                let found = Array.from(poSelect.options).find(o => o.value === item.no_penawaran);
                if (!found && item.no_penawaran) {
                    const opt = document.createElement('option');
                    opt.value = item.no_penawaran;
                    opt.text = item.no_penawaran + " (Dari PO Customer)";
                    poSelect.add(opt);
                }
                poSelect.value = item.no_penawaran || '';
            }
            document.getElementById('sj_no').value = '';
            document.getElementById('sj_items_hidden').value = '';
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const localDate = new Date(today.getTime() - offset).toISOString().split('T')[0];
            document.getElementById('sj_tanggal').value = localDate;

            const tbody = document.getElementById('sj-items-tbody');
            if (tbody) {
                tbody.innerHTML = '';
                try {
                    const rincian = typeof item.item_po === 'string' ? JSON.parse(item.item_po) : item.item_po;
                    if (Array.isArray(rincian) && rincian.length > 0) {
                        rincian.forEach((ritem, idx) => {
                            const tr = document.createElement('tr');
                            tr.className = 'sj-item-row';
                            tr.innerHTML = `
                                <td>${idx + 1}</td>
                                <td><input type="text" class="sj-item-nama" style="width:100%; border:none; background:transparent; color:var(--text-main);" value="${ritem.nama}" readonly></td>
                                <td><input type="number" class="sj-item-qty" style="width:100%; border:1px solid var(--glass-border); background:var(--bg-glass); color:var(--text-main); border-radius:4px; padding:4px;" value="${ritem.qty}" min="1" required></td>
                                <td><input type="text" class="sj-item-satuan" style="width:100%; border:1px solid var(--glass-border); background:var(--bg-glass); color:var(--text-main); border-radius:4px; padding:4px;" value="pcs" required></td>
                            `;
                            tbody.appendChild(tr);
                        });
                        document.getElementById('sj_items_hidden').value = JSON.stringify(rincian);

                        tbody.querySelectorAll('.sj-item-qty, .sj-item-satuan').forEach(input => {
                            input.addEventListener('input', () => {
                                const newItems = [];
                                tbody.querySelectorAll('.sj-item-row').forEach(row => {
                                    newItems.push({
                                        nama: row.querySelector('.sj-item-nama').value,
                                        qty: parseFloat(row.querySelector('.sj-item-qty').value) || 0,
                                        satuan: row.querySelector('.sj-item-satuan').value || 'pcs'
                                    });
                                });
                                document.getElementById('sj_items_hidden').value = JSON.stringify(newItems);
                            });
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada item</td></tr>';
                    }
                } catch (e) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Gagal memuat item</td></tr>';
                }
            }
            document.getElementById('surat-jalan-modal').classList.add('active');
        } else if (btnInv) {
            const item = JSON.parse(btnInv.getAttribute('data-item'));
            document.getElementById('invoice-form').reset();
            const poSelect = document.getElementById('inv_id_po_customer');
            if (poSelect) {
                let found = Array.from(poSelect.options).find(o => o.value === item.no_penawaran);
                if (!found && item.no_penawaran) {
                    const opt = document.createElement('option');
                    opt.value = item.no_penawaran;
                    opt.text = item.no_penawaran + " (Dari PO Customer)";
                    poSelect.add(opt);
                }
                poSelect.value = item.no_penawaran || '';
            }
            document.getElementById('inv_no').value = '';

            const tbody = document.getElementById('inv-items-tbody');
            if (tbody) {
                tbody.innerHTML = '';
                try {
                    const rincian = typeof item.item_po === 'string' ? JSON.parse(item.item_po) : item.item_po;
                    if (Array.isArray(rincian) && rincian.length > 0) {
                        rincian.forEach((ritem, idx) => {
                            const subtotal = parseFloat(ritem.qty || 0) * parseFloat(ritem.harga || 0);
                            const tr = document.createElement('tr');
                            tr.className = 'inv-item-row';
                            tr.innerHTML = `
                                <td><input type="text" class="inv-item-nama" style="width:100%; border:none; background:transparent; color:var(--text-main);" value="${ritem.nama}" readonly></td>
                                <td><input type="number" class="inv-item-qty" style="width:100%; border:1px solid var(--glass-border); background:var(--bg-glass); color:var(--text-main); border-radius:4px; padding:4px;" value="${ritem.qty}" min="1" required oninput="window.calculateInvoiceItemSubtotal(this)"></td>
                                <td><input type="text" class="inv-item-satuan" style="width:100%; border:1px solid var(--glass-border); background:var(--bg-glass); color:var(--text-main); border-radius:4px; padding:4px;" value="pcs" required></td>
                                <td><input type="text" class="inv-item-harga number-format" style="width:100%; border:1px solid var(--glass-border); background:var(--bg-glass); color:var(--text-main); border-radius:4px; padding:4px;" value="${window.formatRupiah(ritem.harga || 0)}" required oninput="window.formatCurrencyInput(this); window.calculateInvoiceItemSubtotal(this)"></td>
                                <td><input type="text" class="inv-item-subtotal" style="width:100%; border:none; background:transparent; color:var(--text-main); text-align:right;" value="${window.formatRupiah(subtotal)}" readonly></td>
                            `;
                            tbody.appendChild(tr);
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada item</td></tr>';
                    }
                } catch (e) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Gagal memuat item</td></tr>';
                }
            }
            if (typeof calculateInvoiceTotals === 'function') calculateInvoiceTotals();

            document.getElementById('invoice-modal').classList.add('active');
        }
    });

    // ==========================================

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
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
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
                    sortField: { field: 'text', direction: 'asc' },
                    maxOptions: 50,
                    onChange: function (value) {
                        const addrEl = document.getElementById('p_customer_address');
                        if (addrEl && custRes.status === 'success' && custRes.data) {
                            const found = custRes.data.find(c => c.nama_customer === value);
                            if (found) {
                                addrEl.value = found.alamat_keterangan || found['alamat_/_keterangan'] || '';
                            }
                        }
                    }
                });

                if (prevValue && customerSelect.tomselect) {
                    customerSelect.tomselect.addOption({ value: prevValue, text: prevValue });
                    customerSelect.tomselect.setValue(prevValue);
                }
            }

            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Belum ada data penawaran.</td></tr>';
                return;
            }
            [...response.data].reverse().forEach(item => {
                let badgeClass = 'badge-warning';
                if (item.status === 'Approved' || item.status === 'Finish') badgeClass = 'badge-success';
                else if (item.status === 'Rejected') badgeClass = 'badge-danger';
                else if (item.status === 'Proses') badgeClass = 'badge-info';

                const session = localStorage.getItem('erp_session');
                const user = session ? JSON.parse(session) : {};
                const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));

                let actionBtns = `<button class="btn btn-print-penawaran" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--info);" title="Print / Ekspor PDF"><i class="fa-solid fa-print"></i></button>`;

                if (item.status === 'Draft') {
                    actionBtns += `<button class="btn btn-edit-penawaran" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;" title="Edit Penawaran"><i class="fa-solid fa-pen"></i></button>`;
                }

                if (item.status === 'Penawaran') {
                    actionBtns += `<button class="btn btn-revisi-penawaran" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--warning); color: #000;" title="Revisi Dokumen Penawaran"><i class="fa-solid fa-code-branch"></i></button>`;
                }

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
                                        try { rincianMaterial = JSON.parse(bom.rincian_material || '[]'); } catch (e) { }
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
                                const currentStock = stockItem ? (parseFloat(String(stockItem.stok).replace(/[^0-9.-]+/g, "")) || 0) : 0;

                                if (reqQty > currentStock) {
                                    has_shortage = true;
                                    shortage_items.push({
                                        nama: stockItem ? stockItem.nama_material : namaMat,
                                        kode: stockItem ? stockItem.kode_material : ('RM' + Math.floor(Math.random() * 10000)),
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
                    actionBtns = `<button class="btn btn-create-po-from-penawaran" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--secondary);" title="Buat PO Customer"><i class="fa-solid fa-file-invoice"></i></button>` + actionBtns;
                }

                const maxNarasiLen = 50;
                const displayNarasi = (item.narasi && item.narasi.length > maxNarasiLen)
                    ? item.narasi.substring(0, maxNarasiLen) + '...'
                    : (item.narasi || '-');

                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.innerHTML = `
                    <td>${item.no_penawaran || '-'}</td>
                    <td>${item.tanggal || '-'}</td>
                    <td style="font-weight: 500;">${item.customer}</td>
                    <td title="${(item.narasi || '').replace(/"/g, '&quot;')}"><div class="truncate-mobile">${displayNarasi}</div></td>
                    <td>Rp ${(parseInt(String(item.total_harga || '0').replace(/\D/g, '')) || 0).toLocaleString('id-ID')}</td>
                    <td>Rp ${(parseInt(String(item.down_payment || item.dp || '0').replace(/\D/g, '')) || 0).toLocaleString('id-ID')}</td>
                    <td><span class="badge ${badgeClass}">${item.status || 'Penawaran'}</span></td>
                    <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
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
                    document.getElementById('p_no_penawaran').readOnly = true;
                    const custSelect = document.getElementById('p_customer');
                    if (custSelect && custSelect.tomselect) {
                        custSelect.tomselect.addOption({ value: item.customer, text: item.customer });
                        custSelect.tomselect.setValue(item.customer);
                    } else if (custSelect) {
                        custSelect.value = item.customer;
                    }
                    document.getElementById('p_total_harga_display').textContent = (parseInt(String(item.total_harga || '0').replace(/[^0-9]/g, '')) || 0).toLocaleString('id-ID');
                    // document.getElementById('p_dp').value = window.formatRibuan(parseInt(String(item.down_payment || item.dp || '0').replace(/[^0-9]/g, '')) || 0);
                    document.getElementById('p_narasi').value = item.narasi || '';
                    document.getElementById('p_status').value = item.status || 'Penawaran';

                    let info = {};
                    try {
                        info = typeof item.info_tambahan === 'string' ? JSON.parse(item.info_tambahan) : (item.info_tambahan || {});
                    } catch (e) { }

                    document.getElementById('p_attn').value = info.attn || '';
                    document.getElementById('p_rev_date').value = info.rev_date || '';
                    document.getElementById('p_delivery').value = info.delivery || '';
                    document.getElementById('p_payment').value = info.payment || '';
                    document.getElementById('p_customer_address').value = info.customer_address || '';

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

                    calculatePenawaranTotal();
                    penawaranModal.classList.add('active');
                });
            });

            // Bind revisi buttons
            document.querySelectorAll('.btn-revisi-penawaran').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                    document.getElementById('penawaran-modal-title').textContent = 'Revisi Penawaran';
                    // Generate new revision number
                    let newNo = item.no_penawaran;
                    if (newNo.match(/-REV\d+$/)) {
                        newNo = newNo.replace(/-REV(\d+)$/, (match, p1) => {
                            const nextNum = parseInt(p1, 10) + 1;
                            return '-REV' + String(nextNum).padStart(2, '0');
                        });
                    } else {
                        newNo += '-REV01';
                    }

                    document.getElementById('p_no_penawaran').value = newNo;
                    document.getElementById('p_no_penawaran').readOnly = false;

                    const custSelect = document.getElementById('p_customer');
                    if (custSelect && custSelect.tomselect) {
                        custSelect.tomselect.addOption({ value: item.customer, text: item.customer });
                        custSelect.tomselect.setValue(item.customer);
                    } else if (custSelect) {
                        custSelect.value = item.customer;
                    }
                    document.getElementById('p_total_harga_display').textContent = (parseInt(String(item.total_harga || '0').replace(/[^0-9]/g, '')) || 0).toLocaleString('id-ID');
                    // document.getElementById('p_dp').value = window.formatRibuan(parseInt(String(item.down_payment || item.dp || '0').replace(/[^0-9]/g, '')) || 0);
                    document.getElementById('p_narasi').value = item.narasi || '';
                    document.getElementById('p_status').value = 'Penawaran';

                    let info = {};
                    try {
                        info = typeof item.info_tambahan === 'string' ? JSON.parse(item.info_tambahan) : (item.info_tambahan || {});
                    } catch (e) { }

                    document.getElementById('p_attn').value = info.attn || '';
                    document.getElementById('p_rev_date').value = info.rev_date || '';
                    document.getElementById('p_delivery').value = info.delivery || '';
                    document.getElementById('p_payment').value = info.payment || '';
                    document.getElementById('p_customer_address').value = info.customer_address || '';

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

                    calculatePenawaranTotal();
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
                    document.getElementById('spk_no_penawaran').value = item.no_penawaran || '';
                    const selectKode = document.getElementById('spk_kode_jadi');

                    if (cachedBOMData.length === 0 || cachedInventoryData.length === 0) {
                        if (selectKode) selectKode.innerHTML = '<option value="" disabled selected>Memuat data BOM...</option>';
                        const [resBom, resInv] = await Promise.all([
                            window.ERPAPI.request('get_bom'),
                            window.ERPAPI.request('get_inventory')
                        ]);
                        if (resInv.status === 'success' && resInv.data) cachedInventoryData = resInv.data;
                        if (resBom.status === 'success' && resBom.data) cachedBOMData = resBom.data;
                    }

                    if (selectKode) {
                        selectKode.innerHTML = '<option value="" disabled selected>-- Pilih Barang Jadi --</option>';
                        cachedBOMData.forEach(bom => {
                            const opt = document.createElement('option');
                            opt.value = bom.kode_barang;
                            opt.textContent = `${bom.kode_barang} - ${bom.nama_barang}`;
                            selectKode.appendChild(opt);
                        });
                    }

                    let partNames = '';
                    try {
                        const rincian = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : item.rincian_item;
                        if (Array.isArray(rincian)) partNames = rincian.map(x => x.part_name || x.nama || '').filter(Boolean).join(', ');
                    } catch (err) { }

                    if (selectKode) {
                        if (selectKode.tomselect) {
                            selectKode.tomselect.destroy();
                        }

                        let matchedBom = cachedBOMData.find(b => String(b.nama_barang).trim().toLowerCase() === String(partNames).trim().toLowerCase());
                        if (matchedBom) {
                            selectKode.value = matchedBom.kode_barang;
                        } else {
                            let existingCustom = Array.from(selectKode.options).find(o => o.value === partNames);
                            if (!existingCustom) {
                                const option = document.createElement('option');
                                option.value = partNames || ('Custom-' + item.no_penawaran);
                                option.text = partNames || 'Dari Penawaran ' + item.no_penawaran;
                                selectKode.add(option);
                            } else {
                                existingCustom.text = partNames || 'Dari Penawaran ' + item.no_penawaran;
                            }
                            selectKode.value = partNames || ('Custom-' + item.no_penawaran);
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
                    if (qtyInput) qtyInput.value = '1';

                    // Trigger calculation explicitly after setting values
                    if (typeof calculateSPKEstimasi === 'function') {
                        calculateSPKEstimasi();
                    }

                    const pemintaInput = document.getElementById('spk_peminta');
                    if (pemintaInput) pemintaInput.value = item.customer;

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
                    if (poFormEl) poFormEl.reset();
                    const poItemsTbodyEl = document.getElementById('po-items-tbody');
                    if (poItemsTbodyEl) poItemsTbodyEl.innerHTML = '';

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
                    if (pemohonEl) pemohonEl.textContent = user.nama || user.username || '-';

                    const tanggalEl = document.getElementById('po-info-tanggal');
                    if (tanggalEl) {
                        const now = new Date();
                        tanggalEl.textContent = now.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }

                    const catEl = document.getElementById('po_catatan');
                    if (catEl) catEl.value = `Permintaan Barang Mentah (Komponen Kurang) untuk Penawaran: ${item.no_penawaran} - ${item.customer}`;

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
                    } catch (e) { }

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
                    document.getElementById('print_rev_date').textContent = info.rev_date || '-';
                    document.getElementById('print_delivery').textContent = info.delivery || '-';
                    document.getElementById('print_payment').textContent = info.payment || '-';

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

                    document.body.classList.remove('printing-sj', 'printing-inv', 'printing-po');
                    document.body.classList.add('printing-po');
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

            // Bind Create PO Customer from Penawaran table
            document.querySelectorAll('.btn-create-po-from-penawaran').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.currentTarget.getAttribute('data-item'));

                    // Switch view to PO Customer
                    switchView('pocustomer');

                    // Trigger "Buat PO"
                    const btnAddPo = document.getElementById('btn-add-po-customer');
                    if (btnAddPo) btnAddPo.click();

                    // Pre-fill Penawaran
                    setTimeout(() => {
                        const noPenawaranSelect = document.getElementById('poc_no_penawaran');
                        if (noPenawaranSelect) {
                            if (noPenawaranSelect.tomselect) {
                                noPenawaranSelect.tomselect.addOption({ value: item.no_penawaran, text: item.no_penawaran });
                                noPenawaranSelect.tomselect.setValue(item.no_penawaran);
                            } else {
                                noPenawaranSelect.value = item.no_penawaran;
                                noPenawaranSelect.dispatchEvent(new Event('change'));
                            }
                        }
                    }, 100);
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
            const harga = parseInt(String(row.querySelector('.pi-price').value).replace(/\D/g, '')) || 0;
            const subtotal = qty * harga;
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
        const pUsd = itemData.price_usd || 0;
        const pIdr = itemData.price_idr || 0;
        const initCurrency = pUsd > 0 ? 'USD' : 'IDR';
        const initPrice = pUsd > 0 ? pUsd : pIdr;

        const div = document.createElement('div');
        div.className = 'p-item-row';
        div.style.display = 'grid';
        div.style.gridTemplateColumns = '3fr 1fr 1fr 2fr auto';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.style.alignItems = 'center';

        const list = document.getElementById('bom-items-list');
        let optionsHtml = '<option value="">Ketik Nama Produk / Item...</option>';
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
            <input type="text" class="pi-moq number-format" placeholder="Qty (PCS)" value="${pMoq ? window.formatRibuan(pMoq) : ''}" required style="padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <select class="pi-currency" style="padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
                <option value="IDR" ${initCurrency === 'IDR' ? 'selected' : ''}>IDR</option>
                <option value="USD" ${initCurrency === 'USD' ? 'selected' : ''}>USD</option>
                <option value="EUR" ${initCurrency === 'EUR' ? 'selected' : ''}>EUR</option>
                <option value="SGD" ${initCurrency === 'SGD' ? 'selected' : ''}>SGD</option>
                <option value="JPY" ${initCurrency === 'JPY' ? 'selected' : ''}>JPY</option>
                <option value="GBP" ${initCurrency === 'GBP' ? 'selected' : ''}>GBP</option>
                <option value="CNY" ${initCurrency === 'CNY' ? 'selected' : ''}>CNY</option>
            </select>
            <input type="text" class="pi-price number-format" placeholder="Harga" value="${initPrice ? window.formatRibuan(initPrice) : ''}" required style="padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <button type="button" class="btn btn-remove-p-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        div.querySelector('.btn-remove-p-row').addEventListener('click', () => {
            div.remove();
            calculatePenawaranTotal();
        });

        div.querySelector('.pi-moq').addEventListener('input', calculatePenawaranTotal);
        div.querySelector('.pi-price').addEventListener('input', calculatePenawaranTotal);

        const inputName = div.querySelector('.pi-part-name');
        inputName.addEventListener('change', (e) => {
            const selectedOpt = inputName.options[inputName.selectedIndex];
            if (selectedOpt && selectedOpt.getAttribute('data-harga')) {
                const hg = parseInt(selectedOpt.getAttribute('data-harga')) || 0;
                div.querySelector('.pi-price').value = window.formatRibuan(hg);
                div.querySelector('.pi-currency').value = 'IDR';
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
            onChange: function (value) {
                const listOpt = Array.from(document.getElementById('bom-items-list')?.options || []).find(o => o.value === value);
                if (listOpt && listOpt.getAttribute('data-harga')) {
                    const hg = parseInt(listOpt.getAttribute('data-harga')) || 0;
                    div.querySelector('.pi-price').value = window.formatRibuan(hg);
                    div.querySelector('.pi-currency').value = 'IDR';
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

        document.getElementById('p_status').value = 'Draft';
        // Set default date to today
        const pRevDate = document.getElementById('p_rev_date');
        const todayStr = new Date().toISOString().split('T')[0];
        if (pRevDate) pRevDate.value = todayStr;

        // Auto suggest No Penawaran Base
        const [year, month, day] = todayStr.split('-');
        const dateFormatted = `${day}${month}${year}`;
        const pNoPenawaran = document.getElementById('p_no_penawaran');
        pNoPenawaran.value = `OKS-CUSTOMER-${dateFormatted}-REV00`;
        pNoPenawaran.readOnly = false;

        const custSelect = document.getElementById('p_customer');
        const updateNoPenawaran = () => {
            if (document.getElementById('penawaran-modal-title').textContent === 'Buat Penawaran Baru') {
                const currentVal = pNoPenawaran.value;
                if (currentVal.startsWith('OKS-') && currentVal.includes('-REV00')) {
                    const custName = custSelect.value ? custSelect.value.replace(/\s+/g, '').toUpperCase() : 'CUSTOMER';
                    pNoPenawaran.value = `OKS-${custName}-${dateFormatted}-REV00`;
                }
            }
        };

        if (custSelect && !custSelect.dataset.listenerAddedForSuggest) {
            custSelect.addEventListener('change', updateNoPenawaran);
            custSelect.dataset.listenerAddedForSuggest = 'true';
        }

        // Set default Remarks template
        const pNarasi = document.getElementById('p_narasi');
        if (pNarasi) {
            pNarasi.value = `Remarks :
1. Price is not include VAT (PPN) 11%
2. Exchange Rate is base on Bank Indonesia Middle Rate (TTM) average of the last quarter
   Or following customer exchange rate
   Price will be review every 3 months
3. Initial Cost
   - Plastic Tray & Returnable Box as on quotation
4. Brief of the projects:
   End User Customer : -
   Product : -
   Forecast :
       SOP : TBC
       1st PP : TBC
       Life Time : TBC
5. PP Price will discuss separately
6. For detail please refer to cost breakdown
7. Bank Name : -
8. Name of beneficiary bank : PT Orion Karya Sejahtera
9. A/C NO. OF BENEFICIARY : -
10. Payment in Advance`;
        }

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
            const currency = row.querySelector('.pi-currency').value;
            const price_val = parseInt(String(row.querySelector('.pi-price').value).replace(/\D/g, '')) || 0;
            let price_usd = 0;
            let price_idr = 0;
            if (currency === 'USD') price_usd = price_val;
            else price_idr = price_val;

            if (part_name) items.push({ part_number, part_name, moq_pcs, price_usd, price_idr });
        });

        const payload = {
            no_penawaran: document.getElementById('p_no_penawaran').value,
            customer: document.getElementById('p_customer').value,
            total_harga: parseInt(String(document.getElementById('p_total_harga').value).replace(/\D/g, '')) || 0,
            rincian_item: items,
            narasi: document.getElementById('p_narasi').value,
            dp: 0, // parseInt(String(document.getElementById('p_dp').value).replace(/\D/g, '')) || 0,
            status: document.getElementById('p_status').value,
            info_tambahan: {
                attn: document.getElementById('p_attn').value,
                rev_date: document.getElementById('p_rev_date').value,
                delivery: document.getElementById('p_delivery').value,
                payment: document.getElementById('p_payment').value,
                customer_address: document.getElementById('p_customer_address').value
            }
        };

        const isEdit = !!document.getElementById('penawaran-form').dataset.isEdit || document.getElementById('penawaran-modal-title').textContent === 'Edit Penawaran';

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
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
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
                        <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
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
                if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
                }
            }
        }

        // Handle print finish globally
        window.addEventListener('afterprint', () => {
            document.body.classList.remove('printing-sj', 'printing-inv', 'printing-po');
        });

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

        try {
            const response = await window.ERPAPI.request('get_bom');
            if (!cached || JSON.stringify(cached.data) !== JSON.stringify(response.data)) {
                render(response);
            }
        } catch (error) {
            console.error('Error fetching get_bom:', error);
            if (!cached) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Gagal memuat data BOM: ${error.message}</td></tr>`;
            }
            alert("Terjadi kesalahan saat memuat data BOM:\n\n" + error.message);
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

    function addMaterialRow(kode = '', nama = '', qty = '1', hargaTotalLama = '') {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" class="mat-kode" placeholder="Kode Mat" value="${kode}" style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;" readonly>
            <input type="text" list="bom-bahan-baku-list" class="mat-nama" placeholder="Nama Material" value="${nama}" required style="flex: 2; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="mat-qty number-format" placeholder="Qty" value="${qty ? window.formatRibuan(qty) : '1'}" required style="flex: 0.8; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="mat-harga-satuan number-format" placeholder="Harga Satuan" value="" style="flex: 1.2; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;" readonly>
            <input type="text" class="mat-harga number-format" placeholder="Total" value="${hargaTotalLama ? window.formatRibuan(hargaTotalLama) : ''}" required style="flex: 1.2; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: var(--accent); font-weight: bold;" readonly>
            <button type="button" class="btn btn-remove-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;

        const qtyInput = div.querySelector('.mat-qty');
        const hargaSatuanInput = div.querySelector('.mat-harga-satuan');
        const totalHargaInput = div.querySelector('.mat-harga');
        const namaInput = div.querySelector('.mat-nama');
        const kodeInput = div.querySelector('.mat-kode');

        const updateRowTotal = () => {
            const q = window.parseRupiah(qtyInput.value) || 0;
            const hs = window.parseRupiah(hargaSatuanInput.value) || 0;
            const tot = q * hs;
            totalHargaInput.value = window.formatRibuan(tot);
            calculateTotalBiaya();
        };

        const updateFromBahanBaku = () => {
            const val = String(namaInput.value).trim().toLowerCase();
            const list = document.getElementById('bom-bahan-baku-list');
            if (list && val) {
                const options = Array.from(list.options);
                const match = options.find(opt => String(opt.value).trim().toLowerCase() === val);
                if (match) {
                    const hrg = match.getAttribute('data-harga');
                    const kod = match.getAttribute('data-kode');
                    if (hrg) hargaSatuanInput.value = window.formatRibuan(hrg);
                    if (kod) kodeInput.value = kod;
                }
            }
            updateRowTotal();
        };

        div.querySelector('.btn-remove-row').addEventListener('click', () => {
            div.remove();
            calculateTotalBiaya();
        });

        qtyInput.addEventListener('input', updateRowTotal);
        namaInput.addEventListener('input', updateFromBahanBaku);
        hargaSatuanInput.addEventListener('input', updateRowTotal);

        materialsContainer.appendChild(div);

        // Initial sync if editing an existing item
        if (nama) {
            updateFromBahanBaku();
        }
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

    document.querySelectorAll('.btn-close-edit-bj').forEach(b => {
        b.addEventListener('click', () => {
            document.getElementById('edit-barang-jadi-modal').classList.remove('active');
        });
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
                <td>Rp ${parseInt(payload.total_biaya).toLocaleString('id-ID')}</td>
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
                        cells[3].textContent = 'Rp ' + parseInt(payload.total_biaya).toLocaleString('id-ID');
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
                alert("GAGAL MENYIMPAN BOM! Error dari server:\n\n" + errorMsg);
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
            alert("KONEKSI GAGAL SAAT MENYIMPAN BOM:\n\n" + error.message);
            loadBOMData(true); // Revert table
        });
    });

    // Flow 3: SPK Auto-Deduct
    async function loadProduksiData(isBackgroundSync = false) {
        const tbody = document.getElementById('table-produksi');
        if (!tbody) return;
        if (!isBackgroundSync) {
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
        }

        try {
            const response = await window.ERPAPI.request('get_produksi');
            if (response.status === 'success' && response.data) {
                tbody.innerHTML = '';
                if (response.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada SPK Produksi.</td></tr>';
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
                        actionBtns += `<button class="btn btn-ambil-bahan" data-no="${item.no_spk}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--warning); margin-right: 5px; color: #000;" title="Ambil Bahan Baku"><i class="fa-solid fa-box-open"></i></button>`;
                        
                        actionBtns += `<button class="btn btn-edit-spk" data-no="${item.no_spk}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--info); margin-right: 5px;" title="Edit SPK"><i class="fa-solid fa-pen"></i></button>`;
                    } else if (item.status === 'Dalam Proses') {
                        statusBadge = `<span class="badge badge-info" style="background: var(--info);">${item.status}</span>`;
                        actionBtns += `<button class="btn btn-selesaikan-spk" data-no="${item.no_spk}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--primary); margin-right: 5px;" title="Selesaikan SPK"><i class="fa-solid fa-check"></i></button>`;
                    }

                    actionBtns += `<button class="btn btn-delete-spk" data-no="${item.no_spk}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--danger);" title="Hapus SPK"><i class="fa-solid fa-trash"></i></button>`;

                    tr.innerHTML = `
                    <td>${item.no_spk || '-'}</td>
                    <td>${item.tanggal || '-'}</td>
                    <td style="font-weight: 500;">${item.kode_barang_jadi || item.kode_barang || '-'}</td>
                    <td>${item.qty_produksi || item.qty || '-'}</td>
                    <td style="color: var(--accent); font-weight: 500;">${item.no_penawaran || '<span style="color:var(--text-muted); font-size:0.8rem; font-weight:normal;">Internal</span>'}</td>
                    <td>${statusBadge}</td>
                    <td style="white-space: nowrap;">
                        <div style="display: flex; flex-direction: row; gap: 5px; align-items: center;">
                            ${actionBtns}
                        </div>
                    </td>
                `;
                    tr.style.cursor = 'pointer';
                    tr.querySelectorAll('button').forEach(btn => {
                        btn.addEventListener('click', e => e.stopPropagation());
                    });

                    const editBtn = tr.querySelector('.btn-edit-spk');
                    if (editBtn) {
                        editBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openEditSPKModal(item);
                        });
                    }
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
                            const sess = JSON.parse(localStorage.getItem('erp_session') || '{}');
                            window.ERPAPI.request('ambil_bahan_spk', { no_spk: noSPK, peminta: sess.nama_lengkap || sess.username || '' }).then(res => {
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
                select.innerHTML = '<option value="" disabled selected>Pilih Tim Produksi Terlibat</option>';
                if (res.status === 'success' && res.data) {
                    res.data.forEach(user => {
                        const opt = document.createElement('option');
                        opt.value = user.nama_lengkap;
                        opt.textContent = `${user.nama_lengkap} (${user.role})`;
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

    let cachedPOData = [];
    let cachedProduksiData = [];

    document.getElementById('btn-run-spk')?.addEventListener('click', async () => {
        populateKruGudangDropdown();
        document.getElementById('produksi-form').reset();
        document.getElementById('spk-bahan-container').innerHTML = 'Pilih barang dan isi Qty untuk melihat estimasi...';
        document.getElementById('spk_total_biaya').textContent = '0';
        document.getElementById('spk_qty_info').style.display = 'none';

        document.getElementById('spk_edit_mode_no').value = '';
        document.getElementById('produksi-modal-title').textContent = 'Form SPK Produksi';
        const batchGroup = document.getElementById('spk_batch_count')?.closest('.input-group');
        if (batchGroup) batchGroup.style.display = 'block';

        const select = document.getElementById('spk_kode_jadi');
        const poSelect = document.getElementById('spk_po_customer');
        select.innerHTML = '<option value="" disabled selected>Memuat data BOM & Inventory...</option>';
        poSelect.innerHTML = '<option value="" disabled selected>Memuat data PO Customer...</option>';
        produksiModal.classList.add('active');

        const [resBom, resInv, resPO, resProduksi] = await Promise.all([
            window.ERPAPI.request('get_bom'),
            window.ERPAPI.request('get_inventory'),
            window.ERPAPI.request('get_po_customer'),
            window.ERPAPI.request('get_produksi')
        ]);

        cachedBOMData = [];
        cachedInventoryData = [];
        cachedPOData = [];
        cachedProduksiData = [];

        if (resInv.status === 'success' && resInv.data) {
            cachedInventoryData = resInv.data;
        }

        if (resProduksi.status === 'success' && resProduksi.data) {
            cachedProduksiData = resProduksi.data;
        }

        // Populate PO Customer dropdown
        if (poSelect.tomselect) poSelect.tomselect.destroy();
        poSelect.innerHTML = '<option value="" selected>-- Buat SPK Internal / Tanpa PO --</option>';

        if (resPO.status === 'success' && resPO.data) {
            cachedPOData = resPO.data;
            resPO.data.filter(po => po.status !== 'Selesai' && po.status !== 'Batal').forEach(po => {
                const opt = document.createElement('option');
                opt.value = po.id_po_customer || po.no_penawaran;
                opt.textContent = `${po.id_po_customer || po.no_penawaran} - ${po.nama_customer}`;
                poSelect.appendChild(opt);
            });
        }

        new TomSelect('#spk_po_customer', {
            create: false,
            sortField: { field: 'text', direction: 'asc' },
            maxOptions: 50
        });

        if (resBom.status === 'success' && resBom.data) {
            cachedBOMData = resBom.data;
            populateSPKBarangJadi(null); // Load all BOM initially
        } else {
            if (select.tomselect) select.tomselect.destroy();
            select.innerHTML = '<option value="" disabled selected>Gagal memuat BOM</option>';
        }
    });

    async function openEditSPKModal(item) {
        populateKruGudangDropdown();
        document.getElementById('produksi-form').reset();
        document.getElementById('spk-bahan-container').innerHTML = 'Memuat data...';
        document.getElementById('spk_total_biaya').textContent = '0';
        document.getElementById('spk_qty_info').style.display = 'none';

        document.getElementById('spk_edit_mode_no').value = item.no_spk;
        document.getElementById('produksi-modal-title').textContent = 'Edit SPK: ' + item.no_spk;

        const batchGroup = document.getElementById('spk_batch_count')?.closest('.input-group');
        if (batchGroup) batchGroup.style.display = 'none';

        const select = document.getElementById('spk_kode_jadi');
        const poSelect = document.getElementById('spk_po_customer');
        select.innerHTML = '<option value="" disabled selected>Memuat data BOM & Inventory...</option>';
        poSelect.innerHTML = '<option value="" disabled selected>Memuat data PO Customer...</option>';
        produksiModal.classList.add('active');

        const promises = [];
        let pBom = null, pInv = null, pPO = null, pProd = null;
        if (!cachedBOMData || cachedBOMData.length === 0) pBom = window.ERPAPI.request('get_bom');
        if (!cachedInventoryData || cachedInventoryData.length === 0) pInv = window.ERPAPI.request('get_inventory');
        if (!cachedPOData || cachedPOData.length === 0) pPO = window.ERPAPI.request('get_po_customer');
        if (!cachedProduksiData || cachedProduksiData.length === 0) pProd = window.ERPAPI.request('get_produksi');

        const results = await Promise.all([pBom, pInv, pPO, pProd]);

        if (results[0] && results[0].status === 'success') cachedBOMData = results[0].data || [];
        if (results[1] && results[1].status === 'success') cachedInventoryData = results[1].data || [];
        if (results[2] && results[2].status === 'success') cachedPOData = results[2].data || [];
        if (results[3] && results[3].status === 'success') cachedProduksiData = results[3].data || [];

        if (poSelect.tomselect) poSelect.tomselect.destroy();
        poSelect.innerHTML = '<option value="">-- Buat SPK Internal / Tanpa PO --</option>';

        cachedPOData.filter(po => po.status !== 'Selesai' && po.status !== 'Batal').forEach(po => {
            const opt = document.createElement('option');
            const poVal = po.id_po_customer || po.no_penawaran;
            opt.value = poVal;
            opt.textContent = `${poVal} - ${po.nama_customer}`;
            poSelect.appendChild(opt);
        });

        new TomSelect('#spk_po_customer', {
            create: false,
            sortField: { field: 'text', direction: 'asc' },
            maxOptions: 50
        });

        // Determine reference
        let refPo = item.referensi_penawaran_x002f_po || item['referensi_penawaran_/_po'] || item.referensi_po || item.no_penawaran || item.referensi_penawaran || '';

        // Match with existing data to ensure correct selection
        if (refPo) {
            if (poSelect.tomselect) {
                poSelect.tomselect.setValue(refPo);
            } else {
                poSelect.value = refPo;
            }
            document.getElementById('spk_no_penawaran').value = refPo;
        }

        populateSPKBarangJadi(refPo);

        const kodeVal = item.kode_barang_jadi || item.barang_jadi || item.kode_barang;
        if (kodeVal) {
            if (select.tomselect) {
                select.tomselect.setValue(kodeVal);
            } else {
                select.value = kodeVal;
            }
        }

        document.getElementById('spk_qty_jadi').value = parseInt(item.qty_produksi || item.qty || 0);

        setTimeout(() => {
            const pemberiSelect = document.getElementById('spk_pemberi');
            if (item.pemberi) {
                const pemberiArr = item.pemberi.split(',').map(s => s.trim());
                if (pemberiSelect && pemberiSelect.tomselect) {
                    pemberiSelect.tomselect.setValue(pemberiArr);
                } else if (pemberiSelect) {
                    Array.from(pemberiSelect.options).forEach(opt => {
                        if (pemberiArr.includes(opt.value)) opt.selected = true;
                    });
                }
            }
            updateSPKMaxQty();
            calculateSPKEstimasi();
        }, 300);
    }

    function populateSPKBarangJadi(poId) {
        const select = document.getElementById('spk_kode_jadi');
        if (select.tomselect) select.tomselect.destroy();
        select.innerHTML = '<option value="">-- Pilih Barang Jadi --</option>';

        let filteredBOM = cachedBOMData;

        if (poId) {
            const po = cachedPOData.find(p => (p.id_po_customer === poId || p.no_penawaran === poId));
            if (po && po.item_po) {
                try {
                    const items = typeof po.item_po === 'string' ? JSON.parse(po.item_po) : po.item_po;
                    const poItemNames = items.map(i => String(i.nama || i.part_name || '').trim().toLowerCase());

                    filteredBOM = cachedBOMData.filter(bom => {
                        const bomName = String(bom.nama_barang || '').toLowerCase();
                        return poItemNames.some(pi => pi === bomName || bomName.includes(pi) || pi.includes(bomName));
                    });

                    if (filteredBOM.length === 0) {
                        filteredBOM = cachedBOMData; // Fallback to all if no match
                    }
                } catch (e) { }
            }
        }

        filteredBOM.forEach(bom => {
            const opt = document.createElement('option');
            opt.value = bom.kode_barang;
            opt.textContent = `${bom.kode_barang} - ${bom.nama_barang}`;
            select.appendChild(opt);
        });

        new TomSelect('#spk_kode_jadi', {
            create: true,
            sortField: { field: 'text', direction: 'asc' },
            maxOptions: 50
        });
    }

    function updateSPKMaxQty() {
        const poId = document.getElementById('spk_po_customer').value;
        const kode = document.getElementById('spk_kode_jadi').value;
        const qtyInfo = document.getElementById('spk_qty_info');
        const qtyInput = document.getElementById('spk_qty_jadi');

        if (!poId || !kode) {
            qtyInfo.style.display = 'none';
            qtyInput.removeAttribute('max');
            return;
        }

        const po = cachedPOData.find(p => p.id_po_customer === poId || p.no_penawaran === poId);
        if (!po) return;

        let orderedQty = 0;
        try {
            const items = typeof po.item_po === 'string' ? JSON.parse(po.item_po) : po.item_po;
            const bom = cachedBOMData.find(b => b.kode_barang === kode);
            const bomName = bom ? String(bom.nama_barang || '').toLowerCase() : '';

            const matchItem = items.find(i => {
                const iName = String(i.nama || i.part_name || '').trim().toLowerCase();
                return iName === bomName || bomName.includes(iName) || iName.includes(bomName);
            });

            if (matchItem) {
                orderedQty = parseInt(matchItem.qty || matchItem.moq_pcs || 0);
            }
        } catch (e) { }

        if (orderedQty > 0) {
            let producedQty = 0;
            cachedProduksiData.forEach(spk => {
                const spkRef = spk['referensi_penawaran'] || spk['referensi_po'] || spk['referensi_penawaran_/_po'] || Object.values(spk)[8] || '';
                const spkKode = spk['kode_barang_jadi'] || spk['barang_jadi'] || '';
                if (String(spkRef).trim() === poId && spkKode === kode) {
                    if (spk.status !== 'Batal') {
                        producedQty += parseInt(spk.qty_produksi || 0);
                    }
                }
            });

            let sisaQty = orderedQty - producedQty;
            if (sisaQty < 0) sisaQty = 0;

            qtyInfo.textContent = `Sisa Qty Belum SPK: ${sisaQty} (Pesanan: ${orderedQty}, Sudah SPK: ${producedQty})`;
            qtyInfo.style.display = 'block';
            qtyInput.setAttribute('max', sisaQty);

            if (sisaQty === 0) {
                qtyInfo.style.color = 'var(--danger)';
                qtyInput.value = 0;
            } else {
                qtyInfo.style.color = 'var(--warning)';
                if (parseInt(qtyInput.value || 0) > sisaQty) {
                    qtyInput.value = sisaQty;
                }
            }
        } else {
            qtyInfo.style.display = 'none';
            qtyInput.removeAttribute('max');
        }
    }

    document.getElementById('spk_po_customer')?.addEventListener('change', (e) => {
        document.getElementById('spk_no_penawaran').value = e.target.value;
        populateSPKBarangJadi(e.target.value);
        document.getElementById('spk_qty_jadi').value = '';
        document.getElementById('spk_qty_info').style.display = 'none';
        updateSPKMaxQty();
        calculateSPKEstimasi();
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

    document.getElementById('spk_kode_jadi').addEventListener('change', () => {
        updateSPKMaxQty();
        calculateSPKEstimasi();
    });
    document.getElementById('spk_qty_jadi').addEventListener('input', calculateSPKEstimasi);

    document.getElementById('btn-close-produksi')?.addEventListener('click', () => {
        produksiModal.classList.remove('active');
    });

    produksiForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const kode = document.getElementById('spk_kode_jadi').value;
        const qty = parseInt(String(document.getElementById('spk_qty_jadi').value).replace(/\D/g, '')) || 0;
        const batch_count = parseInt(document.getElementById('spk_batch_count').value) || 1;

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

        const editModeNo = document.getElementById('spk_edit_mode_no').value;

        const payload = {
            kode_barang: kode,
            qty: qty,
            batch_count: batch_count,
            bahan_baku: calculatedBahan,
            no_penawaran: document.getElementById('spk_no_penawaran')?.value || '',
            peminta: document.getElementById('spk_peminta').value,
            pemberi: Array.from(document.getElementById('spk_pemberi').selectedOptions).map(o => o.value).join(', ')
        };

        if (editModeNo) {
            payload.spk_edit_mode_no = editModeNo;
        }

        const btnSubmit = produksiForm.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;
        }

        produksiModal.classList.remove('active');
        if (typeof showToast !== 'undefined') showToast('Sinkronisasi SPK ke server...', 'info', 3000);

        // Optimistic Add/Edit
        const tbody = document.getElementById('table-produksi');
        if (tbody) {
            const tr = document.createElement('tr');
            tr.style.opacity = '0.6';
            let badgeText = batch_count > 1 ? `Memproses ${batch_count} Batch...` : `Menyimpan...`;
            if (editModeNo) badgeText = `Memperbarui...`;

            tr.innerHTML = `
            <td>${editModeNo ? editModeNo : '<i class="fa-solid fa-spinner fa-spin"></i>'}</td>
            <td>Hari ini</td>
            <td style="font-weight: 500;">${kode}</td>
            <td>${qty} (Total)</td>
            <td><span class="badge badge-warning">${badgeText}</span></td>
            <td>-</td>
        `;
            if (editModeNo) {
                // Wait for reload, we just append or prepend for now
                tbody.insertBefore(tr, tbody.firstChild);
            } else {
                tbody.insertBefore(tr, tbody.firstChild);
            }
        }

        const endpoint = editModeNo ? 'edit_spk' : 'save_spk';

        window.ERPAPI.request(endpoint, payload).then(res => {
            if (btnSubmit) {
                btnSubmit.innerHTML = 'Terbitkan SPK';
                btnSubmit.disabled = false;
            }

            if (res.status === 'success') {
                showToast?.(`✅ SPK Berhasil Disimpan`, 'success', 3000);
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
                        <div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">
                            <button class="btn btn-edit-user" data-user='${JSON.stringify(user)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-delete-user" data-username="${user.username}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>
                        </div>
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

    userForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawPassword = document.getElementById('u_password').value;
        const payload = {
            username: document.getElementById('u_username').value,
            password: rawPassword ? await sha256(rawPassword) : '',
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

        const pcCoa = document.getElementById('pc_coa');
        if (pcCoa) pcCoa.value = '';

        const displayText = document.getElementById('pc_coa_display_text');
        if (displayText) {
            displayText.textContent = '-- Pilih Pos Akuntansi --';
            displayText.style.color = '#999';
        }

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
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
        }

        const response = await window.ERPAPI.request('get_customers');
        if (response.status === 'success' && response.data) {
            customerData = response.data;
            renderCustomerTable();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat data customer</td></tr>';
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
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada data customer.</td></tr>';
            return;
        }

        filtered.forEach(c => {
            const tr = document.createElement('tr');
            let actionBtns = `<button class="btn btn-edit-customer" data-id="${c.id_customer}" data-nama="${c.nama_customer}" data-kontak="${c.kontak_telepon || c['kontak_/_telepon'] || ''}" data-alamat="${c.alamat_keterangan || c['alamat_/_keterangan'] || ''}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>`;

            const session = localStorage.getItem('erp_session');
            const user = session ? JSON.parse(session) : {};
            const isAdmin = ['Admin', 'Super Admin', 'Management', 'Direktur'].some(r => (user.role || '').toLowerCase().includes(r.toLowerCase()));

            if (isAdmin) {
                actionBtns += `<button class="btn btn-delete-customer" data-id="${c.id_customer}" data-nama="${c.nama_customer}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>`;
            }

            tr.innerHTML = `
            <td>${c.id_customer || '-'}</td>
            <td style="font-weight: 500;">${c.nama_customer || '-'}</td>
            <td>${c.kontak_telepon || c['kontak_/_telepon'] || '-'}</td>
            <td>${c.alamat_keterangan || c['alamat_/_keterangan'] || '-'}</td>
            <td>${c.tanggal_terdaftar || '-'}</td>
            <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
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
                document.getElementById('c_kontak').value = b.getAttribute('data-kontak') || '';
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
            kontak: document.getElementById('c_kontak').value,
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
                <td>${payload.kontak}</td>
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
                    if (cells.length > 3) {
                        cells[1].textContent = payload.nama;
                        cells[2].textContent = payload.kontak;
                        cells[3].textContent = payload.alamat;
                    }
                }
            }
        }

        if (typeof showToast !== 'undefined') showToast('Sinkronisasi Customer ke server...', 'info');

        window.ERPAPI.request('save_customer', payload).then(res => {
            if (res.status === 'success') {
                if (typeof showToast !== 'undefined') showToast('✅ Customer berhasil disinkronisasi!', 'success');
                loadCustomerData(true);
            } else {
                if (typeof showToast !== 'undefined') showToast('❌ Gagal: ' + (res.message || 'Gagal menyimpan customer'), 'danger');
                loadCustomerData(true);
            }
        });
    });

    // --- MASTER SUPPLIER ---
    let supplierData = [];

    async function loadSupplierData(isBackgroundSync = false) {
        const tbody = document.getElementById('table-supplier');
        if (tbody && !isBackgroundSync) {
            if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
            }
        }

        const response = await window.ERPAPI.request('get_suppliers');
        if (response.status === 'success' && response.data) {
            supplierData = response.data;
            if (tbody) renderSupplierTable();
            populateSupplierList();
        } else {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat data supplier</td></tr>';
        }
    }

    function renderSupplierTable() {
        const tbody = document.getElementById('table-supplier');
        const searchInput = document.getElementById('search-supplier');
        const query = searchInput ? searchInput.value.toLowerCase() : '';

        let filtered = supplierData.filter(s => {
            return (s.id_supplier || '').toLowerCase().includes(query) || (s.nama_supplier || '').toLowerCase().includes(query);
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada data supplier.</td></tr>';
            return;
        }

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            let actionBtns = `<button class="btn btn-edit-supplier" data-id="${s.id_supplier}" data-nama="${s.nama_supplier}" data-kontak="${s.kontak___telepon || s['kontak_/_telepon'] || ''}" data-alamat="${s.alamat || ''}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>`;

            const session = localStorage.getItem('erp_session');
            if (session) {
                actionBtns += `<button class="btn btn-delete-supplier btn-del" data-id="${s.id_supplier}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: rgba(239, 68, 68, 0.1); color: var(--danger);"><i class="fa-solid fa-trash"></i></button>`;
            }

            tr.innerHTML = `
            <td>${s.id_supplier}</td>
            <td style="font-weight: 600;">${s.nama_supplier}</td>
            <td>${s.kontak___telepon || s['kontak_/_telepon'] || '-'}</td>
            <td>${s.alamat || '-'}</td>
            <td>${s.tanggal_terdaftar || '-'}</td>
            <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
        `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit-supplier').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tr = e.target.closest('tr');
                if (!tr) return;
                const b = tr.querySelector('.btn-edit-supplier');
                document.getElementById('supp_id').value = b.dataset.id;
                document.getElementById('supp_nama').value = b.dataset.nama;
                document.getElementById('supp_kontak').value = b.dataset.kontak;
                document.getElementById('supp_alamat').value = b.dataset.alamat;
                document.getElementById('supplier-modal-title').textContent = 'Edit Supplier';
                document.getElementById('supplier-modal').classList.add('active');
            });
        });

        document.querySelectorAll('.btn-delete-supplier').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tr = e.target.closest('tr');
                if (!tr) return;
                const b = tr.querySelector('.btn-delete-supplier');
                if (confirm('Hapus supplier ini?')) {
                    tr.style.display = 'none';
                    const res = await window.ERPAPI.request('delete_supplier', { id: b.dataset.id });
                    if (res.status === 'success') {
                        showToast?.('Supplier dihapus', 'success');
                        loadSupplierData(true);
                    } else {
                        showToast?.(res.message, 'error');
                        loadSupplierData(true);
                    }
                }
            });
        });
    }

    function populateSupplierList() {
        const dataList = document.getElementById('supplier_list');
        if (!dataList) return;
        dataList.innerHTML = '';
        supplierData.forEach(s => {
            if (s.nama_supplier) {
                const option = document.createElement('option');
                option.value = s.id_supplier ? `${s.id_supplier} - ${s.nama_supplier}` : s.nama_supplier;
                option.setAttribute('data-alamat', s.alamat || '');
                dataList.appendChild(option);
            }
        });

        // Add auto-fill listener for po_to
        const poToInput = document.getElementById('po_to');
        const poAlamatInput = document.getElementById('po_alamat');
        if (poToInput && poAlamatInput && !poToInput.hasAttribute('data-listener-added')) {
            poToInput.setAttribute('data-listener-added', 'true');
            poToInput.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                const listEl = document.getElementById('supplier_list');
                if (!listEl) return;
                const options = Array.from(listEl.options);
                const match = options.find(opt => opt.value.trim() === val);
                if (match) {
                    const alamat = match.getAttribute('data-alamat');
                    poAlamatInput.value = alamat || '';
                }
            });
        }
    }

    document.getElementById('search-supplier')?.addEventListener('input', renderSupplierTable);

    document.getElementById('btn-add-supplier')?.addEventListener('click', () => {
        document.getElementById('supplier-modal-title').textContent = 'Tambah Supplier Baru';
        document.getElementById('supplier-form').reset();
        document.getElementById('supp_id').value = '';
        document.getElementById('supplier-modal').classList.add('active');
    });

    document.getElementById('btn-close-supplier-modal')?.addEventListener('click', () => {
        document.getElementById('supplier-modal').classList.remove('active');
    });

    document.getElementById('supplier-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        document.getElementById('supplier-modal').classList.remove('active');

        const payload = {
            id: document.getElementById('supp_id').value,
            nama: document.getElementById('supp_nama').value,
            kontak: document.getElementById('supp_kontak').value,
            alamat: document.getElementById('supp_alamat').value
        };

        const isEdit = !!payload.id;
        const tbody = document.getElementById('table-supplier');
        if (tbody) {
            if (!isEdit) {
                const tr = document.createElement('tr');
                tr.style.opacity = '0.6';
                tr.innerHTML = `
                <td><i class="fa-solid fa-spinner fa-spin"></i></td>
                <td style="font-weight: 500;">${payload.nama}</td>
                <td>${payload.kontak}</td>
                <td>${payload.alamat}</td>
                <td>Hari ini</td>
                <td><span class="badge badge-warning">Menyimpan...</span></td>
            `;
                tbody.insertBefore(tr, tbody.firstChild);
            }
        }

        if (typeof showToast !== 'undefined') showToast('Menyimpan Supplier...', 'info');

        window.ERPAPI.request('save_supplier', payload).then(res => {
            if (res.status === 'success') {
                if (typeof showToast !== 'undefined') showToast('✅ Supplier tersimpan!', 'success');
                loadSupplierData(true);
            } else {
                if (typeof showToast !== 'undefined') showToast('❌ Gagal: ' + (res.message || 'Gagal'), 'danger');
                loadSupplierData(true);
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
        // document.getElementById('detail_dp').textContent = 'Rp ' + (parseInt(String(item.down_payment || item.dp || '0').replace(/\D/g, '')) || 0).toLocaleString('id-ID');

        // Reset UI
        const poCustomerContainer = document.getElementById('detail_po_customer_container');
        const poCustomerStats = document.getElementById('detail_po_customer_stats');

        if (poCustomerContainer && poCustomerStats) {
            poCustomerContainer.style.display = 'block';
            poCustomerStats.innerHTML = '<p style="margin:0; color:#aaa;">Memuat data PO Customer...</p>';

            if (item.no_penawaran) {
                window.ERPAPI.request('get_po_customer').then(res => {
                    if (res.status === 'success' && res.data) {
                        const relatedPOs = res.data.filter(po => po.no_penawaran === item.no_penawaran);
                        if (relatedPOs.length === 0) {
                            poCustomerStats.innerHTML = '<p style="margin:0; color:#aaa;">Belum ada PO Customer untuk penawaran ini.</p>';
                        } else {
                            let html = '';
                            relatedPOs.forEach(po => {
                                const st = po.status || 'Draft';
                                let badgeColor = 'var(--text-muted)';
                                if (st === 'Approved') badgeColor = 'var(--success)';
                                else if (st === 'Rejected') badgeColor = 'var(--danger)';
                                else if (st === 'Proses') badgeColor = 'var(--warning)';

                                html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">
                                    <span><i class="fa-solid fa-file-invoice"></i> <strong>${po.id_po_customer}</strong> - ${po.tanggal_po || '-'}</span>
                                    <span style="color: ${badgeColor}; font-weight: bold;">${st}</span>
                                </div>`;
                            });
                            poCustomerStats.innerHTML = html;
                        }
                    } else {
                        poCustomerStats.innerHTML = '<p style="margin:0; color:#aaa;">Belum ada PO Customer untuk penawaran ini.</p>';
                    }
                }).catch(err => {
                    poCustomerStats.innerHTML = '<p style="margin:0; color:var(--danger);">Error memuat data PO Customer.</p>';
                });
            } else {
                poCustomerContainer.style.display = 'none';
            }
        }

        document.getElementById('detail-penawaran-modal').classList.add('active');

        // Render items
        const tbody = document.getElementById('detail_items_tbody');
        tbody.innerHTML = '';

        let items = [];
        try {
            items = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : (item.rincian_item || []);
        } catch (e) { }

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada item</td></tr>';
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

        const actionDiv = document.getElementById('detail-action-po');

        if ((item.status || '').toLowerCase() === 'approved') {
            if (actionDiv) actionDiv.style.display = 'flex';

            const btnCreatePO = document.getElementById('btn-detail-create-po-customer');
            if (btnCreatePO) {
                btnCreatePO.onclick = (e) => {
                    e.stopPropagation();
                    window._pendingAutoFillPO = { customer: item.customer, no_penawaran: item.no_penawaran };
                    document.getElementById('detail-penawaran-modal').classList.remove('active');
                    document.querySelector('[data-target="po-customer"]')?.click();
                    setTimeout(() => {
                        const btnAddPO = document.getElementById('btn-add-po-customer');
                        if (btnAddPO) btnAddPO.click();
                    }, 50);
                };
            }
        } else {
            if (actionDiv) actionDiv.style.display = 'none';
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
            <div style="grid-column:1/-1;"><div style="font-size:0.75rem; color:var(--text-muted);">REFERENSI PO</div><div style="font-weight:600; color:var(--accent);">${item.no_penawaran || '<span style="color:var(--text-muted); font-weight:normal;">Internal (Tidak Terkoneksi)</span>'}</div></div>
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

    // --- SURAT JALAN (DO) ---
    let suratJalanData = [];

    async function loadSuratJalanData(isBackgroundSync = false) {
        const tbody = document.getElementById('table-surat-jalan');
        if (tbody && !isBackgroundSync && (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data'))) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';

        const response = await window.ERPAPI.request('get_surat_jalan');
        if (response.status === 'success' && response.data) {
            suratJalanData = response.data;
            if (tbody) renderSuratJalanTable();
        } else {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat data surat jalan</td></tr>';
        }
    }

    function renderSuratJalanTable() {
        const tbody = document.getElementById('table-surat-jalan');
        tbody.innerHTML = '';
        if (suratJalanData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada data surat jalan.</td></tr>';
            return;
        }
        suratJalanData.forEach(sj => {
            const tr = document.createElement('tr');
            let badgeClass = 'badge-warning';
            if (sj.status === 'Selesai (Diterima)') badgeClass = 'badge-success';
            else if (sj.status === 'Batal') badgeClass = 'badge-danger';

            let actionBtns = `
            <button class="btn btn-edit-sj" data-idx="${suratJalanData.indexOf(sj)}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: rgba(16, 185, 129, 0.2); color: var(--secondary); margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-print-sj" data-idx="${suratJalanData.indexOf(sj)}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: rgba(59, 130, 246, 0.2); color: #60a5fa; margin-right: 5px;"><i class="fa-solid fa-print"></i></button>
            <button class="btn btn-delete-sj" data-no="${sj.no_sj}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: rgba(239, 68, 68, 0.1); color: var(--danger);"><i class="fa-solid fa-trash"></i></button>
        `;

            tr.innerHTML = `
            <td><strong>${sj.no_sj}</strong></td>
            <td>${sj.tanggal || '-'}</td>
            <td>${sj.no_penawaran || '-'}</td>
            <td>${sj.customer || '-'}</td>
            <td><span class="badge ${badgeClass}">${sj.status || 'Dikirim'}</span></td>
            <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
        `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-print-sj').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-idx');
                printSuratJalan(suratJalanData[idx]);
            });
        });

        document.querySelectorAll('.btn-edit-sj').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-idx');
                const item = suratJalanData[idx];

                document.getElementById('surat-jalan-form').reset();
                document.getElementById('sj_no').value = item.no_sj || '';
                document.getElementById('sj_tanggal').value = item.tanggal ? item.tanggal.split('/').reverse().join('-') : '';
                document.getElementById('sj_id_po_customer').value = item.no_penawaran || '';
                document.getElementById('sj_customer').value = item.customer || '';
                document.getElementById('sj_supir').value = item.supir || '';
                document.getElementById('sj_plat').value = item.plat_nomor || '';
                document.getElementById('sj_status').value = item.status || 'Dikirim';
                document.getElementById('sj_catatan').value = item.catatan || '';

                let sjItems = [];
                try { sjItems = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []); } catch (e) { }
                document.getElementById('sj_items_hidden').value = JSON.stringify(sjItems);

                const tbody = document.getElementById('sj-items-tbody');
                if (tbody) {
                    tbody.innerHTML = '';
                    if (sjItems.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada item</td></tr>';
                    } else {
                        sjItems.forEach(it => {
                            const iname = String(it.nama || it.item || '').trim();
                            const qty = parseInt(it.qty || 0);
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                            <td>${iname}<input type="hidden" class="sj-item-name" value="${iname}"></td>
                            <td style="text-align: right;">-</td>
                            <td style="text-align: right; color: var(--success);">-</td>
                            <td>
                                <input type="number" class="sj-item-qty" min="0" value="${qty}" style="width: 100%; padding: 0.4rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--glass-border); border-radius: 4px;">
                            </td>
                        `;
                            tbody.appendChild(tr);
                        });
                    }
                }

                document.getElementById('surat-jalan-modal').classList.add('active');
            });
        });

        document.querySelectorAll('.btn-delete-sj').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const no = e.currentTarget.getAttribute('data-no');
                if (confirm(`Hapus Surat Jalan ${no}?`)) {
                    e.currentTarget.closest('tr').style.display = 'none';
                    const res = await window.ERPAPI.request('delete_surat_jalan', { no_sj: no });
                    if (res.status === 'success') loadSuratJalanData(true);
                    else { showToast?.(res.message, 'danger'); loadSuratJalanData(true); }
                }
            });
        });
    }

    function printSuratJalan(item) {
        document.getElementById('print_sj_company_name').textContent = cachedSettings['NAMA_PERUSAHAAN'] || 'PT. Orion Karya Sejahtera';
        document.getElementById('print_sj_company_address').innerHTML = (cachedSettings['ALAMAT'] || '') + '<br>' + (cachedSettings['NO_TELP'] || '');

        document.getElementById('print_sj_customer').textContent = item.customer || '-';
        document.getElementById('print_sj_no').textContent = item.no_sj || '-';
        document.getElementById('print_sj_date').textContent = item.tanggal || '-';
        document.getElementById('print_sj_po').textContent = item.no_penawaran || '-';
        document.getElementById('print_sj_plat').textContent = item.plat_nomor || '-';
        document.getElementById('print_sj_supir').textContent = item.supir || '-';

        const tbody = document.getElementById('print-sj-items');
        tbody.innerHTML = '';

        let items = [];
        try { items = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []); } catch (e) { }

        if (items && items.length > 0) {
            items.forEach((it, i) => {
                tbody.innerHTML += `
                <tr>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${i + 1}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${it.nama || it.item || '-'}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${it.satuan || 'Pcs'}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${it.qty || 0}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${it.keterangan || ''}</td>
                </tr>
            `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="border: 1px solid #000; padding: 5px; text-align: center;">Tidak ada barang</td></tr>`;
        }

        document.body.classList.remove('printing-sj', 'printing-inv', 'printing-po');
        document.body.classList.add('printing-sj');
        window.print();
    }

    document.getElementById('btn-add-surat-jalan')?.addEventListener('click', () => {
        document.getElementById('surat-jalan-form').reset();
        document.getElementById('sj_no').value = '';
        document.getElementById('sj_items_hidden').value = '';
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        const localDate = new Date(today.getTime() - offset).toISOString().split('T')[0];
        document.getElementById('sj_tanggal').value = localDate;

        const tbody = document.getElementById('sj-items-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Gunakan tombol dari Detail PO untuk fitur korelasi otomatis</td></tr>';

        document.getElementById('surat-jalan-modal').classList.add('active');
    });

    document.getElementById('btn-close-sj-modal')?.addEventListener('click', () => {
        document.getElementById('surat-jalan-modal').classList.remove('active');
    });

    document.getElementById('surat-jalan-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        let items = [];
        // Read from the dynamic table if it has items
        const rows = document.querySelectorAll('#sj-items-tbody tr');
        let hasDynamicItems = false;

        let hasExceededError = false;
        rows.forEach(tr => {
            const nameInput = tr.querySelector('.sj-item-name');
            const qtyInput = tr.querySelector('.sj-item-qty');
            if (nameInput && qtyInput) {
                hasDynamicItems = true;
                const qty = parseInt(qtyInput.value || 0);
                const maxQty = parseInt(qtyInput.getAttribute('max') || 0);

                if (qty > maxQty && maxQty > 0) {
                    hasExceededError = true;
                    alert(`Peringatan: Qty pengiriman untuk ${nameInput.value} (${qty}) melebihi sisa pesanan PO (${maxQty}).`);
                }

                if (qty > 0) {
                    items.push({
                        nama: nameInput.value,
                        qty: qty
                    });
                }
            }
        });

        if (hasExceededError) return; // prevent submit if exceeding PO

        // Fallback if table wasn't used or is empty (e.g., manual SJ without PO link)
        if (!hasDynamicItems) {
            try { items = JSON.parse(document.getElementById('sj_items_hidden').value); } catch (e) { }
        }

        if (items.length === 0) {
            alert("Peringatan: Tidak ada item yang dikirim (Qty = 0) atau tidak ada item valid.");
            return; // prevent submit
        }

        document.getElementById('surat-jalan-modal').classList.remove('active');

        const payload = {
            no_sj: document.getElementById('sj_no').value,
            tanggal: document.getElementById('sj_tanggal').value,
            no_penawaran: document.getElementById('sj_id_po_customer').value,
            customer: document.getElementById('sj_customer').value,
            supir: document.getElementById('sj_supir').value,
            plat_nomor: document.getElementById('sj_plat').value,
            status: document.getElementById('sj_status').value,
            catatan: document.getElementById('sj_catatan').value,
            items: items
        };

        showToast?.('Menyimpan Surat Jalan...', 'info');
        const res = await window.ERPAPI.request('save_surat_jalan', payload);
        if (res.status === 'success') {
            showToast?.('Surat Jalan berhasil disimpan', 'success');
            loadSuratJalanData(true);
        } else {
            showToast?.('Gagal: ' + res.message, 'danger');
        }
    });

    // --- INVOICE PENAGIHAN ---
    let invoiceData = [];

    async function loadInvoiceData(isBackgroundSync = false) {
        const tbody = document.getElementById('table-invoice');
        if (tbody && !isBackgroundSync && (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data'))) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';

        const response = await window.ERPAPI.request('get_invoices');
        if (response.status === 'success' && response.data) {
            invoiceData = response.data;
            if (tbody) renderInvoiceTable();
        } else {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat data invoice</td></tr>';
        }
    }

    function renderInvoiceTable() {
        const tbody = document.getElementById('table-invoice');
        tbody.innerHTML = '';
        if (invoiceData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada data invoice.</td></tr>';
            return;
        }
        invoiceData.forEach(inv => {
            const tr = document.createElement('tr');
            let badgeClass = 'badge-warning';
            if (inv.status_pembayaran === 'Lunas') badgeClass = 'badge-success';
            else if (inv.status_pembayaran === 'Batal') badgeClass = 'badge-danger';

            let actionBtns = `
            <button class="btn btn-edit-inv" data-idx="${invoiceData.indexOf(inv)}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: rgba(16, 185, 129, 0.2); color: var(--secondary); margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-print-inv" data-idx="${invoiceData.indexOf(inv)}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: rgba(59, 130, 246, 0.2); color: #60a5fa; margin-right: 5px;"><i class="fa-solid fa-print"></i></button>
            <button class="btn btn-delete-inv" data-no="${inv.no_invoice}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: rgba(239, 68, 68, 0.1); color: var(--danger);"><i class="fa-solid fa-trash"></i></button>
        `;

            tr.innerHTML = `
            <td><strong>${inv.no_invoice}</strong></td>
            <td>${inv.tanggal || '-'}</td>
            <td>${inv.customer || '-'}</td>
            <td>${window.formatRupiah(inv.total_tagihan || 0)}</td>
            <td><span class="badge ${badgeClass}">${inv.status_pembayaran || 'Belum Lunas'}</span></td>
            <td><div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">${actionBtns}</div></td>
        `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-print-inv').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-idx');
                printInvoice(invoiceData[idx]);
            });
        });

        document.querySelectorAll('.btn-edit-inv').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-idx');
                const item = invoiceData[idx];

                document.getElementById('invoice-form').reset();
                document.getElementById('inv_no').value = item.no_invoice || '';
                document.getElementById('inv_tanggal').value = item.tanggal ? item.tanggal.split('/').reverse().join('-') : '';
                document.getElementById('inv_jatuh_tempo').value = item.jatuh_tempo ? item.jatuh_tempo.split('/').reverse().join('-') : '';
                document.getElementById('inv_id_po_customer').value = item.no_penawaran || '';
                document.getElementById('inv_customer').value = item.customer || '';
                document.getElementById('inv_total').value = item.total_tagihan || 0;
                document.getElementById('inv_terbayar').value = item.terbayar || 0;
                document.getElementById('inv_status').value = item.status_pembayaran || 'Belum Lunas';
                document.getElementById('inv_catatan').value = item.catatan || '';

                let invItems = [];
                try { invItems = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []); } catch (err) { }
                document.getElementById('inv_items_hidden').value = JSON.stringify(invItems);

                const tbodyObj = document.getElementById('inv-items-tbody');
                if (tbodyObj) {
                    tbodyObj.innerHTML = '';
                    if (invItems.length === 0) {
                        addInvoiceItemRow();
                    } else {
                        invItems.forEach(it => {
                            addInvoiceItemRow(it);
                        });
                    }
                }

                document.getElementById('invoice-modal').classList.add('active');
            });
        });

        document.querySelectorAll('.btn-delete-inv').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const no = e.currentTarget.getAttribute('data-no');
                if (confirm(`Hapus Invoice ${no}?`)) {
                    e.currentTarget.closest('tr').style.display = 'none';
                    const res = await window.ERPAPI.request('delete_invoice', { no_invoice: no });
                    if (res.status === 'success') loadInvoiceData(true);
                    else { showToast?.(res.message, 'danger'); loadInvoiceData(true); }
                }
            });
        });
    }

    function printInvoice(item) {
        document.getElementById('print_inv_company_name').textContent = cachedSettings['NAMA_PERUSAHAAN'] || 'PT. Orion Karya Sejahtera';
        document.getElementById('print_inv_company_address').innerHTML = (cachedSettings['ALAMAT'] || '') + '<br>' + (cachedSettings['NO_TELP'] || '');

        document.getElementById('print_inv_customer').textContent = item.customer || '-';
        document.getElementById('print_inv_no').textContent = item.no_invoice || '-';
        document.getElementById('print_inv_date').textContent = item.tanggal || '-';
        document.getElementById('print_inv_due').textContent = item.jatuh_tempo || '-';
        document.getElementById('print_inv_po').textContent = item.no_penawaran || '-';

        const tbody = document.getElementById('print-inv-items');
        tbody.innerHTML = '';

        let items = [];
        try { items = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []); } catch (e) { }

        if (items && items.length > 0) {
            items.forEach((it, i) => {
                const sub = (it.qty || 0) * (it.harga || 0);
                tbody.innerHTML += `
                <tr>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${i + 1}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${it.nama || it.item || '-'}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${it.qty || 0} ${it.satuan || 'Pcs'}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">${parseInt(it.harga || 0).toLocaleString('id-ID')}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">${sub.toLocaleString('id-ID')}</td>
                </tr>
            `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="border: 1px solid #000; padding: 5px; text-align: center;">Tidak ada barang</td></tr>`;
        }

        document.getElementById('print_inv_total').textContent = parseInt(item.total_tagihan || 0).toLocaleString('id-ID');
        document.getElementById('print_inv_paid').textContent = parseInt(item.terbayar || 0).toLocaleString('id-ID');
        const sisa = parseInt(item.sisa_tagihan || item.total_tagihan || 0);
        document.getElementById('print_inv_balance').textContent = sisa.toLocaleString('id-ID');

        document.body.classList.remove('printing-sj', 'printing-inv', 'printing-po');
        document.body.classList.add('printing-inv');
        window.print();
    }

    function calculateInvoiceTotal() {
        let total = 0;
        document.querySelectorAll('#inv-items-tbody tr').forEach(tr => {
            const qtyInput = tr.querySelector('.inv-item-qty');
            const priceInput = tr.querySelector('.inv-item-price');
            const subtotalTd = tr.querySelector('.inv-item-subtotal');
            if (qtyInput && priceInput && subtotalTd) {
                const qty = parseFloat(qtyInput.value || 0);
                const price = parseFloat(priceInput.value || 0);
                const subtotal = qty * price;
                subtotalTd.textContent = window.formatRupiah(subtotal);
                total += subtotal;
            }
        });
        document.getElementById('inv_total').value = total;
    }

    function addInvoiceItemRow(item = {}) {
        const tbody = document.getElementById('inv-items-tbody');
        const tr = document.createElement('tr');

        const desc = item.nama || item.part_name || '';
        const qty = item.qty || 1;
        const price = item.harga_satuan || item.price || 0;

        tr.innerHTML = `
        <td><input type="text" class="inv-item-desc" value="${desc}" placeholder="Nama barang / Jasa" required style="width: 100%; padding: 0.4rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--glass-border); border-radius: 4px;"></td>
        <td><input type="number" class="inv-item-qty" value="${qty}" min="1" required style="width: 100%; padding: 0.4rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--glass-border); border-radius: 4px;"></td>
        <td><input type="number" class="inv-item-price" value="${price}" min="0" required style="width: 100%; padding: 0.4rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--glass-border); border-radius: 4px;"></td>
        <td style="text-align: right;" class="inv-item-subtotal">Rp 0</td>
        <td style="text-align: center;"><button type="button" class="btn btn-remove-inv-item" style="padding: 0.4rem; background: transparent; color: var(--danger); border: none;"><i class="fa-solid fa-trash"></i></button></td>
    `;

        tr.querySelector('.inv-item-qty').addEventListener('input', calculateInvoiceTotal);
        tr.querySelector('.inv-item-price').addEventListener('input', calculateInvoiceTotal);
        tr.querySelector('.btn-remove-inv-item').addEventListener('click', () => {
            tr.remove();
            calculateInvoiceTotal();
        });

        tbody.appendChild(tr);
        calculateInvoiceTotal();
    }

    document.getElementById('btn-add-inv-item')?.addEventListener('click', () => {
        addInvoiceItemRow();
    });

    document.getElementById('btn-add-invoice')?.addEventListener('click', () => {
        document.getElementById('invoice-form').reset();
        document.getElementById('inv_no').value = '';
        document.getElementById('inv_items_hidden').value = '';
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        document.getElementById('inv_tanggal').value = new Date(today.getTime() - offset).toISOString().split('T')[0];
        document.getElementById('inv_jatuh_tempo').value = new Date(today.getTime() - offset + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +30 days
        document.getElementById('inv-items-tbody').innerHTML = '';
        addInvoiceItemRow(); // start with 1 empty row
        calculateInvoiceTotal();
        document.getElementById('invoice-modal').classList.add('active');
    });

    document.getElementById('btn-close-inv-modal')?.addEventListener('click', () => {
        document.getElementById('invoice-modal').classList.remove('active');
    });

    document.getElementById('invoice-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        let items = [];
        const rows = document.querySelectorAll('#inv-items-tbody tr');
        let hasDynamicItems = false;

        rows.forEach(tr => {
            const descInput = tr.querySelector('.inv-item-desc');
            const qtyInput = tr.querySelector('.inv-item-qty');
            const priceInput = tr.querySelector('.inv-item-price');
            if (descInput && qtyInput && priceInput) {
                hasDynamicItems = true;
                const qty = parseFloat(qtyInput.value || 0);
                if (qty > 0 && descInput.value.trim() !== '') {
                    items.push({
                        nama: descInput.value.trim(),
                        qty: qty,
                        harga_satuan: parseFloat(priceInput.value || 0),
                        subtotal: qty * parseFloat(priceInput.value || 0)
                    });
                }
            }
        });

        if (!hasDynamicItems) {
            try { items = JSON.parse(document.getElementById('inv_items_hidden').value); } catch (e) { }
        }

        if (items.length === 0) {
            alert("Peringatan: Tidak ada rincian tagihan yang valid.");
            return;
        }

        document.getElementById('invoice-modal').classList.remove('active');

        const payload = {
            no_invoice: document.getElementById('inv_no').value,
            tanggal: document.getElementById('inv_tanggal').value,
            jatuh_tempo: document.getElementById('inv_jatuh_tempo').value,
            no_penawaran: document.getElementById('inv_id_po_customer').value,
            customer: document.getElementById('inv_customer').value,
            total_tagihan: document.getElementById('inv_total').value,
            terbayar: document.getElementById('inv_terbayar').value,
            status_pembayaran: document.getElementById('inv_status').value,
            catatan: document.getElementById('inv_catatan').value,
            items: items
        };

        showToast?.('Menyimpan Invoice...', 'info');
        const res = await window.ERPAPI.request('save_invoice', payload);
        if (res.status === 'success') {
            showToast?.('Invoice berhasil disimpan', 'success');
            loadInvoiceData(true);
        } else {
            showToast?.('Gagal: ' + res.message, 'danger');
        }
    });
}

// ==========================================
// COA
// ==========================================
let coaDataList = [];

async function loadCOAData() {
    try {
        const result = await ERPAPI.request('get_coa');
        if (result.status === 'success') {
            coaDataList = result.data || [];
            renderCOATree(coaDataList);
            populateCOADatalist(coaDataList);
        } else {
            console.error('Server returned error:', result.message);
            document.getElementById('table-coa').innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Gagal memuat data: ' + result.message + '</td></tr>';
        }
    } catch (e) {
        console.error('Failed to load COA', e);
        document.getElementById('table-coa').innerHTML = '<tr><td colspan="3">Gagal memuat data</td></tr>';
    }
}

function getCOADepth(kode) {
    if (!kode) return 0;
    return kode.split('.').length - 1;
}

function isChildCOA(parentKode, childKode) {
    if (!parentKode || !childKode) return false;
    return childKode.startsWith(parentKode + '.') && getCOADepth(childKode) === getCOADepth(parentKode) + 1;
}

function renderCOATree(data) {
    const tbody = document.getElementById('table-coa');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Tidak ada data COA</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    // Map data by kode for quick parent/child lookup
    const dataMap = {};
    const roots = [];

    data.forEach(item => {
        dataMap[item.kode] = { ...item, children: [] };
    });

    data.forEach(item => {
        let isRoot = true;
        // find parent
        for (let potentialParent of data) {
            if (isChildCOA(potentialParent.kode, item.kode)) {
                if (dataMap[potentialParent.kode]) {
                    dataMap[potentialParent.kode].children.push(dataMap[item.kode]);
                    isRoot = false;
                    break;
                }
            }
        }
        if (isRoot) roots.push(dataMap[item.kode]);
    });

    const renderNode = (node, depth, parentKode) => {
        const tr = document.createElement('tr');
        tr.className = 'coa-row';
        tr.dataset.kode = node.kode;
        tr.dataset.parent = parentKode || '';

        // Hide by default if depth > 0, actually let's just make it toggleable
        // If user wants it collapsed initially:
        if (depth > 0) tr.style.display = 'none';

        const hasChildren = node.children && node.children.length > 0;

        const paddingLeft = depth * 20 + 10;
        const toggleHtml = hasChildren
            ? `<span class="coa-toggle" onclick="toggleCOAChildren('${node.kode}')"><i class="fa-solid fa-caret-right" id="coa-icon-${node.kode.replace(/[^a-zA-Z0-9]/g, '-')}"></i></span>`
            : `<span class="coa-toggle"></span>`;

        tr.innerHTML = `
            <td style="padding-left: ${paddingLeft}px;">${toggleHtml} ${node.kode}</td>
            <td>${node.keterangan || '-'}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn admin-only" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--secondary); display: inline-flex; align-items: center; justify-content: center;" onclick='editCOA(${JSON.stringify(node).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn admin-only" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex; align-items: center; justify-content: center;" onclick="deleteCOA('${node.kode}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        if (hasChildren) {
            node.children.forEach(child => renderNode(child, depth + 1, node.kode));
        }
    };

    roots.forEach(root => renderNode(root, 0, null));
}

window.toggleCOAChildren = function (parentKode) {
    const tbody = document.getElementById('table-coa');
    const rows = tbody.querySelectorAll('.coa-row');

    const icon = document.getElementById('coa-icon-' + parentKode.replace(/[^a-zA-Z0-9]/g, '-'));
    let isExpanding = true;
    if (icon && icon.classList.contains('fa-caret-right')) {
        icon.classList.remove('fa-caret-right');
        icon.classList.add('fa-caret-down');
        isExpanding = true;
    } else if (icon) {
        icon.classList.remove('fa-caret-down');
        icon.classList.add('fa-caret-right');
        isExpanding = false;
    }

    // Toggle immediate children
    rows.forEach(row => {
        if (row.dataset.parent === parentKode) {
            row.style.display = isExpanding ? '' : 'none';
            // If collapsing, collapse all descendants recursively
            if (!isExpanding) {
                hideAllDescendants(row.dataset.kode);
            }
        }
    });
};

function hideAllDescendants(parentKode) {
    const rows = document.getElementById('table-coa').querySelectorAll('.coa-row');
    const icon = document.getElementById('coa-icon-' + parentKode.replace(/[^a-zA-Z0-9]/g, '-'));
    if (icon) {
        icon.classList.remove('fa-caret-down');
        icon.classList.add('fa-caret-right');
    }
    rows.forEach(row => {
        if (row.dataset.parent === parentKode) {
            row.style.display = 'none';
            hideAllDescendants(row.dataset.kode);
        }
    });
}

function populateCOADatalist(data) {
    // Populate Custom Tree Dropdown for Petty Cash
    renderPettyCashCOATree(data);

    // Populate the parent select in COA modal
    const parentSelect = document.getElementById('coa_parent_kode');
    if (parentSelect) {
        parentSelect.innerHTML = '<option value="">-- Buat Root Baru / Ketik Manual --</option>';
        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.kode;
            opt.textContent = `${item.kode} - ${item.keterangan}`;
            parentSelect.appendChild(opt);
        });
    }
}

function renderPettyCashCOATree(data) {
    const tbody = document.getElementById('pc_coa_tree_body');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td style="text-align: center; padding: 10px;">Tidak ada data COA</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    const dataMap = {};
    const roots = [];

    data.forEach(item => {
        dataMap[item.kode] = { ...item, children: [] };
    });

    data.forEach(item => {
        let isRoot = true;
        for (let potentialParent of data) {
            if (isChildCOA(potentialParent.kode, item.kode)) {
                if (dataMap[potentialParent.kode]) {
                    dataMap[potentialParent.kode].children.push(dataMap[item.kode]);
                    isRoot = false;
                    break;
                }
            }
        }
        if (isRoot) roots.push(dataMap[item.kode]);
    });

    const renderNode = (node, depth, parentKode) => {
        const tr = document.createElement('tr');
        tr.className = 'pc-coa-row';
        tr.dataset.kode = node.kode;
        tr.dataset.parent = parentKode || '';

        if (depth > 0) tr.style.display = 'none';

        const hasChildren = node.children && node.children.length > 0;
        const paddingLeft = depth * 20 + 10;

        const toggleHtml = hasChildren
            ? `<span class="pc-coa-toggle" onclick="togglePCCoaChildren(event, '${node.kode}')" style="cursor:pointer; display:inline-block; width:20px; text-align:center;"><i class="fa-solid fa-caret-right" id="pc-coa-icon-${node.kode.replace(/[^a-zA-Z0-9]/g, '-')}"></i></span>`
            : `<span class="pc-coa-toggle" style="display:inline-block; width:20px;"></span>`;

        tr.innerHTML = `
            <td style="padding: 8px; padding-left: ${paddingLeft}px; border-bottom: 1px solid var(--glass-border); cursor: pointer;" onclick="selectPCCoa('${node.kode}', '${node.keterangan.replace(/'/g, "\\'")}')">
                ${toggleHtml} <span style="font-weight: ${hasChildren ? 'bold' : 'normal'}; color: var(--text-main);">${node.kode} - ${node.keterangan}</span>
            </td>
        `;
        tbody.appendChild(tr);

        if (hasChildren) {
            node.children.forEach(child => renderNode(child, depth + 1, node.kode));
        }
    };

    roots.forEach(root => renderNode(root, 0, null));
}

window.togglePCCoaChildren = function (e, parentKode) {
    e.stopPropagation(); // prevent selecting the row
    const rows = document.querySelectorAll('.pc-coa-row');
    const icon = document.getElementById('pc-coa-icon-' + parentKode.replace(/[^a-zA-Z0-9]/g, '-'));

    let isExpanding = true;
    if (icon && icon.classList.contains('fa-caret-right')) {
        icon.classList.replace('fa-caret-right', 'fa-caret-down');
        isExpanding = true;
    } else if (icon) {
        icon.classList.replace('fa-caret-down', 'fa-caret-right');
        isExpanding = false;
    }

    rows.forEach(row => {
        if (row.dataset.parent === parentKode) {
            row.style.display = isExpanding ? '' : 'none';
            if (!isExpanding) {
                hideAllPCCoaDescendants(row.dataset.kode);
            }
        }
    });
};

function hideAllPCCoaDescendants(parentKode) {
    const rows = document.querySelectorAll('.pc-coa-row');
    const icon = document.getElementById('pc-coa-icon-' + parentKode.replace(/[^a-zA-Z0-9]/g, '-'));
    if (icon) icon.classList.replace('fa-caret-down', 'fa-caret-right');

    rows.forEach(row => {
        if (row.dataset.parent === parentKode) {
            row.style.display = 'none';
            hideAllPCCoaDescendants(row.dataset.kode);
        }
    });
}

window.selectPCCoa = function (kode, keterangan) {
    document.getElementById('pc_coa').value = `${kode} - ${keterangan}`;
    const display = document.getElementById('pc_coa_display_text');
    if (display) {
        display.textContent = `${kode} - ${keterangan}`;
        display.style.color = 'var(--text-main)';
    }
    document.getElementById('pc_coa_dropdown').style.display = 'none';
};

// Dropdown interactions
document.getElementById('pc_coa_display')?.addEventListener('click', function (e) {
    const dd = document.getElementById('pc_coa_dropdown');
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', function (e) {
    const display = document.getElementById('pc_coa_display');
    const dd = document.getElementById('pc_coa_dropdown');
    if (display && dd && !display.contains(e.target) && !dd.contains(e.target)) {
        dd.style.display = 'none';
    }
});

window.editCOA = function (item) {
    document.getElementById('coa_old_kode').value = item.kode;
    document.getElementById('coa_kode').value = item.kode;
    document.getElementById('coa_name').value = item.keterangan;
    document.getElementById('coa_parent_group').style.display = 'none'; // hide auto-gen on edit
    document.getElementById('coa-modal').classList.add('active');
};

window.deleteCOA = async function (kode) {
    if (!confirm('Hapus COA ini? Semua sub-COA tidak akan terhapus tapi mungkin kehilangan parent!')) return;
    try {
        Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const result = await ERPAPI.request('delete_coa', { kode: kode });
        if (result.status === 'success') {
            Swal.fire('Berhasil', result.message, 'success');
            loadCOAData();
        } else {
            Swal.fire('Gagal', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', error.toString(), 'error');
    }
};

document.getElementById('coa_parent_kode')?.addEventListener('change', function (e) {
    const parentKode = e.target.value;
    const kodeInput = document.getElementById('coa_kode');
    if (!parentKode) {
        kodeInput.value = '';
        kodeInput.readOnly = false;
        return;
    }

    // Auto generate next code
    let maxSuffix = 0;
    coaDataList.forEach(item => {
        if (isChildCOA(parentKode, item.kode)) {
            const parts = item.kode.split('.');
            const lastPart = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastPart) && lastPart > maxSuffix) {
                maxSuffix = lastPart;
            }
        }
    });

    const nextSuffix = (maxSuffix + 1).toString().padStart(2, '0');
    kodeInput.value = `${parentKode}.${nextSuffix}`;
    // If you want them to be able to edit the auto-generated code, keep it false
    kodeInput.readOnly = false;
});

document.getElementById('coa-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldKode = document.getElementById('coa_old_kode').value;
    const kode = document.getElementById('coa_kode').value;
    const name = document.getElementById('coa_name').value;

    try {
        const btnSubmit = document.querySelector('#coa-form button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;
        }

        const result = await ERPAPI.request('save_coa', { old_kode: oldKode, kode: kode, keterangan: name });

        if (btnSubmit) {
            btnSubmit.innerHTML = 'Simpan';
            btnSubmit.disabled = false;
        }

        if (result.status === 'success') {
            showToast('✅ Berhasil: ' + result.message, 'success');
            document.getElementById('coa-modal').classList.remove('active');
            loadCOAData();
        } else {
            showToast('❌ Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.toString(), 'error');
    }
});

document.getElementById('btn-add-coa')?.addEventListener('click', () => {
    document.getElementById('coa-form').reset();
    document.getElementById('coa_old_kode').value = '';
    document.getElementById('coa_parent_group').style.display = 'block';
    document.getElementById('coa_kode').readOnly = false;
    document.getElementById('coa-modal').classList.add('active');
});

document.getElementById('btn-close-coa')?.addEventListener('click', () => {
    document.getElementById('coa-modal').classList.remove('active');
});

// ==========================================
// HAK AKSES (RBAC) LOGIC
// ==========================================
let currentRBACData = [];
const MENUS = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'sales', name: 'Penawaran (Sales)' },
    { id: 'po-customer', name: 'PO Customer' },
    { id: 'surat-jalan', name: 'Surat Jalan' },
    { id: 'purchasing', name: 'Data Supplier / Bahan Baku' },
    { id: 'po-internal', name: 'PO Internal' },
    { id: 'grn', name: 'Penerimaan Barang (GRN)' },
    { id: 'bom', name: 'BOM / Komposisi' },
    { id: 'barang-jadi', name: 'Master Barang Jadi' },
    { id: 'produksi', name: 'SPK Produksi' },
    { id: 'transaksi-gudang', name: 'Transaksi Gudang' },
    { id: 'finance', name: 'Finance / Petty Cash' },
    { id: 'laporan-kas', name: 'Laporan Kas' },
    { id: 'invoice', name: 'Invoice' },
    { id: 'coa', name: 'Chart of Accounts (COA)' },
    { id: 'customer', name: 'Master Customer' },
    { id: 'supplier', name: 'Master Supplier' },
    { id: 'admin', name: 'Manajemen User' },
    { id: 'pengaturan', name: 'Menu Pengaturan', viewOnly: true },
    { id: 'profil', name: 'Profil Perusahaan', viewOnly: true },
    { id: 'rbac', name: 'Manajemen Akses (RBAC)', viewOnly: true }
];

async function loadRBACData() {
    const tbody = document.getElementById('table-rbac');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat hak akses...</td></tr>`;

    try {
        const response = await window.ERPAPI.request('get_all_permissions');
        if (response.status === 'success') {
            currentRBACData = response.data;
            renderRBACTable();
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat: ${response.message}</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Error: ${error.message}</td></tr>`;
    }
}

function renderRBACTable() {
    const tbody = document.getElementById('table-rbac');
    if (!tbody) return;
    tbody.innerHTML = '';

    const roles = ['Admin', 'Super Admin', 'Gudang', 'Produksi', 'Purchasing', 'Marketing', 'Finance', 'Management', 'Direktur']; // Dari DB Users

    roles.forEach(role => {
        const safeRole = role.replace(/\s+/g, '-');

        // Tambahkan Header Grup Role
        const trGroup = document.createElement('tr');
        trGroup.style.cursor = 'pointer';
        trGroup.innerHTML = `
            <td colspan="5" style="background: var(--bg-glass); border-top: 2px solid var(--glass-border); padding: 15px 10px; font-weight: bold; font-size: 1.1rem; color: var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fa-solid fa-user-shield"></i> Akses Role: ${role}</span>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                </div>
            </td>
        `;
        tbody.appendChild(trGroup);

        const childRows = [];

        MENUS.forEach((menu, index) => {
            let perm = currentRBACData.find(p => p.role.toLowerCase() === role.toLowerCase() && p.menu_id === menu.id);
            if (!perm) {
                // Default fallback if not found
                const isPurchasing = role.toLowerCase().includes('purchasing');
                const isProduksi = role.toLowerCase().includes('produksi') || role.toLowerCase().includes('gudang');
                const isFinance = role.toLowerCase().includes('finance') || role.toLowerCase().includes('accounting');
                const isSales = role.toLowerCase().includes('marketing');
                const isAdmin = ['direktur', 'admin', 'management', 'super admin'].some(r => role.toLowerCase().includes(r));

                let defaultView = isAdmin;
                if (!isAdmin) {
                    if (isPurchasing && ['purchasing', 'po-internal', 'supplier'].includes(menu.id)) defaultView = true;
                    if (isProduksi && ['produksi', 'bom', 'grn', 'surat-jalan', 'barang-jadi'].includes(menu.id)) defaultView = true;
                    if (isFinance && ['finance', 'invoice', 'laporan-kas', 'coa'].includes(menu.id)) defaultView = true;
                    if (isSales && ['sales', 'po-customer', 'customer'].includes(menu.id)) defaultView = true;
                }

                perm = {
                    role: role,
                    menu_id: menu.id,
                    can_view: defaultView,
                    can_add: defaultView,
                    can_edit: defaultView,
                    can_delete: defaultView
                };
                currentRBACData.push(perm);
            }

            const tr = document.createElement('tr');
            tr.className = `rbac-child-${safeRole}`;
            // Sembunyikan secara default agar rapi (collapse awal)
            tr.style.display = 'none';

            tr.innerHTML = `
                <td style="padding-left: 30px;">${menu.name}</td>
                <td style="text-align: center;">
                    <input type="checkbox" class="rbac-cb" data-role="${role}" data-menu="${menu.id}" data-action="can_view" ${perm.can_view ? 'checked' : ''}>
                </td>
                <td style="text-align: center;">
                    ${menu.viewOnly ? '<span style="color: var(--text-muted);">-</span>' : `<input type="checkbox" class="rbac-cb" data-role="${role}" data-menu="${menu.id}" data-action="can_add" ${perm.can_add ? 'checked' : ''}>`}
                </td>
                <td style="text-align: center;">
                    ${menu.viewOnly ? '<span style="color: var(--text-muted);">-</span>' : `<input type="checkbox" class="rbac-cb" data-role="${role}" data-menu="${menu.id}" data-action="can_edit" ${perm.can_edit ? 'checked' : ''}>`}
                </td>
                <td style="text-align: center;">
                    ${menu.viewOnly ? '<span style="color: var(--text-muted);">-</span>' : `<input type="checkbox" class="rbac-cb" data-role="${role}" data-menu="${menu.id}" data-action="can_delete" ${perm.can_delete ? 'checked' : ''}>`}
                </td>
            `;
            tbody.appendChild(tr);
            childRows.push(tr);
        });

        // Set chevron awal karena defaultnya tertutup (collapsed)
        const icon = trGroup.querySelector('.chevron-icon');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');

        // Toggle Expand/Collapse
        trGroup.addEventListener('click', () => {
            const isHidden = childRows[0].style.display === 'none';

            childRows.forEach(row => {
                row.style.display = isHidden ? '' : 'none';
            });

            if (isHidden) {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
        });
    });

    // Update currentRBACData on checkbox change
    document.querySelectorAll('.rbac-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const role = e.target.getAttribute('data-role');
            const menuId = e.target.getAttribute('data-menu');
            const action = e.target.getAttribute('data-action');
            const isChecked = e.target.checked;

            const perm = currentRBACData.find(p => p.role.toLowerCase() === role.toLowerCase() && p.menu_id === menuId);
            if (perm) {
                perm[action] = isChecked;
                // If view is disabled, disable others automatically
                if (action === 'can_view' && !isChecked) {
                    perm.can_add = false;
                    perm.can_edit = false;
                    perm.can_delete = false;

                    // Update DOM directly to avoid re-rendering and collapsing the accordion
                    const tr = e.target.closest('tr');
                    if (tr) {
                        const rowCbs = tr.querySelectorAll('.rbac-cb');
                        rowCbs.forEach(cb => cb.checked = false);
                    }
                }
            }
        });
    });
}

document.getElementById('btn-save-rbac')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-rbac');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const response = await window.ERPAPI.request('save_permissions', { permissions: currentRBACData });
        if (response.status === 'success') {
            showToast('✅ Hak Akses berhasil disimpan!', 'success');
            if (typeof window.checkSession === 'function') window.checkSession(); // Re-sync session immediately for current user
        } else {
            showToast('❌ Gagal: ' + response.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
    }

    btn.innerHTML = '<i class="fa-solid fa-save"></i> Simpan Hak Akses';
    btn.disabled = false;
});

window.checkRBACAction = function (action, menuId) {
    const session = localStorage.getItem('erp_session');
    if (!session) return false;
    const user = JSON.parse(session);

    // Fallback: Admin can do anything
    const isAdmin = ['direktur', 'admin', 'management', 'super admin'].some(r => user.role.toLowerCase().includes(r));

    if (user.permissions && user.permissions[menuId]) {
        return user.permissions[menuId][action] === true;
    }

    return isAdmin;
};

window.applyRBACToButtons = function (menuId, container) {
    const dom = container || document;
    const canAdd = window.checkRBACAction('can_add', menuId);
    const canEdit = window.checkRBACAction('can_edit', menuId);
    const canDelete = window.checkRBACAction('can_delete', menuId);

    // Hide/Show Add buttons
    dom.querySelectorAll('[id^="btn-add"], [class*="btn-add"]').forEach(btn => {
        btn.style.display = canAdd ? '' : 'none';
    });

    // Hide/Show Edit buttons
    dom.querySelectorAll('[class*="btn-edit"]').forEach(btn => {
        btn.style.display = canEdit ? '' : 'none';
    });

    // Hide/Show Delete buttons
    dom.querySelectorAll('[class*="btn-delete"], [class*="btn-del"]').forEach(btn => {
        btn.style.display = canDelete ? '' : 'none';
    });
};

// Auto-enforce RBAC on DOM changes
const rbacObserver = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const m of mutations) {
        if (m.addedNodes.length > 0) {
            shouldCheck = true;
            break;
        }
    }
    if (shouldCheck) {
        document.querySelectorAll('.view.active').forEach(view => {
            const menuId = view.id.replace('view-', '');
            if (menuId !== 'admin' && menuId !== 'rbac' && menuId !== 'profil' && menuId !== 'dashboard') {
                window.applyRBACToButtons(menuId, view);
            }
        });
    }
});
rbacObserver.observe(document.body, { childList: true, subtree: true });

// ==========================================
// PENERIMAAN BARANG (GRN) LOGIC
// ==========================================
let currentGRN_PO_Data = [];
let currentGRN_History = [];

async function loadGRNData() {
    const tbody = document.getElementById('table-grn');
    if (!tbody) return;
    if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>`;
    }

    try {
        const [poRes, grnRes] = await Promise.all([
            window.ERPAPI.request('get_po_internal'),
            window.ERPAPI.request('get_penerimaan_barang')
        ]);

        if (poRes.status === 'success') {
            currentGRN_PO_Data = poRes.data.filter(po => po.status === 'Disetujui (Sedang Dibelikan)' || po.status === 'Parsial');
        }
        if (grnRes.status === 'success') {
            currentGRN_History = grnRes.data;
        }

        renderGRNTable();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Error: ${error.message}</td></tr>`;
    }
}

function renderGRNTable() {
    const tbody = document.getElementById('table-grn');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (currentGRN_PO_Data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Tidak ada PO yang menunggu penerimaan.</td></tr>`;
        return;
    }

    currentGRN_PO_Data.forEach(po => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${po.no_po}</strong></td>
            <td>${po.tanggal}</td>
            <td>${po.pemohon}</td>
            <td><span class="status-badge status-${po.status.toLowerCase()}">${po.status}</span></td>
            <td style="text-align: center;">
                <button class="btn btn-edit" onclick="openGRNModal('${po.no_po}')" style="background: var(--primary); padding: 5px 10px; font-size: 0.8rem;">
                    <i class="fa-solid fa-box-open"></i> Terima
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openGRNModal = function (no_po) {
    const po = currentGRN_PO_Data.find(p => String(p.no_po) === String(no_po));
    if (!po) return;

    document.getElementById('grn-form').reset();
    document.getElementById('grn_no_po').value = po.no_po;

    // Set default penerima to current user
    const session = localStorage.getItem('erp_session');
    if (session) {
        document.getElementById('grn_penerima').value = JSON.parse(session).nama;
    }

    const tbody = document.getElementById('grn-items-table');
    tbody.innerHTML = '';

    // Hitung qty yang sudah diterima
    const historyPO = currentGRN_History.filter(g => String(g.no_po) === String(no_po));
    let mapDiterima = {};
    historyPO.forEach(g => {
        g.daftar_item_parsed.forEach(item => {
            if (!mapDiterima[item.kode]) mapDiterima[item.kode] = 0;
            mapDiterima[item.kode] += Number(item.qty_diterima);
        });
    });

    po.items_parsed.forEach((item, index) => {
        const diminta = Number(item.qty);
        const diterima = mapDiterima[item.kode] || 0;
        const sisa = diminta - diterima;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.kode}<input type="hidden" name="grn_item_kode" value="${item.kode}"></td>
            <td>${item.nama}</td>
            <td style="text-align: center;">${diminta}</td>
            <td style="text-align: center; color: ${diterima > 0 ? 'var(--success)' : 'inherit'};">${diterima}</td>
            <td style="text-align: center;">
                <input type="number" name="grn_item_terima" min="0" max="${sisa}" value="${sisa === 0 ? 0 : ''}" ${sisa === 0 ? 'readonly' : 'required'} style="width: 100%; padding: 5px; text-align: center;">
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('grn-modal').classList.add('active');
};

document.getElementById('btn-close-grn')?.addEventListener('click', () => {
    document.getElementById('grn-modal').classList.remove('active');
});

document.getElementById('btn-cancel-grn')?.addEventListener('click', () => {
    document.getElementById('grn-modal').classList.remove('active');
});

document.getElementById('grn-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.querySelector('#grn-form button[type="submit"]');

    const no_po = document.getElementById('grn_no_po').value;
    const penerima = document.getElementById('grn_penerima').value;
    const catatan = document.getElementById('grn_catatan').value;

    const kodes = document.getElementsByName('grn_item_kode');
    const terimas = document.getElementsByName('grn_item_terima');

    let items = [];
    let totalDiterima = 0;

    for (let i = 0; i < kodes.length; i++) {
        const qty = Number(terimas[i].value);
        if (qty > 0) {
            items.push({ kode: kodes[i].value, qty_diterima: qty });
            totalDiterima += qty;
        }
    }

    if (totalDiterima === 0) {
        showToast('❌ Tidak ada qty yang diisi!', 'warning');
        return;
    }

    try {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;

        const result = await window.ERPAPI.request('save_penerimaan_barang', {
            no_po, penerima, catatan, items
        });

        if (result.status === 'success') {
            showToast('✅ Penerimaan Barang berhasil dicatat!', 'success');
            document.getElementById('grn-modal').classList.remove('active');
            loadGRNData();
        } else {
            showToast('❌ Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
    } finally {
        btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Simpan Penerimaan';
        btnSubmit.disabled = false;
    }
});

let globalPettyCashData = [];

async function loadLaporanKasData() {
    const tbody = document.getElementById('table-laporan-kas');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Laporan...</td></tr>`;

    try {
        // Load COA for filter dropdown
        const resCOA = await window.ERPAPI.request('get_coa');
        if (resCOA.status === 'success') {
            renderFilterKasCOATree(resCOA.data);
        }

        // Fetch Petty Cash data
        const res = await window.ERPAPI.request('get_petty_cash');
        if (res.status === 'success') {
            globalPettyCashData = res.data;
            applyLaporanKasFilter(); // Render table with initial empty filter
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Gagal memuat data.</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching laporan kas:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error memuat data kas.</td></tr>`;
    }
}

function renderFilterKasCOATree(data) {
    const tbody = document.getElementById('filter-kas-coa-tree-body');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td style="text-align: center; padding: 10px;">Tidak ada data COA</td></tr>';
        return;
    }

    tbody.innerHTML = `
        <tr class="filter-kas-coa-row">
            <td style="padding: 8px; border-bottom: 1px solid var(--glass-border); cursor: pointer;" onclick="selectFilterKasCOA('', '-- Semua Kategori COA --')">
                <span style="font-weight: bold; color: var(--text-main);">-- Semua Kategori COA --</span>
            </td>
        </tr>
    `;
    const dataMap = {};
    const roots = [];

    data.forEach(item => {
        dataMap[item.kode] = { ...item, children: [] };
    });

    data.forEach(item => {
        let isRoot = true;
        for (let potentialParent of data) {
            if (isChildCOA(potentialParent.kode, item.kode)) {
                if (dataMap[potentialParent.kode]) {
                    dataMap[potentialParent.kode].children.push(dataMap[item.kode]);
                    isRoot = false;
                    break;
                }
            }
        }
        if (isRoot) roots.push(dataMap[item.kode]);
    });

    const renderNode = (node, depth, parentKode) => {
        const tr = document.createElement('tr');
        tr.className = 'filter-kas-coa-row';
        tr.dataset.kode = node.kode;
        tr.dataset.parent = parentKode || '';

        if (depth > 0) tr.style.display = 'none';

        const hasChildren = node.children && node.children.length > 0;
        const paddingLeft = depth * 20 + 10;

        const toggleHtml = hasChildren
            ? `<span class="filter-kas-coa-toggle" onclick="toggleFilterKasCOAChildren(event, '${node.kode}')" style="cursor:pointer; display:inline-block; width:20px; text-align:center;"><i class="fa-solid fa-caret-right" id="filter-kas-coa-icon-${node.kode.replace(/[^a-zA-Z0-9]/g, '-')}"></i></span>`
            : `<span class="filter-kas-coa-toggle" style="display:inline-block; width:20px;"></span>`;

        tr.innerHTML = `
            <td style="padding: 8px; padding-left: ${paddingLeft}px; border-bottom: 1px solid var(--glass-border); cursor: pointer;" onclick="selectFilterKasCOA('${node.kode}', '${node.keterangan.replace(/'/g, "\\'")}')">
                ${toggleHtml} <span style="font-weight: ${hasChildren ? 'bold' : 'normal'}; color: var(--text-main);">${node.kode} - ${node.keterangan}</span>
            </td>
        `;
        tbody.appendChild(tr);

        if (hasChildren) {
            node.children.forEach(child => renderNode(child, depth + 1, node.kode));
        }
    };

    roots.forEach(root => renderNode(root, 0, null));
}

window.toggleFilterKasCOAChildren = function (e, parentKode) {
    e.stopPropagation();
    const rows = document.querySelectorAll('.filter-kas-coa-row');
    const icon = document.getElementById('filter-kas-coa-icon-' + parentKode.replace(/[^a-zA-Z0-9]/g, '-'));

    let isExpanding = true;
    if (icon && icon.classList.contains('fa-caret-right')) {
        icon.classList.replace('fa-caret-right', 'fa-caret-down');
        isExpanding = true;
    } else if (icon) {
        icon.classList.replace('fa-caret-down', 'fa-caret-right');
        isExpanding = false;
    }

    rows.forEach(row => {
        if (row.dataset.parent === parentKode) {
            row.style.display = isExpanding ? '' : 'none';
            if (!isExpanding) {
                hideAllFilterKasCOADescendants(row.dataset.kode);
            }
        }
    });
};

function hideAllFilterKasCOADescendants(parentKode) {
    const rows = document.querySelectorAll('.filter-kas-coa-row');
    const icon = document.getElementById('filter-kas-coa-icon-' + parentKode.replace(/[^a-zA-Z0-9]/g, '-'));
    if (icon) icon.classList.replace('fa-caret-down', 'fa-caret-right');

    rows.forEach(row => {
        if (row.dataset.parent === parentKode) {
            row.style.display = 'none';
            hideAllFilterKasCOADescendants(row.dataset.kode);
        }
    });
}

window.selectFilterKasCOA = function (kode, keterangan) {
    document.getElementById('filter-kas-coa').value = kode ? `${kode} - ${keterangan}` : '';
    const display = document.getElementById('filter-kas-coa-display-text');
    if (display) {
        display.textContent = kode ? `${kode} - ${keterangan}` : '-- Semua Kategori COA --';
        display.style.color = 'var(--text-main)';
    }
    document.getElementById('filter-kas-coa-dropdown').style.display = 'none';
};

// Filter Dropdown interactions
document.getElementById('filter-kas-coa-display')?.addEventListener('click', function (e) {
    const dd = document.getElementById('filter-kas-coa-dropdown');
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', function (e) {
    const display = document.getElementById('filter-kas-coa-display');
    const dd = document.getElementById('filter-kas-coa-dropdown');
    if (display && dd && !display.contains(e.target) && !dd.contains(e.target)) {
        dd.style.display = 'none';
    }
});

function applyLaporanKasFilter() {
    const startDate = document.getElementById('filter-kas-start').value;
    const endDate = document.getElementById('filter-kas-end').value;
    const coaFilter = document.getElementById('filter-kas-coa').value;

    let filteredData = globalPettyCashData;

    if (startDate) {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.waktu.split(' ')[0]);
            const sDate = new Date(startDate);
            return itemDate >= sDate;
        });
    }

    if (endDate) {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.waktu.split(' ')[0]);
            const eDate = new Date(endDate);
            return itemDate <= eDate;
        });
    }

    if (coaFilter) {
        // Match exact or prefix if using tree hierarchy logic?
        // Let's match by prefix, so choosing parent also shows children
        const prefix = coaFilter.split(' - ')[0];
        filteredData = filteredData.filter(item => item.coa && item.coa.startsWith(prefix));
    }

    renderLaporanKasTable(filteredData);
}

document.getElementById('btn-filter-kas')?.addEventListener('click', applyLaporanKasFilter);

function renderLaporanKasTable(data) {
    const tbody = document.getElementById('table-laporan-kas');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada data kas pada periode/filter tersebut.</td></tr>';
        document.getElementById('summary-kas-masuk').textContent = 'Rp 0';
        document.getElementById('summary-kas-keluar').textContent = 'Rp 0';
        return;
    }

    tbody.innerHTML = '';
    let totalMasuk = 0;
    let totalKeluar = 0;

    // Sort descending by date
    data.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

    data.forEach(item => {
        const nominal = parseFloat(item.jumlah) || 0;
        if (item.jenis === 'Masuk') totalMasuk += nominal;
        else totalKeluar += nominal;

        const badgeColor = item.jenis === 'Masuk' ? 'background: rgba(0,255,136,0.1); color: var(--success);' : 'background: rgba(255,68,68,0.1); color: var(--danger);';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.waktu}</td>
            <td>${item.user}</td>
            <td><span class="status-badge" style="${badgeColor}">${item.jenis}</span></td>
            <td>${item.coa || '-'}</td>
            <td>${item.keterangan || '-'}</td>
            <td style="font-weight: bold; color: ${item.jenis === 'Masuk' ? 'var(--success)' : 'var(--danger)'};">
                ${item.jenis === 'Masuk' ? '+' : '-'} Rp ${nominal.toLocaleString('id-ID')}
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('summary-kas-masuk').textContent = `Rp ${totalMasuk.toLocaleString('id-ID')}`;
    document.getElementById('summary-kas-keluar').textContent = `Rp ${totalKeluar.toLocaleString('id-ID')}`;
}

// Global Table Search Logic
document.addEventListener('input', function (e) {
    if (e.target && e.target.classList.contains('table-search')) {
        const targetId = e.target.getAttribute('data-target');
        const tbody = document.getElementById(targetId);
        if (!tbody) return;

        const query = e.target.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            // Skip placeholders like "Memuat data..." or "Tidak ada data"
            if (row.children.length === 1 && row.children[0].colSpan > 1) {
                return;
            }

            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    }
});

// Transaksi Gudang Logic
async function loadTransaksiGudangData(isBackgroundSync = false) {
    if (!isBackgroundSync) {
        document.getElementById('transaksi-tbody').innerHTML = '<tr><td colspan="8" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    }
    
    try {
        const res = await window.ERPAPI.request('get_transaksi_gudang');
        if (res.status === 'success' && res.data) {
            const tbody = document.getElementById('transaksi-tbody');
            if (res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Belum ada riwayat transaksi.</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            // Data descending
            res.data.reverse().forEach(item => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                const badgeClass = item.jenis === 'IN' ? 'badge-success' : 'badge-danger';
                tr.innerHTML = `
                    <td>${item.id_transaksi || '-'}</td>
                    <td>${item.tanggal || '-'}</td>
                    <td><span class="badge ${badgeClass}">${item.jenis || '-'}</span></td>
                    <td>${item.referensi || '-'}</td>
                    <td style="font-weight: 500;">${item.kode_material || '-'}</td>
                    <td>${item.qty || '-'}</td>
                    <td>${item.pic || '-'}</td>
                    <td>${item.peminta || '-'}</td>
                    <td>${item.pemberi || '-'}</td>
                    <td>${item.keterangan || '-'}</td>
                    <td>
                        <div style="display: flex; gap: 5px; flex-wrap: nowrap; min-width: max-content;">
                            ${(!item.pemberi || item.pemberi.trim() === '') ? `<button class="btn btn-approve-transaksi" data-id="${item.id_transaksi}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--secondary);" title="Setujui/Berikan Barang"><i class="fa-solid fa-check"></i></button>` : ''}
                            <button class="btn btn-edit-transaksi" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex;" title="Edit Transaksi"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-del-transaksi" data-id="${item.id_transaksi}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background: var(--danger);" title="Hapus Transaksi"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
                
                tr.addEventListener('click', (e) => {
                    if (e.target.closest('button')) return;
                    document.getElementById('td_id').textContent = item.id_transaksi || '-';
                    document.getElementById('td_tanggal').textContent = item.tanggal || '-';
                    document.getElementById('td_jenis').textContent = item.jenis || '-';
                    document.getElementById('td_jenis').className = 'badge ' + badgeClass;
                    document.getElementById('td_referensi').textContent = item.referensi || '-';
                    document.getElementById('td_bahan').textContent = item.kode_material || '-';
                    document.getElementById('td_qty').textContent = item.qty || '-';
                    document.getElementById('td_pic').textContent = item.pic || '-';
                    document.getElementById('td_peminta').textContent = item.peminta || '-';
                    document.getElementById('td_pemberi').textContent = item.pemberi || '-';
                    document.getElementById('td_keterangan').textContent = item.keterangan || '-';
                    document.getElementById('transaksi-detail-modal').classList.add('active');
                });
            });
            
            // Attach event listeners for Edit and Delete
            document.querySelectorAll('.btn-edit-transaksi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                    
                    document.getElementById('trx_id_transaksi').value = item.id_transaksi;
                    document.getElementById('trx_jenis').value = item.jenis;
                    document.getElementById('trx_qty').value = item.qty;
                    document.getElementById('trx_referensi').value = item.referensi;
                    document.getElementById('trx_peminta').value = item.peminta || '';
                    document.getElementById('trx_pemberi').value = item.pemberi || '';
                    document.getElementById('trx_keterangan').value = item.keterangan || '';
                    
                    const res = await window.ERPAPI.request('get_stock');
                    const select = document.getElementById('trx_kode_material');
                    if (select.tomselect) select.tomselect.destroy();
                    select.innerHTML = '<option value="">-- Pilih Bahan Baku --</option>';
                    if (res.status === 'success' && res.data) {
                        window.stockData = res.data;
                        res.data.forEach(st => {
                            const opt = document.createElement('option');
                            opt.value = st.kode_material;
                            opt.textContent = `${st.kode_material} - ${st.nama_material} (Stok: ${st.stok} ${st.satuan})`;
                            select.appendChild(opt);
                        });
                    }
                    
                    select.value = item.kode_material;
                    new TomSelect('#trx_kode_material', {
                        create: false,
                        sortField: { field: 'text', direction: 'asc' }
                    });
                    
                    document.getElementById('transaksi-modal-title').textContent = 'Edit Transaksi Gudang';
                    document.getElementById('transaksi-gudang-modal').classList.add('active');
                });
            });
            
            document.querySelectorAll('.btn-del-transaksi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('Yakin ingin menghapus transaksi ini? Stok bahan baku akan dikembalikan/disesuaikan secara otomatis.')) {
                        e.currentTarget.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        const res = await window.ERPAPI.request('delete_transaksi_gudang', { id });
                        if (res.status === 'success') {
                            showToast(res.message, 'success');
                            loadTransaksiGudangData();
                        } else {
                            showToast(res.message, 'error');
                            loadTransaksiGudangData();
                        }
                    }
                });
            });
            
            // Attach event listener for Approve
            document.querySelectorAll('.btn-approve-transaksi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const sess = JSON.parse(localStorage.getItem('erp_session') || '{}');
                    const pemberiName = sess.nama_lengkap || sess.username || 'Admin';
                    
                    const ok = await showConfirm({
                        title: 'Setujui Pengambilan',
                        message: `Yakin ingin menyetujui transaksi <strong>${id}</strong>?<br>Nama Anda (<strong>${pemberiName}</strong>) akan dicatat sebagai Pemberi.`,
                        icon: '✅', confirmText: 'Ya, Setujui', cancelText: 'Batal'
                    });
                    if (!ok) return;
                    
                    e.currentTarget.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    e.currentTarget.disabled = true;
                    
                    window.ERPAPI.request('approve_transaksi', { id_transaksi: id, pemberi: pemberiName }).then(res => {
                        if (res.status === 'success') {
                            if (typeof showToast !== 'undefined') showToast('✅ Transaksi disetujui', 'success');
                            loadTransaksiGudangData();
                        } else {
                            if (typeof showToast !== 'undefined') showToast('❌ Gagal menyetujui: ' + res.message, 'error');
                            loadTransaksiGudangData();
                        }
                    });
                });
            });
        }
    } catch(err) {
        console.error('Error load transaksi', err);
        if (!isBackgroundSync) {
            document.getElementById('transaksi-tbody').innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger);">Gagal memuat data</td></tr>';
        }
    }
}

// Modal Logic
document.getElementById('btn-add-transaksi')?.addEventListener('click', async () => {
    // Populate dropdown
    const res = await window.ERPAPI.request('get_stock');
    const select = document.getElementById('trx_kode_material');
    if (select.tomselect) select.tomselect.destroy();
    
    select.innerHTML = '<option value="">-- Pilih Bahan Baku --</option>';
    if (res.status === 'success' && res.data) {
        window.stockData = res.data;
        res.data.forEach(st => {
            const opt = document.createElement('option');
            opt.value = st.kode_material;
            opt.textContent = `${st.kode_material} - ${st.nama_material} (Stok: ${st.stok} ${st.satuan})`;
            select.appendChild(opt);
        });
    }
    
    new TomSelect('#trx_kode_material', {
        create: false,
        sortField: { field: 'text', direction: 'asc' }
    });
    
    document.getElementById('transaksi-gudang-form').reset();
    document.getElementById('trx_stok_info').style.display = 'none';
    const sess = JSON.parse(localStorage.getItem('erp_session') || '{}');
    document.getElementById('trx_peminta').value = sess.nama_lengkap || sess.username || '';
    
    document.getElementById('transaksi-modal-title').textContent = 'Buat Transaksi Gudang (Bahan Baku)';
    document.getElementById('trx_id_transaksi').value = '';
    
    document.getElementById('transaksi-gudang-modal').classList.add('active');
});

document.querySelector('.btn-close-transaksi')?.addEventListener('click', () => {
    document.getElementById('transaksi-gudang-modal').classList.remove('active');
});

document.querySelector('.btn-close-transaksi-detail')?.addEventListener('click', () => {
    document.getElementById('transaksi-detail-modal').classList.remove('active');
});

document.getElementById('trx_kode_material')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const info = document.getElementById('trx_stok_info');
    if (!val) {
        info.style.display = 'none';
        return;
    }
    const item = window.stockData?.find(s => s.kode_material === val);
    if (item) {
        info.textContent = `Stok Saat Ini: ${item.stok} ${item.satuan}`;
        info.style.display = 'block';
    }
});

document.getElementById('transaksi-gudang-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const jenis = document.getElementById('trx_jenis').value;
    const kode = document.getElementById('trx_kode_material').value;
    const qty = parseFloat(document.getElementById('trx_qty').value) || 0;
    const ref = document.getElementById('trx_referensi').value;
    const ket = document.getElementById('trx_keterangan').value;
    const peminta = document.getElementById('trx_peminta').value;
    const pemberi = document.getElementById('trx_pemberi').value;
    
    const idTrx = document.getElementById('trx_id_transaksi').value;
    
    if (jenis === 'OUT') {
        const item = window.stockData?.find(s => s.kode_material === kode);
        const stok = item ? parseFloat(String(item.stok).replace(/[^0-9.-]/g, '')) : 0;
        if (qty > stok && !idTrx) { // Allow bypass if editing (we will handle proper logic in backend)
            showToast('Stok tidak mencukupi untuk dikeluarkan!', 'error');
            return;
        }
    }
    
    const btn = document.getElementById('btn-save-transaksi');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;
    
    const user = JSON.parse(localStorage.getItem('erp_session') || '{}');
    const picName = user.nama || user.username || 'Admin';
    
    try {
        const res = await window.ERPAPI.request('save_transaksi_gudang', {
            id_transaksi: idTrx,
            jenis,
            kode_material: kode,
            qty,
            referensi: ref,
            peminta: peminta,
            pemberi: pemberi,
            keterangan: ket,
            pic: picName
        });
        
        if (res.status === 'success') {
            showToast('Transaksi berhasil disimpan', 'success');
            document.getElementById('transaksi-gudang-modal').classList.remove('active');
            loadTransaksiGudangData();
        } else {
            showToast(res.message, 'error');
        }
    } catch(err) {
        showToast('Terjadi kesalahan jaringan', 'error');
    }
    
    btn.innerHTML = oldText;
    btn.disabled = false;
});

});
