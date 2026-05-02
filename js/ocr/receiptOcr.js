import { createWorker } from "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js";

let workerPromise = null;

/**
 * Herbruik één worker voor betere performance.
 * Tesseract.js adviseert ook om een worker te hergebruiken voor meerdere images. [4](https://github.com/naptha/tesseract.js/)
 */
async function getWorker(onProgress) {
    if (!workerPromise) {
        workerPromise = (async () => {
            const worker = await createWorker("eng", 1, {
                logger: m => {
                    // m.progress is 0..1 bij herkenning
                    if (onProgress && typeof m.progress === "number") {
                        onProgress(m);
                    }
                }
            });
            return worker;
        })();
    }
    return workerPromise;
}

/**
 * OCR een image File (van <input type="file">)
 */
export async function ocrReceiptImage(file, onProgress) {
    const worker = await getWorker(onProgress);
    const result = await worker.recognize(file);
    return result?.data?.text ?? "";
}