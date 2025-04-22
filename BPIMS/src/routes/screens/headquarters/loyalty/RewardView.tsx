import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { LoyaltyParamsList } from '../../../navigation/navigation';
import { saveRewards } from '../../../services/customerRepo';
import { ObjectDto } from '../../../types/userType';

type Props = NativeStackScreenProps<LoyaltyParamsList, 'RewardView'>;

const RewardViewScreen = memo(({ route }: Props) => {
    const { item, user } = route.params;
    const [loading, setLoading] = useState<boolean>(false);
    const [reward, setReward] = useState<ObjectDto>(item);
    const navigation = useNavigation<NativeStackNavigationProp<LoyaltyParamsList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

    useEffect(() => {
        initializeCard();
    }, []);

    useEffect(() => {
        validateForm();
    }, [reward]);

    const initializeCard = useCallback(() => {
        let reward = item;
        if (item.id == 0) {
            reward = {
                id: 0,
                name: ""
            }
        }
        setReward(reward)
        return reward;
    }, []);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleChange = useCallback((field: string, value: string | number | boolean) => {
        setReward(prev => {
            const updatedCard = {
                ...(prev ?? initializeCard()),
                [field]: value,
            };
            return updatedCard;
        });
    }, [initializeCard]);

    const validateForm = useCallback(() => {
        if (!reward) {
            setIsValid(false);
            return;
        }

        const isFormValid = (
            reward.name !== ""
        );
        setIsValid(!!isFormValid);
    }, [reward]);


    const saveStockInput = useCallback(async () => {
        try {
            setLoading(true)
            if (reward) {
                await saveRewards(reward.id, reward.name)
            }
            initializeCard();
            setLoading(false)
            navigation.push('LoyaltyScreen')
        }
        finally {
            setLoading(false)
        }
    }, [reward]);

    const renderNormalMode = useMemo(() => (
        <View className="flex flex-1">
            <TitleHeaderComponent isParent={false} userName={user?.name || ""} title="Loyalty Rewards" onPress={() => navigation.navigate('LoyaltyScreen')}></TitleHeaderComponent>
            <View className="px-4 w-full">
                {reward && (
                    <View className='w-full'>
                        <View className='flex flex-row w-full gap-2 mt-4'>
                            <View className='w-full'>
                                <Text className="text-gray-700 text-sm font-bold">Item Name</Text>
                                <TextInput
                                    value={reward?.name || ""}
                                    editable={true}
                                    className="border-b border-gray-400 py-2 text-black"
                                    placeholder="Enter Name eg. cap, 5 kg Rice"
                                    placeholderTextColor="gray"
                                    onChangeText={(text) => handleChange("name", text)}
                                    selectionColor="#fe6500"
                                />
                            </View>
                        </View>
                    </View>
                )}
            </View>
            {!keyboardVisible && (
                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                    <TouchableOpacity
                        onPress={saveStockInput}
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
        </View >
    ), [handleChange, item, keyboardVisible, navigation, openDate, saveStockInput, reward, user?.name, isValid]);

    return (
        <View className="flex flex-1">
            {renderNormalMode}
        </View>
    );
});

export default RewardViewScreen;