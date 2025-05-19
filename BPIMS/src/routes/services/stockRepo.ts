import { CallResultDto } from "../types/CallResultDto";
import { BranchStockDto, ItemStock, StockInputDto, StockInputHistoryDto, StockTransferDto } from "../types/stockType";
import { ReturnToWHDto } from "../types/userType";
import { getFromBaseApi, postToBaseApi, putToBaseApi } from "../utils/apiService";

const requestTracker = new Map<string, boolean>();

function getRequestKey(url: string, data: any) {
    return `${url}:${JSON.stringify(data)}`;
}

export async function getBranchStocks(categoryId: number, page: number, search: string, branchId: number) {
    return await getFromBaseApi<CallResultDto<BranchStockDto[]>>('getBranchStocks', { categoryId, page, search, branchId });
}

export async function getStockHistory(branchItemId: number) {
    return await getFromBaseApi<CallResultDto<StockInputHistoryDto[]>>('getStockHistory', { branchItemId });
}

export async function getStocksMonitor(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<ItemStock[]>>('getStocksMonitor', { categoryId, page, search });
}

export async function getBranchTransferHistory(branchItemId: number) {
    return await getFromBaseApi<CallResultDto<StockTransferDto[]>>('getBranchTransferHistory', { branchItemId });
}

export async function getBranchReturnHistory(branchItemId: number) {
    return await getFromBaseApi<CallResultDto<ReturnToWHDto[]>>('getBranchReturnHistory', { branchItemId });
}

export async function createStockInput(stockInput: StockInputDto) {
    const key = getRequestKey('createStockInput', stockInput);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<object>>('createStockInput', { stockInput });
    } finally {
        requestTracker.delete(key);
    }
}

export async function editStock(id: number, qty: number) {
    const key = getRequestKey('editStock', { id, qty });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('editStock', { id, qty });
    } finally {
        requestTracker.delete(key);
    }
}

export async function editWHStock(id: number, qty: number) {
    const key = getRequestKey('editWHStock', { id, qty });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('editWHStock', { id, qty });
    } finally {
        requestTracker.delete(key);
    }
}

export async function saveTransferStock(branchTransfer: StockTransferDto) {
    const key = getRequestKey('saveBranchTransfer', branchTransfer);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<object>>('saveBranchTransfer', { branchTransfer });
    } finally {
        requestTracker.delete(key);
    }
}

export async function returnToWH(returnStock: ReturnToWHDto) {
    const key = getRequestKey('returnToWH', returnStock);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<object>>('returnToWH', { returnStock });
    } finally {
        requestTracker.delete(key);
    }
}