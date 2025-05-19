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
import { ChevronLeft, Repeat } from 'react-native-feather';
import Sidebar from '../../../../components/Sidebar';
import { HistoryStackParamList } from '../../../navigation/navigation';
import { getBranchReturnHistory, getBranchTransferHistory, getStockHistory } from '../../../services/stockRepo';
import { StockInputHistoryDto, StockTransferDto } from '../../../types/stockType';
import { ReturnToWHDto } from '../../../types/userType';
import {
    capitalizeFirstLetter,
    formatTransactionDate,
    formatTransactionDateOnly,
    truncateShortName
} from '../../../utils/dateFormat';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryView'>;

const HistoryScreen = React.memo(({ route }: Props) => {
    const branchItemId = route.params.branchItemId;
    const itemName = route.params.itemName;
    const user = route.params.user;
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
    const [stockInputHistory, setStockInputHistory] = useState<StockInputHistoryDto[]>([]);
    const [branchTransferHistory, setBranchTransferHistory] = useState<StockTransferDto[]>([]);
    const [branchReturnHistory, setBranchReturnHistory] = useState<ReturnToWHDto[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            if (activeCategory === 0) {
                let response = await getStockHistory(branchItemId);
                setStockInputHistory(response.data);
            }
            else if (activeCategory == 1) {
                let response = await getBranchTransferHistory(branchItemId);
                setBranchTransferHistory(response.data);
            }
            else if (activeCategory == 2) {
                let response = await getBranchReturnHistory(branchItemId);
                setBranchReturnHistory(response.data);
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

    const renderItem = useCallback(({ item }: { item: StockInputHistoryDto }) => (
        <TouchableOpacity className="mb-3 p-3 bg-white rounded-lg shadow-sm border border-gray-300">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">Delivered By: {capitalizeFirstLetter(item.deliveredBy)}</Text>
                <Text className="text-gray-500 text-sm">{formatTransactionDateOnly(item.deliveryDate.toString())}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-gray-900 font-semibold">Qty: {item.sellByUnit ? Math.round(Number(item.qty)) : Number(item.qty).toFixed(2)}</Text>
                <Text className="text-green-600 font-semibold">Actual: {item.sellByUnit ? Math.round(Number(item.actualTotalQty)) : Number(item.actualTotalQty).toFixed(2)}</Text>
                <Text className="text-red-500 font-semibold">Expected: {item.sellByUnit ? Math.round(Number(item.expectedTotalQty)) : Number(item.expectedTotalQty).toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    ), []);

    const renderTransfer = useCallback(({ item }: { item: StockTransferDto }) => (
        <TouchableOpacity className="mb-3 p-3 bg-white rounded-lg shadow-sm border border-gray-300">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">{(item.branchFrom.toUpperCase())}</Text>
                <Repeat height={16} width={16} color={"#fe6500"} ></Repeat>
                <Text className="text-gray-700 font-medium">{(item.branchTo.toUpperCase())}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-gray-900 font-semibold">Qty: {item.sellByUnit ? Math.round(Number(item.quantity)) : Number(item.quantity).toFixed(2)}</Text>
                <Text className="text-gray-500 text-sm">{formatTransactionDate(item.date.toString())}</Text>
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

    return (
        <View style={{ flex: 1 }}>
            {user && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />}
            <TitleHeaderComponent isParent={false} title={itemName} onPress={() => navigation.goBack()} userName={user.name}></TitleHeaderComponent>

            <View className="w-full justify-center items-center bg-gray relative mt-4">
                <View className="w-full flex-row justify-between px-2">
                    {[0, 1, 2].map((id) => (
                        <TouchableOpacity
                            key={id}
                            onPress={() => handleChangeCategory(id)}
                            className={`${activeCategory === id ? 'border-b-4 border-yellow-500' : ''} w-[30%] justify-center items-center`}
                        >
                            <Text className={`${activeCategory === id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}>
                                {['STOCK INPUT', 'BRANCH TRANSFER', 'STOCK RETURN'][id]}
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
                        stockInputHistory.length > 0 ? (
                            <FlatList
                                data={stockInputHistory}
                                renderItem={renderItem}
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
                        branchTransferHistory.length > 0 ? (
                            <FlatList
                                data={branchTransferHistory}
                                renderItem={renderTransfer}
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
                </>
            )}
        </View>
    );
});

export default HistoryScreen;
