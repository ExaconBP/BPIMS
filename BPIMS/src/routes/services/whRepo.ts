import { CallResultDto } from "../types/CallResultDto";
import { WHItemStock } from "../types/stockType";
import { ObjectDto } from "../types/userType";
import { ReturnToStockDto, SupplierDto, WHStockDto, WHStockInputDto, WHStockInputHistoryDto } from "../types/whType";
import { getFromBaseApi, postToBaseApi } from "../utils/apiService";

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
    return await postToBaseApi<CallResultDto<object>>('createWHStockInput', { stockInput });
}

export async function getSupplierList(search: string) {
    return await getFromBaseApi<CallResultDto<ObjectDto[]>>('getSupplierList', { search });
}

export async function getSupplier(id: number) {
    return await getFromBaseApi<CallResultDto<SupplierDto>>('getSupplier', { id });
}

export async function saveSupplier(supplier: SupplierDto) {
    return await postToBaseApi<CallResultDto<object>>('saveSupplier', { supplier });
}

export async function removeSupplier(id: number) {
    return await postToBaseApi<CallResultDto<object>>('removeSupplier', { id });
}

export async function getWHStocksMonitor(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<WHItemStock[]>>('getWHStocksMonitor', { categoryId, page, search });
}

export async function getReturnToStockHistory(whItemId: number) {
    return await getFromBaseApi<CallResultDto<ReturnToStockDto[]>>('getReturnToStockHistory', { whItemId });
}

export async function returnToSupplier(returnStock: ReturnToStockDto) {
    return await postToBaseApi<CallResultDto<ReturnToStockDto[]>>('returnToSupplier', { returnStock });
}