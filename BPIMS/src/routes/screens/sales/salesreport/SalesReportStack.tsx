import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { SalesReportParamList } from "../../../navigation/navigation";
import SalesReportScreen from "./SalesReportScreen";
import TransactionHistoryScreen from "./TransactionHistory";
import TransactionListScreen from "./TransactionList";

const SalesStack = createNativeStackNavigator<SalesReportParamList>();

export default function SalesReportNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="SalesReport" component={SalesReportScreen} />
            <SalesStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
            <SalesStack.Screen name="TransactionList" component={TransactionListScreen} />
        </SalesStack.Navigator>
    );
}
