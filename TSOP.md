# Technical Standard Operating Procedure (TSOP) - ERP ORION

Dokumen ini berisi panduan teknis operasional dan alur logika sistem (SOP) untuk menggunakan seluruh modul dalam sistem ERP ORION secara mendetail.

---

## 1. Login, Pembuatan Akun & Hak Akses (Role)
Sistem dilengkapi dengan keamanan login dan manajemen otorisasi pengguna yang ketat berdasarkan jenis akun (*Role*).

**Langkah-langkah Pembuatan Akun:**
1. Pada halaman awal, masukkan *Username* dan *Password* untuk masuk ke *Dashboard*.
2. Untuk mengelola akun, navigasi ke menu **Pengaturan > Pengguna**.
3. Klik tombol **+ Tambah Pengguna Baru**.
4. Masukkan Nama Lengkap, Username, Password, dan tetapkan **Jenis Akun (Peran/Role)**.
5. Klik **Simpan**.

**Rincian Jenis Akun & Hak Akses:**
Sistem membagi pengguna ke dalam 3 jenis profil utama untuk mengamankan data perusahaan:

| Jenis Akun (Role) | Tingkat Akses | Deskripsi Kewenangan | Daftar Menu yang Bisa Diakses |
| :--- | :--- | :--- | :--- |
| **Admin** | Tertinggi (*Full Access*) | Memiliki kendali 100% terhadap aplikasi dan pengaturan. (Berfungsi layaknya *Super Admin*). | **SEMUA MENU:** <br>• Dashboard <br>• Produk & Logistik (Bahan Baku, Permintaan Belanja, Penerimaan Barang, Transaksi Gudang, PMO & BOM) <br>• Penawaran & Sales (PO Customer, Penawaran, PO Internal) <br>• Database Master (Customer, Supplier, Barang Jadi) <br>• Surat Jalan (DO) & Keuangan (Invoice) <br>• **Pengaturan (Profil Perusahaan, Kategori COA, Manajemen User)** |
| **Management** | Menengah Atas (*Monitoring & Verifikasi*) | Dirancang untuk jajaran Direktur/Manajemen. Dapat melihat semua laporan transaksi dan menyetujui dokumen, namun tidak berfokus pada *data entry* mentah. | **MENU OPERASIONAL + MONITORING:** <br>• Dashboard <br>• Seluruh Modul Sales, Logistik, dan Finance <br>*(Bisa melakukan approval dokumen/transaksi)* <br>*(Menu Pengaturan Inti disembunyikan)* |
| **Marketing** | Menengah (*Sales & CRM*) | Mengelola siklus pra-produksi mulai dari pendekatan klien hingga turunnya pesanan resmi. | **MENU SPESIFIK:** <br>• Dashboard <br>• Penawaran Sales <br>• PO Customer <br>• Master Customer <br>• Master Barang Jadi <br>*(Menu Produksi & Pembelian di-nonaktifkan)* |
| **Finance / Accounting** | Menengah (*Keuangan*) | Mengontrol siklus piutang/pembayaran dan verifikasi harga riil. | **MENU SPESIFIK:** <br>• Dashboard <br>• Invoice (Penagihan) <br>• Kategori COA <br>• Master Customer & Supplier <br>*(Fokus pada penagihan Invoice dan nominal PO)* |
| **Purchasing** | Menengah (*Pengadaan*) | Bertanggung jawab mencari *Supplier* dan memastikan barang yang diminta tersedia dengan harga terbaik. | **MENU SPESIFIK:** <br>• Dashboard <br>• Permintaan Belanja (PO Internal) <br>• Master Supplier <br>• Penerimaan Barang (GRN) |
| **Gudang** | Menengah (*Inventory*) | Mengurus fisik barang, stok opname, dan serah terima bahan baku ke bagian produksi. | **MENU SPESIFIK:** <br>• Dashboard <br>• Master Bahan Baku (Stok) <br>• Transaksi Gudang (IN/OUT) <br>• Penerimaan Barang (GRN) <br>• Permintaan Belanja (Hanya membuat pengajuan) |
| **Produksi** | Menengah (*Pabrikasi*) | Berfokus pada peracikan *Bill of Materials* dan penyelesaian *Surat Perintah Kerja* (SPK). | **MENU SPESIFIK:** <br>• Dashboard <br>• PMO & BOM Sampel (SPK) <br>• Permintaan Belanja (Jika bahan baku produksi kurang) <br>• Surat Jalan (DO) |

> `![Gambar 1: Manajemen Pengguna - (Silakan Screenshot halaman tabel daftar pengguna saat tombol "Tambah Pengguna Baru" ditekan yang menampilkan pilihan Dropdown Jenis Akun/Role)]()`

---

## 2. Penawaran Sales (Sales Quotation)
Modul untuk membuat dan mencetak penawaran harga kepada calon klien (*Customer*).

**Langkah-langkah Detail:**
1. Navigasi ke menu **Penawaran Sales**.
2. Klik tombol **+ Buat Penawaran Baru**.
3. Isi data Customer, Tanggal Penawaran, Narasi (misal: "Penawaran Pembuatan Part X"), dan Besaran Uang Muka (DP).
4. Klik **+ Tambah Item** untuk memasukkan daftar barang/jasa beserta harga satuannya. Sistem akan menghitung total nilai penawaran otomatis.
5. Klik **Simpan Penawaran**. 
6. Untuk mencetak atau mengekspor PDF penawaran ke Klien, klik ikon **Print** pada baris penawaran tersebut.

> `![Gambar 2: Penawaran Sales - (Silakan Screenshot pop-up pembuatan Penawaran Baru yang telah diisi rincian item dan harganya)]()`

---

## 3. Pembuatan PO Customer (Pesanan Penjualan)
Saat klien setuju dengan Penawaran Sales dan menerbitkan *Purchase Order*, pesanan tersebut harus direkam ke dalam PO Customer.

**Langkah-langkah Detail:**
1. Navigasi ke menu **Penawaran & Sales > PO Customer**.
2. Klik **+ Tambah PO Customer**.
3. Pilih *Nomor Penawaran* yang telah disetujui sebelumnya. (Sistem akan secara otomatis menarik data *Customer* dan *Total Harga* dari penawaran tersebut).
4. Masukkan *Nomor PO Customer* (Nomor rujukan asli dari klien).
5. Pada bagian Daftar Pesanan, rincikan barang apa saja yang akan diproduksi beserta kuantitasnya (Qty).
6. Klik **Simpan**. Dokumen PO ini otomatis menjadi basis perhitungan seluruh alur *End-to-End* dan *Analisis BOM*.

**Fungsi Tombol Aksi (Action) pada Tabel Utama PO Customer:**
Di ujung setiap baris tabel PO Customer, terdapat tombol-tombol aksi berikut:
- **Ikon PDF (Biru Muda):** Jika Anda sebelumnya melampirkan *link* dokumen PDF asli dari klien saat membuat PO, tombol ini akan muncul untuk membuka dokumen referensi tersebut di *tab* baru.
- **Ikon Pensil / Edit (Biru Tua):** Digunakan untuk mengedit rincian pesanan, menambah/mengurangi barang, atau mengubah data customer.
- **Ikon Tempat Sampah (Merah):** Digunakan untuk membatalkan dan menghapus dokumen PO Customer secara permanen.
- **Tombol Ekspor Excel (Kanan Atas Tabel):** Fitur pelaporan massal. Anda dapat memfilter berdasarkan nama spesifik pelanggan (*Customer*) maupun Status PO, lalu mengunduh rekap datanya dalam wujud `.xlsx` (Excel).

> `![Gambar 3: PO Customer Baru - (Silakan Screenshot form "Tambah PO Customer" ketika opsi "Pilih Penawaran" sedang dipilih dan data terisi otomatis)]()`

---

## 4. Rincian "Detail PO Customer" & Analisis BOM
Pop-up **Detail PO Customer** adalah pusat komando (Dashboard Mini) untuk melacak seluruh siklus hidup pesanan (End-to-End). Klik baris pesanan di menu PO Customer untuk membukanya.

**Anatomi Menu di Dalam Detail PO Customer:**

1. **Tombol Aksi Cepat (Quick Actions)**
   Di bagian atas pop-up, terdapat deretan tombol kotak pintar (*Shortcut*) lintas-divisi yang mempercepat alur kerja tanpa perlu berpindah-pindah menu:
   - **Print Laporan:** Mencetak *Progress Report* pesanan dengan Kop Surat rapi untuk diserahkan ke klien.
   - **Buat SPK Produksi:** Otomatis melompat ke form Surat Perintah Kerja dengan membawa data referensi PO ini (Cocok ditekan jika analisis BOM menyatakan bahan baku *Aman*).
   - **Pengajuan Belanja:** Melompat ke form PO Internal (Beli ke Supplier) untuk memesan bahan baku (Cocok ditekan jika analisis BOM menyatakan bahan baku *Kurang*).
   - **Buat Surat Jalan:** Menerbitkan dokumen DO untuk pengiriman barang (Cocok ditekan saat progress SPK sudah *Selesai*).
   - **Buat Invoice:** Menerbitkan faktur tagihan (Cocok ditekan saat status DO sudah terkirim).

2. **Lacak Progress Pesanan (End-to-End Tracking)**
   Bagian ini secara instan merekap status dokumen lintas-divisi yang terkait dengan PO ini:
   - **Rincian SPK (Produksi):** Memantau berapa banyak pesanan yang sudah diterbitkan Surat Perintah Kerja-nya dan status produksinya (Draft/Selesai).
   - **Rincian Surat Jalan (Logistik):** Melacak riwayat DO (Delivery Order), tanggal pengiriman, dan kuantitas barang yang sudah sukses dikirim ke tangan pelanggan.
   - **Rincian Invoice (Finance):** Menampilkan rekap tagihan (Invoice) yang telah diterbitkan untuk Surat Jalan di atas, beserta nominal tagihan dan status pembayarannya (Belum Lunas/Lunas).

3. **Analisis Kebutuhan Bahan Baku (BOM Pintar)**
   Tabel ini adalah otak produksi aplikasi. Tabel ini secara cerdas akan:
   - Mengalikan Resep (BOM) barang dengan jumlah pesanan yang **Belum Dibuatkan SPK** dan **Belum Dikirim**.
   - Mengurangi angka tersebut dengan ketersediaan di gudang, lalu menghasilkan status **Aman** atau **Kurang**.
   - Jika keseluruhan pesanan telah terkirim 100%, tabel analisis ini **otomatis disembunyikan** karena pesanan dianggap tuntas.

> `![Gambar 4: Detail PO Customer - (Silakan Screenshot pop-up Detail PO Customer dari atas ke bawah, yang menampakkan bagian Lacak Progress End-to-End dan Analisis BOM)]()`

**Pembuatan SPK:**
1. Navigasi ke menu **Produk & Logistik > PMO & BOM Sampel** atau buat langsung dari Detail PO.
2. Saat membuat SPK, pilih referensi PO Customer.
3. Masukkan Qty Produksi. Sistem akan langsung mem-booking stok bahan baku yang tertera di *Database*.

> `![Gambar 5: Form SPK - (Silakan Screenshot form pengajuan Surat Perintah Kerja (SPK))]()`

---

## 5. Permintaan Belanja (PO Internal)
Modul untuk divisi internal (Gudang/Produksi) yang ingin mengajukan pembelian ke Supplier akibat bahan baku yang "Kurang".

**Langkah-langkah Detail:**
1. Navigasi ke menu **Produk & Logistik > Permintaan Belanja**.
2. Klik **+ Buat Pengajuan Belanja**.
3. Ketik/Pilih nama *Supplier* pada kolom "Kepada (To)". *Alamat Supplier* dan *Attn* akan terisi **Otomatis (Auto-fill)**.
4. Masukkan barang yang dibeli beserta **Harga Aktual** (harga riil hasil kesepakatan akhir). Perhitungan Subtotal akan mengutamakan *Harga Aktual*.
5. Klik **Simpan**.

> `![Gambar 6: Form PO Internal - (Silakan Screenshot form Permintaan Belanja dengan auto-fill alamat dan kolom Harga Aktual yang sudah terisi)]()`

---

## 6. Penerimaan Barang (GRN - Goods Receipt Note)
Modul ketika fisik barang dari Supplier tiba di Gudang.

**Langkah-langkah Detail:**
1. Navigasi ke menu **Penerimaan Barang**.
2. Cari PO Internal yang bersangkutan dan klik tombol hijau **Terima**.
3. Masukkan angka riil barang yang diterima di kolom *Qty Diterima*, lalu klik **Simpan Penerimaan**.

**Automasi Pintar di Belakang Layar:**
- **Status Otomatis:** Tanpa butuh *Approval*, status penerimaan langsung dianggap valid karena di-input langsung oleh pihak gudang.
- **Auto-Update Stok:** Jumlah Qty diterima langsung ditambahkan ke stok Master Bahan Baku.
- **Auto-Valuation Harga:** Sistem menengok kembali **Harga Aktual** dari PO Internal tersebut, lalu otomatis menimpa/memperbarui *Harga Satuan* di Master Bahan Baku.

> `![Gambar 7: Form Penerimaan Barang - (Silakan Screenshot pop-up "Terima Barang" saat staf memasukkan angka riil kedatangan barang)]()`

---

## 7. Transaksi Gudang (Buku Besar Aktivitas)
Modul untuk melacak jejak pergerakan seluruh barang keluar-masuk.

**Panduan Analisis Tabel:**
1. Navigasi ke menu **Transaksi Gudang**.
2. **Badge Hijau (IN - Barang Masuk):** Muncul otomatis tanpa syarat persetujuan setiap kali Penerimaan Barang (GRN) sukses.
3. **Badge Merah (OUT - Barang Keluar):** Biasanya untuk pengambilan barang produksi SPK. Pada transaksi tipe OUT yang belum ada data *Pemberi*-nya, akan muncul ikon **Ceklis (Setujui/Berikan Barang)**. Anda harus mengkliknya sebagai bukti serah terima fisik barang.
4. **Google Sheets Conditional Formatting:** Pada tingkat *database*, warna latar belakang akan disorot **Hijau (IN)** atau **Merah (OUT)** secara otomatis demi kelancaran audit *Back-office*.

> `![Gambar 8: Log Transaksi Gudang - (Silakan Screenshot tabel aplikasi Transaksi Gudang yang menampakkan badge IN/OUT serta tombol ceklis pada tipe OUT)]()`

---

## 8. Surat Jalan (Delivery Order)
Dokumen pengantar untuk pengiriman barang jadi ke pelanggan.

**Langkah-langkah Detail:**
1. Navigasi ke menu **Surat Jalan (DO)**.
2. Klik **+ Buat Surat Jalan**.
3. Pilih *PO Customer* dan otomatis sistem akan menyuguhkan daftar barang apa saja yang *belum dikirim*.
4. Masukkan jumlah (Qty) yang akan dikirim pada surat jalan ini, nama Supir, dan Nomor Kendaraan.
5. Klik **Simpan**, dan status pengiriman ini dapat dipantau di fitur *Lacak Progress End-to-End* pada pop-up PO Customer.

> `![Gambar 9: Surat Jalan Baru - (Silakan Screenshot form pembuatan Surat Jalan beserta kolom nama Supir/Kendaraan)]()`

---

## 9. Penagihan (Invoice)
Modul pembuatan faktur penagihan pembayaran setelah Surat Jalan diterbitkan.

**Langkah-langkah Detail:**
1. Buka menu **Finance > Invoice**.
2. Klik **+ Buat Invoice Baru**.
3. Pilih Surat Jalan (DO) yang akan ditagihkan (Anda dapat memilih lebih dari 1 Surat Jalan sekaligus).
4. Tambahkan Biaya Pengiriman atau Diskon (jika ada).
5. Klik **Simpan**. Laporan cetak PDF Invoice secara otomatis memiliki *Kop Surat* yang rapi.

> `![Gambar 10: Pembuatan Invoice - (Silakan Screenshot proses pembuatan Invoice Baru yang memilih referensi Surat Jalan)]()`

---

## 10. Pengaturan Aplikasi & Laporan Cetak
**Pengaturan Profil Perusahaan:**
- Navigasi ke **Pengaturan > Aplikasi** untuk mengubah Nama Perusahaan, Alamat, Logo, dan Nomor Telepon.
- Seluruh informasi ini akan otomatis teraplikasikan (menyebar) ke dalam Kop Surat untuk seluruh laporan cetak (Penawaran, PO, Surat Jalan, Invoice, Progress Report).

**Laporan Cetak (Print Format):**
Semua dokumen cetak dari ERP ORION mengadopsi standar profesional:
- **Left-Aligned Header:** Informasi penerima/klien sejajar rapi di sisi kanan.
- **Fallback Status Badge:** Status di laporan (Lunas, Selesai, dsb.) dipaksa tercetak dengan font *Hitam Pekat* dan *Garis Tepi Abu-abu* demi keamanan. Fitur ini menjamin status dokumen tetap terlihat 100% jelas meskipun fitur cetak warna/gambar *browser* (Background Graphics) dimatikan oleh pengguna.

> `![Gambar 11: Hasil Cetak Invoice / PO Customer - (Silakan Screenshot hasil Preview Print yang memperlihatkan header dokumen, logo, dan status yang tetap terbaca jelas)]()`
