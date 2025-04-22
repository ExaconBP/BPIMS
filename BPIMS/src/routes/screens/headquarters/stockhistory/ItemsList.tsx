import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ExternalLink, Search } from "react-native-feather";
import ExpandableText from '../../../../components/ExpandableText';
import HQSidebar from '../../../../components/HQSidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { HistoryStackParamListHQ } from '../../../navigation/navigation';
import { getCategoriesHQ } from '../../../services/itemsHQRepo';
import { getStocksMonitor } from '../../../services/stockRepo';
import { CategoryDto } from '../../../types/salesType';
import { ItemStock } from '../../../types/stockType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';

const ItemListScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemStock[]>([]);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamListHQ>>();
    const [loadMore, setLoadMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);

    const toggleSidebar = () => setSidebarVisible(prev => !prev);

    useEffect(() => {
        const getCategoryList = async () => {
            try {
                setLoadingCategory(true);
                const response = await getCategoriesHQ();
                if (response.isSuccess) {
                    setCategories(response.data);
                } else {
                    Alert.alert('An error occurred', response.message);
                }
                setLoadingCategory(false);
            }
            finally {
                setLoadingCategory(false);
            }
        };

        getCategoryList();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getItems(0, page, search);
        }, [])
    );

    useEffect(() => {
        getItems(0, page, search);
    }, [page, search]);

    const getItems = async (categoryId: number, page: number, search: string) => {
        try {
            if (!loadingMore) setLoading(true);
            const userResponse = await getUserDetails();
            setUser(userResponse);
            if (userResponse) {
                const response = await getStocksMonitor(categoryId, page, search.trim());

                if (response.isSuccess) {
                    let newProducts = response.data;

                    setProducts(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);

                    setHasMoreData(newProducts.length > 0 && products.length + newProducts.length < (response.totalCount || 0));
                } else {
                    setProducts([]);
                }
            }
            setLoading(false);
            setLoadingMore(false);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSearchClick = () => {
        inputRef.current?.focus();
        setPage(1);
    };

    const handleHistoryView = useCallback(
        async (itemId: number, itemName: string, isWh: boolean) => {

            const userResponse = await getUserDetails();
            setUser(userResponse);

            if (userResponse) {
                if (!isWh) {
                    navigation.navigate('HistoryView', {
                        branchItemId: itemId,
                        itemName: itemName,
                        user: userResponse,
                    });
                }
                else {
                    navigation.navigate('WHHistoryView', {
                        branchItemId: itemId,
                        itemName: itemName,
                        user: userResponse,
                    });
                }
            }
        },
        [navigation]
    );

    const handleLoadMore = useCallback(() => {
        if (loading || loadMore || !hasMoreData) return;
        setLoadMore(true);
        setPage(prevPage => prevPage + 1);
    }, [hasMoreData, loading, loadMore]);

    const renderItem = useCallback(
        ({ item }: { item: ItemStock }) => (
            <View className="bg-white rounded-lg shadow-sm mb-3 mx-2 p-4">
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                    <View className="flex-1 pr-2">
                        <ExpandableText text={item.name} />
                    </View>
                </View>

                <View className="space-y-2">
                    <View className="flex-row justify-between items-center py-1">
                        <View className="flex-1">
                            <Text className={`text-sm text-gray-600`}>
                                {item.whName}
                            </Text>
                        </View>

                        <View className="flex-row items-center space-x-3">
                            <View className="flex-row space-x-2">
                                <TouchableOpacity className="p-2 bg-orange-50 rounded-full"
                                    onPress={() => handleHistoryView(item.whId, item.name, true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <ExternalLink height={18} color={"#fe6500"}></ExternalLink>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>
                </View>

                {item.branches.map((branch) => {
                    return (
                        <View key={`${branch.id}-${branch.branchId}`} className="flex-row justify-between items-center py-1">
                            <View className="flex-1">
                                <Text className={`text-sm text-gray-600`}>
                                    {branch.name}
                                </Text>
                            </View>

                            <View className="flex-row items-center space-x-3">
                                <View className="flex-row space-x-2">
                                    <TouchableOpacity className="p-2 bg-orange-50 rounded-full"
                                        onPress={() => handleHistoryView(branch.id, item.name, false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <ExternalLink height={18} color={"#fe6500"}></ExternalLink>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View >
        ), []
    );

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                {user && (
                    <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
                )}
                <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Stocks History" onPress={toggleSidebar}></TitleHeaderComponent>

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
                        data={products}
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

};
export default ItemListScreen;