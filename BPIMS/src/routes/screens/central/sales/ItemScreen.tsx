import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Dimensions, FlatList, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChevronRight, Menu, Search } from "react-native-feather";
import CentralSidebar from '../../../../components/CentralSidebar';
import ExpandableText from '../../../../components/ExpandableText';
import NumericKeypad from '../../../../components/NumericKeypad';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { CentralSalesParamList } from '../../../navigation/navigation';
import { addCentralItemToCart, getCentralProducts } from '../../../services/centralRepo';
import { getCart, getCategories } from '../../../services/salesRepo';
import { BranchProductDto, CentralItemDto } from '../../../types/centralType';
import { CartItems, CategoryDto } from '../../../types/salesType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { formatQuantity, truncateShortName } from '../../../utils/dateFormat';
import { getItemImage } from '../../../services/itemsHQRepo';

const ItemScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<CentralItemDto[]>([]);
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
    const [selectedItem, setSelectedItem] = useState<CentralItemDto | null>(null);
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<CartItems[]>([]);
    const [activeBranch, setActiveBranch] = useState<number>(1);

    const screenWidth = Dimensions.get('window').width;
    const itemWidth = screenWidth / 3 - 10;
    const screenHeight = Dimensions.get('window').height;
    const [listHeight, setListHeight] = useState(screenHeight);

    const navigation = useNavigation<NativeStackNavigationProp<CentralSalesParamList>>();

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
                const userResponse = await getUserDetails();
                setUser(userResponse)
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
            const response = await getCentralProducts(categoryId, page, search.trim());
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
                if (newProducts.length < 30 || (response.totalCount && (page * 30) >= response.totalCount)) {
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

    const debouncedAddToCart = useCallback(debounce(async (item: CentralItemDto) => {
        setInputMode(true)
        setSelectedItem(item)
    },), []);

    const addToCartFaction = useCallback(async () => {
        try {
            if (selectedItem) {
                setButtonLoading(true);
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
                        await addCentralItemToCart(selectedItem.branchProducts);
                        setSelectedItem(null);
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
        }
    }, [selectedItem, quantity, totalCartItems, totalPrice, products, getUserAndCart, buttonLoading, setButtonLoading]);

    const handleCategoryClick = useCallback((id: number) => {
        setLastCategory(activeCategory);
        setLoading(true);
        setActiveCategory(id);
        setPage(1);
    }, [activeCategory]);

    const handleSearchClick = useCallback(() => {
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

    const handleBranchClick = useCallback((branchId: number) => {
        setActiveBranch(branchId);
    }, []);


    const ProductItem = React.memo(({ item, index }: { item: CentralItemDto; index: number }) => {
        const handlePress = useCallback(() => {
            debouncedAddToCart(item);
        }, [debouncedAddToCart, item]);

        return (
            <View>
                <TouchableOpacity
                    className={`m-1 opacity-100`}
                    style={{ width: itemWidth }}
                    onPress={handlePress}
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
                        </View>

                        <View className="bg-yellow-500 w-full rounded-b-lg p-2 justify-between">
                            <ExpandableText text={item.name.toUpperCase()}></ExpandableText>
                            <Text className="text-xs font-bold mb-1" numberOfLines={1}>
                                ₱ {item.price}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    });

    const handleKeyPress = useCallback(
        (key: string) => {

            if (selectedItem) {

                const branchProduct = selectedItem.branchProducts.find(bp => bp.branchId === activeBranch);
                if (!branchProduct) return;
                if (selectedItem.sellByUnit) {
                    if (!branchProduct.soldQuantity) branchProduct.soldQuantity = '0'

                    const currentValue = branchProduct.soldQuantity?.toString() || '0';
                    const newValue = currentValue === '0' ? key : currentValue + key;
                    const numericNewValue = parseInt(newValue) || 0;

                    if (numericNewValue <= branchProduct.quantity) {
                        setSelectedItem(prev => {
                            if (!prev) return prev;

                            const updatedBranchProducts = prev.branchProducts.map(bp =>
                                bp.branchId === activeBranch
                                    ? { ...bp, soldQuantity: newValue }
                                    : bp
                            );
                            return {
                                ...prev,
                                branchProducts: updatedBranchProducts
                            };
                        });
                        setMessage(null);
                    } else {
                        const message = formatQuantity(branchProduct.quantity, selectedItem.sellByUnit)
                        setMessage(`Quantity exceeds available stock. Available stock: ${message}`);
                    }
                } else {
                    if (!branchProduct.soldQuantity) branchProduct.soldQuantity = '0.00'
                    let current = branchProduct.soldQuantity?.replace('.', '');
                    current += key;
                    if (!current) return;
                    const formatted = (parseInt(current) / 100).toFixed(2);
                    const numericFormatted = parseFloat(formatted);
                    if (numericFormatted <= branchProduct.quantity) {
                        setQuantity(formatted);
                        setSelectedItem(prev => {
                            if (!prev) return prev;

                            const updatedBranchProducts = prev.branchProducts.map(bp =>
                                bp.branchId === activeBranch
                                    ? { ...bp, soldQuantity: formatted }
                                    : bp
                            );
                            return {
                                ...prev,
                                branchProducts: updatedBranchProducts
                            };
                        });
                        setMessage(null);
                    } else {
                        const message = formatQuantity(branchProduct.quantity, selectedItem.sellByUnit)
                        setMessage(`Quantity exceeds available stock. Available stock: ${message}`);
                    }
                }
            }
        },
        [selectedItem, activeBranch, quantity]
    );

    const handleBackspace = useCallback(() => {
        setMessage(null);
        if (selectedItem) {
            const branchProduct = selectedItem.branchProducts.find(bp => bp.branchId === activeBranch);
            if (!branchProduct) return;
            if (selectedItem.sellByUnit) {
                const currentValue = branchProduct.soldQuantity?.toString() || '0';
                const newValue = currentValue.slice(0, -1) || '0';

                setSelectedItem(prev => {
                    if (!prev) return prev;

                    const updatedBranchProducts = prev.branchProducts.map(bp =>
                        bp.branchId === activeBranch
                            ? { ...bp, soldQuantity: newValue }
                            : bp
                    );
                    return {
                        ...prev,
                        branchProducts: updatedBranchProducts
                    };
                });
            } else {
                let current = (Number(branchProduct.soldQuantity || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                setSelectedItem(prev => {
                    if (!prev) return prev;

                    const updatedBranchProducts = prev.branchProducts.map(bp =>
                        bp.branchId === activeBranch
                            ? { ...bp, soldQuantity: formatted }
                            : bp
                    );

                    return {
                        ...prev,
                        branchProducts: updatedBranchProducts
                    };
                });
            }
        }
    }, [selectedItem, activeBranch, quantity]);

    const renderItem = useCallback(({ item, index }: { item: CentralItemDto, index: number }) => <ProductItem item={item} index={index} />, []);
    const keyExtractor = useCallback((item: CentralItemDto) => item.id.toString(), []);

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <CentralSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <View style={{ flex: 1, display: isInputMode ? 'flex' : 'none' }}>
                <TitleHeaderComponent isParent={false} title={selectedItem?.name || ""} onPress={() => {
                    setInputMode(false);
                    setActiveBranch(1)
                    setMessage("")
                    setSelectedItem(null)
                }} userName=''></TitleHeaderComponent>

                <View className="items-center bg-gray relative pb-32">
                    <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                    {message && (
                        <View className="w-full items-center mb-2">
                            <Text className="text-red-500 text-sm">{message}</Text>
                        </View>
                    )}
                    <View className="items-center w-[90%] mt-4 h-[60%]">
                        <View className="flex flex-row flex-wrap justify-center w-full gap-x-4 gap-y-6">
                            {selectedItem?.branchProducts?.map((bp: BranchProductDto) => (
                                <TouchableOpacity
                                    onPress={() => handleBranchClick(bp.branchId)}
                                    key={bp.id}
                                    className="items-center w-[45%]"
                                >
                                    <Text className="text-base font-semibold text-gray-600 text-center mb-1">
                                        {bp.branchName.length > 12
                                            ? bp.branchName.slice(0, 12) + "..."
                                            : bp.branchName}
                                    </Text>

                                    <View
                                        className={`flex flex-row items-center border-b-2 ${bp.branchId === activeBranch
                                            ? 'border-[#fe6500]'
                                            : 'border-gray-500'
                                            } px-2 py-1 justify-center`}
                                    >
                                        <Text className="text-2xl text-[#fe6500] text-center tracking-widest">
                                            {selectedItem.sellByUnit
                                                ? String(bp.soldQuantity || 0)
                                                : Number(bp.soldQuantity || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
                <View className="absolute bottom-0 w-full items-center pb-3 pt-2">
                    <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                    <TouchableOpacity
                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${selectedItem?.branchProducts.some(x => Number(x.soldQuantity) > 0)
                            ? 'bg-[#fe6500]'
                            : 'bg-gray border-2 border-[#fe6500]'
                            }`}
                        onPress={addToCartFaction}
                        disabled={!!message || buttonLoading}
                    >
                        <View className="flex-1 items-center">
                            <Text
                                className={`text-lg font-bold ${selectedItem?.branchProducts.some(x => Number(x.soldQuantity) > 0) ? 'text-white' : 'text-[#fe6500]'}`}
                            >
                                ADD TO CART
                            </Text>
                        </View>
                        {buttonLoading && (
                            <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
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
                                setHasMoreData(false);
                                setProducts([]);
                            }}
                            onFocus={() => Keyboard.isVisible()}
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
                        <View className="w-[90%] flex-row justify-between pr-4 pl-4">
                            {categories.map((category) => (
                                <TouchableOpacity
                                    onPress={() => handleCategoryClick(category.id)}
                                    key={category.id}
                                    className="rounded-full mx-1"
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
                    </View>
                )}
            </View>

        </View >
    );
};
export default ItemScreen;