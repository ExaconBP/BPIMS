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
import CentralSidebar from '../../../../components/CentralSidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { SalesReportParamList } from '../../../navigation/navigation';
import {
    DailyTransactionDto,
    ReportRequest,
    SalesGraphDto,
    TotalSalesDto
} from '../../../types/reportType';
import { FilterType, SalesData } from '../../../types/salesType';
import { UserDetails } from '../../../types/userType';
import { getSocketData } from '../../../utils/apiService';
import { getUserDetails } from '../../../utils/auth';
import {
    capitalizeFirstLetter,
    formatTransactionTime,
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
    const screenWidth = Dimensions.get('window').width;
    const [salesData, setSalesData] = useState<SalesData>();

    useEffect(() => {
        const fetchUserDetails = async () => {
            const user = await getUserDetails();
            setUser(user);
        };
        fetchUserDetails();
    }, []);


    useEffect(() => {
        if (!user) {
            return;
        }

        const socket = getSocketData('dailyTransactionExacon');
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

        const salesSocket = getSocketData('totalCentralSales');
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
                <CentralSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} title='Sales Report' userName={user?.name || ""} onPress={toggleSidebar}></TitleHeaderComponent>
            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between items-center">
                    {[0, 1].map((id) => (
                        <TouchableOpacity
                            key={id}
                            onPress={() => handleChangeCategory(id)}
                            className={`${activeCategory === id ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center p-2`}
                        >
                            <Text
                                className={`${activeCategory === id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                            >
                                {['TODAY', 'MONTH'][id]}
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

                    </View>
                    <View className="items-center flex flex-row justify-between w-full mt-1 px-4">
                        <Text className="text-lg text-black font-bold">₱ {totalAmount.toFixed(2)}</Text>
                        <Text className="text-sm text-gray-600">Central</Text>

                    </View>

                    <View className="w-full h-[2px] bg-gray-500 mt-4"></View>

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