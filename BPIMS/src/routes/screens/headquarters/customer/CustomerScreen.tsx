import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ChevronRight, PlusCircle, Search } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import HQSidebar from '../../../../components/HQSidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { CustomerHQStackParamList } from '../../../navigation/navigation';
import { getCustomerList } from '../../../services/customerRepo';
import { CustomerListDto } from '../../../types/customerType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';

const CustomerScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [branchId, setBranchId] = useState<number | null>(null);
    const [customers, setCustomers] = useState<CustomerListDto[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<CustomerHQStackParamList>>();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const userDetails = await getUserDetails();
            setUser(userDetails);
            if (userDetails) {
                setBranchId(userDetails.branchId);
            }
            const response = await getCustomerList(null, search);
            if (response) {
                setCustomers(response.data);
            }
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, [branchId, search]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleViewCustomer = useCallback((id: number | null) => {
        if (user)
            navigation.navigate('CustomerView', { id: id || 0, customers, user });
    }, [navigation, customers, user]);

    const filteredCustomers = useMemo(() => {
        return customers.filter((customer) =>
            customer.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [customers, search]);

    return (
        <View className='flex flex-1'>
            {user && (
                <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Customers" onPress={toggleSidebar}></TitleHeaderComponent>

            <View className="justify-center items-center bg-gray relative mb-6">
                <View className="flex flex-row w-full bg-gray-300 mt-1 py-1 px-3 justify-between items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search customers..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={setSearch}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity className="mr-2" onPress={() => handleViewCustomer(null)}>
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Loading Customers...</Text>
                    </View>
                ) : (
                    <ScrollView className="w-full mb-8" showsVerticalScrollIndicator={false}>
                        {filteredCustomers.map((customer) => (
                            <TouchableOpacity
                                key={customer.id}
                                onPress={() => handleViewCustomer(customer.id)}
                                className="bg-gray py-2 px-4 border-b border-gray-300 flex flex-row justify-between"
                            >
                                <ExpandableText text={customer.name}></ExpandableText>
                                <View className="px-2">
                                    <ChevronRight color="#fe6500" height={20} width={20} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
});

export default CustomerScreen;