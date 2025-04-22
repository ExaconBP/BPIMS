import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { HeadQuarterStackParamList } from "../../navigation/navigation";
import BranchHQNavigator from "./branches/BranchStack";
import CustomerHQNavigator from "./customer/CustomerStack";
import ItemsHQNavigator from "./itemsdata/ItemsDataStack";
import LoyaltyStackNavigator from "./loyalty/LoyaltyStack";
import SalesReportHQNavigator from "./salesreport/SalesReportStack";
import HistoryHQStackNavigator from "./stockhistory/HistoryStack";
import StockMonitorNavigator from "./stocks/StocksMonitorStack";
import UsersHQNavigator from "./users/UserStack";

const HQStack = createNativeStackNavigator<HeadQuarterStackParamList>();

export default function HQNavigator() {
    return (
        <HQStack.Navigator screenOptions={{ headerShown: false }}>
            <HQStack.Screen name="SalesReportStack" component={SalesReportHQNavigator} />
            <HQStack.Screen name="UserStack" component={UsersHQNavigator} />
            <HQStack.Screen name="ItemsStack" component={ItemsHQNavigator} />
            <HQStack.Screen name="StockMonitorStack" component={StockMonitorNavigator} />
            <HQStack.Screen name="CustomerHQStack" component={CustomerHQNavigator} />
            <HQStack.Screen name="HistoryHQStack" component={HistoryHQStackNavigator} />
            <HQStack.Screen name="BranchStack" component={BranchHQNavigator} />
            <HQStack.Screen name="LoyaltyStack" component={LoyaltyStackNavigator} />
        </HQStack.Navigator>
    );
}
