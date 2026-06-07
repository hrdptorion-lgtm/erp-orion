document.addEventListener('DOMContentLoaded', () => {
    
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
        const isProduksi = user.role.toLowerCase().includes('produksi');
        const isFinance = user.role.toLowerCase().includes('finance');
        const isAdmin = user.role.toLowerCase().includes('direktur') || user.role.toLowerCase().includes('admin');

        navItems.forEach(item => {
            const target = item.getAttribute('data-target');
            item.style.display = 'flex'; // Reset display

            if (!isAdmin) {
                if (isPurchasing && target !== 'dashboard' && target !== 'purchasing') item.style.display = 'none';
                if (isProduksi && target !== 'dashboard' && target !== 'produksi') item.style.display = 'none';
                if (isFinance && target !== 'dashboard' && target !== 'finance') item.style.display = 'none';
                if (item.classList.contains('admin-only')) item.style.display = 'none';
            } else {
                if (item.classList.contains('admin-only')) item.style.display = 'flex';
            }
        });

        // Trigger click on dashboard to reset view
        document.querySelector('.nav-item[data-target="dashboard"]').click();
    }

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

    btnLogout?.addEventListener('click', () => {
        localStorage.removeItem('erp_session');
        loginOverlay.classList.add('active');
    });

    // Initialize session check
    checkSession();

    // --- Sidebar Navigation ---

    const titles = {
        'dashboard': { title: 'Dashboard Overview', sub: 'Selamat datang kembali, Tim Operasional.' },
        'sales': { title: 'Penawaran & Sales', sub: 'Manajemen Penawaran kepada Customer.' },
        'purchasing': { title: 'Modul Purchasing', sub: 'Manajemen pengadaan bahan baku & inventory.' },
        'bom': { title: 'PMO & BOM Sampel', sub: 'Manajemen Komposisi Material dan Tahapan Produksi.' },
        'produksi': { title: 'Produksi & Gudang', sub: 'Surat Perintah Kerja dan pemotongan stok.' },
        'finance': { title: 'Finance & Kasir', sub: 'Penagihan, Invoice, dan Petty Cash.' },
        'admin': { title: 'Manajemen Pengguna', sub: 'Pengaturan Role Akses Aplikasi.' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active link
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch view
            const targetViewId = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${targetViewId}`) {
                    view.classList.add('active');
                }
            });

            // Update Header
            if (titles[targetViewId]) {
                pageTitle.textContent = titles[targetViewId].title;
                pageSubtitle.textContent = titles[targetViewId].sub;
            }

            // Load data based on view
            if (targetViewId === 'purchasing') {
                loadPurchasingData();
            } else if (targetViewId === 'admin') {
                loadAdminData();
            } else if (targetViewId === 'sales') {
                loadPenawaranData();
            } else if (targetViewId === 'bom') {
                loadBOMData();
            } else if (targetViewId === 'produksi') {
                loadProduksiData();
            }
        });
    });

    // Purchasing - Load Stock
    async function loadPurchasingData() {
        const tbody = document.getElementById('table-bahan-baku');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        const response = await window.ERPAPI.request('get_stock');
        
        if (response.status === 'success' && response.data) {
            tbody.innerHTML = '';
            response.data.forEach(item => {
                const tr = document.createElement('tr');
                const isKritis = item.stok < 10;
                tr.innerHTML = `
                    <td>${item.kode}</td>
                    <td style="font-weight: 500;">${item.nama}</td>
                    <td>
                        <span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${item.stok}</span>
                    </td>
                    <td>${item.lokasi}</td>
                    <td>
                        <button class="btn btn-edit-stock" data-kode="${item.kode}" data-nama="${item.nama}" data-stok="${item.stok}" data-lokasi="${item.lokasi}" data-harga="${item.harga || 0}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-delete-stock" data-kode="${item.kode}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Bind edit/delete buttons
            document.querySelectorAll('.btn-edit-stock').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const b = e.currentTarget;
                    openDataModal('Edit Bahan Baku', {
                        kode: b.getAttribute('data-kode'),
                        nama: b.getAttribute('data-nama'),
                        stok: b.getAttribute('data-stok'),
                        lokasi: b.getAttribute('data-lokasi'),
                        harga: b.getAttribute('data-harga')
                    });
                });
            });

            document.querySelectorAll('.btn-delete-stock').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Yakin ingin menghapus bahan baku ini?')) {
                        const kode = e.currentTarget.getAttribute('data-kode');
                        const res = await window.ERPAPI.request('delete_stock', { kode });
                        alert(res.message);
                        if (res.status === 'success') loadPurchasingData();
                    }
                });
            });
        }
    }

    // --- Modal Logic ---
    const dataModal = document.getElementById('data-modal');
    const dataForm = document.getElementById('data-form');
    
    function openDataModal(title, data = null) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('f_kode').value = data ? data.kode : '';
        document.getElementById('f_kode').readOnly = !!data; // readonly if editing
        document.getElementById('f_nama').value = data ? data.nama : '';
        document.getElementById('f_stok').value = data ? data.stok : '';
        document.getElementById('f_harga').value = data ? data.harga : '';
        document.getElementById('f_lokasi').value = data ? data.lokasi : '';
        
        dataModal.classList.add('active');
    }

    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
        dataModal.classList.remove('active');
    });

    dataForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            kode: document.getElementById('f_kode').value,
            nama: document.getElementById('f_nama').value,
            stok: document.getElementById('f_stok').value,
            harga: document.getElementById('f_harga').value,
            lokasi: document.getElementById('f_lokasi').value
        };
        
        const btnSubmit = dataForm.querySelector('button[type="submit"]');
        const oldHtml = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;

        const res = await window.ERPAPI.request('save_stock', payload);
        
        btnSubmit.innerHTML = oldHtml;
        btnSubmit.disabled = false;
        
        if (res.status === 'success') {
            dataModal.classList.remove('active');
            loadPurchasingData(); // Reload table
        } else {
            alert(res.message);
        }
    });

    // Buttons interactions
    document.getElementById('btn-add-stock')?.addEventListener('click', () => {
        openDataModal('Tambah Bahan Baku Baru');
    });
    document.getElementById('btn-create-po')?.addEventListener('click', () => {
        // Generate mock data and print PO
        const tgl = new Date().toLocaleDateString('id-ID');
        document.getElementById('po-tanggal').textContent = tgl;
        document.getElementById('po-table-body').innerHTML = `
            <tr><td>RM001</td><td>Besi Plat</td><td>100 Pcs</td><td>Rp 50.000</td><td>Rp 5.000.000</td></tr>
            <tr><td>RM002</td><td>Baut M10</td><td>500 Pcs</td><td>Rp 1.000</td><td>Rp 500.000</td></tr>
            <tr><td colspan="4" style="text-align: right; font-weight: bold;">Grand Total</td><td>Rp 5.500.000</td></tr>
        `;
        // Trigger browser print
        window.print();
    });

    // Flow 1: Penawaran
    async function loadPenawaranData() {
        const tbody = document.getElementById('table-penawaran');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        const response = await window.ERPAPI.request('get_penawaran');
        if (response.status === 'success' && response.data) {
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
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.no_penawaran || '-'}</td>
                    <td>${item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                    <td style="font-weight: 500;">${item.customer}</td>
                    <td>Rp ${parseInt(item.total_harga).toLocaleString('id-ID')}</td>
                    <td>Rp ${parseInt(item.dp).toLocaleString('id-ID')}</td>
                    <td><span class="badge ${badgeClass}">${item.status || 'Penawaran'}</span></td>
                    <td style="white-space: nowrap;">
                        <button class="btn btn-print-penawaran" data-item='${JSON.stringify(item)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--info);" title="Print / Ekspor PDF"><i class="fa-solid fa-print"></i></button>
                        <button class="btn btn-pay-penawaran" data-item='${JSON.stringify(item)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--success);" title="Terima Pembayaran"><i class="fa-solid fa-money-bill"></i></button>
                        <button class="btn btn-edit-penawaran" data-item='${JSON.stringify(item)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-delete-penawaran" data-no="${item.no_penawaran}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Bind edit and delete buttons
            document.querySelectorAll('.btn-edit-penawaran').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                    document.getElementById('penawaran-modal-title').textContent = 'Edit Penawaran';
                    document.getElementById('p_no_penawaran').value = item.no_penawaran;
                    document.getElementById('p_customer').value = item.customer;
                    document.getElementById('p_total_harga').value = item.total_harga;
                    document.getElementById('p_total_harga_display').textContent = parseInt(item.total_harga).toLocaleString('id-ID');
                    document.getElementById('p_dp').value = item.dp;
                    document.getElementById('p_narasi').value = item.narasi || '';
                    document.getElementById('p_status').value = item.status || 'Penawaran';
                    
                    pItemsContainer.innerHTML = '';
                    let items = [];
                    try {
                        items = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : (item.rincian_item || []);
                    } catch(e){}
                    
                    if(items.length === 0) addPenawaranItemRow();
                    else items.forEach(it => addPenawaranItemRow(it.nama, it.qty, it.harga));
                    
                    penawaranModal.classList.add('active');
                });
            });
            
            document.querySelectorAll('.btn-delete-penawaran').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Yakin ingin menghapus penawaran ini?')) {
                        const no_penawaran = e.currentTarget.getAttribute('data-no');
                        const res = await window.ERPAPI.request('delete_penawaran', { no_penawaran });
                        alert(res.message);
                        if (res.status === 'success') loadPenawaranData();
                    }
                });
            });

            // Bind Print
            document.querySelectorAll('.btn-print-penawaran').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.currentTarget.getAttribute('data-item'));
                    
                    // Header settings
                    document.getElementById('print_company_name').textContent = cachedSettings['NAMA_PERUSAHAAN'] || 'NAMA PERUSAHAAN';
                    document.getElementById('print_company_address').textContent = cachedSettings['ALAMAT'] || 'Alamat Perusahaan';
                    document.getElementById('print_company_phone').textContent = cachedSettings['NO_TELP'] || 'No. Telp';
                    
                    document.getElementById('print_no').textContent = item.no_penawaran;
                    document.getElementById('print_tanggal').textContent = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-';
                    document.getElementById('print_customer').textContent = item.customer;
                    
                    // Items mapping
                    let items = [];
                    try {
                        items = typeof item.rincian_item === 'string' ? JSON.parse(item.rincian_item) : (item.rincian_item || []);
                    } catch(ex){}
                    
                    const tbody = document.getElementById('print-items-tbody');
                    tbody.innerHTML = '';
                    
                    if (items.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center;">Penawaran Harga / Kesepakatan Khusus</td></tr>`;
                    } else {
                        items.forEach(it => {
                            const sub = (it.qty || 0) * (it.harga || 0);
                            tbody.innerHTML += `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 8px;">${it.nama}</td>
                                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${it.qty}</td>
                                    <td style="border: 1px solid #000; padding: 8px; text-align: right;">Rp ${parseInt(it.harga).toLocaleString('id-ID')}</td>
                                    <td style="border: 1px solid #000; padding: 8px; text-align: right;">Rp ${sub.toLocaleString('id-ID')}</td>
                                </tr>
                            `;
                        });
                    }
                    
                    document.getElementById('print_total').textContent = 'Rp ' + parseInt(item.total_harga).toLocaleString('id-ID');
                    document.getElementById('print_narasi').textContent = item.narasi || '';
                    
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
            const qty = parseInt(row.querySelector('.pi-qty').value) || 0;
            const harga = parseInt(row.querySelector('.pi-harga').value) || 0;
            const subtotal = qty * harga;
            row.querySelector('.pi-subtotal').textContent = subtotal.toLocaleString('id-ID');
            total += subtotal;
        });
        document.getElementById('p_total_harga').value = total;
        document.getElementById('p_total_harga_display').textContent = total.toLocaleString('id-ID');
    }

    function addPenawaranItemRow(nama = '', qty = 1, harga = 0) {
        const div = document.createElement('div');
        div.className = 'p-item-row';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <input type="text" class="pi-nama" placeholder="Nama / Deskripsi Barang" value="${nama}" required style="flex: 2; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="number" class="pi-qty" placeholder="Qty" value="${qty}" required style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="number" class="pi-harga" placeholder="Harga Satuan" value="${harga}" required style="flex: 1.5; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <div style="flex: 1.5; text-align: right; color: var(--text-main); font-weight: bold;">Rp <span class="pi-subtotal">0</span></div>
            <button type="button" class="btn btn-remove-p-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        div.querySelector('.btn-remove-p-row').addEventListener('click', () => {
            div.remove();
            calculatePenawaranTotal();
        });
        div.querySelector('.pi-qty').addEventListener('input', calculatePenawaranTotal);
        div.querySelector('.pi-harga').addEventListener('input', calculatePenawaranTotal);
        pItemsContainer.appendChild(div);
        calculatePenawaranTotal();
    }

    document.getElementById('btn-add-p-item')?.addEventListener('click', () => addPenawaranItemRow());

    document.getElementById('btn-run-penawaran')?.addEventListener('click', () => {
        document.getElementById('penawaran-form').reset();
        document.getElementById('penawaran-modal-title').textContent = 'Buat Penawaran Baru';
        document.getElementById('p_no_penawaran').value = '';
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
            const nama = row.querySelector('.pi-nama').value;
            const qty = parseInt(row.querySelector('.pi-qty').value) || 0;
            const harga = parseInt(row.querySelector('.pi-harga').value) || 0;
            if(nama) items.push({ nama, qty, harga });
        });

        const payload = {
            no_penawaran: document.getElementById('p_no_penawaran').value,
            customer: document.getElementById('p_customer').value,
            total_harga: document.getElementById('p_total_harga').value,
            rincian_item: items,
            narasi: document.getElementById('p_narasi').value,
            dp: document.getElementById('p_dp').value,
            status: document.getElementById('p_status').value
        };
        
        const btnSubmit = penawaranForm.querySelector('button[type="submit"]');
        const oldHtml = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;

        const res = await window.ERPAPI.request('save_penawaran', payload);
        
        btnSubmit.innerHTML = oldHtml;
        btnSubmit.disabled = false;
        
        if (res.status === 'success') {
            penawaranModal.classList.remove('active');
            loadPenawaranData(); // Reload table
        } else {
            alert(res.message);
        }
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
            total_harga: document.getElementById('pay_total').value,
            dp: document.getElementById('pay_nominal').value
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
    async function loadBOMData() {
        const tbody = document.getElementById('table-bom');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        const response = await window.ERPAPI.request('get_bom');
        if (response.status === 'success' && response.data) {
            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada data BOM.</td></tr>';
                return;
            }
            response.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 500;">${item.kode_barang}</td>
                    <td>${item.nama_barang}</td>
                    <td>Rp ${parseInt(item.total_biaya || 0).toLocaleString('id-ID')}</td>
                    <td><span class="badge badge-success">Tersedia</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
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
            total += parseInt(input.value) || 0;
        });
        totalBiayaDisplay.textContent = total.toLocaleString('id-ID');
    }

    function addMaterialRow(kode = '', nama = '', qty = '1', harga = '') {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" class="mat-kode" placeholder="Kode Mat" value="${kode}" required style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="mat-nama" placeholder="Nama Material" value="${nama}" required style="flex: 2; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="number" class="mat-qty" placeholder="Qty" value="${qty}" required style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="number" class="mat-harga" placeholder="Total Biaya Mat." value="${harga}" required style="flex: 1.5; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <button type="button" class="btn btn-remove-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        div.querySelector('.btn-remove-row').addEventListener('click', () => {
            div.remove();
            calculateTotalBiaya();
        });
        div.querySelector('.mat-harga').addEventListener('input', calculateTotalBiaya);
        materialsContainer.appendChild(div);
    }

    function addProsesRow(nama = '') {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" class="pros-nama" placeholder="Deskripsi Tahapan Proses" value="${nama}" required style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <button type="button" class="btn btn-remove-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        div.querySelector('.btn-remove-row').addEventListener('click', () => div.remove());
        prosesContainer.appendChild(div);
    }

    document.getElementById('btn-add-material')?.addEventListener('click', () => addMaterialRow());
    document.getElementById('btn-add-proses')?.addEventListener('click', () => addProsesRow());

    document.getElementById('btn-add-bom')?.addEventListener('click', () => {
        bomForm.reset();
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
        
        const materials = [];
        materialsContainer.querySelectorAll('div').forEach(div => {
            const kode = div.querySelector('.mat-kode')?.value;
            const nama = div.querySelector('.mat-nama')?.value;
            const qty = div.querySelector('.mat-qty')?.value;
            const harga = div.querySelector('.mat-harga')?.value;
            if(nama) materials.push({ kode: kode || '', nama, qty: parseInt(qty) || 1, harga: parseInt(harga) || 0 });
        });

        const proses = [];
        prosesContainer.querySelectorAll('div').forEach(div => {
            const nama = div.querySelector('.pros-nama')?.value;
            if(nama) proses.push(nama);
        });

        const payload = {
            kode_barang: document.getElementById('bom_kode').value,
            nama_barang: document.getElementById('bom_nama').value,
            rincian_material: materials,
            total_biaya: parseInt(totalBiayaDisplay.textContent.replace(/,/g, '').replace(/\./g, '')),
            rincian_proses: proses
        };
        
        const btnSubmit = bomForm.querySelector('button[type="submit"]');
        const oldHtml = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;

        const res = await window.ERPAPI.request('save_bom', payload);
        
        btnSubmit.innerHTML = oldHtml;
        btnSubmit.disabled = false;
        
        if (res.status === 'success') {
            bomModal.classList.remove('active');
            loadBOMData(); // Reload table
        } else {
            alert(res.message);
        }
    });

    // Flow 3: SPK Auto-Deduct
    async function loadProduksiData() {
        const tbody = document.getElementById('table-produksi');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        const response = await window.ERPAPI.request('get_produksi');
        if (response.status === 'success' && response.data) {
            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada SPK Produksi.</td></tr>';
                return;
            }
            response.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.no_spk || '-'}</td>
                    <td>${item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                    <td style="font-weight: 500;">${item.kode_barang}</td>
                    <td>${item.qty}</td>
                    <td><span class="badge badge-success">${item.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    const produksiModal = document.getElementById('produksi-modal');
    const produksiForm = document.getElementById('produksi-form');
    let cachedBOMData = [];
    let cachedInventoryData = [];

    document.getElementById('btn-run-spk')?.addEventListener('click', async () => {
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
            select.innerHTML = '<option value="" disabled selected>-- Pilih Barang Jadi --</option>';
            resBom.data.forEach(bom => {
                const opt = document.createElement('option');
                opt.value = bom.kode_barang;
                opt.textContent = `${bom.kode_barang} - ${bom.nama_barang}`;
                select.appendChild(opt);
            });
        } else {
            select.innerHTML = '<option value="" disabled selected>Gagal memuat BOM</option>';
        }
    });

    function calculateSPKEstimasi() {
        const kode = document.getElementById('spk_kode_jadi').value;
        const qty = parseInt(document.getElementById('spk_qty_jadi').value) || 0;
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
        if (!bom) return;

        let matArray = [];
        try {
            matArray = typeof bom.rincian_material === 'string' ? JSON.parse(bom.rincian_material) : bom.rincian_material;
        } catch(e) {}

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
        const qty = parseInt(document.getElementById('spk_qty_jadi').value) || 0;
        
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
            pemberi: document.getElementById('spk_pemberi').value
        };
        
        const btnSubmit = produksiForm.querySelector('button[type="submit"]');
        const oldHtml = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;

        const res = await window.ERPAPI.request('save_spk', payload);
        
        btnSubmit.innerHTML = oldHtml;
        btnSubmit.disabled = false;
        
        if (res.status === 'success') {
            produksiModal.classList.remove('active');
            loadProduksiData(); // Reload table
        } else {
            alert(res.message);
        }
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
                    <td>${user.nama}</td>
                    <td><span class="badge badge-success">${user.role}</span></td>
                    <td>
                        <button class="btn btn-edit-user" data-user='${JSON.stringify(user)}' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-delete-user" data-username="${user.username}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
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
                    if (confirm('Yakin ingin menghapus akun ini?')) {
                        const username = e.currentTarget.getAttribute('data-username');
                        const res = await window.ERPAPI.request('delete_user', { username });
                        alert(res.message);
                        if (res.status === 'success') loadAdminData();
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
        document.getElementById('u_nama').value = data ? data.nama : '';
        document.getElementById('u_role').value = data ? data.role : 'Staff Purchasing';
        document.getElementById('u_password').value = '';
        document.getElementById('u_password').required = !data; // required for new user
        
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
        const payload = {
            username: document.getElementById('u_username').value,
            password: document.getElementById('u_password').value,
            nama: document.getElementById('u_nama').value,
            role: document.getElementById('u_role').value
        };
        
        const btnSubmit = userForm.querySelector('button[type="submit"]');
        const oldHtml = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btnSubmit.disabled = true;

        const res = await window.ERPAPI.request('save_user', payload);
        
        btnSubmit.innerHTML = oldHtml;
        btnSubmit.disabled = false;
        
        if (res.status === 'success') {
            userModal.classList.remove('active');
            loadAdminData();
        } else {
            alert(res.message);
        }
    });

    document.getElementById('btn-add-cash')?.addEventListener('click', async () => {
        const res = await window.ERPAPI.request('add_petty_cash');
        alert(res.message);
    });

});
