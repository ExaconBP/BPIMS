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
import { ItemStackParamList } from '../../../navigation/navigation';
import { updateDiscount } from '../../../services/salesRepo';

type Props = NativeStackScreenProps<ItemStackParamList, 'Discount'>;

const DiscountScreen = React.memo(({ route }: Props) => {
  const { discount, subTotal, user } = route.params;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [disc, setDisc] = useState<string>(Number(discount).toFixed(2));
  const [percentage, setPercentage] = useState<string | null>(null);
  const [activeDiscount, setActiveDiscount] = useState<'cash' | 'percentage'>('cash');
  const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

  const applyDiscount = useCallback(async () => {
    try {
      setLoading(true);
      await updateDiscount(Number(disc));
      navigation.navigate('Cart', { user });
    } finally {
      setLoading(false);
    }
  }, [disc, navigation]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (activeDiscount === 'percentage') {
        let current = percentage?.replace('.', '') || '';
        current += key;
        const formatted = (parseInt(current) / 100).toFixed(2);

        const calculatedDiscount = (Number(subTotal) * (Number(formatted) / 100)).toFixed(2);
        if (Number(calculatedDiscount) > Number(subTotal)) return;

        setPercentage(formatted);
        setDisc(calculatedDiscount);
      } else if (activeDiscount === 'cash') {
        let current = disc.replace('.', '');
        current += key;
        const formatted = (parseInt(current) / 100).toFixed(2);

        if (Number(formatted) > Number(subTotal)) return;

        setDisc(formatted);
        const p = (Number(formatted) / Number(subTotal)) * 100;
        setPercentage(p.toFixed(2).toString());
      }
    },
    [activeDiscount, disc, percentage, subTotal]
  );

  const handleBackspace = useCallback(() => {
    if (activeDiscount === 'percentage') {
      let current = percentage?.replace('.', '') || '';
      current = current.slice(0, -1) || '0';
      const formatted = (parseInt(current) / 100).toFixed(2);
      setPercentage(formatted);
      const calculatedDiscount = (Number(subTotal) * (Number(formatted) / 100)).toFixed(2);
      setDisc(calculatedDiscount);
    } else if (activeDiscount === 'cash') {
      let current = disc.replace('.', '');
      current = current.slice(0, -1) || '0';
      const formatted = (parseInt(current) / 100).toFixed(2);
      setDisc(formatted);
      const p = (Number(formatted) / Number(subTotal)) * 100;
      setPercentage(p.toFixed(2).toString());
    }
  }, [activeDiscount, disc, percentage, subTotal]);

  const formattedDiscount = useMemo(() => disc, [disc]);
  const formattedPercentage = useMemo(() => percentage || '0', [percentage]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fe6500" />
        <Text className="text-[#fe6500] mt-2">Applying Discount...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TitleHeaderComponent title={`Discount on ₱ ${subTotal}`} isParent={false} userName={user.name} onPress={() => navigation.goBack()}></TitleHeaderComponent>
      <View className="items-center bg-gray relative pb-32">
        <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
        <View className="items-center w-[90%] mt-4 h-[60%]">
          <View className="flex flex-column items-center justify-center">
            <TouchableOpacity
              className="items-center"
              onPress={() => setActiveDiscount('cash')}
            >
              <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Cash Discount</Text>
              <View
                className={`flex flex-row items-center mt-6 w-48 border-b-2 ${activeDiscount === 'cash' ? 'border-[#fe6500]' : 'border-gray-500'
                  } px-4 justify-center`}
              >
                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                  ₱ {formattedDiscount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex flex-column mt-6 items-center">
            <TouchableOpacity
              className="items-center"
              onPress={() => setActiveDiscount('percentage')}
            >
              <Text className="text-lg font-bold text-gray-600 px-3 mt-2">Percentage Discount</Text>
              <View
                className={`flex flex-row items-center mt-6 w-48 border-b-2 ${activeDiscount === 'percentage' ? 'border-[#fe6500]' : 'border-gray-500'
                  } px-4 justify-center`}
              >
                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                  {formattedPercentage} %
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="absolute bottom-0 w-full items-center pb-3 pt-2">
        <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
        <TouchableOpacity
          onPress={applyDiscount}
          className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${disc === '0.00' ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'
            }`}
        >
          <View className="flex-1 items-center">
            <Text
              className={`text-lg font-bold ${disc === '0.00' ? 'text-[#fe6500]' : 'text-white'
                }`}
            >
              APPLY DISCOUNT
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default DiscountScreen;