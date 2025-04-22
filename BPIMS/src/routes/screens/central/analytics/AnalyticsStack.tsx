import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { CentralAnalyticsParamList } from "../../../navigation/navigation";
import SalesReportScreen from "./SalesReportScreen";

const SalesStack = createNativeStackNavigator<CentralAnalyticsParamList>();

export default function AnalyticsCentralNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="SalesReport" component={SalesReportScreen} />
        </SalesStack.Navigator>
    );
}
