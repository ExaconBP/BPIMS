import { CallResultDto } from "../types/CallResultDto";
import { BranchStockDto, ItemStock, StockInputDto, StockInputHistoryDto, StockTransferDto } from "../types/stockType";
import { ReturnToWHDto } from "../types/userType";
import { getFromBaseApi, postToBaseApi, putToBaseApi } from "../utils/apiService";

export async function getBranchStocks(categoryId: number, page: number, search: string, branchId: number) {
    return await getFromBaseApi<CallResultDto<BranchStockDto[]>>('getBranchStocks', { categoryId, page, search, branchId });
}

export async function createStockInput(stockInput: StockInputDto) {
    return await postToBaseApi<CallResultDto<object>>('createStockInput', { stockInput });
}

export async function getStockHistory(branchItemId: number) {
    return await getFromBaseApi<CallResultDto<StockInputHistoryDto[]>>('getStockHistory', { branchItemId });
}

export async function getStocksMonitor(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<ItemStock[]>>('getStocksMonitor', { categoryId, page, search });
}

export async function editStock(id: number, qty: number) {
    return await putToBaseApi<CallResultDto<object>>('editStock', { id, qty });
}

export async function editWHStock(id: number, qty: number) {
    return await putToBaseApi<CallResultDto<object>>('editWHStock', { id, qty });
}

export async function getBranchTransferHistory(branchItemId: number) {
    return await getFromBaseApi<CallResultDto<StockTransferDto[]>>('getBranchTransferHistory', { branchItemId });
}


export async function saveTransferStock(branchTransfer: StockTransferDto) {
    return await postToBaseApi<CallResultDto<object>>('saveBranchTransfer', { branchTransfer });
}

export async function getBranchReturnHistory(branchItemId: number) {
    return await getFromBaseApi<CallResultDto<ReturnToWHDto[]>>('getBranchReturnHistory', { branchItemId });
}

export async function returnToWH(returnStock: ReturnToWHDto) {
    return await postToBaseApi<CallResultDto<object>>('returnToWH', { returnStock });
}