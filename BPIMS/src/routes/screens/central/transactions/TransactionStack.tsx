import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { CentralTransactionsParamList } from "../../../navigation/navigation";
import TransactionHistoryScreen from "./TransactionHistory";
import TransactionListScreen from "./TransactionList";

const TransactionStack = createNativeStackNavigator<CentralTransactionsParamList>();

export default function CentralTransactionStackNavigator() {
    return (
        <TransactionStack.Navigator screenOptions={{ headerShown: false }}>
            <TransactionStack.Screen name="TransactionList" component={TransactionListScreen} />
            <TransactionStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        </TransactionStack.Navigator>
    );
}
