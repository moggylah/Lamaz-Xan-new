import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { formatClock, formatMonthTitle, formatWeekday } from './date.js';
import { t } from './i18n.js';

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function ascii(text) {
  return new TextEncoder().encode(text);
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function imageBytesToPdf(jpegBytes, imageWidth, imageHeight) {
  const pageWidth = 842;
  const pageHeight = 595;
  const chunks = [];
  const offsets = [0];
  let length = 0;

  function push(chunk) {
    chunks.push(chunk);
    length += chunk.length;
  }

  function pushText(text) {
    push(ascii(text));
  }

  push(ascii('%PDF-1.4\n'));
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  function object(number, body) {
    offsets[number] = length;
    pushText(`${number} 0 obj\n${body}\nendobj\n`);
  }

  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );

  offsets[4] = length;
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  push(jpegBytes);
  pushText('\nendstream\nendobj\n');

  const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;
  object(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xrefOffset = length;
  pushText('xref\n0 6\n');
  pushText('0000000000 65535 f \n');

  for (let i = 1; i <= 5; i += 1) {
    pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }

  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return concatBytes(chunks);
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function downloadBytes(bytes, filename) {
  if (Capacitor.isNativePlatform()) {
    const saved = await Filesystem.writeFile({
      path: filename,
      data: bytesToBase64(bytes),
      directory: Directory.Cache,
    });
    await Share.share({
      title: filename,
      url: saved.uri,
      dialogTitle: filename,
    });
    return;
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const preview = window.open(url, '_blank', 'noopener,noreferrer');
  if (preview) {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let value = text;

  while (value.length > 2 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }

  return `${value}…`;
}

export async function downloadMonthlySchedulePdf({
  rows,
  year,
  month,
  timeZone,
  language,
  sourceLabel,
}) {
  const monthTitle = formatMonthTitle(year, month, language);

  const width = 2400;
  const height = 1697;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.direction = language === 'ar' ? 'rtl' : 'ltr';
  ctx.fillStyle = '#f8f5ee';
  ctx.fillRect(0, 0, width, height);

  const green = '#174f3a';
  const ink = '#203129';
  const gold = '#b88e38';
  const muted = '#7b857f';
  const paper = '#fffdf8';
  const line = '#dce1db';
  const left = 92;
  const right = width - left;

  ctx.fillStyle = green;
  ctx.fillRect(0, 0, width, 18);

  try {
    const logo = await loadImage('/lamaz-xan-logo.png');
    ctx.drawImage(logo, left, 56, 104, 104);
  } catch {
    // The wordmark remains usable if an embedded browser cannot load the image.
  }

  ctx.fillStyle = green;
  ctx.font = '600 54px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Lamaz Xan', 220, 103);
  ctx.fillStyle = gold;
  ctx.font = '700 18px Arial, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('PRAYER, THE PILLAR OF ISLAM', 223, 137);
  ctx.letterSpacing = '0px';

  ctx.textAlign = 'right';
  ctx.fillStyle = muted;
  ctx.font = '500 20px Arial, sans-serif';
  ctx.fillText(timeZone, right, 99);

  ctx.strokeStyle = '#d4c29a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, 184);
  ctx.lineTo(right, 184);
  ctx.stroke();

  ctx.fillStyle = gold;
  ctx.font = '700 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(year), width / 2, 235);
  ctx.fillStyle = ink;
  ctx.font = '600 52px Georgia, serif';
  ctx.fillText(`${t(language, 'calendar.pdfTitle')} · ${monthTitle}`, width / 2, 292);

  const prayerKeys = ['fajr', 'sunrise', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha', 'qiyam'];
  const headers = [
    t(language, 'calendar.date'),
    ...prayerKeys.map((key) => t(language, `prayer.${key}`)),
  ];

  const top = 340;
  const tableWidth = width - left * 2;
  const dateWidth = 270;
  const otherWidth = (tableWidth - dateWidth) / prayerKeys.length;
  const headerHeight = 68;
  const rowHeight = 36;
  const columnWidths = [dateWidth, ...prayerKeys.map(() => otherWidth)];

  let x = left;

  ctx.fillStyle = green;
  roundedRect(ctx, left, top, tableWidth, headerHeight, 18);
  ctx.fill();

  ctx.font = '700 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fffdf8';

  headers.forEach((header, index) => {
    const cellWidth = columnWidths[index];
    ctx.fillText(
      fitText(ctx, header, cellWidth - 22),
      x + cellWidth / 2,
      top + headerHeight / 2,
    );
    x += cellWidth;
  });

  rows.forEach((row, rowIndex) => {
    const y = top + headerHeight + rowIndex * rowHeight;
    x = left;

    const weekday = formatWeekday(row.date, timeZone, language, true);
    const isFriday = row.date.getDay() === 5;

    if (isFriday) {
      ctx.fillStyle = '#edf2ec';
      ctx.fillRect(left, y, tableWidth, rowHeight);
    } else if (rowIndex % 2 === 0) {
      ctx.fillStyle = paper;
      ctx.fillRect(left, y, tableWidth, rowHeight);
    }

    const values = [
      `${row.dateParts.day} ${weekday}`,
      ...prayerKeys.map((key) => formatClock(row.times[key], timeZone, language)),
    ];

    ctx.font = `${isFriday ? '700' : '400'} 19px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isFriday ? green : ink;

    values.forEach((value, index) => {
      const cellWidth = columnWidths[index];
      ctx.fillText(
        fitText(ctx, value, cellWidth - 16),
        x + cellWidth / 2,
        y + rowHeight / 2,
      );
      x += cellWidth;
    });

    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y + rowHeight);
    ctx.lineTo(right, y + rowHeight);
    ctx.stroke();
  });

  const footerY = top + headerHeight + rows.length * rowHeight + 54;
  ctx.fillStyle = muted;
  ctx.font = '400 18px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    `${t(language, 'prayer.qiyam')}: ${t(language, 'prayer.lastThird')}`,
    left,
    footerY,
  );

  ctx.fillStyle = ink;
  ctx.font = '600 18px Arial, sans-serif';
  ctx.fillText(sourceLabel || t(language, 'calendar.calculatedSource'), left, footerY + 35);

  ctx.textAlign = 'right';
  ctx.fillStyle = muted;
  ctx.font = '400 17px Arial, sans-serif';
  ctx.fillText('Lamaz Xan · Prayer, the pillar of Islam', right, footerY + 35);

  const jpegBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.94));
  const pdfBytes = imageBytesToPdf(jpegBytes, width, height);
  const filename = `lamaz-xan-${year}-${String(month).padStart(2, '0')}.pdf`;

  await downloadBytes(pdfBytes, filename);
}
