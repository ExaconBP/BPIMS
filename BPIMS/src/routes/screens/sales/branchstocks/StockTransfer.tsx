import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import FastImage from 'react-native-fast-image';
import { Camera } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import NumericKeypad from '../../../../components/NumericKeypad';
import SelectModal from '../../../../components/SelectModal';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { BranchStockParamList } from '../../../navigation/navigation';
import { saveTransferStock } from '../../../services/stockRepo';
import { getBranches } from '../../../services/userRepo';
import { BranchStockDto, StockTransferDto } from '../../../types/stockType';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { getItemImage } from '../../../services/itemsHQRepo';

type Props = NativeStackScreenProps<BranchStockParamList, 'StockTransfer'>;

export default function StockTransferScreen({ route }: Props) {
    const item: BranchStockDto = route.params.item;
    const user: UserDetails = route.params.user;
    const [loading, setLoading] = useState<boolean>(false);
    const [stockTransfer, setStockTransfer] = useState<StockTransferDto>();
    const navigation = useNavigation<NativeStackNavigationProp<BranchStockParamList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [lastSavedValue, setLastSavedValue] = useState<number | string | Date>(0);
    const [branches, setBranches] = useState<ObjectDto[]>([]);
    const [openBranches, setOpenBranches] = useState<boolean>(false);

    const fieldLabels: { [key: string]: string } = {
        quantity: 'Quantity',
        branchFrom: 'From',
        branchTo: 'To',
        date: 'Date'
    };

    useEffect(() => {
        newStockInput();
    }, []);

    useEffect(() => {
        validateForm();
    }, [stockTransfer]);

    useEffect(() => {
        getStockInputHistory();
    }, []);


    async function getStockInputHistory() {
        try {
            setLoading(true);
            FastImage.clearMemoryCache();
            FastImage.clearDiskCache();
            const responseBranch = await getBranches();
            const filteredBranches = responseBranch.filter(x => x.id != user.branchId);
            setBranches(filteredBranches);

            setLoading(false)
        }
        finally {
            setLoading(false)
        }
    }

    const handleStockTransfer = (item: { id: number; name: string }) => {
        handleNumberChange('branchToId', item.id.toString());
        handleChange('branchTo', item.name);
        closeModal();
    };

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
        const newStock: StockTransferDto = {
            id: 0,
            quantity: 0,
            branchFrom: user.branchName || "",
            branchTo: "",
            branchFromId: item.id || 0,
            branchToId: 0,
            date: new Date,
        };
        setStockTransfer(newStock);
    }

    const handleChange = (field: string, value: string) => {
        setStockTransfer((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                quantity: 0,
                branchFrom: user.branchName || "",
                branchTo: "",
                branchFromId: user.branchId || 0,
                branchToId: 0,
                date: new Date,
            },
            [field]: value,
        }));
    };

    const handleNumberChange = (field: string, value: string) => {
        setStockTransfer((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                quantity: 0,
                branchFrom: user.branchName || "",
                branchTo: "",
                branchFromId: user.branchId || 0,
                branchToId: 0,
                date: new Date,
            },
            [field]: isNaN(Number(value)) ? 0 : Number(value),
        }));
    };

    function validateForm() {
        const isFormValid = (
            stockTransfer?.quantity !== 0 &&
            stockTransfer?.branchToId !== 0
        );
        setIsValid(isFormValid);
    }

    async function saveStockInput() {
        try {
            if (stockTransfer) {
                setLoading(true)
                await saveTransferStock(stockTransfer)
                newStockInput();
                await getStockInputHistory();
                navigation.push('BranchStock')
                setLoading(false)
            }
        }
        finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (key: string) => {
        if (editingField && stockTransfer) {
            if (item.sellByUnit) {
                const currentValue = stockTransfer[editingField]?.toString() || '';
                const newValue = currentValue + key;
                if (Number(newValue) <= item.quantity) {
                    handleNumberChange(editingField, newValue);
                    setMessage(null)
                }
                else {
                    setMessage(`Quantity exceeds available stock. Available stock: ${Math.round(item.quantity)}`);
                    return;
                }
            } else {
                let current = (Number(stockTransfer?.[editingField] || 0).toFixed(2).replace('.', ''));
                current += key;
                const formatted = (parseInt(current) / 100).toFixed(2);
                if (Number(formatted) <= item.quantity) {
                    handleNumberChange(editingField, formatted);
                    setMessage(null)
                }
                else {
                    setMessage(`Quantity exceeds available stock. Available stock: ${Number(item.quantity).toFixed(2)}`);
                    return;
                }
            }
        };
    }

    const handleBackspace = () => {
        setMessage(null)
        if (editingField && stockTransfer) {
            const currentValue = stockTransfer[editingField]?.toString() || '';
            const newValue = currentValue.slice(0, -1);
            handleNumberChange(editingField, newValue);
        }

        if (editingField && stockTransfer) {
            if (item.sellByUnit) {
                const currentValue = stockTransfer[editingField]?.toString() || '';
                const newValue = currentValue.slice(0, -1);
                handleNumberChange(editingField, newValue);
            }
            else {
                let current = (Number(stockTransfer?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        };
    };

    const handleBackKeypad = (field: string) => {
        if (editingField && stockTransfer) {
            setStockTransfer((prevStock) => ({
                ...prevStock ?? {
                    id: 0,
                    quantity: 0,
                    branchFrom: user.branchName || "",
                    branchTo: "",
                    branchFromId: user.branchId || 0,
                    branchToId: 0,
                    date: new Date,
                },
                [field]: lastSavedValue,
            }));
        }
        setInputMode(false);
        setEditingField(null);
    };

    const closeModal = useCallback(() => setOpenBranches(false), []);

    return (
        <View className="flex flex-1">
            {isInputMode && editingField ? (
                <View style={{ flex: 1 }}>
                    <TitleHeaderComponent title={item.name} userName={user?.name || ""} onPress={() => handleBackKeypad(editingField)}
                        isParent={false}></TitleHeaderComponent>
                    <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                    <View className="items-center mt-4">
                        <View className="flex flex-column items-center">
                            <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'quantity']}
                            </Text>

                            <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                    {item.sellByUnit
                                        ? String(stockTransfer?.[editingField] || 0)
                                        : Number(stockTransfer?.[editingField] || 0).toFixed(2)}
                                </Text>
                            </View>
                            {message !== null && (
                                <Text className="text-[10px] font-bold text-red-500">{message}</Text>)
                            }
                        </View>
                    </View>
                    <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                        <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                        <TouchableOpacity disabled={!stockTransfer?.[editingField]} onPress={() => setInputMode(false)}
                            className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!stockTransfer?.[editingField] ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}>
                            < View className="flex-1 flex flex-row items-center justify-center">
                                <Text className={`text-lg text-center font-bold ${!stockTransfer?.[editingField] ? 'text-[#fe6500]' : 'text-white'}`}>
                                    Done
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View >
            ) : (
                <View className="flex flex-1">
                    <TitleHeaderComponent title="stock transfer" userName={user?.name || ""} onPress={() => navigation.push('BranchStock')}
                        isParent={false}></TitleHeaderComponent>
                    <View className="w-full h-[2px] bg-gray-500 mb-2"></View>

                    <View className="px-4 w-full mt-2">
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

                        {stockTransfer && (
                            <View className='w-full mt-4'>
                                <View className='flex flex-row w-full gap-2'>
                                    <View className='w-1/2'>
                                        <Text className="text-gray-700 text-sm font-bold">Quantity</Text>
                                        <TouchableOpacity
                                            className="border-b border-gray-400 py-2"
                                            onPress={() => {
                                                setEditingField('quantity');
                                                setInputMode(true);
                                                setMessage(null);
                                                setLastSavedValue(Number(stockTransfer.quantity));
                                            }}
                                        >
                                            <Text className="text-black">{item.sellByUnit ? stockTransfer.quantity : stockTransfer.quantity.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className='w-1/2'>
                                        <Text className="text-gray-700 text-sm font-bold">To</Text>
                                        <TouchableOpacity
                                            className="border-b border-gray-400 py-2"
                                            onPress={() => setOpenBranches(true)}
                                        >
                                            <Text className={`text-black ml-1`}>
                                                {stockTransfer.branchToId === 0 || !branches.some(cat => cat.id === stockTransfer.branchToId)
                                                    ? "(No Branch)"
                                                    : stockTransfer.branchTo}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className='flex flex-row w-full gap-2 mt-4'>
                                    <View className='w-full'>
                                        <Text className="text-gray-700 text-sm font-bold">Date</Text>
                                        <TouchableOpacity onPress={() => setOpenDate(true)} className='border-b border-gray-400 py-2 text-black'>
                                            <Text>{stockTransfer?.date.toDateString()}</Text>
                                        </TouchableOpacity>
                                        <DatePicker
                                            modal
                                            open={openDate}
                                            date={stockTransfer?.date}
                                            mode="date"
                                            buttonColor='#fe6500'
                                            theme='light'
                                            dividerColor='#fe6500'
                                            onConfirm={(date) => {
                                                setOpenDate(false)
                                                setStockTransfer(stock => ({
                                                    ...stock ?? {
                                                        id: 0,
                                                        quantity: 0,
                                                        branchFrom: user.branchName || "",
                                                        branchTo: "",
                                                        branchFromId: user.branchId || 0,
                                                        branchToId: 0,
                                                        date: new Date,
                                                    },
                                                    deliveryDate: date,
                                                }));
                                            }}
                                            onCancel={() => {
                                                setOpenDate(false)
                                            }}
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
                            <SelectModal
                                visible={openBranches}
                                onClose={() => setOpenBranches(false)}
                                onSelect={handleStockTransfer}
                                items={branches}
                                keyExtractor={(item) => item.id.toString()}
                                labelExtractor={(item) => item.name}
                                title='SELECT BRANCHES'
                            />
                        </View>
                    )
                    }
                </View >
            )
            }
        </View >
    );
}