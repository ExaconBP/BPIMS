import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ItemStackParamList } from "../../../navigation/navigation";
import CartScreen from "./CartScreen";
import CustomerListScreen from "./CustomerListScreen";
import DeliveryFeeScreen from "./DeliveryFeeScreen";
import DiscountScreen from "./DiscountScreen";
import ItemScreen from "./ItemScreen";
import NewCustomerScreen from "./NewCustomer";
import PaymentScreen from "./PaymentScreen";
import SlipOrderScreen from "./SlipOrder";
import TransactionSreen from "./Transaction";

const ItemStack = createNativeStackNavigator<ItemStackParamList>();

export default function ItemNavigator() {
  return (
    <ItemStack.Navigator screenOptions={{ headerShown: false }}>
      <ItemStack.Screen name="Item" component={ItemScreen} />
      <ItemStack.Screen name="Cart" component={CartScreen} />
      <ItemStack.Screen name="DeliveryFee" component={DeliveryFeeScreen} />
      <ItemStack.Screen name="Discount" component={DiscountScreen} />
      <ItemStack.Screen name="Payment" component={PaymentScreen} />
      <ItemStack.Screen name="Transaction" component={TransactionSreen} options={{ gestureEnabled: false }} />
      <ItemStack.Screen name="SlipOrder" component={SlipOrderScreen} />
      <ItemStack.Screen name="CustomerList" component={CustomerListScreen} />
      <ItemStack.Screen name="NewCustomer" component={NewCustomerScreen} />
    </ItemStack.Navigator>
  );
}
