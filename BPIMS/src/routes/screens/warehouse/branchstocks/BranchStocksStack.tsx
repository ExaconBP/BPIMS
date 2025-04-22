import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { WHBranchStackParamList } from "../../../navigation/navigation";
import WHStockMonitorScreen from "./BHStockScreen";

const WHBranchStack = createNativeStackNavigator<WHBranchStackParamList>();

export default function WHBranchNavigator() {
    return (
        <WHBranchStack.Navigator screenOptions={{ headerShown: false }}>
            <WHBranchStack.Screen name="BHStocks" component={WHStockMonitorScreen} />
        </WHBranchStack.Navigator>
    );
}
