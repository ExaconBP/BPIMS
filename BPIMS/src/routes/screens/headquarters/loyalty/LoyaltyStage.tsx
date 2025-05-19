import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SelectModal from '../../../../components/SelectModal';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { LoyaltyParamsList } from '../../../navigation/navigation';
import { deleteStage, saveLoyaltyStage } from '../../../services/customerRepo';
import { LoyaltyStageDto } from '../../../types/customerType';

type Props = NativeStackScreenProps<LoyaltyParamsList, 'LoyaltyStage'>;

const LoyaltyStageScreen = memo(({ route }: Props) => {
    const { item, user, rewards, loyaltyCard } = route.params;
    const [loading, setLoading] = useState<boolean>(false);
    const [stage, setStage] = useState<LoyaltyStageDto>(item);
    const navigation = useNavigation<NativeStackNavigationProp<LoyaltyParamsList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [openRewards, setOpenRewards] = useState<boolean>(false);

    useEffect(() => {
        initializeStage();
    }, []);

    useEffect(() => {
        validateForm();
    }, []);

    const initializeStage = useCallback(() => {
        let stage = item;
        if (item.id == 0) {
            stage = {
                id: 0,
                orderId: item.orderId,
                itemRewardId: null,
                rewardName: null,
                loyaltyCardId: item.loyaltyCardId
            }
        }
        setStage(stage)
        return stage;
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
        setStage(prev => {
            const updatedCard = {
                ...(prev ?? initializeStage()),
                [field]: value,
            };
            return updatedCard;
        });
    }, [initializeStage]);

    const validateForm = useCallback(() => {
        if (!stage) {
            setIsValid(false);
            return;
        }

        const isFormValid = (
            stage.orderId !== 0
        );

        setIsValid(!!isFormValid);
    }, [stage]);

    const saveStage = useCallback(async () => {
        try {
            setLoading(true)

            if (stage) {
                if (stage.itemRewardId == 0) stage.itemRewardId == null
                await saveLoyaltyStage(stage)
                navigation.navigate('LoyaltyView', { item: loyaltyCard, user })
            }
            initializeStage();
            setLoading(false)
        }
        finally {
            setLoading(false)
        }
    }, [stage]);

    const deleteLoyaltyStage = useCallback(async () => {
        try {
            setLoading(true)

            if (stage) {
                if (stage.itemRewardId == 0) stage.itemRewardId == null
                await deleteStage(stage.id)
                navigation.navigate('LoyaltyView', { item: loyaltyCard, user })
            }
            initializeStage();
            setLoading(false)
        }
        finally {
            setLoading(false)
        }
    }, [stage]);

    const handleSelectSupplier = (item: { id: number; name: string }) => {
        handleChange("itemRewardId", item.id);
        handleChange("rewardName", item.name);
        setOpenRewards(false);
    };

    const renderNormalMode = useMemo(() => (
        <View className="flex flex-1">
            <TitleHeaderComponent showTrash={true} onTrashPress={deleteLoyaltyStage} isParent={false} userName={user?.name || ""} title="Loyalty Rewards" onPress={() => navigation.goBack()}></TitleHeaderComponent>
            <View className="px-4 w-full">
                {stage && (
                    <View className='w-full'>
                        <View className='flex flex-row w-full gap-2 mt-4'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Stage Order Number</Text>
                                <TextInput
                                    value={stage?.orderId.toString() || ''}
                                    keyboardType="numeric"
                                    editable={true}
                                    className="border-b border-gray-400 py-2 text-black"
                                    placeholder="Enter order number"
                                    placeholderTextColor="gray"
                                    onChangeText={(text) => {
                                        const numericValue = parseInt(text) || 0;
                                        handleChange("orderId", numericValue);
                                    }}
                                    selectionColor="#fe6500"
                                />
                            </View>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Item Reward</Text>
                                <TouchableOpacity
                                    className="border-b border-gray-400 py-2"
                                    onPress={() => setOpenRewards(true)}

                                >
                                    <Text className={`${stage.itemRewardId ? 'text-black' : 'text-gray-500'} ml-1`}>{stage.rewardName || '(No Reward)'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>
            {!keyboardVisible && (
                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                    <TouchableOpacity
                        onPress={saveStage}
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
                    <SelectModal
                        visible={openRewards}
                        onClose={() => setOpenRewards(false)}
                        onSelect={handleSelectSupplier}
                        items={rewards}
                        keyExtractor={(item) => item.id.toString()}
                        labelExtractor={(item) => item.name}
                        title='SELECT REWARD'
                    />
                </View>
            )}
        </View >
    ), [handleChange, item, keyboardVisible, navigation, openDate, saveStage, stage, user?.name, isValid, rewards, setOpenRewards, openRewards, loading]);

    return (
        <View className="flex flex-1">
            {renderNormalMode}
        </View>
    );
});

export default LoyaltyStageScreen;