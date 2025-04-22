import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { Trash2 } from 'react-native-feather';
import BankIcon from '../../../../components/icons/BankIcon';
import PaypalIcon from '../../../../components/icons/PaypalIcon';
import StoreIcon from '../../../../components/icons/StoreIcon';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { CentralSalesParamList } from '../../../navigation/navigation';
import { getCart, updateCustomer } from '../../../services/salesRepo';
import { Cart } from '../../../types/salesType';

type Props = NativeStackScreenProps<CentralSalesParamList, 'Payment'>;

const PaymentScreen = React.memo(({ route }: Props) => {
    const user = route.params.user;
    const [isLoading, setLoading] = useState<boolean>(false);
    const [total, setTotal] = useState<number>(0);
    const [cart, setCart] = useState<Cart>();
    const navigation = useNavigation<NativeStackNavigationProp<CentralSalesParamList>>();
    const [activeMethod, setActiveMethod] = useState<string>("Cash");

    const getCartItems = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getCart();
            const c = result.data.cart;
            setCart(c);
            const total = Number(c.subTotal) - Number(c.discount) + Number(c.deliveryFee);
            setTotal(total);
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getCartItems();
    }, [getCartItems]);

    const handleNext = useCallback(() => {
        if (!cart || !user) return;

        const isCredit = activeMethod === "Store Credit";

        navigation.navigate('Transaction', { cart, user, total, isCredit });
    }, [cart, user, total, navigation, activeMethod]);

    const handleAddCustomer = useCallback(() => {
        navigation.navigate('CustomerList', { user });
    }, [navigation]);

    const removeCustomerName = useCallback(async () => {
        if (cart) {
            await updateCustomer(null);
            await getCartItems();
        }
    }, [cart, getCartItems]);

    const formattedTotal = useMemo(() => total.toFixed(2), [total]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">Loading...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <TitleHeaderComponent title='Payment' isParent={false} userName={user.name} onPress={() => navigation.navigate('Cart', { user })}></TitleHeaderComponent>
            <View className="items-center bg-gray relative pb-32">
                <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                <View className="items-center w-[90%] mt-4 h-[60%] sm:h-[65%] md:h-[70%]">
                    <View className="flex flex-row items-center">
                        <Text className="text-5xl text-black px-3 mt-8">₱ {formattedTotal}</Text>
                    </View>
                    {cart?.customerName ? (
                        <View className="flex flex-row items-center mt-6">
                            <TouchableOpacity className="p-1" onPress={removeCustomerName}>
                                <Trash2 color="red" height={16} width={16} />
                            </TouchableOpacity>
                            <TouchableOpacity className="p-1" onPress={handleAddCustomer}>
                                <Text className="text-black text-center ml-1">{cart.customerName}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View
                            className="w-[50%] rounded-full p-2 mt-4 items-center bg-gray-300"
                        >
                            <Text className="text-center text-black">Exacon</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="flex flex-column items-center absolute bottom-0 left-0 right-0" style={{ zIndex: 100 }}>
                <View className="items-center w-full h-[35%] sm:h-[37%] md:h-[37.5%] mb-2 text-right flex flex-column">
                    <View className="w-full flex flex-row px-4 justify-between">
                        {['Cash', 'G-Cash', 'Bank Transfer'].map((method, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setActiveMethod(method)}
                                className={`w-[30%] rounded-lg p-2 mt-4 items-center bg-gray-300 ${method == activeMethod ? "border-2 border-[#fe6500]" : ""}`}
                            >
                                {method == "Bank Transfer" ? (
                                    <BankIcon size={64} />
                                ) : method == "Cash" ? (
                                    <Image
                                        source={require(`../../../../components/images/cash.png`)}
                                        className="w-16 h-16"
                                    />
                                ) : (
                                    <Image
                                        source={require(`../../../../components/images/g-cash.png`)}
                                        className="w-16 h-16"
                                    />
                                )}
                                <Text className="text-center text-black text-xs">{method}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View className="w-full flex flex-row px-4 justify-between mb-2">
                        {['Paypal', 'Cheque', 'Store Credit'].map((method, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setActiveMethod(method)}
                                className={`w-[30%] rounded-lg p-2 mt-4 items-center bg-gray-300 ${method == activeMethod ? "border-2 border-[#fe6500]" : ""}`}
                            >
                                {method === 'Paypal' ? (
                                    <PaypalIcon size={64} />
                                ) : method === 'Cheque' ? (
                                    <Image
                                        source={require('../../../../components/images/cheque.png')}
                                        className="w-16 h-16"
                                    />
                                ) : (
                                    <StoreIcon size={62} />
                                )}
                                <Text className="text-center text-black text-xs">{method}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        className="w-[95%] rounded-xl p-3 items-center bg-[#fe6500]"
                        onPress={handleNext}
                    >
                        <Text className="font-bold text-center text-white text-lg">NEXT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

export default PaymentScreen;