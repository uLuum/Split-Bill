const backendUrl = 'http://localhost:3030';

/* ===================== Helper ===================== */
function el(tag, props = {}) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  return e;
}

function sanitizeNumberInput(value) {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (s === '') return 0;
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n) {
  const rounded = Math.round(Number(n) || 0);
  return (
    rounded.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ',-'
  );
}

/* ===================== Section Member ===================== */
let memberCounter = 0;

function addMemberSection(data = {}) {
  const container = document.getElementById('members');
  const id = 'member_' + ++memberCounter;

  const section = el('div');
  section.className = 'member-section';
  section.dataset.id = id;

  section.innerHTML = `
    <input class="mname" placeholder="Nama" value="${data.name || ''}" />
    <div class="items"></div>
    <button type="button" class="addItem">Tambah Item</button>
    <button type="button" class="removeMember">Hapus</button>
    <hr/>
  `;

  container.appendChild(section);

  section.querySelector('.addItem').onclick = () =>
    addItemRow(section.querySelector('.items'));
  section.querySelector('.removeMember').onclick = () => section.remove();

  addItemRow(section.querySelector('.items'));
}

function addItemRow(itemsContainer, data = {}) {
  const row = el('div');
  row.className = 'item-row';
  row.innerHTML = `
    <div>
      <label for="iname">Pesanan</label>
      <input class="iname" placeholder="Nama Item" value="${data.name || ''}" />
    </div>
    <div>
      <label for="iprice">Harga Pesanan</label>
      <input class="iprice" type="number" min="0" value="${data.price || 0}" />
    </div>
    <button type="button" class="removeItem">x</button>
  `;
  itemsContainer.appendChild(row);
  row.querySelector('.removeItem').onclick = () => row.remove();
}

/* ===================== Payload Builder ===================== */
function buildPayload() {
  const membersEls = Array.from(document.querySelectorAll('.member-section'));
  const members = membersEls.map((sec) => {
    const name = sec.querySelector('.mname').value.trim() || 'Tanpa Nama';
    const itemsEls = Array.from(sec.querySelectorAll('.item-row'));
    const items = itemsEls.map((r) => {
      const name = r.querySelector('.iname').value.trim() || 'Item';
      const priceRaw = r.querySelector('.iprice').value;
      const price = sanitizeNumberInput(priceRaw);
      return { name, price };
    });
    return { name, items };
  });

  const tax = sanitizeNumberInput(document.getElementById('tax').value);
  const service = sanitizeNumberInput(document.getElementById('service').value);
  const shipping = sanitizeNumberInput(document.getElementById('shipping').value);
  const discount = sanitizeNumberInput(document.getElementById('discount').value);

  return {
    members,
    charges: { tax, service, shipping },
    discount,
  };
}

/* ===================== Render Result ===================== */
function renderResult(data, account = null) {
  const out = document.getElementById('result');
  out.innerHTML = '';

  const container = el('div');
  container.className = 'result-container';

  // Ringkasan
  const summaryBox = el('div');
  summaryBox.className = 'summary-box';
  summaryBox.innerHTML = `
    <h2>Ringkasan</h2>
    <table class="summary-table">
      <tr><th>Total Pesanan</th><td>Rp ${formatMoney(data.totalItems)}</td></tr>
      <tr><th>Tax/Pajak</th><td>Rp ${formatMoney(data.totalTax)} (${document.getElementById('tax').value || 0}%)</td></tr>
      <tr><th>Biaya Layanan</th><td>Rp ${formatMoney(data.totalCharges)}</td></tr>
      <tr><th>Subtotal</th><td>Rp ${formatMoney(data.grossTotal)}</td></tr>
      <tr><th>Diskon</th><td>Rp ${formatMoney(data.discount)} (${data.discountPercent}%)</td></tr>
      <tr><th>Grand Total</th><td><strong>Rp ${formatMoney(data.netTotal)}</strong></td></tr>
    </table>
  `;

  // Rekening
  const accountBox = el('div');
  accountBox.className = 'account-box';
  const acc = account || JSON.parse(localStorage.getItem('paymentAccount') || '{}');
  accountBox.innerHTML = `
    <h2>Data Pembayaran</h2>
    <table class="summary-table">
      <tr><th>Bank/E-Wallet</th><td>${acc.bank || '-'}</td></tr>
      <tr><th>No. Rekening/No. Telp</th><td>${acc.accountNumber || '-'}</td></tr>
      <tr><th>Nama</th><td>${acc.accountName || '-'}</td></tr>
    </table>
  `;

  container.appendChild(summaryBox);
  container.appendChild(accountBox);
  out.appendChild(container);

  // Detail anggota
  const table = el('table');
  table.innerHTML =
    '<tr><th>Nama</th><th>List Pesanan</th><th>Total Pesanan</th><th>Tax/Pajak</th><th>Biaya Layanan</th><th>Hemat</th><th>Total Bayar</th></tr>';
    
    Object.keys(data.breakdown).forEach((m) => {
      const b = data.breakdown[m];
      const row = el('tr');
      const ul = el('ul');
      ul.className = 'item-list';
      (b.items || []).forEach(it => {
        const li = el('li');
        li.innerHTML = `
        <span class="item-name">- ${it.name}</span>
        <span class="item-price">Rp ${formatMoney(it.price)}</span>
        `;
        ul.appendChild(li);
      });
      
      // isi kolom baris
      row.innerHTML = `
      <td>${m}</td>
      <td></td>
      <td>Rp ${formatMoney(b.itemsTotal)}</td>
      <td>Rp ${formatMoney(b.tax)}</td>
      <td>Rp ${formatMoney(b.charge)}</td>
      <td>Rp ${formatMoney(b.discount)}</td>
      <td><strong>Rp ${formatMoney(b.total)}</strong></td>
      `;
      
      // masukkan UL ke dalam kolom kedua
      row.children[1].appendChild(ul);
      
      table.appendChild(row);
    });
    
    out.appendChild(table);
}

/* ===================== Main Function ===================== */
async function calculateAndRender(saveAccount = false) {
  const bank = document.getElementById('bank').value;
  const accountNumber = document.getElementById('accountNumber').value;
  const accountName = document.getElementById('accountName').value;
  const account = { bank, accountNumber, accountName };

  if (saveAccount) {
    localStorage.setItem('paymentAccount', JSON.stringify(account));
    alert('Rekening berhasil disimpan!');
  }

  const body = buildPayload();
  const res = await fetch(`${backendUrl}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const j = await res.json();
  if (j.ok) {
    renderResult(j.data, account);
  } else {
    alert('Error: ' + j.error);
  }
}

/* ===================== Event Binding ===================== */
document.getElementById('addMember').onclick = () => addMemberSection();
document.getElementById('calculate').onclick = () => calculateAndRender(false);
document.getElementById('saveAccount').onclick = () => calculateAndRender(true);

document.getElementById('exportPdf').onclick = async () => {
  const payload = buildPayload();
  payload.resto = document.getElementById('resto').value;

  // Ambil rekening terbaru dari localStorage
  const account =
    JSON.parse(localStorage.getItem('paymentAccount')) || {
      bank: document.getElementById('bank').value,
      accountNumber: document.getElementById('accountNumber').value,
      accountName: document.getElementById('accountName').value,
    };
  payload.account = account;

  const res = await fetch(`${backendUrl}/export-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'split_bill.pdf';
  a.click();
};

/*
document.getElementById('copyAccount').onclick = async () => {
  const bank = document.getElementById('bank').value.trim();
  const accountNumber = document.getElementById('accountNumber').value.trim();
  const accountName = document.getElementById('accountName').value.trim();

  if (!bank || !accountNumber || !accountName) {
    alert('Mohon lengkapi semua data rekening.');
    return;
  }

  const text = `Bank: ${bank}\nNo. Rekening: ${accountNumber}\nAtas Nama: ${accountName}`;

  try {
    await navigator.clipboard.writeText(text);
    alert('Rekening berhasil disalin ke clipboard!');
  } catch (err) {
    console.error(err);
    alert('Gagal menyalin rekening.');
  }
};*/

/*
/* ===================== Auto Load =====================
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('paymentAccount');
  if (saved) {
    const account = JSON.parse(saved);
    document.getElementById('bank').value = account.bank || 'Pilih';
    document.getElementById('accountNumber').value =
      account.accountNumber || '';
    document.getElementById('accountName').value = account.accountName || '';
  }
}); */