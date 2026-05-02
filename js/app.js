import { addItem } from "./data/pantryStore.js";
import { ocrReceiptImage } from "./ocr/receiptOcr.js";
import { parseReceiptTextToItems } from "./ocr/parseReceipt.js";

const btnScan = document.getElementById("btnScan");
const btnClearScan = document.getElementById("btnClearScan");
const ticketInput = document.getElementById("ticketInput");

const scanStatus = document.getElementById("scanStatus");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const scanPreview = document.getElementById("scanPreview");
const ticketPreviewImg = document.getElementById("ticketPreviewImg");

const scanResults = document.getElementById("scanResults");
const itemsPreviewList = document.getElementById("itemsPreviewList");
const rawOcrText = document.getElementById("rawOcrText");

const btnImport = document.getElementById("btnImport");

let parsedItems = [];
let lastOcrText = "";

function setProgress(pct, label) {
    progressBar.style.width = `${pct}%`;
    progressText.textContent = label;
}

function resetScan() {
    parsedItems = [];
    lastOcrText = "";
    itemsPreviewList.innerHTML = "";
    rawOcrText.textContent = "";
    btnImport.disabled = true;

    scanStatus.hidden = true;
    scanPreview.hidden = true;
    scanResults.hidden = true;

    btnClearScan.disabled = true;
    ticketInput.value = "";
}

btnScan.addEventListener("click", () => {
    ticketInput.click();
});

btnClearScan.addEventListener("click", resetScan);

ticketInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    btnClearScan.disabled = false;

    // Preview image
    const url = URL.createObjectURL(file);
    ticketPreviewImg.src = url;
    scanPreview.hidden = false;

    // OCR progress UI
    scanStatus.hidden = false;
    setProgress(1, "OCR gestart…");

    // OCR
    lastOcrText = await ocrReceiptImage(file, (m) => {
        // m.status: 'recognizing text' etc.
        const pct = Math.round((m.progress ?? 0) * 100);
        setProgress(Math.max(2, pct), `${m.status ?? "OCR…"} (${pct}%)`);
    });

    setProgress(100, "OCR klaar. Parsing…");

    rawOcrText.textContent = lastOcrText;

    // Parse into items
    parsedItems = parseReceiptTextToItems(lastOcrText);

    // Render preview list
    itemsPreviewList.innerHTML = "";
    for (const it of parsedItems) {
        const li = document.createElement("li");
        li.innerHTML = `
      <span class="name">${escapeHtml(it.name)}</span>
      <span class="price">€ ${it.price.toFixed(2)}</span>
    `;
        itemsPreviewList.appendChild(li);
    }

    scanResults.hidden = false;
    btnImport.disabled = parsedItems.length === 0;

    setProgress(100, parsedItems.length
        ? `Klaar: ${parsedItems.length} item(s) gevonden.`
        : `Geen items gevonden. Probeer een scherpere foto.`
    );
});

btnImport.addEventListener("click", () => {
    const today = new Date().toISOString().slice(0, 10);

    for (const it of parsedItems) {
        addItem({
            name: it.name,
            quantity: it.quantity,
            unit: it.unit,
            price: it.price,
            purchaseDate: today,
            category: "Kasticket"
        });
    }

    btnImport.disabled = true;
    setProgress(100, `Geïmporteerd: ${parsedItems.length} item(s) toegevoegd aan Pantry (local storage).`);
});

function escapeHtml(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

// init
resetScan();