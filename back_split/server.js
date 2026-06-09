// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dayjs = require('dayjs');
const PDFDocument = require('pdfkit-table');

const app = express();
app.use(cors({
  origin: 'https://bill.nurulum.web.id'
}));
app.use(bodyParser.json({ limit: '10mb' }));

require('dayjs/locale/id'); // load locale bahasa Indonesia
dayjs.locale('id');

// sanitasi input angka: hapus karakter non-digit kecuali . dan -
function toNumber(x) {
  if (x === null || x === undefined) return 0;
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  const s = String(x).trim();
  if (s === '') return 0;
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function round(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

function formatMoney(n) {
  const safe = isFinite(n) ? n : 0;
  const rounded = Math.round(safe); // bulatkan ke integer rupiah
  return rounded.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function calculateSplit(payload) {
  const members = Array.isArray(payload.members) ? payload.members : [];
  const charges = payload.charges || {};
  const discountValue = toNumber(payload.discount || 0);

  const taxPercent = toNumber(charges.tax); // Pajak dalam % (misal 10)
  const service = toNumber(charges.service);
  const shipping = toNumber(charges.shipping);

  // total harga item per anggota
  const subtotals = {};
  members.forEach(m => {
    const name = (m && m.name) ? String(m.name) : 'Tanpa Nama';
    const items = Array.isArray(m.items) ? m.items : [];
    const itemsTotal = items.reduce((s, it) => s + toNumber(it?.price), 0);
    subtotals[name] = itemsTotal;
  });

  const totalItems = Object.values(subtotals).reduce((s, v) => s + v, 0);
  
  // Dasar Pengenaan Pajak (DPP) = total pesanan - diskon
  const dppGlobal = totalItems - discountValue;

  // Pajak dihitung dari DPP (setelah diskon)
  const totalTax = dppGlobal > 0 ? dppGlobal * (taxPercent / 100) : 0;

  // Biaya layanan global dibagi rata
  const totalCharges = service + shipping;
  
  // Grand total tagihan (PERBAIKAN: Mengubah TotalCharges menjadi totalCharges)
  const netTotal = dppGlobal + totalTax + totalCharges;
  const grossTotal = totalItems + totalTax + totalCharges; // sebelum diskon

  // Hitung pembagian charge per anggota
  const perMemberCharge = members.length > 0 ? totalCharges / members.length : 0;

  // breakdown per anggota
  const breakdown = {};
  members.forEach(m => {
    const name = (m && m.name) ? String(m.name) : 'Tanpa Nama';
    const items = Array.isArray(m.items) ? m.items : [];
    const itemsTotal = toNumber(subtotals[name]);
    
    // Rasio porsi pesanan anggota pada total pesanan keseluruhan
    const memberRatio = totalItems > 0 ? (itemsTotal / totalItems) : 0;
    
    // Diskon proporsional
    const memberDiscount = discountValue * memberRatio;
    
    // DPP tagihan anggota (harga item - porsi diskon)
    const memberDpp = itemsTotal - memberDiscount;
    
    // Pajak proporsional dari DPP anggota
    const memberTax = memberDpp > 0 ? memberDpp * (taxPercent / 100) : 0;
    
    // Total per anggota (Harga barang - diskon) + pajak + layanan
    const total = memberDpp + memberTax + perMemberCharge;

    // subtotal sebelum diskon visualisasi
    const subtotal = itemsTotal + (itemsTotal * (taxPercent / 100)) + perMemberCharge;

    breakdown[name] = {
      items: items.map(it => ({
        name: it?.name || 'Item',
        price: round(toNumber(it?.price))
      })),
      itemsTotal: round(itemsTotal),
      tax: round(memberTax),
      charge: round(perMemberCharge),
      subtotal: round(subtotal),
      discount: round(memberDiscount),
      total: round(total)
    };
  });

  const result = {
    totalItems: round(totalItems),
    totalTax: round(totalTax),
    totalCharges: round(totalCharges),
    grossTotal: round(grossTotal),
    discount: round(discountValue),
    discountPercent: totalItems > 0 ? round((discountValue / totalItems) * 100) : 0,
    netTotal: round(netTotal),
    breakdown
  };

  return result;
}

app.post('/calculate', (req, res) => {
  try {
    const out = calculateSplit(req.body || {});
    res.json({ ok: true, data: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/export-pdf', (req, res) => {
  try {
    const payload = req.body || {};
    const calc = calculateSplit(payload);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Hitung lebar halaman (untuk columnsSize)
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="split_${dayjs().format('YYYYMMDD_HHmmss')}.pdf"`
    );
    res.setHeader('Content-Type', 'application/pdf');

    // --- Judul ---
    doc.fontSize(18).text('HASIL PEMBAGIAN TAGIHAN', { align: 'center' });
    doc.moveDown();

    if (payload.resto) {
      doc.fontSize(14).text(`Restoran: ${payload.resto}`, { align: 'center' });
    }
    doc.fontSize(9).text(
      `Hari/Tanggal: ${dayjs().format('dddd, D MMMM YYYY - HH:mm:ss')} WIB`,
      { align: 'center' }
    );
    doc.moveDown(1);
    
    // Menghitung DPP
    const dppVisual = calc.totalItems - calc.discount;
    const roundedDiscountPercent = Math.round(calc.discountPercent);

    // --- Ringkasan dalam tabel ---
    const summaryTable = {
      title: "Ringkasan",
      headers: ["Keterangan", "Jumlah"],
      rows: [
        ["Total Pesanan", `Rp ${formatMoney(calc.totalItems)}`],
        ["Diskon", `Rp ${formatMoney(calc.discount)} (${roundedDiscountPercent}%)`],
        ["Setelah Diskon (DPP)", `Rp ${formatMoney(dppVisual)}`],
        ["Tax/Pajak", `Rp ${formatMoney(calc.totalTax)} (${payload.charges?.tax || 0}%)`],
        ["Biaya Layanan & Ongkir", `Rp ${formatMoney(calc.totalCharges)}`],
        ["Subtotal", `Rp ${formatMoney(calc.grossTotal)}`],
        ["Grand Total", `Rp ${formatMoney(calc.netTotal)}`],
      ],
    };
    doc.table(summaryTable, { width: pageWidth });
    doc.moveDown();

    // --- Per anggota ---
    const memberTable = {
      title: "Tagihan Per Anggota",
      headers: [
        { label: "Nama", align: "center", headerAlign: "center" },
        { label: "List Pesanan", align: "left", headerAlign: "center" },
        { label: "Total Pesanan", align: "right", headerAlign: "center" },
        { label: "Hemat", align: "right", headerAlign: "center" },
        { label: "Tax/Pajak", align: "right", headerAlign: "center" },
        { label: "Layanan & Ongkir", align: "right", headerAlign: "center" },
        { label: "Total Bayar", align: "right", headerAlign: "center" }
      ],
      rows: Object.keys(calc.breakdown).map(name => {
        const b = calc.breakdown[name];

        // Format list item jadi multiline
        const itemsList = (b.items || [])
          .map(it => `- ${it.name} (Rp ${formatMoney(it.price)})`)
          .join("\n");

        return [
          name,
          itemsList || "-",
          `Rp ${formatMoney(b.itemsTotal)}`,
          `Rp ${formatMoney(b.discount)}`,
          `Rp ${formatMoney(b.tax)}`,
          `Rp ${formatMoney(b.charge)}`,
          `Rp ${formatMoney(b.total)}`,
        ];
      }),
    };

    const memberColumns = [
      55,              // Nama
      pageWidth - 365, // Penyesuaian sisa ruang untuk List Pesanan
      60, 60, 60, 60, 70 
    ];

    doc.table(memberTable, { 
      width: pageWidth, 
      columnsSize: memberColumns,
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9), 
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font("Helvetica").fontSize(8); 
      }
    });
    doc.moveDown();

    // --- Rekening ---
    const accountTable = {
      title: "Rekening Pembayaran",
      headers: ["Keterangan", "Data"],
      rows: [
        ["Bank/E-Wallet", payload.account?.bank || "-"],
        ["No. Rekening/No. Telp", payload.account?.accountNumber || "-"],
        ["Nama", payload.account?.accountName || "-"],
      ],
    };
    doc.table(accountTable, { width: pageWidth });

    // Output PDF
    doc.pipe(res);
    doc.end();

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/', (req, res) => {
  res.send('Split Backend berjalan 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
