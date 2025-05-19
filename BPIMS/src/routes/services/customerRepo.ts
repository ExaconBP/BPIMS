import { VITE_MAIN_API } from '@env';
import { CallResultDto } from "../types/CallResultDto";
import { CurrentCustomerLoyalty, CustomerListDto, CustomerRequest, LoyaltyCardDto, LoyaltyStageDto, TransactionRequestDto } from "../types/customerType";
import { ObjectDto } from "../types/userType";
import { getFromBaseApi, putFormBaseApi, putToBaseApi } from "../utils/apiService";

const baseUrl = VITE_MAIN_API

const requestTracker = new Map<string, boolean>();

function getRequestKey(url: string, data: any) {
    return `${url}:${JSON.stringify(data)}`;
}

export async function getCustomerList(branchid: number | null, search: string) {
    return await getFromBaseApi<CallResultDto<CustomerListDto[]>>('getCustomerList', { branchid, search });
}

export async function getCustomer(id: number) {
    return await getFromBaseApi<CallResultDto<CustomerRequest>>('getCustomer', { id });
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

export async function getCurrentLoyaltyCustomer(customerId: number) {
    return await getFromBaseApi<CallResultDto<CurrentCustomerLoyalty[]>>('getCustomerLoyalty', { customerId });
}

export async function saveCustomer(formData: FormData) {
    const key = getRequestKey('saveCustomer', formData);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putFormBaseApi<CallResultDto<number>>('saveCustomer', formData);
    } finally {
        requestTracker.delete(key);
    }
}

export async function deleteCustomer(id: number) {
    const key = getRequestKey('deleteCustomer', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('deleteCustomer', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function saveRewards(id: number, name: string) {
    const key = getRequestKey('saveItemsReward', { id, name });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('saveItemsReward', { id, name });
    } finally {
        requestTracker.delete(key);
    }
}

export async function saveLoyaltyCard(card: LoyaltyCardDto) {
    const key = getRequestKey('saveLoyaltyCard', { card });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('saveLoyaltyCard', { card });
    } finally {
        requestTracker.delete(key);
    }
}

export async function saveLoyaltyStage(stage: LoyaltyStageDto) {
    const key = getRequestKey('saveLoyaltyStage', { stage });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('saveLoyaltyStage', { stage });
    } finally {
        requestTracker.delete(key);
    }
}

export async function saveLoyaltyCustomer(customerId: number) {
    const key = getRequestKey('saveLoyaltyCustomer', { customerId });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('saveLoyaltyCustomer', { customerId });
    } finally {
        requestTracker.delete(key);
    }
}

export async function markStageDone(loyaltyCustomerId: number, itemId: number) {
    const key = getRequestKey('markStageDone', { loyaltyCustomerId, itemId });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('markStageDone', { loyaltyCustomerId, itemId });
    } finally {
        requestTracker.delete(key);
    }
}

export async function deleteLoyaltyCard(id: number) {
    const key = getRequestKey('deleteLoyaltyCard', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('deleteLoyaltyCard', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function deleteStage(id: number) {
    const key = getRequestKey('deleteStage', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('deleteStage', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function deleteReward(id: number) {
    const key = getRequestKey('deleteReward', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('deleteReward', { id });
    } finally {
        requestTracker.delete(key);
    }
}