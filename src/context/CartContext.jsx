import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        item => item.id === action.payload.id && item.color === action.payload.color
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && item.color === action.payload.color
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          item => !(item.id === action.payload.id && item.color === action.payload.color)
        ),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id && item.color === action.payload.color
            ? { ...item, quantity: Math.max(action.payload.minOrder || 1, action.payload.quantity) }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

const getItemPrice = (item) => {
  if (!item.bulkPricing) return item.wholesalePrice;
  const tier = [...item.bulkPricing].reverse().find(t => item.quantity >= t.qty);
  return tier ? tier.price : item.wholesalePrice;
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = (product, quantity, color) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        wholesalePrice: product.wholesalePrice,
        bulkPricing: product.bulkPricing,
        minOrder: product.minOrder,
        color,
        quantity,
        brand: product.brand.name,
      },
    });
  };

  const removeItem = (id, color) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id, color } });
  };

  const updateQuantity = (id, color, quantity, minOrder) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, color, quantity, minOrder } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      getItemPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
