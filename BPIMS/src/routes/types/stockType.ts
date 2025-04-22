export type BranchStockDto = {
    id: number;
    name: string;
    quantity: number;
    unitOfMeasure: string;
    whCriticalValue: number;
    sellByUnit: boolean;
    storeCriticalValue: number;
    imagePath: string | null;
    imageUrl: string | null;
    whQty: number;
};

export type StockInputDto = {
    id: number;
    qty: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: string;
    deliveryDate: Date;
    branchItemId: number;
} & {
    [key: string]: string | number | Date;
};

export type StockInputHistoryDto = {
    id: number;
    qty: number;
    storeCriticalValue: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: string;
    deliveryDate: Date;
    branchItemId: number | null;
    whId: number | null;
} & {
    [key: string]: string | number | Date;
};

export type BranchStock = {
    id: number;
    branchId: number;
    name: string;
    quantity: number;
    criticalValue: number;
};

export type ItemStock = {
    id: number;
    name: string;
    branches: BranchStock[];
    whQty: number;
    whName: string;
    whCriticalValue: number;
    sellByUnit: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    storeCriticalValue: number;
    whId: number;
    unitOfMeasure: string | null
};

export type EditingItemDto = {
    id: number;
    qty: number;
    isWareHouse: boolean;
    branchName: string;
    itemName: string;
    sellByUnit: boolean;
};

export type WHBranchStock = {
    id: number;
    branchId: number;
    name: string;
    quantity: number;
    criticalValue: number;
};

export type WHItemStock = {
    id: number;
    name: string;
    branches: BranchStock[];
    sellByUnit: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    storeCriticalValue: number;
    unitOfMeasure: string | null;
};

export type StockTransferDto = {
    id: number;
    quantity: number;
    branchFromId: number;
    branchToId: number;
    branchFrom: string;
    branchTo: string;
    date: Date;
} & {
    [key: string]: string | number | Date;
};