<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Split Bill</title>
  <link rel="icon" type="image/png" href="assets/logo-site.png">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<div class="container">
  <!-- Header dengan Logo -->
  <div class="header">
    <img src="assets/logo.png" alt="Logo Aplikasi" class="logo">
  </div>
  
  <div id="form-area">
    <!-- Section Anggota -->
    <h2>DAFTAR PESANAN</h2>
    <div class="restoran">
      <div>
        <input id="resto" placeholder="Nama Restoran">
      </div>
    </div>

    <div id="members"></div>

    <div class="button-group">
      <button id="addMember" type="button">+ Tambah Anggota</button>
    </div>
    
    <hr/>
    
    <!-- Section Perhitungan -->
    <div class="calculation-section">
      <!-- Kiri: Input Biaya -->
      <div class="calc-left">
        <h2>Biaya Layanan & Diskon</h2>
        <div class="row">
          <div>
            <label for="discount">Diskon (Rp)</label>
            <input id="discount" type="number" min="0" value="0">
          </div>
          <div>
            <label for="tax">Tax/Pajak (%)</label>
            <input id="tax" type="number" min="0" max="100" value="0">
          </div>
          <div>
            <label for="service">Biaya Layanan (Rp)</label>
            <input id="service" type="number" min="0" value="0">
          </div>
          <div>
            <label for="shipping">Biaya Kirim (Rp)</label>
            <input id="shipping" type="number" min="0" value="0">
          </div>
        </div>
      </div>
      
      <!-- Kanan: Rekening -->
      <div class="calc-right">
        <h2>Data Rekening</h2>
        <div id="accountForm">
          <label>Bank/E-Wallet:</label>
          <select id="bank">
            <option value="Pilih">Pilih:</option>
            <option value="BCA">BCA</option>
            <option value="BNI">BNI</option>
            <option value="Mandiri">Mandiri</option>
            <option value="BRI">BRI</option>
            <option value="GoPay">GoPay</option>
            <option value="Dana">DANA</option>
            <option value="ShopeePay">ShopeePay</option>
            <option value="Ovo">OVO</option>
            <option value="Lainnya">Bank Lainnya</option>
          </select>
          <div id="customBankContainer" style="display: none; margin-top: 8px;">
              <label>Nama Bank:</label>
              <input id="customBankName" placeholder="Masukkan nama Bank:">
          </div>
          <label style="margin-top: 8px;">No. Rekening/No Telp:</label>
          <input id="accountNumber" placeholder="0">
          <label>Atas Nama:</label>
          <input id="accountName" placeholder="Nama">
        </div>
      </div>
    </div>
    
    <!-- Tombol hitung -->
    <div class="button-group" style="text-align: center; margin-top: 20px;">
      <button id="calculate" type="button" style="width: 100%; max-width: 400px; padding: 12px; font-weight: bold;">
        Hitung dan Simpan Rekening
      </button>
    </div>

    <!-- Hasil -->
    <div id="result"></div>
    
    <hr/>

    <!-- Export PDF dan Reset -->
    <div class="button-group">
      <button id="exportPdf" type="button">Download</button>
      <button id="resetAll" type="button" class="danger">Reset</button>
    </div>

  </div>
</div>

<script src="assets/script.js" defer></script>

</body>
</html>
