<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Split Bill</title>
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
    <h2>Daftar Pesanan</h2>
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
          <div>
            <label for="discount">Diskon (Rp)</label>
            <input id="discount" type="number" min="0" value="0">
          </div>
        </div>
        <div class="button-group">
          <button id="calculate" type="button">Hitung</button>
        </div>
      </div>
      
      <!-- Kanan: Rekening -->
      <div class="calc-right">
        <h2>Rekening Pembayaran</h2>
        <div id="accountForm">
          <label>Bank/E-Wallet:</label>
          <select id="bank">
            <option value="Pilih">Pilih:</option>
            <option value="BCA">BCA</option>
            <option value="BNI">BNI</option>
            <option value="Mandiri">Mandiri</option>
            <option value="BRI">BRI</option>
            <option value="GoPay">GoPay</option>
            <option value="OVO">OVO</option>
            <option value="ShopeePay">ShopeePay</option>
            <option value="Dana">Dana</option>
          </select>
          <label>No. Rekening/No Telp:</label>
          <input id="accountNumber" placeholder="0">
          <label>Atas Nama:</label>
          <input id="accountName" placeholder="Nama">
        </div>
        <div class="button-group">
          <button id="saveAccount" type="button">Simpan Rekening</button>
        </div>
      </div>
    </div>

    <!-- Hasil -->
    <div id="result"></div>
    
    <hr/>

    <!-- Export PDF -->
    <div class="button-group">
      <button id="exportPdf" type="button">Download</button>
    </div>

  </div>
</div>

<script src="assets/script.js" defer></script>

</body>
</html>
