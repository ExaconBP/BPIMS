import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    PermissionsAndroid,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CreditCard, Trash2, X } from 'react-native-feather';
import ThermalPrinterModule from 'react-native-thermal-printer';
import ExpandableText from '../../../../components/ExpandableText';
import PDFIcon from '../../../../components/icons/PDFIcon';
import PrinterIcon from '../../../../components/icons/PrinterIcon';
import { base64Image } from '../../../../components/images/base64Image';
import { CentralTransactionsParamList, SalesReportParamList } from '../../../navigation/navigation';
import { getTransactionHistory, payPendingTransaction } from '../../../services/centralRepo';
import { generateReceipt, voidTransaction } from '../../../services/salesRepo';
import { TransactionDto, TransactionItemsDto } from '../../../types/centralType';
import { formatShortDateTimePH, formatTransactionDate, truncateName, truncateShortName } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<CentralTransactionsParamList, 'TransactionHistory'>;

const TransactionHistoryScreen = React.memo(({ route }: Props) => {
    const { transactionId } = route.params;
    const [transaction, setTransaction] = useState<TransactionDto | null>(null);
    const [transactionItems, setTransactionItems] = useState<TransactionItemsDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<NativeStackNavigationProp<SalesReportParamList>>();
    const [printLoadig, setPrintLoading] = useState<boolean>(false);
    const [isPayModalVisible, setPayModalVisible] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchTransaction = useCallback(async () => {
        try {
            setLoading(true);
            if (transactionId) {
                const response = await getTransactionHistory(transactionId);
                if (response) {
                    setTransaction(response.data.transaction);
                    setTransactionItems(response.data.transactionItems);
                    setPaymentAmount(response.data.transaction.totalAmount.toString())
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch transaction details.');
        } finally {
            setLoading(false);
        }
    }, [transactionId]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    const transactionDate = useMemo(() => {
        if (!transaction?.transactionDate) return '';
        return new Date(transaction.transactionDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        }).replace(',', '');
    }, [transaction?.transactionDate]);

    const subTotal = useMemo(() => {
        return transactionItems.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2);
    }, [transactionItems]);

    const totalAmount = useMemo(() => {
        const deliveryFee = transaction?.deliveryFee || 0;
        const discount = transaction?.discount || 0;
        return (Number(subTotal) + Number(deliveryFee) - Number(discount)).toFixed(2);
    }, [subTotal, transaction?.deliveryFee, transaction?.discount]);

    const handleGeneratePDF = useCallback(async () => {
        if (!transaction || !transactionItems.length) {
            Alert.alert('Error', 'Transaction data is incomplete.');
            return;
        }
        try {
            await generateReceipt(transaction.id, transaction);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate PDF.');
        }
    }, [transaction, transactionItems]);

    async function requestBluetoothPermission() {
        try {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            return granted;
        } catch (err) {
            console.warn(err);
            return null;
        }
    }


    async function printReceipt() {
        try {
            await requestBluetoothPermission();
            setPrintLoading(true)

            const itemsText = transactionItems
                .map(
                    (item) =>
                        `[L]${item.sellByUnit ? Math.round(Number(item.quantity)).toFixed(0) : Number(item.quantity).toFixed(2)}X${truncateName(item.name)}\n` +
                        `[L]    PHP ${Number(item.price).toFixed(2)} [R] PHP ${Number(item.amount).toFixed(2)}\n`
                )
                .join('');
            const text =
                '[L]\n' +
                `[C]<img>${base64Image}</img>\n` +
                '[L]\n' +
                "[C]<b>Balay Panday Hardware</b>\n" +
                '[L]\n' +
                `[L]<font size='normal'>Date: ${formatShortDateTimePH(transaction?.transactionDate.toString() || "")}</font>\n` +
                `[L]<font size='normal'>Cashier: ${transaction?.cashier}</font>\n` +
                `[L]<font size='normal'>Mode of Payment: Cash</font>\n` +
                `[L]<font size='normal'>Number of Items: ${transactionItems.length}</font>\n` +
                `[L]<font size='normal'>Slip Number: ${transaction?.slipNo}</font>\n` +
                `[L]<font size='normal'>Branch: ${transaction?.branch}</font>\n` +
                '[C]--------------------------------\n' +
                `[L]<font size='normal'>Store Pick-Up</font>\n` +
                '[C]--------------------------------\n' +
                itemsText +
                '[C]--------------------------------\n' +
                `[L]<font size='normal'>Sub Total: [R] PHP ${(Number(subTotal).toFixed(2))}</font>\n` +
                `[L]<font size='normal'>Total Amount: [R] PHP ${Number(transaction?.totalAmount).toFixed(2)}</font>\n` +
                '[C]--------------------------------\n' +
                `[L]<font size='normal'>Cash: [R] PHP ${Number(transaction?.amountReceived).toFixed(2)}</font>\n` +
                `[L]<font size='normal'>Change: [R] PHP ${(Number(transaction?.amountReceived || 0) - Number(transaction?.totalAmount || 0)).toFixed(2)}</font>\n` +
                '[C]--------------------------------\n' +
                `[C]<font size='normal'>This is an Order Slip</font>\n` +
                `[C]<font size='normal'>Ask for Sales Invoice at the Receipt Counter.</font>\n` +
                '[L]\n';
            await ThermalPrinterModule.printBluetooth({
                payload: text,
                printerWidthMM: 48,
                printerNbrCharactersPerLine: 32,
                autoCut: true
            });
        } catch (error) {
            Alert.alert("Printing Error", "Failed to print receipt. Check if the printer is on and it is paired with the device.");
        }
        finally { setPrintLoading(false) }
    }

    const handleVoid = useCallback(() => {
        Alert.alert(
            'Confirm Void',
            'Are you sure you want to void this transaction?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        if (transaction) {
                            setLoading(true);
                            await voidTransaction(transaction.id);
                            navigation.goBack()
                            setLoading(false)
                        }
                    }
                }
            ]
        );
    }, [transaction]);

    const confirmPay = async () => {
        if (!transaction) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount.");
            return;
        }

        setLoading(true);
        await payPendingTransaction(transaction.id, amount);
        setLoading(false);
        setPayModalVisible(false);
        navigation.goBack();
    };

    if (loading) {
        return (
            <View className='flex flex-1 justify-center items-center mt-10'>
                <ActivityIndicator size="large" color="#fe6500" />
            </View>
        );
    }

    if (printLoadig) {
        return (
            <View className='flex flex-1 justify-center items-center mt-10'>
                <ActivityIndicator size="small" color="#fe6500" />
                <Text className="text-center text-[#fe6500]">Printing Receipt...</Text>
            </View>
        );
    }

    if (isPayModalVisible) {
        return (
            <Modal
                transparent
                visible={isPayModalVisible}
                animationType="slide"
                onRequestClose={() => setPayModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white w-[85%] rounded-xl p-6">
                        <Text className="text-lg font-semibold mb-2">Enter Payment Amount</Text>

                        <TextInput
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChangeText={(text) => {
                                const formatted = text.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                const decimalIndex = formatted.indexOf('.');
                                const limited = decimalIndex >= 0
                                    ? formatted.substring(0, decimalIndex + 3)
                                    : formatted;
                                setPaymentAmount(limited);
                            }}
                            className="border border-gray-300 rounded px-4 py-2 mb-4"
                        />

                        <View className="flex-row justify-end space-x-2">
                            <TouchableOpacity
                                className="bg-gray-300 px-4 py-2 rounded"
                                onPress={() => setPayModalVisible(false)}
                            >
                                <Text>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`bg-[#fe6500] px-4 py-2 rounded ${totalAmount > paymentAmount ? "opacity-50" : ""}`}
                                onPress={confirmPay}
                                disabled={loading || totalAmount > paymentAmount}
                            >
                                <Text className="text-white font-semibold">Pay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    if (!transaction) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>No transaction data found.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <View className="flex-1 bg-gray-100 items-center mt-2">
                <View className="relative items-center w-full">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="absolute left-4 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                        <X height={26} width={26} />
                    </TouchableOpacity>
                    <View className="flex w-full px-4 flex-row justify-between mt-10">
                        <Text className="font-bold text-base text-gray-700 text-left">
                            Balay Panday{'\n'}Hardware
                        </Text>
                        <Text className="font-bold text-sm text-gray-700">SLIP# {transaction.slipNo}</Text>
                    </View>
                    <View className="flex w-full px-4 flex-row justify-between mt-2">
                        <View className="flex-1">
                            {transaction.customerName && (
                                <Text className="text-md text-gray-800 text-left">
                                    Customer: {transaction.customerName}
                                </Text>
                            )}
                            {!transaction.isPaid && (
                                <Text className="text-md text-red-600 text-left mr-2">
                                    Not Yet Paid
                                </Text>
                            )}
                        </View>
                        <Text className="text-md text-gray-800">{transactionDate}</Text>
                    </View>

                    <View className="justify-between w-[90%] mt-4">
                        <ScrollView className="h-[40%]" contentContainerStyle={{ flexGrow: 1 }}>
                            {transactionItems.map((item, index) => (
                                <View key={index} className="flex flex-row py-2">
                                    <Text className="w-1/6 text-[12px] text-gray-800 text-left">{item.sellByUnit ? Math.round(Number(item.quantity)).toFixed(0) : Number(item.quantity).toFixed(2)}</Text>
                                    <View className="w-1/2 text-gray-800 text-center">
                                        <ExpandableText text={item.name}></ExpandableText>
                                        <Text className="text-[12px] text-gray-600">₱ {item.price}</Text>
                                    </View>
                                    <Text className="w-2/6 text-xs text-gray-800 text-right">
                                        ₱ {Number(item.amount).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View className="w-full items-end mt-5">
                            <Text className="text-sm text-gray-700 text-left mb-1">
                                Sub Total : ₱ {subTotal}
                            </Text>
                            {transaction.deliveryFee && (
                                <Text className="text-sm text-gray-700 text-left mb-1">
                                    Delivery Fee : ₱ {transaction.deliveryFee}
                                </Text>
                            )}
                            {transaction.discount && (
                                <Text className="text-sm text-gray-700 text-left mb-1">
                                    Discount : ₱ {transaction.discount}
                                </Text>
                            )}
                            <Text className="font-bold text-sm text-gray-700 text-left mb-1">
                                TOTAL : ₱ {totalAmount}
                            </Text>
                            <Text className="text-xs text-gray-700 text-left mb-1">
                                Cash : ₱ {transaction.amountReceived}
                            </Text>
                            <Text className="text-xs text-gray-700 text-left">
                                Change: ₱ {(Number(transaction.amountReceived) - Number(transaction.totalAmount)).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View className="w-full h-[2px] bg-gray-500 mt-1 mb-2"></View>
                    <View className="w-full px-4 items-center mt-1">
                        <Text className="text-xs font-bold text-gray-700 text-center">
                            This is an Order Slip.{'\n'}Ask for an Official Receipt at the Receipt Counter.
                        </Text>
                        <Text className="text-xs text-gray-700 text-left">
                            {formatTransactionDate(transaction.transactionDate.toString())}
                        </Text>
                    </View>
                </View>
                <View
                    className="items-center absolute bottom-0 left-0 right-0 p-2 flex flex-row"
                    style={{ zIndex: 100 }}
                >
                    <TouchableOpacity
                        onPress={handleGeneratePDF}
                        className="w-[25%] rounded-l-xl p-2 items-center bg-gray-900 mr-[1px] flex flex-row justify-center"
                    >
                        <PDFIcon size={36} />
                        <Text className="font-bold text-white">PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={printReceipt}
                        className="w-[25%] p-3 items-center flex flex-row justify-center bg-gray-900 mr-[1px]"
                    >
                        <PrinterIcon size={28} />
                        <Text className="font-bold text-white ml-2">PRINT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setPayModalVisible(true)}
                        disabled={transaction.isPaid}
                        className={`w-[25%] mr-[1px] p-3 items-center flex flex-row justify-center ${transaction.isPaid ? 'bg-green-500 p-4' : 'bg-gray-900'
                            }`}
                    >
                        {transaction.isPaid ? (
                            <>
                                <Text className="font-bold text-white">PAID</Text>
                            </>
                        ) : (
                            <>
                                <CreditCard height={28} width={28} color="white" />
                                <Text className="font-bold text-white ml-2">PAY</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleVoid}
                        disabled={transaction.isVoided}
                        className={`w-[25%] rounded-r-xl p-3 items-center flex flex-row justify-center ${transaction.isVoided ? 'bg-red-500 p-4' : 'bg-gray-900'
                            }`}
                    >
                        {transaction.isVoided ? (
                            <>
                                <Text className="font-bold text-white">VOIDED</Text>
                            </>
                        ) : (
                            <>
                                <Trash2 height={28} width={28} color="white" />
                                <Text className="font-bold text-white ml-2">VOID</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </View>
            </View>
        </View>
    );
});

export default TransactionHistoryScreen;