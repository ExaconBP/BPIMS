export type CustomerDto = {
    id: number;
    name: string;
    branchId: number | null;
    contactNumber1: string | null;
    contactNumber2: string | null;
    totalOrderAmount: number;
    branch: string | null;
    fileUrl: string | null;
    fileName: string | null;
    isLoyalty: boolean
}

export type CustomerListDto = {
    id: number;
    name: string;
    branchId: number;
}

export type OrderHistory = {
    id: number;
    totalAmount: number;
    amountReceived: number;
    slipNo: string;
    transactionDate: Date;
    isVoided: boolean;
    cashier: string;
    items: TransactionItemsDto[]
}

export type CustomerRequest = {
    customer: CustomerDto;
    orderHistory: OrderHistory[];
}

export type TransactionDto = {
    id: number;
    totalAmount: number;
    amountReceived: number;
    slipNo: string;
    transactionDate: Date;
    branch: string;
    deliveryFee: number;
    discount: number;
    subTotal: number;
    customerName: string;
    cashier?: string;
    isVoided: boolean;
}

export type TransactionItemsDto = {
    id: number;
    itemId: number;
    name: string;
    price: number;
    quantity: number;
    amount: number;
    sellByUnit: boolean;
}

export type TransactionRequestDto = {
    transaction: TransactionDto;
    transactionItems: TransactionItemsDto[];
}

export type LoyaltyCardDto = {
    id: number;
    validYear: string;
    isValid: boolean;
}

export type LoyaltyStageDto = {
    id: number;
    orderId: number;
    loyaltyCardId: number;
    itemRewardId: number | null;
    rewardName: string | null;
}

export type CurrentCustomerLoyalty = {
    id: number;
    customerId: number;
    stageId: number;
    orderId: number;
    isDone: boolean;
    dateDone: string | null;
    itemId: number;
    itemRewardId: number | null;
    name: string | null;
    validYear: string;
    itemName?: string
}