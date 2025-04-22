import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Dimensions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChevronLeft, Search, Slash } from "react-native-feather";
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import { getCategories, getProducts } from '../routes/services/salesRepo';
import { CategoryDto, ItemDto } from '../routes/types/salesType';
import { truncateShortName } from '../routes/utils/dateFormat';
import ExpandableText from './ExpandableText';
import NumericKeypad from './NumericKeypad';
import TitleHeaderComponent from './TitleHeaderComponent';
import { getItemImage } from '../routes/services/itemsHQRepo';

type Props = {
    user: any;
    loyaltyCustomerId: number;
    selectItem: (item: ItemDto, quantity: number) => void;
    onClose: () => void;
};

const RewardScreen = ({ user, selectItem, onClose }: Props) => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemDto[]>([]);
    const [activeCategory, setActiveCategory] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [search, setSearch] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [isInputMode, setInputMode] = useState(false);
    const [quantity, setQuantity] = useState<string>("0.00");
    const [selectedItem, setSelectedItem] = useState<ItemDto>();
    const [message, setMessage] = useState<string | null>(null);

    const inputRef = useRef<TextInput>(null);
    const screenWidth = Dimensions.get('window').width;
    const itemWidth = screenWidth / 3 - 10;

    const screenHeight = Dimensions.get('window').height;
    const [listHeight, setListHeight] = useState(screenHeight);

    useEffect(() => {
        const backAction = () => {
            BackHandler.exitApp();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        const getCategoryList = async () => {
            try {
                setLoadingCategory(true);
                const response = await getCategories();
                if (response.isSuccess) {
                    setCategories(response.data);
                } else {
                    Alert.alert('An error occurred', response.message);
                }
                setLoadingCategory(false);
            } finally {
                setLoadingCategory(false);
            }
        };

        getCategoryList();
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getProducts(0, page, search, user.branchId);
            if (response.isSuccess) {
                setProducts(prev => page === 1 ? response.data : [...prev, ...response.data]);
                setHasMore(response.data.length > 0);
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load products');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, user.branchId, search]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);


    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const handleCategoryClick = useCallback((id: number) => {
        setActiveCategory(id);
        setPage(1);
    }, []);

    const handleItemPress = useCallback((item: ItemDto) => {
        if (item.sellByUnit) {
            selectItem(item, 1);
            onClose();
        }
        else {
            setSelectedItem(item)
            setInputMode(true)
        }
    }, [selectItem, onClose, setSelectedItem, setInputMode]);


    const handleItemNotSellByUnit = useCallback(() => {
        if (selectedItem)
            selectItem(selectedItem, Number(quantity))
        setInputMode(false)
        onClose();
    }, [selectItem, onClose, selectedItem, quantity]);

    const handleKeyPress = useCallback((key: string) => {
        if (selectedItem) {
            let current = quantity.replace('.', '');
            current += key;
            const formatted = (parseInt(current) / 100).toFixed(2);
            if (Number(formatted) <= selectedItem?.quantity) {
                setQuantity(formatted);
                setMessage(null)
            }
            else {
                setMessage(`Quantity exceeds available stock. Available stock: ${Number(selectedItem.quantity).toFixed(2)}`);
            }
        }
    }, [selectedItem, quantity]);

    const handleBackspace = useCallback(() => {
        setMessage(null)
        let current = quantity.replace('.', '');
        current = current.slice(0, -1) || '0';
        const formatted = (parseInt(current) / 100).toFixed(2);
        setQuantity(formatted);
    }, [quantity]);


    const keyExtractor = useCallback((item: ItemDto) => item.id.toString(), []);

    const ProductItem = React.memo(({ item }: { item: ItemDto }) => {

        return (
            <View>
                <TouchableOpacity
                    className={`m-1`}
                    style={{ width: itemWidth }}
                    onPress={() => handleItemPress(item)}
                    disabled={Number(item.quantity) <= 0}
                >
                    <View className='z-[10]'>
                        <View className="bg-gray-600 w-full aspect-[1] rounded-t-lg overflow-hidden justify-center items-center relative">
                            {item.imagePath ? (
                                <FastImage
                                    source={{ uri: getItemImage(item.imagePath), priority: FastImage.priority.high }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            ) : (
                                <Text>No Image</Text>
                            )}
                            {(Number(item.quantity) <= 0) && (
                                <View className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 justify-center items-center">
                                    <Text className="text-red-500 text-lg font-bold">Out of Stock</Text>
                                    <Slash width={20} height={20} color="red" />
                                </View>
                            )}
                        </View>
                        <View className="bg-yellow-500 w-full h-14 rounded-b-lg p-2 justify-between">
                            <ExpandableText text={item.name}></ExpandableText>
                            <Text className="text-xs font-bold mb-1" numberOfLines={1}>
                                ₱ {item.price}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    });

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, display: isInputMode ? 'flex' : 'none' }}>
                <TitleHeaderComponent onPress={() => setInputMode(false)} isParent={false} title='please enter quantity' userName=''
                ></TitleHeaderComponent>
                <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                <View className="items-center mt-4">
                    <View className="flex flex-column items-center">
                        <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter Quantity</Text>
                        <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                            <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                {quantity}
                            </Text>
                        </View>
                        {message !== null && (
                            <Text className="text-[10px] font-bold text-red-500">{message}</Text>)
                        }
                    </View>
                </View>
                <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                    <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                    <TouchableOpacity onPress={handleItemNotSellByUnit} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${quantity === "0.00" ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                    >
                        <View className="flex-1 items-center">
                            <Text className={`text-lg text-center font-bold ${quantity === "0.00" ? 'text-[#fe6500]' : 'text-white'}`}>
                                DONE
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ flex: 1, display: isInputMode ? 'none' : 'flex' }}>

                <View className='top-3 flex flex-row justify-between mb-4 px-2'>
                    <TouchableOpacity className="bg-gray mt-1 ml-2"
                        onPress={onClose}>
                        <ChevronLeft width={20} height={20} color="#fe6500" />
                    </TouchableOpacity>
                    <View className=" mr-1 flex-row items-center w-[60%] sm:w-[75%] md:w-[80%] rounded-full border border-[#fe6500]">
                        <TextInput
                            className="flex-1 h-6 px-2 py-1 text-black"
                            placeholder="Search..."
                            value={search}
                            onChangeText={(text) => {
                                setLoading(true)
                                setSearch(text);
                                setPage(1);
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                        />
                        <TouchableOpacity onPress={() => inputRef.current?.focus()}>
                            <Search width={15} height={15} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View className=" items-center"
                    >
                        <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                            <Text className="text-white" style={{ fontSize: 12 }}>
                                {truncateShortName(user?.name ? user.name.split(' ')[0].toUpperCase() : '')}
                            </Text>
                        </View>

                    </View>
                </View>
                <View className="justify-center items-center bg-gray relative mt-1">
                    {loadingCategory ? (
                        <ActivityIndicator size="small" color="#fe6500" />
                    ) : (
                        <View className="w-[90%] flex-row justify-between pr-4 pl-4">
                            {categories.map((category) => (
                                <TouchableOpacity onPress={() => handleCategoryClick(category.id)} key={category.id}>
                                    <Text className={`${activeCategory === category.id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium`}>
                                        {category.name.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View className="w-full h-[2px] bg-gray-500 mt-1"></View>

                </View>
                <View className="flex-1 items-center">

                    {loading && page === 1 ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#fe6500" />
                        </View>
                    ) : (
                        <OptimizedFlatList
                            data={products}
                            renderItem={({ item }: { item: ItemDto }) => <ProductItem item={item} />}
                            onLayout={(event: any) => setListHeight(event.nativeEvent.layout.height)}
                            keyExtractor={keyExtractor}
                            numColumns={3}
                            contentContainerStyle={{ padding: 8 }}
                            columnWrapperStyle={{ justifyContent: 'space-between' }}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                loading && page > 1 ? (
                                    <ActivityIndicator size="small" color="#fe6500" />
                                ) : null
                            }

                        />
                    )}
                </View>
            </View>
        </View>
    );
};

export default RewardScreen;
