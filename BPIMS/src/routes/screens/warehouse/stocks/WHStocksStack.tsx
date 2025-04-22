import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { WhStockStackParamList } from "../../../navigation/navigation";
import ReturnStockScreen from "./ReturnStock";
import StockInputScreen from "./StockInput";
import WHScreen from "./WHScreen";

const WHSTack = createNativeStackNavigator<WhStockStackParamList>();

export default function WHNavigator() {
    return (
        <WHSTack.Navigator screenOptions={{ headerShown: false }}>
            <WHSTack.Screen name="WHScreen" component={WHScreen} />
            <WHSTack.Screen name="StockInput" component={StockInputScreen} />
            <WHSTack.Screen name="ReturnStock" component={ReturnStockScreen} />
        </WHSTack.Navigator>
    );
}
