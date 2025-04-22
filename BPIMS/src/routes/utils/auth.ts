import AsyncStorage from "@react-native-async-storage/async-storage";
import MD5 from "crypto-js/md5";
import { UserDetails, UserDto } from "../types/userType";

export function hashPassword(password: string): string {
    return MD5(password).toString();
}

export async function setUserLogIn(user: UserDto) {
    await AsyncStorage.setItem('username', user.name);
    await AsyncStorage.setItem('departmentId', user.departmentId?.toString() ?? '');
    await AsyncStorage.setItem('branchName', user.branchName ?? '');
    await AsyncStorage.setItem('branchId', user.branchId !== null && user.branchId !== undefined ? user.branchId.toString() : '');
    await AsyncStorage.setItem('departmentName', user.departmentName);
    await AsyncStorage.setItem('authToken', user.token);
    await AsyncStorage.setItem('hasHeadAccess', user.hasHeadAccess.toString());
}

export async function getUser() {
    const authToken = await AsyncStorage.getItem('authToken');

    if (authToken !== null) {
        return true;
    }
    else return false;
}

export async function getUserDetails() {
    const storedDeptId = await AsyncStorage.getItem('departmentId');
    const storedUserName = await AsyncStorage.getItem('username');
    const storedBranchName = await AsyncStorage.getItem('branchName');
    const storedDepartmentName = await AsyncStorage.getItem('departmentName');
    const storeBranchId = await AsyncStorage.getItem('branchId');
    const storeAccess = await AsyncStorage.getItem('hasHeadAccess');

    if (storedDeptId && storedUserName && storedDepartmentName && storeAccess) {
        let user: UserDetails = {
            departmentId: parseInt(storedDeptId, 10),
            name: storedUserName,
            branchName: storedBranchName ?? null,
            departmentName: storedDepartmentName,
            branchId: storeBranchId ? parseInt(storeBranchId, 10) : null,
            hasHeadAccess: storeAccess
        };
        return user;
    }
}


export async function logOutUser() {
    try {
        await AsyncStorage.removeItem("username");
        await AsyncStorage.removeItem("userId");
        await AsyncStorage.removeItem("branchName");
        await AsyncStorage.removeItem("departmentName");
        await AsyncStorage.removeItem("departmentId")
        await AsyncStorage.removeItem("authToken");
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

export async function getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
}