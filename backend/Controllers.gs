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
  // Check if updating existing
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][kodeIdx]).trim() === String(payload.kode).trim()) {
      const rowData = headers.map(h => {
        const key = String(h).toLowerCase().replace(/ /g, '_');
        return payload[key] !== undefined ? payload[key] : values[i][headers.indexOf(h)];
      });
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { status: 'success', message: 'Data bahan baku berhasil diperbarui.' };
    }
  }
  const rowData = headers.map(h => {
    const key = String(h).toLowerCase().replace(/ /g, '_');
    if (/kode/i.test(h)) return payload.kode || ('RM' + Math.floor(Math.random()*10000));
    return payload[key] !== undefined ? payload[key] : '';
  });
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
        sheet.getRange(i + 1, 3).setValue(payload.alamat || '');
        return { status: 'success', message: 'Customer berhasil diupdate.' };
      }
    }
  }

  // Tambah baru
  const newCustId = 'CUST-' + Date.now();
  sheet.appendRow([newCustId, payload.nama || '', payload.alamat || '', new Date().toLocaleDateString('id-ID')]);
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

function savePenawaran(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet DB Penawaran tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();

  // Generate OKS-MM-YYYY-XXX No Penawaran
  let noDoc = payload.no_penawaran;
  if (!noDoc) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const prefix = `OKS-${mm}-${yyyy}-`;
    
    let maxCounter = 0;
    for (let i = 1; i < values.length; i++) {
      const existingNo = String(values[i][0]).trim();
      if (existingNo.startsWith(prefix)) {
        const parts = existingNo.split('-');
        if (parts.length === 4) {
          const counter = parseInt(parts[3], 10);
          if (!isNaN(counter) && counter > maxCounter) {
            maxCounter = counter;
          }
        }
      }
    }
    const newCounter = String(maxCounter + 1).padStart(3, '0');
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
  
  const noSPK = 'SPK-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd') + '-' + Math.floor(Math.random() * 1000);
  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  
  sheet.appendRow([
    noSPK,
    tanggal,
    payload.kode_barang || '',
    payload.qty || 0,
    payload.peminta || '',
    payload.pemberi || '',
    'Menunggu Pengambilan',
    JSON.stringify(payload.bahan_baku || [])
  ]);

  return { status: 'success', message: 'SPK berhasil diterbitkan (Menunggu Pengambilan).' };
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

  // Deduct inventory
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  if (stockSheet && bahanBaku.length > 0) {
    const stockValues = stockSheet.getDataRange().getDisplayValues();
    const stockHeaders = stockValues[0];
    const kodeIdx = stockHeaders.findIndex(h => /kode/i.test(h));
    const stokIdx = stockHeaders.findIndex(h => /stok|stock/i.test(h));
    
    if (kodeIdx !== -1 && stokIdx !== -1) {
      bahanBaku.forEach(bahan => {
        for (let i = 1; i < stockValues.length; i++) {
          if (String(stockValues[i][kodeIdx]).trim() === String(bahan.kode).trim()) {
            const currentStok = parseFloat(String(stockSheet.getRange(i + 1, stokIdx + 1).getValue()).replace(/[^0-9.-]/g, '')) || 0;
            const deduction = parseFloat(bahan.qty) || 0;
            stockSheet.getRange(i + 1, stokIdx + 1).setValue(currentStok - deduction);
            break;
          }
        }
      });
    }
  }

  sheet.getRange(rowIndex, statusIdx + 1).setValue('Dalam Proses');
  return { status: 'success', message: 'Bahan baku berhasil diambil, status Dalam Proses.' };
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
  let gambarUrl = '';
  if (payload.gambar_base64) {
    try {
      gambarUrl = uploadToDrive(payload.gambar_base64, payload.gambar_mime || 'image/jpeg', 'BOM_' + payload.kode_barang + '_' + Date.now());
    } catch(e) {
      return { status: 'error', message: 'Error Gambar Utama: ' + e.message };
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
      return { status: 'success', message: 'Data BOM berhasil dihapus.' };
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
