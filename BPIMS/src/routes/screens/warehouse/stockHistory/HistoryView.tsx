import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Sidebar from '../../../../components/Sidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { HistoryStackParamListHQ, HistoryWHStackParamList } from '../../../navigation/navigation';
import { getBranchReturnHistory } from '../../../services/stockRepo';
import { getReturnToStockHistory, getWHStockHistory } from '../../../services/whRepo';
import { ReturnToWHDto } from '../../../types/userType';
import { ReturnToStockDto, WHStockInputHistoryDto } from '../../../types/whType';
import {
    formatTransactionDate,
    formatTransactionDateOnly
} from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<HistoryWHStackParamList, 'WHHistoryView'>;

const WHHistoryScreen = React.memo(({ route }: Props) => {
    const branchItemId = route.params.branchItemId;
    const itemName = route.params.itemName;
    const user = route.params.user;
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamListHQ>>();
    const [returnToStockHistory, setReturnToStockHistory] = useState<ReturnToStockDto[]>([]);
    const [branchReturnHistory, setBranchReturnHistory] = useState<ReturnToWHDto[]>([]);
    const [itemHistory, setItemHistory] = useState<WHStockInputHistoryDto[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            if (activeCategory === 0) {
                let response = await getWHStockHistory(branchItemId);
                setItemHistory(response.data);
            }
            else if (activeCategory === 1) {
                let response = await getBranchReturnHistory(branchItemId);
                setBranchReturnHistory(response.data);
            }
            else if (activeCategory == 2) {
                let response = await getReturnToStockHistory(branchItemId);
                setReturnToStockHistory(response.data);
            }

            setLoading(false);
        };
        fetchHistory();
    }, [activeCategory]);

    const handleChangeCategory = useCallback((id: number) => {
        setActiveCategory(id);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const renderReturnSupplier = useCallback(({ item }: { item: ReturnToStockDto }) => (
        <TouchableOpacity className="mb-3 p-3 bg-white rounded-lg shadow-sm border border-gray-300">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">{(item.supplierName)}</Text>
                <Text className="text-gray-500 text-sm">{formatTransactionDate(item.date.toString())}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-gray-900 font-semibold">Qty:  {item.sellByUnit ? Math.round(Number(item.quantity)) : Number(item.quantity).toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-gray-900 font-semibold">Reason: {item.reason}</Text>
            </View>
        </TouchableOpacity>
    ), []);

    const renderReturn = useCallback(({ item }: { item: ReturnToWHDto }) => (
        <TouchableOpacity className="mb-3 p-3 bg-white rounded-lg shadow-sm border border-gray-300">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-900 font-semibold">Qty: {item.sellByUnit ? Math.round(Number(item.quantity)) : Number(item.quantity).toFixed(2)}</Text>
                <Text className="text-gray-500 text-sm">{formatTransactionDate(item.date.toString())}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-gray-900 font-semibold">Reason: {item.reason}</Text>
            </View>
        </TouchableOpacity>
    ), []);


    const renderInputHistory = useCallback(({ item }: { item: WHStockInputHistoryDto }) => (
        <TouchableOpacity className="mb-3 p-3 bg-white rounded-lg shadow-sm border border-gray-300">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">Delivered By: {(item.deliveredByName || "(No Supplier)")}</Text>
                <Text className="text-gray-500 text-sm">{formatTransactionDateOnly(item.deliveryDate.toString())}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-gray-900 font-semibold">Qty: {item.sellByUnit ? Math.round(Number(item.qty)) : Number(item.qty).toFixed(2)}</Text>
                <Text className="text-green-600 font-semibold">Actual: {item.sellByUnit ? Math.round(Number(item.actualTotalQty)) : Number(item.actualTotalQty).toFixed(2)}</Text>
                <Text className="text-red-500 font-semibold">Expected: {item.sellByUnit ? Math.round(Number(item.expectedTotalQty)) : Number(item.expectedTotalQty).toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    ), []);

    return (
        <View style={{ flex: 1 }}>
            {user && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />}
            <TitleHeaderComponent isParent={false} userName={user?.name || ""} title={itemName} onPress={() => navigation.push('ItemsList')}></TitleHeaderComponent>

            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between items-center">
                    {[0, 1, 2].map((id) => (
                        <TouchableOpacity
                            key={id}
                            onPress={() => handleChangeCategory(id)}
                            className={`${activeCategory === id ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center p-2`}
                        >
                            <Text className={`${activeCategory === id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}>
                                {['STOCK INPUT', 'STOCK RETURN', 'SUPPLIER RETURN'][id]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <View className="w-full h-[2px] bg-gray-500"></View>

            {loading ? (
                <View className="py-2">
                    <ActivityIndicator size="small" color="#fe6500" />
                    <Text className="text-center text-[#fe6500]">Loading Stock History...</Text>
                </View>
            ) : (
                <>
                    {activeCategory === 0 && (
                        itemHistory.length > 0 ? (
                            <FlatList
                                data={itemHistory}
                                renderItem={renderInputHistory}
                                keyExtractor={(item) => item.id.toString()}
                                className="w-full mt-4 px-4"
                            />
                        ) : (
                            <View className="py-2">
                                <Text className="text-center text-gray-500">No history available.</Text>
                            </View>
                        )
                    )}
                    {activeCategory === 1 && (
                        branchReturnHistory.length > 0 ? (
                            <FlatList
                                data={branchReturnHistory}
                                renderItem={renderReturn}
                                keyExtractor={(item) => item.id.toString()}
                                className="w-full mt-4 px-4"
                            />
                        ) : (
                            <View className="py-2">
                                <Text className="text-center text-gray-500">No history available.</Text>
                            </View>
                        )
                    )}
                    {activeCategory === 2 && (
                        returnToStockHistory.length > 0 ? (
                            <FlatList
                                data={returnToStockHistory}
                                renderItem={renderReturnSupplier}
                                keyExtractor={(item) => item.id.toString()}
                                className="w-full mt-4 px-4"
                            />
                        ) : (
                            <View className="py-2">
                                <Text className="text-center text-gray-500">No history available.</Text>
                            </View>
                        )
                    )}
                </>
            )}
        </View>
    );
});

export default WHHistoryScreen;
