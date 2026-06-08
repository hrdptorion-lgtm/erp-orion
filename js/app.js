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
        const isProduksi = user.role.toLowerCase().includes('produksi') || user.role.toLowerCase().includes('gudang');
        const isFinance = user.role.toLowerCase().includes('finance') || user.role.toLowerCase().includes('accounting');
        const isSales = user.role.toLowerCase().includes('marketing');
        const isAdmin = ['direktur', 'admin', 'management'].some(r => user.role.toLowerCase().includes(r));

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
        });

        // Trigger click on dashboard to reset view
        document.querySelector('.nav-item[data-target="dashboard"]').click();
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
    btnLogout?.addEventListener('click', () => {
        logoutModal.classList.add('active');
    });

    document.getElementById('btn-cancel-logout')?.addEventListener('click', () => {
        logoutModal.classList.remove('active');
    });

    document.getElementById('btn-confirm-logout')?.addEventListener('click', () => {
        logoutModal.classList.remove('active');
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
        'admin': { title: 'Manajemen Pengguna', sub: 'Pengaturan Role Akses Aplikasi.' },
        'pengaturan': { title: 'Pengaturan Perusahaan', sub: 'Informasi dasar identitas perusahaan.' }
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
            } else if (targetViewId === 'po-internal') {
                loadPOInternalData();
            } else if (targetViewId === 'barang-jadi') {
                loadBarangJadiData();
            } else if (targetViewId === 'pengaturan') {
                loadSettingsData();
            }
        });
    });

    // Purchasing - Load Stock
    async function loadPurchasingData() {
        const tbody = document.getElementById('table-bahan-baku');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
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

            tbody.innerHTML = '';
            response.data.forEach(item => {
                const tr = document.createElement('tr');
                const isKritis = item.stok < 10;
                tr.innerHTML = `
                    <td>${item.kode}</td>
                    <td style="font-weight: 500;">${item.nama}</td>
                    <td>
                        <span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')} ${item.satuan || ''}</span>
                    </td>
                    <td>${item.lokasi}</td>
                    <td>
                        <button class="btn btn-edit-stock" data-kode="${item.kode}" data-nama="${item.nama}" data-stok="${item.stok}" data-satuan="${item.satuan || ''}" data-lokasi="${item.lokasi}" data-harga="${item.harga || 0}" data-spesifikasi="${item.spesifikasi || ''}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
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
                        satuan: b.getAttribute('data-satuan'),
                        lokasi: b.getAttribute('data-lokasi'),
                        harga: b.getAttribute('data-harga'),
                        spesifikasi: b.getAttribute('data-spesifikasi')
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

    dataForm?.addEventListener('submit', async (e) => {
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

    document.getElementById('btn-import-stock')?.addEventListener('click', () => {
        document.getElementById('file-import-stock').click();
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
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {defval: ""});
                
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

    // Flow 0: PO Internal
    async function loadPOInternalData() {
        const tbody = document.getElementById('table-po-internal');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        // Fetch Material Master for datalist
        const stockRes = await window.ERPAPI.request('get_stock');
        if (stockRes.status === 'success' && stockRes.data) {
            const list = document.getElementById('bom-bahan-baku-list');
            if (list) {
                list.innerHTML = '';
                stockRes.data.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.nama;
                    option.setAttribute('data-kode', s.kode || '');
                    list.appendChild(option);
                });
            }
        }
        
        const response = await window.ERPAPI.request('get_po_internal');
        if (response.status === 'success' && response.data) {
            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Belum ada PO Internal.</td></tr>';
                return;
            }
            
            const session = localStorage.getItem('erp_session');
            const user = session ? JSON.parse(session) : {};
            const isAtasan = (user.role === 'Admin' || user.role === 'Management' || user.role === 'Super');
            const isPurchasing = (user.role === 'Admin' || user.role === 'Purchasing' || user.role === 'Super');

            response.data.forEach(item => {
                const tr = document.createElement('tr');
                let badgeClass = 'badge-warning';
                if (item.status === 'Disetujui (Sedang Dibelikan)') badgeClass = 'badge-success';
                else if (item.status === 'Selesai (Barang Diterima)') badgeClass = 'badge-success';
                else if (item.status === 'Ditolak') badgeClass = 'badge-warning';
                
                let actionBtns = '';
                if (item.status === 'Menunggu Approval' && isAtasan) {
                    actionBtns += `<button class="btn btn-approve-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-check"></i> Approve</button>`;
                    actionBtns += `<button class="btn btn-reject-po" data-no="${item.no_po}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--danger); display: inline-flex;"><i class="fa-solid fa-times"></i> Tolak</button>`;
                } else if (item.status === 'Disetujui (Sedang Dibelikan)' && isPurchasing) {
                    actionBtns += `<button class="btn btn-selesai-po" data-no="${item.no_po}" data-kode="${item.kode_material}" data-qty="${item.jumlah}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--info); display: inline-flex;"><i class="fa-solid fa-box-open"></i> Selesai (Terima Barang)</button>`;
                }
                
                if (!actionBtns) actionBtns = '-';

                tr.innerHTML = `
                    <td style="font-weight: 500;">${item.no_po}</td>
                    <td>${item.tanggal}</td>
                    <td>${item.pemohon}</td>
                    <td>${item.nama_material}</td>
                    <td>${parseInt(item.jumlah || 0).toLocaleString('id-ID')}</td>
                    <td><span class="badge ${badgeClass}">${item.status}</span></td>
                    <td>${actionBtns}</td>
                `;
                tbody.appendChild(tr);
            });
            
            // Event Delegation for Table Actions
            tbody.querySelectorAll('.btn-approve-po').forEach(btn => {
                btn.addEventListener('click', () => updatePOStatus(btn.getAttribute('data-no'), 'Disetujui (Sedang Dibelikan)'));
            });
            tbody.querySelectorAll('.btn-reject-po').forEach(btn => {
                btn.addEventListener('click', () => updatePOStatus(btn.getAttribute('data-no'), 'Ditolak'));
            });
            tbody.querySelectorAll('.btn-selesai-po').forEach(btn => {
                btn.addEventListener('click', () => updatePOStatus(btn.getAttribute('data-no'), 'Selesai (Barang Diterima)', btn.getAttribute('data-kode'), btn.getAttribute('data-qty')));
            });
        }
    }

    async function updatePOStatus(no_po, status, kode_material = '', qty = 0) {
        if (!confirm(`Yakin ingin mengubah status PO menjadi ${status}?`)) return;
        
        const session = localStorage.getItem('erp_session');
        const user = session ? JSON.parse(session) : {};
        
        const res = await window.ERPAPI.request('update_po_status', {
            no_po, status, kode_material, qty, user_nama: user.nama || user.username || 'System'
        });
        
        if (res.status === 'success') {
            loadPOInternalData();
        } else {
            alert(res.message);
        }
    }

    const poModal = document.getElementById('po-modal');
    const poForm = document.getElementById('po-form');

    document.getElementById('btn-add-po-internal')?.addEventListener('click', () => {
        poForm.reset();
        poModal.classList.add('active');
    });

    document.getElementById('btn-close-po-modal')?.addEventListener('click', () => {
        poModal.classList.remove('active');
    });

    poForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const session = localStorage.getItem('erp_session');
        const user = session ? JSON.parse(session) : {};
        
        const materialInput = document.getElementById('po_material').value;
        const datalist = document.getElementById('bom-bahan-baku-list');
        let kodeMaterial = '';
        if (datalist) {
            const option = Array.from(datalist.options).find(opt => opt.value === materialInput);
            if (option) kodeMaterial = option.getAttribute('data-kode');
        }
        
        const payload = {
            pemohon: user.nama || user.username || 'System',
            kode_material: kodeMaterial,
            nama_material: materialInput,
            jumlah: parseInt(String(document.getElementById('po_jumlah').value).replace(/\D/g, '')) || 0
        };
        
        const btnSubmit = poForm.querySelector('button[type="submit"]');
        const oldHtml = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengajukan...';
        btnSubmit.disabled = true;

        const res = await window.ERPAPI.request('create_po_internal', payload);
        
        btnSubmit.innerHTML = oldHtml;
        btnSubmit.disabled = false;
        
        if (res.status === 'success') {
            poModal.classList.remove('active');
            loadPOInternalData();
        } else {
            alert(res.message);
        }
    });

    // Flow: Inventori Barang Jadi
    async function loadBarangJadiData() {
        const tbody = document.getElementById('table-barang-jadi');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        const response = await window.ERPAPI.request('get_barang_jadi');
        if (response.status === 'success' && response.data) {
            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada data barang jadi.</td></tr>';
                return;
            }
            response.data.forEach(item => {
                const tr = document.createElement('tr');
                const isKritis = parseInt(item.stok) < 5;
                tr.innerHTML = `
                    <td style="font-weight: 500;">${item.kode}</td>
                    <td>${item.nama}</td>
                    <td>
                        <span class="badge ${isKritis ? 'badge-warning' : 'badge-success'}">${parseInt(item.stok || 0).toLocaleString('id-ID')}</span>
                    </td>
                    <td>Rp ${parseInt(item.harga_jual || 0).toLocaleString('id-ID')}</td>
                    <td>${item.lokasi || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    // Flow 1: Penawaran
    async function loadPenawaranData() {
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
            if (stockRes.status === 'success' && stockRes.data) {
                stockRes.data.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.nama;
                    option.setAttribute('data-harga', s.harga || 0);
                    list.appendChild(option);
                });
            }
        }

        const tbody = document.getElementById('table-penawaran');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        const response = await window.ERPAPI.request('get_penawaran');
        if (response.status === 'success' && response.data) {
            // Populate Customer Datalist
            const customerList = document.getElementById('customer-list');
            if (customerList) {
                customerList.innerHTML = '';
                const uniqueCustomers = [...new Set(response.data.map(item => item.customer).filter(Boolean))];
                uniqueCustomers.forEach(cust => {
                    const option = document.createElement('option');
                    option.value = cust;
                    customerList.appendChild(option);
                });
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
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.no_penawaran || '-'}</td>
                    <td>${item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                    <td style="font-weight: 500;">${item.customer}</td>
                    <td>${item.narasi || '-'}</td>
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
            const qty = parseInt(String(row.querySelector('.pi-qty').value).replace(/\D/g, '')) || 0;
            const harga = parseInt(String(row.querySelector('.pi-harga').value).replace(/\D/g, '')) || 0;
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
            <input type="text" list="bom-items-list" class="pi-nama" placeholder="Nama / Pilih dari BOM" value="${nama}" required style="flex: 2; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="pi-qty number-format" placeholder="Qty" value="${qty ? formatRibuan(qty) : ''}" required style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <input type="text" class="pi-harga number-format" placeholder="Harga Satuan" value="${harga ? formatRibuan(harga) : ''}" required style="flex: 1.5; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: white;">
            <div style="flex: 1.5; text-align: right; color: var(--text-main); font-weight: bold;">Rp <span class="pi-subtotal">0</span></div>
            <button type="button" class="btn btn-remove-p-row" style="background: var(--danger); padding: 0.6rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        div.querySelector('.btn-remove-p-row').addEventListener('click', () => {
            div.remove();
            calculatePenawaranTotal();
        });
        div.querySelector('.pi-qty').addEventListener('input', calculatePenawaranTotal);
        div.querySelector('.pi-harga').addEventListener('input', calculatePenawaranTotal);
        
        // Auto-fill harga from datalist
        div.querySelector('.pi-nama').addEventListener('input', (e) => {
            const val = e.target.value;
            const list = document.getElementById('bom-items-list');
            if (list) {
                const options = Array.from(list.options);
                const match = options.find(opt => opt.value === val);
                if (match) {
                    const hrg = match.getAttribute('data-harga');
                    if (hrg) {
                        div.querySelector('.pi-harga').value = formatRibuan(hrg);
                        calculatePenawaranTotal();
                    }
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
            const qty = parseInt(String(row.querySelector('.pi-qty').value).replace(/\D/g, '')) || 0;
            const harga = parseInt(String(row.querySelector('.pi-harga').value).replace(/\D/g, '')) || 0;
            if(nama) items.push({ nama, qty, harga });
        });

        const payload = {
            no_penawaran: document.getElementById('p_no_penawaran').value,
            customer: document.getElementById('p_customer').value,
            total_harga: parseInt(String(document.getElementById('p_total_harga').value).replace(/\D/g, '')) || 0,
            rincian_item: items,
            narasi: document.getElementById('p_narasi').value,
            dp: parseInt(String(document.getElementById('p_dp').value).replace(/\D/g, '')) || 0,
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
    async function loadBOMData() {
        const tbody = document.getElementById('table-bom');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        // Fetch Stock for datalist
        const stockRes = await window.ERPAPI.request('get_stock');
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
        
        const response = await window.ERPAPI.request('get_bom');
        if (response.status === 'success' && response.data) {
            tbody.innerHTML = '';
            if (response.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada data BOM.</td></tr>';
                return;
            }

            const session = localStorage.getItem('erp_session');
            const user = session ? JSON.parse(session) : {};
            const canEdit = ['Admin', 'Management', 'Produksi', 'Super', 'Super Admin'].some(r => (user.role || '').includes(r));

            response.data.forEach(item => {
                const tr = document.createElement('tr');
                const imgHtml = item.gambar ? `<a href="${item.gambar}" target="_blank"><img src="${item.gambar}" style="max-width: 50px; max-height: 50px; border-radius: 5px; object-fit: cover;"></a>` : '<span style="color:var(--text-muted);font-size:0.8rem;">Tidak ada</span>';
                
                let actionBtns = `<button class="btn btn-detail-bom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: var(--accent);"><i class="fa-solid fa-eye"></i> Detail</button>`;
                if (canEdit) {
                    actionBtns += `<button class="btn btn-edit-bom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex;"><i class="fa-solid fa-pen"></i> Edit</button>`;
                }
                
                tr.innerHTML = `
                    <td style="font-weight: 500;">${item.kode_barang}</td>
                    <td>${item.nama_barang}</td>
                    <td>${imgHtml}</td>
                    <td>Rp ${parseInt(item.total_biaya || 0).toLocaleString('id-ID')}</td>
                    <td>${actionBtns}</td>
                `;
                tbody.appendChild(tr);

                // Detail button
                tr.querySelector('.btn-detail-bom').addEventListener('click', () => openBOMDetail(item));
                // Edit button
                if (canEdit) {
                    tr.querySelector('.btn-edit-bom').addEventListener('click', () => openBOMEdit(item));
                }
            });
        }
    }

    function openBOMDetail(item) {
        let materials = [];
        let proses = [];
        try { materials = typeof item.rincian_material === 'string' ? JSON.parse(item.rincian_material) : (item.rincian_material || []); } catch(e) {}
        try { proses = typeof item.rincian_proses === 'string' ? JSON.parse(item.rincian_proses) : (item.rincian_proses || []); } catch(e) {}

        let matHtml = materials.map((m, i) => `<tr><td>${i+1}</td><td>${m.kode || '-'}</td><td>${m.nama}</td><td>${parseInt(m.qty || 0).toLocaleString('id-ID')}</td><td>Rp ${parseInt(m.harga || 0).toLocaleString('id-ID')}</td></tr>`).join('');
        let prosHtml = proses.map((p, i) => `<tr><td>${i+1}</td><td>${p.nama}</td><td>${p.gambar ? `<a href="${p.gambar}" target="_blank"><img src="${p.gambar}" style="max-width:80px;max-height:60px;border-radius:5px;object-fit:cover;"></a>` : '<span style="color:var(--text-muted);font-size:0.8rem;">-</span>'}</td></tr>`).join('');
        let imgHtml = item.gambar ? `<div style="margin-bottom: 15px; text-align: center;"><img src="${item.gambar}" style="max-width: 100%; max-height: 200px; border-radius: 10px;"></div>` : '';

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
        try { materials = typeof item.rincian_material === 'string' ? JSON.parse(item.rincian_material) : (item.rincian_material || []); } catch(e) {}
        try { proses = typeof item.rincian_proses === 'string' ? JSON.parse(item.rincian_proses) : (item.rincian_proses || []); } catch(e) {}

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
        div.querySelector('.pros-gambar-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const dataUrl = event.target.result;
                    div.querySelector('.pros-gambar-base64').value = dataUrl.split(',')[1];
                    div.querySelector('.pros-gambar-mime').value = file.type;
                    div.querySelector('.pros-gambar-preview').style.display = 'block';
                    div.querySelector('.pros-gambar-preview img').src = dataUrl;
                };
                reader.readAsDataURL(file);
            }
        });
        prosesContainer.appendChild(div);
    }

    document.getElementById('btn-add-material')?.addEventListener('click', () => addMaterialRow());
    document.getElementById('btn-add-proses')?.addEventListener('click', () => addProsesRow());

    let bomGambarBase64 = null;
    let bomGambarMime = null;

    document.getElementById('bom_gambar')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            bomGambarMime = file.type;
            const reader = new FileReader();
            reader.onload = function(event) {
                const dataUrl = event.target.result;
                bomGambarBase64 = dataUrl.split(',')[1];
                document.getElementById('bom_gambar_preview').style.display = 'block';
                document.getElementById('bom_gambar_preview').querySelector('img').src = dataUrl;
            };
            reader.readAsDataURL(file);
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
        
        const materials = [];
        materialsContainer.querySelectorAll('div').forEach(div => {
            const kode = div.querySelector('.mat-kode')?.value;
            const nama = div.querySelector('.mat-nama')?.value;
            const qty = parseInt(String(div.querySelector('.mat-qty')?.value).replace(/\D/g, '')) || 0;
            const harga = parseInt(String(div.querySelector('.mat-harga')?.value).replace(/\D/g, '')) || 0;
            if(nama) materials.push({ kode: kode || '', nama, qty: qty || 1, harga: harga || 0 });
        });

        const proses = [];
        prosesContainer.querySelectorAll(':scope > div').forEach(div => {
            const nama = div.querySelector('.pros-nama')?.value;
            if(nama) {
                proses.push({
                    nama,
                    gambar: div.querySelector('.pros-gambar-url')?.value || '',
                    gambar_base64: div.querySelector('.pros-gambar-base64')?.value || '',
                    gambar_mime: div.querySelector('.pros-gambar-mime')?.value || ''
                });
            }
        });

        const payload = {
            kode_barang: document.getElementById('bom_kode').value,
            nama_barang: document.getElementById('bom_nama').value,
            rincian_material: materials,
            total_biaya: parseInt(totalBiayaDisplay.textContent.replace(/,/g, '').replace(/\./g, '')),
            rincian_proses: proses,
            gambar_base64: bomGambarBase64,
            gambar_mime: bomGambarMime
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
