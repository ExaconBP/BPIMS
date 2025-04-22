import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { UsersHQParamList } from "../../../navigation/navigation";
import UserListScreen from "./UserListScreen";
import UserViewScreen from "./UserViewScreen";

const UserStack = createNativeStackNavigator<UsersHQParamList>();

export default function UsersHQNavigator() {
    return (
        <UserStack.Navigator screenOptions={{ headerShown: false }}>
            <UserStack.Screen name="Users" component={UserListScreen} />
            <UserStack.Screen name="UserView" component={UserViewScreen} />
        </UserStack.Navigator>
    );
}
