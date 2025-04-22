import LottieView from 'lottie-react-native';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

interface LottieLoaderProps {
  message?: string;
}

const FullScreenLoader: React.FC<LottieLoaderProps> = ({ message = 'Loading...' }) => {
  const bounceAnimation1 = useRef(new Animated.Value(0)).current;
  const bounceAnimation2 = useRef(new Animated.Value(0)).current;
  const bounceAnimation3 = useRef(new Animated.Value(0)).current;

  const animateDots = useCallback(() => {
    Animated.sequence([
      Animated.timing(bounceAnimation1, {
        toValue: -10,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnimation1, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnimation2, {
        toValue: -10,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnimation2, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnimation3, {
        toValue: -10,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnimation3, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceAnimation1, bounceAnimation2, bounceAnimation3]);

  useEffect(() => {
    animateDots();
    const interval = setInterval(animateDots, 600);

    return () => clearInterval(interval);
  }, [animateDots]);

  return (
    <View className="flex-1 bg-gray-100 justify-center items-center mb-80">
      <View className="relative items-center">
        <LottieView
          source={require('./LoaderAnimation.json')}
          autoPlay
          loop
          style={styles.lottie}
          hardwareAccelerationAndroid
        />

        <Image
          source={require('./images/iconorig.png')}
          className="w-24 h-28 absolute mt-10"
        />

        <View className="flex-row justify-center items-center mt-48 absolute">
          <Text className="text-lg text-[#fe6500]">
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lottie: {
    width: 200,
    height: 200,
    transform: [{ scaleX: -1 }], 
  },
});

export default memo(FullScreenLoader);