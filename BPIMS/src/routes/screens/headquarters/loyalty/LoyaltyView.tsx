import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PlusCircle } from 'react-native-feather';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { LoyaltyParamsList } from '../../../navigation/navigation';
import { deleteLoyaltyCard, getLoyaltyStages, getRewards, saveLoyaltyCard } from '../../../services/customerRepo';
import { LoyaltyCardDto, LoyaltyStageDto } from '../../../types/customerType';
import { ObjectDto } from '../../../types/userType';

type Props = NativeStackScreenProps<LoyaltyParamsList, 'LoyaltyView'>;

const LoyaltyViewScreen = memo(({ route }: Props) => {
    const { item, user } = route.params;
    const [loading, setLoading] = useState<boolean>(false);
    const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCardDto>(item);
    const navigation = useNavigation<NativeStackNavigationProp<LoyaltyParamsList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [stages, setStages] = useState<LoyaltyStageDto[]>([]);
    const [rewards, setRewards] = useState<ObjectDto[]>([]);

    const newStage: LoyaltyStageDto = {
        id: 0,
        orderId: 0,
        loyaltyCardId: 0,
        itemRewardId: null,
        rewardName: null
    };

    useEffect(() => {
        initializeCard();
        getStages();
        getRewardItems();

        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);


    useEffect(() => {
        validateForm();
    }, [loyaltyCard]);

    const initializeCard = useCallback(() => {
        let card = item;
        if (item.id == 0) {
            card = {
                id: 0,
                validYear: "",
                isValid: false
            }
        }
        setLoyaltyCard(card)
        return card;
    }, [item]);

    const handleChange = useCallback((field: string, value: string | number | boolean) => {
        setLoyaltyCard(prev => {
            const updatedCard = {
                ...(prev ?? initializeCard()),
                [field]: value,
            };

            return updatedCard;
        });
    }, [initializeCard]);

    const validateForm = useCallback(() => {
        if (!loyaltyCard) {
            setIsValid(false);
            return;
        }

        const isFormValid = (
            loyaltyCard.validYear !== ""
        );

        setIsValid(!!isFormValid);
    }, [loyaltyCard]);

    const save = useCallback(async () => {
        try {
            setLoading(true);
            if (loyaltyCard) {
                await saveLoyaltyCard(loyaltyCard);
            }
            initializeCard();
            navigation.navigate('LoyaltyScreen')
        } finally {
            setLoading(false);
        }
    }, [loyaltyCard, initializeCard]);

    const deleteCard = useCallback(async () => {
        try {
            setLoading(true);
            if (loyaltyCard) {
                await deleteLoyaltyCard(loyaltyCard.id);
            }
            initializeCard();
            navigation.navigate('LoyaltyScreen')
        } finally {
            setLoading(false);
        }
    }, [loyaltyCard, initializeCard]);

    const getStages = useCallback(async () => {
        try {
            setLoading(true);
            if (item.id != 0) {
                const response = await getLoyaltyStages(item.id);
                setStages(response.data);
            } else {
                setStages([]);
            }
        } catch (error) {
            console.error("Error fetching stages:", error);
        } finally {
            setLoading(false);
        }
    }, [item.id]);

    const getRewardItems = useCallback(async () => {
        try {
            setLoading(true)
            const response = await getRewards();
            const newRewards = response.data;

            const noReward = {
                id: 0,
                name: "(No Reward)"
            };

            newRewards.push(noReward);
            setRewards(newRewards);
        } catch (error) {
            console.error("Error fetching stages:", error);
        } finally {
            setLoading(false);
        }
    }, [item]);

    const handleRewardView = useCallback((item: LoyaltyStageDto | null) => {
        if (item == null) {
            item = newStage;
        }

        if (user) {
            item.loyaltyCardId = loyaltyCard.id;
            if (item.id == 0) {
                if (stages.length > 0) {
                    item.orderId = stages[stages.length - 1].orderId + 1;
                }
                else
                    item.orderId = 1
            }
            navigation.navigate('LoyaltyStage', { item, user, rewards, loyaltyCard });
        }
    }, [user, navigation, rewards, loyaltyCard.id, newStage]);


    const renderNormalMode = useMemo(() => (
        <View className="flex flex-1">
            <TitleHeaderComponent showTrash={true} onTrashPress={deleteCard} isParent={false} userName={user?.name || ""} title="Loyalty Card" onPress={() => navigation.goBack()}></TitleHeaderComponent>
            <View className="px-4 w-full">
                {loyaltyCard && (
                    <View className='w-full'>
                        <View className='flex flex-row w-full gap-2'>
                            <View className='w-full'>
                                <Text className="text-gray-700 text-sm font-bold">Year Valid</Text>
                                <TextInput
                                    value={loyaltyCard?.validYear?.toString() || ""}
                                    editable={true}
                                    className="border-b border-gray-400 py-2 text-black"
                                    placeholder="Enter Year"
                                    placeholderTextColor="gray"
                                    onChangeText={(text) => handleChange("validYear", text)}
                                    selectionColor="#fe6500"
                                />
                            </View>
                        </View>
                        <View className="flex flex-row items-center mb-4">
                            <Text className="text-gray-600 mr-2">Set Active</Text>
                            <Switch
                                value={loyaltyCard.isValid || false}
                                onValueChange={(value) => handleChange('isValid', value)}
                                thumbColor={loyaltyCard.isValid ? "#fe6500" : "#fe6500"}
                                trackColor={{ false: "#ccc", true: "#FF9E66" }}
                            />
                        </View>
                    </View>
                )}
            </View>
            {loyaltyCard.id != 0 && (
                <View className="flex flex-row justify-between items-center mb-2 pr-2">
                    <Text className="text-gray-700 text-sm font-bold"></Text>
                    <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() => handleRewardView(null)}
                    >
                        <Text className="text-[#fe6500] text-sm font-semibold mr-1">Add New Stage</Text>
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
            )}

            {loading && (
                <ActivityIndicator className='mt-4' size={'small'} color={'#fe6500'}></ActivityIndicator>
            )}
            {stages.length > 0 && (
                <View className="flex flex-column mt-4 h-[35vh] md:h-[50vh] lg:h-[60vh] pb-2 px-4">
                    <ScrollView className="w-full mb-8 mt-1">
                        <View className="flex flex-row justify-between border-b pb-2 mb-2 border-gray-300">
                            <Text className="text-black text-xs font-semibold flex-1 text-left">Stage No.</Text>
                            <Text className="text-black text-xs font-semibold flex-1 text-center">Reward</Text>
                        </View>

                        {stages.map((stage) => (
                            <TouchableOpacity onPress={() => handleRewardView(stage)} key={stage.id} className="flex flex-row justify-between py-1 border-b border-gray-200">
                                <Text className="text-black text-xs flex-1 text-left">{stage.orderId}</Text>
                                <Text className="text-black text-xs flex-1 text-center">{stage.rewardName || "(No Reward)"}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
            {!keyboardVisible && (
                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                    <TouchableOpacity
                        onPress={save}
                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                        disabled={!isValid}
                    >
                        <View className="flex-1 items-center">
                            <Text className={`font-bold text-lg ${!isValid ? 'text-[#fe6500]' : 'text-white'}`}>SAVE</Text>
                        </View>
                        {loading && (
                            <ActivityIndicator size={'small'} color={`${!isValid ? '#fe6500' : 'white'}`}></ActivityIndicator>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    ), [handleChange, keyboardVisible, loading, navigation, save, loyaltyCard, stages, user?.name, isValid]);

    return (
        <View className="flex flex-1">
            {renderNormalMode}
        </View>
    );
});

export default LoyaltyViewScreen;