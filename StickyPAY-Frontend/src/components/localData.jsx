// ─── Local Data Layer ───────────────────────────────────────────────
// Replaces Base44 SDK / database with localStorage-only storage

const KEYS = {
    ORDERS: 'sp_orders',
    CART: 'stickyPayCart',
    USER: 'sp_user',
    PAYMENT_METHODS: 'sp_payment_methods',
    NOTIFICATIONS: 'sp_notifications',
    WALLET: 'sp_wallet',
    PIN: 'sp_pin',
    TOKENS: 'sp_tokens',
};

// ── User ──────────────────────────────────────────────────────────────
export const getUser = () => {
    const saved = localStorage.getItem(KEYS.USER);
    if (saved) return JSON.parse(saved);
    return { full_name: 'Guest User', email: 'guest@stickypay.app', phone: '' };
};

export const saveUser = (data) => {
    const current = getUser();
    const updated = { ...current, ...data };
    localStorage.setItem(KEYS.USER, JSON.stringify(updated));
    return updated;
};

// ── Orders ────────────────────────────────────────────────────────────
export const getOrders = () => {
    const saved = localStorage.getItem(KEYS.ORDERS);
    return saved ? JSON.parse(saved) : [];
};

export const verifyOrder = (orderId) => {
    const orders = getOrders();
    const updated = orders.map(o =>
        o.id === orderId ? { ...o, status: 'verified', verified_date: new Date().toISOString() } : o
    );
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(updated));
    // Dispatch storage event so other tabs/components can react
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS.ORDERS }));
    return updated.find(o => o.id === orderId);
};

export const saveOrder = (orderData) => {
    const orders = getOrders();
    const newOrder = {
        ...orderData,
        id: 'SP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        created_date: new Date().toISOString(),
        status: 'paid',
        qr_code_data: 'TXN-' + Date.now(),
    };
    orders.unshift(newOrder);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
};

// ── Cart ──────────────────────────────────────────────────────────────
export const getCart = () => {
    const saved = localStorage.getItem(KEYS.CART);
    return saved ? JSON.parse(saved) : null;
};

export const saveCart = (data) => {
    localStorage.setItem(KEYS.CART, JSON.stringify(data));
};

export const clearCart = () => {
    localStorage.removeItem(KEYS.CART);
};

// ── Payment Methods ───────────────────────────────────────────────────
export const getPaymentMethods = () => {
    const saved = localStorage.getItem(KEYS.PAYMENT_METHODS);
    if (saved) return JSON.parse(saved);
    return [
        { id: 'card1', name: 'HDFC Credit Card', last4: '4242', type: 'card', isDefault: true },
        { id: 'upi1', name: 'UPI (GPay)', upiId: 'user@okicici', type: 'upi', isDefault: false },
    ];
};

export const savePaymentMethods = (methods) => {
    localStorage.setItem(KEYS.PAYMENT_METHODS, JSON.stringify(methods));
};

// ── Notifications ─────────────────────────────────────────────────────
export const getNotifications = () => {
    const saved = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (saved) return JSON.parse(saved);
    return [
        { id: '1', title: 'Payment Successful', message: 'Your payment of ₹450 was successful.', time: '2 hours ago', read: false },
        { id: '2', title: 'New Offer Available', message: 'Get 20% off on your next purchase at any store.', time: '1 day ago', read: false },
        { id: '3', title: 'Welcome to StickyPAY!', message: 'Start scanning products and enjoy hassle-free checkout.', time: '3 days ago', read: true },
    ];
};

export const markNotificationRead = (id) => {
    const notifs = getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
};

export const markAllNotificationsRead = () => {
    const notifs = getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    return notifs;
};

// ── Wallet ─────────────────────────────────────────────────────────────
export const getWallet = () => {
    const saved = localStorage.getItem(KEYS.WALLET);
    if (saved) return JSON.parse(saved);
    return { balance: 0, transactions: [] };
};

export const addWalletBalance = (amount) => {
    const wallet = getWallet();
    const updated = {
        balance: wallet.balance + amount,
        transactions: [
            { id: Date.now(), type: 'credit', amount, note: 'Added to wallet', date: new Date().toISOString() },
            ...wallet.transactions,
        ],
    };
    localStorage.setItem(KEYS.WALLET, JSON.stringify(updated));
    return updated;
};

export const deductWalletBalance = (amount, note = 'Payment') => {
    const wallet = getWallet();
    if (wallet.balance < amount) return null;
    const updated = {
        balance: wallet.balance - amount,
        transactions: [
            { id: Date.now(), type: 'debit', amount, note, date: new Date().toISOString() },
            ...wallet.transactions,
        ],
    };
    localStorage.setItem(KEYS.WALLET, JSON.stringify(updated));
    return updated;
};

// ── PIN ───────────────────────────────────────────────────────────────
export const getPin = () => localStorage.getItem(KEYS.PIN) || null;
export const savePin = (pin) => localStorage.setItem(KEYS.PIN, pin);
export const verifyPin = (pin) => localStorage.getItem(KEYS.PIN) === pin;

// ── Tokens (Rewards) ──────────────────────────────────────────────────
export const getTokens = () => {
    const saved = localStorage.getItem(KEYS.TOKENS);
    if (saved) return JSON.parse(saved);
    return { total: 0, history: [] };
};

export const awardTokens = (orderId, amount) => {
    const tokens = getTokens();
    // Random between 0.01 and 10
    const earned = parseFloat((Math.random() * 9.99 + 0.01).toFixed(2));
    const updated = {
        total: parseFloat((tokens.total + earned).toFixed(2)),
        history: [
            { id: Date.now(), orderId, earned, date: new Date().toISOString() },
            ...tokens.history,
        ],
    };
    localStorage.setItem(KEYS.TOKENS, JSON.stringify(updated));
    return { updated, earned };
};

export const redeemTokens = (amount) => {
    const tokens = getTokens();
    const redeem = Math.min(amount, tokens.total);
    const updated = {
        total: parseFloat((tokens.total - redeem).toFixed(2)),
        history: [
            { id: Date.now(), orderId: null, earned: -redeem, date: new Date().toISOString() },
            ...tokens.history,
        ],
    };
    localStorage.setItem(KEYS.TOKENS, JSON.stringify(updated));
    return redeem;
};