import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { LoyaltyParamsList } from "../../../navigation/navigation";
import LoyaltyMonitorScreen from "./LoyaltyScreen";
import LoyaltyStageScreen from "./LoyaltyStage";
import LoyaltyViewScreen from "./LoyaltyView";
import RewardViewScreen from "./RewardView";

const LoyaltyStack = createNativeStackNavigator<LoyaltyParamsList>();

export default function LoyaltyStackNavigator() {
    return (
        <LoyaltyStack.Navigator screenOptions={{ headerShown: false }}>
            <LoyaltyStack.Screen name="LoyaltyScreen" component={LoyaltyMonitorScreen} />
            <LoyaltyStack.Screen name="LoyaltyView" component={LoyaltyViewScreen} />
            <LoyaltyStack.Screen name="RewardView" component={RewardViewScreen} />
            <LoyaltyStack.Screen name="LoyaltyStage" component={LoyaltyStageScreen} />
        </LoyaltyStack.Navigator>
    );
}
