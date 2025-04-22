import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StockMonitorParamList } from "../../../navigation/navigation";
import ReturnStockScreen from "./ReturnStock";
import StockInputScreen from "./StockInput";
import StockMonitorScreen from "./StockMonitorScreen";

const StockMonitor = createNativeStackNavigator<StockMonitorParamList>();

export default function StockMonitorNavigator() {
    return (
        <StockMonitor.Navigator screenOptions={{ headerShown: false }}>
            <StockMonitor.Screen name="StockMonitor" component={StockMonitorScreen} />
            <StockMonitor.Screen name="StockInput" component={StockInputScreen} />
            <StockMonitor.Screen name="ReturnStock" component={ReturnStockScreen} />
        </StockMonitor.Navigator>
    );
}
