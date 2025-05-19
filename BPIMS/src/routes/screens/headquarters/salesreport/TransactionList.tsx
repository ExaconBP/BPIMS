import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Search } from 'react-native-feather';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { SalesReportHQParamList } from '../../../navigation/navigation';
import { getAllTransactionHistoryHQ } from '../../../services/salesRepo';
import { DailyTransactionDto } from '../../../types/reportType';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { capitalizeFirstLetter, formatTransactionDate } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<SalesReportHQParamList, 'TransactionList'>;

const pageSize = 30;

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

const TransactionListScreen = React.memo(({ route }: Props) => {
    const branches: ObjectDto[] = route.params.branches;
    const user: UserDetails = route.params.user;
    const [transactions, setTransactions] = useState<DailyTransactionDto[]>(route.params.transactions);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [activeBranch, setActiveBranch] = useState<number | null>(null);

    const prevBranchRef = useRef<number | null>(null);
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<SalesReportHQParamList>>();
    const debouncedSearch = useDebounce(search, 300);

    const fetchTransactions = useCallback(async (branchId: number | null, page: number, searchText: string) => {
        try {
            if (!loadingMore) setLoading(true);

            const response = await getAllTransactionHistoryHQ(branchId, page, searchText.trim());
            const newTransactions = response.isSuccess ? response.data : [];
            const total = response.totalCount || 0;

            setTransactions(prev => page === 1 ? newTransactions : [...prev, ...newTransactions]);

            const reachedEnd = newTransactions.length < pageSize || (total && page * pageSize >= total);
            setHasMoreData(!reachedEnd);
        } catch (err) {
            console.error(err);
            setHasMoreData(false);
            if (page === 1) setTransactions([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [loadingMore]);

    // Branch Change Effect
    useEffect(() => {
        if (prevBranchRef.current !== activeBranch) {
            prevBranchRef.current = activeBranch;
            setTransactions([]);
            setPage(1);
            fetchTransactions(activeBranch, 1, debouncedSearch);
        }
    }, [activeBranch]);

    // Search/Page Change Effect
    useEffect(() => {
        if (prevBranchRef.current === activeBranch) {
            fetchTransactions(activeBranch, page, debouncedSearch);
        }
    }, [debouncedSearch, page]);

    const handleSearchClick = () => inputRef.current?.focus();

    const loadMoreTransactions = () => {
        if (hasMoreData && !loadingMore && !loading) {
            setLoadingMore(true);
            setPage(prev => prev + 1);
        }
    };

    const renderItem = useCallback(({ item }: { item: DailyTransactionDto }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('TransactionHistory', { transactionId: item.id })}
            className="mb-2 px-4 py-3 bg-white rounded-md border border-gray-300 shadow-sm"
        >
            <View className="flex-row justify-between items-center mb-1">
                <View className="flex-row items-center space-x-2">
                    <Text className="text-gray-800 font-medium">{item.slipNo || "N/A"}</Text>
                    {item.isVoided && (
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
                    By: {capitalizeFirstLetter(item.cashierName)}
                </Text>
            </View>

            <View className="flex-row items-center">
                <Text className="text-gray-600 text-sm font-medium mr-1">
                    {item.items.length} {item.items.length === 1 ? 'item' : 'items'}:
                </Text>
                <Text className="text-gray-500 text-sm flex-1" numberOfLines={1} ellipsizeMode="tail">
                    {item.items.map(i => i.itemName).join(', ')}
                </Text>
            </View>
        </TouchableOpacity>
    ), []);

    const renderFooter = () => loadingMore && (
        <View className="py-2">
            <ActivityIndicator size="small" color="#fe6500" />
        </View>
    );

    const branchTabs = useMemo(() => [
        { id: null, name: "All" },
        ...branches.filter(b => b.id !== 0),
    ], [branches]);

    return (
        <View className="flex flex-1">
            <TitleHeaderComponent isParent={false} userName={user?.name || ""} title="All Transactions" onPress={() => navigation.goBack()} />

            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between items-center">
                    {branchTabs.map(b => (
                        <TouchableOpacity
                            onPress={() => setActiveBranch(b.id)}
                            key={b.id ?? "all"}
                            className={`${activeBranch === b.id ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center p-2`}
                        >
                            <Text className={`${activeBranch === b.id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}>
                                {b.name.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View className="w-full h-[2px] bg-gray-500" />
            </View>

            <View className="justify-center items-center bg-gray relative mb-6 pb-24">
                <View className="flex flex-row w-full bg-gray-300 py-1 px-3 items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search Slip #..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={(text) => {
                                setSearch(text);
                                setPage(1);
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                </View>

                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Loading Transactions...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={transactions}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        className="w-full mt-4 px-4"
                        onEndReached={loadMoreTransactions}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        removeClippedSubviews
                        windowSize={7}
                    />
                )}
            </View>
        </View>
    );
});

export default TransactionListScreen;
