import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import ItemImage from '../../../../components/ItemImage';
import NumericKeypad from '../../../../components/NumericKeypad';
import SelectModal from '../../../../components/SelectModal';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { WhStockStackParamList } from '../../../navigation/navigation';
import { createWHStockInput } from '../../../services/whRepo';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { WHStockDto, WHStockInputDto } from '../../../types/whType';

type Props = NativeStackScreenProps<WhStockStackParamList, 'StockInput'>;

const StockInputScreen = memo(({ route }: Props) => {
    const item: WHStockDto = route.params.item;
    const user: UserDetails = route.params.user;
    const suppliers: ObjectDto[] = route.params.suppliers;
    const [loading, setLoading] = useState<boolean>(false);
    const [stockInput, setStockInput] = useState<WHStockInputDto>();
    const navigation = useNavigation<NativeStackNavigationProp<WhStockStackParamList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [openSuppliers, setOpenSuppliers] = useState<boolean>(false);

    const fieldLabels: { [key: string]: string } = useMemo(() => ({
        qty: 'Quantity',
        actualTotalQty: 'Actual Total Quantity',
        expectedTotalQty: 'Expected Total Quantity',
        deliveredBy: 'Delivered By',
        deliveryDate: 'Delivery Date',
    }), []);

    useEffect(() => {
        newStockInput();
    }, []);

    useEffect(() => {
        validateForm();
    }, [stockInput]);

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

    const newStockInput = useCallback(() => {
        const newStock: WHStockInputDto = {
            id: item.id,
            qty: 0,
            actualTotalQty: 0,
            expectedTotalQty: 0,
            deliveredBy: 0,
            deliveryDate: new Date(),
            deliveredByName: ""
        };
        setStockInput(newStock);
    }, [item.id]);

    const handleChange = useCallback((field: string, value: any) => {
        setStockInput((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                qty: 0,
                actualTotalQty: 0,
                expectedTotalQty: 0,
                deliveredBy: 0,
                deliveryDate: new Date(),
                branchItemId: item.id,
                deliveredByName: ""
            },
            [field]: value,
        }));
    }, [item.id]);

    const handleNumberChange = useCallback((field: string, value: string) => {
        setStockInput((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                qty: 0,
                actualTotalQty: 0,
                expectedTotalQty: 0,
                deliveredBy: 0,
                deliveryDate: new Date(),
                branchItemId: item.id,
                deliveredByName: ""
            },
            [field]: isNaN(Number(value)) ? 0 : Number(value),
        }));
    }, [item.id]);

    const validateForm = useCallback(() => {
        const isFormValid = (
            stockInput?.qty !== 0 &&
            stockInput?.actualTotalQty !== 0 &&
            stockInput?.expectedTotalQty !== 0 &&
            stockInput?.deliveryDate instanceof Date
        );
        setIsValid(isFormValid);
    }, [stockInput]);

    const saveStockInput = useCallback(async () => {
        if (stockInput) {
            setLoading(true)
            await createWHStockInput(stockInput);
            newStockInput();
            navigation.navigate('WHScreen')
            setLoading(false)
        }
    }, [stockInput, newStockInput]);

    const handleKeyPress = useCallback((key: string) => {
        if (editingField && stockInput) {
            if (item.sellByUnit) {
                const currentValue = stockInput[editingField]?.toString() || '';
                const newValue = currentValue + key;
                handleNumberChange(editingField, newValue);
            } else {
                let current = (Number(stockInput?.[editingField] || 0).toFixed(2).replace('.', ''));
                current += key;
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        }
    }, [editingField, stockInput, item.sellByUnit, handleNumberChange]);

    const handleBackspace = useCallback(() => {
        if (editingField && stockInput) {
            if (item.sellByUnit) {
                const currentValue = stockInput[editingField]?.toString() || '';
                const newValue = currentValue.slice(0, -1);
                handleNumberChange(editingField, newValue);
            } else {
                let current = (Number(stockInput?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        }
    }, [editingField, stockInput, item.sellByUnit, handleNumberChange]);

    const handleSelectSupplier = (item: { id: number; name: string }) => {
        handleChange("deliveredBy", item.id);
        handleChange("deliveredByName", item.name);
        setOpenSuppliers(false);
    };

    const renderInputMode = useMemo(() => (
        <View style={{ flex: 1 }}>
            <TitleHeaderComponent isParent={false} title={item?.name || ""} onPress={() => setInputMode(false)} userName=''></TitleHeaderComponent>

            <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
            <View className="items-center mt-4">
                <View className="flex flex-column items-center">
                    <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'qty']}</Text>
                    <View className="flex flex-row items-center mt-6   border-b-2 border-[#fe6500] px-4 justify-center">
                        <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                            {editingField && item.sellByUnit
                                ? String(stockInput?.[editingField] || 0)
                                : editingField
                                    ? Number(stockInput?.[editingField] || 0).toFixed(2)
                                    : '0'}
                        </Text>
                    </View>
                </View>
            </View>
            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                {editingField && (
                    <TouchableOpacity disabled={!stockInput?.[editingField]} onPress={() => setInputMode(false)} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!stockInput?.[editingField] ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}>
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`text-lg text-center font-bold text-white ${!stockInput?.[editingField] ? 'text-[#fe6500]' : 'text-white'}`}>
                                DONE
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ), [editingField, fieldLabels, handleBackspace, handleKeyPress, item.sellByUnit, stockInput]);

    const renderNormalMode = useMemo(() => (
        <View className="flex flex-1">
            <TitleHeaderComponent isParent={false} userName={user?.name || ""} title="Stock Input" onPress={() => navigation.goBack()}></TitleHeaderComponent>
            <View className="px-4 w-full">
                <View className="w-full flex items-center">
                    <Text className="text-black text-sm">{(item.name)}</Text>
                    <View className="w-full flex items-center mt-2 mb-2">
                        <ItemImage imagePath={item.imagePath} />
                    </View>
                </View>

                {stockInput && (
                    <View className='w-full mt-4'>
                        <View className='flex flex-row w-full gap-2'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Quantity</Text>
                                <TouchableOpacity
                                    className="border-b border-gray-400 py-2"
                                    onPress={() => {
                                        setEditingField('qty');
                                        setInputMode(true);
                                    }}
                                >
                                    <Text className="text-black">{item.sellByUnit ? stockInput.qty : stockInput.qty.toFixed(2)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='w-1/2'>
                                <Text className="text-red-500 text-sm font-bold">Critical Value</Text>
                                <View
                                    className="border-b border-gray-400 py-2"
                                >
                                    <Text className="text-black">{item.sellByUnit ? Math.round(item.whCriticalValue || 0) : (item.whCriticalValue || 0.00)}</Text>
                                </View>
                            </View>
                        </View>

                        <View className='flex flex-row w-full gap-2 mt-4'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Delivery Date</Text>
                                <TouchableOpacity onPress={() => setOpenDate(true)} className='border-b border-gray-400 py-2 text-black'>
                                    <Text>{stockInput?.deliveryDate.toDateString()}</Text>
                                </TouchableOpacity>
                                <DatePicker
                                    modal
                                    open={openDate}
                                    date={stockInput?.deliveryDate}
                                    mode="date"
                                    buttonColor='#fe6500'
                                    theme='light'
                                    dividerColor='#fe6500'
                                    onConfirm={(date) => { setOpenDate(false); handleChange('deliveryDate', date); }}
                                    onCancel={() => {
                                        setOpenDate(false)
                                    }}
                                />
                            </View>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Delivered By</Text>
                                <TouchableOpacity
                                    className="border-b border-gray-400 py-2"
                                    onPress={() => setOpenSuppliers(true)}

                                >
                                    <Text className={`${stockInput.deliveredBy ? 'text-black' : 'text-gray-500'} ml-1`}>{stockInput.deliveredByName || 'Select Supplier'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className='flex flex-row w-full gap-2 mt-4'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Expected Total Qty</Text>
                                <TouchableOpacity
                                    className="border-b border-gray-400 py-2"
                                    onPress={() => {
                                        setEditingField('expectedTotalQty');
                                        setInputMode(true);
                                    }}
                                >
                                    <Text className="text-black">{item.sellByUnit ? stockInput.expectedTotalQty : stockInput.expectedTotalQty.toFixed(2)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Actual Total Qty</Text>
                                <TouchableOpacity
                                    className="border-b border-gray-400 py-2"
                                    onPress={() => {
                                        setEditingField('actualTotalQty');
                                        setInputMode(true);
                                    }}
                                >
                                    <Text className="text-black">{item.sellByUnit ? stockInput.actualTotalQty : stockInput.actualTotalQty.toFixed(2)}</Text>
                                </TouchableOpacity>
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
                        onSelect={handleSelectSupplier}
                        items={suppliers}
                        keyExtractor={(item) => item.id.toString()}
                        labelExtractor={(item) => item.name}
                        title='SELECT SUPPLIER'
                    />
                </View>
            )}
        </View>
    ), [handleChange, item, keyboardVisible, navigation, openDate, saveStockInput, stockInput, user?.name, isValid, suppliers, openSuppliers, loading]);

    return (
        <View className="flex flex-1">
            {isInputMode && editingField ? renderInputMode : renderNormalMode}
        </View>
    );
});

export default StockInputScreen;