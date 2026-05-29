import { useCallback, useEffect, useReducer } from "react";
import api from "../api/api";
import { useAuth } from "./useAuth";
import { CartContext } from "./cartContextValue";

const initialState = {
  cart: { items: [], subtotal: 0, totalItems: 0 },
  loading: false,
  error: null,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CART":
      return { ...state, cart: action.payload, loading: false, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const fetchCart = useCallback(async () => {
    if (!user) {
      dispatch({ type: "RESET" });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await api.get("/cart");
      dispatch({ type: "SET_CART", payload: res.data.cart });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.response?.data?.message || "Unable to load cart" });
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    try {
      const res = await api.post("/cart/items", { productId, quantity });
      dispatch({ type: "SET_CART", payload: res.data.cart });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Unable to add item to cart";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, message };
    }
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${productId}`, { quantity });
      dispatch({ type: "SET_CART", payload: res.data.cart });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Unable to update cart";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, message };
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      dispatch({ type: "SET_CART", payload: res.data.cart });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Unable to remove item";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, message };
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      const res = await api.delete("/cart");
      dispatch({ type: "SET_CART", payload: res.data.cart });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Unable to clear cart";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, message };
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        ...state,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
