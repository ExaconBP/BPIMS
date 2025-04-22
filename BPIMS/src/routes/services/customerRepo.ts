import { VITE_MAIN_API } from '@env';
import { CallResultDto } from "../types/CallResultDto";
import { CurrentCustomerLoyalty, CustomerListDto, CustomerRequest, LoyaltyCardDto, LoyaltyStageDto, TransactionRequestDto } from "../types/customerType";
import { ObjectDto } from "../types/userType";
import { getFromBaseApi, putFormBaseApi, putToBaseApi } from "../utils/apiService";

const baseUrl = VITE_MAIN_API

export async function getCustomerList(branchid: number | null, search: string) {
    return await getFromBaseApi<CallResultDto<CustomerListDto[]>>('getCustomerList', { branchid, search });
}

export async function getCustomer(id: number) {
    return await getFromBaseApi<CallResultDto<CustomerRequest>>('getCustomer', { id });
}

export async function saveCustomer(formData: FormData) {
    return await putFormBaseApi<CallResultDto<number>>('saveCustomer', formData);
}

export async function deleteCustomer(id: number) {
    return await putToBaseApi<CallResultDto<object>>('deleteCustomer', { id });
}

export async function getCustomerImage(fileName: string) {
    const timestamp = Date.now();
    return `${baseUrl}/getCustomerImage?fileName=${fileName}&t=${timestamp}`;
}

export async function getTransactionHistory(transactionId: number) {
    return await getFromBaseApi<CallResultDto<TransactionRequestDto>>('getTransactionHistory', { transactionId });
}

export async function getLoyaltyCardList() {
    return await getFromBaseApi<CallResultDto<LoyaltyCardDto[]>>('getLoyaltyCardList');
}

export async function getLoyaltyStages(cardId: number) {
    return await getFromBaseApi<CallResultDto<LoyaltyStageDto[]>>('getLoyaltyStages', { cardId });
}

export async function getRewards() {
    return await getFromBaseApi<CallResultDto<ObjectDto[]>>('getRewards');
}

export async function saveRewards(id: number, name: string) {
    return await putToBaseApi('saveItemsReward', { id, name });
}

export async function saveLoyaltyCard(card: LoyaltyCardDto) {
    return await putToBaseApi('saveLoyaltyCard', { card });
}

export async function saveLoyaltyStage(stage: LoyaltyStageDto) {
    return await putToBaseApi('saveLoyaltyStage', { stage });
}

export async function saveLoyaltyCustomer(customerId: number) {
    return await putToBaseApi('saveLoyaltyCustomer', { customerId });
}

export async function markStageDone(loyaltyCustomerId: number, itemId: number) {
    return await putToBaseApi('markStageDone', { loyaltyCustomerId, itemId });
}

export async function getCurrentLoyaltyCustomer(customerId: number) {
    return await getFromBaseApi<CallResultDto<CurrentCustomerLoyalty[]>>('getCustomerLoyalty', { customerId });
}