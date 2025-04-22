import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Lock, User } from 'react-native-feather';
import { RootStackParamList } from '../navigation/navigation';
import { loginUser } from '../services/loginRepo';
import { getUserDetails, setUserLogIn } from '../utils/auth';

const HomeScreen = React.memo(() => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkLogin = async () => {
        const response = await getUserDetails();
        if (response) {
          if (response.departmentId === 1) {
            navigation.navigate('SalesStack');
          }
          else if (response.departmentId === 2) {
            navigation.navigate('HeadquarterStack')
          }
          else if (response.departmentId === 3) {
            navigation.navigate('WarehouseStack')
          }
          else if (response.departmentId === 4) {
            navigation.navigate('CentralStack')
          }
          else {
            setLoading(false)
            navigation.navigate('Home');
          }
        }
        else {
          setLoading(false)
        }
      };

      checkLogin();
    }, [navigation])
  );

  const handleLogIn = useCallback(async () => {
    if (!username || !password) {
      Alert.alert(
        'Input Error',
        'Please enter both username and password to proceed.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
      return;
    }

    setIsLoggingIn(true);

    try {
      const result = await loginUser(username, password);
      if (result.isSuccess) {
        await setUserLogIn(result.data);
        if (result.data.departmentId === 1) {
          navigation.navigate('SalesStack');
        } else if (result.data.departmentId === 2) {
          navigation.navigate('HeadquarterStack');
        } else if (result.data.departmentId === 3) {
          navigation.navigate('WarehouseStack');
        }
        else if (result.data.departmentId === 4) {
          navigation.navigate('CentralStack');
        }
        else {
          navigation.navigate('Home');
        }
      } else {
        Alert.alert(
          'Login Failed',
          result.message,
          [{ text: 'OK' }],
          { cancelable: false }
        );
        setUsername('');
        setPassword('');
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [username, password, navigation]);

  if (loading) {
    return (
      <View className="flex flex-1 justify-center items-center bg-gray-100">
        <Image source={require('../../components/images/iconorig.png')} className="w-32 h-40 mb-4" />
        <Text className='font-bold text-2xl text-gray-900'>BP-IMS</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-1 justify-center items-center bg-gray-100">
      <Image source={require('../../components/images/iconorig.png')} className="w-32 h-40 mb-4" />
      <Text className="text-2xl font-bold text-black mb-4">BP - IMS</Text>

      <View className="flex-row items-center mb-5 w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 px-4">
        <View className="bg-[#fe6500] w-10 h-10 rounded-full justify-center items-center mr-4">
          <User height={20} width={20} color="#ffffff" />
        </View>
        <TextInput
          className="flex-1 h-10 border border-[#fe6500] px-4 rounded-full text-center text-black"
          placeholder="Username"
          placeholderTextColor="#8a8a8a"
          value={username}
          onChangeText={setUsername}
          selectionColor="#fe6500"
        />
      </View>

      <View className="flex-row items-center mb-5 w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 px-4">
        <View className="bg-[#fe6500] w-10 h-10 rounded-full justify-center items-center mr-4">
          <Lock height={20} width={20} color="#ffffff" />
        </View>
        <TextInput
          className="flex-1 h-10 border border-[#fe6500] px-4 rounded-full text-center text-black"
          placeholder="Password"
          placeholderTextColor="#8a8a8a"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          selectionColor="#fe6500"
        />
      </View>

      <View className="flex-row justify-center items-center w-full">
        <TouchableOpacity
          className="w-1/2 bg-[#fe6500] py-3 rounded-full items-center flex-row justify-center"
          onPress={handleLogIn}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <>
              <Text className="text-white font-bold text-center mr-2">LOGGING IN</Text>
              <ActivityIndicator color="white" size="small" />
            </>
          ) : (
            <Text className="text-white font-bold text-center">LOG IN</Text>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
});

export default HomeScreen;