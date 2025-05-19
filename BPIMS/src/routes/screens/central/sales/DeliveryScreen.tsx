import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import NumericKeypad from '../../../../components/NumericKeypad';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { CentralSalesParamList } from '../../../navigation/navigation';
import { updateDeliveryFee } from '../../../services/salesRepo';

type Props = NativeStackScreenProps<CentralSalesParamList, 'DeliveryFee'>;

const DeliveryFeeScreen = React.memo(({ route }: Props) => {
    const deliveryFee = route.params.deliveryFee;
    const user = route.params.user;
    const [isLoading, setLoading] = useState<boolean>(false);
    const [fee, setFee] = useState<string>(Number(deliveryFee).toFixed(2) || '0.00');
    const navigation = useNavigation<NativeStackNavigationProp<CentralSalesParamList>>();

    const applyFee = useCallback(async () => {
        try {
            setLoading(true);
            await updateDeliveryFee(Number(fee));
            navigation.navigate('Cart', { user });
        }
        finally {
            setLoading(false);
        }
    }, [fee, navigation]);

    const handleKeyPress = useCallback((key: string) => {
        let current = fee.replace('.', '');
        current += key;
        const formatted = (parseInt(current) / 100).toFixed(2);
        setFee(formatted);
    }, [fee]);

    const handleBackspace = useCallback(() => {
        let current = fee.replace('.', '');
        current = current.slice(0, -1) || '0';
        const formatted = (parseInt(current) / 100).toFixed(2);
        setFee(formatted);
    }, [fee]);

    const formattedFee = useMemo(() => fee, [fee]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">Applying Fee...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <TitleHeaderComponent title='Delivery Fee' isParent={false} userName={user.name} onPress={() => navigation.goBack()}></TitleHeaderComponent>
            <View className="items-center bg-gray relative pb-32">
                <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                <View className="items-center w-[90%] mt-4 h-[60%]">
                    <View className="flex flex-column items-center">
                        <Text className="text-lg font-bold text-gray-600 px-3 mt-4">
                            Delivery Fee
                        </Text>
                        <View className="flex flex-row items-center mt-6 border-b-2 border-[#fe6500] px-4 justify-center">
                            <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                ₱ {formattedFee}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
            <View className="absolute bottom-0 w-full items-center pb-3 pt-2">
                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                <TouchableOpacity
                    onPress={applyFee}
                    className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${fee === '0.00' ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'
                        }`}
                >
                    <View className="flex-1 items-center">
                        <Text
                            className={`text-lg font-bold ${fee === '0.00' ? 'text-[#fe6500]' : 'text-white'
                                }`}
                        >
                            APPLY FEE
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default DeliveryFeeScreen;