import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { SalesStackParamList } from "../../navigation/navigation";
import BranchStockNavigator from "./branchstocks/BranchStockStack";
import CustomerNavigator from "./customers/CustomerStack";
import ItemNavigator from "./items/ItemStack";
import SalesReportNavigator from "./salesreport/SalesReportStack";
import HistoryStackNavigator from "./stockhistory/HistoryStack";

const SalesStack = createNativeStackNavigator<SalesStackParamList>();

export default function SalesNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="ItemStack" component={ItemNavigator} />
            <SalesStack.Screen name="CustomerStack" component={CustomerNavigator} />
            <SalesStack.Screen name="BranchStockStack" component={BranchStockNavigator} />
            <SalesStack.Screen name="SalesReportStack" component={SalesReportNavigator} />
            <SalesStack.Screen name="HistoryStack" component={HistoryStackNavigator} />
        </SalesStack.Navigator>
    );
}
