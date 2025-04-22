import { CallResultDto } from "../types/CallResultDto";
import { BranchProductDto, CentralItemDto, DailyCentralTransactionDto, TransactionRequestDto } from "../types/centralType";
import { getFromBaseApi, postToBaseApi, putToBaseApi } from "../utils/apiService";

export async function getCentralProducts(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<CentralItemDto[]>>('getCentralProducts', { categoryId, page, search });
}

export async function addCentralItemToCart(branchProducts: BranchProductDto[]) {
    return await postToBaseApi('addCentralItemToCart', { branchProducts });
}

export async function processCentralPayment(amountReceived: number, isCredit: boolean) {
    return await postToBaseApi<CallResultDto<TransactionRequestDto>>('processCentralPayment', { amountReceived, isCredit });
}

export async function getAllCentralTransactionHistory(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<DailyCentralTransactionDto[]>>('getAllCentralTransactions', { categoryId, page, search });
}

export async function getTransactionHistory(transactionId: number) {
    return await getFromBaseApi<CallResultDto<TransactionRequestDto>>('getTransactionHistory', { transactionId });
}

export async function payPendingTransaction(transactionId: number, amount: number) {
    return await putToBaseApi<CallResultDto<object>>('payPendingTransaction', { transactionId, amount });
}
