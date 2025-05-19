import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { BranchHQParamList } from '../../../navigation/navigation';
import { saveBranch, setBranchInactive } from '../../../services/userRepo';
import { ObjectDto } from '../../../types/userType';

type Props = NativeStackScreenProps<BranchHQParamList, 'BranchView'>;

const BranchViewScreen = React.memo(({ route }: Props) => {
    let { id, name, branches, user } = route.params;

    const [branch, setBranch] = useState<ObjectDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const navigation = useNavigation<NativeStackNavigationProp<BranchHQParamList>>();
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [nameExists, setNameExists] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                if (id == 0) {
                    setBranch({
                        id: 0,
                        name: ''
                    });
                } else {
                    setBranch({
                        id: id,
                        name: name
                    });
                }
                setLoading(false);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);


    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleNameChange = useCallback((text: string) => {
        setBranch((prevCustomer) => ({
            ...(prevCustomer ?? {
                id: 0,
                name: ''
            }),
            name: text,
        }));
        if (branch) {
            const exists = branches.some(c => c.name.toLowerCase() === text.toLowerCase() && c.id !== branch.id);
            setNameExists(exists);
        }
        else if (!branch) {
            const exists = branches.some(c => c.name.toLowerCase() === text.toLowerCase());
            setNameExists(exists);
        }
    }, [branch]);

    function validateForm() {
        let isFormValid = false;
        if (branch) {
            isFormValid = (
                branch?.name !== ''
            );
        }
        setIsValid(isFormValid);
    }

    useEffect(() => {
        validateForm();
    }, [branch]);

    const handleSave = async () => {
        try {
            if (branch) {
                setButtonLoading(true);
                await saveBranch(branch.id, branch.name)
                navigation.push('Branches')
                setButtonLoading(false);
            }
        }
        finally {
            setButtonLoading(false);
        }
    };

    const branchInactive = async () => {
        try {
            if (branch) {
                setButtonLoading(true);

                if (branch.id === 0) {
                    return;
                }

                Alert.alert(
                    "Confirm Branch Deletion",
                    "Are you sure you want to delete this branch?",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => setButtonLoading(false)
                        },
                        {
                            text: "Confirm",
                            onPress: async () => {
                                await setBranchInactive(branch.id);
                                navigation.push('Branches');
                                setButtonLoading(false);
                            }
                        }
                    ]
                );
            }
        } finally {
            setButtonLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex flex-1 justify-center items-center mt-10">
                <ActivityIndicator size="small" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">Getting Branch Details...</Text>
            </View>
        );
    }

    return (
        <View className="flex flex-1 px-4">
            <TitleHeaderComponent showTrash={branch && branch.id != 0} onTrashPress={() => branchInactive()} isParent={false} userName={user.name || ""} title={branch?.id !== 0 ? (name) : 'New Branch'} onPress={() => navigation.goBack()}></TitleHeaderComponent>

            <View className="w-full bg-gray-200 h-[2px] w-full mb-4"></View>

            <View className="w-full pr-2 mb-3 ">
                <Text className="text-gray-600 mb-1">Name</Text>
                <TextInput
                    value={branch?.name || ''}
                    onChangeText={(text) => handleNameChange(text)}
                    className="border-b border-gray-400 py-2 text-black"
                    placeholder="User Name"
                    placeholderTextColor="gray"
                    selectionColor="#fe6500"
                />
                {nameExists && (
                    <Text className="text-red-500 text-xs">
                        This name already exists. Please use a different name.
                    </Text>
                )}
            </View>

            {!keyboardVisible && (
                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                    <TouchableOpacity
                        onPress={handleSave}
                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid || loading ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                        disabled={!isValid || loading}
                    >
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`font-bold text-lg ${!isValid || loading ? 'text-[#fe6500]' : 'text-white'}`}>SAVE</Text>

                        </View>
                        {buttonLoading && (
                            <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
});

export default BranchViewScreen;
