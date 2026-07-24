// ERP Orion Controllers — Secured Version

// ==========================================
// PASSWORD HASHING
// ==========================================
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

// ==========================================
// SESSION TOKEN MANAGEMENT (CacheService)
// ==========================================

/**
 * Generate a session token and store it in CacheService (24 hour expiry).
 * @param {string} username
 * @param {string} role
 * @returns {string} token
 */
function generateSessionToken(username, role) {
  const token = Utilities.getUuid();
  const sessionData = JSON.stringify({
    username: username,
    role: role,
    created: new Date().toISOString()
  });
  // Store in CacheService with 24 hour expiry (86400 seconds)
  CacheService.getScriptCache().put('session_' + token, sessionData, 86400);
  return token;
}

/**
 * Validate a session token from CacheService.
 * @param {string} token
 * @returns {{ valid: boolean, username?: string, role?: string }}
 */
function validateSessionToken(token) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { valid: false };
  }
  const cached = CacheService.getScriptCache().get('session_' + token.trim());
  if (!cached) {
    return { valid: false };
  }
  try {
    const sessionData = JSON.parse(cached);
    return { valid: true, username: sessionData.username, role: sessionData.role };
  } catch (e) {
    return { valid: false };
  }
}

// ==========================================
// SUPER ADMIN SETUP (Run ONCE from Apps Script Editor)
// ==========================================

/**
 * Run this function ONCE from the Apps Script Editor to store the super admin hash.
 * Menu: Run > initSuperAdmin
 * After running, the hardcoded hash is safely stored in PropertiesService.
 */
function initSuperAdmin() {
  const props = PropertiesService.getScriptProperties();
  // Hash of the super admin password — change 'ciko1234' to your desired password before running
  const superAdminHash = hashPassword('ciko1234');
  props.setProperty('SUPER_ADMIN_USER', 'super');
  props.setProperty('SUPER_ADMIN_HASH', superAdminHash);
  Logger.log('✅ Super Admin credentials stored in PropertiesService successfully.');
  Logger.log('Username: super');
  Logger.log('Hash: ' + superAdminHash);
}

// ==========================================
// LOGIN (Secured)
// ==========================================
function handleLogin(payload) {
  const { username, password } = payload;
  
  // Frontend sudah mengirim password dalam bentuk hash SHA-256
  // Tapi untuk backward compatibility, jika belum di-hash (plain text), hash di sini
  let hashedPassword;
  if (password && password.length === 64 && /^[a-f0-9]+$/.test(password)) {
    // Sudah di-hash oleh frontend (64 karakter hex = SHA-256)
    hashedPassword = password;
  } else {
    // Fallback: hash di backend (untuk kompatibilitas sementara)
    hashedPassword = hashPassword(password);
  }
  
  // Super Admin — ambil dari PropertiesService
  const props = PropertiesService.getScriptProperties();
  const superUser = props.getProperty('SUPER_ADMIN_USER') || 'super';
  const superHash = props.getProperty('SUPER_ADMIN_HASH');
  
  // Fallback: Jika belum menjalankan initSuperAdmin(), cek langsung hardcode 'ciko1234'
  const hardcodeHash = hashPassword('ciko1234');
  const isSuperAdminProps = (superHash && username === superUser && hashedPassword === superHash);
  const isSuperAdminHardcode = (username === 'super' && hashedPassword === hardcodeHash);
  
  if (isSuperAdminProps || isSuperAdminHardcode) {
    const token = generateSessionToken(username, 'Super Admin');
    const permsRes = getRolePermissions({role: 'Super Admin'});
    return { status: 'success', role: 'Super Admin', nama: 'Super Admin', token: token, permissions: permsRes.data };
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
    if (row[userIdx] === username) {
      const dbPass = String(row[passIdx] || '');
      let isMatch = false;

      if (dbPass === hashedPassword) {
        isMatch = true; // Normal match (already hashed in DB)
      } else if (dbPass.length < 64 && hashPassword(dbPass) === hashedPassword) {
        // Auto-upgrade: The DB contains a plain text password whose hash matches the frontend's hash
        isMatch = true;
        // Update the spreadsheet with the hashed version for future security
        sheet.getRange(i + 1, passIdx + 1).setValue(hashedPassword);
        SpreadsheetApp.flush(); // Paksa simpan seketika
      }

      if (isMatch) {
        const role = row[roleIdx] || 'Admin';
        const token = generateSessionToken(username, role);
        const permsRes = getRolePermissions({role: role});
        return { 
          status: 'success', 
          role: role, 
          nama: row[namaIdx] || username,
          token: token,
          permissions: permsRes.data
        };
      }
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
  const stokIdx = headers.findIndex(h => /stok|stock/i.test(String(h).trim()));
  const hargaIdx = headers.findIndex(h => /harga/i.test(h));
  const satuanIdx = headers.findIndex(h => /satuan/i.test(String(h).trim()) && !/harga/i.test(String(h).trim()));
  const lokasiIdx = headers.findIndex(h => /lokasi/i.test(h));
  const spesifikasiIdx = headers.findIndex(h => /spesifikasi/i.test(h));
  
  const data = values.slice(1).filter(r => r[namaIdx] && String(r[namaIdx]).trim() !== '').map(row => ({
    kode: kodeIdx !== -1 ? row[kodeIdx] : '',
    nama: namaIdx !== -1 ? row[namaIdx] : '',
    stok: stokIdx !== -1 ? row[stokIdx] : '0',
    harga: hargaIdx !== -1 ? row[hargaIdx] : '0',
    satuan: satuanIdx !== -1 ? row[satuanIdx] : (stokIdx !== -1 && String(row[stokIdx]).match(/[a-zA-Z]+/)) ? String(row[stokIdx]).replace(/[^a-zA-Z]+/g, '').trim().toLowerCase() : 'pcs',
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
      const oldHargaStr = values[i][headers.findIndex(h => /harga/i.test(h))];
      const oldHarga = parseInt(String(oldHargaStr).replace(/\\D/g, '')) || 0;
      const newHarga = parseInt(String(payload.harga).replace(/\\D/g, '')) || 0;
      const materialName = String(values[i][headers.findIndex(h => /nama/i.test(h))]).trim();

      const rowData = headers.map(h => mapPayload(h, payload, values[i][headers.indexOf(h)]));
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);

      if (oldHarga !== newHarga) {
        try { syncBOMPrices(materialName, newHarga); } catch(e) { Logger.log("Error sync BOM: " + e.message); }
      }

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
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const kodeIdx = headers.findIndex(h => /kode/i.test(h));
  const namaIdx = headers.findIndex(h => /nama/i.test(h));
  const stokIdx = headers.findIndex(h => /stok|stock/i.test(String(h).trim()));
  const hargaIdx = headers.findIndex(h => /harga/i.test(h));
  const satuanIdx = headers.findIndex(h => /satuan/i.test(String(h).trim()) && !/harga/i.test(String(h).trim()));
  const lokasiIdx = headers.findIndex(h => /lokasi/i.test(h));
  const spesifikasiIdx = headers.findIndex(h => /spesifikasi/i.test(h));

  let countNew = 0;
  let countUpdated = 0;

  payload.data.forEach(item => {
    let foundIdx = -1;
    if (kodeIdx !== -1 && item.kode) {
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][kodeIdx]).trim().toLowerCase() === String(item.kode).trim().toLowerCase()) {
          foundIdx = i;
          break;
        }
      }
    }

    if (foundIdx !== -1) {
      // Update existing
      const rowNum = foundIdx + 1;
      if (namaIdx !== -1 && item.nama !== undefined) sheet.getRange(rowNum, namaIdx + 1).setValue(item.nama);
      if (stokIdx !== -1 && item.stok !== undefined) sheet.getRange(rowNum, stokIdx + 1).setValue(item.stok);
      if (hargaIdx !== -1 && item.harga !== undefined) sheet.getRange(rowNum, hargaIdx + 1).setValue(item.harga);
      if (satuanIdx !== -1 && item.satuan !== undefined) sheet.getRange(rowNum, satuanIdx + 1).setValue(item.satuan);
      if (lokasiIdx !== -1 && item.lokasi !== undefined) sheet.getRange(rowNum, lokasiIdx + 1).setValue(item.lokasi);
      if (spesifikasiIdx !== -1 && item.spesifikasi !== undefined) sheet.getRange(rowNum, spesifikasiIdx + 1).setValue(item.spesifikasi);
      countUpdated++;
    } else {
      // Append new
      const newRow = Array(headers.length).fill('');
      if (kodeIdx !== -1) newRow[kodeIdx] = item.kode || '';
      if (namaIdx !== -1) newRow[namaIdx] = item.nama || '';
      if (stokIdx !== -1) newRow[stokIdx] = item.stok || 0;
      if (hargaIdx !== -1) newRow[hargaIdx] = item.harga || 0;
      if (satuanIdx !== -1) newRow[satuanIdx] = item.satuan || 'pcs';
      if (lokasiIdx !== -1) newRow[lokasiIdx] = item.lokasi || '';
      if (spesifikasiIdx !== -1) newRow[spesifikasiIdx] = item.spesifikasi || '';
      sheet.appendRow(newRow);
      countNew++;
    }
  });

  let msg = '';
  if (countNew > 0) msg += `${countNew} data baru ditambahkan. `;
  if (countUpdated > 0) msg += `${countUpdated} data diperbarui.`;
  return { status: 'success', message: msg.trim() || 'Tidak ada data yang diproses.' };
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
    headers.forEach((h, i) => { obj[String(h).trim().toLowerCase().replace(/ /g, '_')] = row[i]; });
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
                lokasi_gudang: '-'
              };
              data.push(newObj);
              
              const rowData = headers.map(h => {
                const hl = String(h).toLowerCase().trim();
                if (/kode/i.test(hl)) return bomKode;
                if (/nama/i.test(hl)) return bomNama;
                if (/stok|stock/i.test(hl)) return 0;
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
  // Password sudah di-hash oleh frontend, langsung simpan
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][userIdx]).trim() === String(payload.username).trim()) {
      const rowData = headers.map((h, idx) => {
        const key = String(h).toLowerCase().replace(/ /g, '_');
        if (/password/i.test(h)) {
          if (!payload.password) return values[i][idx];
          let pwd = payload.password;
          if (!(pwd && pwd.length === 64 && /^[a-f0-9]+$/.test(pwd))) {
            pwd = hashPassword(pwd);
          }
          return pwd;
        }
        return payload[key] !== undefined ? payload[key] : values[i][idx];
      });
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { status: 'success', message: 'User berhasil diperbarui.' };
    }
  }
  const rowData = headers.map(h => {
    const key = String(h).toLowerCase().replace(/ /g, '_');
    if (/password/i.test(h)) {
      let pwd = payload[key] !== undefined ? payload[key] : '';
      if (pwd && !(pwd.length === 64 && /^[a-f0-9]+$/.test(pwd))) {
        pwd = hashPassword(pwd);
      }
      return pwd;
    }
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
          if (i === sHargaIdx) return item.harga_aktual > 0 ? item.harga_aktual : (item.harga || 0);
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
    po_alamat: payload.po_alamat || '',
    po_customer_ref: payload.po_customer_ref || '',
    po_enq_no: payload.po_enq_no || '',
    po_maker: payload.po_maker || '',
    po_delivery: payload.po_delivery || '',
    po_incoterm: payload.po_incoterm || '',
    po_payment_term: payload.po_payment_term || '',
    po_validity: payload.po_validity || ''
  };

  // Auto-register new supplier logic has been removed as requested.
  
  
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

function processGRN(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const poSheet = ss.getSheetByName('DB PO Internal');
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  const trxSheet = ss.getSheetByName('DB Transaksi Gudang');
  
  if (!poSheet || !stockSheet) return { status: 'error', message: 'Sheet DB tidak ditemukan.' };
  
  const poValues = poSheet.getDataRange().getDisplayValues();
  const poHeaders = poValues[0];
  const noPOIdx = poHeaders.findIndex(h => /no.*po/i.test(h));
  const statusIdx = poHeaders.findIndex(h => /^status$/i.test(String(h)));
  const itemsIdx = poHeaders.findIndex(h => /^items$/i.test(String(h)));
  
  let poRowIndex = -1;
  let itemsJson = '';
  
  for (let i = 1; i < poValues.length; i++) {
    if (String(poValues[i][noPOIdx]).trim() === String(payload.no_po).trim()) {
      poRowIndex = i + 1;
      itemsJson = poValues[i][itemsIdx] || '[]';
      break;
    }
  }
  
  if (poRowIndex === -1) return { status: 'error', message: 'No PO tidak ditemukan.' };
  
  let items = [];
  try { items = JSON.parse(itemsJson); } catch(e) {}
  
  const receivedData = payload.received_items || [];
  let updatedCount = 0;
  
  const stockValues = stockSheet.getDataRange().getDisplayValues();
  const stockHeaders = stockValues[0];
  const sKodeIdx = stockHeaders.findIndex(h => /kode/i.test(h));
  const sNamaIdx = stockHeaders.findIndex(h => /nama/i.test(h));
  const sStokIdx = stockHeaders.findIndex(h => /stok|stock/i.test(h));
  const sHargaIdx = stockHeaders.findIndex(h => /harga/i.test(h));
  const sSatuanIdx = stockHeaders.findIndex(h => /satuan/i.test(h));
  
  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  
  // Process each received item
  receivedData.forEach(rItem => {
    const qtyIn = parseFloat(rItem.qty_in) || 0;
    if (qtyIn <= 0) return;
    
    // Find in PO items to update qty_received
    let poItemRef = null;
    for (let it of items) {
      if (String(it.kode) === String(rItem.kode)) {
        it.qty_received = (parseFloat(it.qty_received) || 0) + qtyIn;
        poItemRef = it;
        break;
      }
    }
    
    // Find in Master Stock to add
    let foundStockRow = -1;
    for (let i = 1; i < stockValues.length; i++) {
      const k = String(stockValues[i][sKodeIdx] || '').trim();
      if (k === String(rItem.kode).trim()) {
        foundStockRow = i + 1;
        break;
      }
    }
    
    if (foundStockRow !== -1) {
      const currentStok = parseFloat(String(stockSheet.getRange(foundStockRow, sStokIdx + 1).getValue()).replace(/[^0-9.]/g, '')) || 0;
      stockSheet.getRange(foundStockRow, sStokIdx + 1).setValue(currentStok + qtyIn);
      
      if (trxSheet) {
        const idTrx = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 100);
        const ket = 'Penerimaan Parsial/GRN dari PO Internal No: ' + payload.no_po;
        trxSheet.appendRow([idTrx, tanggal, 'IN', payload.no_po, rItem.kode, qtyIn, 'Sistem (GRN)', ket, 'Sistem', 'Sistem (Auto-Approve)']);
      }
      updatedCount++;
    } else if (poItemRef) {
       // Auto create new material if not found in stock
       const newRow = stockHeaders.map((h, idx) => {
          if (idx === sKodeIdx) return poItemRef.kode;
          if (idx === sNamaIdx) return poItemRef.nama;
          if (idx === sStokIdx) return qtyIn;
          if (idx === sHargaIdx) return poItemRef.harga || 0;
          if (idx === sSatuanIdx) return poItemRef.satuan || 'pcs';
          return '';
       });
       stockSheet.appendRow(newRow);
       
       if (trxSheet) {
        const idTrx = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 100);
        const ket = 'Penerimaan Material Baru GRN dari PO Internal No: ' + payload.no_po;
        trxSheet.appendRow([idTrx, tanggal, 'IN', payload.no_po, poItemRef.kode, qtyIn, 'Sistem (GRN)', ket, 'Sistem', 'Sistem (Auto-Approve)']);
       }
       updatedCount++;
    }
  });
  
  // Update PO items JSON
  poSheet.getRange(poRowIndex, itemsIdx + 1).setValue(JSON.stringify(items));
  
  // Check completion
  let allComplete = true;
  for (let it of items) {
    const qPesan = parseFloat(it.qty) || 0;
    const qTerima = parseFloat(it.qty_received) || 0;
    if (qTerima < qPesan) {
      allComplete = false;
      break;
    }
  }
  
  const newStatus = allComplete ? 'Selesai (Barang Diterima)' : 'Parsial';
  poSheet.getRange(poRowIndex, statusIdx + 1).setValue(newStatus);
  
  return { status: 'success', message: `${updatedCount} item stok berhasil ditambahkan. Status PO saat ini: ${newStatus}` };
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
        sheet.getRange(i + 1, 3).setValue(payload.kontak ? "'" + payload.kontak : '');
        sheet.getRange(i + 1, 4).setValue(payload.alamat || '');
        return { status: 'success', message: 'Customer berhasil diupdate.' };
      }
    }
  }

  // Tambah baru
  const newCustId = 'CUST-' + Date.now();
  sheet.appendRow([newCustId, payload.nama || '', payload.kontak ? "'" + payload.kontak : '', payload.alamat || '', new Date().toLocaleDateString('id-ID')]);
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
        sheet.getRange(i + 1, 3).setValue(payload.kontak ? "'" + payload.kontak : '');
        sheet.getRange(i + 1, 4).setValue(payload.alamat || '');
        return { status: 'success', message: 'Supplier berhasil diupdate.' };
      }
    }
  }

  // Tambah baru
  const newSuppId = 'SUPP-' + Date.now();
  sheet.appendRow([newSuppId, payload.nama || '', payload.kontak ? "'" + payload.kontak : '', payload.alamat || '', new Date().toLocaleDateString('id-ID')]);
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
      sheet.getRange(i + 1, 7).setValue(payload.status || 'Draft');
      sheet.getRange(i + 1, 8).setValue(payload.narasi || '');
      sheet.getRange(i + 1, 9).setValue(infoStr);
      handleAutoBOM(payload, noDoc);
      
      // Update linked PO Customer if exists
      try {
        const poSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Customer');
        if (poSheet) {
          const poValues = poSheet.getDataRange().getDisplayValues();
          for (let j = 1; j < poValues.length; j++) {
            if (String(poValues[j][1]).trim() === noDoc) {
              poSheet.getRange(j + 1, 5).setValue(rincianStr);
              poSheet.getRange(j + 1, 6).setValue(payload.total_harga || 0);
              break;
            }
          }
        }
      } catch(e) {}

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
    payload.status || 'Draft', 
    payload.narasi || '',
    infoStr
  ]);
  
  if (payload.revisi_dari) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(payload.revisi_dari).trim()) {
        sheet.getRange(i + 1, 7).setValue('Rejected'); // update status of old to Rejected
        break;
      }
    }
  }
  
  handleAutoBOM(payload, noDoc);
  return { status: 'success', message: 'Penawaran berhasil disimpan.', no_doc: noDoc };
}

function handleAutoBOM(payload, noDoc) {
  let rincianArr = [];
  if (Array.isArray(payload.rincian_item)) rincianArr = payload.rincian_item;
  else if (typeof payload.rincian_item === 'string') {
    try { rincianArr = JSON.parse(payload.rincian_item); } catch(e){}
  }

  const bomSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (bomSheet && rincianArr.length > 0) {
    const bomData = bomSheet.getDataRange().getValues();
    if (bomData.length < 1) return;
    const bomHeaders = bomData[0];
    const bNamaIdx = bomHeaders.findIndex(h => String(h).trim().toLowerCase() === 'nama barang');
    const bKodeIdx = bomHeaders.findIndex(h => String(h).trim().toLowerCase() === 'kode barang jadi');
    const bProsesIdx = bomHeaders.findIndex(h => String(h).trim().toLowerCase() === 'rincian proses');

    if (payload.status === 'Reject' || payload.status === 'Rejected' || payload.status === 'Ditolak') {
      if (bProsesIdx !== -1 && bKodeIdx !== -1) {
        for (let i = bomData.length - 1; i >= 1; i--) {
          const prosesVal = String(bomData[i][bProsesIdx]);
          if (prosesVal.includes(`[AUTO-BOM:${noDoc}]`)) {
             try { deleteBarangJadi({ kode: bomData[i][bKodeIdx] }); } catch(e){}
             bomSheet.deleteRow(i + 1);
          }
        }
      }
    } else {
      if (bNamaIdx !== -1) {
        rincianArr.forEach(item => {
          const itemName = item.part_name || '';
          if (itemName) {
            const exists = bomData.some((row, i) => i > 0 && String(row[bNamaIdx]).trim().toLowerCase() === itemName.trim().toLowerCase());
            if (!exists) {
              const newKode = 'FG-' + Math.floor(Math.random() * 1000000);
              const newRow = bomHeaders.map(h => {
                const hl = String(h).trim().toLowerCase();
                if (hl === 'kode barang jadi') return newKode;
                if (hl === 'nama barang') return itemName.trim();
                if (hl === 'rincian proses') return `[AUTO-BOM:${noDoc}]`;
                if (hl === 'rincian material' || hl === 'gambar') return '';
                if (hl === 'total biaya material') return 0;
                return '';
              });
              bomSheet.appendRow(newRow);
              bomData.push(newRow);
              
              try {
                const bjSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Master Barang Jadi');
                if (bjSheet) {
                   bjSheet.appendRow([newKode, itemName.trim(), '-', 0, '-', 0, '-']);
                }
              } catch(e) {}
            }
          }
        });
      }
    }
  }
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

  const headers = values[0];
  const ppnIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'ppn');
  const dpIdx = headers.findIndex(h => String(h).toLowerCase().trim() === 'dp po customer');

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
      if (ppnIdx !== -1) {
        sheet.getRange(i + 1, ppnIdx + 1).setValue(payload.ppn || 0);
      }
      if (dpIdx !== -1) {
        sheet.getRange(i + 1, dpIdx + 1).setValue(payload.dp_po_customer || 0);
      }
      return { status: 'success', message: 'PO Customer berhasil diupdate.' };
    }
  }
  
  const newRow = [
    idPO,
    payload.no_penawaran || '',
    payload.nama_customer || '',
    payload.tanggal_po || new Date().toLocaleDateString('id-ID'),
    itemStr,
    payload.total_harga || 0,
    payload.status || 'Pending',
    fileUrl,
    payload.tanggal_selesai || ''
  ];
  
  const maxIdx = Math.max(ppnIdx, dpIdx, newRow.length - 1);
  while (newRow.length <= maxIdx) newRow.push('');
  if (ppnIdx !== -1) newRow[ppnIdx] = payload.ppn || 0;
  if (dpIdx !== -1) newRow[dpIdx] = payload.dp_po_customer || 0;
  
  sheet.appendRow(newRow);
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

function updatePOCustomerStatusByPOId(poId, newStatus) {
  if (!poId || !newStatus) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Customer');
  if (!sheet) return;
  const values = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(poId).trim() || String(values[i][1]).trim() === String(poId).trim()) {
      sheet.getRange(i + 1, 7).setValue(newStatus);
      break;
    }
  }
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
    let val = payload[key];
    if (typeof val === 'string' && val.match(/^0\d+$/)) {
      val = "'" + val; // Prevent Google Sheets from removing leading zero
    }
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(val);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([key, val]);
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
  
  const poId = payload.kode_po_customer || payload.no_penawaran || '';
  let existingBatchCount = 0;
  
  if (poId && payload.kode_barang) {
    const values = sheet.getDataRange().getDisplayValues();
    for (let r = 1; r < values.length; r++) {
      const rowRef = values[r][8] || '';
      const rowCode = values[r][2] || '';
      const rowStatus = values[r][6] || '';
      if ((rowRef === poId || rowRef === payload.no_penawaran) && rowCode === payload.kode_barang && rowStatus !== 'Batal') {
        existingBatchCount++;
      }
    }
  }

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

    let globalBatchSeq = existingBatchCount + i + 1;
    let batchSuffix = `-B${globalBatchSeq}`;
    
    sheet.appendRow([
      baseNoSPK + batchSuffix,
      tanggal,
      payload.kode_barang || '',
      currentQty,
      payload.peminta || '',
      payload.pemberi || '',
      'Menunggu Pengambilan',
      JSON.stringify(currentBahanBaku),
      poId
    ]);
  }

  if (poId) {
    updatePOCustomerStatusByPOId(poId, 'Proses');
  }

  let msg = batchCount > 1 ? `SPK berhasil diterbitkan dalam ${batchCount} Batch.` : 'SPK berhasil diterbitkan (Menunggu Pengambilan).';
  return { status: 'success', message: msg };
}

function editSPK(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DB SPK Produksi');
  if (!sheet) return { status: 'error', message: 'Sheet DB SPK Produksi tidak ditemukan.' };
  
  const spkNo = payload.spk_edit_mode_no;
  if (!spkNo) return { status: 'error', message: 'Nomor SPK tidak diberikan.' };

  const values = sheet.getDataRange().getDisplayValues();
  let rowIndex = -1;
  let currentStatus = '';

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === spkNo) {
      rowIndex = i + 1;
      currentStatus = values[i][6];
      break;
    }
  }

  if (rowIndex === -1) {
    return { status: 'error', message: 'SPK tidak ditemukan.' };
  }

  if (currentStatus !== 'Menunggu Pengambilan') {
    return { status: 'error', message: 'SPK tidak bisa diedit karena statusnya sudah ' + currentStatus };
  }

  const totalQty = parseInt(payload.qty) || 0;
  
  let currentBahanBaku = [];
  if (payload.bahan_baku && payload.bahan_baku.length > 0) {
    currentBahanBaku = payload.bahan_baku.map(b => ({
      kode: b.kode,
      nama: b.nama,
      qty: b.qty
    }));
  }

  sheet.getRange(rowIndex, 3).setValue(payload.kode_barang || '');
  sheet.getRange(rowIndex, 4).setValue(totalQty);
  sheet.getRange(rowIndex, 5).setValue(payload.peminta || '');
  sheet.getRange(rowIndex, 6).setValue(payload.pemberi || '');
  sheet.getRange(rowIndex, 8).setValue(JSON.stringify(currentBahanBaku));
  sheet.getRange(rowIndex, 9).setValue(payload.kode_po_customer || payload.no_penawaran || '');
  
  return { status: 'success', message: 'SPK berhasil diperbarui.' };
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
  const namaBarangIdx = headers.findIndex(h => /nama.*barang/i.test(h));

  let rowIndex = -1;
  let bahanBakuJson = '[]';
  let namaBarangSPK = '';
  for (let i = 1; i < spkValues.length; i++) {
    if (String(spkValues[i][noSPKIdx]).trim() === String(payload.no_spk).trim()) {
      rowIndex = i + 1;
      bahanBakuJson = spkValues[i][bahanIdx] || '[]';
      if (namaBarangIdx !== -1) namaBarangSPK = spkValues[i][namaBarangIdx] || '';
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
                const ket = 'Kebutuhan untuk SPK ' + payload.no_spk + (namaBarangSPK ? ' (Pembuatan: ' + namaBarangSPK + ')' : '');
                const peminta = payload.peminta || 'Sistem';
                trxSheet.appendRow([idTrx, tanggal, 'OUT', payload.no_spk, bahan.kode, actualDeduct, 'Sistem (SPK)', ket, peminta, '']);
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

function addPettyCash(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Petty Cash');
  if (!sheet) return { status: 'error', message: 'Sheet DB Petty Cash tidak ditemukan.' };
  sheet.appendRow([new Date().toLocaleDateString('id-ID'), payload.jenis || 'Keluar', payload.keterangan || '', payload.jumlah || 0, payload.coa || '', payload.user || '']);
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

  // Auto-insert/update to Barang Jadi
  try {
    const bjSheet = ss.getSheetByName('DB Master Barang Jadi');
    if (bjSheet) {
      const bjValues = bjSheet.getDataRange().getDisplayValues();
      const bjHeaders = bjValues[0];
      const bjKodeIdx = bjHeaders.findIndex(h => /kode/i.test(h));
      const bjNamaIdx = bjHeaders.findIndex(h => /nama/i.test(h));
      const bjStokIdx = bjHeaders.findIndex(h => /stok|stock/i.test(h));
      const bjLokasiIdx = bjHeaders.findIndex(h => /lokasi/i.test(h));
      
      let bjRowIndex = -1;
      if (bjKodeIdx !== -1) {
        for (let i = 1; i < bjValues.length; i++) {
          if (String(bjValues[i][bjKodeIdx]).trim() === String(payload.kode_barang).trim()) {
            bjRowIndex = i + 1;
            break;
          }
        }
      }
      
      if (bjRowIndex === -1 && bjKodeIdx !== -1) {
        const newBjRow = bjHeaders.map((h, i) => {
          if (i === bjKodeIdx) return payload.kode_barang;
          if (i === bjNamaIdx) return payload.nama_barang;
          if (i === bjStokIdx) return 0;
          if (i === bjLokasiIdx) return '-';
          return '';
        });
        bjSheet.appendRow(newBjRow);
      } else if (bjRowIndex !== -1 && bjNamaIdx !== -1) {
        bjSheet.getRange(bjRowIndex, bjNamaIdx + 1).setValue(payload.nama_barang);
      }
    }
  } catch (e) {
    Logger.log('[Auto-Insert Barang Jadi] Error: ' + e.toString());
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
function adjustSJStockAndPO(items, isRevert, poNo, noSJ, user) {
  if (!items || items.length === 0) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sign = isRevert ? 1 : -1; 
  
  // 1. Master Barang Jadi
  const bjSheet = ss.getSheetByName('DB Master Barang Jadi');
  const trxSheet = ss.getSheetByName('DB Transaksi Gudang');
  const dateStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  if (bjSheet) {
     const bjVals = bjSheet.getDataRange().getDisplayValues();
     const kodeIdx = bjVals[0].findIndex(h => /kode/i.test(h));
     const namaIdx = bjVals[0].findIndex(h => /nama/i.test(h));
     const stokIdx = bjVals[0].findIndex(h => /stok|stock/i.test(h));
     
     if (kodeIdx !== -1 && stokIdx !== -1) {
         items.forEach(it => {
            let qty = parseFloat(it.qty) || 0;
            if (qty === 0) return;
            for (let i = 1; i < bjVals.length; i++) {
               if (String(bjVals[i][namaIdx]).trim().toLowerCase() === String(it.nama).trim().toLowerCase()) {
                  let cur = parseFloat(String(bjVals[i][stokIdx]).replace(/[^0-9.-]/g, '')) || 0;
                  let newVal = cur + (qty * sign);
                  bjSheet.getRange(i + 1, stokIdx + 1).setValue(newVal);
                  
                  if (trxSheet) {
                      const idTrx = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                      if (!isRevert) {
                          trxSheet.appendRow([idTrx, dateStr, 'OUT', noSJ, bjVals[i][kodeIdx], qty, user || 'Sistem', 'Pengiriman PO ' + poNo, '', 'Barang Jadi']);
                      } else {
                          trxSheet.appendRow([idTrx, dateStr, 'IN', noSJ, bjVals[i][kodeIdx], qty, user || 'Sistem', 'Revisi/Batal SJ ' + noSJ, '', 'Barang Jadi']);
                      }
                  }
                  break;
               }
            }
         });
     }
  }
  
  // 2. PO Customer
  const poSheet = ss.getSheetByName('DB PO Customer');
  if (poSheet && poNo) {
     const poVals = poSheet.getDataRange().getDisplayValues();
     const poIdIdx = poVals[0].findIndex(h => h.toLowerCase().trim() === 'id po customer' || h.toLowerCase().trim().includes('id po'));
     const poNoPenIdx = poVals[0].findIndex(h => h.toLowerCase().trim() === 'no penawaran');
     const poItemIdx = poVals[0].findIndex(h => h.toLowerCase().trim() === 'item po' || h.toLowerCase().trim() === 'items');
     
     if ((poIdIdx !== -1 || poNoPenIdx !== -1) && poItemIdx !== -1) {
         for (let i = 1; i < poVals.length; i++) {
             let matchId = poIdIdx !== -1 && String(poVals[i][poIdIdx]).trim() === String(poNo).trim();
             let matchNo = poNoPenIdx !== -1 && String(poVals[i][poNoPenIdx]).trim() === String(poNo).trim();
             if (matchId || matchNo) {
                 let poItems = [];
                 try { poItems = JSON.parse(poVals[i][poItemIdx]); } catch(e) {}
                 
                 items.forEach(it => {
                    let qty = parseFloat(it.qty) || 0;
                    if (qty === 0) return;
                    let poItem = poItems.find(p => String(p.nama || p.part_name).trim().toLowerCase() === String(it.nama).trim().toLowerCase());
                    if (poItem) {
                       let delivered = parseFloat(poItem.qty_delivered) || 0;
                       let deliverChange = isRevert ? -qty : qty;
                       poItem.qty_delivered = Math.max(0, delivered + deliverChange);
                    }
                 });
                 poSheet.getRange(i + 1, poItemIdx + 1).setValue(JSON.stringify(poItems));
                 break;
             }
         }
     }
  }
}

function saveSuratJalan(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Surat Jalan');
  const defaultHeaders = ['No SJ', 'Tanggal', 'No Penawaran', 'Customer', 'Alamat Penerima', 'Supir', 'Plat Nomor', 'Status', 'Catatan', 'Items'];
  if (!sheet) {
    sheet = ss.insertSheet('DB Surat Jalan');
    sheet.appendRow(defaultHeaders);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  } else {
    // Check if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
    }
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const sjIdx = headers.findIndex(h => /no.*surat.*jalan/i.test(h) || /no.*sj/i.test(h));
  
  const noSJ = payload.no_sj || ('SJ-' + Date.now());
  const itemsStr = typeof payload.items === 'string' ? payload.items : JSON.stringify(payload.items || []);
  
  let found = false;
  if (payload.no_sj && sjIdx !== -1) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][sjIdx]).trim() === String(payload.no_sj).trim()) {
        // Flexible header map
        const hMap = {};
        headers.forEach((h, idx) => {
          const hl = h.toLowerCase().trim();
          if (hl.includes('tanggal')) hMap['tanggal'] = idx;
          if (hl.includes('penawaran') || hl.includes('po customer')) hMap['penawaran'] = idx;
          if (hl.includes('customer')) hMap['customer'] = idx;
          if (hl.includes('supir')) hMap['supir'] = idx;
          if (hl.includes('plat')) hMap['plat'] = idx;
          if (hl === 'status') hMap['status'] = idx;
          if (hl === 'catatan') hMap['catatan'] = idx;
          if (hl === 'items') hMap['items'] = idx;
          if (hl === 'qty' || hl === 'total qty') hMap['qty'] = idx;
          if (hl === 'item') hMap['item'] = idx;
          if (hl.includes('alamat')) hMap['alamat'] = idx;
          else if (hl.includes('penerima')) hMap['penerima'] = idx;
        });
        
        if (hMap['tanggal'] !== undefined && payload.tanggal) sheet.getRange(i + 1, hMap['tanggal'] + 1).setValue(payload.tanggal);
        if (hMap['penawaran'] !== undefined && payload.no_penawaran !== undefined) sheet.getRange(i + 1, hMap['penawaran'] + 1).setValue(payload.no_penawaran);
        if (hMap['customer'] !== undefined && payload.customer !== undefined) sheet.getRange(i + 1, hMap['customer'] + 1).setValue(payload.customer);
        if (hMap['alamat'] !== undefined && payload.alamat_penerima !== undefined) sheet.getRange(i + 1, hMap['alamat'] + 1).setValue(payload.alamat_penerima);
        if (hMap['supir'] !== undefined && payload.supir !== undefined) sheet.getRange(i + 1, hMap['supir'] + 1).setValue(payload.supir);
        if (hMap['plat'] !== undefined && payload.plat_nomor !== undefined) sheet.getRange(i + 1, hMap['plat'] + 1).setValue(payload.plat_nomor);
        if (hMap['status'] !== undefined && payload.status !== undefined) sheet.getRange(i + 1, hMap['status'] + 1).setValue(payload.status);
        if (hMap['catatan'] !== undefined && payload.catatan !== undefined) sheet.getRange(i + 1, hMap['catatan'] + 1).setValue(payload.catatan);
        if (hMap['items'] !== undefined && payload.items !== undefined) {
           const oldItemsStr = String(values[i][hMap['items']]);
           const oldPoNo = String(values[i][hMap['penawaran']]);
           try {
             const oldItems = JSON.parse(oldItemsStr);
             adjustSJStockAndPO(oldItems, true, oldPoNo, payload.no_sj, payload.dibuat_oleh);
           } catch(e) {}
           
           sheet.getRange(i + 1, hMap['items'] + 1).setValue(itemsStr);
           
           try {
             const newItems = typeof payload.items === 'string' ? JSON.parse(payload.items) : payload.items;
             adjustSJStockAndPO(newItems, false, payload.no_penawaran || oldPoNo, payload.no_sj, payload.dibuat_oleh);
           } catch(e) {}
        }
        if (hMap['penerima'] !== undefined && payload.penerima !== undefined) sheet.getRange(i + 1, hMap['penerima'] + 1).setValue(payload.penerima);
        
        // Update Total Qty and Item (Name) if they exist
        try {
          const itemArr = typeof payload.items === 'string' ? JSON.parse(payload.items) : (payload.items || []);
          const totalQty = itemArr.reduce((sum, it) => sum + parseInt(it.qty || 0), 0);
          const itemNames = itemArr.map(it => it.nama).join(', ');
          if (hMap['qty'] !== undefined && totalQty > 0) sheet.getRange(i + 1, hMap['qty'] + 1).setValue(totalQty);
          if (hMap['item'] !== undefined && itemNames) sheet.getRange(i + 1, hMap['item'] + 1).setValue(itemNames);
        } catch(e) {}
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    const newRow = headers.map(h => {
      const hl = h.toLowerCase().trim();
      if (hl.includes('no sj') || hl.includes('surat jalan')) return noSJ;
      if (hl.includes('tanggal')) return payload.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
      if (hl.includes('penawaran') || hl.includes('po customer')) return payload.no_penawaran || '';
      if (hl.includes('customer')) return payload.customer || '';
      if (hl.includes('alamat')) return payload.alamat_penerima || '';
      if (hl.includes('supir')) return payload.supir || '';
      if (hl.includes('plat')) return payload.plat_nomor || '';
      if (hl === 'status') return payload.status || 'Dikirim';
      if (hl === 'catatan') return payload.catatan || '';
      
      // Calculate Total Qty and Total Sisa if needed
      let totalQty = 0;
      let totalSisa = 0;
      try {
        const itemArr = typeof payload.items === 'string' ? JSON.parse(payload.items) : (payload.items || []);
        totalQty = itemArr.reduce((sum, it) => sum + parseInt(it.qty || 0), 0);
        // Sisa Outstanding PO isn't sent directly, but we can leave it empty or 0 if not provided
      } catch (e) {}

      if (hl === 'qty' || hl === 'total qty') return totalQty;
      if (hl.includes('outstanding') || hl.includes('sisa')) return totalSisa;
      
      // For Item (Singular), maybe they want a list of names?
      if (hl === 'item') {
         try {
            const itemArr = typeof payload.items === 'string' ? JSON.parse(payload.items) : (payload.items || []);
            return itemArr.map(it => it.nama).join(', ');
         } catch(e) {}
      }

      if (hl.includes('penerima')) return payload.penerima || '';
      if (hl.includes('dibuat oleh') || hl.includes('pembuat') || hl.includes('tim gudang')) return payload.dibuat_oleh || '';

      if (hl === 'items') return itemsStr;
      return '';
    });
    sheet.appendRow(newRow);
    
    try {
      const newItems = typeof payload.items === 'string' ? JSON.parse(payload.items) : payload.items;
      adjustSJStockAndPO(newItems, false, payload.no_penawaran, noSJ, payload.dibuat_oleh);
    } catch(e) {}
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
      const hMap = {};
      values[0].forEach((h, idx) => hMap[h.toLowerCase().trim()] = idx);
      const oldItemsStr = values[i][hMap['items']];
      const oldPoNo = values[i][hMap['no penawaran']] || values[i][hMap['po customer']];
      try {
        const oldItems = JSON.parse(oldItemsStr);
        adjustSJStockAndPO(oldItems, true, oldPoNo, payload.no_sj, payload.user);
      } catch (e) {}
      
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
  }).reverse();
  return { status: 'success', data: data };
}

function saveInvoice(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Invoice');
  if (!sheet) {
    sheet = ss.insertSheet('DB Invoice');
    sheet.appendRow(['No Invoice', 'Tanggal', 'Jatuh Tempo', 'No Penawaran', 'Customer', 'Total Tagihan', 'Potongan DP', 'Grand Total', 'Terbayar', 'Sisa Tagihan', 'Status Pembayaran', 'PPN', 'Items', 'Catatan', 'Dibuat Oleh', 'Diselesaikan Oleh', 'Waktu Selesai']);
    sheet.getRange(1, 1, 1, 17).setFontWeight('bold');
  }
  
  let values = sheet.getDataRange().getDisplayValues();
  let headers = values[0];
  let hMap = {};
  headers.forEach((h, idx) => hMap[h.toLowerCase().trim()] = idx);

  const expectedHeaders = ['No Invoice', 'Tanggal', 'Jatuh Tempo', 'No Penawaran', 'Customer', 'Total Tagihan', 'Potongan DP', 'Grand Total', 'Terbayar', 'Sisa Tagihan', 'Status Pembayaran', 'PPN', 'Items', 'Catatan', 'Dibuat Oleh', 'Diselesaikan Oleh', 'Waktu Selesai'];
  expectedHeaders.forEach(eh => {
    if (hMap[eh.toLowerCase().trim()] === undefined) {
      headers.push(eh);
      sheet.getRange(1, headers.length).setValue(eh);
      sheet.getRange(1, headers.length).setFontWeight('bold');
      hMap[eh.toLowerCase().trim()] = headers.length - 1;
    }
  });
  
  // Refresh values in case headers were added
  values = sheet.getDataRange().getDisplayValues();
  
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
        if (hMap['potongan dp'] !== undefined) sheet.getRange(i + 1, hMap['potongan dp'] + 1).setValue(payload.potongan_dp !== undefined ? payload.potongan_dp : (values[i][hMap['potongan dp']] || 0));
        if (hMap['grand total'] !== undefined) sheet.getRange(i + 1, hMap['grand total'] + 1).setValue(payload.grand_total !== undefined ? payload.grand_total : (values[i][hMap['grand total']] || 0));
        if (hMap['terbayar'] !== undefined) sheet.getRange(i + 1, hMap['terbayar'] + 1).setValue(payload.terbayar !== undefined ? payload.terbayar : (values[i][hMap['terbayar']] || 0));
        if (hMap['sisa tagihan'] !== undefined) sheet.getRange(i + 1, hMap['sisa tagihan'] + 1).setValue(payload.sisa_tagihan !== undefined ? payload.sisa_tagihan : (values[i][hMap['sisa tagihan']] || 0));
        if (hMap['status pembayaran'] !== undefined) sheet.getRange(i + 1, hMap['status pembayaran'] + 1).setValue(payload.status_pembayaran || values[i][hMap['status pembayaran']]);
        if (hMap['items'] !== undefined) sheet.getRange(i + 1, hMap['items'] + 1).setValue(itemsStr);
        if (hMap['catatan'] !== undefined) sheet.getRange(i + 1, hMap['catatan'] + 1).setValue(payload.catatan || values[i][hMap['catatan']]);
        if (hMap['ppn'] !== undefined) sheet.getRange(i + 1, hMap['ppn'] + 1).setValue(payload.ppn !== undefined ? payload.ppn : (values[i][hMap['ppn']] || 0));
        
        if (payload.status_pembayaran === 'Lunas') {
            if (hMap['diselesaikan oleh'] !== undefined) {
                const prevPenyelesai = values[i][hMap['diselesaikan oleh']];
                sheet.getRange(i + 1, hMap['diselesaikan oleh'] + 1).setValue(payload.penyelesai || prevPenyelesai || 'Sistem');
            }
            if (hMap['waktu selesai'] !== undefined) {
                const prevWaktu = values[i][hMap['waktu selesai']];
                sheet.getRange(i + 1, hMap['waktu selesai'] + 1).setValue(prevWaktu || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss'));
            }
        }
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    const newRow = headers.map(h => {
      const hl = h.toLowerCase().trim();
      if (/no.*invoice/i.test(h)) return noInv;
      if (hl === 'tanggal') return payload.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
      if (hl === 'jatuh tempo') return payload.jatuh_tempo || '';
      if (hl === 'no penawaran' || hl.includes('referensi po') || hl.includes('po customer')) return payload.no_penawaran || '';
      if (hl === 'no sj' || hl === 'referensi surat jalan' || hl.includes('surat jalan')) return payload.no_sj || '';
      if (hl === 'customer') return payload.customer || '';
      if (hl.includes('total tagihan')) return payload.total_tagihan !== undefined ? payload.total_tagihan : 0;
      if (hl.includes('potongan dp') || hl.includes('diskon')) return payload.potongan_dp !== undefined ? payload.potongan_dp : 0;
      if (hl.includes('grand total') || hl.includes('total akhir')) return payload.grand_total !== undefined ? payload.grand_total : (payload.total_tagihan || 0);
      if (hl.includes('terbayar')) return payload.terbayar !== undefined ? payload.terbayar : 0;
      if (hl.includes('sisa tagihan')) return payload.sisa_tagihan !== undefined ? payload.sisa_tagihan : (payload.grand_total || payload.total_tagihan || 0);
      if (hl === 'status pembayaran') return payload.status_pembayaran || 'Belum Lunas';
      if (hl === 'items') return itemsStr;
      if (hl === 'catatan') return payload.catatan || '';
      if (hl === 'ppn') return payload.ppn || 0;
      if (hl === 'dibuat oleh') return payload.pembuat || 'Sistem';
      if (hl === 'diselesaikan oleh') return payload.status_pembayaran === 'Lunas' ? (payload.penyelesai || 'Sistem') : '';
      if (hl === 'waktu selesai') return payload.status_pembayaran === 'Lunas' ? Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss') : '';
      return '';
    });
    sheet.appendRow(newRow);
  }
  if (payload.no_penawaran) {
    let totalLunas = 0;
    let totalPotonganDp = 0;
    let totalDpInvoice = 0;
    
    SpreadsheetApp.flush(); // Ensure writes are flushed to the sheet before reading back
    
    const updatedInvValues = sheet.getDataRange().getDisplayValues();
    const updatedInvHeaders = updatedInvValues[0];
    let invNoPenawaranIdx = -1;
    let invStatusIdx = -1;
    let invTerbayarIdx = -1;
    let invGrandTotalIdx = -1;
    let invPotonganDpIdx = -1;
    let invItemsIdx = -1;

    updatedInvHeaders.forEach((h, idx) => {
      const hl = h.toLowerCase().trim();
      if (hl === 'no penawaran' || hl.includes('referensi po') || hl.includes('po customer')) invNoPenawaranIdx = idx;
      if (hl === 'status pembayaran') invStatusIdx = idx;
      if (hl === 'terbayar') invTerbayarIdx = idx;
      if (hl === 'grand total' || hl === 'total tagihan') invGrandTotalIdx = idx;
      if (hl === 'potongan dp' || hl === 'dp') invPotonganDpIdx = idx;
      if (hl === 'items') invItemsIdx = idx;
    });

    if (invNoPenawaranIdx !== -1) {
      for (let i = 1; i < updatedInvValues.length; i++) {
        if (String(updatedInvValues[i][invNoPenawaranIdx]).trim() === String(payload.no_penawaran).trim()) {
           let tempDp = 0;
           if (invPotonganDpIdx !== -1) {
               tempDp = parseFloat(String(updatedInvValues[i][invPotonganDpIdx]).replace(/[^0-9.-]+/g, "")) || 0;
               totalPotonganDp += tempDp;
           }
           if (tempDp === 0 && invItemsIdx !== -1 && invGrandTotalIdx !== -1) {
               const itemsStr = String(updatedInvValues[i][invItemsIdx]).toLowerCase();
               if (itemsStr.includes('down payment (dp)') || itemsStr.includes('tagihan down payment')) {
                   totalDpInvoice += parseFloat(String(updatedInvValues[i][invGrandTotalIdx]).replace(/[^0-9.-]+/g, "")) || 0;
               }
           }
           if (invStatusIdx !== -1 && String(updatedInvValues[i][invStatusIdx]).trim() === 'Lunas') {
               let val = 0;
               if (invTerbayarIdx !== -1) val = parseFloat(String(updatedInvValues[i][invTerbayarIdx]).replace(/[^0-9.-]+/g, "")) || 0;
               if (val === 0 && invGrandTotalIdx !== -1) val = parseFloat(String(updatedInvValues[i][invGrandTotalIdx]).replace(/[^0-9.-]+/g, "")) || 0;
               totalLunas += val;
           }
        }
      }
    }
    
    let totalDp = Math.max(totalPotonganDp, totalDpInvoice);

    const poSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB PO Customer');
    if (poSheet) {
      const poValues = poSheet.getDataRange().getDisplayValues();
      const poHeaders = poValues[0];
      let poIdIdx = -1;
      let poNoPenawaranIdx = -1;
      let poTotalIdx = -1;
      let poDpIdx = -1;
      
      poHeaders.forEach((h, idx) => {
         const hl = h.toLowerCase().trim();
         if (hl === 'id po' || hl === 'no po' || hl === 'id po customer' || hl.includes('id po')) poIdIdx = idx;
         if (hl === 'no penawaran') poNoPenawaranIdx = idx;
         if (hl === 'total harga' || hl === 'total' || hl === 'grand total') poTotalIdx = idx;
         if (hl.includes('dp po customer') || hl === 'dp') poDpIdx = idx;
      });
      
      if (poIdIdx !== -1) {
         let poTotal = 0;
         let poRowIdx = -1;
         for (let i = 1; i < poValues.length; i++) {
            if (String(poValues[i][poIdIdx]).trim() === String(payload.no_penawaran).trim() || 
                (poNoPenawaranIdx !== -1 && String(poValues[i][poNoPenawaranIdx]).trim() === String(payload.no_penawaran).trim())) {
                poRowIdx = i + 1;
                if (poTotalIdx !== -1) poTotal = parseFloat(String(poValues[i][poTotalIdx]).replace(/[^0-9.-]+/g, "")) || 0;
                break;
            }
         }
         
         if (poRowIdx !== -1) {
            if (poDpIdx !== -1) {
               poSheet.getRange(poRowIdx, poDpIdx + 1).setValue(totalDp);
            }
            if (poTotal > 0 && poTotalIdx !== -1) {
               if (totalLunas >= poTotal) updatePOCustomerStatusByPOId(payload.no_penawaran, 'Selesai');
               else updatePOCustomerStatusByPOId(payload.no_penawaran, 'Proses');
            }
         }
      }
    }
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
      
      if (payload.nama_barang !== undefined && hMap['nama barang'] !== undefined) sheet.getRange(i + 1, hMap['nama barang'] + 1).setValue(payload.nama_barang);
      if (payload.stok !== undefined && hMap['stok'] !== undefined) sheet.getRange(i + 1, hMap['stok'] + 1).setValue(payload.stok);
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

// ==========================================
// SYNC BOM PRICES
// ==========================================
function syncBOMPrices(materialName, newHargaSatuan) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB BOM');
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;
  
  const headers = values[0];
  const materialIdx = headers.findIndex(h => String(h).trim().toLowerCase() === 'rincian material');
  const totalBiayaIdx = headers.findIndex(h => String(h).trim().toLowerCase() === 'total biaya material');
  
  if (materialIdx === -1 || totalBiayaIdx === -1) return;
  
  for (let i = 1; i < values.length; i++) {
    let rincianRaw = String(values[i][materialIdx]);
    if (!rincianRaw || rincianRaw.trim() === '') continue;
    
    try {
      let rincian = JSON.parse(rincianRaw);
      let isChanged = false;
      let newTotalBiaya = 0;
      
      for (let j = 0; j < rincian.length; j++) {
        let m = rincian[j];
        if (String(m.nama).trim().toLowerCase() === String(materialName).trim().toLowerCase()) {
          const qty = parseInt(String(m.qty).replace(/\\D/g, '')) || 0;
          m.harga = qty * newHargaSatuan;
          isChanged = true;
        }
        newTotalBiaya += parseInt(String(m.harga).replace(/\\D/g, '')) || 0;
      }
      
      if (isChanged) {
        sheet.getRange(i + 1, materialIdx + 1).setValue(JSON.stringify(rincian));
        sheet.getRange(i + 1, totalBiayaIdx + 1).setValue(newTotalBiaya);
      }
    } catch (e) {
      // Ignore parse errors for a row
    }
  }
}

// ==========================================
// HAK AKSES (RBAC) CONTROLLERS
// ==========================================

function getRolePermissions(payload) {
  const role = String(payload.role || '').toLowerCase().trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Hak Akses');
  
  if (!sheet) {
    return { status: 'success', data: {} };
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: {} };
  
  const headers = values[0];
  const rIdx = headers.findIndex(h => h.toLowerCase() === 'role');
  const mIdx = headers.findIndex(h => h.toLowerCase() === 'menu_id');
  const viewIdx = headers.findIndex(h => h.toLowerCase() === 'can_view');
  const addIdx = headers.findIndex(h => h.toLowerCase() === 'can_add');
  const editIdx = headers.findIndex(h => h.toLowerCase() === 'can_edit');
  const delIdx = headers.findIndex(h => h.toLowerCase() === 'can_delete');
  
  const permissions = {};
  for (let i = 1; i < values.length; i++) {
    const rowRole = String(values[i][rIdx]).toLowerCase().trim();
    if (rowRole === role) {
      const menu = String(values[i][mIdx]).toLowerCase().trim();
      permissions[menu] = {
        can_view: String(values[i][viewIdx]).toUpperCase() === 'TRUE',
        can_add: String(values[i][addIdx]).toUpperCase() === 'TRUE',
        can_edit: String(values[i][editIdx]).toUpperCase() === 'TRUE',
        can_delete: String(values[i][delIdx]).toUpperCase() === 'TRUE'
      };
    }
  }
  
  return { status: 'success', data: permissions };
}

function getAllPermissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Hak Akses');
  
  if (!sheet) {
    sheet = ss.insertSheet('DB Hak Akses');
    sheet.appendRow(['Role', 'Menu_ID', 'Can_View', 'Can_Add', 'Can_Edit', 'Can_Delete']);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#d9edf7");
    return { status: 'success', data: [] };
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const rIdx = headers.findIndex(h => h.toLowerCase() === 'role');
  const mIdx = headers.findIndex(h => h.toLowerCase() === 'menu_id');
  const viewIdx = headers.findIndex(h => h.toLowerCase() === 'can_view');
  const addIdx = headers.findIndex(h => h.toLowerCase() === 'can_add');
  const editIdx = headers.findIndex(h => h.toLowerCase() === 'can_edit');
  const delIdx = headers.findIndex(h => h.toLowerCase() === 'can_delete');
  
  const data = [];
  for (let i = 1; i < values.length; i++) {
    data.push({
      role: values[i][rIdx],
      menu_id: values[i][mIdx],
      can_view: String(values[i][viewIdx]).toUpperCase() === 'TRUE',
      can_add: String(values[i][addIdx]).toUpperCase() === 'TRUE',
      can_edit: String(values[i][editIdx]).toUpperCase() === 'TRUE',
      can_delete: String(values[i][delIdx]).toUpperCase() === 'TRUE'
    });
  }
  
  return { status: 'success', data: data };
}

function savePermissions(payload) {
  if (!payload || !payload.permissions) return { status: 'error', message: 'Payload tidak valid.' };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Hak Akses');
  if (!sheet) {
    sheet = ss.insertSheet('DB Hak Akses');
    sheet.appendRow(['Role', 'Menu_ID', 'Can_View', 'Can_Add', 'Can_Edit', 'Can_Delete']);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#d9edf7");
  }
  
  // Untuk menyederhanakan, kita clear seluruh isi dan tulis ulang
  // Karena data izin biasanya tidak jutaan baris, cara ini aman dan bersih
  sheet.clearContents();
  const headers = ['Role', 'Menu_ID', 'Can_View', 'Can_Add', 'Can_Edit', 'Can_Delete'];
  sheet.appendRow(headers);
  
  const rows = [];
  payload.permissions.forEach(p => {
    rows.push([
      p.role,
      p.menu_id,
      p.can_view ? 'TRUE' : 'FALSE',
      p.can_add ? 'TRUE' : 'FALSE',
      p.can_edit ? 'TRUE' : 'FALSE',
      p.can_delete ? 'TRUE' : 'FALSE'
    ]);
  });
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  
  return { status: 'success', message: 'Hak akses berhasil disimpan.' };
}

// =====================================
// PENERIMAAN BARANG (GRN)
// =====================================

function getPenerimaanBarang() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB Penerimaan Barang');
  
  if (!sheet) {
    sheet = ss.insertSheet('DB Penerimaan Barang');
    sheet.appendRow(['ID Penerimaan', 'Tanggal', 'No PO', 'Daftar Item (JSON)', 'Penerima', 'Catatan', 'Nomor SJ', 'Gambar']);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#d9edf7");
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[String(h).toLowerCase().replace(/ /g, '_').replace(/_\(json\)/g, '')] = row[i]; });
    try {
      obj.daftar_item_parsed = JSON.parse(obj.daftar_item);
    } catch(e) {
      obj.daftar_item_parsed = [];
    }
    return obj;
  });
  return { status: 'success', data: data };
}

function savePenerimaanBarang(payload) {
  if (!payload || !payload.no_po || !payload.items || !payload.penerima) {
    return { status: 'error', message: 'Data tidak lengkap.' };
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetGRN = ss.getSheetByName('DB Penerimaan Barang');
  if (!sheetGRN) {
    sheetGRN = ss.insertSheet('DB Penerimaan Barang');
    sheetGRN.appendRow(['ID Penerimaan', 'Tanggal', 'No PO', 'Daftar Item (JSON)', 'Penerima', 'Catatan', 'Nomor SJ', 'Gambar']);
    sheetGRN.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#d9edf7");
  }
  
  let sheetPO = ss.getSheetByName('DB PO Internal');
  let poData = sheetPO.getDataRange().getValues();
  let poRowIndex = -1;
  let poRow = null;
  
  for (let i = 1; i < poData.length; i++) {
    if (String(poData[i][0]) === String(payload.no_po)) {
      poRowIndex = i + 1;
      poRow = poData[i];
      break;
    }
  }
  
  if (poRowIndex === -1) {
    return { status: 'error', message: 'No PO tidak ditemukan.' };
  }
  
  // Parse PO Items
  let poItems = [];
  try { poItems = JSON.parse(poRow[3]); } catch(e) {}
  
  // Ambil riwayat penerimaan sebelumnya untuk validasi status
  const grnData = getPenerimaanBarang().data;
  const historyGRN = grnData.filter(g => String(g.no_po) === String(payload.no_po));
  
  let mapPO = {};
  poItems.forEach(item => {
    const key = item.kode || item.nama;
    mapPO[key] = { 
        qty_diminta: Number(item.qty), 
        qty_diterima: 0,
        harga_satuan: Number(item.harga_aktual || item.harga || 0)
    };
  });
  
  // Tambahkan yg sudah diterima sebelumnya
  historyGRN.forEach(g => {
    g.daftar_item_parsed.forEach(item => {
      const key = item.kode || item.nama;
      if (mapPO[key]) mapPO[key].qty_diterima += Number(item.qty_diterima || item.qty_terima || 0);
    });
  });
  
  // Validasi payload
  let totalDiterimaSekarang = 0;
  for (let item of payload.items) {
    const key = item.kode || item.nama;
    const qtyDiterima = Number(item.qty_diterima);
    if (qtyDiterima > 0) {
      if (!mapPO[key]) {
        return { status: 'error', message: 'Item ' + key + ' tidak ada di PO ini.' };
      }
      if (mapPO[key].qty_diterima + qtyDiterima > mapPO[key].qty_diminta) {
        return { status: 'error', message: 'Qty diterima melebihi pesanan untuk item ' + key };
      }
      mapPO[key].qty_diterima += qtyDiterima;
      totalDiterimaSekarang += qtyDiterima;
    }
  }
  
  if (totalDiterimaSekarang === 0) {
    return { status: 'error', message: 'Tidak ada Qty barang yang diterima.' };
  }
  
  // Simpan GRN
  const timestamp = new Date();
  const idGRN = 'GRN-' + timestamp.getTime();
  sheetGRN.appendRow([
    idGRN,
    Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
    payload.no_po,
    JSON.stringify(payload.items),
    payload.penerima,
    payload.catatan || '',
    payload.no_sj || '',
    payload.gambar || ''
  ]);
  
  // Cek Status PO
  let isComplete = true;
  for (let key in mapPO) {
    if (mapPO[key].qty_diterima < mapPO[key].qty_diminta) {
      isComplete = false;
      break;
    }
  }
  
  const newStatus = isComplete ? 'Selesai' : 'Parsial';
  sheetPO.getRange(poRowIndex, 6).setValue(newStatus); // Update kolom status PO
  
  // Update Stok & Catat Transaksi
  let sheetBahan = ss.getSheetByName('DB Master Bahan Baku');
  let bahanData = sheetBahan.getDataRange().getValues();
  let sheetTrx = ss.getSheetByName('DB Transaksi Gudang');
  
  if (!sheetTrx) {
    sheetTrx = ss.insertSheet('DB Transaksi Gudang');
    sheetTrx.appendRow(['ID Transaksi', 'Tanggal', 'Jenis (IN/OUT)', 'Referensi', 'Kode Material', 'Qty', 'PIC', 'Keterangan', 'Peminta', 'Pemberi']);
    sheetTrx.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#d9edf7");
  }
  
  for (let item of payload.items) {
    if (Number(item.qty_diterima) > 0) {
      // Catat di Transaksi Gudang
      sheetTrx.appendRow([
        'TRX-' + new Date().getTime() + Math.floor(Math.random()*100),
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
        'IN',
        payload.no_po,
        item.kode || item.nama || '-',
        Number(item.qty_diterima),
        payload.penerima,
        'Penerimaan Barang (' + idGRN + ')',
        payload.penerima,
        ''
      ]);
      
      // Update Stok dan Harga (cari di Bahan Baku)
      const poKey = item.kode || item.nama;
      const hargaPO = mapPO[poKey] ? mapPO[poKey].harga_satuan : 0;

      for (let j = 1; j < bahanData.length; j++) {
        const dbKode = String(bahanData[j][0] || '').trim().toLowerCase();
        const dbNama = String(bahanData[j][1] || '').trim().toLowerCase();
        const itemKode = String(item.kode || '').trim().toLowerCase();
        const itemNama = String(item.nama || '').trim().toLowerCase();

        if ((itemKode !== '' && dbKode === itemKode) || (itemNama !== '' && dbNama === itemNama) || (dbKode === itemNama) || (dbNama === itemKode)) {
          let currentStok = Number(bahanData[j][3]) || 0;
          
          // Update Stok (Kolom 4)
          sheetBahan.getRange(j + 1, 4).setValue(currentStok + Number(item.qty_diterima));
          
          // Update Harga (Kolom 6) jika harga dari PO valid
          if (hargaPO > 0) {
              sheetBahan.getRange(j + 1, 6).setValue(hargaPO);
          }
          break;
        }
      }
    }
  }
  
  return { status: 'success', message: 'Penerimaan barang berhasil dicatat.' };
}

// ==========================================
// TRANSAKSI GUDANG MANUAL
// ==========================================
function getTransaksiGudang() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Transaksi Gudang');
  if (!sheet) return { status: 'success', data: [] };
  
  // Format warna otomatis (Conditional Formatting) untuk membedakan IN dan OUT di Google Sheets
  try {
    const rules = sheet.getConditionalFormatRules();
    if (rules.length === 0) {
      const range = sheet.getRange("C2:C");
      const ruleIn = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("IN")
        .setBackground("#d4edda")
        .setFontColor("#155724")
        .setRanges([range])
        .build();
      const ruleOut = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("OUT")
        .setBackground("#f8d7da")
        .setFontColor("#721c24")
        .setRanges([range])
        .build();
      sheet.setConditionalFormatRules([ruleIn, ruleOut]);
    }
  } catch(e) {}

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[String(h).toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '')] = row[i]);
    return obj;
  });
  return { status: 'success', data: data };
}

function saveTransaksiGudang(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trxSheet = ss.getSheetByName('DB Transaksi Gudang');
  if (!trxSheet) return { status: 'error', message: 'Sheet DB Transaksi Gudang tidak ditemukan.' };
  
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  if (!stockSheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };

  const idTrx = payload.id_transaksi || ('TRX-' + Date.now() + '-' + Math.floor(Math.random() * 100));
  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  const jenis = payload.jenis;
  const kode = payload.kode_material;
  const qty = parseFloat(payload.qty) || 0;
  const pic = payload.pic || 'Admin';
  
  const trxValues = trxSheet.getDataRange().getDisplayValues();
  const stockValues = stockSheet.getDataRange().getDisplayValues();
  const stokHeaders = stockValues[0];
  const stokKodeIdx = stokHeaders.findIndex(h => /kode/i.test(h));
  const stokValueIdx = stokHeaders.findIndex(h => /stok|stock/i.test(h));
  
  let oldJenis = '';
  let oldQty = 0;
  let oldKode = '';
  let rowIndexToUpdate = -1;
  
  if (payload.id_transaksi) {
    for (let i = 1; i < trxValues.length; i++) {
      if (String(trxValues[i][0]).trim() === String(payload.id_transaksi).trim()) {
        rowIndexToUpdate = i + 1;
        oldJenis = String(trxValues[i][2]).trim();
        oldKode = String(trxValues[i][4]).trim();
        oldQty = parseFloat(trxValues[i][5]) || 0;
        break;
      }
    }
  }

  // Stock Modification Logic
  if (stokKodeIdx !== -1 && stokValueIdx !== -1) {
    // REVERT OLD STOCK IF EDITING
    if (payload.id_transaksi && rowIndexToUpdate !== -1) {
       for (let i = 1; i < stockValues.length; i++) {
          if (String(stockValues[i][stokKodeIdx]).trim() === oldKode) {
             let curStok = parseFloat(String(stockSheet.getRange(i + 1, stokValueIdx + 1).getValue()).replace(/[^0-9.-]/g, '')) || 0;
             // Revert
             if (oldJenis === 'IN') curStok -= oldQty;
             if (oldJenis === 'OUT') curStok += oldQty;
             stockSheet.getRange(i + 1, stokValueIdx + 1).setValue(curStok);
             // Update local array cache for the subsequent deduction
             stockValues[i][stokValueIdx] = curStok; 
             break;
          }
       }
    }
    
    // APPLY NEW STOCK
    let stockUpdated = false;
    for (let i = 1; i < stockValues.length; i++) {
      if (String(stockValues[i][stokKodeIdx]).trim() === String(kode).trim()) {
        let currentStok = parseFloat(String(stockSheet.getRange(i + 1, stokValueIdx + 1).getValue()).replace(/[^0-9.-]/g, '')) || 0;
        let newStok = currentStok;
        if (jenis === 'IN') {
          newStok = currentStok + qty;
        } else if (jenis === 'OUT') {
          newStok = currentStok - qty;
          if (newStok < 0) {
            // IF EDITING, WE MUST REVERT THE REVERSION (Cancel the entire operation)
            if (payload.id_transaksi && rowIndexToUpdate !== -1) {
               // Rollback reversion
               let rbCurStok = parseFloat(String(stockSheet.getRange(i + 1, stokValueIdx + 1).getValue()).replace(/[^0-9.-]/g, '')) || 0;
               if (oldJenis === 'IN') rbCurStok += oldQty;
               if (oldJenis === 'OUT') rbCurStok -= oldQty;
               stockSheet.getRange(i + 1, stokValueIdx + 1).setValue(rbCurStok);
            }
            return { status: 'error', message: 'Stok tidak mencukupi untuk perubahan ini!' };
          }
        }
        stockSheet.getRange(i + 1, stokValueIdx + 1).setValue(newStok);
        stockUpdated = true;
        break;
      }
    }
    
    if (!stockUpdated && jenis === 'OUT') {
       return { status: 'error', message: 'Bahan baku tidak ditemukan di master.' };
    }
  }

  const rowData = [
    idTrx,
    tanggal, // Keep original date if editing? Currently updates to now, which is fine for ledger modification trace
    jenis,
    payload.referensi || '',
    kode,
    qty,
    pic,
    payload.keterangan || '',
    payload.peminta || '',
    payload.pemberi || ''
  ];

  if (rowIndexToUpdate !== -1) {
     trxSheet.getRange(rowIndexToUpdate, 1, 1, 10).setValues([rowData]);
     return { status: 'success', message: 'Transaksi berhasil diupdate.' };
  } else {
     trxSheet.appendRow(rowData);
     return { status: 'success', message: 'Transaksi berhasil disimpan.' };
  }
}

function deleteTransaksiGudang(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trxSheet = ss.getSheetByName('DB Transaksi Gudang');
  if (!trxSheet) return { status: 'error', message: 'Sheet DB Transaksi Gudang tidak ditemukan.' };
  
  const stockSheet = ss.getSheetByName('DB Master Bahan Baku');
  if (!stockSheet) return { status: 'error', message: 'Sheet DB Master Bahan Baku tidak ditemukan.' };

  if (!payload.id) return { status: 'error', message: 'ID Transaksi tidak diberikan.' };

  const trxValues = trxSheet.getDataRange().getDisplayValues();
  let rowIndexToDelete = -1;
  let oldJenis = '';
  let oldKode = '';
  let oldQty = 0;

  for (let i = 1; i < trxValues.length; i++) {
    if (String(trxValues[i][0]).trim() === String(payload.id).trim()) {
      rowIndexToDelete = i + 1;
      oldJenis = String(trxValues[i][2]).trim();
      oldKode = String(trxValues[i][4]).trim();
      oldQty = parseFloat(trxValues[i][5]) || 0;
      break;
    }
  }

  if (rowIndexToDelete === -1) {
    return { status: 'error', message: 'Transaksi tidak ditemukan.' };
  }

  // Revert Stock
  const stockValues = stockSheet.getDataRange().getDisplayValues();
  const stokHeaders = stockValues[0];
  const stokKodeIdx = stokHeaders.findIndex(h => /kode/i.test(h));
  const stokValueIdx = stokHeaders.findIndex(h => /stok|stock/i.test(h));

  if (stokKodeIdx !== -1 && stokValueIdx !== -1) {
    for (let i = 1; i < stockValues.length; i++) {
      if (String(stockValues[i][stokKodeIdx]).trim() === oldKode) {
        let curStok = parseFloat(String(stockSheet.getRange(i + 1, stokValueIdx + 1).getValue()).replace(/[^0-9.-]/g, '')) || 0;
        if (oldJenis === 'IN') curStok -= oldQty;
        if (oldJenis === 'OUT') curStok += oldQty;
        stockSheet.getRange(i + 1, stokValueIdx + 1).setValue(curStok);
        break;
      }
    }
  }

  trxSheet.deleteRow(rowIndexToDelete);
  return { status: 'success', message: 'Transaksi berhasil dihapus dan stok disesuaikan kembali.' };
}

function approveTransaksi(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trxSheet = ss.getSheetByName('DB Transaksi Gudang');
  if (!trxSheet) return { status: 'error', message: 'Sheet DB Transaksi Gudang tidak ditemukan.' };

  if (!payload.id_transaksi) return { status: 'error', message: 'ID Transaksi tidak diberikan.' };
  if (!payload.pemberi) return { status: 'error', message: 'Nama Pemberi tidak valid.' };

  const trxValues = trxSheet.getDataRange().getDisplayValues();
  let rowIndexToUpdate = -1;

  for (let i = 1; i < trxValues.length; i++) {
    if (String(trxValues[i][0]).trim() === String(payload.id_transaksi).trim()) {
      rowIndexToUpdate = i + 1;
      break;
    }
  }

  if (rowIndexToUpdate === -1) {
    return { status: 'error', message: 'Transaksi tidak ditemukan.' };
  }

  // Update kolom Pemberi (Kolom ke-10, index 9)
  trxSheet.getRange(rowIndexToUpdate, 10).setValue(payload.pemberi);

  return { status: 'success', message: 'Transaksi berhasil disetujui.' };
}

function getPettyCash() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Petty Cash');
  if (!sheet) return { status: 'error', message: 'Sheet DB Petty Cash tidak ditemukan.' };
  
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  const headers = values[0];
  const tglIdx = headers.findIndex(h => /tanggal|waktu/i.test(h));
  const ketIdx = headers.findIndex(h => /keterangan/i.test(h));
  const jmlIdx = headers.findIndex(h => /nominal|jumlah/i.test(h));
  const jenisIdx = headers.findIndex(h => /jenis/i.test(h));
  const coaIdx = headers.findIndex(h => /saldo|coa|akun/i.test(h));
  const userIdx = headers.findIndex(h => /user|pic/i.test(h));
  const finalUserIdx = userIdx !== -1 ? userIdx : 5; // Fallback ke kolom ke-6 (F) jika header kosong
  
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row.some(String)) continue;
    
    result.push({
      id: i + 1,
      waktu: tglIdx !== -1 ? row[tglIdx] : (row[0] || ''),
      keterangan: ketIdx !== -1 ? row[ketIdx] : (row[1] || ''),
      jumlah: jmlIdx !== -1 ? row[jmlIdx] : (row[2] || 0),
      jenis: jenisIdx !== -1 ? row[jenisIdx] : (row[3] || ''),
      coa: coaIdx !== -1 ? row[coaIdx] : (row[4] || ''),
      user: row[finalUserIdx] || ''
    });
  }
  
  return { status: 'success', data: result };
}

function updatePettyCash(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Petty Cash');
  if (!sheet) return { status: 'error', message: 'Sheet DB Petty Cash tidak ditemukan.' };
  
  if (!payload.id || payload.id <= 1) return { status: 'error', message: 'ID (Row Index) tidak valid.' };
  
  sheet.getRange(payload.id, 2).setValue(payload.jenis || 'Keluar');
  sheet.getRange(payload.id, 3).setValue(payload.keterangan || '');
  sheet.getRange(payload.id, 4).setValue(payload.jumlah || 0);
  sheet.getRange(payload.id, 5).setValue(payload.coa || '');
  
  return { status: 'success', message: 'Petty cash berhasil diperbarui.' };
}

function deletePettyCash(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DB Petty Cash');
  if (!sheet) return { status: 'error', message: 'Sheet DB Petty Cash tidak ditemukan.' };
  
  if (!payload.id || payload.id <= 1) return { status: 'error', message: 'ID (Row Index) tidak valid.' };
  
  sheet.deleteRow(payload.id);
  
  return { status: 'success', message: 'Petty cash berhasil dihapus.' };
}
