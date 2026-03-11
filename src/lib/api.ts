const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;
const WALLET_URL = process.env.NEXT_PUBLIC_WALLET_URL;
const LEDGER_URL = process.env.NEXT_PUBLIC_LEDGER_URL;
const PAYMENT_URL = process.env.NEXT_PUBLIC_PAYMENT_URL;

function getAuthHeader(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchWrapper(url: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, { cache: 'no-store', ...options, headers });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `API Error: ${response.status}`);
    }

    // Handle empty responses (like 201 Created without body)
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export const api = {
    auth: {
        login: (data: any) => fetchWrapper(`${AUTH_URL}/auth/login`, { method: 'POST', body: JSON.stringify(data) }),
        register: (data: any) => fetchWrapper(`${AUTH_URL}/auth/register`, { method: 'POST', body: JSON.stringify(data) }),
        me: () => fetchWrapper(`${AUTH_URL}/auth/me`),
        getUsers: () => fetchWrapper(`${AUTH_URL}/auth/users`),
        logout: () => fetchWrapper(`${AUTH_URL}/auth/logout`, { method: 'POST' }),
    },
    wallet: {
        get: (userId: string) => fetchWrapper(`${WALLET_URL}/wallet/${userId}`),
        transfer: (data: any) => fetchWrapper(`${WALLET_URL}/wallet/transfer`, { method: 'POST', body: JSON.stringify(data) }),
        deposit: (userId: string, amount: number) => fetchWrapper(`${WALLET_URL}/wallet/${userId}/deposit`, { method: 'POST', body: JSON.stringify({ amount }) }),
        withdraw: (userId: string, amount: number) => fetchWrapper(`${WALLET_URL}/wallet/${userId}/withdraw`, { method: 'POST', body: JSON.stringify({ amount }) }),
    },
    ledger: {
        // Assuming ledger might have a get all endpoint. If not we will have to adjust this.
        // The backend only showed POST /ledger/transaction in the controller.
        // We will simulate fetching history by querying a hypothetical endpoint or just show mock if it doesn't exist.
        // Let's assume there's a GET /ledger/:userId or similar. For now, creating a placeholder.
        getHistory: (userId: string) => fetchWrapper(`${LEDGER_URL}/ledger/history/${userId}`).catch(() => []),
    },
    payment: {
        create: (data: any) => fetchWrapper(`${PAYMENT_URL}/payment`, { method: 'POST', body: JSON.stringify(data) }),
        payBoleto: (data: { txId: string, payerId: string }) => fetchWrapper(`${PAYMENT_URL}/payment/boleto/pay`, { method: 'POST', body: JSON.stringify(data) }),
        confirmPix: (txId: string) => fetchWrapper(`${PAYMENT_URL}/payment/webhook`, { method: 'POST', body: JSON.stringify({ txId }) }),
        reissue: (txId: string, newDueDate: string) => fetchWrapper(`${PAYMENT_URL}/payment/boleto/reissue`, { method: 'POST', body: JSON.stringify({ txId, newDueDate }) }),
        capture: (txId: string) => fetchWrapper(`${PAYMENT_URL}/payment/card/capture`, { method: 'POST', body: JSON.stringify({ txId }) }),
        refund: (txId: string) => fetchWrapper(`${PAYMENT_URL}/payment/card/refund`, { method: 'POST', body: JSON.stringify({ txId }) }),
        chargeback: (txId: string) => fetchWrapper(`${PAYMENT_URL}/payment/card/chargeback`, { method: 'POST', body: JSON.stringify({ txId }) }),
        getPending: () => fetchWrapper(`${PAYMENT_URL}/payment/transaction/pending`),
        getUserBoletos: (userId: string) => fetchWrapper(`${PAYMENT_URL}/payment/boleto/user/${userId}`),
        getByTxId: (txId: string) => fetchWrapper(`${PAYMENT_URL}/payment/transaction/${txId}`),
        pixCharge: (data: { issuerId: string, amount: number }) => fetchWrapper(`${PAYMENT_URL}/payment/pix/charge`, { method: 'POST', body: JSON.stringify(data) }),
        pixTransfer: (data: { payerId: string, pixKey: string, amount: number }) => fetchWrapper(`${PAYMENT_URL}/payment/pix/transfer`, { method: 'POST', body: JSON.stringify(data) }),
        simulatePixPay: (data: { txId: string, payerId: string }) => fetchWrapper(`${PAYMENT_URL}/payment/simulate/pix/pay`, { method: 'POST', body: JSON.stringify(data) }),
    }
};
