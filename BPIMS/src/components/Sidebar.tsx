import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Dimensions, Image, Animated, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../routes/navigation/navigation";
import CartIcon from "./icons/ShoppingCart";
import { UserDetails } from "../routes/types/userType";
import { ChevronLeft, RotateCcw, Users } from "react-native-feather";
import StockIcon from "./icons/Stock";
import AnalyticsIcon from "./icons/Analytics";
import { logOutUser } from "../routes/utils/auth";
import { getSocketData } from "../routes/utils/apiService";
import { debounce } from "lodash";

type SidebarProps = {
    isVisible: boolean;
    toggleSidebar: () => void;
    userDetails?: UserDetails;
};

const Sidebar = React.memo(({ isVisible, toggleSidebar, userDetails }: SidebarProps) => {
    const screenWidth = useMemo(() => Dimensions.get("window").width, []);
    const sidebarWidth = useMemo(() => screenWidth * 0.6, [screenWidth]);
    const isTablet = useMemo(() => screenWidth >= 768, [screenWidth]);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [criticalCount, setCriticalCount] = useState(0);

    const translateX = useRef(new Animated.Value(-sidebarWidth)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const sidebarPosition = useRef(new Animated.Value(-sidebarWidth)).current;
    const debouncedSetCriticalCount = useCallback(debounce((count: number) => {
        setCriticalCount(count);
    }, 100), []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: isVisible ? 0.5 : 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(sidebarPosition, {
                toValue: isVisible ? 0 : -sidebarWidth,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    }, [isVisible, sidebarWidth]);

    useEffect(() => {
        if (!userDetails) return;

        const socket = getSocketData('criticalItems', { branchId: userDetails.branchId });

        socket.onmessage = (event) => {
            debouncedSetCriticalCount(Number(event.data));
        };

        return () => {
            socket.close();
        };
    }, [debouncedSetCriticalCount, userDetails]);

    const handleClick = useCallback((page: keyof RootStackParamList) => {
        toggleSidebar();
        navigation.navigate(page);
    }, [toggleSidebar, navigation]);

    const handleLogOut = useCallback(async () => {
        await logOutUser();
        navigation.navigate('Home');
    }, [navigation]);

    const menuItems = useMemo(() => [
        { IconComponent: <CartIcon size={isTablet ? 26 : 22} />, text: "Items", page: "ItemStack" },
        { IconComponent: <Users height={isTablet ? 20 : 16} width={isTablet ? 20 : 16} color="#ffffff" />, text: "Customers", page: "CustomerStack" }
    ], [isTablet]);

    const branchHeadItems = useMemo(() => [
        { IconComponent: <StockIcon size={isTablet ? 26 : 22} />, text: "Branch Stocks", page: "BranchStockStack" },
        { IconComponent: <AnalyticsIcon size={isTablet ? 24 : 20} />, text: "Sales Report", page: "SalesReportStack" },
        { IconComponent: <RotateCcw height={isTablet ? 20 : 16} width={isTablet ? 20 : 16} color="#ffffff" />, text: "Stock History", page: "HistoryStack" }
    ], [isTablet]);

    return (
        <>
            {isVisible && (
                <Animated.View
                    style={[styles.overlay, { opacity: overlayOpacity }]}
                >
                    <TouchableOpacity
                        style={styles.overlayTouchable}
                        activeOpacity={1}
                        onPress={toggleSidebar}
                    />
                </Animated.View>
            )}


            <Animated.View
                className="bg-[#fe6500] pt-7 px-1 absolute top-0 bottom-0 z-50"
                style={{
                    width: sidebarWidth,
                    transform: [{ translateX: sidebarPosition }],
                }}
            >
                <View className="flex items-center mb-10">
                    <Image source={require("./images/icon-orange-bg.png")} className="w-20 h-20 mb-3" />
                    <View className="relative w-full flex-row justify-center items-center">
                        <View className="items-center flex-1">
                            {userDetails?.branchName && (
                                <Text className={`text-white font-bold ${isTablet ? "text-[20px]" : "text-[14px]"}`}>
                                    {userDetails?.branchName.toUpperCase()}
                                </Text>
                            )}
                            <Text className={`text-white ${isTablet ? "text-lg" : "text-[12px]"}`}>
                                {userDetails?.name.toUpperCase()}
                            </Text>
                            <View className="absolute right-0 ml-2">
                                <TouchableOpacity onPress={toggleSidebar}>
                                    <ChevronLeft height={isTablet ? 40 : 28} width={isTablet ? 40 : 28} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        onPress={() => handleClick(item.page as any)}
                        key={index}
                        className="flex-row items-center w-full px-3 mb-2"
                    >
                        <View className="w-10 items-center">{item.IconComponent}</View>
                        <Text className={`text-white ${isTablet ? "text-lg" : "text-base"} ml-2`}>{item.text}</Text>
                    </TouchableOpacity>
                ))}

                <View className="mt-6">
                    <Text className={`text-white ${isTablet ? "text-lg" : "text-[12px]"} text-center font-bold mb-2`}>
                        BRANCH HEAD ACCESS
                    </Text>

                    {branchHeadItems.map((item, index) => (
                        <TouchableOpacity
                            onPress={() => handleClick(item.page as any)}
                            key={index}
                            className="flex-row items-center w-full px-3 mb-2 relative"
                            disabled={userDetails?.hasHeadAccess === "false"}
                        >
                            <View className="w-10 items-center relative">
                                {item.IconComponent}
                            </View>

                            <Text className={`text-white ${isTablet ? "text-lg" : "text-base"} ml-2`}>
                                {item.text}
                            </Text>

                            {item.text === "Branch Stocks" && criticalCount > 0 && (
                                <View className="bg-red-500 rounded-full px-1.5 flex items-center justify-center -mt-3">
                                    <Text className="text-white text-xs font-bold">{criticalCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="items-center mt-10">
                    <TouchableOpacity
                        className={`bg-white rounded-full items-center ${isTablet ? 'py-3 px-8' : 'py-2 px-6'}`}
                        onPress={handleLogOut}
                    >
                        <Text className={`text-[#fe6500] font-bold ${isTablet ? 'text-lg' : 'text-md'}`}>LOG OUT</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </>
    );
});

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 40,
    },
    overlayTouchable: {
        flex: 1,
    },
});

export default Sidebar;