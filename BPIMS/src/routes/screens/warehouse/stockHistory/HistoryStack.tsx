import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { HistoryWHStackParamList } from "../../../navigation/navigation";
import WHHistoryScreen from "./HistoryView";
import ItemListScreen from "./ItemsList";

const WHHistoryStack = createNativeStackNavigator<HistoryWHStackParamList>();

export default function HistoryStackNavigator() {
    return (
        <WHHistoryStack.Navigator screenOptions={{ headerShown: false }}>
            <WHHistoryStack.Screen name="ItemsList" component={ItemListScreen} />
            <WHHistoryStack.Screen name="WHHistoryView" component={WHHistoryScreen} />
        </WHHistoryStack.Navigator>
    );
}
