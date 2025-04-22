import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

type Props = {
    visible: boolean;
    onDone: (date: Date) => void;
    onCancel: () => void;
    initialDate?: Date;
};

const MonthYearPicker: React.FC<Props> = ({ visible, onDone, onCancel, initialDate }) => {
    const now = new Date();
    const initDate = initialDate || now;

    const [selectedMonth, setSelectedMonth] = useState(initDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(initDate.getFullYear());

    const years = Array.from({ length: 50 }, (_, i) => now.getFullYear() - i);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleDone = () => {
        const date = new Date(selectedYear, selectedMonth, 1);
        onDone(date);
    };

    return (
        <Modal transparent visible={visible}>
            <View className="flex-1 justify-center items-center bg-black/40 px-4">
                <View className="bg-white rounded-lg w-full max-w-md shadow-md">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                        <Text className="text-lg font-semibold">SELECT MONTH AND YEAR</Text>
                    </View>
                    <View className="flex-row justify-between w-full px-2">
                        <View className="w-1/2">
                            <Picker
                                selectedValue={selectedMonth}
                                onValueChange={(value) => setSelectedMonth(value)}
                            >
                                {months.map((month, index) => (
                                    <Picker.Item label={month} value={index} key={index} />
                                ))}
                            </Picker>
                        </View>
                        <View className="w-1/2">
                            <Picker
                                selectedValue={selectedYear}
                                onValueChange={(value) => setSelectedYear(value)}
                            >
                                {years.map((year) => (
                                    <Picker.Item label={`${year}`} value={year} key={year} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View className="flex-row justify-end gap-2 pb-2 w-full mt-2">
                        <TouchableOpacity onPress={onCancel} className="px-4 py-2 bg-gray-200 rounded">
                            <Text className="text-black">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDone} className="px-4 py-2 bg-orange-500 rounded">
                            <Text className="text-white">Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default MonthYearPicker;
