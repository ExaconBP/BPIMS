import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { WarehouseStackParamList } from "../../navigation/navigation";
import WHBranchNavigator from "./branchstocks/BranchStocksStack";
import HistoryStackNavigator from "./stockHistory/HistoryStack";
import WHNavigator from "./stocks/WHStocksStack";
import SupplierNavigator from "./suppliers/SupplierStack";

const WarehouseStack = createNativeStackNavigator<WarehouseStackParamList>();

export default function WareHouseNavigator() {
    return (
        <WarehouseStack.Navigator screenOptions={{ headerShown: false }}>
            <WarehouseStack.Screen name="WHStock" component={WHNavigator} />
            <WarehouseStack.Screen name="SupplierStack" component={SupplierNavigator} />
            <WarehouseStack.Screen name="WHBranchStack" component={WHBranchNavigator} />
            <WarehouseStack.Screen name="HistoryStack" component={HistoryStackNavigator} />
        </WarehouseStack.Navigator>
    );
}
