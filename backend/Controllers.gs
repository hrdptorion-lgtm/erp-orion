// Sample Controllers for ERP modules

function handleLogin(payload) {
  // Dummy logic, should read from 'DB Users' in Google Sheets
  const { username, password } = payload;
  
  if (username === 'admin' && password === 'admin123') {
    return { status: 'success', role: 'Direktur', nama: 'Bapak Direktur' };
  } else if (username === 'purchasing1' && password === 'purchasing123') {
    return { status: 'success', role: 'Pimpinan Purchasing', nama: 'Kepala Purchasing' };
  } else if (username === 'purchasing2' && password === 'purchasing123') {
    return { status: 'success', role: 'Staff Purchasing', nama: 'Staff Purchasing' };
  } else if (username === 'produksi1' && password === 'produksi123') {
    return { status: 'success', role: 'Pimpinan Produksi', nama: 'Kepala Produksi' };
  } else if (username === 'produksi2' && password === 'produksi123') {
    return { status: 'success', role: 'Staff Produksi', nama: 'Staff Produksi' };
  } else if (username === 'finance1' && password === 'finance123') {
    return { status: 'success', role: 'Pimpinan Finance', nama: 'Kepala Finance' };
  } else if (username === 'finance2' && password === 'finance123') {
    return { status: 'success', role: 'Staff Finance', nama: 'Staff Finance' };
  } else {
    return { status: 'error', message: 'Username atau Password salah!' };
  }
}


function getStock() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h === 'Kode Material') obj.kode = row[i];
      if (h === 'Nama Material') obj.nama = row[i];
      if (h === 'Stok') obj.stok = parseInt(row[i]) || 0;
      if (h === 'Lokasi (Rak/Zona)') obj.lokasi = row[i];
      if (h === 'Harga Satuan') obj.harga = row[i];
      if (h === 'Spesifikasi') obj.spesifikasi = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function saveStock(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const kodeIdx = headers.indexOf('Kode Material');
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][kodeIdx] == payload.kode) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = headers.map(h => {
      if (h === 'Kode Material') return payload.kode || '';
      if (h === 'Nama Material') return payload.nama || '';
      if (h === 'Stok') return payload.stok || 0;
      if (h === 'Lokasi (Rak/Zona)') return payload.lokasi || '';
      if (h === 'Harga Satuan') return payload.harga || 0;
      if (h === 'Spesifikasi') return payload.spesifikasi || '';
      return '';
  });
  
  if (rowIndex === -1) {
    // Insert new
    sheet.appendRow(rowData);
    return { status: 'success', message: 'Data bahan baku berhasil ditambahkan.' };
  } else {
    // Update existing
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: 'success', message: 'Data bahan baku berhasil diperbarui.' };
  }
}

function deleteStock(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const kodeIdx = headers.indexOf('Kode Material');
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][kodeIdx] == payload.kode) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data tidak ditemukan.' };
}

function createPO(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Supplier');
  if (!sheet) return { status: 'error', message: 'Sheet DB PO Supplier tidak ditemukan' };
  
  const noPO = 'PO-' + Date.now();
  sheet.appendRow([noPO, new Date(), payload.item || 'Berbagai Material', payload.qty || 0, 'PENDING']);
  
  return { status: 'success', message: 'PO Internal berhasil diterbitkan: ' + noPO };
}

function receiveGRN(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const poSheet = ss.getSheetByName('DB PO Supplier');
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  
  // Update PO Status
  const poData = poSheet.getDataRange().getValues();
  for (let i = 1; i < poData.length; i++) {
    if (poData[i][0] == payload.no_po) {
      poSheet.getRange(i+1, 5).setValue('RECEIVED'); // Status GRN
      break;
    }
  }
  
  // Update Stock
  const stockData = stockSheet.getDataRange().getValues();
  for (let i = 1; i < stockData.length; i++) {
    if (stockData[i][0] == payload.kode_material) {
      let currentStock = parseInt(stockData[i][3]) || 0;
      stockSheet.getRange(i+1, 4).setValue(currentStock + parseInt(payload.qty));
      
      // Log Transaksi Gudang
      const logSheet = ss.getSheetByName('DB Transaksi Gudang');
      if(logSheet) {
        logSheet.appendRow(['TRX-' + Date.now(), new Date(), 'IN', payload.no_po, payload.kode_material, payload.qty, 'Penerima: Sistem GRN', 'Penerimaan Barang (GRN)']);
      }
      
      return { status: 'success', message: 'Barang diterima (GRN) dan stok bertambah' };
    }
  }
  return { status: 'error', message: 'Material tidak ditemukan di master' };
}

function getPenawaran() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet DB Penawaran tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h === 'No Penawaran') obj.no_penawaran = row[i];
      if (h === 'Tanggal') obj.tanggal = row[i];
      if (h === 'Customer') obj.customer = row[i];
      if (h === 'Status') obj.status = row[i];
      if (h === 'Total Harga') obj.total_harga = row[i];
      if (h === 'Down Payment') obj.dp = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function savePenawaran(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet DB Penawaran tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const noIdx = headers.indexOf('No Penawaran');
  
  const noPenawaran = payload.no_penawaran || ('PNW-' + Date.now());
  const status = payload.status || 'Penawaran';
  const dp = payload.dp || 0;
  
  let rowIndex = -1;
  if (payload.no_penawaran) {
    for (let i = 1; i < values.length; i++) {
      if (values[i][noIdx] == payload.no_penawaran) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const rowData = headers.map(h => {
      if (h === 'No Penawaran') return noPenawaran;
      if (h === 'Tanggal') return rowIndex === -1 ? new Date() : values[rowIndex-1][headers.indexOf('Tanggal')];
      if (h === 'Customer') return payload.customer || '';
      if (h === 'Rincian Item') return typeof payload.rincian_item === 'string' ? payload.rincian_item : JSON.stringify(payload.rincian_item || []);
      if (h === 'Status') return status;
      if (h === 'Total Harga') return payload.total_harga || 0;
      if (h === 'Down Payment') return dp;
      if (h === 'Narasi') return payload.narasi || '';
      return '';
  });

  if (rowIndex === -1) {
    sheet.appendRow(rowData);
    return { status: 'success', message: 'Penawaran berhasil disimpan.' };
  } else {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: 'success', message: 'Penawaran berhasil diperbarui.' };
  }
}

function deletePenawaran(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Penawaran');
  if (!sheet) return { status: 'error', message: 'Sheet tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const noIdx = headers.indexOf('No Penawaran');
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][noIdx] == payload.no_penawaran) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data Penawaran berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data Penawaran tidak ditemukan.' };
}

function saveSPK(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const spkSheet = ss.getSheetByName('DB SPK Produksi');
  const stockBahan = ss.getSheetByName('DB Master Bahan Baku');
  const stockJadi = ss.getSheetByName('DB Master Barang Jadi');
  const logSheet = ss.getSheetByName('DB Transaksi Gudang');
  
  const noSPK = 'SPK-' + Date.now();
  spkSheet.appendRow([noSPK, new Date(), payload.kode_barang, payload.qty, payload.peminta || '-', payload.pemberi || '-', 'SELESAI']);
  
  // Auto Deduct Bahan Baku (Massal berdasarkan kalkulasi BOM)
  if (payload.bahan_baku && payload.bahan_baku.length > 0) {
      const stockData = stockBahan.getDataRange().getValues();
      const picText = `Peminta: ${payload.peminta || '-'} | Pemberi: ${payload.pemberi || '-'}`;
      
      payload.bahan_baku.forEach(mat => {
          if (!mat.kode) return;
          for (let i = 1; i < stockData.length; i++) {
            if (stockData[i][0] == mat.kode) {
              let currentStock = parseInt(stockData[i][3]) || 0;
              let pemakaian = parseInt(mat.qty) || 0;
              stockBahan.getRange(i+1, 4).setValue(currentStock - pemakaian);
              
              if(logSheet) {
                logSheet.appendRow(['TRX-' + Date.now(), new Date(), 'OUT', noSPK, mat.kode, pemakaian, picText, 'Penggunaan Produksi SPK']);
              }
              break;
            }
          }
      });
  }
  
  // Auto Add Barang Jadi
  const jadiData = stockJadi.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < jadiData.length; i++) {
    if (jadiData[i][0] == payload.kode_barang) {
      let currentStock = parseInt(jadiData[i][2]) || 0;
      stockJadi.getRange(i+1, 3).setValue(currentStock + parseInt(payload.qty));
      found = true;
      break;
    }
  }
  if (!found) {
      stockJadi.appendRow([payload.kode_barang, 'Barang Produksi ' + payload.kode_barang, payload.qty, 0]);
  }
  
  return { status: 'success', message: 'SPK Selesai. Bahan baku dipotong & barang jadi ditambahkan.' };
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
      if (h === 'No SPK') obj.no_spk = row[i];
      if (h === 'Tanggal') obj.tanggal = row[i];
      if (h === 'Kode Barang Jadi') obj.kode_barang = row[i];
      if (h === 'Qty Produksi') obj.qty = row[i];
      if (h === 'Status') obj.status = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function getBOM() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (!sheet) return { status: 'error', message: 'Sheet DB BOM tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h === 'Kode Barang Jadi') obj.kode_barang = row[i];
      if (h === 'Nama Barang') obj.nama_barang = row[i];
      if (h === 'Rincian Material') obj.rincian_material = row[i];
      if (h === 'Total Biaya Material') obj.total_biaya = row[i];
      if (h === 'Rincian Proses') obj.rincian_proses = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function saveBOM(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (!sheet) return { status: 'error', message: 'Sheet DB BOM tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const kodeIdx = headers.indexOf('Kode Barang Jadi');
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][kodeIdx] == payload.kode_barang) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = headers.map(h => {
      if (h === 'Kode Barang Jadi') return payload.kode_barang || '';
      if (h === 'Nama Barang') return payload.nama_barang || '';
      if (h === 'Rincian Material') return typeof payload.rincian_material === 'string' ? payload.rincian_material : JSON.stringify(payload.rincian_material);
      if (h === 'Total Biaya Material') return payload.total_biaya || 0;
      if (h === 'Rincian Proses') return typeof payload.rincian_proses === 'string' ? payload.rincian_proses : JSON.stringify(payload.rincian_proses);
      return '';
  });

  if (rowIndex === -1) {
    sheet.appendRow(rowData);
    return { status: 'success', message: 'Data BOM berhasil disimpan.' };
  } else {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: 'success', message: 'Data BOM berhasil diperbarui.' };
  }
}

function saveInvoice(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Invoice');
  
  // Logika flowchart: Hitung Total - DP
  const total = parseFloat(payload.total_harga) || 0;
  const dp = parseFloat(payload.dp) || 0;
  const grandTotal = total - dp;
  
  const noInvoice = 'INV-' + Date.now();
  sheet.appendRow([noInvoice, payload.ref_surat_jalan, payload.customer, total, dp, grandTotal, 'LUNAS']);
  
  return { status: 'success', message: 'Invoice Final diterbitkan. Piutang lunas. Total dipotong DP: Rp ' + grandTotal };
}

function addPettyCash(payload) {
  // Logic to insert petty cash entry
  return { status: 'success', message: 'Petty Cash ditambahkan.' };
}

function getSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Pengaturan');
  if (!sheet) return { status: 'error', message: 'Sheet DB Pengaturan tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: {} };
  
  let settings = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    const val = values[i][1];
    if (key) settings[key] = val;
  }
  return { status: 'success', data: settings };
}

function saveSettings(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Pengaturan');
  if (!sheet) return { status: 'error', message: 'Sheet DB Pengaturan tidak ditemukan.' };
  
  sheet.clear();
  sheet.appendRow(['Key', 'Value']);
  
  for (let key in payload) {
    sheet.appendRow([key, payload[key]]);
  }
  return { status: 'success', message: 'Pengaturan berhasil disimpan.' };
}

function getInventory() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Bahan Baku');
  if (!sheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h === 'Kode Material') obj.kode_material = row[i];
      if (h === 'Nama Material') obj.nama_material = row[i];
      if (h === 'Stok') obj.stok = parseInt(row[i]) || 0;
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Users');
  if (!sheet) return { status: 'error', message: 'Sheet DB Users tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h === 'Username') obj.username = row[i];
      if (h === 'Role') obj.role = row[i];
      if (h === 'Nama Lengkap') obj.nama = row[i];
    });
    return obj;
  });
  
  return { status: 'success', data: data };
}

function saveUser(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Users');
  if (!sheet) return { status: 'error', message: 'Sheet DB Users tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const userIdx = headers.indexOf('Username');
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][userIdx] == payload.username) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = headers.map(h => {
      if (h === 'Username') return payload.username || '';
      if (h === 'Password') return payload.password || ''; // For edit, might want to ignore if blank, but this is simple implementation
      if (h === 'Role') return payload.role || '';
      if (h === 'Nama Lengkap') return payload.nama || '';
      return '';
  });
  
  if (rowIndex === -1) {
    sheet.appendRow(rowData);
    return { status: 'success', message: 'Pengguna berhasil ditambahkan.' };
  } else {
    // If editing and password is blank, keep old password
    if (!payload.password) {
       rowData[headers.indexOf('Password')] = values[rowIndex-1][headers.indexOf('Password')];
    }
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: 'success', message: 'Data pengguna berhasil diperbarui.' };
  }
}

function deleteUser(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Users');
  if (!sheet) return { status: 'error', message: 'Sheet tidak ditemukan.' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const userIdx = headers.indexOf('Username');
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][userIdx] == payload.username) {
      if (payload.username === 'admin') return { status: 'error', message: 'Tidak dapat menghapus Super Admin.' };
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Pengguna berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Pengguna tidak ditemukan.' };
}
