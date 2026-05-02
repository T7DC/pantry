const STORAGE_KEY = "pantryItems";

/* =========================
   Interne helpers
========================= */

function loadItems() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn("Pantry storage corrupt. Resetting.");
        return [];
    }
}

function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateId() {
    // Moderne browsers + iOS Safari ✅
    return crypto.randomUUID();
}

function nowISO() {
    return new Date().toISOString();
}

/* =========================
   Publieke API (CRUD)
========================= */

export function getItems() {
    return loadItems();
}

export function getItemById(id) {
    return loadItems().find(item => item.id === id) ?? null;
}

export function addItem(data) {
    if (!data) {
        throw new Error("Geen itemdata ontvangen");
    }

    if (!data.name || data.name.trim().length === 0) {
        throw new Error("Item heeft geen naam");
    }

    const quantity = Number(data.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Ongeldige hoeveelheid voor "${data.name}"`);
    }

    if (!data.unit || data.unit.trim().length === 0) {
        throw new Error(`Geen eenheid voor "${data.name}"`);
    }

    const items = loadItems();

    const item = {
        id: generateId(),
        name: data.name.trim(),
        quantity,
        unit: data.unit,
        price: Number.isFinite(Number(data.price)) ? Number(data.price) : null,
        purchaseDate: data.purchaseDate ?? null,
        expiryDate: data.expiryDate ?? null,
        category: data.category ?? null,
        createdAt: nowISO(),
        updatedAt: nowISO()
    };

    items.push(item);
    saveItems(items);

    return item;
}

export function updateItem(id, updates) {
    const items = loadItems();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    items[index] = {
        ...items[index],
        ...updates,
        updatedAt: nowISO()
    };

    saveItems(items);
    return items[index];
}

export function deleteItem(id) {
    const items = loadItems();
    const remaining = items.filter(item => item.id !== id);

    if (remaining.length === items.length) return false;

    saveItems(remaining);
    return true;
}

export function clearAllItems() {
    localStorage.removeItem(STORAGE_KEY);
}