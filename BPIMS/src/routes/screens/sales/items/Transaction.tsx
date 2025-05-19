import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Check } from 'react-native-feather';
import NumericKeypad from '../../../../components/NumericKeypad';
import RewardScreen from '../../../../components/RewardScreen';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { ItemStackParamList } from '../../../navigation/navigation';
import { changeReward, processPayment, saveCustomerItemReward } from '../../../services/salesRepo';
import { ItemDto, LoyaltyItemDto, TransactionDto, TransactionItemsDto } from '../../../types/salesType';

type Props = NativeStackScreenProps<ItemStackParamList, 'Transaction'>;

const TransactionScreen = React.memo(({ route }: Props) => {
    const { user, cart, total } = route.params;
    const [isLoading, setLoading] = useState<boolean>(false);
    const [payment, setPayment] = useState<string>(Number(total).toFixed(2).toString());
    const [done, setDone] = useState<boolean>(false);
    const [transaction, setTransaction] = useState<TransactionDto>();
    const [items, setTransactionItems] = useState<TransactionItemsDto[]>([]);
    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();
    const [loyaltyItem, setLoyaltyItem] = useState<LoyaltyItemDto>();
    const [openRewards, setOpenRewards] = useState<boolean>(false);

    useEffect(() => {
        const backAction = () => {
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    const change = useMemo(() => {
        return Number(payment) - total;
    }, [payment, total]);

    const applyPayment = useCallback(async () => {
        try {
            if (cart && payment) {
                setLoading(true);
                const result = await processPayment(Number(payment));
                if (result && result.isSuccess) {
                    setDone(true);
                    setTransaction(result.data.transaction);
                    setTransactionItems(result.data.transactionItems);
                    setLoyaltyItem(result.data.loyaltyItemDto);
                } else {
                    if (result)
                        Alert.alert('An Error Occurred', result.message);
                }
                setLoading(false);
            }
        }
        finally {
            setLoading(false);
        }
    }, [cart, payment]);

    const clickReceipt = useCallback(() => {
        if (transaction) {
            navigation.navigate('SlipOrder', { transaction, transactionItems: items, user });
        }
    }, [transaction, items, navigation, user]);

    const handleChooseReward = useCallback(() => {
        setOpenRewards(true)
    }, []);

    const saveReward = useCallback(async (item: ItemDto, qty: number) => {
        if (user && user.branchId && loyaltyItem) {
            if (!loyaltyItem.doneChoose)
                await saveCustomerItemReward(loyaltyItem.id, item.id, user.branchId, qty);
            else {
                await changeReward(loyaltyItem.id, item.id, user.branchId, loyaltyItem.lastItemId ?? 0, qty, loyaltyItem.qty || 0)
            }

            setLoyaltyItem(prev => ({
                ...prev!,
                itemName: item.name,
                doneChoose: true,
                lastItemId: item.id,
                qty: qty
            }));
            setOpenRewards(false);
        }
    }, [loyaltyItem, user]);

    const handleKeyPress = useCallback((key: string) => {
        let current = payment.replace('.', '');
        current += key;
        const formatted = (parseInt(current) / 100).toFixed(2);
        setPayment(formatted);
    }, [payment]);

    const handleBackspace = useCallback(() => {
        let current = payment.replace('.', '');
        current = current.slice(0, -1) || '0';
        const formatted = (parseInt(current) / 100).toFixed(2);
        setPayment(formatted);
    }, [payment]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">Processing Payment...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {openRewards && loyaltyItem ? (
                <RewardScreen
                    user={user}
                    loyaltyCustomerId={loyaltyItem.id}
                    selectItem={(item, quantity) => {
                        saveReward(item, quantity);
                    }}
                    onClose={() => setOpenRewards(false)}
                />
            ) : (
                <View style={{ flex: 1 }}>

                    {!done ? (
                        <View style={{ flex: 1 }}>
                            <TitleHeaderComponent title='Payment' isParent={false} userName={user.name} onPress={() => navigation.goBack()}></TitleHeaderComponent>

                            <View className="items-center bg-gray relative pb-32">
                                <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                                <View className="items-center w-[90%] mt-4 h-[60%]">
                                    <View className="flex flex-column items-center">
                                        <Text className="text-lg font-bold text-gray-600 px-3 mt-4">
                                            Amount Received
                                        </Text>
                                        <View className="flex flex-row items-center mt-6   border-b-2 border-[#fe6500] px-4 justify-center">
                                            <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                                ₱ {payment}
                                            </Text>
                                        </View>
                                    </View>
                                    {Number(payment) >= total && (
                                        <Text className="text-sm font-bold text-gray-600 px-3 mt-4">
                                            Change: ₱ {change.toFixed(2)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View className="absolute bottom-0 w-full items-center pb-3 pt-2">
                                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                                <TouchableOpacity
                                    disabled={Number(payment) < total}
                                    onPress={applyPayment}
                                    className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${Number(payment) < total ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'
                                        }`}
                                >
                                    <View className="flex-1 items-center">
                                        <Text
                                            className={`text-lg font-bold ${Number(payment) < total ? 'text-[#fe6500]' : 'text-white'
                                                }`}
                                        >
                                            NEXT
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <View className="items-center bg-gray relative top-10 mt-1 pb-32">
                                <View className="flex flex-columns items-center mt-16 px-4">
                                    <View className="bg-[#fe6500] rounded-full p-2">
                                        <Check height={56} width={56} color="white" />
                                    </View>
                                    <Text className="text-sm mt-3 text-center text-gray-700">Done</Text>
                                    <Text className="text-5xl mt-10 text-center text-gray-700">
                                        ₱ {Number(payment).toFixed(2)}
                                    </Text>
                                    <Text className="text-sm font-bold text-gray-600 px-3 mt-4">
                                        Change: ₱ {change.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                            {loyaltyItem && loyaltyItem?.currentStage > 0 && (
                                <View className="flex-column items-center mt-16 px-4">
                                    {
                                        loyaltyItem.currentStage === 1 ? (
                                            <Text className="text-sm mt-3 text-gray-700 text-center">
                                                This customer is now part of Balay Panday's Loyal Customer. 🎉
                                            </Text>
                                        ) : loyaltyItem.completeLoyalty === true ? (
                                            <Text className="text-sm mt-3 text-gray-700 text-center">
                                                Customer has already completed the Balay Panday loyalty members stamps! 🏅
                                            </Text>
                                        ) : (
                                            <Text className="text-sm mt-3 text-gray-700 text-center">
                                                This customer has earned {loyaltyItem.currentStage} loyalty stamp{loyaltyItem.currentStage > 1 ? 's' : ''}! 🏅
                                            </Text>
                                        )
                                    }

                                    {(loyaltyItem.hasReward && !loyaltyItem.completeLoyalty) && (
                                        !loyaltyItem.doneChoose ? (
                                            <View>
                                                <Text className="text-sm mt-3 text-gray-700 text-center">
                                                    🎁 This customer is eligible to receive <Text className="font-semibold">{loyaltyItem.rewardName}</Text>.
                                                </Text>
                                                {loyaltyItem.isItem && (
                                                    <>
                                                        <Text className="text-sm mt-3 text-gray-700 text-center">
                                                            Please select a reward item to continue.
                                                        </Text>
                                                        <TouchableOpacity
                                                            onPress={() => handleChooseReward()}
                                                            className="mt-3 text-center bg-[#fe6500] p-2 rounded-lg items-center"
                                                        >
                                                            <Text className="text-white font-medium">Choose Reward</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        ) : (
                                            <View>
                                                <Text className="text-sm mt-3 text-gray-700 text-center">
                                                    🎁 This customer is eligible to receive <Text className="font-semibold">{loyaltyItem.rewardName}</Text>.
                                                </Text>
                                                {loyaltyItem.isItem && (
                                                    <>
                                                        <Text className="text-sm mt-3 text-gray-700 text-center">
                                                            Item Selected: {loyaltyItem.itemName}
                                                        </Text>
                                                        <TouchableOpacity
                                                            onPress={() => handleChooseReward()}
                                                            className="mt-3 text-center bg-[#fe6500] p-2 rounded-lg items-center"
                                                        >
                                                            <Text className="text-white font-medium">Change Reward</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        )
                                    )}
                                </View>
                            )}
                            <View className="items-center absolute bottom-0 left-0 right-0 pb-2" style={{ zIndex: 100 }}>
                                <TouchableOpacity
                                    className="w-[95%] rounded-xl p-4 mb-2 items-center bg-gray-500"
                                    onPress={clickReceipt}
                                >
                                    <Text className="font-bold text-lg text-white">RECEIPT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="w-[95%] rounded-xl p-4 items-center bg-[#fe6500]"
                                    onPress={() => navigation.navigate('Item')}
                                >
                                    <Text className="font-bold text-lg text-white">START NEW</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
});

export default TransactionScreen;