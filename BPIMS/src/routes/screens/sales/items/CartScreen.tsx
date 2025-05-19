import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2 } from 'react-native-feather';
import ExpandableText from '../../../../components/ExpandableText';
import NumericKeypad from '../../../../components/NumericKeypad';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { ItemStackParamList } from '../../../navigation/navigation';
import {
  deleteAllCartItems,
  getCart,
  removeCartItem,
  updateDeliveryFee,
  updateDiscount,
  updateItemQuantity,
} from '../../../services/salesRepo';
import { Cart, CartItems } from '../../../types/salesType';

type Props = NativeStackScreenProps<ItemStackParamList, 'Cart'>;

const CartScreen = React.memo(({ route }: Props) => {
  const user = route.params.user;
  const [cartItems, setCartItems] = useState<CartItems[]>([]);
  const [cart, setCart] = useState<Cart>();
  const [isInputMode, setInputMode] = useState(false);
  const [doubleQuantity, setDoubleQuantity] = useState<string>('0.00');
  const [quantity, setQuantity] = useState<string>('0');
  const [selectedItem, setSelectedItem] = useState<CartItems>();
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();
  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getCart();
      setCartItems(result.data.cartItems);
      setCart(result.data.cart);
      if (result.data.cartItems.length === 0) {
        navigation.navigate('Item');
      }
      setLoading(false)
    }
    finally {
      setLoading(false)
    }
  }, [navigation]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const handleDelete = useCallback(async () => {
    try {
      setButtonLoading(true);
      await deleteAllCartItems();
      navigation.navigate('Item');
      setButtonLoading(false);
    }
    finally {
      setButtonLoading(false);
    }
  }, [navigation]);

  const updateItem = useCallback(
    async (cartItem: CartItems | undefined) => {
      try {
        if (!cartItem) return;

        setButtonLoading(true);
        const quantityToUpdate = cartItem.sellByUnit
          ? Number(quantity)
          : Number(doubleQuantity);
        await updateItemQuantity(cartItem.id, quantityToUpdate);
        await fetchCartItems();
        setSelectedItem(undefined);
        setQuantity('0');
        setDoubleQuantity('0.00');
        setInputMode(false);
        setButtonLoading(false);
      }
      finally {
        setButtonLoading(false);
      }
    },
    [quantity, doubleQuantity, fetchCartItems]
  );

  const openInput = useCallback((cartItem: CartItems) => {
    setInputMode(true);
    setSelectedItem(cartItem);
    setMessage(null)
    if (cartItem.sellByUnit) {
      setQuantity(Math.round(cartItem.quantity).toString());
    } else {
      setDoubleQuantity(cartItem.quantity.toString());
    }
  }, []);

  const applyFee = useCallback(() => {
    if (user)
      navigation.navigate('DeliveryFee', {
        deliveryFee: cart?.deliveryFee?.toString() || '0.00',
        user
      });
  }, [cart, navigation, user]);

  const applyDiscount = useCallback(() => {
    if (cart) {
      navigation.navigate('Discount', {
        discount: cart?.discount?.toString() || '0.00',
        subTotal: cart.subTotal, user
      });
    }
  }, [cart, navigation, user]);

  const removeDiscount = useCallback(async () => {
    await updateDiscount(null);
    await fetchCartItems();
  }, [fetchCartItems]);

  const removeFee = useCallback(async () => {
    await updateDeliveryFee(null);
    await fetchCartItems();
  }, [fetchCartItems]);

  const handlePayment = useCallback(() => {
    navigation.navigate('Payment', { user });
  }, [navigation, user]);

  const removeItem = useCallback(
    async (id: number | undefined) => {
      try {
        if (!id) return;
        setButtonLoading(true);
        await removeCartItem(id);
        await updateDiscount(null);
        await fetchCartItems();
        setSelectedItem(undefined);
        setQuantity('0');
        setDoubleQuantity('0.00');
        setInputMode(false);
        setButtonLoading(false);
      }
      finally {
        setButtonLoading(false);
      }
    },
    [fetchCartItems]
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      if (selectedItem?.branchQty) {
        if (!selectedItem?.sellByUnit) {
          let current = doubleQuantity.replace('.', '');
          current += key;
          const formatted = (parseInt(current) / 100).toFixed(2);
          if (Number(formatted) <= selectedItem?.branchQty) {
            setDoubleQuantity(formatted);
            setMessage(null)
          }
          else {
            setMessage(`Quantity exceeds available stock. Available stock: ${selectedItem.sellByUnit ? Math.round(selectedItem.branchQty) : selectedItem.branchQty}`);
          }
        } else {
          let current = quantity.toString();
          if (current === '0') {
            current = key;
          } else {
            current += key;
          }
          if (Number(current) <= selectedItem?.branchQty) {
            setQuantity(current);
            setMessage(null)
          }
          else {
            setMessage(`Quantity exceeds available stock. Available stock: ${selectedItem.sellByUnit ? Math.round(selectedItem.branchQty) : selectedItem.branchQty}`);
          }
        }
      }
    },
    [selectedItem, quantity, doubleQuantity]
  );

  const handleBackspace = useCallback(() => {
    if (!selectedItem?.sellByUnit) {
      let current = doubleQuantity.replace('.', '');
      current = current.slice(0, -1) || '0';
      const formatted = (parseInt(current) / 100).toFixed(2);
      setDoubleQuantity(formatted);
    } else {
      let current = quantity.toString();
      current = current.slice(0, -1) || '0';
      setQuantity(current);
    }
  }, [selectedItem, quantity, doubleQuantity]);

  const totalAmount = useMemo(() => {
    const subTotal = Number(cart?.subTotal) || 0;
    const discount = Number(cart?.discount) || 0;
    const deliveryFee = Number(cart?.deliveryFee) || 0;
    return (subTotal - discount + deliveryFee).toFixed(2);
  }, [cart]);

  if (isInputMode) {
    return (
      <View style={{ flex: 1 }}>
        <TitleHeaderComponent isParent={false} title={selectedItem?.name || ""} onPress={() => setInputMode(false)} userName=''></TitleHeaderComponent>

        <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
        <View className="items-center mt-4">
          <View className="flex flex-column items-center">
            <Text className="text-lg font-bold text-gray-600 px-3 mt-4">
              Enter Quantity Sold
            </Text>
            <View className="flex flex-row items-center mt-6   border-b-2 border-[#fe6500] px-4 justify-center">
              <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                {selectedItem?.sellByUnit ? quantity : doubleQuantity}
              </Text>
            </View>
            {message !== null && (
              <Text className="text-[10px] font-bold text-red-500">{message}</Text>)
            }
          </View>
          <TouchableOpacity
            disabled={buttonLoading}
            className="px-3 mt-12"
            onPress={() => removeItem(selectedItem?.id)}
          >
            <Text className="text-sm font-bold text-red-600">Remove Product</Text>
          </TouchableOpacity>
        </View>
        <View className="absolute bottom-0 w-full items-center pb-3 pt-2">
          <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
          <TouchableOpacity
            disabled={buttonLoading}
            onPress={() => updateItem(selectedItem)}
            className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${selectedItem?.sellByUnit
              ? quantity === '0'
                ? 'bg-gray border-2 border-[#fe6500]'
                : 'bg-[#fe6500]'
              : doubleQuantity === '0.00'
                ? 'bg-gray border-2 border-[#fe6500]'
                : 'bg-[#fe6500]'
              }`}
          >
            <View className="flex-1 items-center">
              <Text
                className={`text-lg font-bold ${selectedItem?.sellByUnit
                  ? quantity === '0'
                    ? 'text-[#fe6500]'
                    : 'text-white'
                  : doubleQuantity === '0.00'
                    ? 'text-[#fe6500]'
                    : 'text-white'
                  }`}
              >
                Save
              </Text>
            </View>
            {buttonLoading && (
              <ActivityIndicator color={"white"} size={'small'} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex flex-1 h-[100%]">
      <TitleHeaderComponent title='Cart' isParent={false} userName={user.name} onPress={() => navigation.navigate('Item')}></TitleHeaderComponent>

      <View className="w-full h-[2px] bg-gray-500 mb-2"></View>
      {loading ? (
        <View className="py-2">
          <ActivityIndicator size="small" color="#fe6500" />
          <Text className="text-center text-[#fe6500]">Preparing Cart...</Text>
        </View>
      ) : (
        <View>
          <View className="items-center bg-gray relative mt-1 h-[60%]">
            <View className="justify-between w-[90%] mb-5">
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {cartItems.length > 0 ? (
                  cartItems.map((cartItem, index) => (
                    <View key={index} className="py-2 border-b border-gray-300 w-full">
                      <View className="flex flex-row items-center justify-between mt-1">
                        <TouchableOpacity
                          className="w-[15%] items-center"
                          onPress={() => openInput(cartItem)}
                        >
                          <Text className="text-lg text-gray-800">
                            {cartItem.sellByUnit
                              ? Math.round(cartItem.quantity)
                              : cartItem.quantity}
                          </Text>
                        </TouchableOpacity>

                        <View className="flex-column items-start justify-between w-[60%]">
                          <ExpandableText text={cartItem.name}></ExpandableText>
                          <Text className="text-xs text-gray-600">₱ {cartItem.price}</Text>
                        </View>
                        <View className="w-[25%]">
                          <Text className="text-sm text-gray-800 text-right">
                            ₱ {(cartItem.price * cartItem.quantity).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text className="text-center text-sm text-gray-500">
                    Your cart is empty
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
          {cart &&
            (
              <View className="w-full bg-gray-300 mb-2 h-[30%]">
                <Text className="text-right text-base font-bold text-black px-3 mr-4 mt-4">
                  SUB TOTAL: ₱ {cart?.subTotal}
                </Text>

                {cart?.deliveryFee ? (
                  <View className="flex flex-row items-center justify-end px-3 mt-4 space-x-2 mr-3">
                    <TouchableOpacity onPress={removeFee} className="p-1">
                      <Trash2 color="red" height={16} width={16} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={applyFee} className="p-1">
                      <Text className="text-sm text-[#fe6500]">{`DELIVERY FEE: ₱ ${cart.deliveryFee}`}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={applyFee} className="mt-2 p-2">
                    <Text className="text-right text-sm text-[#fe6500] mr-4">
                      Add Delivery Fee
                    </Text>
                  </TouchableOpacity>
                )}

                {cart?.discount ? (
                  <View className="flex flex-row items-center justify-end px-3 mt-4 space-x-2 mr-3">
                    <TouchableOpacity onPress={removeDiscount} className="p-1">
                      <Trash2 color="red" height={16} width={16} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={applyDiscount} className="p-1">
                      <Text className="text-sm text-[#fe6500]">{`DISCOUNT: ₱ ${cart.discount}`}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={applyDiscount} className="mt-1 p-2">
                    <Text className="text-right text-sm text-[#fe6500] mr-4">
                      Add Discount
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  disabled={buttonLoading}
                  onPress={handleDelete}
                  className="p-3 mt-8"
                >
                  <Text className="text-right text-base text-red-500 font-bold mr-4">
                    CLEAR CART
                  </Text>
                </TouchableOpacity>
              </View>
            )}
        </View>
      )}
      {cart && (
        < View className="items-center absolute bottom-0 left-0 right-0 pb-2 h-[8%]">
          <TouchableOpacity
            className={`w-[95%] rounded-xl p-3 items-center bg-[#fe6500] justify-center flex-row`}
            onPress={handlePayment}
            disabled={buttonLoading == true}
          >
            <View className="flex-1 items-center">
              <Text className="font-bold text-center text-white text-lg">
                TOTAL: ₱ {totalAmount}
              </Text>
            </View>
            {buttonLoading && <ActivityIndicator color="white" size="small" />}
          </TouchableOpacity>
        </View>
      )}
    </View >
  );
});

export default CartScreen;