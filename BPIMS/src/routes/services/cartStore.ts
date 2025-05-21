import { create } from 'zustand';
import { Cart, CartItems } from '../types/salesType';

interface CartState {
    cart: Cart | undefined;
    cartItems: CartItems[];
    subTotal: number;
    totalAmount: number;
    totalCartItems: number;

    setCart: (cart: Cart) => void;
    setCartItems: (items: CartItems[]) => void;
    addItem: (item: CartItems) => void;
    updateItem: (item: CartItems) => void;
    removeItem: (id: number) => void;
    clearCart: () => void;
    recalculateTotals: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    cart: undefined,
    cartItems: [],
    subTotal: 0,
    totalAmount: 0,
    totalCartItems: 0,

    setCart: (cart) => {
        set({ cart });
        get().recalculateTotals();
    },

    setCartItems: (items) => {
        set({ cartItems: items });
        get().recalculateTotals();
    },

    addItem: (item) => {
        const existing = get().cartItems.find(i => i.itemId === item.itemId);
        const updatedCart = existing
            ? get().cartItems.map(i =>
                i.itemId === item.itemId
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
            )
            : [...get().cartItems, item];

        set({ cartItems: updatedCart });
        get().recalculateTotals();
    },

    updateItem: (item) => {
        const updatedCart = get().cartItems.map(i =>
            i.id === item.id ? item : i
        );
        set({ cartItems: updatedCart });
        get().recalculateTotals();
    },

    removeItem: (id) => {
        const filtered = get().cartItems.filter(i => i.id !== id);
        set({ cartItems: filtered });
        get().recalculateTotals();
    },

    clearCart: () => {
        const currentCart = get().cart;
        set({
            cartItems: [],
            subTotal: 0,
            totalAmount: 0,
            totalCartItems: 0,
            cart: currentCart
                ? {
                    ...currentCart,
                    discount: 0,
                    deliveryFee: 0,
                    subTotal: 0,
                }
                : undefined,
        });
    },

    recalculateTotals: () => {
        const items = get().cartItems;
        const cart = get().cart;

        const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

        const deliveryFee = cart?.deliveryFee || 0;
        const discount = cart?.discount || 0;

        const totalAmount = subTotal + deliveryFee - discount;

        set({ subTotal, totalCartItems, totalAmount });
    },
}));
