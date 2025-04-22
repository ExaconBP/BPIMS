import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ChevronRight, PlusCircle, Search } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import HQSidebar from '../../../../components/HQSidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { UsersHQParamList } from '../../../navigation/navigation';
import { getUsers } from '../../../services/userRepo';
import { UserDetails, UserListDto } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';

const UserListScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<UserListDto[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<UsersHQParamList>>();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);

            const userDetails = await getUserDetails();
            setUser(userDetails);
            const response = await getUsers(search);
            if (response) {
                setUsers(response.data);
            }
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleViewUser = useCallback((id: number | null, name: string | null) => {
        navigation.navigate('UserView', { id: id || 0, name: name || "" });
    }, [navigation]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) =>
            user.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    return (
        <View className='flex flex-1'>
            {user && (
                <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Users" onPress={toggleSidebar}></TitleHeaderComponent>

            <View className="justify-center items-center bg-gray relative">
                <View className="flex flex-row w-full bg-gray-300 mt-1 py-1 px-3 justify-between items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search users..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={setSearch}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity className="mr-2" onPress={() => handleViewUser(null, null)}>
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View className="mt-6">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-red-500 mt-2">Getting Users...</Text>
                    </View>
                ) : (
                    <ScrollView className="w-full mb-8">
                        {filteredUsers.map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                onPress={() => handleViewUser(user.id, user.name)}
                                className="bg-gray py-2 px-4 border-b border-gray-300 flex flex-row justify-between"
                            >
                                <ExpandableText text={user.name}></ExpandableText>
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

export default UserListScreen;