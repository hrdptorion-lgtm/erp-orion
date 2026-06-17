function createJsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // Info endpoint for health check / quick API verification
  return createJsonResponse({ status: 'success', message: 'API ERP Orion is running' });
}

function doPost(e) {
  // Handle POST requests from the frontend
  let response = { status: 'error', message: 'Invalid request' };

  try {
    let rawData;
    if (e && e.parameter && e.parameter.payload) {
      rawData = e.parameter.payload;
    } else if (e && e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else {
      throw new Error('Request body kosong atau tidak tersedia.');
    }

    let data;
    try {
      data = JSON.parse(rawData);
    } catch (parseError) {
      throw new Error('Payload JSON tidak valid: ' + parseError.message + ', raw: ' + String(rawData).substring(0, 50));
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Payload harus berupa objek JSON.');
    }

    const action = String(data.action || '').trim();
    const payload = data.payload || {};

    if (!action) {
      throw new Error('Field action dibutuhkan.');
    }

    switch (action) {
      case 'create_po':
        response = createPO(payload);
        break;
      case 'get_stock':
        response = getStock();
        break;
      case 'save_stock':
        response = saveStock(payload);
        break;
      case 'delete_stock':
        response = deleteStock(payload);
        break;
      case 'get_users':
        response = getUsers();
        break;
      case 'save_user':
        response = saveUser(payload);
        break;
      case 'delete_user':
        response = deleteUser(payload);
        break;
      case 'receive_grn':
        response = receiveGRN(payload);
        break;
      case 'get_penawaran':
        response = getPenawaran();
        break;
      case 'save_penawaran':
        response = savePenawaran(payload);
        break;
      case 'delete_penawaran':
        response = deletePenawaran(payload);
        break;
      case 'get_customers':
        response = getCustomers();
        break;
      case 'save_customer':
        response = saveCustomer(payload);
        break;
      case 'delete_customer':
        response = deleteCustomer(payload);
        break;
      case 'get_produksi':
        response = getProduksi();
        break;
      case 'get_inventory':
        response = getInventory();
        break;
      case 'get_bom':
        response = getBOM();
        break;
      case 'save_bom':
        response = saveBOM(payload);
        break;
      case 'save_spk':
        response = saveSPK(payload);
        break;
      case 'get_spk_progress':
        response = getSPKProgress(payload);
        break;
      case 'ambil_bahan_spk':
        response = ambilBahanSPK(payload);
        break;
      case 'selesaikan_spk':
        response = selesaikanSPK(payload);
        break;
      case 'save_invoice':
        response = saveInvoice(payload);
        break;
      case 'add_petty_cash':
        response = addPettyCash(payload);
        break;
      case 'login':
        response = handleLogin(payload);
        break;
      case 'get_settings':
        response = getSettings();
        break;
      case 'save_settings':
        response = saveSettings(payload);
        break;
      case 'get_barang_jadi':
        response = getBarangJadi();
        break;
      case 'get_po_internal':
        response = getPOInternal();
        break;
      case 'create_po_internal':
        response = createPOInternal(payload);
        break;
      case 'update_po_status':
        response = updatePOInternalStatus(payload);
        break;
      case 'delete_po_internal':
        response = deletePOInternal(payload);
        break;
      case 'import_stock':
        response = importStock(payload);
        break;
      case 'delete_barang_jadi':
        response = deleteBarangJadi(payload);
        break;
      case 'delete_bom':
        response = deleteBOM(payload);
        break;
      case 'delete_spk':
        response = deleteSPK(payload);
        break;
      case 'get_suppliers':
        response = getSuppliers();
        break;
      case 'save_supplier':
        response = saveSupplier(payload);
        break;
      case 'delete_supplier':
        response = deleteSupplier(payload);
        break;
      default:
        response = { status: 'error', message: 'Action tidak dikenali: ' + action };
        break;
    }
  } catch (error) {
    Logger.log('[doPost] ERROR: ' + (error.stack || error.toString()));
    response = { status: 'error', message: error.message || String(error) };
  }

  return createJsonResponse(response);
}
