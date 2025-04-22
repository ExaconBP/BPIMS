import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, ChevronLeft, Trash2 } from 'react-native-feather';

interface TitleHeaderProps {
    isParent: boolean;
    title: string;
    userName: string;
    onPress: () => void;
    showTrash?: boolean | null;
    onTrashPress?: () => void;
}

const TitleHeaderComponent: React.FC<TitleHeaderProps> = ({
    isParent,
    title,
    userName,
    onPress,
    showTrash,
    onTrashPress
}) => {
    const getTitleStyle = (text: string) => {
        if (text.length > 30) {
            return 'text-[10px]';
        } else if (text.length > 20) {
            return 'text-xs';
        } else {
            return 'text-sm';
        }
    };

    const getUserNameStyle = (name: string) => {
        return name.length > 7 ? 'text-[10px]' : 'text-xs';
    };

    return (
        <View className="top-3 flex bg-gray flex-row items-center px-2 mb-5">
            <TouchableOpacity className="ml-2" onPress={onPress}>
                {isParent ? <Menu width={20} height={20} color="#fe6500" /> : <ChevronLeft width={20} height={20} color="#fe6500" />}
            </TouchableOpacity>

            <View className="absolute w-full items-center">
                <Text className={`text-black font-bold ${getTitleStyle(title)}`}>{title.toUpperCase()}</Text>
            </View>

            <View className="ml-auto flex flex-row items-center">
                {showTrash ? (
                    <TouchableOpacity onPress={onTrashPress} className="mr-2">
                        <Trash2 width={20} height={20} color="#fe6500" />
                    </TouchableOpacity>
                ) : userName ? (
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text className={`text-white ${getUserNameStyle(userName)}`}>
                            {userName.split(' ')[0].toUpperCase()}
                        </Text>
                    </View>
                ) : (
                    null
                )}
            </View>
        </View>
    );
};

export default TitleHeaderComponent;
