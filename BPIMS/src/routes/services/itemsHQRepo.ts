import { VITE_MAIN_API } from '@env';
import { CallResultDto } from "../types/CallResultDto";
import { ItemHQDto } from "../types/itemType";
import { CategoryDto } from "../types/salesType";
import { getFromBaseApi, putFormBaseApi, putToBaseApi } from "../utils/apiService";

const baseUrl = VITE_MAIN_API;

// Deduplication Tracker
const requestTracker = new Map<string, boolean>();

function getRequestKey(url: string, data: any) {
    return `${url}:${JSON.stringify(data)}`;
}

export async function getProductsHQ(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<ItemHQDto[]>>('getProductsHQ', { categoryId, page, search });
}

export async function getCategoriesHQ() {
    return await getFromBaseApi<CallResultDto<CategoryDto[]>>('getCategoriesHQ');
}

export async function getProductHQ(id: number) {
    return await getFromBaseApi<CallResultDto<ItemHQDto>>('getProductHQ', { id });
}

export async function saveItem(formData: FormData) {
    const key = getRequestKey('saveItem', formData);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putFormBaseApi<CallResultDto<number>>('saveItem', formData);
    } finally {
        requestTracker.delete(key);
    }
}

export async function deleteItem(id: number) {
    const key = getRequestKey('deleteItem', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('deleteItem', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export function getItemImage(fileName: string) {
    const timestamp = Date.now();
    return `${baseUrl}/getItemImage?fileName=${fileName}&t=${timestamp}`;
}
