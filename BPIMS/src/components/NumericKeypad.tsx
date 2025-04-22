import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Delete } from 'react-native-feather';

type NumericKeypadProps = {
    onPress: (value: string) => void;
    onBackspace: () => void;
};

const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '<'],
];

export default function NumericKeypad({ onPress, onBackspace }: NumericKeypadProps) {
    return (
        <View className="p-4 rounded-2xl w-full">
            {keys.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-between border-t border-gray-300">
                    {row.map((key) => (
                        <TouchableOpacity
                            key={key}
                            className="w-20 h-20 justify-center items-center"
                            onPress={() => (key === '<' ? onBackspace() : onPress(key))}
                        >
                            {key === '<' ? (
                                <Delete height={28} width={28} color="#fe6500" />
                            ) : (
                                <Text className="text-2xl font-bold text-gray-800">{key}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ))}

        </View>
    );
}