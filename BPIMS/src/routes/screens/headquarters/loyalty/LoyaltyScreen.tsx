import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ChevronRight, PlusCircle } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import HQSidebar from '../../../../components/HQSidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { LoyaltyParamsList } from '../../../navigation/navigation';
import { getLoyaltyCardList, getRewards } from '../../../services/customerRepo';
import { LoyaltyCardDto } from '../../../types/customerType';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';

const LoyaltyMonitorScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCardDto[]>([]);
    const [rewards, setRewards] = useState<ObjectDto[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<LoyaltyParamsList>>();

    const newLoyaltyCard: LoyaltyCardDto = {
        id: 0,
        validYear: "",
        isValid: false
    };

    const newReward: ObjectDto = {
        id: 0,
        name: ""
    };

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    useEffect(() => {
        getItems(activeCategory);
    }, [activeCategory]);

    const getItems = useCallback(
        async (categoryId: number) => {
            try {
                setLoading(true)
                const userResponse = await getUserDetails();
                setUser(userResponse);
                if (categoryId == 0) {
                    const response = await getLoyaltyCardList();
                    setLoyaltyCards(response.data);
                }
                else if (categoryId == 1) {
                    const response = await getRewards();
                    setRewards(response.data)
                }

                setLoading(false);
            }
            finally {
                setLoading(false);
            }
        },
        [activeCategory]
    );

    const handleChangeCategory = useCallback((id: number) => {
        if (activeCategory !== id) {
            setActiveCategory(id);

            if (id == 1)
                setRewards([]);
            else if (id == 0)
                setLoyaltyCards([]);
        }
    }, [activeCategory]);

    const handleLoyaltyCardView = useCallback((item: LoyaltyCardDto) => {
        if (user) {
            navigation.navigate('LoyaltyView', { item, user });
        }
    }, [user, navigation]);

    const handleRewardView = useCallback((item: ObjectDto) => {
        if (item.id == 1) return;
        if (user) {
            navigation.navigate('RewardView', { item, user });
        }
    }, [user, navigation]);

    const renderRewards = useCallback(
        ({ item }: { item: ObjectDto }) => (
            <TouchableOpacity onPress={() => handleRewardView(item)} className="bg-gray px-2 py-2 border-b border-gray-300 flex flex-row justify-between items-center w-full">
                <View className="flex flex-row">
                    <ExpandableText text={item.name}></ExpandableText>
                </View>

                <ChevronRight height={20} width={20} color="#fe6500" ></ChevronRight>
            </TouchableOpacity>
        ),
        [user]
    );

    const renderLoyaltyCard = useCallback(
        ({ item }: { item: LoyaltyCardDto }) => (
            <TouchableOpacity onPress={() => handleLoyaltyCardView(item)} className="bg-gray px-2 py-2 border-b border-gray-300 flex flex-row justify-between items-center w-full">
                <View className="flex flex-row">
                    <ExpandableText text={item.validYear}></ExpandableText>
                    {item.isValid == true && (
                        <View className="ml-2 px-3 py-1 bg-transparent border border-green-500 rounded-lg">
                            <Text className="text-green-700 text-[8px] font-bold">Active</Text>
                        </View>
                    )}
                </View>

                <ChevronRight height={20} width={20} color="#fe6500" ></ChevronRight>
            </TouchableOpacity>
        ),
        [user]
    );

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                {user && (
                    <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
                )}
                <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Loyalty Rewards" onPress={toggleSidebar}></TitleHeaderComponent>

                <View className="w-full justify-center items-center bg-gray relative">
                    <View className="w-full flex-row justify-between items-center">
                        {['LOYALTY CARDS', 'ITEM REWARDS'].map((label, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleChangeCategory(index)}
                                className={`${activeCategory === index ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center `}
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

                <View className="flex-1 px-2">
                    {activeCategory == 0 ? (
                        <View className="flex-1 mt-1">
                            <View className="flex flex-row justify-between items-center mt-2">
                                <Text className="text-gray-700 text-sm font-bold"></Text>
                                <TouchableOpacity
                                    className="flex-row items-center"
                                    onPress={() => handleLoyaltyCardView(newLoyaltyCard)}
                                >
                                    <Text className="text-[#fe6500] text-sm font-semibold mr-1">Setup New Loyalty Card</Text>
                                    <PlusCircle width={18} height={18} color="#fe6500" />
                                </TouchableOpacity>
                            </View>
                            <View className="justify-center items-center bg-gray relative mb-2">
                                {loading && (
                                    <View className="py-2">
                                        <ActivityIndicator size="small" color="#fe6500" />
                                        <Text className="text-center text-[#fe6500]">Fetching items...</Text>
                                    </View>
                                )}
                            </View>

                            <FlatList
                                data={loyaltyCards}
                                renderItem={renderLoyaltyCard}
                                keyExtractor={(item, index) => item.id.toString() + index.toString()}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        </View>
                    ) :
                        (
                            <View className="flex-1 mt-1">
                                <View className="flex flex-row justify-between items-center mt-2">
                                    <Text className="text-gray-700 text-sm font-bold"></Text>
                                    <TouchableOpacity
                                        className="flex-row items-center"
                                        onPress={() => handleRewardView(newReward)}
                                    >
                                        <Text className="text-[#fe6500] text-sm font-semibold mr-1">Add Reward</Text>
                                        <PlusCircle width={18} height={18} color="#fe6500" />
                                    </TouchableOpacity>
                                </View>

                                <View className="justify-center items-center bg-gray relative mb-2">
                                    {loading && (
                                        <View className="py-2">
                                            <ActivityIndicator size="small" color="#fe6500" />
                                            <Text className="text-center text-[#fe6500]">Fetching items...</Text>
                                        </View>
                                    )}
                                </View>

                                <FlatList
                                    data={rewards}
                                    renderItem={renderRewards}
                                    keyExtractor={(item, index) => item.id.toString() + index.toString()}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                />
                            </View>
                        )}

                </View>
            </View>
        </View>
    );
});

export default LoyaltyMonitorScreen;