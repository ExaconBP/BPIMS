import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Camera } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import NumericKeypad from '../../../../components/NumericKeypad';
import SelectModal from '../../../../components/SelectModal';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { StockMonitorParamList } from '../../../navigation/navigation';
import { returnToSupplier } from '../../../services/whRepo';
import { ItemStock } from '../../../types/stockType';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { ReturnToStockDto } from '../../../types/whType';
import { getItemImage } from '../../../services/itemsHQRepo';

type Props = NativeStackScreenProps<StockMonitorParamList, 'ReturnStock'>;

const ReturnStockScreen = memo(({ route }: Props) => {
    const item: ItemStock = route.params.item;
    const user: UserDetails = route.params.user;
    const suppliers: ObjectDto[] = route.params.suppliers;
    const [loading, setLoading] = useState<boolean>(false);
    const [returnStock, setReturnStock] = useState<ReturnToStockDto>();
    const navigation = useNavigation<NativeStackNavigationProp<StockMonitorParamList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [openSuppliers, setOpenSuppliers] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);

    const fieldLabels: { [key: string]: string } = useMemo(() => ({
        quantity: 'Quantity',
        reason: 'Reason',
        supplierName: 'Supplier Name',
        supplierId: 'SupplierId',
        date: 'Date',
    }), []);

    useEffect(() => {
        newReturnStock();
    }, []);

    useEffect(() => {
        validateForm();
    }, [returnStock]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const newReturnStock = useCallback(() => {
        const newStock: ReturnToStockDto = {
            id: 0,
            supplierId: 0,
            supplierName: "",
            whItemId: item.whId,
            reason: "",
            quantity: 0,
            date: new Date(),
        };
        setReturnStock(newStock);
    }, [item.id]);

    const handleChange = useCallback((field: string, value: any) => {
        setReturnStock((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                supplierId: 0,
                supplierName: "",
                whItemId: item.whId,
                reason: "",
                quantity: 0,
                date: new Date(),
            },
            [field]: value,
        }));
    }, [item.id]);

    const handleNumberChange = useCallback((field: string, value: string) => {
        setReturnStock((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                supplierId: 0,
                supplierName: "",
                whItemId: item.whId,
                reason: "",
                quantity: 0,
                date: new Date(),
            },
            [field]: isNaN(Number(value)) ? 0 : Number(value),
        }));
    }, [item.id]);

    const validateForm = useCallback(() => {
        const isFormValid = (
            returnStock?.quantity !== 0 &&
            returnStock?.supplierId !== 0 &&
            returnStock?.reason !== ""
        );
        setIsValid(isFormValid);
    }, [returnStock]);

    const saveStockInput = useCallback(async () => {
        if (returnStock) {
            setLoading(true)
            await returnToSupplier(returnStock);
            newReturnStock();
            navigation.navigate('StockMonitor')
            setLoading(false)
        }
    }, [returnStock, newReturnStock]);

    const handleKeyPress = useCallback((key: string) => {
        if (editingField && returnStock) {
            if (item.sellByUnit) {
                const currentValue = returnStock[editingField]?.toString() || '';
                const newValue = currentValue + key;
                if (Number(newValue) <= item.whQty) {
                    handleNumberChange(editingField, newValue);
                    setMessage(null)
                }
                else {
                    setMessage(`Quantity exceeds available warehouse stock. Available stock: ${Math.round(item.whQty)}`);
                    return;
                }
            } else {
                let current = (Number(returnStock?.[editingField] || 0).toFixed(2).replace('.', ''));
                current += key;
                const formatted = (parseInt(current) / 100).toFixed(2);
                if (Number(formatted) <= item.whQty) {
                    handleNumberChange(editingField, formatted);
                    setMessage(null)
                }
                else {
                    setMessage(`Quantity exceeds available warehouse stock. Available stock: ${Number(item.whQty).toFixed(2)}`);
                    return;
                }
            }
        }
    }, [editingField, returnStock, item.sellByUnit, handleNumberChange, message]);

    const handleBackspace = useCallback(() => {
        setMessage(null)

        if (editingField && returnStock) {
            if (item.sellByUnit) {
                const currentValue = returnStock[editingField]?.toString() || '';
                const newValue = currentValue.slice(0, -1);
                handleNumberChange(editingField, newValue);
            } else {
                let current = (Number(returnStock?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        }
    }, [editingField, returnStock, item.sellByUnit, handleNumberChange]);


    const handleStockInput = (item: { id: number; name: string }) => {
        handleChange('supplierId', item.id);
        handleChange('supplierName', item.name);
        setOpenSuppliers(false);
    };

    const renderInputMode = useMemo(() => (
        <View style={{ flex: 1 }}>
            <TitleHeaderComponent onPress={() => setInputMode(false)} isParent={false} title='please enter quantity' userName=''
            ></TitleHeaderComponent>
            <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
            <View className="items-center mt-4">
                <View className="flex flex-column items-center">
                    <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'qty']}</Text>

                    <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                        <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                            {editingField && item.sellByUnit
                                ? String(returnStock?.[editingField] || 0)
                                : editingField
                                    ? Number(returnStock?.[editingField] || 0).toFixed(2)
                                    : '0'}
                        </Text>
                    </View>
                    {message !== null && (
                        <Text className="text-[10px] font-bold text-red-500 mt-2">{message}</Text>)
                    }
                </View>
            </View>
            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                {editingField && (
                    <TouchableOpacity disabled={!returnStock?.[editingField]} onPress={() => setInputMode(false)} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!returnStock?.[editingField] ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}>
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`text-lg text-center font-bold text-white ${!returnStock?.[editingField] ? 'text-[#fe6500]' : 'text-white'}`}>
                                Done
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ), [editingField, fieldLabels, handleBackspace, handleKeyPress, item.sellByUnit, returnStock]);

    const renderNormalMode = useMemo(() => (
        <View className="flex flex-1">
            <TitleHeaderComponent isParent={false} userName={user.name || ""} title={"Return to supplier"} onPress={() => navigation.goBack()}></TitleHeaderComponent>

            <View className="px-4 w-full">
                <View className="w-full flex items-center">
                    <ExpandableText text={item.name}></ExpandableText>
                    <View className="w-full flex items-center mt-2 mb-2">
                        {item.imagePath ? (
                            <FastImage source={{
                                uri: getItemImage(item.imagePath), priority: FastImage.priority.high,
                            }} className="w-24 h-24 rounded-lg" />) : (
                            <View className="w-full h-24 bg-gray-500 rounded-lg justify-center items-center">
                                <Camera color={"white"} height={32} width={32} />
                                <Text className='text-white text-xs mt-1'>No Image</Text>
                            </View>
                        )}
                    </View>
                </View>

                {returnStock && (
                    <View className='w-full mt-4'>
                        <View className='flex flex-row w-full gap-2'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Quantity</Text>
                                <TouchableOpacity
                                    className="border-b border-gray-400 py-2"
                                    onPress={() => {
                                        setEditingField('quantity');
                                        setInputMode(true);
                                    }}
                                >
                                    <Text className="text-black">{item.sellByUnit ? returnStock.quantity : returnStock.quantity.toFixed(2)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Supplier</Text>
                                <TouchableOpacity
                                    className="border-b border-gray-400 py-2"
                                    onPress={() => setOpenSuppliers(true)}

                                >
                                    <Text className={`${returnStock.supplierId ? 'text-black' : 'text-gray-500'} ml-1`}>{returnStock.supplierName || 'Select Supplier'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className='flex flex-row w-full gap-2 mt-4'>
                            <View className='w-full'>
                                <Text className="text-gray-700 text-sm font-bold">Return Reason</Text>
                                <TextInput
                                    value={returnStock.reason || ''}
                                    editable={true}
                                    className="border-b border-gray-400 py-2 text-black"
                                    placeholder="Reason"
                                    onChangeText={(text) => handleChange('reason', text)}
                                    placeholderTextColor="#8a8a8a"
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
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`font-bold text-lg ${!isValid ? 'text-[#fe6500]' : 'text-white'}`}>SAVE</Text>
                        </View>
                        {loading && (
                            <ActivityIndicator size={'small'} color={`${!isValid ? '#fe6500' : 'white'}`}></ActivityIndicator>
                        )}
                    </TouchableOpacity>
                    <SelectModal
                        visible={openSuppliers}
                        onClose={() => setOpenSuppliers(false)}
                        onSelect={handleStockInput}
                        items={suppliers}
                        keyExtractor={(item) => item.id.toString()}
                        labelExtractor={(item) => item.name}
                        title='SELECT SUPPLIER'
                    />
                </View>
            )}
        </View>
    ), [handleChange, item, keyboardVisible, navigation, openDate, saveStockInput, returnStock, user?.name, isValid, suppliers, openSuppliers, loading]);

    return (
        <View className="flex flex-1">
            {isInputMode && editingField ? renderInputMode : renderNormalMode}
        </View>
    );
});

export default ReturnStockScreen;