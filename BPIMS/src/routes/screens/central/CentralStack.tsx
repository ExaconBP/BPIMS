import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { CentralStackParamList } from "../../navigation/navigation";
import AnalyticsCentralNavigator from "./analytics/AnalyticsStack";
import CentralSalesStackNavigator from "./sales/SalesStack";
import CentralTransactionStackNavigator from "./transactions/TransactionStack";

const CentralStack = createNativeStackNavigator<CentralStackParamList>();

export default function CentralNavigator() {
    return (
        <CentralStack.Navigator screenOptions={{ headerShown: false }}>
            <CentralStack.Screen name="SalesStack" component={CentralSalesStackNavigator} />
            <CentralStack.Screen name="TransactionStack" component={CentralTransactionStackNavigator} />
            <CentralStack.Screen name="AnalyticStack" component={AnalyticsCentralNavigator} />
        </CentralStack.Navigator>
    );
}
