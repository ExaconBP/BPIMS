import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { BranchHQParamList } from "../../../navigation/navigation";
import BranchListScreen from "./BranchListScreen";
import BranchViewScreen from "./BranchView";

const BranchStack = createNativeStackNavigator<BranchHQParamList>();

export default function BranchHQNavigator() {
    return (
        <BranchStack.Navigator screenOptions={{ headerShown: false }}>
            <BranchStack.Screen name="Branches" component={BranchListScreen} />
            <BranchStack.Screen name="BranchView" component={BranchViewScreen} />
        </BranchStack.Navigator>
    );
}
