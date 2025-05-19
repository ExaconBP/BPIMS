import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import ExpandableText from '../../../../components/ExpandableText';
import ItemImage from '../../../../components/ItemImage';
import NumericKeypad from '../../../../components/NumericKeypad';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { BranchStockParamList } from '../../../navigation/navigation';
import { createStockInput } from '../../../services/stockRepo';
import { BranchStockDto, StockInputDto } from '../../../types/stockType';
import { UserDetails } from '../../../types/userType';

type Props = NativeStackScreenProps<BranchStockParamList, 'StockInput'>;

export default function StockInputScreen({ route }: Props) {
    const item: BranchStockDto = route.params.item;
    const user: UserDetails = route.params.user;
    const [loading, setLoading] = useState<boolean>(false);
    const [stockInput, setStockInput] = useState<StockInputDto>();
    const navigation = useNavigation<NativeStackNavigationProp<BranchStockParamList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [lastSavedValue, setLastSavedValue] = useState<number | string | Date>(0);

    const fieldLabels: { [key: string]: string } = {
        qty: 'Quantity',
        actualTotalQty: 'Actual Total Quantity',
        expectedTotalQty: 'Expected Total Quantity',
        deliveredBy: 'Delivered By',
        deliveryDate: 'Delivery Date',
    };

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

    async function newStockInput() {
        const newStock: StockInputDto = {
            id: 0,
            qty: 0,
            actualTotalQty: 0,
            expectedTotalQty: 0,
            deliveredBy: "",
            deliveryDate: new Date,
            branchItemId: item.id,
        };
        setStockInput(newStock);
    }

    const handleChange = (field: string, value: string) => {
        setStockInput((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                qty: 0,
                actualTotalQty: 0,
                expectedTotalQty: 0,
                deliveredBy: "",
                deliveryDate: new Date,
                branchItemId: item.id
            },
            [field]: value,
        }));
    };

    const handleNumberChange = (field: string, value: string) => {
        setStockInput((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                qty: 0,
                actualTotalQty: 0,
                expectedTotalQty: 0,
                deliveredBy: "",
                deliveryDate: new Date,
                branchItemId: item.id
            },
            [field]: isNaN(Number(value)) ? 0 : Number(value),
        }));
    };

    function validateForm() {
        const isFormValid = (
            stockInput?.qty !== 0 &&
            stockInput?.actualTotalQty !== 0 &&
            stockInput?.expectedTotalQty !== 0 &&
            stockInput?.deliveredBy?.trim() !== "" &&
            stockInput?.deliveryDate instanceof Date
        );
        setIsValid(isFormValid);
    }

    async function saveStockInput() {
        try {
            if (stockInput) {
                setLoading(true)
                await createStockInput(stockInput)
                newStockInput();
                navigation.push('BranchStock');
                setLoading(false)
            }
        }
        finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (key: string) => {
        if (editingField && stockInput) {
            if (item.sellByUnit) {
                const currentValue = stockInput[editingField]?.toString() || '';
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
                let current = (Number(stockInput?.[editingField] || 0).toFixed(2).replace('.', ''));
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
        };
    }

    const handleBackspace = () => {
        setMessage(null)
        if (editingField && stockInput) {
            const currentValue = stockInput[editingField]?.toString() || '';
            const newValue = currentValue.slice(0, -1);
            handleNumberChange(editingField, newValue);
        }

        if (editingField && stockInput) {
            if (item.sellByUnit) {
                const currentValue = stockInput[editingField]?.toString() || '';
                const newValue = currentValue.slice(0, -1);
                handleNumberChange(editingField, newValue);
            }
            else {
                let current = (Number(stockInput?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        };
    };

    const handleBackKeypad = (field: string) => {
        if (editingField && stockInput) {
            setStockInput((prevStock) => ({
                ...prevStock ?? {
                    id: 0,
                    qty: 0,
                    actualTotalQty: 0,
                    expectedTotalQty: 0,
                    deliveredBy: "",
                    deliveryDate: new Date,
                    branchItemId: item.id
                },
                [field]: lastSavedValue,
            }));
        }
        setInputMode(false);
        setEditingField(null);
    };


    return (
        <View className="flex flex-1">
            {isInputMode && editingField ? (
                <View style={{ flex: 1 }}>
                    <TitleHeaderComponent title={item.name} userName={user?.name || ""} onPress={() => handleBackKeypad(editingField)}
                        isParent={false}></TitleHeaderComponent>

                    <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                    <View className="items-center mt-4">
                        <View className="flex flex-column items-center">
                            <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'qty']}
                            </Text>

                            <View className="flex flex-row items-center mt-6   border-b-2 border-[#fe6500] px-4 justify-center">
                                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                    {item.sellByUnit
                                        ? String(stockInput?.[editingField] || 0)
                                        : Number(stockInput?.[editingField] || 0).toFixed(2)}
                                </Text>
                            </View>
                            {message !== null && (
                                <Text className="text-[10px] font-bold text-red-500">{message}</Text>)
                            }
                        </View>
                    </View>
                    <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                        <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                        <TouchableOpacity disabled={!stockInput?.[editingField]} onPress={() => setInputMode(false)}
                            className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!stockInput?.[editingField] ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}>
                            < View className="flex-1 flex flex-row items-center justify-center">
                                <Text className={`text-lg text-center font-bold ${!stockInput?.[editingField] ? 'text-[#fe6500]' : 'text-white'}`}>
                                    Done
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View >
            ) : (
                <View className="flex flex-1">
                    <TitleHeaderComponent title='Stock Inputs' userName={user?.name || ""} onPress={() => navigation.goBack()}
                        isParent={false}></TitleHeaderComponent>

                    <View className="px-4 w-full">
                        <View className="w-full flex items-center">
                            <ExpandableText text={item.name}></ExpandableText>
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
                                                setMessage(null);
                                                setLastSavedValue(Number(stockInput.qty));
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
                                            <Text className="text-black">{item.sellByUnit ? item.storeCriticalValue : Number((item.storeCriticalValue || 0)).toFixed(2)}</Text>
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
                                            onConfirm={(date) => {
                                                setOpenDate(false)
                                                setStockInput(stock => ({
                                                    ...stock ?? {
                                                        id: 0,
                                                        qty: 0,
                                                        actualTotalQty: 0,
                                                        expectedTotalQty: 0,
                                                        deliveredBy: "",
                                                        deliveryDate: new Date,
                                                        branchItemId: item.id
                                                    },
                                                    deliveryDate: date,
                                                }));
                                            }}
                                            onCancel={() => {
                                                setOpenDate(false)
                                            }}
                                        />
                                    </View>
                                    <View className='w-1/2'>
                                        <Text className="text-gray-700 text-sm font-bold">Delivered By</Text>
                                        <TextInput
                                            value={stockInput?.deliveredBy || ""}
                                            editable={true}
                                            className="border-b border-gray-400 py-2 text-black"
                                            placeholder="Enter Name"
                                            placeholderTextColor="#8a8a8a"
                                            selectionColor="#fe6500"
                                            onChangeText={(text) => handleChange("deliveredBy", text)}
                                        />
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
                                                setMessage(null);
                                                setLastSavedValue(Number(stockInput.expectedTotalQty));
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
                                                setMessage(null);
                                                setLastSavedValue(Number(stockInput.actualTotalQty));
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
                                <View className="flex-1 items-center">
                                    <Text className={`font-bold text-lg ${!isValid ? 'text-[#fe6500]' : 'text-white'}`}>SAVE</Text>
                                </View>
                                {loading && (
                                    <ActivityIndicator size={'small'} color={`${!isValid ? '#fe6500' : 'white'}`}></ActivityIndicator>
                                )}
                            </TouchableOpacity>
                        </View>
                    )
                    }
                </View >
            )
            }
        </View >
    );
}