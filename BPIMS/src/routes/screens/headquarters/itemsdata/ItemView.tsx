import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import ItemImage from '../../../../components/ItemImage';
import NumericKeypad from '../../../../components/NumericKeypad';
import SelectModal from '../../../../components/SelectModal';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { ItemsHQParamList } from '../../../navigation/navigation';
import { deleteItem, getCategoriesHQ, getItemImage, saveItem } from '../../../services/itemsHQRepo';
import { ItemHQDto } from '../../../types/itemType';
import { CategoryDto } from '../../../types/salesType';
import { formatPrice } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<ItemsHQParamList, 'ItemView'>;

const ItemViewScreen = ({ route }: Props) => {
    const item: ItemHQDto = route.params.item;
    const [fileUrl, setFileUrl] = useState<string | null>(item.imagePath);
    const navigation = useNavigation<NativeStackNavigationProp<ItemsHQParamList>>();
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ItemHQDto>(item);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [openCategories, setOpenCategories] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastSavedValue, setLastSavedValue] = useState<number | string | Date>(0);
    const MAX_FILE_SIZE = 2 * 1024 * 1024;

    const scrollViewRef = useRef<ScrollView>(null);

    const fieldLabels: { [key: string]: string } = {
        name: 'Product Name',
        price: 'Selling Price',
        cost: 'Cost Price',
        category: 'Category',
        whCriticalValue: 'Warehouse Critical Value',
        storeCriticalValue: 'Store Critical Value',
        unitOfMeasure: 'Unit of Measure',
        sellByUnit: 'Sell By Unit'
    };

    const fetchItem = useCallback(async () => {
        try {
            setLoading(true);
            if (item.id !== 0) {
                setEditingItem(item);
                if (item.imagePath) {
                    setFileUrl(item.imagePath)
                }
            } else {
                const newItem: ItemHQDto = {
                    id: 0,
                    name: "",
                    categoryId: 0,
                    price: 0.00,
                    cost: 0.00,
                    isManaged: false,
                    imagePath: null,
                    sellByUnit: false,
                    whCriticalValue: 0.00,
                    categoryName: "",
                    unitOfMeasure: "",
                    storeCriticalValue: 0.00,
                    imageUrl: null
                };
                setEditingItem(newItem);
            }
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, [item]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    useEffect(() => {
        validateForm();
    }, [editingItem]);

    useEffect(() => {
        const fetchCategories = async () => {
            const result = await getCategoriesHQ();
            let categoryData = [...result.data];

            const noCategoryIndex = categoryData.findIndex(c => c.id === 0);
            if (noCategoryIndex !== -1) {
                categoryData[noCategoryIndex] = {
                    ...categoryData[noCategoryIndex],
                    name: "(No Category)"
                };
            } else {
                categoryData.unshift({
                    id: 0,
                    name: "(No Category)"
                });
            }

            setCategories(categoryData);
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleChange = useCallback((key: keyof ItemHQDto, value: any) => {
        setEditingItem(prevItem => ({ ...prevItem, [key]: value }));
    }, []);

    const handleNumberChange = useCallback((field: string, value: string) => {
        setEditingItem(prevItem => ({ ...prevItem, [field]: isNaN(Number(value)) ? 0 : Number(value) }));
    }, []);

    const validateForm = useCallback(() => {
        const isFormValid = (
            editingItem?.name !== "" &&
            editingItem?.price !== 0 &&
            editingItem?.cost !== 0 &&
            editingItem.storeCriticalValue !== 0 &&
            editingItem.whCriticalValue !== 0 &&
            editingItem.unitOfMeasure !== null &&
            editingItem.unitOfMeasure !== ""
        );
        setIsValid(isFormValid);
    }, [editingItem]);

    const handleImageSelect = useCallback(() => {
        const options: CameraOptions & ImageLibraryOptions = {
            mediaType: 'photo' as MediaType
        };

        const handleResponse = async (response: any) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                console.error('ImagePicker Error:', response.errorMessage);
                Alert.alert('An error occurred while selecting an image.');
            } else if (response.assets && response.assets.length > 0) {
                const fileUri = response.assets[0].uri;
                setFileUrl(fileUri);
            } else {
                Alert.alert('No image selected');
            }
        };

        Alert.alert(
            'Select Image',
            'Choose an option:',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Photo', onPress: () => launchCamera(options, handleResponse) },
                { text: 'Choose from Library', onPress: () => launchImageLibrary(options, handleResponse) },
            ],
            { cancelable: true }
        );
    }, []);

    const handleSave = useCallback(async () => {
        try {
            Keyboard.dismiss();
            setLoading(true);

            const formData = new FormData();
            Object.entries(editingItem).forEach(([key, value]) => formData.append(key, String(value)));
            if (fileUrl) {
                const today = new Date();
                const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;
                const firstName = editingItem.name?.split(' ')[0] || 'Unknown';
                formData.append('file', {
                    uri: fileUrl,
                    name: `${firstName}${formattedDate}.jpg`,
                    type: 'image/jpeg',
                } as any);
            }
            const result = await saveItem(formData);

            navigation.navigate('Items')
        }
        finally {
            setLoading(false);
        }
    }, [editingItem, fileUrl]);

    const removeItem = useCallback(
        async (id: number) => {
            Alert.alert(
                'Confirm Deletion',
                'Are you sure you want to delete this item?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes',
                        onPress: async () => {
                            setLoading(true);
                            const response = await deleteItem(id);
                            if (response && response.isSuccess) {
                                navigation.navigate('Items');
                            }
                        }
                    }
                ]
            );
        },
        [navigation]
    );

    const handleSwitchChange = useCallback((key: keyof ItemHQDto, value: any) => {
        setEditingItem((prevItem) => ({
            ...prevItem ?? {
                id: 0,
                name: "",
                categoryId: 0,
                price: 0,
                cost: 0,
                isManaged: false,
                imagePath: null,
                sellByUnit: false,
                whCriticalValue: 0,
                categoryName: "",
                unitOfMeasure: "",
                storeCriticalValue: 0
            },
            [key]: value,
            storeCriticalValue: 0,
            whCriticalValue: 0
        }));
    }, []);

    const handleKeyPress = useCallback((key: string) => {
        if (editingField && editingItem) {
            if (editingField == 'price' || editingField == 'cost') {
                let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                current += key;
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
            else {
                if (editingItem.sellByUnit) {
                    const currentValue = (Number(editingItem?.[editingField] || 0).toFixed(0)).toString() || '';
                    const newValue = currentValue + key;
                    handleNumberChange(editingField, newValue);
                }
                else {
                    let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                    current += key;
                    const formatted = (parseInt(current) / 100).toFixed(2);
                    handleNumberChange(editingField, formatted);
                }
            }
        };
    }, [editingField, editingItem, handleNumberChange]);

    const handleBackspace = useCallback(() => {
        if (editingField && editingItem) {
            if (editingField == 'price' || editingField == 'cost') {
                let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
            else {
                if (editingItem.sellByUnit) {
                    const currentValue = editingItem[editingField]?.toString() || '';
                    const newValue = currentValue.slice(0, -1);
                    handleNumberChange(editingField, newValue);
                }
                else {
                    let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                    current = current.slice(0, -1) || '0';
                    const formatted = (parseInt(current) / 100).toFixed(2);
                    handleNumberChange(editingField, formatted);
                }
            }
        };
    }, [editingField, editingItem, handleNumberChange]);

    const handleBackKeypad = (field: string | null) => {
        if (editingField && editingItem && field) {
            setEditingItem((item) => ({
                ...item ?? {
                    id: 0,
                    name: "",
                    categoryId: 0,
                    categoryName: "",
                    price: 0,
                    cost: 0,
                    isManaged: false,
                    imagePath: null,
                    imageUrl: null,
                    sellByUnit: false,
                    whCriticalValue: 0,
                    storeCriticalValue: 0,
                    unitOfMeasure: "",
                },
                [field]: lastSavedValue,
            }));
        }
        setInputMode(false);
        setEditingField(null);
    };

    const handleSelectCategory = (item: { id: number; name: string }) => {
        handleChange('categoryId', item.id);
        handleChange('categoryName', item.name);
        setOpenCategories(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: keyboardVisible ? 50 : 0 }}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                <View className="flex flex-1">
                    {isInputMode && editingField ? (
                        <View style={{ flex: 1 }}>
                            <TitleHeaderComponent isParent={false}
                                userName={""}
                                title="Please Enter Quantity" onPress={() => handleBackKeypad(editingField)}
                            ></TitleHeaderComponent>
                            <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
                            <View className="items-center mt-4">
                                <View className="flex flex-column items-center">
                                    <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'qty']}
                                    </Text>

                                    <View className="flex flex-row items-center mt-6 border-b-2 border-[#fe6500] px-4 justify-center">
                                        <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                            {fieldLabels[editingField] == 'Cost Price' || fieldLabels[editingField] == 'Selling Price'
                                                ?
                                                `₱ ${Number(editingItem?.[editingField] || 0).toFixed(2)}`
                                                :
                                                (editingItem.sellByUnit)
                                                    ? `${Number(editingItem?.[editingField] || 0).toFixed(0)}`
                                                    : `${Number(editingItem?.[editingField] || 0).toFixed(2)}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                                <TouchableOpacity disabled={!editingItem?.[editingField]} onPress={() => setInputMode(false)} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!editingItem?.[editingField] ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}>
                                    <View className="flex-1 flex flex-row items-center justify-center">
                                        <Text className={`text-lg text-center font-bold text-white ${!editingItem?.[editingField] ? 'text-[#fe6500]' : 'text-white'}`}>
                                            Done
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View className="flex flex-1">
                            <TitleHeaderComponent isParent={false}
                                userName=""
                                showTrash={item && item.id !== 0}
                                onTrashPress={() => {
                                    if (item && item.id !== 0) {
                                        removeItem(item.id);
                                    }
                                }}
                                title="Items Data" onPress={() => navigation.goBack()}
                            ></TitleHeaderComponent>

                            <View className="px-4 w-full">
                                <View className="w-full flex items-center">
                                    <Text className="text-black text-sm">{editingItem.name.toUpperCase()}</Text>
                                    <TouchableOpacity className='w-full mt-2 items-center' onPress={handleImageSelect}>
                                        <ItemImage imagePath={fileUrl} />

                                    </TouchableOpacity>

                                </View>

                                {editingItem && (
                                    <View className='w-full mt-4'>
                                        <View className='flex flex-row w-full gap-2'>
                                            <View className='w-full'>
                                                <Text className="text-gray-700 text-sm font-bold">Name</Text>
                                                <TextInput
                                                    value={editingItem.name || ''}
                                                    editable={true}
                                                    className="border-b border-gray-400 text-black"
                                                    placeholder="Item Name"
                                                    onChangeText={(text) => handleChange('name', text)}
                                                    placeholderTextColor="gray"
                                                    selectionColor="#fe6500"
                                                />
                                            </View>
                                        </View>

                                        <View className='flex flex-row w-full gap-2 mt-4'>
                                            <View className='w-1/2'>
                                                <Text className="text-gray-700 text-sm font-bold">Selling Price</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('price');
                                                        setInputMode(true);
                                                        setLastSavedValue(Number(editingItem.price));
                                                    }}
                                                >
                                                    <Text className="text-black">₱ {formatPrice(editingItem.price || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View className='w-1/2'>
                                                <Text className="text-gray-700 text-sm font-bold">Cost Price</Text>

                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('cost');
                                                        setInputMode(true);
                                                        setLastSavedValue(Number(editingItem.cost));
                                                    }}
                                                >
                                                    <Text className="text-black">₱ {formatPrice(editingItem.cost || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View className='flex flex-row w-full gap-2 mt-4'>
                                            <View className='w-full'>
                                                <Text className="text-gray-700 text-sm font-bold">Category</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => setOpenCategories(true)}
                                                >
                                                    <Text className={`text-black ml-1`}>
                                                        {editingItem.categoryId === 0 || !categories.some(cat => cat.id === editingItem.categoryId)
                                                            ? "(No Category)"
                                                            : editingItem.categoryName}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>


                                        </View>
                                        <View className='flex flex-row w-full gap-2'>

                                            <View className="flex flex-row items-center">
                                                <Text className="text-gray-600 mr-2">Sell By Unit</Text>
                                                <Switch
                                                    value={editingItem?.sellByUnit || false}
                                                    onValueChange={(value) => handleSwitchChange('sellByUnit', value)}
                                                    thumbColor={editingItem?.sellByUnit ? "#fe6500" : "#fe6500"}
                                                    trackColor={{ false: "#ccc", true: "#FF9E66" }}
                                                />
                                            </View>
                                        </View>
                                        <View className='flex flex-row w-full gap-2'>
                                            <View className='w-1/2'>
                                                <Text className="text-red-500 text-sm font-bold">Store Critical Value</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('storeCriticalValue');
                                                        setInputMode(true);
                                                        setLastSavedValue(Number(editingItem.storeCriticalValue));
                                                    }}
                                                >
                                                    <Text className="text-black">{editingItem.sellByUnit ? Math.round(editingItem.storeCriticalValue) || 0 : formatPrice(editingItem.storeCriticalValue || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View className='w-1/2'>
                                                <Text className="text-red-500 text-sm font-bold">Warehouse Critical Value</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('whCriticalValue');
                                                        setInputMode(true);
                                                        setLastSavedValue(Number(editingItem.whCriticalValue));
                                                    }}
                                                >
                                                    <Text className="text-black">{editingItem.sellByUnit ? Math.round(editingItem.whCriticalValue) || 0 : formatPrice(editingItem.whCriticalValue || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View className='flex flex-row w-full gap-2 mt-4'>
                                            <View className='w-full'>
                                                <Text className="text-gray-700 text-sm font-bold">Unit of Measure</Text>
                                                <TextInput
                                                    value={editingItem.unitOfMeasure || ''}
                                                    editable={true}
                                                    className="border-b border-gray-400 text-black"
                                                    placeholder="eg. pcs, kg, ml, l"
                                                    onChangeText={(text) => handleChange('unitOfMeasure', text)}
                                                    placeholderTextColor="gray"
                                                    onFocus={() => {
                                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                                    }}
                                                    selectionColor="#fe6500"
                                                    autoCapitalize='none'
                                                />
                                            </View>

                                        </View>
                                    </View>
                                )}

                            </View>
                            {!keyboardVisible && (
                                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                                    <TouchableOpacity
                                        onPress={() => handleSave()}
                                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                                        disabled={!isValid}
                                    >
                                        <View className="flex-1 flex flex-row items-center justify-center">
                                            <Text className={`font-bold text-lg ${!isValid ? 'text-[#fe6500]' : 'text-white'} text-center`}>SAVE</Text>

                                        </View>
                                        {loading && (
                                            <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
                                        )}
                                    </TouchableOpacity>

                                    <SelectModal
                                        visible={openCategories}
                                        onClose={() => setOpenCategories(false)}
                                        onSelect={handleSelectCategory}
                                        items={categories}
                                        keyExtractor={(item) => item.id.toString()}
                                        labelExtractor={(item) => item.name}
                                        title='SELECT CATEGORIES'
                                    />
                                </View>
                            )
                            }
                        </View >
                    )
                    }
                </View >
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
export default ItemViewScreen;