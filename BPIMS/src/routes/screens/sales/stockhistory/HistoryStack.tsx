import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { HistoryStackParamList } from "../../../navigation/navigation";
import HistoryScreen from "./HistoryView";
import ItemListScreen from "./ItemsList";

const WHBranchStack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStackNavigator() {
    return (
        <WHBranchStack.Navigator screenOptions={{ headerShown: false }}>
            <WHBranchStack.Screen name="ItemsList" component={ItemListScreen} />
            <WHBranchStack.Screen name="HistoryView" component={HistoryScreen} />
        </WHBranchStack.Navigator>
    );
}
