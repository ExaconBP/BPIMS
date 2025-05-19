import { CallResultDto } from "../types/CallResultDto";
import { WHItemStock } from "../types/stockType";
import { ObjectDto } from "../types/userType";
import { ReturnToStockDto, SupplierDto, WHStockDto, WHStockInputDto, WHStockInputHistoryDto } from "../types/whType";
import { getFromBaseApi, postToBaseApi } from "../utils/apiService";

const requestTracker = new Map<string, boolean>();

function getRequestKey(url: string, data: any) {
    return `${url}:${JSON.stringify(data)}`;
}

export async function getWHStocks(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<WHStockDto[]>>('getWHStocks', { categoryId, page, search });
}

export async function getWHStockHistory(itemId: number) {
    return await getFromBaseApi<CallResultDto<WHStockInputHistoryDto[]>>('getWHStockHistory', { itemId });
}

export async function getSupplierStockHistory(supplierId: number) {
    return await getFromBaseApi<CallResultDto<WHStockInputHistoryDto[]>>('getSupplierStockHistory', { supplierId });
}

export async function createWHStockInput(stockInput: WHStockInputDto) {
    const key = getRequestKey('createWHStockInput', stockInput);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<object>>('createWHStockInput', { stockInput });
    } finally {
        requestTracker.delete(key);
    }
}

export async function getSupplierList(search: string) {
    return await getFromBaseApi<CallResultDto<ObjectDto[]>>('getSupplierList', { search });
}

export async function getSupplier(id: number) {
    return await getFromBaseApi<CallResultDto<SupplierDto>>('getSupplier', { id });
}

export async function saveSupplier(supplier: SupplierDto) {
    const key = getRequestKey('saveSupplier', supplier);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<object>>('saveSupplier', { supplier });
    } finally {
        requestTracker.delete(key);
    }
}

export async function removeSupplier(id: number) {
    const key = getRequestKey('removeSupplier', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<object>>('removeSupplier', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function getWHStocksMonitor(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<WHItemStock[]>>('getWHStocksMonitor', { categoryId, page, search });
}

export async function getReturnToStockHistory(whItemId: number) {
    return await getFromBaseApi<CallResultDto<ReturnToStockDto[]>>('getReturnToStockHistory', { whItemId });
}

export async function returnToSupplier(returnStock: ReturnToStockDto) {
    const key = getRequestKey('returnToSupplier', returnStock);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<ReturnToStockDto[]>>('returnToSupplier', { returnStock });
    } finally {
        requestTracker.delete(key);
    }
}
