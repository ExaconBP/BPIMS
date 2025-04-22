export type CentralItemDto = {
    id: number;
    name: string;
    categoryId: number;
    price: number;
    cost: number;
    isManaged: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    quantity: number;
    sellByUnit: boolean;
    branchProducts: BranchProductDto[]
};

export type BranchProductDto = {
    id: number;
    branchId: number;
    branchName: string;
    quantity: number;
    soldQuantity?: string
};

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
    cashier?: string
    isPaid: boolean
    isVoided: boolean
}

export type TransactionItemsDto = {
    id: number;
    itemId: number;
    name: string;
    price: number;
    quantity: number;
    amount: number;
    sellByUnit: number;
}

export type TransactionRequestDto = {
    transaction: TransactionDto;
    transactionItems: TransactionItemsDto[];
}
export type DailyCentralTransactionDto = {
    id: number;
    totalAmount: number;
    slipNo: string;
    transactionDate: Date;
    cashierName: string;
    items: DailyTransactionItem[];
    isVoided: boolean;
    isPaid: boolean
};

export type DailyTransactionItem = {
    id: number;
    itemName: string;
    itemId: number;
    quantity: number;
};