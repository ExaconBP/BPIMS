import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const CATEGORIES = ['STOCKS', 'LOW STOCK ITEMS', 'STOCK INPUTS'];

const pageSize = 30;

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

const StockMonitorScreen = React.memo(() => {
    // State management
    const [state, setState] = useState({
        loading: false,
        search: '',
        stocks: [] as ItemStock[],
        user: undefined as UserDetails | undefined,
        isSidebarVisible: false,
        activeCategory: 0,
        lastCategory: null as number | null,
        page: 1,
        loadMore: false,
        hasMoreData: true,
        criticalCount: 0,
        suppliers: [] as ObjectDto[],
        isInputMode: false,
        editingItem: undefined as EditingItemDto | undefined,
        quantity: "0.00",
        buttonLoading: false,
    });

    // Refs
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<StockMonitorParamList>>();

    // Memoized values
    const memoizedUser = useMemo(() => state.user, [state.user]);
    const memoizedActiveCategory = useMemo(() => state.activeCategory, [state.activeCategory]);
    const memoizedPage = useMemo(() => state.page, [state.page]);
    const memoizedEditingItem = useMemo(() => state.editingItem, [state.editingItem]);
    const debouncedSearch = useDebounce(state.search, 300);

    // Fetch user details and suppliers on initial mount
    useEffect(() => {
        const fetchUserAndSuppliers = async () => {
            try {
                const [userResponse, suppliersResponse] = await Promise.all([
                    getUserDetails(),
                    getSupplierList("")
                ]);
                setState(prev => ({
                    ...prev,
                    user: userResponse,
                    suppliers: suppliersResponse.data
                }));
            } catch (error) {
                console.error('Failed to fetch user or suppliers:', error);
            }
        };

        fetchUserAndSuppliers();
    }, []);

    // WebSocket for critical items count
    useEffect(() => {
        if (!memoizedUser) return;

        const socket = getSocketData('criticalItemsHQ', { branchId: memoizedUser.branchId });

        socket.onmessage = (event) => {
            setState(prev => ({ ...prev, criticalCount: Number(event.data) }));
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socket.close();
        };
    }, [memoizedUser]);

    // Fetch items when search, category or page changes
    useEffect(() => {
        const fetchItems = async () => {
            try {
                if (state.activeCategory !== state.lastCategory) {
                    setState(prev => ({ ...prev, stocks: [] }));
                }

                const loadingState = state.page === 1 ? 'loading' : 'loadMore';
                setState(prev => ({ ...prev, [loadingState]: true }));

                const response = await getStocksMonitor(
                    state.activeCategory,
                    state.page,
                    debouncedSearch.trim()
                );

                if (response.isSuccess) {
                    const newProducts = response.data;
                    setState(prev => ({
                        ...prev,
                        stocks: state.page === 1 ? newProducts : [...prev.stocks, ...newProducts],
                        hasMoreData: newProducts.length > 0 &&
                            (state.page === 1 || prev.stocks.length + newProducts.length < (response.totalCount || 0))
                    }));
                } else {
                    setState(prev => ({ ...prev, stocks: [] }));
                }
            } catch (error) {
                console.error('Failed to fetch items:', error);
            } finally {
                setState(prev => ({ ...prev, loading: false, loadMore: false }));
            }
        };

        fetchItems();
    }, [debouncedSearch, memoizedActiveCategory, memoizedPage]);

    // Callbacks
    const toggleSidebar = useCallback(() => {
        setState(prev => ({ ...prev, isSidebarVisible: !prev.isSidebarVisible }));
    }, []);

    const handleLoadMore = useCallback(() => {
        if (state.loading || state.loadMore || !state.hasMoreData) return;
        setState(prev => ({
            ...prev,
            lastCategory: prev.activeCategory,
            loadMore: true,
            page: prev.page + 1
        }));
    }, [state.hasMoreData, state.loading, state.loadMore, state.activeCategory]);

    const handleChangeCategory = useCallback((id: number) => {
        if (state.activeCategory !== id) {
            setState(prev => ({
                ...prev,
                activeCategory: id,
                page: 1,
                stocks: [],
                hasMoreData: false
            }));
        }
    }, [state.activeCategory]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleStockInput = useCallback((item: ItemStock, id: number, isWH: boolean, whQty: number | null) => {
        if (state.user) {
            navigation.navigate('StockInput', {
                item,
                user: state.user,
                branchId: isWH ? null : id,
                whId: isWH ? id : null,
                whQty,
                suppliers: state.suppliers
            });
        }
    }, [navigation, state.user, state.suppliers]);

    const handleReturnToSupplier = useCallback((item: ItemStock) => {
        if (state.user) {
            navigation.navigate('ReturnStock', { item, user: state.user, suppliers: state.suppliers });
        }
    }, [navigation, state.user, state.suppliers]);

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
            setState(prev => ({
                ...prev,
                quantity: formattedQty.toString(),
                editingItem: {
                    id,
                    qty,
                    isWareHouse,
                    itemName,
                    branchName,
                    sellByUnit
                },
                isInputMode: true
            }));
        },
        []
    );

    const handleKeyPress = useCallback((key: string) => {
        if (!memoizedEditingItem) return;

        setState(prev => {
            let newQuantity = prev.quantity;

            if (memoizedEditingItem.sellByUnit) {
                newQuantity = prev.quantity + key;
            } else {
                const current = prev.quantity.replace('.', '');
                newQuantity = current + key;
                newQuantity = (parseInt(newQuantity) / 100).toFixed(2);
            }

            return { ...prev, quantity: newQuantity };
        });
    }, [memoizedEditingItem]);

    const handleBackspace = useCallback(() => {
        if (!memoizedEditingItem) return;

        setState(prev => {
            let newQuantity = prev.quantity;

            if (memoizedEditingItem.sellByUnit) {
                newQuantity = prev.quantity.slice(0, -1);
            } else {
                const current = prev.quantity.replace('.', '');
                newQuantity = current.slice(0, -1) || '0';
                newQuantity = (parseInt(newQuantity) / 100).toFixed(2);
            }

            return { ...prev, quantity: newQuantity };
        });
    }, [memoizedEditingItem]);

    const saveEditedStock = useCallback(async () => {
        if (!state.editingItem) return;

        setState(prev => ({ ...prev, buttonLoading: true }));
        try {
            if (state.editingItem.isWareHouse) {
                await editWHStock(state.editingItem.id, Number(state.quantity));
            } else {
                await editStock(state.editingItem.id, Number(state.quantity));
            }
            setState(prev => ({ ...prev, isInputMode: false }));
            // Trigger refetch by resetting page to 1
            setState(prev => ({ ...prev, page: 1, stocks: [] }));
        } finally {
            setState(prev => ({ ...prev, buttonLoading: false }));
        }
    }, [state.editingItem, state.quantity]);

    const calculateTotalQuantity = useCallback((item: ItemStock) => {
        const branchesTotal = item.branches.reduce((sum, branch) => sum + Number(branch.quantity), 0);
        return branchesTotal + Number(item.whQty);
    }, []);

    const getQuantityTextColor = useCallback((quantity: number, criticalValue: number) => {
        return quantity < criticalValue ? 'text-red-500' : 'text-gray-700';
    }, []);

    const renderItem = useCallback(
        ({ item }: { item: ItemStock }) => {
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
                                    {state.activeCategory === 0 && (
                                        <TouchableOpacity
                                            onPress={() => constInputMode(item.whId, item.whQty, true, item.sellByUnit, item.name, item.whName)}
                                            className="p-2 bg-orange-50 rounded-full"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Edit3 height={18} color="#fe6500" />
                                        </TouchableOpacity>
                                    )}
                                    {(state.activeCategory === 2 || state.activeCategory == 1) && (
                                        <TouchableOpacity
                                            onPress={() => handleStockInput(item, item.whId, true, null)}
                                            className="p-2 bg-orange-50 rounded-full"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <PlusCircle height={18} color="#fe6500" />
                                        </TouchableOpacity>
                                    )}
                                    {state.activeCategory === 2 && (
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
                            const quantityColor = state.activeCategory === 1
                                ? getQuantityTextColor(branch.quantity, item.storeCriticalValue)
                                : 'text-gray-700';

                            return (
                                <View key={`${branch.id}-${branch.branchId}`} className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className={`text-sm ${isCritical && state.activeCategory === 1 ? 'text-red-500' : 'text-gray-600'}`}>
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

                                        {state.activeCategory === 0 && (
                                            <TouchableOpacity
                                                onPress={() => constInputMode(branch.id, branch.quantity, false, item.sellByUnit, item.name, branch.name)}
                                                className="p-2 bg-orange-50 rounded-full"
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Edit3 height={18} color="#fe6500" />
                                            </TouchableOpacity>
                                        )}

                                        {(state.activeCategory === 1 || state.activeCategory === 2) && (
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
        [state.activeCategory, handleStockInput, calculateTotalQuantity, constInputMode, getQuantityTextColor]
    );

    // Input mode view
    const inputModeView = useMemo(() => (
        <View style={{ flex: 1 }}>
            <TitleHeaderComponent
                onPress={() => setState(prev => ({ ...prev, isInputMode: false }))}
                isParent={false}
                title='please enter quantity'
                userName=''
            />
            <View className="w-full h-[2px] bg-gray-500 mb-2" />
            <View className="items-center mt-4">
                <View className="flex flex-column items-center">
                    <Text className="text-lg font-bold text-gray-600 px-3 mt-4">
                        {state.editingItem && `Enter New Quantity: ${state.editingItem.itemName}`}
                    </Text>
                    <Text className="text-sm font-bold text-gray-600 px-3 mt-4">
                        {state.editingItem && `${state.editingItem.branchName}`}
                    </Text>
                    <View className="flex flex-row items-center mt-6 border-b-2 border-[#fe6500] px-4 justify-center">
                        <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                            {state.editingItem && (state.editingItem.sellByUnit ? Number(state.quantity) : Number(state.quantity || 0).toFixed(2))}
                        </Text>
                    </View>
                </View>
            </View>
            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                <TouchableOpacity
                    disabled={state.buttonLoading}
                    onPress={saveEditedStock}
                    className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${state.quantity === "0.00" ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                >
                    <View className="flex-1 items-center">
                        <Text className={`text-lg text-center font-bold ${state.quantity === "0.00" ? 'text-[#fe6500]' : 'text-white'}`}>
                            Save
                        </Text>
                    </View>
                    {state.buttonLoading && (
                        <ActivityIndicator color={"white"} size={'small'} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    ), [state.editingItem, state.quantity, state.buttonLoading, handleKeyPress, handleBackspace, saveEditedStock]);

    // Main view
    const mainView = useMemo(() => (
        <View style={{ flex: 1 }}>
            {state.user && (
                <HQSidebar isVisible={state.isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={state.user} />
            )}
            <TitleHeaderComponent
                isParent={true}
                userName={state.user?.name || ''}
                title={'STOCKS MONITOR'}
                onPress={toggleSidebar}
            />

            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between items-center">
                    {CATEGORIES.map((label, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleChangeCategory(index)}
                            className={`${state.activeCategory === index ? 'border-b-4 border-yellow-500' : ''} ${index == 2 ? 'flex flex-row' : ''} w-[30%] justify-center items-center`}
                        >
                            <View className="flex-row items-center space-x-1">
                                <Text
                                    className={`${state.activeCategory === index ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                                >
                                    {label}
                                </Text>
                                {index === 1 && state.criticalCount > 0 && (
                                    <View className="bg-red-500 rounded-full px-1 flex items-center justify-center -mt-3">
                                        <Text className="text-white text-[8px] font-bold">{state.criticalCount}</Text>
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
                            value={state.search}
                            onChangeText={(text) => {
                                setState(prev => ({
                                    ...prev,
                                    loading: true,
                                    search: text,
                                    page: 1
                                }));
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                </View>
                {state.loading && (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Fetching items...</Text>
                    </View>
                )}
            </View>
            <View className="flex-1">
                <FlatList
                    data={state.stocks}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id.toString() + index.toString()}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListFooterComponent={
                        state.loadMore ? <ActivityIndicator size="small" color="#fe6500" /> : null
                    }
                    windowSize={10}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={50}
                />
            </View>
        </View>
    ), [
        state.user,
        state.isSidebarVisible,
        state.activeCategory,
        state.criticalCount,
        state.search,
        state.loading,
        state.stocks,
        state.loadMore,
        toggleSidebar,
        handleChangeCategory,
        handleSearchClick,
        renderItem,
        handleLoadMore
    ]);

    return (
        <View style={{ flex: 1 }}>
            <View style={{ display: state.isInputMode ? 'none' : 'flex', flex: 1 }}>
                {mainView}
            </View>
            <View style={{ display: state.isInputMode ? 'flex' : 'none', flex: 1 }}>
                {inputModeView}
            </View>
        </View>
    );

});

export default StockMonitorScreen;