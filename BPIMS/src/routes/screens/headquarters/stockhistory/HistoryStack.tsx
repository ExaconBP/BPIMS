import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { HistoryStackParamListHQ } from "../../../navigation/navigation";
import HistoryScreen from "./HistoryView";
import ItemListScreen from "./ItemsList";
import WHHistoryScreen from "./WHHistoryView";

const WHBranchStack = createNativeStackNavigator<HistoryStackParamListHQ>();

export default function HistoryHQStackNavigator() {
    return (
        <WHBranchStack.Navigator screenOptions={{ headerShown: false }}>
            <WHBranchStack.Screen name="ItemsList" component={ItemListScreen} />
            <WHBranchStack.Screen name="HistoryView" component={HistoryScreen} />
            <WHBranchStack.Screen name="WHHistoryView" component={WHHistoryScreen} />
        </WHBranchStack.Navigator>
    );
}
