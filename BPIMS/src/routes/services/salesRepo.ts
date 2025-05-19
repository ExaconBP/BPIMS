import { ResponseType } from "axios";
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import { CallResultDto } from '../types/CallResultDto';
import { DailyTransactionDto } from '../types/reportType';
import { CartDto, CategoryDto, ItemDto, TransactionDto, TransactionRequestDto } from '../types/salesType';
import { getFromBaseApi, postToBaseApi, putToBaseApi } from '../utils/apiService';

const requestTracker = new Map<string, boolean>();

function getRequestKey(url: string, data: any) {
    return `${url}:${JSON.stringify(data)}`;
}

export async function getCategories() {
    return await getFromBaseApi<CallResultDto<CategoryDto[]>>('getCategories');
}

export async function getProducts(categoryId: number, page: number, search: string, branchId: number) {
    return await getFromBaseApi<CallResultDto<ItemDto[]>>('getProducts', { categoryId, page, search, branchId });
}

export async function getCart() {
    return await getFromBaseApi<CallResultDto<CartDto>>('getCart');
}

export async function addItemToCart(itemId: number, quantity: number) {
    const key = getRequestKey('addItemToCart', { itemId, quantity });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<object>>('addItemToCart', { itemId, quantity });
    } finally {
        requestTracker.delete(key);
    }
}

export async function deleteAllCartItems() {
    const key = getRequestKey('deleteAllCartItems', {});
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('deleteAllCartItems');
    } finally {
        requestTracker.delete(key);
    }
}

export async function removeCartItem(cartItemId: number) {
    const key = getRequestKey('removeCartItem', { cartItemId });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('removeCartItem', { cartItemId });
    } finally {
        requestTracker.delete(key);
    }
}

export async function updateItemQuantity(cartItemId: number, quantity: number) {
    const key = getRequestKey('updateItemQuantity', { cartItemId, quantity });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('updateItemQuantity', { cartItemId, quantity });
    } finally {
        requestTracker.delete(key);
    }
}

export async function updateDeliveryFee(deliveryFee: number | null) {
    const key = getRequestKey('updateDeliveryFee', { deliveryFee });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('updateDeliveryFee', { deliveryFee });
    } finally {
        requestTracker.delete(key);
    }
}

export async function updateDiscount(discount: number | null) {
    const key = getRequestKey('updateDiscount', { discount });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('updateDiscount', { discount });
    } finally {
        requestTracker.delete(key);
    }
}

export async function processPayment(amountReceived: number) {
    const key = getRequestKey('processPayment', { amountReceived });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<TransactionRequestDto>>('processPayment', { amountReceived });
    } finally {
        requestTracker.delete(key);
    }
}

export async function updateCustomer(id: number | null) {
    const key = getRequestKey('updateCustomer', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('updateCustomer', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function generateReceipt(transactionId: number, transaction: TransactionDto) {
    try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);


        const config = { responseType: 'blob' as ResponseType };
        const blob = await postToBaseApi<Blob>('generateReceipt', { transactionId }, config);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Data = reader.result?.toString().split(',')[1];
            if (base64Data) {
                const filePath = `${RNFS.DownloadDirectoryPath}/${transaction.slipNo}_receipt.pdf`;
                await RNFS.writeFile(filePath, base64Data, 'base64');
                await RNFS.scanFile(filePath);

                try {
                    await FileViewer.open(filePath, { showOpenWithDialog: true });
                } catch (error) {
                    console.error("Error opening file:", error);
                    Alert.alert("Failed to open the receipt. Please ensure you have a PDF viewer installed.");
                }
            }
        };
    } catch (error) {
        console.error("Error generating receipt:", error);
        Alert.alert("Error", "Failed to generate the receipt.");
    }
}

export async function getAllTransactionHistory(branchId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<DailyTransactionDto[]>>('getAllTransactions', { branchId, page, search });
}

export async function getAllTransactionHistoryHQ(branchId: number | null, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<DailyTransactionDto[]>>('getAllTransactionsHQ', { branchId, page, search });
}

export async function voidTransaction(id: number) {
    const key = getRequestKey('voidTransaction', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('voidTransaction', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function saveCustomerItemReward(id: number, itemId: number, branchId: number, qty: number) {
    const key = getRequestKey('saveCustomerItemReward', { id, itemId, branchId, qty });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('saveCustomerItemReward', { id, itemId, branchId, qty });
    } finally {
        requestTracker.delete(key);
    }
}

export async function changeReward(id: number, itemId: number, branchId: number, lastItemId: number, qty: number, lastQty: number) {
    const key = getRequestKey('changeReward', { id, itemId, branchId, lastItemId, qty, lastQty });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<object>>('changeReward', { id, itemId, branchId, lastItemId, qty, lastQty });
    } finally {
        requestTracker.delete(key);
    }
}

export async function getOldestTransaction(branchId: number) {
    return await getFromBaseApi<CallResultDto<Date | null>>('getOldestTransaction', { branchId });
}

export async function generateSalesPDF(from: Date, to: Date, branchId: number) {
    try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);

        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const fromDate = formatDate(from);
        const toDate = formatDate(to);
        const config = { responseType: 'blob' as ResponseType };
        const blob = await postToBaseApi<Blob>('generateSalespdf', { fromDate, toDate, branchId }, config);
        const reader = new FileReader();
        reader.readAsDataURL(blob);

        reader.onloadend = async () => {
            const base64Data = reader.result?.toString().split(',')[1];
            if (base64Data) {
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 1_000_000);
                const filePath = `${RNFS.DownloadDirectoryPath}/test_sales_${timestamp}_${randomNum}.pdf`;
                try {

                    await RNFS.writeFile(filePath, base64Data, 'base64');

                    await RNFS.scanFile(filePath);

                    await FileViewer.open(filePath, { showOpenWithDialog: true });
                } catch (error) {
                    console.error("Error opening file:", error);
                    Alert.alert("Failed to open the pdf file. Please ensure you have a PDF viewer installed.");
                }
            }
        };
    } catch (error) {
        console.error("Error generating pdf file:", error);
        Alert.alert("Error", "Failed to generate the pdf file.");
    }
}
