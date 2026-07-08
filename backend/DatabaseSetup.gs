function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetsInfo = [
    { name: 'DB Master Bahan Baku', cols: ['Kode Material', 'Nama Material', 'Satuan', 'Stok', 'Lokasi (Rak/Zona)', 'Harga Satuan', 'Spesifikasi'] },
    { name: 'DB Master Barang Jadi', cols: ['Kode Barang', 'Nama Barang', 'Stok', 'Harga Jual', 'Lokasi Gudang'] },
    { name: 'DB BOM', cols: ['Kode Barang Jadi', 'Nama Barang', 'Rincian Material', 'Total Biaya Material', 'Rincian Proses', 'Gambar'] },
    { name: 'DB PO Supplier', cols: ['No PO', 'Tanggal', 'Item', 'Qty Pesanan', 'Status Penerimaan (GRN)'] },
    { name: 'DB Penerimaan Barang', cols: ['ID Penerimaan', 'Tanggal', 'No PO', 'Daftar Item (JSON)', 'Penerima', 'Catatan', 'Nomor SJ'] },
    { name: 'DB SPK Produksi', cols: ['No SPK', 'Tanggal', 'Kode Barang Jadi', 'Qty Produksi', 'Peminta', 'Pemberi', 'Status', 'Bahan Baku (JSON)'] },
    { name: 'DB Penawaran', cols: ['No Penawaran', 'Tanggal', 'Customer', 'Rincian Item', 'Total Harga', 'Down Payment', 'Status', 'Narasi', 'Info Tambahan'] },
    { name: 'DB Surat Jalan', cols: ['No Surat Jalan', 'Referensi Penawaran', 'Tanggal Kirim', 'Item', 'Qty', 'Sisa Outstanding PO'] },
    { name: 'DB Invoice', cols: ['No Invoice', 'Tanggal', 'Jatuh Tempo', 'No Penawaran', 'Customer', 'Total Tagihan', 'Potongan DP', 'Grand Total', 'Terbayar', 'Sisa Tagihan', 'Status Pembayaran', 'PPN', 'Items', 'Catatan', 'Dibuat Oleh', 'Diselesaikan Oleh', 'Waktu Selesai'] },
    { name: 'DB Petty Cash', cols: ['Tanggal', 'Jenis (Masuk/Keluar)', 'Keterangan', 'Nominal', 'Saldo Aktif', 'PIC / User'] },
    { name: 'DB Transaksi Gudang', cols: ['ID Transaksi', 'Tanggal', 'Jenis (IN/OUT)', 'Referensi', 'Kode Material', 'Qty', 'PIC', 'Keterangan'] },
    { name: 'DB Pengaturan', cols: ['Key', 'Value'] },
    { name: 'DB Users', cols: ['Username', 'Password', 'Role', 'Nama Lengkap'] },
    { name: 'DB Customer', cols: ['ID Customer', 'Nama Customer', 'Kontak / Telepon', 'Alamat / Keterangan', 'Tanggal Terdaftar'] },
    { name: 'DB Supplier', cols: ['ID Supplier', 'Nama Supplier', 'Kontak / Telepon', 'Alamat / Keterangan', 'Tanggal Terdaftar'] },
    { name: 'DB COA', cols: ['No. Perkiraan', 'Keterangan'] },
    { name: 'DB PO Customer', cols: ['ID PO Customer', 'No Penawaran', 'Nama Customer', 'Tanggal PO', 'Item PO', 'Total Harga', 'Status', 'File PDF', 'Tanggal Selesai'] },
    { name: 'DB Hak Akses', cols: ['Role', 'Menu_ID', 'Can_View', 'Can_Add', 'Can_Edit', 'Can_Delete'] }
  ];
  
  sheetsInfo.forEach(info => {
    let sheet = ss.getSheetByName(info.name);
    if (!sheet) {
      sheet = ss.insertSheet(info.name);
    }
    // Set headers
    sheet.getRange(1, 1, 1, info.cols.length).setValues([info.cols]);
    sheet.getRange(1, 1, 1, info.cols.length).setFontWeight("bold").setBackground("#d9edf7");
  });
  
  Logger.log("Setup Database Selesai!");
}
