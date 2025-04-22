export type WHStockDto = {
    id: number;
    name: string;
    quantity: number;
    unitOfMeasure: string;
    storeCriticalValue: number;
    sellByUnit: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    whCriticalValue: number;
};

export type WHStockInputHistoryDto = {
    id: number;
    qty: number;
    whCriticalValue: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: number;
    deliveredByName: string
    deliveryDate: Date;
    name: string;
    sellByUnit: boolean
} & {
    [key: string]: string | number | Date;
};

export type WHStockInputDto = {
    id: number;
    qty: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: number | null;
    deliveredByName: string | null;
    deliveryDate: Date;
} & {
    [key: string]: string | number | Date;
};

export type SupplierDto = {
    id: number;
    name: string;
    contactNumber1: string;
    contactNumber2: string | null;
    address: string;
};

export type ReturnToStockDto = {
    id: number;
    supplierId: number;
    supplierName: string;
    whItemId: number;
    reason: string;
    quantity: number;
    date: Date;
} & {
    [key: string]: string | number | Date;
};

