import { addItem } from "./data/pantryStore.js";
import { createWorker } from "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js";

const ticketInput = document.getElementById("ticketInput");
const btnClearScan = document.getElementById("btnClearScan");
const btnImport = document.getElementById("btnImport");

const scanStatus = document.getElementById("scanStatus");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const scanPreview = document.getElementById("scanPreview");
const ticketPreviewImg = document.getElementById("ticketPreviewImg");

const scanResults = document.getElementById("scanResults");
const itemsPreviewList = document.getElementById("itemsPreviewList");
const rawOcrText = document.getElementById("rawOcrText");

const importMessage = document.getElementById("importMessage");

let parsedItems = [];

function showMessage(type, text) {
    importMessage.textContent = text;
    importMessage.className = `import-message ${type}`;
    importMessage.hidden = false;
}

function clearMessage() {
    importMessage.hidden = true;
}

function resetScan() {
    parsedItems = [];
    scanStatus.hidden = true;
    scanPreview.hidden = true;
    scanResults.hidden = true;
    btnImport.disabled = true;
    btnClearScan.disabled = true;
    clearMessage();
}

btnClearScan.addEventListener("click", resetScan);

ticketInput.addEventListener("change", async (e) => {
    resetScan();

    const file = e.target.files[0];
    if (!file) return;

    btnClearScan.disabled = false;

    ticketPreviewImg.src = URL.createObjectURL(file);
    scanPreview.hidden = false;

    scanStatus.hidden = false;
    progressText.textContent = "OCR bezig…";
    progressBar.style.width = "10%";

    try {
        const worker = await createWorker("eng", 1, {
            logger: m => {
                if (m.progress) {
                    progressBar.style.width = `${Math.round(m.progress * 100)}%`;
                }
            }
        });

        const result = await worker.recognize(file);
        await worker.terminate();

        rawOcrText.textContent = result.data.text;

        parsedItems = result.data.text
            .split("\n")
            .filter(l => l.match(/\d+[,.]\d{2}/))
            .map(l => ({
                name: l.replace(/\d+[,.]\d{2}.*/, "").trim(),
                quantity: 1,
                unit: "stuk",
                price: Number(l.match(/\d+[,.]\d{2}/)[0].replace(",", "."))
            }));

        itemsPreviewList.innerHTML = "";
        parsedItems.forEach(it => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${it.name}</span><span class="price">€ ${it.price.toFixed(2)}</span>`;
            itemsPreviewList.appendChild(li);
        });

        scanResults.hidden = false;
        btnImport.disabled = parsedItems.length === 0;

    } catch {
        showMessage("error", "❌ Er liep iets mis bij het uitlezen van het kasticket.");
    }
});

btnImport.addEventListener("click", () => {
    if (parsedItems.length === 0) {
        showMessage("error", "❌ Geen items om te importeren.");
        return;
    }

    try {
        parsedItems.forEach(it => addItem(it));
        showMessage("success", `✅ Succes! ${parsedItems.length} item(s) toegevoegd.`);
        btnImport.disabled = true;
    } catch {
        showMessage("error", "❌ Items konden niet worden opgeslagen.");
    }
});