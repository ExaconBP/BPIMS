import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { debounce } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MinusCircle, PlusCircle, Search } from "react-native-feather";
import ExpandableText from "../../../../components/ExpandableText";
import TitleHeaderComponent from "../../../../components/TitleHeaderComponent";
import WHSidebar from "../../../../components/WHSidebar";
import { WhStockStackParamList } from "../../../navigation/navigation";
import { getSupplierList, getWHStocks } from "../../../services/whRepo";
import { ObjectDto, UserDetails } from "../../../types/userType";
import { WHStockDto } from "../../../types/whType";
import { getSocketData } from "../../../utils/apiService";
import { getUserDetails } from "../../../utils/auth";
import { formatQuantity } from "../../../utils/dateFormat";

const WHScreen = React.memo(() => {
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [user, setUser] = useState<UserDetails>();
    const [activeCategory, setActiveCategory] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [stocks, setStocks] = useState<WHStockDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadMore, setLoadMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [criticalCount, setCriticalCount] = useState(0);
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<WhStockStackParamList>>();
    const [suppliers, setSuppliers] = useState<ObjectDto[]>([]);

    useEffect(() => {
        getItems(activeCategory, page, search);
    }, [search, activeCategory, page]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            const result = await getSupplierList("");
            setSuppliers(result.data);
        };
        fetchSuppliers();
    }, [search]);

    const debouncedSetCriticalCount = useCallback(debounce((count: number) => {
        setCriticalCount(count);
    }, 100), []);

    useEffect(() => {
        const socket = getSocketData('criticalItemsWH');

        socket.onmessage = (event) => {
            debouncedSetCriticalCount(Number(event.data));
        };

        return () => {
            socket.close();
        };
    }, [debouncedSetCriticalCount]);


    const getItems = useCallback(
        async (categoryId: number, page: number, search: string) => {
            try {
                if (activeCategory !== lastCategory) {
                    setStocks([]);
                }
                if (!loadMore) setLoading(true);

                const userResponse = await getUserDetails();
                setUser(userResponse);

                const response = await getWHStocks(
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

    useEffect(() => {
        const fetchUserDetails = async () => {
            const user = await getUserDetails();
            setUser(user);
        };
        fetchUserDetails();
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const handleStockInput = useCallback((item: WHStockDto) => {
        if (user) {
            navigation.navigate('StockInput', { item, user, suppliers });
        }
    }, [user, suppliers]);

    const handleReturnToSupplier = useCallback((item: WHStockDto) => {
        if (user) {
            navigation.navigate('ReturnStock', { item, user, suppliers });
        }
    }, [user, suppliers]);

    const renderItem = useCallback(
        ({ item }: { item: WHStockDto }) => (
            <View className="bg-gray px-2 py-2 border-b border-gray-300 flex flex-row justify-between items-center w-full">
                <View className="flex-1 pr-4">
                    <ExpandableText text={item.name}></ExpandableText>
                </View>

                <View className="flex flex-row items-center gap-x-2">
                    <Text className={`${activeCategory === 1 ? 'text-red-600' : 'text-green-600'} font-bold text-sm`}>
                        {formatQuantity(item.quantity, item.sellByUnit)}
                    </Text>
                    <Text className="text-black text-sm">{` ${item.unitOfMeasure || 'pcs'}`}</Text>

                    <View className="flex flex-row gap-x-1">
                        <TouchableOpacity onPress={() => handleStockInput(item)} className="p-2 rounded-full active:opacity-70">
                            <PlusCircle height={18} color="#fe6500" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleReturnToSupplier(item)} className="p-2 rounded-full active:opacity-70">
                            <MinusCircle height={18} color="#fe6500" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        ),
        [activeCategory, handleStockInput, handleReturnToSupplier]
    );


    return (
        <View style={{ flex: 1 }}>
            {user && (
                <WHSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Warehouse Stocks" onPress={toggleSidebar}></TitleHeaderComponent>
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
                        <Text className="text-center text-[#fe6500]">Loading stocks...</Text>
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
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        loadMore ? <ActivityIndicator size="small" color="#fe6500" /> : null
                    }
                />
            </View>
        </View>
    );
});

export default WHScreen;
