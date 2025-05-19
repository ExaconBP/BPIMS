import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { PlusCircle, Search } from "react-native-feather";
import ExpandableText from '../../../../components/ExpandableText';
import HQSidebar from '../../../../components/HQSidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { ItemsHQParamList } from '../../../navigation/navigation';
import { getCategoriesHQ, getItemImage, getProductsHQ } from '../../../services/itemsHQRepo';
import { ItemHQDto } from '../../../types/itemType';
import { CategoryDto } from '../../../types/salesType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';

const ItemListScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemHQDto[]>([]);
    const [activeCategory, setActiveCategory] = useState(0);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [hasMoreData, setHasMoreData] = useState(true);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<ItemsHQParamList>>();

    const newItem: ItemHQDto = {
        id: 0,
        name: "",
        categoryId: 1,
        price: 0,
        cost: 0,
        isManaged: false,
        imagePath: null,
        sellByUnit: false,
        whCriticalValue: 0,
        categoryName: "",
        unitOfMeasure: "",
        storeCriticalValue: 0,
        imageUrl: null
    };

    const toggleSidebar = () => setSidebarVisible(prev => !prev);

    useEffect(() => {
        const getCategoryList = async () => {
            try {
                setLoadingCategory(true);
                FastImage.clearMemoryCache();
                FastImage.clearDiskCache();
                const response = await getCategoriesHQ();
                const userResponse = await getUserDetails();
                setUser(userResponse);
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
            getItems(activeCategory, page, search);
        }, [])
    );

    useEffect(() => {
        getItems(activeCategory, page, search);
    }, [activeCategory, page, search]);

    const getItems = async (categoryId: number, page: number, search: string) => {
        try {
            if (activeCategory !== lastCategory) {
                setProducts([]);
            }

            if (!loadingMore) setLoading(true);

            const response = await getProductsHQ(categoryId, page, search.trim());

            if (response.isSuccess) {
                let newProducts = response.data;

                setProducts(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);
                if (newProducts.length < 30 || (response.totalCount && (page * 30) >= response.totalCount)) {
                    setHasMoreData(false);
                } else {
                    setHasMoreData(true);
                }
            }
            else {
                setProducts([]);
            }
            setLoading(false);
            setLoadingMore(false);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreCategories = () => {
        if (!loading && !loadingMore && hasMoreData) {
            setLastCategory(activeCategory);
            setLoadingMore(true);
            setPage(prevPage => prevPage + 1);
        }
    };

    const handleCategoryClick = useCallback((id: number) => {
        setLastCategory(activeCategory);
        setLoading(true);
        inputRef.current?.blur();
        setActiveCategory(id);
        setPage(1);
    }, [activeCategory]);

    const handleSearchClick = () => {
        inputRef.current?.focus();
        setPage(1);
    };

    const ProductItem = React.memo(({ item }: { item: ItemHQDto }) => (
        <View className="mt-2 w-full pl-1 pr-3">
            <TouchableOpacity
                className="w-full"
                onPress={() => navigation.navigate('ItemView', { item })}
                activeOpacity={0.7}
            >
                <View
                    className="flex-row items-center border-b border-gray-500 pb-2 pl-1 pr-2 justify-between"
                    pointerEvents="none"
                >
                    <View className="bg-yellow-500 justify-center items-center h-10 w-16 rounded-lg">
                        {item.imagePath ? (
                            <FastImage
                                source={{ uri: getItemImage(item.imagePath), priority: FastImage.priority.high }}
                                style={{ width: 64, height: 40, borderRadius: 8 }}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        ) : (
                            <Text className="text-black text-xs text-center">No Image</Text>
                        )}
                    </View>

                    <View className="flex-1 ml-2">
                        <ExpandableText text={item.name}></ExpandableText>
                    </View>

                    <Text className="text-black text-sm" numberOfLines={1}>
                        ₱ {item.price}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    ));

    const renderItem = useCallback(({ item }: { item: ItemHQDto }) => <ProductItem item={item} />, []);
    const keyExtractor = useCallback((item: ItemHQDto) => item.id.toString(), []);

    return (
        <View className='flex flex-1'>
            {isSidebarVisible && (
                <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Items Data" onPress={toggleSidebar}></TitleHeaderComponent>

            <View className="w-full justify-center items-center bg-gray relative">
                {loadingCategory ? (
                    <ActivityIndicator size="small" color="#fe6500" />
                ) : (
                    <View className="w-full flex-row justify-between items-center">
                        {categories.map((category) => (
                            <TouchableOpacity
                                onPress={() => handleCategoryClick(category.id)}
                                key={category.id}
                                className={`${activeCategory === category.id ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center p-2`}
                            >
                                <Text className={`${activeCategory === category.id ? 'text-gray-900' : 'text-gray-500'} text-[9px] font-medium text-center`}>
                                    {category.name.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View className="w-full h-[2px] bg-gray-500"></View>
            </View>
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
                                setLoadingMore(false)
                                setProducts([])
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity className="mr-2" onPress={() => navigation.navigate('ItemView', { item: newItem })}>
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-[#fe6500] mt-2">Loading Items...</Text>
                    </View>
                ) : (
                    <View className='w-full px-1 pb-8'>
                        <FlatList
                            data={products}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={keyExtractor}
                            numColumns={1}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            onEndReached={loadMoreCategories}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#fe6500" /> : null}
                        />
                    </View>
                )}
            </View>
        </View>
    );
};
export default ItemListScreen;