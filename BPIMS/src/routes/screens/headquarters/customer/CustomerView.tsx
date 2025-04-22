import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Camera } from 'react-native-feather';
import RNFS from 'react-native-fs';
import { CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import Hexagon from '../../../../components/Hexagon';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { CustomerHQStackParamList } from '../../../navigation/navigation';
import { deleteCustomer, getCurrentLoyaltyCustomer, getCustomer, getCustomerImage, saveCustomer } from '../../../services/customerRepo';
import { CurrentCustomerLoyalty, CustomerDto, OrderHistory } from '../../../types/customerType';
import { capitalizeFirstLetter, formatTransactionDate } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<CustomerHQStackParamList, 'CustomerView'>;

const CustomerViewScreen = React.memo(({ route }: Props) => {
    const { id, user } = route.params;
    const customers = route.params.customers
    const [customerId, setCustomerId] = useState<number>(Number(id));
    const [customer, setCustomer] = useState<CustomerDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loaderMessage, setLoaderMessage] = useState<string>('Loading Customer Data...');
    const navigation = useNavigation<NativeStackNavigationProp<CustomerHQStackParamList>>();
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [nameExists, setNameExists] = useState<boolean>(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [loyaltyStages, setLoyaltyStages] = useState<CurrentCustomerLoyalty[]>([]);

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
    }, [customer, nameExists]);

    function validateForm() {
        const isFormValid = (
            customer?.name !== "" &&
            !nameExists
        );
        setIsValid(isFormValid);
    }

    const fetchCustomer = useCallback(async () => {
        try {
            setLoading(true);
            FastImage.clearMemoryCache();
            FastImage.clearDiskCache();
            if (customerId != 0 && customerId != null) {
                const response = await getCustomer(customerId);
                const responeLoyalty = await getCurrentLoyaltyCustomer(customerId)
                if (response) {
                    setCustomer(response.data.customer);
                    setOrderHistory(response.data.orderHistory ?? []);
                    let uri = ""
                    if (response.data.customer.fileName)
                        uri = await getCustomerImage(response.data.customer.fileName)
                    setFileUrl(uri)
                }
                if (responeLoyalty) {
                    setLoyaltyStages(responeLoyalty.data ?? [])
                }
            } else if (customerId == 0) {
                const newCustomer: CustomerDto = {
                    id: 0,
                    name: '',
                    contactNumber1: null,
                    contactNumber2: null,
                    totalOrderAmount: 0,
                    branchId: null,
                    branch: null,
                    fileUrl: null,
                    fileName: null,
                    isLoyalty: false
                };
                setCustomer(newCustomer);
            }
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchCustomer();
    }, [fetchCustomer]);

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
        setCustomer((prevCustomer) => ({
            ...(prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null,
                isLoyalty: false
            }),
            name: text,
        }));
        if (customer) {
            const exists = customers.some(c => c.name.toLowerCase() === text.toLowerCase() && c.id !== customer.id);
            setNameExists(exists);
        }
        else if (!customer) {
            const exists = customers.some(c => c.name.toLowerCase() === text.toLowerCase());
            setNameExists(exists);
        }
    }, [customer]);

    const handleContactNumber1Change = useCallback((text: string) => {
        setCustomer((prevCustomer) => ({
            ...(prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null,
                isLoyalty: false
            }),
            contactNumber1: text,
        }));
    }, []);

    const handleContactNumber2Change = useCallback((text: string) => {
        setCustomer((prevCustomer) => ({
            ...(prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null,
                isLoyalty: false
            }),
            contactNumber2: text,
        }));
    }, []);

    const handleSave = useCallback(async () => {
        try {
            Keyboard.dismiss();
            setLoaderMessage('Saving Customer...');
            if (customer) {
                setLoading(true);
                customer.branchId = null;
                const formData = new FormData();
                formData.append('id', String(customer.id));
                formData.append('name', customer.name);
                if (customer.contactNumber1 != null) formData.append('contactNumber1', customer.contactNumber1);
                if (customer.contactNumber2 != null) formData.append('contactNumber2', customer.contactNumber2);
                if (customer.branchId != null) formData.append('branchId', customer.branchId);
                if (fileUrl) {
                    const today = new Date();
                    const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1)
                        .toString()
                        .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;
                    const firstName = customer.name?.split(' ')[0] || 'Unknown';
                    formData.append('file', {
                        uri: fileUrl,
                        name: `${firstName}${formattedDate}.jpg`,
                        type: 'image/jpeg',
                    } as any);
                }
                await saveCustomer(formData);
                navigation.navigate('Customer')
            }
        }
        finally {
            setLoading(false);
        }
    }, [customer, fileUrl, fetchCustomer]);

    const removeCustomer = useCallback(
        async (customer: CustomerDto | null) => {
            if (customer) {
                Alert.alert(
                    'Confirm Deletion',
                    'Are you sure you want to delete this customer?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Yes',
                            onPress: async () => {
                                setLoaderMessage('Deleting Customer...');
                                try {
                                    setLoading(true);
                                    const response = await deleteCustomer(customer.id);
                                    if (response.isSuccess) {
                                        navigation.push('Customer');
                                    }
                                }
                                finally {
                                    setLoading(false)
                                }
                            }
                        }
                    ]
                );
            } else return;
        },
        [navigation]
    );

    const formattedOrderHistory = useMemo(() => {
        return orderHistory.map((order) => ({
            ...order,
            formattedDate: formatTransactionDate(order.transactionDate.toString()),
        }));
    }, [orderHistory]);

    const handleChangeCategory = useCallback((id: number) => {
        setActiveCategory(id);
    }, []);

    const renderItem = useCallback(({ item }: { item: OrderHistory }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('TransactionHistory', { transactionId: item.id })}
            className="mb-2 px-4 py-3 bg-white rounded-md border border-gray-300 shadow-sm"
        >
            <View className="flex-row justify-between items-center mb-1">
                <View className="flex-row items-center space-x-2">
                    <Text className="text-gray-800 font-medium">{item.slipNo || "N/A"}</Text>
                    {item?.isVoided && (
                        <View className="px-2 py-0.5 bg-red-100 rounded-sm">
                            <Text className="text-red-600 text-xs font-medium">Voided</Text>
                        </View>
                    )}
                </View>
                <Text className="text-gray-500 text-sm">{formatTransactionDate(item.transactionDate.toString())}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-black text-base font-semibold">
                    ₱ {Number(item.totalAmount).toFixed(2)}
                </Text>
                <Text className="text-gray-500 text-sm">
                    By: {capitalizeFirstLetter(item.cashier)}
                </Text>
            </View>

            <View className="flex-row items-center">
                <Text className="text-gray-600 text-sm font-medium mr-1">
                    {item.items.length} {item.items.length === 1 ? 'item' : 'items'}:
                </Text>
                <Text
                    className="text-gray-500 text-sm flex-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {item.items.map((item) => item.name).join(', ')}
                </Text>
            </View>
        </TouchableOpacity>
    ), []);

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

            <TitleHeaderComponent showTrash={customer && customer.id != 0} onTrashPress={() => removeCustomer(customer)} isParent={false} userName={user.name} title={customer && customer.id != 0 ? customer.name : "New Customer"} onPress={() => navigation.navigate("Customer")}></TitleHeaderComponent>

            {customer && customer.id !== 0 && (

                <View className="w-full justify-center items-center bg-gray relative">
                    <View className="w-full flex-row justify-between items-center">
                        {['DETAILS', 'TRANSACTIONS', 'LOYALTY'].map((label, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleChangeCategory(index)}
                                className={`${activeCategory === index ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center p-2`}
                            >
                                <View className="flex-row items-center space-x-1">
                                    <Text
                                        className={`${activeCategory === index ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                                    >
                                        {label}
                                    </Text>

                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View className="w-full h-[2px] bg-gray-500 mb-2"></View>

            {activeCategory == 0 && (
                <View className="flex-1 px-4 w-full">
                    {customer && (
                        <>
                            <View className="w-full flex-row justify-between">
                                <View className="flex-1">
                                    <Text className="text-gray-700 text-sm font-bold">Branch</Text>
                                    <TextInput
                                        value={customer.branch?.toUpperCase() || 'No Branch'}
                                        editable={false}
                                        className="pb-2 mb-2 text-[#fe6500]"
                                        placeholder="Branch Name"
                                    />
                                </View>
                                <TouchableOpacity onPress={handleImageSelect}>
                                    {fileUrl ? (
                                        <FastImage source={{ uri: fileUrl }} className="w-24 h-24 rounded-lg" />
                                    ) : (
                                        <View className="w-24 h-24 bg-gray-500 rounded-lg justify-center items-center">
                                            <Camera color="white" height={32} width={32} />
                                            <Text className="text-white text-xs mt-1">Add Photo</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View className='w-full mb-2'>
                                <Text className="text-gray-700 text-sm font-bold">Name</Text>
                                <TextInput
                                    value={customer.name || ''}
                                    editable={true}
                                    className="border-b border-gray-400 py-2 text-black"
                                    placeholder="Customer Name"
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
                                    value={customer.contactNumber1 || ''}
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
                                    value={customer.contactNumber2 || ''}
                                    editable={true}
                                    className="border-b border-gray-400 py-2 mb-2 text-black"
                                    placeholder="Contact Number 2"
                                    onChangeText={handleContactNumber2Change}
                                    placeholderTextColor="#8a8a8a"
                                    selectionColor="#fe6500"
                                    keyboardType='numeric'
                                />
                            </View>
                            {customer.id !== 0 && (
                                <View className='w-full'>
                                    <Text className="text-gray-700 text-sm font-bold">Total Order Amount</Text>
                                    <TextInput
                                        value={customer.totalOrderAmount ? `₱ ${customer.totalOrderAmount}` : ''}
                                        editable={false}
                                        className="border-b border-gray-400 py-2 mb-2"
                                        placeholder="Total Order Amount"
                                    />
                                </View>
                            )}
                        </>

                    )}
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
                                {loading && (
                                    <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
            {activeCategory == 1 && (
                <View className="w-full">
                    <FlatList
                        data={formattedOrderHistory}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        className="w-full mt-2 px-4"
                    />
                </View>
            )}
            {activeCategory == 2 && (
                <View className="w-full mt-4 items-center pb-24">
                    {customer?.isLoyalty != true ? (
                        <Text className="text-gray-500 text-center py-4">
                            Customer has not acquired loyalty membership.
                        </Text>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} className="space-y-2">
                            {loyaltyStages.length !== 0 && (
                                <View>
                                    <View className="flex-column flex-wrap justify-center">
                                        {loyaltyStages.map((stage) => (
                                            <View
                                                key={stage.id}
                                                className="relative items-center justify-center my-2"
                                            >
                                                <Hexagon orderId={stage.orderId} hasItem={stage.itemRewardId != null} rewardName={stage.name || ""} isDone={stage.isDone} dateDone={stage.dateDone} itemName={stage.itemName} itemRewardId={stage.itemRewardId || 0}></Hexagon>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
            )}
        </View>
    );
});

export default CustomerViewScreen;