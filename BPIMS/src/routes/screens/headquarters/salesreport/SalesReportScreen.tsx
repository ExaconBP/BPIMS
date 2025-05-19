import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { ArrowRight, ChevronDown, Printer } from 'react-native-feather';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import ExpandableText from '../../../../components/ExpandableText';
import HQSidebar from '../../../../components/HQSidebar';
import MonthYearPicker from '../../../../components/MonthYearPicker';
import SelectModal from '../../../../components/SelectModal';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { SalesReportHQParamList } from '../../../navigation/navigation';
import { generateSalesPDF, getAllTransactionHistoryHQ, getOldestTransaction } from '../../../services/salesRepo';
import { getBranches } from '../../../services/userRepo';
import {
    BranchDto,
    DailyTransactionDto,
    DailyTransactionResponse,
    TotalSalesDto
} from '../../../types/reportType';
import { FilterTypeHQ, SaleItemsDto, SalesDataHQ } from '../../../types/salesType';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { getSocketData } from '../../../utils/apiService';
import { getUserDetails } from '../../../utils/auth';
import { formatCurrency, formatmmddyyyyDate } from '../../../utils/dateFormat';

const SalesReportScreen = React.memo(() => {
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [branches, setBranches] = useState<BranchDto[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [totalProfit, setTotalProfit] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const socketRef = useRef<WebSocket | null>(null);
    const salesSocketRef = useRef<WebSocket | null>(null);
    const analysisSocketRef = useRef<WebSocket | null>(null);
    const analysisItemsSocketRef = useRef<WebSocket | null>(null);
    const analyticsSocketRef = useRef<WebSocket | null>(null);
    const [totalSalesMonthly, setTotalSalesMonthly] = useState<number>(0);
    const [totalSalesYearly, setTotalSalesYearly] = useState<number>(0);
    const [selectedFilter, setSelectedFilter] = useState<FilterTypeHQ>("Monthly");
    const screenWidth = Dimensions.get('window').width;
    const [salesData, setSalesData] = useState<SalesDataHQ[]>([]);
    const [salesItemData, setSalesItemData] = useState<SaleItemsDto>();
    const [transactionHistory, setTransactionHistory] = useState<DailyTransactionDto[]>([]);
    const navigation = useNavigation<NativeStackNavigationProp<SalesReportHQParamList>>();
    const [dayFilter, setDayFilter] = useState<boolean>(false);
    const [fromDate, setFromDate] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [openDateFrom, setOpenDateFrom] = useState<boolean>(false);
    const [toDate, setToDate] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [openToDate, setOpenToDate] = useState<boolean>(false);
    const [activeBranch, setActiveBranch] = useState<ObjectDto>();
    const [reportBranches, setReportBranches] = useState<ObjectDto[]>([]);
    const [openBranch, setOpenBranch] = useState<boolean>(false);
    const [startTransactionDate, setStartTransactionDate] = useState<Date>();
    const [monthDate, setMonthDate] = useState<Date>();
    const [monthFilter, setMonthFilter] = useState<boolean>(false);

    const filteredData = salesData ? salesData : [];
    const filters: FilterTypeHQ[] = ["Daily", "Weekly", "Monthly", "Yearly", "All-Time"];

    const chartPadding = 40; // Adjust padding/margin as needed

    const dataLength = filteredData?.length || 1; // Avoid division by zero
    const calculatedSpacing = selectedFilter === "All-Time" || "Year"
        ? Math.max((screenWidth - chartPadding) / dataLength, 60)  // If "all" is selected, min 60
        : Math.max((screenWidth - chartPadding) / dataLength, 30); // Otherwise, min 30


    useEffect(() => {
        const backAction = () => {
            BackHandler.exitApp();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        const fetchUserDetails = async () => {
            const user = await getUserDetails();
            let branchesResponse = await getBranches();
            const oldestDate = await getOldestTransaction(activeBranch?.id || 0)
            const allBranch: ObjectDto = { id: 0, name: "ALL" };
            branchesResponse.unshift(allBranch);
            setUser(user);
            setReportBranches(branchesResponse);
            setStartTransactionDate(oldestDate.data ? oldestDate.data : new Date())
        };
        fetchUserDetails();
    }, []);


    useEffect(() => {
        const fetchTransactionHistory = async () => {
            try {
                const history = await getAllTransactionHistoryHQ(null, 1, "");
                setTransactionHistory(history.data);
            } catch (error) {
                console.error('Error fetching transaction history:', error);
            }
        };

        if (user) {
            fetchTransactionHistory();
        }
    }, [user]);

    const goToTransaction = useCallback(() => {
        const fetchBranchesAndNavigate = async () => {
            if (!user) return;
            let br = await getBranches();

            const all: ObjectDto =
            {
                id: 0,
                name: "ALL"
            }
            br.push(all);
            navigation.navigate('TransactionList', { transactions: transactionHistory, user, branches: br });
        };
        fetchBranchesAndNavigate();
    }, [user, transactionHistory, navigation]);


    useEffect(() => {
        const socket = getSocketData('dailyTransactionHQ');
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const parsedData: DailyTransactionResponse = JSON.parse(event.data);
                debouncedBranchData(parsedData.branches);
                debouncedTotalAmount(parsedData.totalAmount);
                const totalProfit = parsedData.branches.reduce((sum, branch) => sum + branch.totalProfit, 0);
                debouncedTotalProfit(totalProfit);
            } finally {
                setLoading(false);
            }
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        const salesSocket = getSocketData('totalSalesHQ');
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
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const analysisSocket = getSocketData('analyticsDataHQ', {
            fromDate: formatDate(fromDate),
            toDate: formatDate(toDate),
            branchId: activeBranch?.id || 0
        });

        analysisSocketRef.current = analysisSocket;

        analysisSocket.onmessage = (event) => {
            try {
                const parsedData: SalesDataHQ[] = JSON.parse(event.data);
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
    }, [user, fromDate, toDate, activeBranch]);

    useEffect(() => {
        if (!user) {
            return;
        }

        // Format dates to YYYY-MM-DD
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const analysisItemsSocket = getSocketData('analyticsGrossSalesDataHQ', {
            fromDate: formatDate(fromDate),
            toDate: formatDate(toDate),
            branchId: activeBranch?.id || 0
        });

        analysisItemsSocketRef.current = analysisItemsSocket;

        analysisItemsSocket.onmessage = (event) => {
            try {
                const parsedData: SaleItemsDto = JSON.parse(event.data);
                debouncedAnalyticsItemsData(parsedData);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };

        return () => {
            if (analysisItemsSocketRef.current) {
                analysisItemsSocketRef.current.close();
            }
        };
    }, [user, fromDate, toDate, activeBranch]);

    // Update date range when selectedFilter changes
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let newFromDate = new Date(today);
        let newToDate = new Date(today);

        switch (selectedFilter) {
            case 'Daily':
                // Already set to current date
                break;
            case 'Weekly':
                newFromDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                break;
            case 'Monthly':
                newFromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'Yearly':
                newFromDate = new Date(today.getFullYear(), 0, 1); // January 1st
                break;
            case 'All-Time':
                newFromDate = startTransactionDate ? new Date(startTransactionDate) : new Date();
                break;
        }

        setFromDate(newFromDate);
        setToDate(newToDate);
    }, [selectedFilter, startTransactionDate]);



    const debouncedBranchData = useCallback(
        debounce((data: BranchDto[]) => {
            setBranches(data);
        }, 100),
        []
    );

    const debouncedTotalAmount = useCallback(
        debounce((data: number) => {
            setTotalAmount(data);
        }, 100),
        []
    );

    const debouncedTotalProfit = useCallback(
        debounce((data: number) => {
            setTotalProfit(data);
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
        debounce((data: SalesDataHQ[]) => {
            setSalesData(data);
        }, 100),
        []
    );

    const debouncedAnalyticsItemsData = useCallback(
        debounce((data: SaleItemsDto) => {
            setSalesItemData(data);
        }, 100),
        []
    );

    const handleChangeCategory = useCallback((id: number) => {
        setActiveCategory(id);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const barData = useMemo(() => {
        return branches.map((branch) => ({
            value: branch.dailyTotal || 0,
            label: branch.name || "",
            topLabelComponent: () => (
                <Text className='text-[10px] font-bold text-black'>₱ {branch.dailyTotal.toFixed(2)}</Text>
            ),
        }));
    }, [branches]);

    const spacing = useMemo(() => {
        const numberOfDataPoints = barData.length;
        return numberOfDataPoints > 1 ? (screenWidth - 180) / (numberOfDataPoints) : 0;
    }, [barData, screenWidth]);


    const handleGeneratePDF = useCallback(async () => {
        await generateSalesPDF(fromDate, toDate, activeBranch?.id || 0);
    }, [fromDate, toDate, activeBranch]);

    const onValueChange = useCallback(
        (newDate: Date) => {
            const selectedDate = newDate || new Date();
            const newFromDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const toDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

            setMonthFilter(false);
            setMonthDate(selectedDate);
            setFromDate(newFromDate)
            setToDate(toDate)
        },
        [setMonthDate, setMonthFilter, setFromDate, setToDate, monthFilter],
    );

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
                <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ""} title="Sales Report" onPress={toggleSidebar}></TitleHeaderComponent>

            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between items-center">
                    {['TODAY', 'MONTH', 'ANALYTICS'].map((label, index) => (
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
            <View className="w-full h-[2px] bg-gray-500"></View>
            {activeCategory === 0 && (
                <ScrollView className="flex-1 bg-gray p-4">
                    <View className="w-full justify-center items-center mt-4">
                        <View className="w-full bg-gray-50 rounded-lg p-3 shadow-sm">
                            <BarChart
                                isAnimated
                                noOfSections={4}
                                frontColor="#fe6500"
                                data={barData}
                                yAxisThickness={0}
                                xAxisThickness={1}
                                xAxisLength={spacing * 6 - 40}
                                xAxisColor="transparent"
                                spacing={spacing}
                                barWidth={50}
                                xAxisLabelTextStyle={{ fontSize: 10, color: '#6B7280' }}
                                yAxisTextStyle={{ fontSize: 10, color: '#6B7280' }}
                                hideYAxisText
                                hideRules

                                initialSpacing={10}
                            />
                        </View>
                    </View>

                    <View className="mt-6 px-2">
                        <View className="w-full flex-row justify-end">
                            <TouchableOpacity>
                                <Text
                                    className="text-sm text-[#fe6500] font-medium"
                                    onPress={() => goToTransaction()}
                                >
                                    View All Transactions
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mt-6 px-2">
                        <View className="flex flex-row justify-between items-center bg-gray-50 rounded-lg p-4 shadow-sm">
                            <Text className="text-lg text-gray-700 font-medium">Total Revenue:</Text>
                            <Text className="text-lg text-[#fe6500] font-semibold">₱ {totalAmount.toFixed(2)}</Text>
                        </View>
                        <View className="flex flex-row justify-between items-center bg-gray-50 rounded-lg p-4 mt-2 shadow-sm">
                            <Text className="text-lg text-gray-700 font-medium">Total Profit:</Text>
                            <Text className="text-lg text-[#fe6500] font-semibold">₱ {totalProfit.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View className="mt-6 mb-8">
                        <Text className="text-xl text-gray-800 font-bold mb-4 px-2">Top 5 Items by Branch</Text>
                        <ScrollView className="w-full">
                            {branches.map((branch, index) => (
                                <View key={index} className="mb-6 bg-white rounded-lg shadow-md p-4">
                                    <Text className="text-lg font-semibold text-gray-800 mb-3">{branch.name}</Text>

                                    <View className="flex flex-row justify-between border-b border-gray-200 pb-2">
                                        <Text className="text-sm font-medium text-gray-600 w-1/4">Rank</Text>
                                        <Text className="text-sm font-medium text-gray-600 w-1/2">Item Name</Text>
                                        <Text className="text-sm font-medium text-gray-600 w-1/4 text-right">Sales</Text>
                                    </View>

                                    {[...Array(5)].map((_, itemIndex) => {
                                        const item = branch.topItems[itemIndex];
                                        return (
                                            <View key={itemIndex} className="flex flex-row justify-between py-2 border-b border-gray-100">
                                                <Text className="text-sm text-gray-700 w-1/4">{itemIndex + 1}.</Text>
                                                <View className='flex-1'>
                                                    <ExpandableText text={item ? item.itemName : 'N/A'} className={'text-left'} />
                                                </View>
                                                <Text className="text-sm text-gray-700 w-1/4 text-right">
                                                    {item ? `₱ ${item.totalSales.toFixed(2)}` : '₱ 0.00'}
                                                </Text>
                                            </View>
                                        );
                                    })}

                                    <View className="flex flex-row justify-between pt-3">
                                        <Text className="text-sm font-semibold text-gray-800">Total Sales:</Text>
                                        <Text className="text-sm font-semibold text-gray-800">
                                            ₱ {branch.topItems.reduce((sum, item) => sum + (item?.totalSales || 0), 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
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
                <View className=" w-full bg-gray p-2">
                    <View className="w-full">
                        <View className='items-end'>
                            <TouchableOpacity onPress={handleGeneratePDF} className='flex mb-2 mr-2 bg-[#fe6500] p-2 text-black flex flex-row rounded-lg'>
                                <Printer width={14} height={14} color={"white"}></Printer>
                                <Text className='text-white ml-2 text-xs' >
                                    Print PDF
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View>
                            <View className="w-full mb-4 flex flex-row gap-2">
                                <TouchableOpacity onPress={() => setDayFilter(true)} className=' w-1/2 border border-gray-300 rounded flex-1 flex flex-row p-2 justify-between'>
                                    <Text>{selectedFilter}</Text>
                                    <ChevronDown height={18} color={"#fe6500"}></ChevronDown>
                                </TouchableOpacity>
                                {selectedFilter == 'Monthly' && (
                                    <View className='w-1/2  justify-between flex flex-row border border-gray-300 rounded items-center'>
                                        <TouchableOpacity onPress={() => setMonthFilter(true)} className='p-2'>
                                            <Text>{`${fromDate.toLocaleString('default', { month: 'long' })} ${fromDate.getFullYear()}`}</Text>
                                        </TouchableOpacity>
                                        <MonthYearPicker
                                            visible={monthFilter}
                                            initialDate={fromDate}
                                            onDone={(date) => {
                                                onValueChange(date)
                                            }}
                                            onCancel={() => setMonthFilter(false)}
                                        />
                                        <ChevronDown height={18} color={"#fe6500"}></ChevronDown>
                                    </View>
                                )}
                            </View>
                            <View className="w-full mb-4 flex flex-row gap-2">
                                <View className=' w-[60%] flex flex-row border border-gray-300 rounded items-center justify-between '>
                                    <TouchableOpacity onPress={() => setOpenDateFrom(true)} className=' p-2'>
                                        <Text>{formatmmddyyyyDate(fromDate)}</Text>
                                    </TouchableOpacity>
                                    <ArrowRight height={16} color={"#fe6500"}></ArrowRight>
                                    <DatePicker buttonColor='#fe6500'
                                        theme='light'
                                        dividerColor='#fe6500' id={"fromDate"} modal open={openDateFrom} date={fromDate} mode="date" maximumDate={new Date()}
                                        onConfirm={(date) => { setOpenDateFrom(false); setFromDate(date) }}
                                        onCancel={() => setOpenDateFrom(false)} />
                                    <TouchableOpacity onPress={() => setOpenToDate(true)} className='p-2'>
                                        <Text>{formatmmddyyyyDate(toDate)}</Text>
                                    </TouchableOpacity>
                                    <DatePicker buttonColor='#fe6500'
                                        theme='light'
                                        dividerColor='#fe6500' id={"todate"} modal open={openToDate} date={toDate} mode="date" maximumDate={new Date()} minimumDate={fromDate}
                                        onConfirm={(date) => { setOpenToDate(false); setToDate(date) }}
                                        onCancel={() => setOpenToDate(false)} />
                                </View>
                                <TouchableOpacity onPress={() => setOpenBranch(true)} className='w-[40%] border border-gray-300 rounded flex-1 flex flex-row p-2 justify-between'>
                                    <Text>{activeBranch?.name || "ALL"}</Text>
                                    <ChevronDown height={18} color={"#fe6500"}></ChevronDown>
                                </TouchableOpacity>
                            </View>

                            <SelectModal visible={dayFilter} title="Select Filter" onClose={() => setDayFilter(false)} onSelect={(item) => setSelectedFilter(item)} keyExtractor={(item) => item}
                                labelExtractor={(item) => item} items={filters}>
                            </SelectModal>
                            <SelectModal visible={openBranch} title="Select Branch" onClose={() => setOpenBranch(false)} onSelect={(item) => setActiveBranch(item)} keyExtractor={(item) => item.id.toString()}
                                labelExtractor={(item) => item.name} items={reportBranches}>
                            </SelectModal>
                        </View>
                        <View className="w-full mb-4 px-2">
                            <View className="w-full mb-4 flex flex-row gap-2">
                                <View className='border border-gray-300 rounded w-1/2 p-2 items-center'>
                                    <Text className='text-gray-700 font-bold'>Gross Sales</Text>
                                    <Text className='text-[#fe6500]'>{formatCurrency(salesItemData?.grossSales || 0)}</Text>
                                </View>
                                <View className='border border-gray-300 rounded w-1/2 p-2 items-center'>
                                    <Text className='text-gray-700 font-bold'>Delivery Fee</Text>
                                    <Text className='text-[#fe6500]'>{formatCurrency(salesItemData?.deliveryFee || 0)}</Text>
                                </View>
                            </View>
                            <View className="w-full mb-4 flex flex-row gap-2">
                                <View className='border border-gray-300 rounded w-1/2 p-2 items-center'>
                                    <Text className='text-gray-700 font-bold'>Discounts</Text>
                                    <Text className='text-[#fe6500]'>{formatCurrency(salesItemData?.totalDiscount || 0)}</Text>
                                </View>
                                <View className='border border-gray-300 rounded w-1/2 p-2 items-center'>
                                    <Text className='text-gray-700 font-bold'>Net Sales</Text>
                                    <Text className='text-[#fe6500]'>{formatCurrency(salesItemData?.netSales || 0)}</Text>
                                </View>
                            </View>
                            <View className="w-full mb-4 flex flex-row gap-2">

                                <View className='border border-gray-300 rounded w-1/2 p-2 items-center'>
                                    <Text className='text-gray-700 font-bold'>Item Cost</Text>
                                    <Text className='text-[#fe6500]'>{formatCurrency(salesItemData?.itemCost || 0)}</Text>
                                </View>
                                <View className='border border-gray-300 rounded w-1/2 p-2 items-center'>
                                    <Text className='text-gray-700 font-bold'>Net Profit</Text>
                                    <Text className='text-[#fe6500]'>{formatCurrency(salesItemData?.grossProfit || 0)}</Text>
                                </View>
                            </View>

                        </View>

                        {(filteredData && filteredData[0]?.label != null) ? (
                            filteredData.length === 1 ? (
                                <View className="w-full items-center mt-4">
                                    <Text className="text-gray-500 text-sm">Not enough data</Text>
                                </View>
                            ) : (
                                <LineChart
                                    data={filteredData}
                                    width={screenWidth - 40}
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
                                    initialSpacing={40}
                                    endSpacing={20}
                                    dataPointsWidth={20}
                                    spacing={calculatedSpacing}
                                    textColor="black"

                                />
                            )
                        ) : (
                            <View className="w-full items-center mt-4">
                                <Text className="text-gray-500 text-sm">No transactions available</Text>
                            </View>
                        )}
                    </View>
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