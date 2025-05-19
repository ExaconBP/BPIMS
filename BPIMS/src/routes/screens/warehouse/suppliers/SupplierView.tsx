import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { SupplierParamList } from '../../../navigation/navigation';
import { getSupplier, getSupplierStockHistory, removeSupplier, saveSupplier } from '../../../services/whRepo';
import { SupplierDto, WHStockInputHistoryDto } from '../../../types/whType';
import { formatTransactionDateOnly } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<SupplierParamList, 'SupplierView'>;

const SupplierViewScreen = React.memo(({ route }: Props) => {
    const { id } = route.params;
    const suppliers = route.params.suppliers
    const [supplierId, setSupplierId] = useState<number>(Number(id));
    const [supplier, setSupplier] = useState<SupplierDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [stockHistory, setStockHistory] = useState<WHStockInputHistoryDto[]>([]);
    const [loaderMessage, setLoaderMessage] = useState<string>('Loading Supplier Data...');
    const navigation = useNavigation<NativeStackNavigationProp<SupplierParamList>>();
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [nameExists, setNameExists] = useState<boolean>(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const MAX_FILE_SIZE = 2 * 1024 * 1024;

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

    useEffect(() => {
        validateForm();
    }, [supplier, nameExists]);

    function validateForm() {
        const isFormValid = (
            supplier?.name !== "" &&
            !nameExists
        );
        setIsValid(isFormValid);
    }

    const fetchsupplier = useCallback(async () => {
        try {
            setLoading(true);
            if (supplierId != 0 && supplierId != null) {
                const response = await getSupplier(supplierId);
                const historyResponse = await getSupplierStockHistory(supplierId)
                if (response) {
                    setSupplier(response.data);
                    setStockHistory(historyResponse.data ?? []);
                }
            } else if (supplierId == 0) {
                const newsupplier: SupplierDto = {
                    id: 0,
                    name: '',
                    contactNumber1: "",
                    contactNumber2: null,
                    address: ""
                };
                setSupplier(newsupplier);
            }
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, [supplierId]);

    useEffect(() => {
        fetchsupplier();
    }, [fetchsupplier]);

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

    const handleNameChange = useCallback((text: string) => {
        setSupplier((prevsupplier) => ({
            ...(prevsupplier ?? {
                id: 0,
                name: '',
                contactNumber1: "",
                contactNumber2: null,
                address: ""
            }),
            name: text,
        }));
        if (supplier) {
            const exists = suppliers.some(c => c.name.toLowerCase() === text.toLowerCase() && c.id !== supplier.id);
            setNameExists(exists);
        }
        else if (!supplier) {
            const exists = suppliers.some(c => c.name.toLowerCase() === text.toLowerCase());
            setNameExists(exists);
        }
    }, [supplier]);

    const handleAddressChange = useCallback((text: string) => {
        setSupplier((prevsupplier) => ({
            ...(prevsupplier ?? {
                id: 0,
                name: '',
                contactNumber1: "",
                contactNumber2: null,
                address: ""
            }),
            address: text,
        }));
    }, [supplier]);

    const handleContactNumber1Change = useCallback((text: string) => {
        setSupplier((prevsupplier) => ({
            ...(prevsupplier ?? {
                id: 0,
                name: '',
                contactNumber1: "",
                contactNumber2: null,
                address: ""
            }),
            contactNumber1: text,
        }));
    }, []);

    const handleContactNumber2Change = useCallback((text: string) => {
        setSupplier((prevsupplier) => ({
            ...(prevsupplier ?? {
                id: 0,
                name: '',
                contactNumber1: "",
                contactNumber2: null,
                address: ""
            }),
            contactNumber2: text,
        }));
    }, []);

    const handleSave = useCallback(async () => {
        try {
            setButtonLoading(true);
            Keyboard.dismiss();
            setLoaderMessage('Saving supplier...');
            if (supplier) {
                await saveSupplier(supplier);
                navigation.push('SupplierList')
            }
        }
        finally {
            setButtonLoading(false);
        }
    }, [supplier, fileUrl, fetchsupplier]);

    const removesupplier = useCallback(
        async (id: number) => {
            Alert.alert(
                'Confirm Deletion',
                'Are you sure you want to delete this supplier?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes',
                        onPress: async () => {
                            setLoaderMessage('Deleting supplier...');
                            try {
                                setLoading(true);
                                const response = await removeSupplier(id);
                                if (response && response.isSuccess) {
                                    navigation.push('SupplierList');
                                }
                            }
                            finally {
                                setLoading(false)
                            }
                        }
                    }
                ]
            );
        },
        [navigation]
    );

    if (loading) {
        return (
            <View className='flex flex-1 justify-center items-center mt-10'>
                <ActivityIndicator size="small" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">{loaderMessage}</Text>
            </View>
        );
    }

    return (
        <View className="flex flex-1">
            <TitleHeaderComponent
                isParent={false}
                title={supplier && supplier.name || ""}
                userName={""}
                onPress={() => navigation.goBack()}
                showTrash={supplier && supplier.id !== 0}
                onTrashPress={() => {
                    if (supplier && supplier.id !== 0) {
                        removesupplier(supplier.id);
                    }
                }}
            />
            <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
            <View className="px-4 w-full">
                {supplier && (
                    <>
                        <View className='w-full mb-2'>
                            <Text className="text-gray-700 text-sm font-bold">Name</Text>
                            <TextInput
                                value={supplier.name || ''}
                                editable={true}
                                className="border-b border-gray-400 py-2 text-black"
                                placeholder="Supplier Name"
                                onChangeText={handleNameChange}
                                placeholderTextColor="#8a8a8a"
                                selectionColor="#fe6500"
                            />
                            {nameExists && (
                                <Text className="text-red-500 text-xs">
                                    This name already exists. Please use a different name.
                                </Text>
                            )}
                        </View>

                        <View className='w-full'>
                            <Text className="text-gray-700 text-sm font-bold">Contact Number 1</Text>
                            <TextInput
                                value={supplier.contactNumber1 || ''}
                                editable={true}
                                className="border-b border-gray-400 py-2 mb-2 text-black"
                                placeholder="Contact Number 1"
                                onChangeText={handleContactNumber1Change}
                                placeholderTextColor="#8a8a8a"
                                selectionColor="#fe6500"
                                keyboardType='numeric'
                            />
                        </View>
                        <View className='w-full'>
                            <Text className="text-gray-700 text-sm font-bold">Contact Number 2</Text>
                            <TextInput
                                value={supplier.contactNumber2 || ''}
                                editable={true}
                                className="border-b border-gray-400 py-2 mb-2 text-black"
                                placeholder="Contact Number 2"
                                onChangeText={handleContactNumber2Change}
                                placeholderTextColor="#8a8a8a"
                                selectionColor="#fe6500"
                                keyboardType='numeric'
                            />
                        </View>
                        <View className='w-full mb-2'>
                            <Text className="text-gray-700 text-sm font-bold">Address</Text>
                            <TextInput
                                value={supplier.address || ''}
                                editable={true}
                                className="border-b border-gray-400 py-2 text-black"
                                placeholder="Address"
                                onChangeText={handleAddressChange}
                                placeholderTextColor="#8a8a8a"
                                selectionColor="#fe6500"
                            />

                        </View>


                        {stockHistory.length > 0 && (
                            <View className="flex flex-column mt-4 h-[35vh] md:h-[50vh] lg:h-[60vh] pb-2">
                                <Text className="text-gray-700 text-sm font-bold">Supply History</Text>
                                <ScrollView className="w-full mb-8 mt-1">
                                    <View className="flex flex-row justify-between border-b pb-2 mb-2 border-gray-300">
                                        <Text className="text-black text-xs font-semibold flex-1 text-left">Item</Text>
                                        <Text className="text-black text-xs font-semibold flex-1 text-center">Quantity</Text>
                                        <Text className="text-black text-xs font-semibold flex-1 text-right">Date</Text>
                                    </View>

                                    {stockHistory.map((order) => (
                                        <View key={order.id} className="flex flex-row justify-between py-1 border-b border-gray-200">
                                            <Text className="text-black text-xs flex-1 text-left">{order.name}</Text>
                                            <Text className="text-black text-xs flex-1 text-center">{order.sellByUnit ? Math.round(order.qty) : Number(order.qty).toFixed(2)}</Text>
                                            <Text className="text-black text-xs flex-1 text-right">{formatTransactionDateOnly(order.deliveryDate.toString())}</Text>
                                        </View>
                                    ))}

                                </ScrollView>
                            </View>
                        )
                        }
                    </>
                )}
            </View>
            {!keyboardVisible && (
                <View className="items-center absolute bottom-0 left-0 right-0 pb-2">
                    <TouchableOpacity
                        onPress={handleSave}
                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                        disabled={!isValid}
                    >
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`font-bold ${!isValid ? 'text-[#fe6500]' : 'text-white'} text-lg`}>SAVE</Text>

                        </View>
                        {buttonLoading && (
                            <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
});

export default SupplierViewScreen;