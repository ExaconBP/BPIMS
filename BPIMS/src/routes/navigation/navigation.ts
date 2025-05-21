import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Cart, CartItems, ItemDto, RewardTransactionDto, TransactionDto, TransactionItemsDto } from '../types/salesType';
import { ObjectDto, UserDetails } from '../types/userType';
import { BranchStockDto, ItemStock, StockInputHistoryDto } from '../types/stockType';
import { ItemHQDto } from '../types/itemType';
import { CustomerListDto, LoyaltyCardDto, LoyaltyStageDto } from '../types/customerType';
import { WHStockDto } from '../types/whType';
import { DailyTransactionDto } from '../types/reportType';

export type RootStackParamList = {
    Home: undefined;
    SalesStack: undefined;
    HeadquarterStack: undefined;
    WarehouseStack: undefined;
    CentralStack: undefined;
};

export type SalesStackParamList = {
    ItemStack: undefined;
    CustomerStack: undefined;
    BranchStockStack: undefined;
    SalesReportStack: undefined;
    HistoryStack: undefined;
};

export type HistoryStackParamList = {
    ItemsList: undefined;
    HistoryView: { branchItemId: number, itemName: string, user: UserDetails }
};

export type HistoryWHStackParamList = {
    ItemsList: undefined;
    WHHistoryView: { branchItemId: number, itemName: string, user: UserDetails }
};

export type HistoryStackParamListHQ = {
    ItemsList: undefined;
    HistoryView: { branchItemId: number, itemName: string, user: UserDetails }
    WHHistoryView: { branchItemId: number, itemName: string, user: UserDetails }
};

export type ItemStackParamList = {
    Item: undefined;
    Cart: { user: UserDetails };
    DeliveryFee: { user: UserDetails };
    Discount: { user: UserDetails };
    Payment: { user: UserDetails };
    Transaction: { user: UserDetails, reward?: RewardTransactionDto };
    SlipOrder: { transaction: TransactionDto, transactionItems: TransactionItemsDto[], user: UserDetails };
    CustomerList: { user: UserDetails };
    NewCustomer: { user: UserDetails, customers: CustomerListDto[] };
};

export type CustomerStackParamList = {
    Customer: undefined;
    CustomerView: { id: number | null, user: UserDetails, customers: CustomerListDto[], name: string | null };
    TransactionHistory: { transactionId: number }
};

export type BranchStockParamList = {
    BranchStock: undefined;
    StockInput: { item: BranchStockDto, user: UserDetails }
    StockHistory: { item: BranchStockDto, user: UserDetails, history: StockInputHistoryDto }
    StockTransfer: { item: BranchStockDto, user: UserDetails }
    ReturnStock: { item: BranchStockDto, user: UserDetails }
};

export type SalesReportParamList = {
    SalesReport: undefined;
    TransactionHistory: { transactionId: number }
    TransactionList: { transactions: DailyTransactionDto[], user: UserDetails }
};

export type HeadQuarterStackParamList = {
    SalesReportStack: undefined
    UserStack: undefined
    ItemsStack: undefined
    StockMonitorStack: undefined;
    CustomerHQStack: undefined;
    HistoryHQStack: undefined;
    BranchStack: undefined;
    LoyaltyStack: undefined;
};

export type SalesReportHQParamList = {
    SalesReport: undefined;
    TransactionList: { transactions: DailyTransactionDto[], user: UserDetails, branches: ObjectDto[] }
    TransactionHistory: { transactionId: number }
};

export type UsersHQParamList = {
    Users: undefined;
    UserView: { id: number, name: string };
}

export type BranchHQParamList = {
    Branches: undefined;
    BranchView: { id: number, name: string, branches: ObjectDto[], user: UserDetails };
}

export type ItemsHQParamList = {
    Items: undefined;
    ItemView: { item: ItemHQDto }
}

export type StockMonitorParamList = {
    StockMonitor: undefined;
    StockInput: { item: ItemStock, user: UserDetails, branchId: number | null, whId: number | null, whQty: number | null, suppliers: ObjectDto[] }
    ReturnStock: { item: ItemStock, user: UserDetails, suppliers: ObjectDto[] }
}

export type CustomerHQStackParamList = {
    Customer: undefined;
    CustomerView: { id: number | null, customers: CustomerListDto[], user: UserDetails };
    TransactionHistory: { transactionId: number }
};

export type WarehouseStackParamList = {
    WHStock: undefined;
    SupplierStack: undefined;
    WHBranchStack: undefined;
    HistoryStack: undefined
};

export type WhStockStackParamList = {
    WHScreen: undefined;
    StockInput: { item: WHStockDto, user: UserDetails, suppliers: ObjectDto[] }
    ReturnStock: { item: WHStockDto, user: UserDetails, suppliers: ObjectDto[] }
};

export type SupplierParamList = {
    SupplierList: undefined;
    SupplierView: { id: number, suppliers: ObjectDto[] }
};

export type WHBranchStackParamList = {
    BHStocks: undefined;
};

export type LoyaltyParamsList = {
    LoyaltyScreen: undefined;
    LoyaltyView: { item: LoyaltyCardDto, user: UserDetails };
    RewardView: { item: ObjectDto, user: UserDetails };
    LoyaltyStage: { item: LoyaltyStageDto, user: UserDetails, rewards: ObjectDto[], loyaltyCard: LoyaltyCardDto }
};

export type CentralStackParamList = {
    SalesStack: undefined;
    TransactionStack: undefined;
    AnalyticStack: undefined
};

export type CentralSalesParamList = {
    ItemScreen: undefined;
    Cart: { user: UserDetails };
    DeliveryFee: { deliveryFee: string, user: UserDetails };
    Discount: { discount: string, subTotal: number, user: UserDetails };
    Payment: { user: UserDetails };
    Transaction: { cart: Cart, user: UserDetails, total: number, isCredit: boolean };
    SlipOrder: { transaction: TransactionDto, transactionItems: TransactionItemsDto[], user: UserDetails };
    CustomerList: { user: UserDetails };
    NewCustomer: { user: UserDetails, customers: CustomerListDto[] };
}

export type CentralTransactionsParamList = {
    TransactionList: undefined;
    TransactionHistory: { transactionId: number }
}

export type CentralAnalyticsParamList = {
    SalesReport: undefined;
}

export type SalesStackNavigationProps<T extends keyof SalesStackParamList> =
    NativeStackScreenProps<SalesStackParamList, T>;

export type HeadQuarterNavigationProps<T extends keyof HeadQuarterStackParamList> =
    NativeStackScreenProps<HeadQuarterStackParamList, T>;

export type ItemStackNavigationProps<T extends keyof ItemStackParamList> =
    NativeStackScreenProps<ItemStackParamList, T>;

export type CustomerStackNavigationProps<T extends keyof CustomerStackParamList> =
    NativeStackScreenProps<CustomerStackParamList, T>;

export type BranchStackNavigationProps<T extends keyof BranchStockParamList> =
    NativeStackScreenProps<BranchStockParamList, T>;

export type SalesReportNavigationProps<T extends keyof SalesReportParamList> =
    NativeStackScreenProps<SalesReportParamList, T>;

export type SalesReportHQNavigationProps<T extends keyof SalesReportHQParamList> =
    NativeStackScreenProps<SalesReportHQParamList, T>;

export type UsersHQNavigationProps<T extends keyof UsersHQParamList> =
    NativeStackScreenProps<UsersHQParamList, T>;

export type ItemsHQNavigationProps<T extends keyof ItemsHQParamList> =
    NativeStackScreenProps<ItemsHQParamList, T>;

export type StockMonitorNavigationProps<T extends keyof StockMonitorParamList> =
    NativeStackScreenProps<StockMonitorParamList, T>;

export type CustomerHQStackNavigationProps<T extends keyof CustomerHQStackParamList> =
    NativeStackScreenProps<CustomerHQStackParamList, T>;


export type WareStackNavigationProps<T extends keyof WarehouseStackParamList> =
    NativeStackScreenProps<WarehouseStackParamList, T>;

export type WHStackNavigationProps<T extends keyof WhStockStackParamList> =
    NativeStackScreenProps<WhStockStackParamList, T>;

export type SupplierStackNavigationProps<T extends keyof SupplierParamList> =
    NativeStackScreenProps<SupplierParamList, T>;

export type WHBranchStackNavigationProps<T extends keyof WHBranchStackParamList> =
    NativeStackScreenProps<WHBranchStackParamList, T>;

export type CentralStackNavigationProps<T extends keyof CentralStackParamList> =
    NativeStackScreenProps<CentralStackParamList, T>;

export type CentralSalesNavigationProps<T extends keyof CentralSalesParamList> =
    NativeStackScreenProps<CentralSalesParamList, T>;
