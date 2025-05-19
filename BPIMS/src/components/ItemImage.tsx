import React from 'react';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getItemImage } from '../routes/services/itemsHQRepo';
import { Camera } from 'react-native-feather';

interface ItemImageProps {
    imagePath: string | null;
}

const ItemImage: React.FC<ItemImageProps> = React.memo(({ imagePath }) => {
    return imagePath ? (
        <FastImage
            source={{ uri: getItemImage(imagePath), priority: FastImage.priority.high, cache:FastImage.cacheControl.web }}
            className="w-24 h-24 rounded-lg"
        />
    ) : (
        <View className="w-full h-24 bg-gray-500 rounded-lg justify-center items-center">
            <Camera color="white" height={32} width={32} />
            <Text className="text-white text-xs mt-1">No Image</Text>
        </View>
    );
});

export default ItemImage;
