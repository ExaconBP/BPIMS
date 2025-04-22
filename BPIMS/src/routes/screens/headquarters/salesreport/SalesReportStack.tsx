import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { SalesReportHQParamList } from "../../../navigation/navigation";
import SalesReportScreen from "./SalesReportScreen";
import TransactionHistoryScreen from "./TransactionHistory";
import TransactionListScreen from "./TransactionList";

const SalesStack = createNativeStackNavigator<SalesReportHQParamList>();

export default function SalesReportHQNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="SalesReport" component={SalesReportScreen} />
            <SalesStack.Screen name="TransactionList" component={TransactionListScreen} />
            <SalesStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        </SalesStack.Navigator>
    );
}
