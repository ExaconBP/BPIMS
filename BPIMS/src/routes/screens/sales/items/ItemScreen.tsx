import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, BackHandler, Dimensions, Easing, FlatList, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChevronRight, Menu, Search, Slash } from "react-native-feather";
import ExpandableText from '../../../../components/ExpandableText';
import NumericKeypad from '../../../../components/NumericKeypad';
import Sidebar from '../../../../components/Sidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { ItemStackParamList } from '../../../navigation/navigation';
import { useCartStore } from '../../../services/cartStore';
import { getItemImage } from '../../../services/itemsHQRepo';
import { getCart, getCategories, getProducts } from '../../../services/salesRepo';
import { CategoryDto, ItemDto } from '../../../types/salesType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { truncateShortName } from '../../../utils/dateFormat';

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

const ItemScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemDto[]>([]);
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
    const [isInputMode, setInputMode] = useState(false);
    const [quantity, setQuantity] = useState<string>("0.00");
    const [selectedItem, setSelectedItem] = useState<ItemDto>();
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [numberItems, setNumberItems] = useState<number>(1);
    const debouncedSearch = useDebounce(search, 300);
    const {
        cartItems,
        totalCartItems,
        subTotal,
        addItem,
        clearCart,
        setCart
    } = useCartStore();

    const cartScale = useRef(new Animated.Value(1)).current;

    const inputRef = useRef<TextInput>(null);

    const screenWidth = Dimensions.get('window').width;
    const itemWidth = screenWidth / 3 - 10;
    const screenHeight = Dimensions.get('window').height;
    const [listHeight, setListHeight] = useState(screenHeight);

    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

    const toggleSidebar = useCallback(() => setSidebarVisible(prev => !prev), []);

    useEffect(() => {
        const backAction = () => {
            BackHandler.exitApp();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userResponse = await getUserDetails();
                const cart = await getCart();
                if (cart) {
                    setCart(cart.data.cart);
                }
                setUser(userResponse);
            } catch (error) {
                console.error("Failed to fetch user details:", error);
            }
        };

        fetchUser();
        clearCart();
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
            }
            finally {
                setLoadingCategory(false);
            }
        };

        getCategoryList();
    }, []);

    useEffect(() => {
        if (!user) return;

        setPage(1);
    }, [user]);

    useEffect(() => {
        if (!user || page < 1) return;

        getItems(activeCategory, page, debouncedSearch);
    }, [activeCategory, page, debouncedSearch, user]);


    const getItems = useCallback(async (categoryId: number, page: number, search: string) => {
        try {
            if (activeCategory !== lastCategory) {
                setProducts([]);
            }

            if (!loadingMore) {
                setLoading(true);
            }

            if (!user) {
                console.warn("User not loaded yet.");
                return;
            }

            const response = await getProducts(categoryId, page, search.trim(), Number(user.branchId));
            if (response.isSuccess) {
                const newProducts = response.data.map(product => {
                    const cartItem = cartItems.find(item => item.itemId === product.id);
                    return cartItem
                        ? { ...product, quantity: product.quantity - cartItem.quantity }
                        : product;
                });

                setNumberItems(prev => prev + 1);
                setProducts(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);

                const total = response.totalCount ?? newProducts.length;
                const hasMore = newProducts.length === pageSize && (page * pageSize) < total;
                setHasMoreData(hasMore);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeCategory, lastCategory, loadingMore, user, cartItems, page]);

    const loadMoreCategories = useCallback(() => {
        if (!user || loading || loadingMore || !hasMoreData) return;

        setLastCategory(activeCategory);
        setLoadingMore(true);
        setPage(prevPage => prevPage + 1);
    }, [user, loading, loadingMore, hasMoreData, activeCategory]);

    const debouncedAddToCart = useCallback(
        debounce((item: ItemDto) => {
            if (!item.sellByUnit) {
                setSelectedItem(item);
                setTimeout(() => setInputMode(true), 0);
                return;
            }

            const itemId = item.id;
            const updatedQuantity = item.quantity > 0 ? item.quantity - 1 : 0;

            setProducts(prev =>
                prev.map(i =>
                    i.id === itemId ? { ...i, quantity: updatedQuantity } : i
                )
            );

            addItem({
                id: Math.random(), // temp ID
                itemId: item.id,
                price: item.price,
                quantity: 1,
                name: item.name,
                sellByUnit: item.sellByUnit,
                branchQty: item.quantity,
                branchName: user?.branchName || "",
                branchItemId: item.branchItemId || 0
            });
        }, 200),
        [user?.branchName]
    );


    useEffect(() => {
        if (totalCartItems > 0) {
            Animated.sequence([
                Animated.timing(cartScale, {
                    toValue: 1.1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(cartScale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [totalCartItems, cartScale]);

    const addToCartFaction = useCallback(() => {
        if (!selectedItem) return;

        setButtonLoading(true);
        const addedQty = Number(quantity);

        const updatedItem = {
            ...selectedItem,
            quantity: selectedItem.quantity > 0
                ? selectedItem.quantity - addedQty
                : 0,
        };

        setProducts(prev =>
            prev.map(i =>
                i.id === updatedItem.id ? { ...i, quantity: updatedItem.quantity } : i
            )
        );

        addItem({
            id: Math.random(),
            itemId: updatedItem.id,
            price: updatedItem.price,
            quantity: addedQty,
            name: updatedItem.name,
            sellByUnit: updatedItem.sellByUnit,
            branchQty: updatedItem.quantity,
            branchName: user?.branchName || "",
            branchItemId: updatedItem.branchItemId || 0
        });

        setSelectedItem(undefined);
        setQuantity("0.00");
        setInputMode(false);
        setButtonLoading(false);
    }, [selectedItem, quantity, user?.branchName]);

    const handleCategoryClick = useCallback((id: number) => {
        setLastCategory(activeCategory);
        setLoading(true);
        inputRef.current?.blur();
        setActiveCategory(id);
        setPage(1);
    }, [activeCategory]);

    const handleSearchClick = () => inputRef.current?.focus();

    const handleCartClick = useCallback(() => {
        try {
            setButtonLoading(true);
            if (user) {
                navigation.navigate('Cart', { user });
            }
        } finally {
            setButtonLoading(false);
        }
    }, [navigation, user]);


    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const ProductItem = React.memo(({ item, index }: { item: ItemDto; index: number }) => {
        const animatedValue = useRef(new Animated.Value(0)).current;
        const [isAnimating, setIsAnimating] = useState(false);

        const handlePress = useCallback(() => {
            debouncedAddToCart(item);
            if (item.sellByUnit) {
                setIsAnimating(true);
                animatedValue.setValue(0);

                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }).start(() => {
                    setIsAnimating(false);
                });
            }
        }, [debouncedAddToCart, item, animatedValue]);

        const column = index % 3;
        const translateX = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [
                0,
                column === 0 ? 50 : column === 2 ? -50 : 0,
            ],
        });

        const translateY = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [
                0,
                listHeight
            ],
        });

        const scale = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.01],
        });

        return (
            <View>
                <TouchableOpacity
                    className={`m-1 ${Number(item.quantity) <= 0.00 ? 'opacity-50' : 'opacity-100'}`}
                    style={{ width: itemWidth }}
                    onPress={handlePress}
                    disabled={Number(item.quantity) <= 0.00}
                >
                    <View className='z-[10]'>
                        <View className="bg-gray-600 w-full aspect-[1] rounded-t-lg overflow-hidden justify-center items-center relative">
                            {item.imagePath ? (
                                <FastImage
                                    source={{ uri: getItemImage(item.imagePath), priority: FastImage.priority.high }}
                                    className="w-full h-full object-cover"
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            ) : (
                                <Text className="text-white text-xs text-center">No Image</Text>
                            )}
                            {(Number(item.quantity) <= 0.00) && (
                                <View className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 justify-center items-center">
                                    <Text className="text-red-500 text-lg font-bold">Out of Stock</Text>
                                    <Slash width={20} height={20} color="red" />
                                </View>
                            )}
                        </View>

                        <View className="bg-yellow-500 w-full rounded-b-lg p-2 justify-between">
                            <ExpandableText text={item.name.toUpperCase()}></ExpandableText>

                            <Text className="text-xs font-bold mb-1" numberOfLines={1}>
                                ₱ {item.price}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
                {isAnimating && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: itemWidth,
                            transform: [{ translateX }, { translateY }, { scale }],
                            zIndex: 1000
                        }}
                    >
                        <View className="z-auto bg-gray-600 w-full aspect-[1] rounded-t-lg overflow-hidden justify-center items-center">
                            {item.imagePath ? (
                                <FastImage
                                    source={{ uri: getItemImage(item.imagePath), priority: FastImage.priority.high }}
                                    className="w-full h-full object-cover"
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            ) : (
                                <Text className="text-white text-xs text-center">No Image</Text>
                            )}
                        </View>

                        <View className="bg-yellow-500 w-full h-14 rounded-b-lg p-2 justify-between">
                            <ExpandableText text={item.name}></ExpandableText>
                            <Text className="text-xs font-bold mb-1" numberOfLines={1}>
                                ₱ {item.price}
                            </Text>
                        </View>
                    </Animated.View>
                )}
            </View>
        );
    });

    const renderItem = useCallback(({ item, index }: { item: ItemDto, index: number }) => <ProductItem item={item} index={index} />, []);
    const keyExtractor = useCallback((item: ItemDto, index: number) => `${item.id}-${index}`, []);

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

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}

            <View style={{ flex: 1, display: isInputMode ? 'flex' : 'none' }}>
                <TitleHeaderComponent isParent={false} title={selectedItem?.name || ""} onPress={() => {
                    setInputMode(false);
                    setMessage("")
                }} userName=''></TitleHeaderComponent>
                <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                <View className="items-center mt-4">
                    <View className="flex flex-column items-center">
                        <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter Quantity Sold</Text>
                        <View className="flex flex-row items-center mt-6   border-b-2 border-[#fe6500] px-4 justify-center">
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
                    <TouchableOpacity disabled={buttonLoading == true} onPress={addToCartFaction} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${quantity === "0.00" ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                    >
                        <View className="flex-1 items-center">
                            <Text className={`text-lg text-center font-bold ${quantity === "0.00" ? 'text-[#fe6500]' : 'text-white'}`}>
                                Send to cart
                            </Text>
                        </View>

                        {buttonLoading && (
                            <ActivityIndicator color={"white"} size={'small'} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1, display: isInputMode ? 'none' : 'flex' }}>
                <View className='top-3 flex flex-row justify-between mb-4 px-2'>
                    <TouchableOpacity
                        className="bg-gray mt-1 ml-2"
                        onPress={toggleSidebar}
                    >
                        <Menu width={24} height={26} color="#fe6500" />
                    </TouchableOpacity>
                    <View className=" mr-1 flex-row items-center w-[60%] sm:w-[75%] md:w-[80%] rounded-full border border-[#fe6500]">
                        <TextInput
                            className="flex-1 h-8 text-black p-2"

                            placeholder="Search Item ..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={(text) => {
                                setSearch(text);
                            }}
                            ref={inputRef}
                            onFocus={() => Keyboard.isVisible()}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                        <TouchableOpacity className='mr-2' onPress={handleSearchClick} >
                            <Search width={15} height={15} color="black" />
                        </TouchableOpacity>

                    </View>
                    <View className=" items-center"
                    >
                        <View className="px-2 py-2 bg-[#fe6500] rounded-full">
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
                        <View className="w-[90%] flex-row justify-between pr-2 pl-2">
                            {categories.map((category) => (
                                <TouchableOpacity
                                    onPress={() => handleCategoryClick(category.id)}
                                    key={category.id}
                                    className={`${activeCategory === category.id ? 'border-b-4 border-yellow-500' : ''}  mx-1`}
                                >
                                    <Text className={`${activeCategory === category.id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium`}>
                                        {category.name.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View className="w-full h-[2px] bg-gray-500 mt-1 mb-2"></View>
                </View>
                <View className="flex-1 items-center">
                    {loading ? (
                        <View className="py-2">
                            <ActivityIndicator size="small" color="#fe6500" />
                            <Text className="text-center text-[#fe6500]">Getting Items...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={products}
                            onLayout={(event: any) => setListHeight(event.nativeEvent.layout.height)}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            numColumns={3}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            onEndReached={loadMoreCategories}
                            onEndReachedThreshold={0.5}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#fe6500" /> : null}
                        />
                    )
                    }
                </View>

                {!loading && products.length !== 0 && (
                    <View className="items-center pb-3 pt-2 bg-white">
                        <Animated.View style={{ transform: [{ scale: cartScale }] }}>
                            <TouchableOpacity
                                onPress={handleCartClick}
                                className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${totalCartItems === 0 ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                                disabled={totalCartItems == 0 || buttonLoading == true}>
                                <View className="flex-1 items-center ml-4">
                                    <Text className={`font-bold text-lg ${totalCartItems === 0 ? 'text-[#fe6500]' : 'text-white'}`}>
                                        {totalCartItems === 0
                                            ? 'No Items'
                                            : `${totalCartItems} ${totalCartItems > 1 ? 'Items' : 'Item'}`} = ₱ {subTotal.toFixed(2) || 0}
                                    </Text>
                                </View>
                                {totalCartItems > 0 && (
                                    buttonLoading ? (
                                        <ActivityIndicator color={"white"} size={'small'} />
                                    ) : (
                                        <ChevronRight height={24} width={24} color="white" />
                                    )
                                )}

                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                )}
            </View>

        </View >
    );
};
export default ItemScreen;