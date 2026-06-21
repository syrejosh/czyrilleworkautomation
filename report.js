// ── Czyrille's Automations — Report Module ─────────────

// ── State ───────────────────────────────────────────────
let photos  = []; // { dataUrl, name, time }
let fmt     = 'docx';
let showSignatories = true;

// ── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date
  const dateInput = document.getElementById('f-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Sync initial checkbox state
  const sigCheck = document.getElementById('show-signatories');
  if (sigCheck) showSignatories = sigCheck.checked;

  // Photo upload
  const zone  = document.getElementById('upload-zone');
  const input = document.getElementById('photo-input');
  
  if (zone && input) {
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', ()=> zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', e => { handleFiles(e.target.files); e.target.value = ''; });
  }

  const grid = document.getElementById('photo-grid');
  if (grid) {
    grid.addEventListener('dragstart', onPhotoDragStart);
    grid.addEventListener('dragover',  onPhotoDragOver);
    grid.addEventListener('drop',      onPhotoDrop);
    grid.addEventListener('dragend',   onPhotoDragEnd);
  }

  renderRecents();
  livePreview();
});

// ── Page routing ─────────────────────────────────────────
function setPage(page, el) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = page === 'reports' ? 'Work Report' : page;
}

// ── Format toggle ────────────────────────────────────────
function setFormat(f) {
  fmt = f;
  const docxOpt = document.getElementById('opt-docx');
  const pdfOpt = document.getElementById('opt-pdf');
  if (docxOpt) docxOpt.classList.toggle('active', f === 'docx');
  if (pdfOpt) pdfOpt.classList.toggle('active',  f === 'pdf');
}

function toggleSignatories(checked) {
  showSignatories = checked;
  const sigBody = document.getElementById('signatories-body');
  const docSig = document.getElementById('doc-sig-section');
  if (sigBody) sigBody.classList.toggle('is-hidden', !checked);
  if (docSig) docSig.classList.toggle('is-hidden', !checked);
}

// ── Photo handling ───────────────────────────────────────
let dragPhotoIndex = null;

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      photos.push({ dataUrl: e.target.result, name: file.name, time: '' });
      renderPhotos();
      livePreview();
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto(i) {
  photos.splice(i, 1);
  renderPhotos();
  livePreview();
}

function setPhotoTime(i, val) {
  photos[i].time = val;
  livePreview();
}

function movePhoto(from, to) {
  if (from === to) return;
  const [photo] = photos.splice(from, 1);
  photos.splice(to, 0, photo);
  renderPhotos();
  livePreview();
}

function clearAllPhotos() {
  if (!photos.length) return;
  photos = [];
  renderPhotos();
  livePreview();
}

function onPhotoDragStart(e) {
  const item = e.target.closest('.photo-item');
  if (!item || e.target.closest('input, button')) return;
  dragPhotoIndex = parseInt(item.dataset.index, 10);
  item.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragPhotoIndex));
}

function onPhotoDragOver(e) {
  const item = e.target.closest('.photo-item');
  if (!item) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.photo-item.drag-over').forEach(el => el.classList.remove('drag-over'));
  item.classList.add('drag-over');
}

function onPhotoDrop(e) {
  e.preventDefault();
  const item = e.target.closest('.photo-item');
  if (!item || dragPhotoIndex === null) return;
  movePhoto(dragPhotoIndex, parseInt(item.dataset.index, 10));
}

function onPhotoDragEnd() {
  dragPhotoIndex = null;
  document.querySelectorAll('.photo-item').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
}

function renderPhotos() {
  const grid     = document.getElementById('photo-grid');
  const count    = document.getElementById('photo-count');
  const clearBtn = document.getElementById('clear-photos-btn');
  if (!grid) return;
  
  grid.innerHTML = '';

  photos.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'photo-item';
    div.draggable = true;
    div.dataset.index = i;
    div.innerHTML = `
      <div class="photo-drag-handle" title="Drag to reorder">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>
          <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
          <circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
        </svg>
      </div>
      <img class="photo-thumb" src="${p.dataUrl}" alt="Photo ${i + 1}" draggable="false" />
      <div class="photo-meta">
        <input type="time" value="${p.time}" placeholder="Time taken"
          onchange="setPhotoTime(${i}, this.value)"
          title="Time this photo was taken" />
        <button class="btn-icon" onclick="removePhoto(${i})" title="Remove photo">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M3 3l10 10M13 3L3 13"/>
          </svg>
        </button>
      </div>
    `;
    grid.appendChild(div);
  });

  if (count && clearBtn) {
    if (photos.length) {
      count.textContent = `${photos.length} photo${photos.length > 1 ? 's' : ''} · drag to reorder`;
      clearBtn.hidden = false;
    } else {
      count.textContent = '';
      clearBtn.hidden = true;
    }
  }
}

// ── Live preview ─────────────────────────────────────────
function livePreview() {
  const v = getValues();

  const nameEl = document.getElementById('dv-name');
  const purposeEl = document.getElementById('dv-purpose');
  const descEl = document.getElementById('dv-desc');
  const empEl = document.getElementById('dv-emp');
  const mgrEl = document.getElementById('dv-mgr');
  const badgeEl = document.getElementById('doc-date-badge');

  if (nameEl) nameEl.textContent    = v.name    || '—';
  if (purposeEl) purposeEl.textContent = v.purpose || '—';
  if (descEl) descEl.textContent    = v.desc    || '—';
  if (empEl) empEl.textContent     = v.emp     || 'Employee Name';
  if (mgrEl) mgrEl.textContent     = v.mgr     || 'Manager Name';

  if (badgeEl) {
    badgeEl.innerHTML = `Date: ${fmtDate(v.date)}<br/>Time In: ${fmtTime(v.timeIn)}<br/>Time Out: ${fmtTime(v.timeOut)}`;
  }

  const section = document.getElementById('doc-photos-section');
  const pgrid   = document.getElementById('doc-photo-grid');
  if (!pgrid || !section) return;
  
  pgrid.innerHTML = '';

  if (photos.length > 0) {
    section.classList.remove('is-hidden');
    photos.forEach(p => {
      const cell = document.createElement('div');
      cell.className = 'doc-photo-cell';
      cell.innerHTML = `
        <img src="${p.dataUrl}" alt="" />
        ${p.time ? `<div class="doc-photo-time">📷 ${fmtTime(p.time)}</div>` : ''}
      `;
      pgrid.appendChild(cell);
    });
  } else {
    section.classList.add('is-hidden');
  }
}

// ── Get form values ──────────────────────────────────────
function getValues() {
  const n = document.getElementById('f-name');
  const d = document.getElementById('f-date');
  const ti = document.getElementById('f-timein');
  const to = document.getElementById('f-timeout');
  const p = document.getElementById('f-purpose');
  const ds = document.getElementById('f-desc');
  const e = document.getElementById('f-emp');
  const m = document.getElementById('f-mgr');

  return {
    name:    n ? n.value.trim() : '',
    date:    d ? d.value : '',
    timeIn:  ti ? ti.value : '',
    timeOut: to ? to.value : '',
    purpose: p ? p.value.trim() : '',
    desc:    ds ? ds.value.trim() : '',
    emp:     e ? e.value.trim() : '',
    mgr:     m ? m.value.trim() : '',
  };
}

// ── Generate ─────────────────────────────────────────────
async function generate() {
  const v = getValues();
  if (!v.name) { showToast('Please enter a name.', 'error'); return; }

  const btn = document.getElementById('gen-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating…';
  }

  try {
    if (fmt === 'docx') await generateDocx(v);
    else await generatePdf(v);

    saveRecent({
      id:      Date.now(),
      name:    v.name,
      date:    v.date,
      purpose: v.purpose,
      fmt,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    });
    renderRecents();
    showToast('Downloaded successfully!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Something went wrong.', 'error');
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 2v9M5 8l3 3 3-3M3 13h10"/></svg> Download`;
  }
}

// ── DOCX export ───────────────────────────────────────────
async function generateDocx(v) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
          WidthType, AlignmentType, BorderStyle, ImageRun, TableLayoutType } = docx;

  const noBorder = {
    top:    { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left:   { style: BorderStyle.NONE },
    right:  { style: BorderStyle.NONE },
  };

  const accentColor = 'B8860B';
  const grayColor   = '71717A';

  const labelPara = (text) => new Paragraph({
    children: [new TextRun({ text, font: 'Calibri', size: 16, color: 'A1A1AA', bold: true })],
    spacing: { before: 120, after: 20 },
  });

  const valuePara = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text: text || '—', font: 'Calibri', size: 20, ...opts })],
    spacing: { after: 60 },
  });

  const titleBlock = [
    new Paragraph({
      children: [
        new TextRun({ text: " ", font: 'Calibri', size: 16, color: 'A1A1AA' }),
        new TextRun({ text: '|  WORK REPORT', font: 'Calibri', size: 28, bold: true, color: accentColor }),
      ],
      spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor } },
      spacing: { after: 240 },
      children: [],
    }),
  ];

  const infoGrid = [
    labelPara('Name'), valuePara(v.name, { bold: true }),
    labelPara('Date'), valuePara(fmtDate(v.date)),
    labelPara('Time In'), valuePara(fmtTime(v.timeIn)),
    labelPara('Time Out'), valuePara(fmtTime(v.timeOut)),
    labelPara('Purpose of Work'), valuePara(v.purpose),
    labelPara('Description'), valuePara(v.desc),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E4E4E7' } }, spacing: { before: 120, after: 200 }, children: [] }),
  ];

  const photoRows = [];
  if (photos.length > 0) {
    photoRows.push(new Paragraph({
      children: [new TextRun({ text: 'Photos', font: 'Calibri', size: 22, bold: true, color: accentColor })],
      spacing: { after: 120 },
    }));

    for (let i = 0; i < photos.length; i += 2) {
      const cells = [];
      for (let j = 0; j < 2; j++) {
        const idx = i + j;
        const content = [];

        if (idx < photos.length) {
          const p    = photos[idx];
          const b64  = p.dataUrl.split(',')[1];
          const bin  = atob(b64);
          const buf  = new Uint8Array(bin.length);
          for (let k = 0; k < bin.length; k++) buf[k] = bin.charCodeAt(k);
          const mime = (p.dataUrl.match(/data:image\/(\w+);/) || [])[1] || 'png';
          const type = mime === 'jpeg' ? 'jpg' : mime;

          content.push(new Paragraph({
            children: [new ImageRun({ data: buf.buffer, transformation: { width: 240, height: 180 }, type })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }));

          if (p.time) {
            content.push(new Paragraph({
              children: [new TextRun({ text: `📷 ${fmtTime(p.time)}`, font: 'Calibri', size: 16, color: grayColor })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 0 },
            }));
          }
        } else {
          content.push(new Paragraph({ children: [] }));
        }

        cells.push(new TableCell({
          children: content,
          borders: noBorder,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
        }));
      }

      photoRows.push(new Table({
        rows: [new TableRow({ children: cells })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
      }));
      photoRows.push(new Paragraph({ children: [], spacing: { after: 80 } }));
    }

    photoRows.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E4E4E7' } },
      spacing: { before: 80, after: 200 },
      children: [],
    }));
  }

  const sigBlock = [
    new Paragraph({
      children: [new TextRun({ text: 'Signatories', font: 'Calibri', size: 22, bold: true, color: accentColor })],
      spacing: { after: 200 },
    }),
    new Table({
      rows: [new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: '________________________________', font: 'Calibri', size: 20 })], spacing: { after: 60 } }),
              new Paragraph({ children: [new TextRun({ text: v.emp || 'Employee Name', font: 'Calibri', size: 20, bold: true })], spacing: { after: 20 } }),
              new Paragraph({ children: [new TextRun({ text: 'Employee Signature', font: 'Calibri', size: 16, color: grayColor })] }),
            ],
            borders: noBorder,
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: '________________________________', font: 'Calibri', size: 20 })], spacing: { after: 60 } }),
              new Paragraph({ children: [new TextRun({ text: v.mgr || 'Manager Name', font: 'Calibri', size: 20, bold: true })], spacing: { after: 20 } }),
              new Paragraph({ children: [new TextRun({ text: "Manager's Signature", font: 'Calibri', size: 16, color: grayColor })] }),
            ],
            borders: noBorder,
          }),
        ],
      })],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: [...titleBlock, ...infoGrid, ...photoRows, ...(showSignatories ? sigBlock : [])],
    }],
  });

  const blob = await Packer.toBlob(doc);
  dlBlob(blob, `work_report_${v.date || 'undated'}.docx`);
}

// ── PDF export ────────────────────────────────────────────
async function generatePdf(v) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210, ML = 20, MR = 20;
  let y = 0;

  const checkPage = (need = 20) => {
    if (y + need > 277) { doc.addPage(); y = 20; }
  };

  // Header bar (Fixed text context from 'Offset Form' to 'Work Report')
  doc.setFillColor(184, 134, 11);
  doc.rect(0, 0, PW, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text("Czyrille's Automations", ML, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Work Report', ML, 15);

  // Date block top right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 236, 200);
  doc.text(`Date: ${fmtDate(v.date)}`, PW - MR, 9, { align: 'right' });
  doc.text(`In: ${fmtTime(v.timeIn)}  Out: ${fmtTime(v.timeOut)}`, PW - MR, 14, { align: 'right' });

  y = 28;

  const addF = (label, value) => {
    const lines = doc.splitTextToSize(value || '—', PW - ML - MR);
    checkPage(6 + lines.length * 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(161, 161, 170);
    doc.text(label.toUpperCase(), ML, y); y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(17, 17, 17);
    doc.text(lines, ML, y); y += lines.length * 5 + 4;
  };

  const divLine = () => {
    checkPage(8);
    doc.setDrawColor(228, 228, 231); doc.setLineWidth(0.3);
    doc.line(ML, y, PW - MR, y); y += 8;
  };

  addF('Name', v.name);
  addF('Purpose of Work', v.purpose);
  addF('Description', v.desc);
  divLine();

  if (photos.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.setTextColor(184, 134, 11); doc.text('Photos', ML, y); y += 6;

    const imgW = (PW - ML - MR - 8) / 2;
    const imgH = imgW * 0.75;

    for (let i = 0; i < photos.length; i += 2) {
      checkPage(imgH + 14);
      const pA = photos[i];
      const fmtA = ((pA.dataUrl.match(/data:image\/(\w+);/) || [])[1] || 'png').toUpperCase();
      doc.addImage(pA.dataUrl, fmtA === 'JPG' ? 'JPEG' : fmtA, ML, y, imgW, imgH);
      if (pA.time) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(82, 82, 91);
        doc.text(`📷 ${fmtTime(pA.time)}`, ML, y + imgH + 3);
      }
      if (i + 1 < photos.length) {
        const pB = photos[i + 1];
        const fmtB = ((pB.dataUrl.match(/data:image\/(\w+);/) || [])[1] || 'png').toUpperCase();
        doc.addImage(pB.dataUrl, fmtB === 'JPG' ? 'JPEG' : fmtB, ML + imgW + 8, y, imgW, imgH);
        if (pB.time) {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(82, 82, 91);
          doc.text(`📷 ${fmtTime(pB.time)}`, ML + imgW + 8, y + imgH + 3);
        }
      }
      y += imgH + 10;
    }
    divLine();
  }

  if (showSignatories) {
    checkPage(32);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.setTextColor(184, 134, 11); doc.text('Signatories', ML, y); y += 10;

    const colW = (PW - ML - MR - 12) / 2;
    doc.setDrawColor(50, 50, 50); doc.setLineWidth(0.5);
    doc.line(ML, y, ML + colW, y);
    doc.line(ML + colW + 12, y, ML + colW * 2 + 12, y);
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(17, 17, 17);
    doc.text(v.emp || 'Employee Name', ML, y);
    doc.text(v.mgr || 'Manager Name', ML + colW + 12, y);
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(161, 161, 170);
    doc.text('Employee Signature', ML, y);
    doc.text("Manager's Signature", ML + colW + 12, y);
  }

  doc.save(`work_report_${v.date || 'undated'}.pdf`);
}

function renderRecents() {
  const list  = getRecents();
  const badge = document.getElementById('recent-badge');
  const el    = document.getElementById('recents-list');

  if (badge) badge.textContent = list.length;
  if (!el) return;

  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><p>No reports yet today.</p></div>';
    return;
  }

  el.innerHTML = list.map((r, i) => `
    <div class="recent-item">
      <div class="recent-dot"></div>
      <div class="recent-info">
        <div class="recent-name">${r.name} — ${r.purpose || 'Work Report'}</div>
        <div class="recent-meta">${r.time} &nbsp;·&nbsp; ${r.fmt.toUpperCase()}</div>
      </div>
    </div>
  `).join('');
}

function clearRecents() {
  localStorage.removeItem(getRecentsKey());
  renderRecents();
}

function dlBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}