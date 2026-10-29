import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Standard PDF fonts only cover Western characters. Anything else is replaced with "?"
// so one odd character can't make the whole download fail.
function makeSafe(font) {
  return (text) =>
    String(text ?? "")
      .replace(/[\r\n\t]+/g, " ")
      .split("")
      .map((ch) => {
        try {
          font.widthOfTextAtSize(ch, 10);
          return ch;
        } catch {
          return "?";
        }
      })
      .join("");
}

function wrap(font, size, text, maxWidth) {
  const words = text.split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      // a single very long word: hard-cut it
      let rest = w;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let n = rest.length;
        while (n > 1 && font.widthOfTextAtSize(rest.slice(0, n), size) > maxWidth) n--;
        lines.push(rest.slice(0, n));
        rest = rest.slice(n);
      }
      line = rest;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/**
 * staffList: [{ name, role, days: [{ label, weekday, isWeekend, kind, shiftName, time, duties }] }]
 * One section (starting on a new page) per staff member.
 */
export async function buildSchedulePdf({ propertyName, monthLabel, staffList }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const safe = makeSafe(regular);

  const W = 595.28, H = 841.89, M = 40;
  const ink = rgb(0.07, 0.09, 0.13), muted = rgb(0.42, 0.45, 0.5), line = rgb(0.85, 0.87, 0.9);
  const COLS = [
    { key: "date", x: M, w: 52, title: "Date" },
    { key: "weekday", x: M + 52, w: 34, title: "Day" },
    { key: "shiftName", x: M + 86, w: 78, title: "Shift" },
    { key: "time", x: M + 164, w: 104, title: "Time" },
    { key: "duties", x: M + 268, w: W - M - (M + 268), title: "Duties" },
  ];
  const FS = 8.5, LH = 11;
  const generated = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  const pages = [];
  const newPage = () => {
    const p = pdf.addPage([W, H]);
    pages.push(p);
    return p;
  };

  if (staffList.length === 0) {
    const p = newPage();
    p.drawText(safe(`${propertyName} - ${monthLabel}`), { x: M, y: H - M - 20, size: 16, font: bold, color: ink });
    p.drawText("No staff to show.", { x: M, y: H - M - 44, size: 10, font: regular, color: muted });
  }

  for (const staff of staffList) {
    let page = newPage();
    let y = H - M;

    const drawHeader = (first) => {
      if (first) {
        page.drawText(safe(`Duty roster - ${monthLabel}`), { x: M, y: y - 16, size: 17, font: bold, color: ink });
        y -= 38;
        page.drawText(safe(staff.name), { x: M, y: y - 4, size: 13, font: bold, color: ink });
        page.drawText(safe(`${staff.role}  |  ${propertyName}`), { x: M, y: y - 19, size: 9.5, font: regular, color: muted });
        y -= 34;

        const count = (k) => staff.days.filter((d) => d.kind === k).length;
        const summary = `Working days: ${count("WORK")}    Week offs: ${count("OFF")}    Leave: ${count("LEAVE")}    Not scheduled: ${staff.days.filter((d) => !d.kind).length}`;
        page.drawText(summary, { x: M, y: y - 2, size: 9, font: regular, color: ink });
        y -= 20;
      }
      page.drawRectangle({ x: M, y: y - 18, width: W - 2 * M, height: 18, color: rgb(0.9, 0.92, 0.95) });
      for (const c of COLS) page.drawText(c.title, { x: c.x + 4, y: y - 12.5, size: 8.5, font: bold, color: ink });
      y -= 18;
    };
    drawHeader(true);

    staff.days.forEach((d) => {
      const dutiesLines = wrap(regular, FS, safe(d.duties || ""), COLS[4].w - 8);
      const rowH = Math.max(1, dutiesLines.length) * LH + 7;

      if (y - rowH < M + 24) {
        page = newPage();
        y = H - M;
        drawHeader(false);
      }

      if (d.isWeekend) page.drawRectangle({ x: M, y: y - rowH, width: W - 2 * M, height: rowH, color: rgb(0.97, 0.97, 0.99) });
      page.drawLine({ start: { x: M, y: y - rowH }, end: { x: W - M, y: y - rowH }, thickness: 0.4, color: line });

      const textColor = d.kind === "LEAVE" ? rgb(0.75, 0.1, 0.25) : d.kind === "OFF" || !d.kind ? muted : ink;
      const ty = y - 11;
      page.drawText(safe(d.label), { x: COLS[0].x + 4, y: ty, size: FS, font: regular, color: ink });
      page.drawText(safe(d.weekday), { x: COLS[1].x + 4, y: ty, size: FS, font: regular, color: ink });
      page.drawText(safe(d.shiftName || "Not scheduled"), { x: COLS[2].x + 4, y: ty, size: FS, font: d.kind === "WORK" ? bold : regular, color: textColor });
      page.drawText(safe(d.time || ""), { x: COLS[3].x + 4, y: ty, size: FS, font: regular, color: textColor });
      dutiesLines.forEach((ln, li) => page.drawText(ln, { x: COLS[4].x + 4, y: ty - li * LH, size: FS, font: regular, color: ink }));
      y -= rowH;
    });
  }

  pages.forEach((p, i) => {
    p.drawText(safe(`Generated ${generated}  |  Hotelynk`), { x: M, y: 22, size: 8, font: regular, color: muted });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: W - M - regular.widthOfTextAtSize(label, 8), y: 22, size: 8, font: regular, color: muted });
  });

  return pdf.save();
}
