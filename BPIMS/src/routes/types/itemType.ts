
export type ItemHQDto = {
    id: number;
    name: string;
    categoryId: number | null;
    categoryName: string
    price: number;
    cost: number;
    isManaged: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    sellByUnit: boolean;
    storeCriticalValue: number;
    whCriticalValue: number;
    unitOfMeasure: string;
} & {
    [key: string]: string | number | Date | boolean | null;
};