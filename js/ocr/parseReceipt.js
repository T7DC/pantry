// Heel eenvoudige heuristiek:
// - zoekt lijnen die eindigen met een prijs (bv "1,49" of "2.50" of "€ 3,10")
// - filtert typische totalen/BTW regels weg

const IGNORE_KEYWORDS = [
    "totaal", "total", "subtotaal", "subtotal", "btw", "tax", "wisselgeld",
    "cash", "kaart", "bancontact", "visa", "mastercard", "korting", "discount"
];

function looksLikeIgnoreLine(lineLower) {
    return IGNORE_KEYWORDS.some(k => lineLower.includes(k));
}

function parsePrice(line) {
    // match laatste bedrag in de lijn
    const m = line.match(/(?:€\s*)?(\d{1,3}(?:[.,]\d{2}))/g);
    if (!m) return null;

    const last = m[m.length - 1].replace("€", "").trim();
    const normalized = last.replace(",", ".");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
}

export function parseReceiptTextToItems(text) {
    const lines = text
        .split("\n")
        .map(l => l.replace(/\s+/g, " ").trim())
        .filter(Boolean);

    const items = [];

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (looksLikeIgnoreLine(lower)) continue;

        const price = parsePrice(line);
        if (price == null) continue;

        // Naam = lijn zonder prijsdeel
        let name = line.replace(/(?:€\s*)?\d{1,3}(?:[.,]\d{2})\s*$/, "").trim();
        name = name.replace(/\s{2,}/g, " ").trim();

        // simpele sanity check
        if (name.length < 2) continue;

        items.push({
            name,
            quantity: 1,
            unit: "stuk",
            price
        });
    }

    // de-dup: dezelfde naam+prijs naast elkaar (OCR kan dubbel lezen)
    const seen = new Set();
    return items.filter(it => {
        const key = `${it.name}__${it.price}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
