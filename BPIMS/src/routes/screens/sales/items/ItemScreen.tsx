import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, BackHandler, Dimensions, Easing, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChevronRight, Menu, Search, Slash } from "react-native-feather";
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import ExpandableText from '../../../../components/ExpandableText';
import NumericKeypad from '../../../../components/NumericKeypad';
import Sidebar from '../../../../components/Sidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { ItemStackParamList } from '../../../navigation/navigation';
import { addItemToCart, getCart, getCategories, getProducts } from '../../../services/salesRepo';
import { CartItems, CategoryDto, ItemDto } from '../../../types/salesType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { truncateShortName } from '../../../utils/dateFormat';
import { getItemImage } from '../../../services/itemsHQRepo';

const ItemScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemDto[]>([]);
    const [activeCategory, setActiveCategory] = useState(0);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [search, setSearch] = useState("");
    const [hasMoreData, setHasMoreData] = useState(true);
    const [totalCartItems, setTotalCartItems] = useState(0);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isInputMode, setInputMode] = useState(false);
    const [quantity, setQuantity] = useState<string>("0.00");
    const [selectedItem, setSelectedItem] = useState<ItemDto>();
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<CartItems[]>([]);
    const [pendingItems, setPendingItems] = useState<Set<number>>(new Set());

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

    useFocusEffect(
        useCallback(() => {
            getUserAndCart();
            getItems(activeCategory, page, search);
        }, [activeCategory, page, search])
    );

    const getItems = useCallback(async (categoryId: number, page: number, search: string) => {
        try {
            if (activeCategory !== lastCategory) {
                setProducts([]);
            }
            if (!loadingMore)
                setLoading(true);
            const userResponse = await getUserDetails();
            setUser(userResponse)
            const response = await getProducts(categoryId, page, search.trim(), Number(userResponse?.branchId));
            if (response.isSuccess) {
                FastImage.clearMemoryCache();
                FastImage.clearDiskCache();
                let newProducts = response.data;
                const cartResponse = await getCart();
                const cartItems = cartResponse.data.cartItems;
                setCartItems(cartItems)
                newProducts = newProducts.map(product => {
                    const cartItem = cartItems.find((item) => item.itemId === product.id);
                    if (cartItem) {
                        return {
                            ...product,
                            quantity: product.quantity - cartItem.quantity,
                        };
                    }
                    return product;
                });
                setProducts(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);
                if (newProducts.length === 0 || products.length + newProducts.length >= (response.totalCount || 0)) {
                    setHasMoreData(false);
                } else {
                    setHasMoreData(true);
                }
            } else {
                setProducts([])
            }
            setLoading(false);
            setLoadingMore(false);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeCategory, lastCategory, loadingMore, products.length]);

    const loadMoreCategories = useCallback(() => {
        if (!loading && !loadingMore && hasMoreData) {
            setLastCategory(activeCategory);
            setLoadingMore(true);
            setPage(prevPage => prevPage + 1);
        }
    }, [loading, loadingMore, hasMoreData, activeCategory]);

    const getUserAndCart = useCallback(async () => {
        const result = await getCart();
        setTotalCartItems(result.totalCount ?? 0);
        setTotalPrice(parseFloat(result.data.cart.subTotal.toString()));
    }, []);

    const debouncedAddToCart = useCallback(debounce(async (item: ItemDto) => {
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
        setTotalCartItems(prev => prev + 1);
        setTotalPrice(prev => prev + parseFloat(item.price.toString()));
        setPendingItems(prev => new Set(prev).add(itemId));

        try {
            await addItemToCart(itemId, 1);
        } catch (error) {
            console.error("Add to cart failed:", error);
            setProducts(prev =>
                prev.map(i =>
                    i.id === itemId ? { ...i, quantity: item.quantity } : i
                )
            );
            setTotalCartItems(prev => Math.max(prev - 1, 0));
            setTotalPrice(prev => Math.max(prev - parseFloat(item.price.toString()), 0));
        } finally {
            setPendingItems(prev => {
                const copy = new Set(prev);
                copy.delete(itemId);
                return copy;
            });
        }
    }, 200), []);

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

    const addToCartFaction = useCallback(async () => {
        try {
            setButtonLoading(true);

            if (selectedItem) {
                const prevTotalCartItems = totalCartItems;
                const prevTotalPrice = totalPrice;
                const prevProducts = products;

                const updatedItem = {
                    ...selectedItem,
                    quantity: selectedItem.quantity > 0 ? selectedItem.quantity - Number(quantity) : 0,
                };

                setProducts(prev =>
                    prev.map(i =>
                        i.id === updatedItem.id ? { ...i, quantity: updatedItem.quantity } : i
                    )
                );

                const toAdd = updatedItem.price * Number(quantity);
                if (!cartItems.some(item => item.itemId === updatedItem.id)) {
                    setTotalCartItems(prev => prev + 1);
                }

                setTotalPrice((prev) => prev + parseFloat(toAdd.toString()));

                const debouncedAddToCart = debounce(async () => {
                    try {
                        await addItemToCart(selectedItem.id, Number(quantity));
                        setSelectedItem(undefined);
                        setQuantity("0.00");
                        setInputMode(false);
                        await getUserAndCart();
                    } catch (error) {
                        setProducts(prevProducts);
                        setTotalCartItems(prevTotalCartItems);
                        setTotalPrice(prevTotalPrice);
                        Alert.alert('Error', 'Failed to add item to cart. Please try again.');
                    } finally {
                        setButtonLoading(false);
                    }
                },);

                debouncedAddToCart();
            } else {
                setButtonLoading(false);
            }
        }
        finally {
            setButtonLoading(false);
        }
    }, [selectedItem, quantity, totalCartItems, totalPrice, products, getUserAndCart]);

    const handleCategoryClick = useCallback((id: number) => {
        setLastCategory(activeCategory);
        setLoading(true);
        inputRef.current?.blur();
        setActiveCategory(id);
        setPage(1);
    }, [activeCategory]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
        setPage(1);
    }, []);

    const handleCartClick = useCallback(() => {
        try {
            setButtonLoading(true)
            if (user) {
                navigation.navigate('Cart', { user: user });
                setButtonLoading(false)
            }
        }
        finally {
            setButtonLoading(false)
        }
    }, [navigation, user]);

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
    const keyExtractor = useCallback((item: ItemDto) => item.id.toString(), []);

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
                        <Menu width={20} height={20} color="#fe6500" />
                    </TouchableOpacity>
                    <View className=" mr-1 flex-row items-center w-[60%] sm:w-[75%] md:w-[80%] rounded-full border border-[#fe6500]">
                        <TextInput
                            className="flex-1 h-6 px-2 py-1 text-black"
                            placeholder="Search..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={(text) => {
                                setLoading(true)
                                setSearch(text);
                                setPage(1);
                            }}
                            onFocus={() => Keyboard.isVisible()}
                            ref={inputRef}
                            selectionColor="orange"
                        />
                        <TouchableOpacity className='mr-2' onPress={handleSearchClick} >
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
                        <OptimizedFlatList
                            data={products}
                            onLayout={(event: any) => setListHeight(event.nativeEvent.layout.height)}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            numColumns={3}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            onEndReached={loadMoreCategories}
                            onEndReachedThreshold={0.5}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#fe6500" />}
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
                                            : `${totalCartItems} ${totalCartItems > 1 ? 'Items' : 'Item'}`} = ₱ {totalPrice.toFixed(2) || 0}
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