import React from "react";
import {
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { XCircle } from "react-native-feather";

interface SelectModalProps<T> {
    visible: boolean;
    title: string;
    onClose: () => void;
    onSelect: (item: T) => void;
    items: T[];
    keyExtractor: (item: T) => string;
    labelExtractor: (item: T) => string;
}
const SelectModal = <T,>({
    visible,
    title,
    onClose,
    onSelect,
    items,
    keyExtractor,
    labelExtractor,
}: SelectModalProps<T>) => {
    return (
        <Modal transparent visible={visible} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-center items-center bg-black/40 px-4">
                    <View className="bg-white rounded-lg w-full max-w-md shadow-md">
                        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                            <Text className="text-lg font-semibold">{title}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <XCircle width={24} height={24} />
                            </TouchableOpacity>
                        </View>

                        <View className="max-h-[60vh]">
                            <FlatList
                                data={items}
                                keyExtractor={keyExtractor}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className="p-4 border-b border-gray-200"
                                        onPress={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                    >
                                        <Text className="text-base">{labelExtractor(item)}</Text>
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ flexGrow: 1 }}
                                keyboardShouldPersistTaps="handled"
                                scrollEnabled={items.length > 5}
                            />
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
export default SelectModal;
