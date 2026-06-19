// Sample Controllers for ERP modules

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) {
      hashVal += 256;
    }
    if (hashVal.toString(16).length === 1) {
      txtHash += '0';
    }
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function handleLogin(payload) {
  const { username, password } = payload;
  const hashedPassword = hashPassword(password);
  
  // Hardcoded Super Admin account (Hash of ciko1234)
  if (username === 'super' && hashedPassword === '90145cca92176dffdba677c0e523db8faeb1414bfb24583899c0bec846346f8f') {
    return { status: 'success', role: 'Super Admin', nama: 'Super Admin' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB Users');
  
  if (!sheet) {
    return { status: 'error', message: 'Sheet DB Users tidak ditemukan.' };
  }

  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) {
    return { status: 'error', message: 'Username atau Password salah!' };
  }

  const headers = data[0];
  const userIdx = headers.indexOf('Username');
  const passIdx = headers.indexOf('Password');
  const roleIdx = headers.indexOf('Role');
  const namaIdx = headers.indexOf('Nama Lengkap');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[userIdx] === username && (row[passIdx] === hashedPassword || row[passIdx] === password)) {
      return { 
        status: 'success', 
        role: row[roleIdx] || 'Admin', 
        nama: row[namaIdx] || username 
      };
    }
  }

  return { status: 'error', message: 'Username atau Password salah!' };
}

function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const getSheetData = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getDisplayValues();
    return values.length > 1 ? values.slice(1) : [];
  };

  const orders = getSheetData('DB Orders');
  const produksi = getSheetData('DB SPK Produksi');
  const inventory = getSheetData('DB Master Barang Jadi');
  const stock = getSheetData('DB Master Bahan Baku');

  const totalOrders = orders.length;
  const activeProduksi = produksi.filter(row => row[5] !== 'Selesai').length;
  const lowStock = stock.filter(row => parseInt(row[2] || 0) < 50).length;

  return {
    status: 'success',
    data: {
      kpi: {
        totalOrders,
        activeProduksi,
        lowStockItems: lowStock
      },
      recentOrders: orders.slice(-5).map(r => ({
        id: r[0],
        customer: r[1],
        status: r[6] || 'Pending'
      }))
    }
  };
}

function getOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Orders');
  if (!sheet) return { status: 'error', message: 'Sheet DB Orders tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function saveOrder(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Orders');
  if (!sheet) return { status: 'error', message: 'Sheet DB Orders tidak ditemukan.' };
  
  const rowData = [
    'ORD-' + Math.floor(Math.random() * 10000),
    payload.customer,
    payload.item,
    payload.qty,
    payload.deadline,
    payload.priority || 'Normal',
    'Pending'
  ];
  
  sheet.appendRow(rowData);
  return { status: 'success', message: 'Order berhasil disimpan.' };
}

function updateOrderStatus(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Orders');
  if (!sheet) return { status: 'error', message: 'Sheet DB Orders tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const idIdx = headers.indexOf('ID Order');
  const statusIdx = headers.indexOf('Status');
  
  if (idIdx === -1 || statusIdx === -1) {
    return { status: 'error', message: 'Struktur DB Orders tidak valid.' };
  }
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIdx] === payload.id) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(payload.status);
      return { status: 'success', message: 'Status order berhasil diupdate.' };
    }
  }
  
  return { status: 'error', message: 'Order tidak ditemukan.' };
}

function getProduksi() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function saveProduksi(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };
  
  const headers = sheet.getDataRange().getDisplayValues()[0];
  const rowData = headers.map(h => {
    const key = String(h).toLowerCase().replace(/ /g, '_');
    if (key === 'id_produksi') return 'PRD-' + Math.floor(Math.random() * 10000);
    if (key === 'status') return 'Dijadwalkan';
    return payload[key] || '';
  });
  
  sheet.appendRow(rowData);
  return { status: 'success', message: 'Jadwal produksi berhasil disimpan.' };
}

function getInventory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const barangJadiSheet = ss.getSheetByName('DB Master Barang Jadi');
  const bahanBakuSheet = ss.getSheetByName('DB Master Bahan Baku');
  
  let barangJadi = [];
  let bahanBaku = [];
  
  if (barangJadiSheet) {
    const values = barangJadiSheet.getDataRange().getDisplayValues();
    if (values.length > 1) {
      const headers = values[0];
      barangJadi = values.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i];
        });
        obj.type = 'Barang Jadi';
        return obj;
      });
    }
  }
  
  if (bahanBakuSheet) {
    const values = bahanBakuSheet.getDataRange().getDisplayValues();
    if (values.length > 1) {
      const headers = values[0];
      bahanBaku = values.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i];
        });
        obj.type = 'Bahan Baku';
        return obj;
      });
    }
  }
  
  return { status: 'success', data: [...barangJadi, ...bahanBaku] };
}

function saveInventory(payload) {
  const sheetName = payload.type === 'Barang Jadi' ? 'DB Master Barang Jadi' : 'DB Master Bahan Baku';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) return { status: 'error', message: 'Sheet ' + sheetName + ' tidak ditemukan.' };
  
  const headers = sheet.getDataRange().getDisplayValues()[0];
  const rowData = headers.map(h => {
    const key = String(h).toLowerCase().replace(/ /g, '_');
    if (key.includes('kode')) return payload.kode || (payload.type === 'Barang Jadi' ? 'BJ' : 'RM') + Math.floor(Math.random() * 10000);
    return payload[key] || '';
  });
  
  sheet.appendRow(rowData);
  return { status: 'success', message: 'Data inventory berhasil disimpan.' };
}

// ==========================================
// STOCK / BAHAN BAKU
// ==========================================
function getStock() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const headers = values[0];
  const kodeIdx = headers.findIndex(h => /kode/i.test(h));
  const namaIdx = headers.findIndex(h => /nama/i.test(h));
  const stokIdx = headers.findIndex(h => /^stok$|^stock$/i.test(String(h).trim()));
  const hargaIdx = headers.findIndex(h => /harga/i.test(h));
  const satuanIdx = headers.findIndex(h => /^satuan$/i.test(String(h).trim()));
  const lokasiIdx = headers.findIndex(h => /lokasi/i.test(h));
  const spesifikasiIdx = headers.findIndex(h => /spesifikasi/i.test(h));
  
  const data = values.slice(1).filter(r => r[namaIdx] && String(r[namaIdx]).trim() !== '').map(row => ({
    kode: kodeIdx !== -1 ? row[kodeIdx] : '',
    nama: namaIdx !== -1 ? row[namaIdx] : '',
    stok: stokIdx !== -1 ? row[stokIdx] : '0',
    harga: hargaIdx !== -1 ? row[hargaIdx] : '0',
    satuan: satuanIdx !== -1 ? row[satuanIdx] : 'pcs',
    lokasi: lokasiIdx !== -1 ? row[lokasiIdx] : '-',
    spesifikasi: spesifikasiIdx !== -1 ? row[spesifikasiIdx] : ''
  }));
  return { status: 'success', data: data };
}

function saveStock(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const kodeIdx = headers.findIndex(h => /kode/i.test(h));
  const mapPayload = (h, payload, currentValue) => {
    const hLow = String(h).toLowerCase().trim();
    if (hLow.includes('kode')) return payload.kode || currentValue || ('RM' + Math.floor(Math.random()*10000));
    if (hLow.includes('nama')) return payload.nama !== undefined ? payload.nama : currentValue;
    if (hLow.includes('satuan') && !hLow.includes('harga')) return payload.satuan !== undefined ? payload.satuan : currentValue;
    if (hLow.includes('stok')) return payload.stok !== undefined ? payload.stok : currentValue;
    if (hLow.includes('lokasi')) return payload.lokasi !== undefined ? payload.lokasi : currentValue;
    if (hLow.includes('harga')) return payload.harga !== undefined ? payload.harga : currentValue;
    if (hLow.includes('spesifikasi')) return payload.spesifikasi !== undefined ? payload.spesifikasi : currentValue;
    return currentValue !== undefined ? currentValue : '';
  };

  // Check if updating existing
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][kodeIdx]).trim() === String(payload.kode).trim()) {
      const rowData = headers.map(h => mapPayload(h, payload, values[i][headers.indexOf(h)]));
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { status: 'success', message: 'Data bahan baku berhasil diperbarui.' };
    }
  }

  const rowData = headers.map(h => mapPayload(h, payload, ''));
  sheet.appendRow(rowData);
  return { status: 'success', message: 'Data bahan baku berhasil disimpan.' };
}

function deleteStock(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const kodeIdx = headers.findIndex(h => /kode/i.test(h));
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][kodeIdx]).trim() === String(payload.kode).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data tidak ditemukan.' };
}

function importStock(payload) {
  if (!payload || !payload.data || !Array.isArray(payload.data)) {
    return { status: 'error', message: 'Data import tidak valid.' };
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };
  let count = 0;
  payload.data.forEach(item => {
    sheet.appendRow([item.kode || '', item.nama || '', item.stok || 0, item.harga || 0, item.satuan || 'pcs']);
    count++;
  });
  return { status: 'success', message: count + ' data berhasil diimport.' };
}

// ==========================================
// BARANG JADI
// ==========================================
function getBarangJadi() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Barang Jadi');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Barang Jadi tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i]; });
    return obj;
  });

  // Automatically pull from BOM and append to Barang Jadi if not exists
  const bomSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (bomSheet) {
    const bomValues = bomSheet.getDataRange().getDisplayValues();
    if (bomValues.length > 1) {
      const bomHeaders = bomValues[0];
      const bomKodeIdx = bomHeaders.findIndex(h => /kode.*barang/i.test(h));
      const bomNamaIdx = bomHeaders.findIndex(h => /nama.*barang/i.test(h));
      
      if (bomKodeIdx !== -1 && bomNamaIdx !== -1) {
        bomValues.slice(1).forEach(row => {
          const bomKode = String(row[bomKodeIdx] || '').trim();
          const bomNama = String(row[bomNamaIdx] || '').trim();
          
          if (bomKode) {
            const exists = data.find(item => String(item.kode_barang || item.kode || '').trim() === bomKode);
            if (!exists) {
              const newObj = {
                kode_barang: bomKode,
                nama_barang: bomNama,
                stok: 0,
                harga_jual: 0,
                lokasi_gudang: '-'
              };
              data.push(newObj);
              
              const rowData = headers.map(h => {
                const hl = String(h).toLowerCase().trim();
                if (/kode/i.test(hl)) return bomKode;
                if (/nama/i.test(hl)) return bomNama;
                if (/stok/i.test(hl)) return 0;
                if (/harga/i.test(hl)) return 0;
                if (/lokasi/i.test(hl)) return '-';
                return '';
              });
              sheet.appendRow(rowData);
            }
          }
        });
      }
    }
  }

  return { status: 'success', data: data };
}

function deleteBarangJadi(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Barang Jadi');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Barang Jadi tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const kodeIdx = headers.findIndex(h => /kode/i.test(h));
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][kodeIdx]).trim() === String(payload.kode).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data Barang Jadi berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data Barang Jadi tidak ditemukan.' };
}

// ==========================================
// USERS
// ==========================================
function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Users');
  if (!sheet) return { status: 'error', message: 'Sheet DB Users tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { if (!/password/i.test(h)) obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i]; });
    return obj;
  });
  return { status: 'success', data: data };
}

function saveUser(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Users');
  if (!sheet) return { status: 'error', message: 'Sheet DB Users tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const userIdx = headers.findIndex(h => /username/i.test(h));
  const passIdx = headers.findIndex(h => /password/i.test(h));
  if (payload.password) payload.password = hashPassword(payload.password);
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][userIdx]).trim() === String(payload.username).trim()) {
      const rowData = headers.map((h, idx) => {
        const key = String(h).toLowerCase().replace(/ /g, '_');
        if (/password/i.test(h) && !payload.password) return values[i][idx];
        return payload[key] !== undefined ? payload[key] : values[i][idx];
      });
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { status: 'success', message: 'User berhasil diperbarui.' };
    }
  }
  const rowData = headers.map(h => {
    const key = String(h).toLowerCase().replace(/ /g, '_');
    return payload[key] !== undefined ? payload[key] : '';
  });
  sheet.appendRow(rowData);
  return { status: 'success', message: 'User berhasil ditambahkan.' };
}

function deleteUser(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Users');
  if (!sheet) return { status: 'error', message: 'Sheet DB Users tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const userIdx = headers.findIndex(h => /username/i.test(h));
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][userIdx]).trim() === String(payload.username).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'User berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'User tidak ditemukan.' };
}

// ==========================================
// PO INTERNAL
// ==========================================
function getPOInternal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB PO Internal');
  
  // Auto-create sheet with correct headers if not exist
  if (!sheet) {
    sheet = ss.insertSheet('DB PO Internal');
    sheet.appendRow(['No PO', 'Tanggal', 'Pemohon', 'Items', 'Total Estimasi', 'Status', 'Catatan', 'Disetujui Oleh', 'Tanggal Approve', 'Info Tambahan']);
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).filter(r => r[0] && String(r[0]).trim() !== '').map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i]; });
    // Parse items JSON
    try {
      if (obj.items && typeof obj.items === 'string' && obj.items.startsWith('[')) {
        obj.items_parsed = JSON.parse(obj.items);
      } else {
        obj.items_parsed = [];
      }
    } catch(e) { obj.items_parsed = []; }
    return obj;
  });
  return { status: 'success', data: data };
}

function createPOInternal(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB PO Internal');
  
  if (!sheet) {
    sheet = ss.insertSheet('DB PO Internal');
    sheet.appendRow(['No PO', 'Tanggal', 'Pemohon', 'Items', 'Total Estimasi', 'Status', 'Catatan', 'Disetujui Oleh', 'Tanggal Approve', 'Info Tambahan']);
  }
  
  const items = payload.items || [];
  if (items.length === 0) return { status: 'error', message: 'Minimal harus ada 1 item belanja.' };
  
  // Auto-register new items (not yet in stock DB) with stok=0
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  if (stockSheet) {
    const stockValues = stockSheet.getDataRange().getDisplayValues();
    const stockHeaders = stockValues[0];
    const sNamaIdx = stockHeaders.findIndex(h => /nama/i.test(h));
    const sKodeIdx = stockHeaders.findIndex(h => /kode/i.test(h));
    const sHargaIdx = stockHeaders.findIndex(h => /harga/i.test(h));
    const sSatuanIdx = stockHeaders.findIndex(h => /satuan/i.test(h));
    const sStokIdx = stockHeaders.findIndex(h => /stok|stock/i.test(h));
    const existingNames = stockValues.slice(1).map(r => String(r[sNamaIdx] || '').toLowerCase().trim());
    
    items.forEach(item => {
      const namaLower = String(item.nama || '').toLowerCase().trim();
      if (namaLower && !existingNames.includes(namaLower)) {
        // New material — register with stok 0
        const newKode = item.kode || ('RM' + Date.now().toString().slice(-6));
        const newRow = stockHeaders.map((h, i) => {
          if (i === sKodeIdx) return newKode;
          if (i === sNamaIdx) return item.nama;
          if (i === sStokIdx) return 0;
          if (i === sHargaIdx) return item.harga || 0;
          if (i === sSatuanIdx) return item.satuan || 'pcs';
          return '';
        });
        stockSheet.appendRow(newRow);
        existingNames.push(namaLower);
        item.kode = newKode; // update kode to newly generated one
      }
    });
  }
  
  const totalEstimasi = items.reduce((sum, item) => sum + ((parseFloat(item.harga) || 0) * (parseFloat(item.qty) || 0)), 0);
  const noPO = 'POI-' + Date.now();
  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  
  const infoTambahan = {
    po_to: payload.po_to || '',
    po_attn: payload.po_attn || '',
    po_enq_no: payload.po_enq_no || '',
    po_maker: payload.po_maker || '',
    po_delivery: payload.po_delivery || '',
    po_incoterm: payload.po_incoterm || '',
    po_payment_term: payload.po_payment_term || '',
    po_validity: payload.po_validity || ''
  };

  // Auto-register new supplier
  if (payload.po_to && payload.po_to.trim() !== '') {
    let suppSheet = ss.getSheetByName('DB Supplier');
    if (!suppSheet) {
      suppSheet = ss.insertSheet('DB Supplier');
      suppSheet.appendRow(['ID Supplier', 'Nama Supplier', 'Kontak / Telepon', 'Alamat', 'Tanggal Terdaftar']);
      suppSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    const suppValues = suppSheet.getDataRange().getDisplayValues();
    let found = false;
    for (let i = 1; i < suppValues.length; i++) {
      if (String(suppValues[i][1]).trim().toLowerCase() === String(payload.po_to).trim().toLowerCase()) {
        found = true;
        break;
      }
    }
    if (!found) {
      const newSuppId = 'SUPP-' + Date.now();
      suppSheet.appendRow([newSuppId, payload.po_to.trim(), '-', '-', new Date().toLocaleDateString('id-ID')]);
    }
  }
  
  sheet.appendRow([
    noPO,
    tanggal,
    payload.pemohon || '',
    JSON.stringify(items),
    totalEstimasi,
    'Menunggu Approval',
    payload.catatan || '',
    '',
    '',
    JSON.stringify(infoTambahan)
  ]);
  
  return { status: 'success', message: 'Pengajuan belanja berhasil dikirim!', no_po: noPO };
}

function receiveGRN(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const poSheet = ss.getSheetByName('DB PO Internal');
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  if (!poSheet || !stockSheet) return { status: 'error', message: 'Sheet tidak ditemukan.' };
  // Update PO status
  if (payload.no_po && poSheet) {
    const poValues = poSheet.getDataRange().getDisplayValues();
    const poHeaders = poValues[0];
    const noPOIdx = poHeaders.findIndex(h => /no.*po/i.test(h));
    const statusIdx = poHeaders.findIndex(h => /status/i.test(h));
    for (let i = 1; i < poValues.length; i++) {
      if (String(poValues[i][noPOIdx]).trim() === String(payload.no_po).trim()) {
        if (statusIdx !== -1) poSheet.getRange(i + 1, statusIdx + 1).setValue('Selesai');
        break;
      }
    }
  }
  // Update stock
  const stockValues = stockSheet.getDataRange().getDisplayValues();
  const stockHeaders = stockValues[0];
  const kodeIdx = stockHeaders.findIndex(h => /kode/i.test(h));
  const stokIdx = stockHeaders.findIndex(h => /stok|stock/i.test(h));
  if (kodeIdx !== -1 && stokIdx !== -1) {
    for (let i = 1; i < stockValues.length; i++) {
      if (String(stockValues[i][kodeIdx]).trim() === String(payload.kode_material).trim()) {
        const currentStok = parseFloat(String(stockValues[i][stokIdx]).replace(/[^0-9.]/g, '')) || 0;
        stockSheet.getRange(i + 1, stokIdx + 1).setValue(currentStok + (parseFloat(payload.qty) || 0));
        return { status: 'success', message: 'Stok berhasil ditambah.' };
      }
    }
  }
  return { status: 'error', message: 'Kode material tidak ditemukan di stok.' };
}

// ==========================================
// UPDATE STATUS PO INTERNAL (dengan auto-sync stok multi-item)
// ==========================================
function updatePOInternalStatus(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB PO Internal');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO Internal tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const noPOIdx = headers.findIndex(h => /no.*po/i.test(String(h)));
  const statusIdx = headers.findIndex(h => /^status$/i.test(String(h)));
  const itemsIdx = headers.findIndex(h => /^items$/i.test(String(h)));
  const disetujuiOlehIdx = headers.findIndex(h => /disetujui.*oleh/i.test(String(h)));
  const tglApproveIdx = headers.findIndex(h => /tanggal.*approve/i.test(String(h)));
  
  if (noPOIdx === -1 || statusIdx === -1) return { status: 'error', message: 'Struktur sheet DB PO Internal tidak valid.' };
  
  let rowIndex = -1;
  let itemsJson = '';
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][noPOIdx]).trim() === String(payload.no_po).trim()) {
      rowIndex = i + 1;
      itemsJson = values[i][itemsIdx] || '';
      break;
    }
  }
  
  if (rowIndex === -1) return { status: 'error', message: 'No PO tidak ditemukan: ' + payload.no_po };
  
  // Update status
  sheet.getRange(rowIndex, statusIdx + 1).setValue(payload.status);
  
  // Log who approved
  if (payload.status === 'Disetujui (Sedang Dibelikan)' || payload.status === 'Ditolak') {
    if (disetujuiOlehIdx !== -1) sheet.getRange(rowIndex, disetujuiOlehIdx + 1).setValue(payload.user_nama || '');
    if (tglApproveIdx !== -1) sheet.getRange(rowIndex, tglApproveIdx + 1).setValue(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm'));
  }
  
  // If status = Selesai, sync all items to stock
  if (payload.status === 'Selesai (Barang Diterima)') {
    let items = [];
    try { items = JSON.parse(itemsJson); } catch(e) {}
    
    if (items.length === 0) return { status: 'success', message: 'Status diperbarui (tidak ada item untuk disinkronkan).' };
    
    const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
    if (!stockSheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };
    
    const stockValues = stockSheet.getDataRange().getDisplayValues();
    const stockHeaders = stockValues[0];
    const sKodeIdx = stockHeaders.findIndex(h => /kode/i.test(h));
    const sNamaIdx = stockHeaders.findIndex(h => /nama/i.test(h));
    const sStokIdx = stockHeaders.findIndex(h => /stok|stock/i.test(h));
    const sHargaIdx = stockHeaders.findIndex(h => /harga/i.test(h));
    const sSatuanIdx = stockHeaders.findIndex(h => /satuan/i.test(h));
    
    let addedNew = 0;
    let updated = 0;
    
    items.forEach(item => {
      const kodeItem = String(item.kode || '').trim();
      const namaItem = String(item.nama || '').trim().toLowerCase();
      const qtyTambah = parseFloat(item.qty) || 0;
      
      // Find by kode first, then fallback to nama
      let foundRow = -1;
      for (let i = 1; i < stockValues.length; i++) {
        const kodeDB = String(stockValues[i][sKodeIdx] || '').trim();
        const namaDB = String(stockValues[i][sNamaIdx] || '').trim().toLowerCase();
        if ((kodeItem && kodeDB === kodeItem) || namaDB === namaItem) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow !== -1) {
        // Update existing stock
        const currentStok = parseFloat(String(stockSheet.getRange(foundRow, sStokIdx + 1).getValue()).replace(/[^0-9.]/g, '')) || 0;
        stockSheet.getRange(foundRow, sStokIdx + 1).setValue(currentStok + qtyTambah);
        updated++;
      } else {
        // New material — auto create
        const newKode = kodeItem || ('RM' + Date.now().toString().slice(-6));
        const newRow = stockHeaders.map((h, i) => {
          if (i === sKodeIdx) return newKode;
          if (i === sNamaIdx) return item.nama;
          if (i === sStokIdx) return qtyTambah;
          if (i === sHargaIdx) return item.harga || 0;
          if (i === sSatuanIdx) return item.satuan || 'pcs';
          return '';
        });
        stockSheet.appendRow(newRow);
        addedNew++;
      }
    });
    
    return { 
      status: 'success', 
      message: `Selesai! ${updated} item stok diperbarui, ${addedNew} material baru ditambahkan ke gudang.` 
    };
  }
  
  return { status: 'success', message: 'Status PO berhasil diperbarui menjadi: ' + payload.status };
}

function deletePOInternal(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Internal');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO Internal tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const noPOIdx = headers.findIndex(h => /no.*po/i.test(String(h)));
  if (noPOIdx === -1) return { status: 'error', message: 'Kolom No PO tidak ditemukan.' };
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][noPOIdx]).trim() === String(payload.no_po).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Pengajuan ' + payload.no_po + ' berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'No PO tidak ditemukan: ' + payload.no_po };
}

// ==========================================
// PENAWARAN / SALES
// ==========================================
function getPenawaran() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet DB Penawaran tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i]; });
    return obj;
  });
  return { status: 'success', data: data };
}

function getCustomers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Customer');
  if (!sheet) return { status: 'error', message: 'Sheet DB Customer tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function saveCustomer(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Customer');
  if (!sheet) return { status: 'error', message: 'Sheet DB Customer tidak ditemukan.' };

  const values = sheet.getDataRange().getDisplayValues();
  if (payload.id) {
    // Edit
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(payload.id).trim()) {
        sheet.getRange(i + 1, 2).setValue(payload.nama || '');
        sheet.getRange(i + 1, 3).setValue(payload.kontak || '');
        sheet.getRange(i + 1, 4).setValue(payload.alamat || '');
        return { status: 'success', message: 'Customer berhasil diupdate.' };
      }
    }
  }

  // Tambah baru
  const newCustId = 'CUST-' + Date.now();
  sheet.appendRow([newCustId, payload.nama || '', payload.kontak || '', payload.alamat || '', new Date().toLocaleDateString('id-ID')]);
  return { status: 'success', message: 'Customer baru berhasil ditambahkan.' };
}

function deleteCustomer(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Customer');
  if (!sheet) return { status: 'error', message: 'Sheet DB Customer tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.id).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Customer berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Customer tidak ditemukan.' };
}

function getSuppliers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Supplier');
  if (!sheet) return { status: 'error', message: 'Sheet DB Supplier tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[String(h).toLowerCase().replace(/[\/ ]/g, '_')] = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function saveSupplier(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Supplier');
  if (!sheet) {
    sheet = ss.insertSheet('DB Supplier');
    sheet.appendRow(['ID Supplier', 'Nama Supplier', 'Kontak / Telepon', 'Alamat', 'Tanggal Terdaftar']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (payload.id) {
    // Edit
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(payload.id).trim()) {
        sheet.getRange(i + 1, 2).setValue(payload.nama || '');
        sheet.getRange(i + 1, 3).setValue(payload.kontak || '');
        sheet.getRange(i + 1, 4).setValue(payload.alamat || '');
        return { status: 'success', message: 'Supplier berhasil diupdate.' };
      }
    }
  }

  // Tambah baru
  const newSuppId = 'SUPP-' + Date.now();
  sheet.appendRow([newSuppId, payload.nama || '', payload.kontak || '', payload.alamat || '', new Date().toLocaleDateString('id-ID')]);
  return { status: 'success', message: 'Supplier baru berhasil ditambahkan.' };
}

function deleteSupplier(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Supplier');
  if (!sheet) return { status: 'error', message: 'Sheet DB Supplier tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.id).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Supplier berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Supplier tidak ditemukan.' };
}

function savePenawaran(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet DB Penawaran tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();

  // Generate OKS-[NAMA_PERUSAHAAN]-[DDMMYYYY]-REV[XX] No Penawaran
  let noDoc = payload.no_penawaran;
  if (!noDoc) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const company = String(payload.customer || 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = `OKS-${company}-${dd}${mm}${yyyy}-REV`;
    
    let maxCounter = -1;
    for (let i = 1; i < values.length; i++) {
      const existingNo = String(values[i][0]).trim();
      if (existingNo.startsWith(prefix)) {
        const parts = existingNo.split('-REV');
        if (parts.length === 2) {
          const counter = parseInt(parts[1], 10);
          if (!isNaN(counter) && counter > maxCounter) {
            maxCounter = counter;
          }
        }
      }
    }
    const newCounter = String(maxCounter >= 0 ? maxCounter + 1 : 0).padStart(2, '0');
    noDoc = `${prefix}${newCounter}`;
  }

  // Logic untuk mencatat Customer baru
  if (payload.customer && payload.customer.trim() !== '') {
    const custSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Customer');
    if (custSheet) {
      const custValues = custSheet.getDataRange().getDisplayValues();
      let isExist = false;
      for (let i = 1; i < custValues.length; i++) {
        if (String(custValues[i][1]).trim().toLowerCase() === String(payload.customer).trim().toLowerCase()) {
          isExist = true;
          break;
        }
      }
      if (!isExist) {
        const newCustId = 'CUST-' + Date.now();
        custSheet.appendRow([newCustId, payload.customer.trim(), '-', new Date().toLocaleDateString('id-ID')]);
      }
    }
  }

  let rincianStr = '';
  if (typeof payload.rincian_item === 'string') {
      rincianStr = payload.rincian_item;
  } else if (payload.rincian_item) {
      rincianStr = JSON.stringify(payload.rincian_item);
  }
  
  let infoStr = '';
  if (typeof payload.info_tambahan === 'string') {
      infoStr = payload.info_tambahan;
  } else if (payload.info_tambahan) {
      infoStr = JSON.stringify(payload.info_tambahan);
  }

  // Edit if exists
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === noDoc) {
      sheet.getRange(i + 1, 2).setValue(new Date().toLocaleDateString('id-ID'));
      sheet.getRange(i + 1, 3).setValue(payload.customer || '');
      sheet.getRange(i + 1, 4).setValue(rincianStr);
      sheet.getRange(i + 1, 5).setValue(payload.total_harga || 0);
      sheet.getRange(i + 1, 6).setValue(payload.dp || 0);
      sheet.getRange(i + 1, 7).setValue(payload.status || 'Penawaran');
      sheet.getRange(i + 1, 8).setValue(payload.narasi || '');
      sheet.getRange(i + 1, 9).setValue(infoStr);
      return { status: 'success', message: 'Penawaran berhasil diupdate.', no_doc: noDoc };
    }
  }

  sheet.appendRow([
    noDoc, 
    new Date().toLocaleDateString('id-ID'), 
    payload.customer || '', 
    rincianStr, 
    payload.total_harga || 0, 
    payload.dp || 0, 
    payload.status || 'Penawaran', 
    payload.narasi || '',
    infoStr
  ]);
  return { status: 'success', message: 'Penawaran berhasil disimpan.', no_doc: noDoc };
}

function deletePenawaran(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet DB Penawaran tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.id).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Penawaran berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Penawaran tidak ditemukan.' };
}

function revisiPenawaran(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet DB Penawaran tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  
  const oldId = String(payload.id).trim();
  let oldRow = null;
  let oldRowIdx = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === oldId) {
      oldRow = values[i];
      oldRowIdx = i + 1;
      break;
    }
  }
  if (!oldRow) return { status: 'error', message: 'Data penawaran asal tidak ditemukan.' };
  
  // Set old Penawaran to Reject
  sheet.getRange(oldRowIdx, 7).setValue('Reject');

  // Create new ID (Increment REV)
  const parts = oldId.split('-REV');
  let newId = oldId + '-REV01'; // Fallback
  if (parts.length === 2) {
    const revNum = parseInt(parts[1], 10);
    newId = parts[0] + '-REV' + String(revNum + 1).padStart(2, '0');
  }

  // Insert new row based on old row
  const newRowData = [...oldRow];
  newRowData[0] = newId;
  newRowData[1] = new Date().toLocaleDateString('id-ID'); // Update date
  newRowData[6] = 'Diajukan'; // Default status for new revision
  sheet.appendRow(newRowData);
  
  return { status: 'success', message: 'Revisi penawaran berhasil dibuat.', no_doc: newId };
}

// ==========================================
// PO CUSTOMER
// ==========================================
function getPOCustomer() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Customer');
  if (!sheet) return { status: 'success', data: [] };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i]);
    try { obj.item_po = JSON.parse(obj.item_po); } catch(e) { obj.item_po = []; }
    return obj;
  });
  return { status: 'success', data: data };
}

function savePOCustomer(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Customer');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO Customer tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  
  let idPO = payload.id_po_customer;
  if (!idPO) {
    let poCount = 0;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][1]).trim() === String(payload.no_penawaran).trim()) {
        poCount++;
      }
    }
    idPO = payload.no_penawaran + '-PO-' + String(poCount + 1).padStart(3, '0');
  }
  const itemStr = typeof payload.item_po === 'string' ? payload.item_po : JSON.stringify(payload.item_po || []);
  
  let fileUrl = payload.file_pdf_existing || '';
  if (payload.file_pdf_base64) {
    try {
      fileUrl = uploadToDrive(payload.file_pdf_base64, payload.file_pdf_mime || 'application/pdf', 'POC_' + idPO + '_' + Date.now());
    } catch(e) {
      return { status: 'error', message: 'Gagal upload file: ' + e.message };
    }
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.id_po_customer).trim()) {
      sheet.getRange(i + 1, 2).setValue(payload.no_penawaran || '');
      sheet.getRange(i + 1, 3).setValue(payload.nama_customer || '');
      sheet.getRange(i + 1, 4).setValue(payload.tanggal_po || new Date().toLocaleDateString('id-ID'));
      sheet.getRange(i + 1, 5).setValue(itemStr);
      sheet.getRange(i + 1, 6).setValue(payload.total_harga || 0);
      sheet.getRange(i + 1, 7).setValue(payload.status || 'Pending');
      sheet.getRange(i + 1, 8).setValue(fileUrl);
      sheet.getRange(i + 1, 9).setValue(payload.tanggal_selesai || '');
      return { status: 'success', message: 'PO Customer berhasil diupdate.' };
    }
  }
  
  sheet.appendRow([
    idPO,
    payload.no_penawaran || '',
    payload.nama_customer || '',
    payload.tanggal_po || new Date().toLocaleDateString('id-ID'),
    itemStr,
    payload.total_harga || 0,
    payload.status || 'Pending',
    fileUrl,
    payload.tanggal_selesai || ''
  ]);
  return { status: 'success', message: 'PO Customer berhasil disimpan.' };
}

function deletePOCustomer(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Customer');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO Customer tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.id).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'PO Customer berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'PO Customer tidak ditemukan.' };
}

// ==========================================
// SETTINGS
// ==========================================
function getSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Settings');
  if (!sheet) return { status: 'success', data: {} };
  const values = sheet.getDataRange().getDisplayValues();
  const settings = {};
  values.forEach(row => { if (row[0]) settings[row[0]] = row[1] || ''; });
  return { status: 'success', data: settings };
}

function saveSettings(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Settings');
  if (!sheet) { sheet = ss.insertSheet('DB Settings'); sheet.appendRow(['Key', 'Value']); }
  const values = sheet.getDataRange().getDisplayValues();
  Object.keys(payload).forEach(key => {
    let found = false;
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(payload[key]);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([key, payload[key]]);
  });
  return { status: 'success', message: 'Settings berhasil disimpan.' };
}

// ==========================================
// SPK / INVOICE / PETTY CASH / CREATE PO
// ==========================================
function saveSPK(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };
  
  const batchCount = parseInt(payload.batch_count) || 1;
  const totalQty = parseInt(payload.qty) || 0;
  
  const baseQty = Math.floor(totalQty / batchCount);
  const remainder = totalQty % batchCount;
  const baseNoSPK = 'SPK-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd') + '-' + Math.floor(Math.random() * 1000);
  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  
  for (let i = 0; i < batchCount; i++) {
    let currentQty = baseQty;
    if (i === batchCount - 1) {
      currentQty += remainder;
    }
    
    let currentBahanBaku = [];
    if (payload.bahan_baku && payload.bahan_baku.length > 0) {
      currentBahanBaku = payload.bahan_baku.map(b => ({
        kode: b.kode,
        nama: b.nama,
        qty: (totalQty > 0) ? (b.qty / totalQty) * currentQty : 0
      }));
    }

    let batchSuffix = batchCount > 1 ? `-${i+1}/${batchCount}` : '';
    
    sheet.appendRow([
      baseNoSPK + batchSuffix,
      tanggal,
      payload.kode_barang || '',
      currentQty,
      payload.peminta || '',
      payload.pemberi || '',
      'Menunggu Pengambilan',
      JSON.stringify(currentBahanBaku),
      payload.no_penawaran || ''
    ]);
  }

  let msg = batchCount > 1 ? `SPK berhasil diterbitkan dalam ${batchCount} Batch.` : 'SPK berhasil diterbitkan (Menunggu Pengambilan).';
  return { status: 'success', message: msg };
}

function getSPKProgress(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };
  
  if (!payload.no_penawaran) return { status: 'error', message: 'No Penawaran tidak diberikan.' };

  const spkValues = sheet.getDataRange().getDisplayValues();
  if (spkValues.length <= 1) return { status: 'success', data: { total: 0, berjalan: 0, selesai: 0, targetQty: 0, selesaiQty: 0 } };
  
  // Asumsi format kolom yang valid:
  // Kolom 3: Qty (index 3)
  // Kolom 6: Status (index 6)
  // Kolom 8: No Penawaran (index 8)
  
  const headers = spkValues[0];
  const qtyIdx = headers.findIndex(h => /qty/i.test(h));
  const statusIdx = headers.findIndex(h => /status/i.test(h));
  // Jika kolom ke-9 (index 8) belum ada namanya, atau ada header yang pas
  // Kita coba cek index secara statis jika header tidak ketemu
  let noPenawaranIdx = headers.findIndex(h => /no.*penawaran/i.test(h));
  if (noPenawaranIdx === -1) {
    // Karena kita baru menambahkannya ke kolom ke-9, kita bisa paksakan cek index 8
    noPenawaranIdx = 8; 
  }
  
  let total = 0;
  let berjalan = 0;
  let selesai = 0;
  let targetQty = 0;
  let selesaiQty = 0;
  
  for (let i = 1; i < spkValues.length; i++) {
    const row = spkValues[i];
    // Pastikan panjang array row mencukupi (minimal index 8 ada)
    if (row.length > noPenawaranIdx && String(row[noPenawaranIdx]).trim() === String(payload.no_penawaran).trim()) {
      total++;
      
      const qty = parseFloat(row[qtyIdx]) || 0;
      const status = String(row[statusIdx] || '').trim();
      
      targetQty += qty;
      
      if (status.toLowerCase() === 'selesai') {
        selesai++;
        selesaiQty += qty;
      } else {
        berjalan++;
      }
    }
  }
  
  return { 
    status: 'success', 
    data: { total, berjalan, selesai, targetQty, selesaiQty } 
  };
}

function ambilBahanSPK(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };

  const spkValues = sheet.getDataRange().getDisplayValues();
  const headers = spkValues[0];
  const noSPKIdx = headers.findIndex(h => /no.*spk/i.test(h));
  const statusIdx = headers.findIndex(h => /status/i.test(h));
  const bahanIdx = headers.findIndex(h => /bahan/i.test(h));

  let rowIndex = -1;
  let bahanBakuJson = '[]';
  for (let i = 1; i < spkValues.length; i++) {
    if (String(spkValues[i][noSPKIdx]).trim() === String(payload.no_spk).trim()) {
      rowIndex = i + 1;
      bahanBakuJson = spkValues[i][bahanIdx] || '[]';
      break;
    }
  }

  if (rowIndex === -1) return { status: 'error', message: 'SPK tidak ditemukan.' };

  const bahanBaku = JSON.parse(bahanBakuJson);
  let shortages = [];
  const trxSheet = ss.getSheetByName('DB Transaksi Gudang');
  const now = new Date();
  const tanggal = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');

  // Deduct inventory
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  if (stockSheet && bahanBaku.length > 0) {
    const stockValues = stockSheet.getDataRange().getDisplayValues();
    const stockHeaders = stockValues[0];
    const kodeIdx = stockHeaders.findIndex(h => /kode/i.test(h));
    const namaIdx = stockHeaders.findIndex(h => /nama/i.test(h));
    const stokIdx = stockHeaders.findIndex(h => /stok|stock/i.test(h));
    
    if (kodeIdx !== -1 && stokIdx !== -1) {
      bahanBaku.forEach(bahan => {
        let found = false;
        for (let i = 1; i < stockValues.length; i++) {
          if (String(stockValues[i][kodeIdx]).trim() === String(bahan.kode).trim()) {
            found = true;
            const currentStok = parseFloat(String(stockSheet.getRange(i + 1, stokIdx + 1).getValue()).replace(/[^0-9.-]/g, '')) || 0;
            const deduction = parseFloat(bahan.qty) || 0;
            let actualDeduct = 0;
            let shortageQty = 0;

            if (currentStok >= deduction) {
              actualDeduct = deduction;
            } else {
              actualDeduct = currentStok;
              shortageQty = deduction - currentStok;
            }

            if (actualDeduct > 0) {
              stockSheet.getRange(i + 1, stokIdx + 1).setValue(currentStok - actualDeduct);
              if (trxSheet) {
                const idTrx = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 100);
                trxSheet.appendRow([idTrx, tanggal, 'OUT', payload.no_spk, bahan.kode, actualDeduct, 'Sistem (SPK)', 'Pengambilan bahan baku SPK']);
              }
            }

            if (shortageQty > 0) {
              const namaMat = namaIdx !== -1 ? stockValues[i][namaIdx] : bahan.kode;
              shortages.push({ kode: bahan.kode, nama: namaMat, qty: shortageQty, harga: 0 });
            }
            break;
          }
        }
        if (!found) {
          shortages.push({ kode: bahan.kode, nama: bahan.kode, qty: bahan.qty, harga: 0 });
        }
      });
    }
  }

  // Create PO Internal if there are shortages
  let message = 'Bahan baku berhasil diambil, status Dalam Proses.';
  if (shortages.length > 0) {
    const poSheet = ss.getSheetByName('DB PO Internal');
    if (poSheet) {
      const noPO = 'POI-' + Date.now();
      const itemsJson = JSON.stringify(shortages.map(s => ({
        nama: s.nama,
        qty: s.qty,
        harga: 0
      })));
      poSheet.appendRow([noPO, tanggal, payload.no_spk, itemsJson, 0, 'Menunggu Approval', 'Kekurangan otomatis dari ' + payload.no_spk, '', '', '']);
      message = 'Sebagian bahan berhasil diambil. Sisa kekurangan otomatis masuk ke Permintaan Belanja (PO Internal).';
    }
  }

  sheet.getRange(rowIndex, statusIdx + 1).setValue('Dalam Proses');
  return { status: 'success', message: message };
}

function selesaikanSPK(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };

  const spkValues = sheet.getDataRange().getDisplayValues();
  const headers = spkValues[0];
  const noSPKIdx = headers.findIndex(h => /no.*spk/i.test(h));
  const kodeBarangIdx = headers.findIndex(h => /kode/i.test(h));
  const qtyIdx = headers.findIndex(h => /qty/i.test(h));
  const statusIdx = headers.findIndex(h => /status/i.test(h));

  let rowIndex = -1;
  let kodeBarang = '';
  let qtyProduksi = 0;

  for (let i = 1; i < spkValues.length; i++) {
    if (String(spkValues[i][noSPKIdx]).trim() === String(payload.no_spk).trim()) {
      rowIndex = i + 1;
      kodeBarang = spkValues[i][kodeBarangIdx];
      qtyProduksi = parseFloat(spkValues[i][qtyIdx]) || 0;
      break;
    }
  }

  if (rowIndex === -1) return { status: 'error', message: 'SPK tidak ditemukan.' };

  // Increase Barang Jadi
  const fgSheet = ss.getSheetByName('DB Master Barang Jadi');
  if (fgSheet && kodeBarang && qtyProduksi > 0) {
    const fgValues = fgSheet.getDataRange().getDisplayValues();
    const fgHeaders = fgValues[0];
    const fgKodeIdx = fgHeaders.findIndex(h => /kode/i.test(h));
    const fgStokIdx = fgHeaders.findIndex(h => /stok|stock/i.test(h));
    
    if (fgKodeIdx !== -1 && fgStokIdx !== -1) {
      let fgFound = false;
      for (let i = 1; i < fgValues.length; i++) {
        if (String(fgValues[i][fgKodeIdx]).trim() === String(kodeBarang).trim()) {
          const currentStok = parseFloat(String(fgSheet.getRange(i + 1, fgStokIdx + 1).getValue()).replace(/[^0-9.-]/g, '')) || 0;
          fgSheet.getRange(i + 1, fgStokIdx + 1).setValue(currentStok + qtyProduksi);
          fgFound = true;
          break;
        }
      }
      
      if (!fgFound) {
        const newRow = fgHeaders.map(h => {
          if (/kode/i.test(h)) return kodeBarang;
          if (/stok|stock/i.test(h)) return qtyProduksi;
          return '';
        });
        fgSheet.appendRow(newRow);
      }
    }
  }

  sheet.getRange(rowIndex, statusIdx + 1).setValue('Selesai');
  return { status: 'success', message: 'SPK Selesai! Stok Barang Jadi ditambahkan.' };
}

function saveInvoice(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Invoice');
  if (!sheet) return { status: 'error', message: 'Sheet DB Invoice tidak ditemukan.' };
  sheet.appendRow(['INV-' + Date.now(), payload.customer || '', payload.item || '', payload.qty || 0, payload.total || 0, new Date().toLocaleDateString('id-ID'), 'Unpaid']);
  return { status: 'success', message: 'Invoice berhasil disimpan.' };
}

function addPettyCash(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Petty Cash');
  if (!sheet) return { status: 'error', message: 'Sheet DB Petty Cash tidak ditemukan.' };
  sheet.appendRow([new Date().toLocaleDateString('id-ID'), payload.keterangan || '', payload.jumlah || 0, payload.jenis || 'Keluar', payload.coa || '', payload.user || '']);
  return { status: 'success', message: 'Petty cash berhasil dicatat.' };
}

function createPO(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO tidak ditemukan.' };
  const noPO = 'PO-' + Date.now();
  sheet.appendRow([noPO, payload.kode_material || '', payload.nama_material || '', payload.jumlah || 0, payload.satuan || 'pcs', payload.supplier || '', new Date().toLocaleDateString('id-ID'), 'Draft']);
  return { status: 'success', message: 'PO berhasil dibuat.', no_po: noPO };
}

function updatePOStatus(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const noPOIdx = headers.findIndex(h => /no.*po/i.test(h));
  const statusIdx = headers.findIndex(h => /status/i.test(h));
  if (noPOIdx === -1 || statusIdx === -1) return { status: 'error', message: 'Struktur sheet tidak valid.' };
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][noPOIdx]).trim() === String(payload.id || payload.no_po).trim()) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(payload.status);
      return { status: 'success', message: 'Status PO diperbarui.' };
    }
  }
  return { status: 'error', message: 'PO tidak ditemukan.' };
}

function getPurchasing() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[String(h).toLowerCase().replace(/ /g, '_')] = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function savePO(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO tidak ditemukan.' };
  
  const headers = sheet.getDataRange().getDisplayValues()[0];
  const rowData = headers.map(h => {
    const key = String(h).toLowerCase().replace(/ /g, '_');
    if (key === 'no_po') return 'PO-' + Math.floor(Math.random() * 10000);
    if (key === 'tanggal') return new Date().toISOString().split('T')[0];
    if (key === 'status') return 'Draft';
    return payload[key] || '';
  });
  
  sheet.appendRow(rowData);
  return { status: 'success', message: 'PO berhasil dibuat.' };
}

function updatePOStatus(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const idIdx = headers.indexOf('No PO');
  const statusIdx = headers.indexOf('Status');
  
  if (idIdx === -1 || statusIdx === -1) {
    return { status: 'error', message: 'Struktur DB PO tidak valid.' };
  }
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIdx] === payload.id) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(payload.status);
      return { status: 'success', message: 'Status PO berhasil diupdate.' };
    }
  }
  
  return { status: 'error', message: 'PO tidak ditemukan.' };
}

function getBOM() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (!sheet) return { status: 'error', message: 'Sheet DB BOM tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const findHeaderIndex = (headerName) => headers.findIndex(h => normalize(h) === normalize(headerName));
  const kodeIdx = findHeaderIndex('Kode Barang Jadi');
  const namaIdx = findHeaderIndex('Nama Barang');
  const materialIdx = findHeaderIndex('Rincian Material');
  const totalBiayaIdx = findHeaderIndex('Total Biaya Material');
  const prosesIdx = findHeaderIndex('Rincian Proses');
  const gambarIdx = findHeaderIndex('Gambar');

  const data = values.slice(1).map(row => {
    let obj = {};
    if (kodeIdx !== -1) obj.kode_barang = row[kodeIdx];
    if (namaIdx !== -1) obj.nama_barang = row[namaIdx];
    if (materialIdx !== -1) obj.rincian_material = row[materialIdx];
    if (totalBiayaIdx !== -1) obj.total_biaya = row[totalBiayaIdx];
    if (prosesIdx !== -1) obj.rincian_proses = row[prosesIdx];
    if (gambarIdx !== -1) obj.gambar = row[gambarIdx];
    return obj;
  });
  
  return { status: 'success', data: data };
}

// ==========================================
// UPLOAD GAMBAR KE GOOGLE DRIVE
// ==========================================
function uploadToDrive(base64Data, mimeType, fileName) {
  try {
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    
    // Ini akan melempar error jika DriveApp belum diizinkan
    const file = DriveApp.createFile(blob);
    
    // Set file agar bisa diakses oleh siapa saja
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Gunakan URL thumbnail (API resmi yang tidak diblokir cookie browser saat ditaruh di <img>)
    return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000';
  } catch (error) {
    Logger.log('[UPLOAD ERROR] ' + error.toString());
    throw new Error('Gagal upload ke Drive. Pastikan Anda telah mengotorisasi DriveApp di editor Apps Script. Detail: ' + error.message);
  }
}

function saveBOM(payload) {
  if (!payload) {
    return { status: 'error', message: 'Payload tidak ditemukan.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB BOM');
  if (!sheet) return { status: 'error', message: 'Sheet DB BOM tidak ditemukan.' };
  
  let materials = [];
  try {
    materials = typeof payload.rincian_material === 'string' ? JSON.parse(payload.rincian_material) : payload.rincian_material;
  } catch(e) {}
  
  if (materials && materials.length > 0) {
    const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
    if (stockSheet) {
      const stockData = stockSheet.getDataRange().getValues();
      const stockHeaders = stockData[0];
      const sKodeIdx = stockHeaders.indexOf('Kode Material');
      const sNamaIdx = stockHeaders.indexOf('Nama Material');
      
      const existingNamas = stockData.slice(1).map(r => String(r[sNamaIdx]).toLowerCase());
      
      materials.forEach(mat => {
        const matNamaLower = String(mat.nama || '').toLowerCase();
        if (matNamaLower && !existingNamas.includes(matNamaLower)) {
          const newRow = stockHeaders.map(h => {
             if (h === 'Kode Material') return mat.kode || ('RM' + Math.floor(Math.random()*10000));
             if (h === 'Nama Material') return mat.nama;
             if (h === 'Stok') return 0;
             if (h === 'Harga Satuan') return mat.harga || 0;
             return '';
          });
          stockSheet.appendRow(newRow);
          existingNamas.push(matNamaLower);
        }
      });
    }
  }

  // Upload Gambar Utama (jika ada)
  let gambarUrl = payload.gambar || '';
  if (payload.gambar_base64) {
    try {
      gambarUrl = uploadToDrive(payload.gambar_base64, payload.gambar_mime || 'image/jpeg', 'BOM_' + payload.kode_barang + '_' + Date.now());
    } catch(e) {
      return { status: 'error', message: 'Error Gambar Utama: ' + e.message };
    }
  } else if (gambarUrl && gambarUrl.startsWith('data:image')) {
    try {
      const mime = gambarUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
      const b64 = gambarUrl.split(',')[1];
      gambarUrl = uploadToDrive(b64, mime, 'BOM_' + payload.kode_barang + '_' + Date.now());
    } catch(e) {
      return { status: 'error', message: 'Error Gambar Utama (data URI): ' + e.message };
    }
  }

  // Proses gambar per tahapan proses produksi
  let prosesFinal = payload.rincian_proses;
  if (typeof prosesFinal === 'string') {
    try { prosesFinal = JSON.parse(prosesFinal); } catch(e) { prosesFinal = null; }
  }
  
  if (prosesFinal && typeof prosesFinal !== 'string') {
    for (let i = 0; i < prosesFinal.length; i++) {
      let p = prosesFinal[i];
      let prosGambarUrl = p.gambar || '';
      
      if (p.gambar_base64) {
        try {
          prosGambarUrl = uploadToDrive(p.gambar_base64, p.gambar_mime || 'image/jpeg', 'PROS_' + payload.kode_barang + '_' + i + '_' + Date.now());
        } catch (e) {
          return { status: 'error', message: 'Error Gambar Rincian Proses #' + (i+1) + ': ' + e.message };
        }
      } else if (prosGambarUrl && prosGambarUrl.startsWith('data:image')) {
        try {
          const mimeMatch = prosGambarUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const b64 = prosGambarUrl.split(',')[1];
          prosGambarUrl = uploadToDrive(b64, mime, 'PROS_' + payload.kode_barang + '_' + i + '_' + Date.now());
        } catch (e) {
          return { status: 'error', message: 'Error Gambar Rincian Proses (data URI) #' + (i+1) + ': ' + e.message };
        }
      }
      
      p.gambar = prosGambarUrl;
      // Hapus data base64 agar JSON-nya ringan!
      delete p.gambar_base64;
      delete p.gambar_mime;
    }
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const findHeaderIndex = (headerName) => headers.findIndex(h => normalize(h) === normalize(headerName));
  const kodeIdx = findHeaderIndex('Kode Barang Jadi');
  let gambarIdx = findHeaderIndex('Gambar');
  const rincianProsesIdx = findHeaderIndex('Rincian Proses');

  if (kodeIdx === -1) {
    return { status: 'error', message: 'Kolom Kode Barang Jadi tidak ditemukan di sheet DB BOM.' };
  }

  if (gambarIdx === -1) {
    const newColumnPosition = headers.length + 1;
    sheet.getRange(1, newColumnPosition).setValue('Gambar');
    headers.push('Gambar');
    gambarIdx = headers.length - 1;
  }

  let rowIndex = -1;
  let oldGambarUrl = '';
  let oldRincianProses = '';
  for (let i = 1; i < values.length; i++) {
    if (values[i][kodeIdx] == payload.kode_barang) {
      rowIndex = i + 1;
      oldGambarUrl = values[i][gambarIdx] || '';
      if (rincianProsesIdx !== -1) {
        oldRincianProses = values[i][rincianProsesIdx] || '';
      }
      break;
    }
  }

  const finalGambarUrl = gambarUrl ? gambarUrl : oldGambarUrl;

  if ((prosesFinal === null || typeof prosesFinal === 'string') && rowIndex !== -1 && oldRincianProses) {
    prosesFinal = oldRincianProses;
  }

  const rincianMaterialStr = (typeof payload.rincian_material === 'string') ? payload.rincian_material : JSON.stringify(payload.rincian_material || []);
  const rincianProsesStr = typeof prosesFinal === 'string' ? prosesFinal : JSON.stringify(prosesFinal || []);
  
  const rowData = [];
  headers.forEach((h, idx) => {
    const hLow = String(h).toLowerCase().trim();
    if (hLow === 'kode barang jadi') rowData[idx] = payload.kode_barang;
    else if (hLow === 'nama barang') rowData[idx] = payload.nama_barang || (rowIndex !== -1 ? values[rowIndex-1][idx] : '');
    else if (hLow === 'rincian material') rowData[idx] = rincianMaterialStr || (rowIndex !== -1 ? values[rowIndex-1][idx] : '');
    else if (hLow === 'total biaya material') rowData[idx] = payload.total_biaya || (rowIndex !== -1 ? values[rowIndex-1][idx] : '');
    else if (hLow === 'rincian proses') rowData[idx] = rincianProsesStr || (rowIndex !== -1 ? values[rowIndex-1][idx] : '');
    else if (hLow === 'gambar') rowData[idx] = finalGambarUrl;
    else rowData[idx] = (rowIndex !== -1 ? values[rowIndex-1][idx] : '');
  });

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { status: 'success', message: 'Data BOM berhasil disimpan.' };
}

function deleteBOM(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (!sheet) return { status: 'error', message: 'Sheet DB BOM tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const kodeIdx = headers.findIndex(h => /kode/i.test(h));
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][kodeIdx]).trim() === String(payload.kode_barang).trim()) {
      sheet.deleteRow(i + 1);
      // Auto-delete from Barang Jadi as requested
      try { deleteBarangJadi({ kode: payload.kode_barang }); } catch(e) {}
      return { status: 'success', message: 'Data BOM dan Barang Jadi berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data BOM tidak ditemukan.' };
}

function deleteSPK(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const noSPKIdx = headers.findIndex(h => /no.*spk/i.test(h));
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][noSPKIdx]).trim() === String(payload.no_spk).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'SPK Produksi berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'SPK Produksi tidak ditemukan.' };
}

function manualAuthDriveApp() {
  // Jalankan fungsi ini HANYA SEKALI dari editor Apps Script untuk memunculkan prompt izin DriveApp.
  const files = DriveApp.getFiles();
  if (files.hasNext()) {
    Logger.log("DriveApp berhasil diotorisasi!");
  } else {
    Logger.log("Tidak ada file di Drive, tetapi otorisasi berhasil.");
  }
}

// FUNGSI PERBAIKAN DATA BOM (Jalankan sekali saja jika Rincian Material hilang / NaN)
function fixBOMSwappedData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (!sheet) return;
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const findHeaderIndex = (headerName) => headers.findIndex(h => normalize(h) === normalize(headerName));
  const materialIdx = findHeaderIndex('Rincian Material');
  const totalBiayaIdx = findHeaderIndex('Total Biaya Material');
  
  if (materialIdx === -1 || totalBiayaIdx === -1) return;
  
  let fixedCount = 0;
  for (let i = 1; i < values.length; i++) {
    const matVal = String(values[i][materialIdx]);
    const biayaVal = String(values[i][totalBiayaIdx]);
    
    // Jika biaya berupa JSON string (mengandung '[' atau '{') dan material berupa angka,
    // berarti datanya tertukar!
    if ((biayaVal.includes('[') || biayaVal.includes('{')) && !isNaN(parseInt(matVal))) {
      // Tukar kembali
      sheet.getRange(i + 1, materialIdx + 1).setValue(biayaVal);
      sheet.getRange(i + 1, totalBiayaIdx + 1).setValue(matVal);
      fixedCount++;
    }
  }
  
  SpreadsheetApp.getUi().alert(`Berhasil memperbaiki ${fixedCount} data BOM yang tertukar!`);
}

// ==========================================
// PENGIRIMAN (SURAT JALAN) & INVOICE
// ==========================================

function getSuratJalan() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Surat Jalan');
  if (!sheet) return { status: 'success', data: [] };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let key = h.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
      obj[key] = row[i];
    });
    return obj;
  });
  return { status: 'success', data: data };
}

function saveSuratJalan(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Surat Jalan');
  const defaultHeaders = ['No SJ', 'Tanggal', 'No Penawaran', 'Customer', 'Supir', 'Plat Nomor', 'Status', 'Catatan', 'Items'];
  if (!sheet) {
    sheet = ss.insertSheet('DB Surat Jalan');
    sheet.appendRow(defaultHeaders);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  } else {
    // Check if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    }
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const sjIdx = headers.findIndex(h => /no.*sj/i.test(h));
  
  const noSJ = payload.no_sj || ('SJ-' + Date.now());
  const itemsStr = typeof payload.items === 'string' ? payload.items : JSON.stringify(payload.items || []);
  
  let found = false;
  if (payload.no_sj && sjIdx !== -1) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][sjIdx]).trim() === String(payload.no_sj).trim()) {
        const hMap = {};
        headers.forEach((h, idx) => hMap[h.toLowerCase().trim()] = idx);
        
        if (hMap['tanggal'] !== undefined) sheet.getRange(i + 1, hMap['tanggal'] + 1).setValue(payload.tanggal || values[i][hMap['tanggal']]);
        if (hMap['no penawaran'] !== undefined) sheet.getRange(i + 1, hMap['no penawaran'] + 1).setValue(payload.no_penawaran || values[i][hMap['no penawaran']]);
        if (hMap['customer'] !== undefined) sheet.getRange(i + 1, hMap['customer'] + 1).setValue(payload.customer || values[i][hMap['customer']]);
        if (hMap['supir'] !== undefined) sheet.getRange(i + 1, hMap['supir'] + 1).setValue(payload.supir || values[i][hMap['supir']]);
        if (hMap['plat nomor'] !== undefined) sheet.getRange(i + 1, hMap['plat nomor'] + 1).setValue(payload.plat_nomor || values[i][hMap['plat nomor']]);
        if (hMap['status'] !== undefined) sheet.getRange(i + 1, hMap['status'] + 1).setValue(payload.status || values[i][hMap['status']]);
        if (hMap['catatan'] !== undefined) sheet.getRange(i + 1, hMap['catatan'] + 1).setValue(payload.catatan || values[i][hMap['catatan']]);
        if (hMap['items'] !== undefined) sheet.getRange(i + 1, hMap['items'] + 1).setValue(itemsStr);
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    const newRow = headers.map(h => {
      const hl = h.toLowerCase().trim();
      if (hl.includes('no sj')) return noSJ;
      if (hl === 'tanggal') return payload.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
      if (hl === 'no penawaran') return payload.no_penawaran || '';
      if (hl === 'customer') return payload.customer || '';
      if (hl === 'supir') return payload.supir || '';
      if (hl === 'plat nomor') return payload.plat_nomor || '';
      if (hl === 'status') return payload.status || 'Dikirim';
      if (hl === 'catatan') return payload.catatan || '';
      if (hl === 'items') return itemsStr;
      return '';
    });
    sheet.appendRow(newRow);
  }
  
  return { status: 'success', message: 'Surat Jalan berhasil disimpan.', no_sj: noSJ };
}

function deleteSuratJalan(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Surat Jalan');
  if (!sheet) return { status: 'error', message: 'Sheet DB Surat Jalan tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const sjIdx = values[0].findIndex(h => /no.*surat.*jalan/i.test(h) || /no.*sj/i.test(h));
  if(sjIdx === -1) return {status: 'error', message: 'Struktur tidak valid.'};
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][sjIdx]).trim() === String(payload.no_sj).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Surat Jalan berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Surat Jalan tidak ditemukan.' };
}

function getInvoices() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Invoice');
  if (!sheet) return { status: 'success', data: [] };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let key = h.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
      obj[key] = row[i];
    });
    return obj;
  });
  return { status: 'success', data: data };
}

function saveInvoice(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Invoice');
  if (!sheet) {
    sheet = ss.insertSheet('DB Invoice');
    sheet.appendRow(['No Invoice', 'Tanggal', 'Jatuh Tempo', 'No Penawaran', 'Customer', 'Total Tagihan', 'Terbayar', 'Sisa Tagihan', 'Status Pembayaran', 'Items', 'Catatan']);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const invIdx = headers.findIndex(h => /no.*invoice/i.test(h));
  
  const noInv = payload.no_invoice || ('INV-' + Date.now());
  const itemsStr = typeof payload.items === 'string' ? payload.items : JSON.stringify(payload.items || []);
  
  let found = false;
  if (payload.no_invoice && invIdx !== -1) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][invIdx]).trim() === String(payload.no_invoice).trim()) {
        const hMap = {};
        headers.forEach((h, idx) => hMap[h.toLowerCase().trim()] = idx);
        
        if (hMap['tanggal'] !== undefined) sheet.getRange(i + 1, hMap['tanggal'] + 1).setValue(payload.tanggal || values[i][hMap['tanggal']]);
        if (hMap['jatuh tempo'] !== undefined) sheet.getRange(i + 1, hMap['jatuh tempo'] + 1).setValue(payload.jatuh_tempo || values[i][hMap['jatuh tempo']]);
        if (hMap['no penawaran'] !== undefined) sheet.getRange(i + 1, hMap['no penawaran'] + 1).setValue(payload.no_penawaran || values[i][hMap['no penawaran']]);
        if (hMap['customer'] !== undefined) sheet.getRange(i + 1, hMap['customer'] + 1).setValue(payload.customer || values[i][hMap['customer']]);
        if (hMap['total tagihan'] !== undefined) sheet.getRange(i + 1, hMap['total tagihan'] + 1).setValue(payload.total_tagihan || values[i][hMap['total tagihan']]);
        if (hMap['terbayar'] !== undefined) sheet.getRange(i + 1, hMap['terbayar'] + 1).setValue(payload.terbayar || values[i][hMap['terbayar']] || 0);
        if (hMap['sisa tagihan'] !== undefined) sheet.getRange(i + 1, hMap['sisa tagihan'] + 1).setValue(payload.sisa_tagihan || values[i][hMap['sisa tagihan']] || 0);
        if (hMap['status pembayaran'] !== undefined) sheet.getRange(i + 1, hMap['status pembayaran'] + 1).setValue(payload.status_pembayaran || values[i][hMap['status pembayaran']]);
        if (hMap['items'] !== undefined) sheet.getRange(i + 1, hMap['items'] + 1).setValue(itemsStr);
        if (hMap['catatan'] !== undefined) sheet.getRange(i + 1, hMap['catatan'] + 1).setValue(payload.catatan || values[i][hMap['catatan']]);
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    const newRow = headers.map(h => {
      const hl = h.toLowerCase().trim();
      if (hl.includes('no invoice')) return noInv;
      if (hl === 'tanggal') return payload.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
      if (hl === 'jatuh tempo') return payload.jatuh_tempo || '';
      if (hl === 'no penawaran') return payload.no_penawaran || '';
      if (hl === 'customer') return payload.customer || '';
      if (hl === 'total tagihan') return payload.total_tagihan || 0;
      if (hl === 'terbayar') return payload.terbayar || 0;
      if (hl === 'sisa tagihan') return payload.sisa_tagihan || payload.total_tagihan || 0;
      if (hl === 'status pembayaran') return payload.status_pembayaran || 'Belum Lunas';
      if (hl === 'items') return itemsStr;
      if (hl === 'catatan') return payload.catatan || '';
      return '';
    });
    sheet.appendRow(newRow);
  }
  
  return { status: 'success', message: 'Invoice berhasil disimpan.', no_invoice: noInv };
}

function deleteInvoice(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Invoice');
  if (!sheet) return { status: 'error', message: 'Sheet DB Invoice tidak ditemukan.' };
  const values = sheet.getDataRange().getDisplayValues();
  const invIdx = values[0].findIndex(h => /no.*invoice/i.test(h));
  if(invIdx === -1) return {status: 'error', message: 'Struktur tidak valid.'};
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][invIdx]).trim() === String(payload.no_invoice).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Invoice berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Invoice tidak ditemukan.' };
}

function editBarangJadi(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Master Barang Jadi');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Barang Jadi tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { status: 'error', message: 'Data kosong.' };
  
  const headers = values[0];
  const kodeIdx = headers.findIndex(h => /kode.*barang/i.test(h));
  if (kodeIdx === -1) return { status: 'error', message: 'Kolom Kode Barang tidak ditemukan.' };
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][kodeIdx]).trim() === String(payload.kode_barang).trim()) {
      const hMap = {};
      headers.forEach((h, idx) => hMap[h.toLowerCase().trim()] = idx);
      
      if (payload.nama_barang && hMap['nama barang'] !== undefined) sheet.getRange(i + 1, hMap['nama barang'] + 1).setValue(payload.nama_barang);
      if (payload.stok !== undefined && hMap['stok'] !== undefined) sheet.getRange(i + 1, hMap['stok'] + 1).setValue(payload.stok);
      if (payload.harga_jual !== undefined && hMap['harga jual'] !== undefined) sheet.getRange(i + 1, hMap['harga jual'] + 1).setValue(payload.harga_jual);
      if (payload.lokasi_gudang !== undefined && hMap['lokasi gudang'] !== undefined) sheet.getRange(i + 1, hMap['lokasi gudang'] + 1).setValue(payload.lokasi_gudang);
      
      return { status: 'success', message: 'Data Barang Jadi berhasil diupdate.' };
    }
  }
  return { status: 'error', message: 'Barang Jadi tidak ditemukan.' };
}


// ==========================================
// COA
// ==========================================

function getCOA() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB COA');
  if (!sheet) return { status: 'success', data: [] };
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  const data = values.slice(1).map(row => {
    return {
      kode: String(row[0]).trim(),
      keterangan: String(row[1]).trim()
    };
  }).filter(item => item.kode !== '');
  
  // Sort by kode so it's naturally ordered
  data.sort((a, b) => {
    return a.kode.localeCompare(b.kode, undefined, {numeric: true, sensitivity: 'base'});
  });

  return { status: 'success', data: data };
}

function saveCOA(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB COA');
  if (!sheet) return { status: 'error', message: 'Sheet DB COA tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  const oldCode = payload.old_kode || '';
  const newCode = payload.kode || '';
  const newName = payload.keterangan || '';
  
  if (oldCode) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(oldCode).trim()) {
        sheet.getRange(i + 1, 1).setValue(newCode);
        sheet.getRange(i + 1, 2).setValue(newName);
        return { status: 'success', message: 'COA berhasil diupdate.' };
      }
    }
  }
  
  // Check if exist
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(newCode).trim()) {
      return { status: 'error', message: 'Kode Perkiraan sudah ada!' };
    }
  }
  
  sheet.appendRow([newCode, newName]);
  return { status: 'success', message: 'COA berhasil ditambahkan.' };
}

function deleteCOA(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB COA');
  if (!sheet) return { status: 'error', message: 'Sheet DB COA tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.kode).trim()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'COA berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'COA tidak ditemukan.' };
}
