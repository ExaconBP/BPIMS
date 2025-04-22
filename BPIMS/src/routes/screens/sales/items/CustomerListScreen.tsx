import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlusCircle, Search } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import Sidebar from '../../../../components/Sidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { ItemStackParamList } from '../../../navigation/navigation';
import { getCustomerList } from '../../../services/customerRepo';
import { updateCustomer } from '../../../services/salesRepo';
import { CustomerListDto } from '../../../types/customerType';

type Props = NativeStackScreenProps<ItemStackParamList, 'CustomerList'>;

const CustomerListScreen = React.memo(({ route }: Props) => {
  const user = route.params.user;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerListDto[]>([]);
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCustomerList(user.branchId, search);
      if (response) {
        setCustomers(response.data);
      }
      setLoading(false);
    }
    finally {
      setLoading(false);
    }
  }, [user, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const updateCustomerCart = useCallback(async (id: number) => {
    await updateCustomer(id);
    if (user)
      navigation.navigate('Payment', { user });
  }, [navigation, user]);

  const navigateToUser = useCallback(() => {
    if (user) {
      navigation.navigate('NewCustomer', { user, customers });
    }
  }, [user, navigation, customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);


  return (
    <View style={{ flex: 1 }}>
      {user && (
        <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
      )}
      <TitleHeaderComponent title='Customers' isParent={false} userName={user.name} onPress={() => navigation.goBack()}></TitleHeaderComponent>

      <View className="justify-center items-center bg-gray relative pb-8">
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
          <TouchableOpacity className="mr-2" onPress={navigateToUser}>
            <PlusCircle width={18} height={18} color="#fe6500" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View className="py-2">
            <ActivityIndicator size="small" color="#fe6500" />
            <Text className="text-[#fe6500] mt-2">Loading Customers...</Text>
          </View>
        ) : (
          <ScrollView className="w-full mb-8">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  onPress={() => updateCustomerCart(customer.id)}
                  className="bg-gray py-2 px-4 border-b border-gray-300 flex flex-row justify-between"
                >
                  <ExpandableText text={customer.name}></ExpandableText>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-center text-sm text-gray-500 mt-4">
                No customers found.
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
});

export default CustomerListScreen;