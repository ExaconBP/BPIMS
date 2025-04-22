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
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import WHSidebar from '../../../../components/WHSidebar';
import { SupplierParamList } from '../../../navigation/navigation';
import { getSupplierList } from '../../../services/whRepo';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';

const SupplierListScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [supplier, setSuppliers] = useState<ObjectDto[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<SupplierParamList>>();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const fetchSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            const userDetails = await getUserDetails();
            setUser(userDetails);

            const response = await getSupplierList(search);
            if (response) {
                setSuppliers(response.data);
            }
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleViewSupplier = useCallback((id: number | null) => {
        navigation.navigate('SupplierView', { id: id || 0, suppliers: supplier });
    }, [navigation, supplier]);

    const filteredSuppliers = useMemo(() => {
        return supplier.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [supplier, search]);

    return (
        <View className='flex flex-1'>
            {user && (
                <WHSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Supplier" onPress={toggleSidebar}></TitleHeaderComponent>

            <View className="justify-center items-center bg-gray relative">
                <View className="flex flex-row w-full bg-gray-300 py-1 px-3 justify-between items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search supplier..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={setSearch}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity className="mr-2" onPress={() => handleViewSupplier(null)}>
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Loading Suppliers...</Text>
                    </View>
                ) : (
                    <ScrollView className="w-full mb-8 px-2" showsVerticalScrollIndicator={false}>
                        {filteredSuppliers.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                onPress={() => handleViewSupplier(s.id)}
                                className="bg-gray px-2 py-3 border-b border-gray-300 flex flex-row justify-between items-center w-full"                            >
                                <ExpandableText text={s.name}></ExpandableText>
                                <ChevronRight color="#fe6500" height={20} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
});

export default SupplierListScreen;