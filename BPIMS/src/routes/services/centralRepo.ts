import { CallResultDto } from "../types/CallResultDto";
import { BranchProductDto, CentralItemDto, DailyCentralTransactionDto, TransactionRequestDto } from "../types/centralType";
import { getFromBaseApi, postToBaseApi, putToBaseApi } from "../utils/apiService";

const requestTracker = new Map<string, boolean>();

function getRequestKey(url: string, data: any) {
    return `${url}:${JSON.stringify(data)}`;
}

export async function getCentralProducts(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<CentralItemDto[]>>('getCentralProducts', { categoryId, page, search });
}

export async function addCentralItemToCart(branchProducts: BranchProductDto[]) {
    const key = getRequestKey('addCentralItemToCart', branchProducts);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi('addCentralItemToCart', { branchProducts });
    } finally {
        requestTracker.delete(key);
    }
}

export async function processCentralPayment(amountReceived: number, isCredit: boolean) {
    const key = getRequestKey('processCentralPayment', { amountReceived, isCredit });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<TransactionRequestDto>>('processCentralPayment', { amountReceived, isCredit });
    } finally {
        requestTracker.delete(key);
    }
}

export async function getAllCentralTransactionHistory(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<DailyCentralTransactionDto[]>>('getAllCentralTransactions', { categoryId, page, search });
}

export async function getTransactionHistory(transactionId: number) {
    return await getFromBaseApi<CallResultDto<TransactionRequestDto>>('getTransactionHistory', { transactionId });
}

export async function payPendingTransaction(transactionId: number, amount: number) {
    const key = getRequestKey('payPendingTransaction', { transactionId, amount });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('payPendingTransaction', { transactionId, amount });
    } finally {
        requestTracker.delete(key);
    }
}
