import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ItemsHQParamList } from "../../../navigation/navigation";
import ItemListScreen from "./ItemListScreen";
import ItemViewScreen from "./ItemView";

const ItemStack = createNativeStackNavigator<ItemsHQParamList>();

export default function ItemsHQNavigator() {
    return (
        <ItemStack.Navigator screenOptions={{ headerShown: false }}>
            <ItemStack.Screen name="Items" component={ItemListScreen} />
            <ItemStack.Screen name="ItemView" component={ItemViewScreen} />
        </ItemStack.Navigator>
    );
}
