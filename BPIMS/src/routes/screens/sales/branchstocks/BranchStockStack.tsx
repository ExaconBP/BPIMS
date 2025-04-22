import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { BranchStockParamList } from "../../../navigation/navigation";
import BranchStockScreen from "./BranchStockScreen";
import ReturnStockScreen from "./ReturnStock";
import StockHistory from "./StockHistory";
import StockInputScreen from "./StockInput";
import StockTransferScreen from "./StockTransfer";

const BranchStock = createNativeStackNavigator<BranchStockParamList>();

export default function BranchStockNavigator() {
    return (
        <BranchStock.Navigator screenOptions={{ headerShown: false }}>
            <BranchStock.Screen name="BranchStock" component={BranchStockScreen} />
            <BranchStock.Screen name="StockInput" component={StockInputScreen} />
            <BranchStock.Screen name="StockHistory" component={StockHistory} />
            <BranchStock.Screen name="StockTransfer" component={StockTransferScreen} />
            <BranchStock.Screen name="ReturnStock" component={ReturnStockScreen} />
        </BranchStock.Navigator>
    );
}
