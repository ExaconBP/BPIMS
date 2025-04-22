import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ExternalLink, Search } from "react-native-feather";
import ExpandableText from '../../../../components/ExpandableText';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import WHSidebar from '../../../../components/WHSidebar';
import { HistoryWHStackParamList } from '../../../navigation/navigation';
import { getWHStocks } from '../../../services/whRepo';
import { UserDetails } from '../../../types/userType';
import { WHStockDto } from '../../../types/whType';
import { getUserDetails } from '../../../utils/auth';

const ItemListScreen = () => {
    const [stocks, setStocks] = useState<WHStockDto[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [hasMoreData, setHasMoreData] = useState(true);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<HistoryWHStackParamList>>();

    const toggleSidebar = () => setSidebarVisible(prev => !prev);

    useFocusEffect(
        useCallback(() => {
            getItems(0, page, search);
        }, [])
    );

    useEffect(() => {
        getItems(0, page, search);
    }, [0, page, search]);

    const getItems = async (categoryId: number, page: number, search: string) => {
        try {
            if (!loadingMore) setLoading(true);
            const userResponse = await getUserDetails();
            setUser(userResponse);
            if (userResponse) {
                const response = await getWHStocks(categoryId, page, search.trim());

                if (response.isSuccess) {
                    let newProducts = response.data;

                    setStocks(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);

                    setHasMoreData(newProducts.length > 0 && stocks.length + newProducts.length < (response.totalCount || 0));
                } else {
                    setStocks([]);
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

    const handleLoadMore = useCallback(() => {
        if (loading || loadingMore || !hasMoreData) return;
        setLoadingMore(true);
        setPage(prevPage => prevPage + 1);
    }, [hasMoreData, loading, loadingMore]);

    const handleSearchClick = () => {
        inputRef.current?.focus();
        setPage(1);
    };

    const handleHistoryView = useCallback(
        async (item: WHStockDto) => {

            const userResponse = await getUserDetails();
            setUser(userResponse);

            if (userResponse) {
                navigation.navigate('WHHistoryView', {
                    branchItemId: item.id || 0,
                    itemName: item.name,
                    user: userResponse,
                });
            }
        },
        [navigation]
    );

    const renderItem = useCallback(
        ({ item }: { item: WHStockDto }) => (
            <TouchableOpacity onPress={() => handleHistoryView(item)} className="bg-gray px-2 py-2 border-b border-gray-300 flex flex-row justify-between items-center w-full">
                <ExpandableText text={item.name}></ExpandableText>

                <ExternalLink height={16} width={16} color="#fe6500" ></ExternalLink>
            </TouchableOpacity>

        ),
        [handleHistoryView]
    );

    return (
        <View className='flex flex-1'>
            {isSidebarVisible && (
                <WHSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Stock History" onPress={toggleSidebar}></TitleHeaderComponent>

            <View className="w-full h-[2px] bg-gray-500 "></View>
            <View className="flex-1 items-center">
                <View className="flex flex-row w-full bg-gray-300 py-1 px-3 justify-between items-center">
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
                                setSearch(text);
                                setLoading(true)
                                setPage(1);
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                </View>
                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-[#fe6500] mt-2">Loading Items...</Text>
                    </View>
                ) : (
                    <View className='flex-1 px-2'>
                        <FlatList
                            data={stocks}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => item.id.toString() + index.toString()}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.3}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                loadingMore ? <ActivityIndicator size="small" color="#fe6500" /> : null
                            }
                        />
                    </View>
                )}
            </View>
        </View>
    );
};
export default ItemListScreen;