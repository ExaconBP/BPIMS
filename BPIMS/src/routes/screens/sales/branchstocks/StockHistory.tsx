import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import ExpandableText from '../../../../components/ExpandableText';
import ItemImage from '../../../../components/ItemImage';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { BranchStockParamList } from '../../../navigation/navigation';
import { BranchStockDto, StockInputHistoryDto } from '../../../types/stockType';
import { UserDetails } from '../../../types/userType';
import { formatTransactionDateOnly } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<BranchStockParamList, 'StockHistory'>;

export default function StockHistory({ route }: Props) {
    const item: BranchStockDto = route.params.item;
    const user: UserDetails = route.params.user;
    const history: StockInputHistoryDto = route.params.history
    const navigation = useNavigation<NativeStackNavigationProp<BranchStockParamList>>();
  
    return (
        <View className="flex flex-1">
            <View className="flex flex-1">
                <TitleHeaderComponent isParent={true} title='STOCK HISTORY' userName={user.name} onPress={() => navigation.navigate('StockInput', { item, user })}
                ></TitleHeaderComponent>
                <View className="px-4 w-full mt-6">
                    <View className="w-full flex items-center">
                        <ExpandableText text={item.name}></ExpandableText>
                        <View className="w-full flex items-center mt-2 mb-2">
                            <ItemImage imagePath={item.imagePath} />

                        </View>
                    </View>

                    {history && (
                        <View className='w-full mt-4'>
                            <View className='flex flex-row w-full gap-2'>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Quantity</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.qty}</Text>
                                    </View>
                                </View>
                                <View className='w-1/2'>
                                    <Text className="text-red-500 text-sm font-bold">Critical Value</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{item.sellByUnit ? item.storeCriticalValue : Number((item.storeCriticalValue || 0)).toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className='flex flex-row w-full gap-2 mt-4'>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Delivery Date</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{formatTransactionDateOnly(history.deliveryDate.toString())}</Text>
                                    </View>
                                </View>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Delivered By</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.deliveredBy}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className='flex flex-row w-full gap-2 mt-4'>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Expected Total Qty</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.expectedTotalQty}</Text>
                                    </View>
                                </View>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Actual Total Qty</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.actualTotalQty}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View >
        </View >
    );
}