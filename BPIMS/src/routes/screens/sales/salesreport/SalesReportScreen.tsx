import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import Sidebar from '../../../../components/Sidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { SalesReportParamList } from '../../../navigation/navigation';
import { getAllTransactionHistory } from '../../../services/salesRepo';
import {
    AnalysisReportResponse,
    DailyTransactionDto,
    ReportRequest,
    SalesGraphDto,
    TotalSalesDto,
} from '../../../types/reportType';
import { FilterType, SalesData } from '../../../types/salesType';
import { UserDetails } from '../../../types/userType';
import { getSocketData } from '../../../utils/apiService';
import { getUserDetails } from '../../../utils/auth';
import {
    capitalizeFirstLetter,
    formatTransactionDateOnly,
    formatTransactionTime
} from '../../../utils/dateFormat';

const SalesReportScreen = React.memo(() => {
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [graphData, setGraphData] = useState<SalesGraphDto[]>([]);
    const [transactions, setTransactions] = useState<DailyTransactionDto[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [totalSalesMonthly, setTotalSalesMonthly] = useState<number>(0);
    const [totalSalesYearly, setTotalSalesYearly] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const socketRef = useRef<WebSocket | null>(null);
    const salesSocketRef = useRef<WebSocket | null>(null);
    const analysisSocketRef = useRef<WebSocket | null>(null);
    const analyticsSocketRef = useRef<WebSocket | null>(null);
    const navigation = useNavigation<NativeStackNavigationProp<SalesReportParamList>>();
    const [selectedFilter, setSelectedFilter] = useState<FilterType>("Month");
    const screenWidth = Dimensions.get('window').width;
    const [salesData, setSalesData] = useState<SalesData>();
    const [analysisReport, setAnalysisReport] = useState<AnalysisReportResponse>();
    const [transactionHistory, setTransactionHistory] = useState<DailyTransactionDto[]>([]);
    const [transactionHistoryCount, setTransactionHistoryCount] = useState<number>();

    const chartPadding = 40;

    const filteredData = salesData ? salesData[selectedFilter] : [];
    const dataLength = filteredData.length || 1;
    const calculatedSpacing = selectedFilter === "All" || "Year"
        ? Math.max((screenWidth - chartPadding) / dataLength, 60)
        : Math.max((screenWidth - chartPadding) / dataLength, 30);

    useEffect(() => {
        const fetchUserDetails = async () => {
            const user = await getUserDetails();
            setUser(user);
        };
        fetchUserDetails();
    }, []);

    useEffect(() => {
        const fetchTransactionHistory = async () => {
            const history = await getAllTransactionHistory(user?.branchId || 1, 1, "");
            setTransactionHistory(history.data);
            setTransactionHistoryCount(history.totalCount || 0)
        };
        fetchTransactionHistory();
    }, [user]);


    useEffect(() => {
        if (!user) {
            return;
        }

        const socket = getSocketData('dailyTransaction', { branchId: user.branchId });
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const parsedData: ReportRequest = JSON.parse(event.data);
                debouncedSetGraphData(parsedData.graphData);
                debouncedTransactionData(parsedData.transactions);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            } finally {
                setLoading(false);
            }
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        const salesSocket = getSocketData('totalSales', { branchId: user.branchId });
        salesSocketRef.current = salesSocket;

        salesSocket.onmessage = (event) => {
            try {
                const parsedData: TotalSalesDto = JSON.parse(event.data);
                debouncedTotalData(parsedData);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };

        return () => {
            if (salesSocketRef.current) {
                salesSocketRef.current.close();
            }
        };
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        const analysisSocket = getSocketData('analyticsData', { branchId: user.branchId });
        analysisSocketRef.current = analysisSocket;

        analysisSocket.onmessage = (event) => {
            try {
                const parsedData: SalesData = JSON.parse(event.data);
                debouncedAnalyticsData(parsedData);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };

        return () => {
            if (analysisSocketRef.current) {
                analysisSocketRef.current.close();
            }
        };
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        const analyticsSocket = getSocketData('analysisReport', { branchId: user.branchId });
        analyticsSocketRef.current = analyticsSocket;

        analyticsSocket.onmessage = (event) => {
            try {
                const parsedData: AnalysisReportResponse = JSON.parse(event.data);
                debouncedAnalysisData(parsedData);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };

        return () => {
            if (analyticsSocketRef.current) {
                analyticsSocketRef.current.close();
            }
        };
    }, [user]);

    const debouncedSetGraphData = useCallback(
        debounce((data: SalesGraphDto[]) => {
            setGraphData(data);
        }, 100),
        []
    );

    const debouncedTransactionData = useCallback(
        debounce((data: DailyTransactionDto[]) => {
            setTransactions(data);
            const total = data.reduce((sum, transaction) => sum + (transaction?.totalAmount || 0), 0);
            setTotalAmount(total);
        }, 100),
        []
    );

    const debouncedTotalData = useCallback(
        debounce((data: TotalSalesDto) => {
            setTotalSalesMonthly(data.totalSalesPerMonth);
            setTotalSalesYearly(data.totalSalesPerYear);
        }, 100),
        []
    );

    const debouncedAnalyticsData = useCallback(
        debounce((data: SalesData) => {
            setSalesData(data);
        }, 100),
        []
    );

    const debouncedAnalysisData = useCallback(
        debounce((data: AnalysisReportResponse) => {
            setAnalysisReport(data);
        }, 100),
        []
    );


    const handleChangeCategory = useCallback((id: number) => {
        setActiveCategory(id);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const chartData = useMemo(() => {
        return [
            { value: 0, label: '7 AM', dataPointText: '₱ 0.00' },
            { value: graphData[0]?.totalAmount || 0, label: '9:30 AM', dataPointText: `₱ ${graphData[0]?.totalAmount.toFixed(2) || '0.00'}` },
            { value: graphData[1]?.totalAmount || 0, label: '12 Noon', dataPointText: `₱ ${graphData[1]?.totalAmount.toFixed(2) || '0.00'}` },
            { value: graphData[2]?.totalAmount || 0, label: '2:30 PM', dataPointText: `₱ ${graphData[2]?.totalAmount.toFixed(2) || '0.00'}` },
            { value: graphData[3]?.totalAmount || 0, label: '5 PM', dataPointText: `₱ ${graphData[3]?.totalAmount.toFixed(2) || '0.00'}` },
        ];
    }, [graphData]);

    const spacing = useMemo(() => {
        const numberOfDataPoints = chartData.length;
        return (screenWidth - 70) / (numberOfDataPoints - 1);
    }, [chartData, screenWidth]);

    const formattedDate = useMemo(() => {
        return new Date().toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'long',
            day: '2-digit',
            year: 'numeric',
        });
    }, []);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">Loading Sales Data...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent title="sales report" userName={user?.name || ""} onPress={toggleSidebar}
                isParent={true}></TitleHeaderComponent>
            <View className="w-full justify-center items-center bg-gray relative ">
                <View className="w-full flex-row justify-between px-2">
                    {[0, 1, 2].map((id) => (
                        <TouchableOpacity
                            key={id}
                            onPress={() => handleChangeCategory(id)}
                            className={`${activeCategory === id ? 'border-b-4 border-yellow-500' : ''} w-[30%] justify-center items-center`}
                        >
                            <Text
                                className={`${activeCategory === id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                            >
                                {['TODAY', 'MONTH', 'ANALYTICS'][id]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <View className="w-full h-[2px] bg-gray-500"></View>
            {activeCategory === 0 && (
                <View className="justify-center items-center bg-gray mt-2">
                    <View className="w-full">
                        <LineChart
                            isAnimated
                            animateOnDataChange
                            thickness={3}
                            height={200}
                            color="#fe6500"
                            noOfSections={3}
                            areaChart
                            data={chartData}
                            startFillColor="rgba(254, 101, 0, 0.4)"
                            endFillColor="rgba(243, 244, 246, 0.4)"
                            startOpacity={0.4}
                            endOpacity={0.4}
                            hideRules
                            initialSpacing={20}
                            dataPointsWidth={20}
                            yAxisColor="transparent"
                            xAxisColor="transparent"
                            dataPointsColor="#fe6500"
                            xAxisLabelTextStyle={{ color: '#000', fontSize: 10, textAlign: 'center' }}
                            yAxisTextStyle={{ color: '#000', fontSize: 10 }}
                            spacing={spacing}
                            adjustToWidth
                            hideYAxisText
                            disableScroll
                            textColor="black"
                        />
                    </View>
                    <View className="items-center flex flex-row justify-between w-full mt-6 px-4">
                        <Text className="text-sm text-[#fe6500]">{formattedDate}</Text>
                        {
                            user?.branchName && (
                                <Text className="text-sm text-[#fe6500]">{user?.branchName.toUpperCase()}</Text>
                            )
                        }
                    </View>
                    <View className="items-center flex flex-row justify-between w-full mt-1 px-4">
                        <Text className="text-lg text-black font-bold">₱ {totalAmount.toFixed(2)}</Text>
                        <Text className="text-sm text-gray-600">Branch</Text>

                    </View>

                    <View className="w-full h-[2px] bg-gray-500 mt-4"></View>

                    <View className="items-center flex flex-row justify-between w-full mt-1 px-4">
                        <Text className="text-lg text-black font-bold">Daily Transactions</Text>
                        <TouchableOpacity onPress={() => {
                            if (transactionHistory && user) {
                                navigation.navigate('TransactionList', { transactions: transactionHistory, user });
                            }
                        }}>
                            <Text className="text-sm text-[#fe6500]">All Transactions</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView className="w-full mt-4 px-4 h-[40%]">
                        {transactions.map((transaction, index) => (
                            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory', { transactionId: transaction.id })} key={index} className="mb-3 py-1 bg-gray rounded-lg border-b border-gray-500">
                                <View className="flex-row justify-between">

                                    <View className="flex flex-row justify-between w-full">

                                        <Text className="text-gray-500 font-medium">{transaction.slipNo}</Text>
                                        <Text className="text-gray-500 font-medium">
                                            {formatTransactionTime(transaction.transactionDate.toString())}
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row justify-between">

                                    <View className="flex flex-row w-full justify-between">
                                        <Text className="text-black font-semibold">
                                            ₱ {Number(transaction.totalAmount).toFixed(2)}
                                        </Text>
                                        <Text className="text-gray-500 font-medium">
                                            By: {capitalizeFirstLetter(transaction.cashierName)}
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-gray-700 font-medium">
                                        {transaction.items.length} {transaction.items.length === 1 ? 'item' : 'items'}:
                                    </Text>
                                    <Text className="text-gray-600 flex-1" numberOfLines={1} ellipsizeMode="tail">
                                        {transaction.items.map((item) => item.itemName).join(', ')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
            {activeCategory === 1 && (
                <View>
                    <View className="justify-center items-center bg-gray mt-4 flex flex-row px-4 justify-between">
                        <View className="flex flex-column">
                            <Text className="text-sm text-gray-900">Total Sales of the Month</Text>
                            <Text className="text-lg text-[#fe6500] font-bold text-center">
                                ₱ {totalSalesMonthly?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View className="flex flex-column">
                            <Text className="text-sm text-gray-900">Total Sales of the Year</Text>
                            <Text className="text-lg text-[#fe6500] font-bold text-center">
                                ₱ {totalSalesYearly?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                    <View className="w-full h-[2px] bg-gray-500 mt-2"></View>
                </View>
            )}
            {activeCategory === 2 && (
                <View className="w-full justify-center items-center bg-gray mt-2 p-2">
                    <View className="w-full">

                        <View className="w-full flex-row justify-around mb-4">
                            {(["Week", "Month", "Year", "All"] as FilterType[]).map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    className={`px-4 py-2 rounded ${selectedFilter === filter ? "bg-[#fe6500]" : "bg-transparent"
                                        }`}
                                    onPress={() => setSelectedFilter(filter)}
                                >
                                    <Text className={`${selectedFilter === filter ? "text-white" : "text-black"
                                        }`}>{filter}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {filteredData[0]?.label != null ? (
                            filteredData.length === 1 ? (
                                <View className="w-full items-center mt-4">
                                    <Text className="text-gray-500 text-sm">Not enough data</Text>
                                </View>
                            ) : (
                                <View className="w-full flex justify-center items-center">
                                    <View className="w-[90%]">
                                        <LineChart
                                            data={filteredData}
                                            animateOnDataChange
                                            thickness={3}
                                            height={200}
                                            color="#fe6500"
                                            noOfSections={3}
                                            areaChart
                                            startFillColor="rgba(254, 101, 0, 0.4)"
                                            endFillColor="rgba(243, 244, 246, 0.4)"
                                            startOpacity={0.4}
                                            endOpacity={0.4}
                                            hideRules
                                            yAxisColor="transparent"
                                            xAxisColor="transparent"
                                            dataPointsColor="#fe6500"
                                            xAxisLabelTextStyle={{ color: '#000', fontSize: 10, textAlign: 'center' }}
                                            yAxisTextStyle={{ color: '#000', fontSize: 10 }}
                                            adjustToWidth
                                            hideYAxisText
                                            initialSpacing={20}
                                            endSpacing={10}
                                            dataPointsWidth={20}
                                            spacing={calculatedSpacing}
                                            textColor="black"
                                        />
                                    </View>
                                </View>
                            )
                        ) : (
                            <View className="w-full items-center mt-4">
                                <Text className="text-gray-500 text-sm">No transactions available</Text>
                            </View>
                        )}

                    </View>
                    {analysisReport && (
                        <View className="w-full mt-4 p-4">
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text
                                        className={`font-semibold text-lg ${analysisReport.percentChange > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        {analysisReport.percentChange > 0 ? '▲' : '▼'} {analysisReport.percentChange.toFixed(2)}%
                                    </Text>
                                    <Text className="text-gray-500 text-xs">This month vs avg months</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-green-600 font-semibold text-lg">₱ {analysisReport.highestSalesAmount}</Text>
                                    <Text className="text-gray-500 text-xs">Highest Sales – {analysisReport.highestSalesDate != null ? formatTransactionDateOnly(analysisReport.highestSalesDate) : "No Data"}</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-green-600 font-semibold text-lg">₱ {analysisReport.highestSalesMonthAmount}</Text>
                                    <Text className="text-gray-500 text-xs">Highest Sales This Month – {analysisReport.highestSalesMonthDate != null ? formatTransactionDateOnly(analysisReport.highestSalesMonthDate) : "No Data"}</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-blue-600 font-semibold text-lg">{analysisReport.highOrderPercentage || "-------"}</Text>
                                    <Text className="text-gray-500 text-xs">High-value orders (₱1,500+)</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-orange-600 font-semibold text-lg">{analysisReport.peakPeriod || "-------"}</Text>
                                    <Text className="text-gray-500 text-xs">Peak Sales Hours</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            )
            }
        </View>
    );
});

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SalesReportScreen;