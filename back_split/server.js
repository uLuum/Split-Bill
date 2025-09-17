// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dayjs = require('dayjs');
const PDFDocument = require('pdfkit-table');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

require('dayjs/locale/id'); // load locale bahasa Indonesia
dayjs.locale('id');

// sanitasi input angka: hapus karakter non-digit kecuali . dan -
function toNumber(x) {
  if (x === null || x === undefined) return 0;
  // jika sudah number, kembalikan
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  const s = String(x).trim();
  if (s === '') return 0;
  // hapus semua kecuali digit, titik desimal dan minus
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

  const taxPercent = toNumber(charges.tax); // <- sekarang dianggap % (misal 10 untuk 10%)
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

  // pajak dihitung dari totalItems (global) → dibagi proporsional nanti
  const totalTax = totalItems * (taxPercent / 100);

  // biaya layanan global
  const totalCharges = service + shipping;
  const grossTotal = totalItems + totalTax + totalCharges;

  // hitung pembagian charge per anggota
  const perMemberCharge = members.length > 0 ? totalCharges / members.length : 0;

  // breakdown per anggota
  const breakdown = {};
  members.forEach(m => {
    const name = (m && m.name) ? String(m.name) : 'Tanpa Nama';
    const items = Array.isArray(m.items) ? m.items : [];
    const itemsTotal = toNumber(subtotals[name]);

    // pajak proporsional berdasarkan porsi items anggota
    const tax = itemsTotal * (taxPercent / 100);

    // subtotal sebelum diskon
    const subtotal = itemsTotal + tax + perMemberCharge;

    // diskon proporsional: porsi subtotal anggota dibanding subtotal semua anggota
    const memberDiscount = grossTotal > 0 ? (subtotal / grossTotal) * discountValue : 0;

    const total = subtotal - memberDiscount;

    breakdown[name] = {
      items: items.map(it => ({
      name: it?.name || 'Item',
      price: round(toNumber(it?.price))
    })),
      itemsTotal: round(itemsTotal),
      tax: round(tax),
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
    discountPercent: grossTotal > 0 ? round((discountValue / grossTotal) * 100) : 0,
    netTotal: round(grossTotal - discountValue),
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

    // --- Ringkasan dalam tabel ---
    const summaryTable = {
      title: "Ringkasan",
      headers: ["Keterangan", "Jumlah"],
      rows: [
        ["Total Pesanan", `Rp ${formatMoney(calc.totalItems)}`],
        ["Tax/Pajak", `Rp ${formatMoney(calc.totalTax)} (${payload.charges?.tax || 0}%)`],
        ["Biaya Layanan", `Rp ${formatMoney(calc.totalCharges)}`],
        ["Subtotal", `Rp ${formatMoney(calc.grossTotal)}`],
        ["Diskon", `Rp ${formatMoney(calc.discount)} (${calc.discountPercent}%)`],
        ["Grand Total", `Rp ${formatMoney(calc.netTotal)}`],
      ],
    };
    doc.table(summaryTable, { width: pageWidth });
    doc.moveDown();

    // --- Per anggota ---
    const memberTable = {
      title: "Tagihan Per Anggota",
      headers: [
        "Nama",
        "List Pesanan",
        "Total Pesanan",
        "Tax/Pajak",
        "Biaya Layanan",
        "Hemat",
        "Total Bayar"
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
          `Rp ${formatMoney(b.tax)}`,
          `Rp ${formatMoney(b.charge)}`,
          `Rp ${formatMoney(b.discount)}`,
          `Rp ${formatMoney(b.total)}`,
        ];
      }),
    };

    // columnsSize: semi-dinamis → Nama & angka fixed, List Pesanan fleksibel
    const memberColumns = [
      50,                               // Nama
      pageWidth - 360, // sisa untuk List Pesanan
      60, 60, 60, 60, 70                // kolom angka
    ];

    doc.table(memberTable, { width: pageWidth, columnsSize: memberColumns });
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

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
