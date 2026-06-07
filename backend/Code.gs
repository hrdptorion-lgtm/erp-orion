function doGet(e) {
  // Setup routing or returning basic info
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'API ERP Orion is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Handle POST requests from the frontend
  let response = { status: 'error', message: 'Invalid request' };
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'create_po') {
      response = createPO(data.payload);
    } else if (action === 'get_stock') {
      response = getStock();
    } else if (action === 'save_stock') {
      response = saveStock(data.payload);
    } else if (action === 'delete_stock') {
      response = deleteStock(data.payload);
    } else if (action === 'get_users') {
      response = getUsers();
    } else if (action === 'save_user') {
      response = saveUser(data.payload);
    } else if (action === 'delete_user') {
      response = deleteUser(data.payload);
    } else if (action === 'receive_grn') {
      response = receiveGRN(data.payload);
    } else if (action === 'get_penawaran') {
      response = getPenawaran();
    } else if (action === 'save_penawaran') {
      response = savePenawaran(data.payload);
    } else if (action === 'delete_penawaran') {
      response = deletePenawaran(data.payload);
    } else if (action === 'get_produksi') {
      response = getProduksi();
    } else if (action === 'get_inventory') {
      response = getInventory();
    } else if (action === 'get_bom') {
      response = getBOM();
    } else if (action === 'save_bom') {
      response = saveBOM(data.payload);
    } else if (action === 'save_spk') {
      response = saveSPK(data.payload);
    } else if (action === 'save_invoice') {
      response = saveInvoice(data.payload);
    } else if (action === 'add_petty_cash') {
      response = addPettyCash(data.payload);
    } else if (action === 'login') {
      response = handleLogin(data.payload);
    } else if (action === 'get_settings') {
      response = getSettings();
    } else if (action === 'save_settings') {
      response = saveSettings(data.payload);
    }
  } catch (error) {
    response = { status: 'error', message: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
