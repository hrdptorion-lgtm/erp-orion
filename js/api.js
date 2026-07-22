const API_URL = '/api/gas';

let activeRequests = 0;
function toggleSyncIcon(isSyncing) {
    const syncIcon = document.querySelector('#btn-sync i');
    if (syncIcon) {
        if (isSyncing) syncIcon.classList.add('fa-spin');
        else syncIcon.classList.remove('fa-spin');
    }
}

class ERPAPI {
    static async request(action, payload = {}, timeoutMs = 60000) {
        try {
            activeRequests++;
            toggleSyncIcon(true);

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            // Sertakan token autentikasi untuk semua request kecuali login
            const requestBody = { action, payload };
            if (action !== 'login') {
                const token = localStorage.getItem('erp_token');
                if (token) {
                    requestBody.token = token;
                }
            }

            const formBody = 'payload=' + encodeURIComponent(JSON.stringify(requestBody));

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseText = await response.text();

            try {
                const jsonResponse = JSON.parse(responseText);

                // Handle unauthorized — token expired atau tidak valid
                if (jsonResponse.code === 'UNAUTHORIZED') {
                    localStorage.removeItem('erp_session');
                    localStorage.removeItem('erp_token');
                    showToast?.('⚠️ Sesi Anda telah berakhir. Silakan login kembali.', 'error', 5000);
                    // Tampilkan login overlay
                    const loginOverlay = document.getElementById('login-overlay');
                    if (loginOverlay) loginOverlay.classList.add('active');
                    return jsonResponse;
                }

                if (action.startsWith('get_') && jsonResponse.status === 'success') {
                    localStorage.setItem(`erp_cache_${action}`, JSON.stringify(jsonResponse));
                }

                if (jsonResponse.status === 'error' && jsonResponse.message) {
                    if (jsonResponse.message.includes('Action tidak dikenali') && action.startsWith('get_')) {
                        return ERPAPI.getMockData(action);
                    }
                }

                return jsonResponse;
            } catch (parseErr) {
                console.error('[API] Gagal parse response.', 'Status:', response.status, 'Response:', responseText.substring(0, 500));
                return {
                    status: 'error',
                    message: 'Server mengembalikan response yang tidak valid.'
                };
            }
        } catch (error) {
            let errorMsg = error.message;
            if (error.name === 'AbortError') {
                errorMsg = `Request timeout (lebih dari ${60000 / 1000} detik). Server mungkin terlalu lambat.`;
            }

            showToast?.(`❌ Koneksi gagal: ${errorMsg}`, 'error', 5000);
            return { status: 'error', message: 'Koneksi ke server gagal: ' + errorMsg };
        } finally {
            activeRequests--;
            if (activeRequests <= 0) {
                activeRequests = 0;
                toggleSyncIcon(false);
            }
        }
    }

    static getCached(action) {
        try {
            const cached = localStorage.getItem(`erp_cache_${action}`);
            if (cached) return JSON.parse(cached);
        } catch (e) { }
        return null;
    }

    static getMockData(action) {
        if (action === 'get_stock') {
            return {
                status: 'success',
                data: [
                    { kode: 'RM001', nama: 'Besi Plat 2mm', stok: 120, lokasi: 'Rak A1' },
                    { kode: 'RM002', nama: 'Kabel Tembaga', stok: 50, lokasi: 'Rak B2' },
                    { kode: 'RM003', nama: 'Baut 10mm', stok: 500, lokasi: 'Rak C1' },
                    { kode: 'RM004', nama: 'Cat Biru Orion', stok: 2, lokasi: 'Zona D' } // Kritis
                ]
            };
        } else if (action === 'login') {
            return { status: 'success', role: 'Direktur', nama: 'Bapak Direktur (Mock)' };
        } else if (action === 'save_stock') {
            return { status: 'success', message: 'Simulasi simpan data berhasil.' };
        } else if (action === 'delete_stock') {
            return { status: 'success', message: 'Simulasi hapus data berhasil.' };
        } else if (action === 'get_users') {
            return {
                status: 'success',
                data: [
                    { username: 'admin', nama: 'Super Admin', role: 'Direktur' },
                    { username: 'purchasing1', nama: 'Budi (Purchasing)', role: 'Staff Purchasing' }
                ]
            };
        } else if (action === 'save_user') {
            return { status: 'success', message: 'Simulasi simpan pengguna berhasil.' };
        } else if (action === 'delete_user') {
            return { status: 'success', message: 'Simulasi hapus pengguna berhasil.' };
        } else if (action === 'get_penawaran') {
            return {
                status: 'success',
                data: [
                    {
                        no_penawaran: 'PNW-20260601', tanggal: '01/06/2026', customer: 'PT Klien Sukses', status: 'Penawaran',
                        rincian_item: [{ nama: 'Produk A', qty: 10, harga: 1000000 }, { nama: 'Produk B', qty: 5, harga: 1000000 }],
                        narasi: 'Harga sewaktu-waktu dapat berubah.\\nOngkos kirim ditanggung pembeli.',
                        total_harga: 15000000, dp: 5000000
                    },
                    {
                        no_penawaran: 'PNW-20260602', tanggal: '02/06/2026', customer: 'CV Maju Jaya', status: 'Approved',
                        rincian_item: [{ nama: 'Jasa Pemasangan', qty: 1, harga: 8000000 }],
                        narasi: 'Termasuk garansi pemasangan 1 bulan.',
                        total_harga: 8000000, dp: 8000000
                    },
                    {
                        no_penawaran: 'PNW-20260603', tanggal: '11/06/2026', customer: 'PT MUTIARA GERHANA ABADI \n Mutiara Gading Timur 2 Blok S3 No. 25 \n RT 007 RW 028 Mustikajaya', status: 'Penawaran',
                        rincian_item: [],
                        narasi: '',
                        total_harga: 0, dp: 0
                    }
                ]
            };
        } else if (action === 'get_customers') {
            return {
                status: 'success',
                data: [
                    { id_customer: 'CUST-001', nama_customer: 'PT Klien Sukses' },
                    { id_customer: 'CUST-002', nama_customer: 'CV Maju Jaya' },
                    { id_customer: 'CUST-003', nama_customer: 'PT MUTIARA GERHANA ABADI, Mutiara Gading Timur 2 Blok S3 No. 25, RT 007 RW 028 Mustikajaya' }
                ]
            };
        } else if (action === 'save_customer') {
            return { status: 'success', message: 'Data Customer berhasil disimpan (Simulasi).' };
        } else if (action === 'delete_customer') {
            return { status: 'success', message: 'Data Customer berhasil dihapus (Simulasi).' };
        } else if (action === 'get_suppliers') {
            return {
                status: 'success',
                data: [
                    { id_supplier: 'SUPP-001', nama_supplier: 'PT Baja Makmur', kontak___telepon: '0812345678', alamat: 'Kawasan Industri MM2100' },
                    { id_supplier: 'SUPP-002', nama_supplier: 'Toko Elektronik Surya', kontak___telepon: '081999888', alamat: 'Glodok Jakarta' }
                ]
            };
        } else if (action === 'save_supplier') {
            return { status: 'success', message: 'Data Supplier berhasil disimpan (Simulasi).' };
        } else if (action === 'delete_supplier') {
            return { status: 'success', message: 'Data Supplier berhasil dihapus (Simulasi).' };
        } else if (action === 'save_penawaran') {
            return { status: 'success', message: 'Data Penawaran berhasil disimpan (Simulasi).' };
        } else if (action === 'delete_penawaran') {
            return { status: 'success', message: 'Data Penawaran berhasil dihapus (Simulasi).' };
        } else if (action === 'receive_grn') {
            return { status: 'success', message: 'Simulasi GRN Berhasil. Stok bahan baku otomatis bertambah.' };
        } else if (action === 'get_produksi') {
            return {
                status: 'success',
                data: [
                    { no_spk: 'SPK-20260601', tanggal: '01/06/2026', kode_barang: 'FG001', qty: 100, status: 'SELESAI' }
                ]
            };
        } else if (action === 'get_inventory') {
            return {
                status: 'success',
                data: [
                    { kode_material: 'RM001', nama_material: 'Material A', stok: 50 },
                    { kode_material: 'RM002', nama_material: 'Material B', stok: 10 }
                ]
            };
        } else if (action === 'get_barang_jadi') {
            return {
                status: 'success',
                data: [
                    { kode_barang: 'FG001', nama_barang: 'Pintu Besi Minimalis', stok: 15, harga_jual: 1250000, lokasi_gudang: 'Gudang A - Zona Finished Goods' },
                    { kode_barang: 'FG002', nama_barang: 'Pagar Besi Dorong 3m', stok: 8, harga_jual: 2750000, lokasi_gudang: 'Gudang A - Zona Finished Goods' },
                    { kode_barang: 'FG003', nama_barang: 'Rak Gudang 5 Tingkat', stok: 12, harga_jual: 1850000, lokasi_gudang: 'Gudang B - Zona Display' },
                    { kode_barang: 'FG004', nama_barang: 'Jendela Aluminium Sliding', stok: 20, harga_jual: 950000, lokasi_gudang: 'Gudang B - Zona Display' },
                    { kode_barang: 'FG005', nama_barang: 'Teralis Jendela Custom', stok: 25, harga_jual: 850000, lokasi_gudang: 'Gudang C - Zona Siap Kirim' }
                ]
            };
        } else if (action === 'get_bom') {
            return {
                status: 'success',
                data: [
                    { kode_barang: 'FG001', nama_barang: 'Produk A', rincian_material: '[{"nama":"Material A","harga":5000},{"nama":"Material B","harga":3000}]', total_biaya: 8000, rincian_proses: '["Potong","Rakit"]' }
                ]
            };
        } else if (action === 'save_bom') {
            return { status: 'success', message: 'Data BOM & PMO Sampel berhasil disimpan (Simulasi).' };
        } else if (action === 'save_spk') {
            return { status: 'success', message: 'Simulasi SPK Selesai (Menunggu Pengambilan).' };
        } else if (action === 'ambil_bahan_spk') {
            return { status: 'success', message: 'Sebagian bahan berhasil diambil. Sisa kekurangan otomatis dibuatkan Permintaan Belanja (PO Internal).' };
        } else if (action === 'selesaikan_spk') {
            return { status: 'success', message: 'Simulasi Produksi Selesai.' };
        } else if (action === 'add_petty_cash') {
            return { status: 'success', message: 'Data Petty Cash berhasil ditambahkan.' };
        } else if (action === 'get_settings') {
            return {
                status: 'success',
                data: {
                    'NAMA_PERUSAHAAN': 'PT ORION MAJU SEJAHTERA',
                    'ALAMAT': 'Jl. Pahlawan No. 123, Jakarta Selatan',
                    'NO_TELP': '021-88889999'
                }
            };
        } else if (action === 'save_settings') {
            return { status: 'success', message: 'Pengaturan berhasil disimpan.' };
        } else if (action === 'get_surat_jalan') {
            return { status: 'success', data: [] };
        } else if (action === 'save_surat_jalan') {
            return { status: 'success', message: 'Surat Jalan berhasil disimpan (Simulasi).' };
        } else if (action === 'delete_surat_jalan') {
            return { status: 'success', message: 'Surat Jalan dihapus.' };
        } else if (action === 'get_invoices') {
            return { status: 'success', data: [] };
        } else if (action === 'save_invoice') {
            return { status: 'success', message: 'Invoice berhasil disimpan (Simulasi).' };
        } else if (action === 'delete_invoice') {
            return { status: 'success', message: 'Invoice dihapus.' };
        } else if (action === 'get_coa') {
            return {
                status: 'success',
                data: [
                    { kode: '1', keterangan: 'A S E T' },
                    { kode: '1.1', keterangan: 'ASET LANCAR' },
                    { kode: '1.1.01', keterangan: 'K A S' },
                    { kode: '1.1.01.01', keterangan: 'Kas Besar' },
                    { kode: '1.1.01.02', keterangan: 'Kas Kecil' },
                    { kode: '2', keterangan: 'L I A B I L I T A S' },
                    { kode: '2.1', keterangan: 'LIABILITAS LANCAR' },
                    { kode: '2.1.01', keterangan: 'Hutang Usaha' }
                ]
            };
        } else if (action === 'save_coa') {
            return { status: 'success', message: 'Simulasi simpan COA berhasil.' };
        } else if (action === 'delete_coa') {
            return { status: 'success', message: 'Simulasi hapus COA berhasil.' };
        } else {
            return { status: 'error', message: 'Action tidak dikenali.' };
        }
    }
}

window.ERPAPI = ERPAPI;
