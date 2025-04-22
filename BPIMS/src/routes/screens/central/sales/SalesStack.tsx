import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { CentralSalesParamList } from "../../../navigation/navigation";
import CartScreen from "./CartScreen";
import CustomerListScreen from "./CustomerListScreen";
import DeliveryFeeScreen from "./DeliveryScreen";
import DiscountScreen from "./DiscountScreen";
import ItemScreen from "./ItemScreen";
import NewCustomerScreen from "./NewCustomer";
import PaymentScreen from "./PaymentScreen";
import SlipOrderScreen from "./SlipOrder";
import TransactionScreen from "./Transaction";

const SalesStack = createNativeStackNavigator<CentralSalesParamList>();

export default function CentralSalesStackNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="ItemScreen" component={ItemScreen} />
            <SalesStack.Screen name="Cart" component={CartScreen} />
            <SalesStack.Screen name="DeliveryFee" component={DeliveryFeeScreen} />
            <SalesStack.Screen name="Discount" component={DiscountScreen} />
            <SalesStack.Screen name="Payment" component={PaymentScreen} />
            <SalesStack.Screen name="Transaction" component={TransactionScreen} options={{ gestureEnabled: false }} />
            <SalesStack.Screen name="SlipOrder" component={SlipOrderScreen} />
            <SalesStack.Screen name="CustomerList" component={CustomerListScreen} />
            <SalesStack.Screen name="NewCustomer" component={NewCustomerScreen} />
        </SalesStack.Navigator>
    );
}
