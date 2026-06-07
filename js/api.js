// Replace with the actual URL from Google Apps Script deployment
const API_URL = 'https://script.google.com/macros/s/AKfycbz62bYOJaLoeoJr2CEhIT0UJB9JSHl38S90xCwCki_uvwhgS1v4MHyaVvqWiie_xvNo/exec';

class ERPAPI {
    static async request(action, payload = {}) {
        try {
            // Because GAS requires no-cors for direct browser fetch or cors setup.
            // Using POST to web app.
            // In a real scenario, use URLSearchParams or a proxy if CORS is an issue.
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Bypass preflight
                },
                body: JSON.stringify({ action, payload })
            });
            
            // Note: with text/plain to GAS, it returns opaque response in no-cors, 
            // so we might need JSONP or ensure GAS handles CORS properly.
            // Assuming GAS allows CORS for this implementation.
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Return mock data if API fails (for demo purposes)
            return this.getMockData(action);
        }
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
                        rincian_item: [{nama: 'Produk A', qty: 10, harga: 1000000}, {nama: 'Produk B', qty: 5, harga: 1000000}],
                        narasi: 'Harga sewaktu-waktu dapat berubah.\\nOngkos kirim ditanggung pembeli.',
                        total_harga: 15000000, dp: 5000000 
                    },
                    { 
                        no_penawaran: 'PNW-20260602', tanggal: '02/06/2026', customer: 'CV Maju Jaya', status: 'Approved', 
                        rincian_item: [{nama: 'Jasa Pemasangan', qty: 1, harga: 8000000}],
                        narasi: 'Termasuk garansi pemasangan 1 bulan.',
                        total_harga: 8000000, dp: 8000000 
                    }
                ]
            };
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
            return { status: 'success', message: 'Simulasi SPK Selesai. Bahan baku otomatis berkurang (Auto-deduct).' };
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
        } else {
            return { status: 'error', message: 'Action tidak dikenali.' };
        }
    }
}

window.ERPAPI = ERPAPI;
