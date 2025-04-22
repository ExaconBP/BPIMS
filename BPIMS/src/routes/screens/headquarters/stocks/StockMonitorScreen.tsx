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
import { Edit3, MinusCircle, PlusCircle, Search } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import HQSidebar from '../../../../components/HQSidebar';
import NumericKeypad from '../../../../components/NumericKeypad';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { StockMonitorParamList } from '../../../navigation/navigation';
import { editStock, editWHStock, getStocksMonitor } from '../../../services/stockRepo';
import { getSupplierList } from '../../../services/whRepo';
import { EditingItemDto, ItemStock } from '../../../types/stockType';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { getSocketData } from '../../../utils/apiService';
import { getUserDetails } from '../../../utils/auth';
import { formatQuantity } from '../../../utils/dateFormat';

const StockMonitorScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [stocks, setStocks] = useState<ItemStock[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loadMore, setLoadMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [criticalCount, setCriticalCount] = useState(0);
    const [suppliers, setSuppliers] = useState<ObjectDto[]>([]);
    const [isInputMode, setInputMode] = useState(false);
    const [editingItem, setEditingItem] = useState<EditingItemDto>();
    const [quantity, setQuantity] = useState<string>("0.00");
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<StockMonitorParamList>>();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }
        const socket = getSocketData('criticalItemsHQ', { branchId: user.branchId });

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

                const objectResponse = await getSupplierList("");
                setSuppliers(objectResponse.data);
                const response = await getStocksMonitor(
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

    const handleStockInput = useCallback((item: ItemStock, id: number, isWH: boolean, whQty: number | null) => {
        if (user) {
            if (isWH)
                navigation.navigate('StockInput', { item, user, branchId: null, whId: id, whQty, suppliers });
            else
                navigation.navigate('StockInput', { item, user, branchId: id, whId: null, whQty, suppliers });
        }
    }, [user, navigation]);

    const handleReturnToSupplier = useCallback((item: ItemStock) => {
        if (user) {
            navigation.navigate('ReturnStock', { item, user, suppliers });
        }
    }, [user, navigation]);

    const constInputMode = useCallback(
        (
            id: number,
            qty: number,
            isWareHouse: boolean,
            sellByUnit: boolean,
            itemName: string,
            branchName: string
        ) => {
            const formattedQty = sellByUnit ? Number(qty) : qty;

            setQuantity(formattedQty.toString());
            setEditingItem((prev) =>
                prev
                    ? { ...prev, id, qty, isWareHouse, itemName, branchName, sellByUnit }
                    : { id, qty, isWareHouse, itemName, branchName, sellByUnit }
            );
            setInputMode((prev) => !prev);
        },
        []
    );

    const handleKeyPress = useCallback((key: string) => {
        if (editingItem) {
            if (editingItem.sellByUnit) {
                const currentValue = quantity.toString() || '';
                const newValue = currentValue + key;
                setQuantity(newValue);
            }
            else {
                let current = quantity.replace('.', '');
                current += key;
                const formatted = (parseInt(current) / 100).toFixed(2);
                setQuantity(formatted);
            }
        }
    }, [editingItem, quantity]);

    const handleBackspace = useCallback(() => {
        if (editingItem) {
            if (editingItem.sellByUnit) {
                const currentValue = quantity.toString() || '';
                const newValue = currentValue.slice(0, -1);
                setQuantity(newValue);
            } else {
                let current = quantity.replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                setQuantity(formatted);
            }
        }
    }, [editingItem, quantity]);

    const saveEditedStock = useCallback(async () => {
        setButtonLoading(true)
        if (!editingItem) return;

        if (editingItem.isWareHouse) {
            await editWHStock(editingItem.id, Number(quantity));
        } else {
            await editStock(editingItem.id, Number(quantity));
        }
        setButtonLoading(false)
        setInputMode((prev) => !prev);

        await getItems(0, 1, "");
    }, [editingItem, quantity]);

    const calculateTotalQuantity = useCallback((item: ItemStock) => {
        const branchesTotal = item.branches.reduce((sum, branch) => sum + Number(branch.quantity), 0);
        return branchesTotal + Number(item.whQty);
    }, []);

    const renderItem = useCallback(
        ({ item }: { item: ItemStock }) => {
            const getQuantityTextColor = (quantity: number, criticalValue: number) =>
                quantity < criticalValue ? 'text-red-500' : 'text-gray-700';

            return (
                <View className="bg-white rounded-lg shadow-sm mb-3 mx-2 p-4">
                    <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <View className="flex-1 pr-2">
                            <ExpandableText text={item.name} />
                        </View>
                        <View className="flex-row items-center space-x-1">
                            <Text className="text-green-600 font-semibold text-base">
                                {formatQuantity(calculateTotalQuantity(item), item.sellByUnit)}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                {item.unitOfMeasure || 'pcs'}
                            </Text>
                        </View>
                    </View>

                    <View className="space-y-3">
                        <View className="flex-row justify-between items-center">
                            <View className="flex-1">
                                <Text className={`text-sm ${getQuantityTextColor(Number(item.whQty), Number(item.whCriticalValue))}`}>
                                    {item.whName}
                                </Text>
                            </View>

                            <View className="flex-row items-center space-x-3">
                                <View className="flex-row items-center bg-gray-50 rounded-md px-2 py-1">
                                    <Text className={`text-sm font-medium ${getQuantityTextColor(Number(item.whQty), Number(item.whCriticalValue))}`}>
                                        {formatQuantity(item.whQty, item.sellByUnit)}
                                    </Text>
                                    <Text className="text-gray-500 text-sm ml-1">
                                        {item.unitOfMeasure || 'pcs'}
                                    </Text>
                                </View>
                                <View className="flex-row space-x-2">

                                    {activeCategory === 0 && (
                                        <TouchableOpacity
                                            onPress={() => constInputMode(item.whId, item.whQty, true, item.sellByUnit, item.name, item.whName)}
                                            className="p-2 bg-orange-50 rounded-full"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Edit3 height={18} color="#fe6500" />
                                        </TouchableOpacity>
                                    )}
                                    {(activeCategory === 2 || activeCategory == 1) && (
                                        <TouchableOpacity
                                            onPress={() => handleStockInput(item, item.whId, true, null)}
                                            className="p-2 bg-orange-50 rounded-full"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <PlusCircle height={18} color="#fe6500" />
                                        </TouchableOpacity>
                                    )}
                                    {activeCategory === 2 && (
                                        <TouchableOpacity
                                            onPress={() => handleReturnToSupplier(item)}
                                            className="p-2 bg-orange-50 rounded-full"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <MinusCircle height={18} color="#fe6500" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                            </View>
                        </View>

                        {item.branches.map((branch) => {
                            const isCritical = Number(branch.quantity) < Number(item.storeCriticalValue);
                            const quantityColor = activeCategory === 1
                                ? getQuantityTextColor(branch.quantity, item.storeCriticalValue)
                                : 'text-gray-700';

                            return (
                                <View key={`${branch.id}-${branch.branchId}`} className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className={`text-sm ${isCritical && activeCategory === 1 ? 'text-red-500' : 'text-gray-600'}`}>
                                            {branch.name}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center space-x-3">
                                        <View className="flex-row items-center bg-gray-50 rounded-md px-2 py-1">
                                            <Text className={`text-sm font-medium ${quantityColor}`}>
                                                {formatQuantity(branch.quantity, item.sellByUnit)}
                                            </Text>
                                            <Text className="text-gray-500 text-sm ml-1">
                                                {item.unitOfMeasure || 'pcs'}
                                            </Text>
                                        </View>

                                        {activeCategory === 0 && (
                                            <TouchableOpacity
                                                onPress={() => constInputMode(branch.id, branch.quantity, false, item.sellByUnit, item.name, branch.name)}
                                                className="p-2 bg-orange-50 rounded-full"
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Edit3 height={18} color="#fe6500" />
                                            </TouchableOpacity>
                                        )}

                                        {(activeCategory === 1 || activeCategory === 2) && (
                                            <TouchableOpacity
                                                onPress={() => handleStockInput(item, branch.id, false, item.whQty)}
                                                className="p-2 bg-orange-50 rounded-full"
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <PlusCircle height={18} color="#fe6500" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            );
        },
        [activeCategory, handleStockInput, calculateTotalQuantity, constInputMode]
    );

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, display: isInputMode ? 'flex' : 'none' }}>
                <TitleHeaderComponent onPress={() => setInputMode(false)} isParent={false} title='please enter quantity' userName=''
                ></TitleHeaderComponent>
                <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                <View className="items-center mt-4">
                    <View className="flex flex-column items-center">
                        <Text className="text-lg font-bold text-gray-600 px-3 mt-4">
                            {editingItem && `Enter New Quantity: ${editingItem.itemName}`}
                        </Text>
                        <Text className="text-sm font-bold text-gray-600 px-3 mt-4">
                            {editingItem && `${editingItem.branchName}`}
                        </Text>
                        <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                            <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                {editingItem && (editingItem.sellByUnit ? Number(quantity) : Number(quantity || 0).toFixed(2))}
                            </Text>
                        </View>
                    </View>
                </View>
                <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                    <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                    <TouchableOpacity disabled={buttonLoading == true} onPress={saveEditedStock} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${quantity === "0.00" ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                    >
                        <View className="flex-1 items-center">
                            <Text className={`text-lg text-center font-bold ${quantity === "0.00" ? 'text-[#fe6500]' : 'text-white'}`}>
                                Save
                            </Text>
                        </View>

                        {buttonLoading && (
                            <ActivityIndicator color={"white"} size={'small'} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1, display: !isInputMode ? 'flex' : 'none' }}>
                {user && (
                    <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
                )}
                <TitleHeaderComponent isParent={true} userName={user?.name || ''} title={'STOCKS MONITOR'} onPress={toggleSidebar}></TitleHeaderComponent>

                <View className="w-full justify-center items-center bg-gray relative">
                    <View className="w-full flex-row justify-between items-center">
                        {['STOCKS', 'LOW STOCK ITEMS', 'STOCK INPUTS'].map((label, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleChangeCategory(index)}
                                className={`${activeCategory === index ? 'border-b-4 border-yellow-500' : ''} ${index == 2 ? 'flex flex-row' : ''} w-[30%] justify-center items-center`}
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
                                {index === 2 && <PlusCircle height={13} color="#fe6500" />}
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
        </View>
    );
});

export default StockMonitorScreen;