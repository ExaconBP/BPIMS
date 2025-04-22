import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Search } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import WHSidebar from '../../../../components/WHSidebar';
import { WHBranchStackParamList } from '../../../navigation/navigation';
import { getWHStocksMonitor } from '../../../services/whRepo';
import { WHItemStock } from '../../../types/stockType';
import { UserDetails } from '../../../types/userType';
import { getSocketData } from '../../../utils/apiService';
import { getUserDetails } from '../../../utils/auth';
import { formatQuantity } from '../../../utils/dateFormat';

const WHStockMonitorScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [stocks, setStocks] = useState<WHItemStock[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loadMore, setLoadMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [criticalCount, setCriticalCount] = useState(0);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<WHBranchStackParamList>>();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }
        const socket = getSocketData('criticalItemsBranches');

        socket.onmessage = (event) => {
            setCriticalCount(Number(event.data));
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socket.close();
        };
    }, [user]);

    useEffect(() => {
        getItems(activeCategory, page, search);
    }, [search, activeCategory, page]);

    const getItems = useCallback(
        async (categoryId: number, page: number, search: string) => {
            try {
                if (activeCategory !== lastCategory) {
                    setStocks([]);
                }
                if (!loadMore) setLoading(true);

                const userResponse = await getUserDetails();
                setUser(userResponse);

                const response = await getWHStocksMonitor(
                    categoryId,
                    page,
                    search.trim()
                );

                if (response.isSuccess) {
                    const newProducts = response.data;
                    setStocks((prevProducts) =>
                        page === 1 ? newProducts : [...prevProducts, ...newProducts]
                    );
                    setHasMoreData(newProducts.length > 0 && stocks.length + newProducts.length < (response.totalCount || 0));
                } else {
                    setStocks([]);
                }

                setLoading(false);
                setLoadMore(false);
            }
            finally {
                setLoading(false);
                setLoadMore(false);
            }
        },
        [activeCategory, lastCategory, loadMore, stocks.length]
    );

    const handleLoadMore = useCallback(() => {
        if (loading || loadMore || !hasMoreData) return;
        setLastCategory(activeCategory);
        setLoadMore(true);
        setPage(prevPage => prevPage + 1);
    }, [hasMoreData, loading, loadMore, activeCategory]);

    const handleChangeCategory = useCallback((id: number) => {
        if (activeCategory !== id) {
            setActiveCategory(id);
            setPage(1);
            setStocks([]);
            setHasMoreData(false);
        }
    }, [activeCategory]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const calculateTotalQuantity = useCallback((item: WHItemStock) => {
        return item.branches.reduce((sum, branch) => sum + Number(branch.quantity), 0);
    }, []);

    const renderItem = useCallback(
        ({ item }: { item: WHItemStock }) => {
            const getQuantityTextColor = (quantity: number, criticalValue: number) =>
                quantity < criticalValue ? 'text-red-500' : 'text-gray-700';

            return (
                <View className="bg-white rounded-lg shadow-sm mb-3 mx-2 p-4">
                    <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <View className="flex-1 pr-2">
                            <ExpandableText
                                text={item.name}
                            />
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-green-600 font-semibold text-base">
                                {formatQuantity(calculateTotalQuantity(item), item.sellByUnit)}
                            </Text>
                            <Text className="text-gray-500 text-sm ml-1">
                                {item.unitOfMeasure || 'pcs'}
                            </Text>
                        </View>
                    </View>

                    <View className="space-y-2">
                        {item.branches.map((branch) => {
                            const isCritical = Number(branch.quantity) < Number(item.storeCriticalValue);
                            const quantityColor = activeCategory === 1
                                ? getQuantityTextColor(branch.quantity, item.storeCriticalValue)
                                : 'text-gray-700';

                            return (
                                <View
                                    key={`${branch.id}-${branch.branchId}`}
                                    className="flex-row justify-between items-center"
                                >
                                    <Text
                                        className={`flex-1 text-sm ${isCritical && activeCategory === 1 ? 'text-red-500' : 'text-gray-600'}`}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {branch.name}
                                    </Text>

                                    <View className="flex-row items-center">
                                        <Text className={`text-sm font-medium ${quantityColor}`}>
                                            {formatQuantity(branch.quantity, item.sellByUnit)}
                                        </Text>
                                        <Text className="text-gray-500 text-sm ml-1">
                                            {item.unitOfMeasure || 'pcs'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            );
        },
        [activeCategory, calculateTotalQuantity]
    );

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <WHSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Branch Stocks" onPress={toggleSidebar}></TitleHeaderComponent>

            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between items-center">
                    {['STOCKS', 'LOW STOCK ITEMS'].map((label, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleChangeCategory(index)}
                            className={`${activeCategory === index ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center p-2`}
                        >
                            <View className="flex-row items-center space-x-1">
                                <Text
                                    className={`${activeCategory === index ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                                >
                                    {label}
                                </Text>
                                {index === 1 && criticalCount > 0 && (
                                    <View className="bg-red-500 rounded-full px-1 flex items-center justify-center -mt-3">
                                        <Text className="text-white text-[8px] font-bold">{criticalCount}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <View className="justify-center items-center bg-gray relative mb-2">
                <View className="flex flex-row w-full bg-gray-300 mt-1 py-1 px-3 justify-between items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search items..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={(text) => {
                                setLoading(true);
                                setSearch(text);
                                setPage(1);
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                </View>
                {loading && (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Fetching items...</Text>
                    </View>
                )}
            </View>
            <View className="flex-1">
                <FlatList
                    data={stocks}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id.toString() + index.toString()}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListFooterComponent={
                        loadMore ? <ActivityIndicator size="small" color="#fe6500" /> : null
                    }
                />
            </View>
        </View>
    );
});

export default WHStockMonitorScreen;