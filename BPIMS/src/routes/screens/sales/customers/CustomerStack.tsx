import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { CustomerStackParamList } from "../../../navigation/navigation";
import CustomerScreen from "./CustomerScreen";
import CustomerViewScreen from "./CustomerViewScreen";
import TransactionHistoryScreen from "./TransactionHistory";

const CustomersStack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerNavigator() {
  return (
    <CustomersStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomersStack.Screen name="Customer" component={CustomerScreen} />
      <CustomersStack.Screen name="CustomerView" component={CustomerViewScreen} />
      <CustomersStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    </CustomersStack.Navigator>
  );
}
