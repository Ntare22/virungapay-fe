"use client";

import { useEffect, useRef, useState } from "react";

export type QrSheet = {
  title: string;
  username: string;
  currency: string;
};

export function WalletQrSheet({ wallet, onClose }: { wallet: QrSheet; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancel = false;
    setReady(false);
    setNotice("");
    drawWalletQr(canvas, walletQrPayload(wallet.username))
      .then(() => {
        if (!cancel) setReady(true);
      })
      .catch(() => {
        if (!cancel) setNotice("The code could not be drawn.");
      });
    return () => {
      cancel = true;
    };
  }, [wallet.username]);

  async function onDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    setSaving(true);
    setNotice("");
    try {
      await downloadWalletQrPdf(canvas, wallet);
    } catch {
      setNotice("The PDF could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1C2416]/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-qr-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md border-2 border-[#1C2416] bg-white p-6 shadow-[6px_6px_0_#E2B15A]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="wallet-qr-title" className="text-lg font-medium">{wallet.title}</h2>
            <p className="mt-1 font-mono text-sm text-[#1F4D3A]">@{wallet.username}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
            ×
          </button>
        </div>
        <p className="mt-3 text-sm text-[#6c757d]">Scan this code to send {wallet.currency} to this wallet.</p>
        <div className="mt-4 grid justify-items-center border-2 border-[#1C2416] p-4">
          <canvas ref={canvasRef} className="h-64 w-64" role="img" aria-label={`QR code for @${wallet.username}`} />
        </div>
        {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
        <button
          type="button"
          onClick={onDownload}
          disabled={!ready || saving}
          className="mt-4 h-12 w-full border-2 border-[#1C2416] bg-[#E2B15A] text-sm font-bold uppercase text-[#1C2416] disabled:opacity-60"
        >
          {saving ? "Saving" : "Download PDF"}
        </button>
      </div>
    </div>
  );
}

function walletQrPayload(username: string) {
  return `virungapay://pay/${username.trim().replace(/^@/, "").toLowerCase()}`;
}

const forest = "#1F4D3A";

async function drawWalletQr(canvas: HTMLCanvasElement, payload: string) {
  const QR = await import("qrcode");
  const symbol = QR.create(payload, { errorCorrectionLevel: "H" });
  const count = symbol.modules.size;
  const quiet = 2;
  const cell = 10;
  const full = (count + quiet * 2) * cell;
  const scale = 3;
  canvas.width = full * scale;
  canvas.height = full * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, full, full);
  ctx.fillStyle = forest;

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!symbol.modules.get(row, col) || inFinder(row, col, count)) continue;
      ctx.beginPath();
      ctx.arc((col + quiet) * cell + cell / 2, (row + quiet) * cell + cell / 2, cell * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFinder(ctx, quiet * cell, quiet * cell, cell);
  drawFinder(ctx, (count - 7 + quiet) * cell, quiet * cell, cell);
  drawFinder(ctx, quiet * cell, (count - 7 + quiet) * cell, cell);

  const logoModules = 9;
  const logoStart = Math.floor((count - logoModules) / 2);
  const box = logoModules * cell;
  const origin = (logoStart + quiet) * cell;
  const pad = cell * 1.2;
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, origin - pad, origin - pad, box + pad * 2, box + pad * 2, cell * 1.3);
  ctx.fill();

  const image = await loadLogo();
  const inset = cell * 0.2;
  ctx.save();
  roundedRect(ctx, origin + inset, origin + inset, box - inset * 2, box - inset * 2, cell * 1.1);
  ctx.clip();
  ctx.drawImage(image, origin + inset, origin + inset, box - inset * 2, box - inset * 2);
  ctx.restore();
}

function inFinder(row: number, col: number, count: number) {
  const top = row < 7;
  const left = col < 7;
  const bottom = row >= count - 7;
  const right = col >= count - 7;
  return (top && left) || (top && right) || (bottom && left);
}

function drawFinder(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number) {
  ctx.fillStyle = forest;
  roundedRect(ctx, x, y, cell * 7, cell * 7, cell * 1.6);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, x + cell, y + cell, cell * 5, cell * 5, cell * 1.1);
  ctx.fill();
  ctx.fillStyle = forest;
  roundedRect(ctx, x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.8);
  ctx.fill();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const curve = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + curve, y);
  ctx.arcTo(x + width, y, x + width, y + height, curve);
  ctx.arcTo(x + width, y + height, x, y + height, curve);
  ctx.arcTo(x, y + height, x, y, curve);
  ctx.arcTo(x, y, x + width, y, curve);
  ctx.closePath();
}

function loadLogo() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("logo"));
    image.src = "/icon-512.png";
  });
}

async function downloadWalletQrPdf(canvas: HTMLCanvasElement, wallet: QrSheet) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a5" });
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(31, 77, 58);
  pdf.rect(0, 0, width, 72, "F");
  pdf.setTextColor(246, 241, 231);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("VirungaPay", 36, 44);

  pdf.setTextColor(28, 36, 22);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  const title = pdf.splitTextToSize(wallet.title, width - 72);
  pdf.text(title, 36, 108);
  const afterTitle = 108 + title.length * 20;

  pdf.setFont("courier", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(31, 77, 58);
  pdf.text(`@${wallet.username}`, 36, afterTitle);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(28, 36, 22);
  pdf.text(`${wallet.currency} wallet`, 36, afterTitle + 18);

  const size = 250;
  const imageY = afterTitle + 40;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", (width - size) / 2, imageY, size, size);
  pdf.setFontSize(11);
  pdf.text(`Scan to send ${wallet.currency} to this wallet.`, width / 2, imageY + size + 28, { align: "center" });
  pdf.save(`${wallet.username}-qr.pdf`);
}
