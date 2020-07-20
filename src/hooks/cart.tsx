import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(
        '@GoMarketplace:items',
      );

      console.log(`${productsStorage}`);

      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const incrementIndex = newProducts.findIndex(
        product => product.id === id,
      );

      newProducts[incrementIndex].quantity += 1;
      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:items',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = [...products];

      const decrementIndex = newProducts.findIndex(
        product => product.id === id,
      );

      if (newProducts[decrementIndex].quantity > 1)
        newProducts[decrementIndex].quantity -= 1;
      else {
        newProducts.splice(decrementIndex, 1);
      }

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:items',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const checkProduct = product as Product;
      const productsStored = [...products];
      const checkIfExists = productsStored.findIndex(
        item => item.id === checkProduct.id,
      );

      if (checkIfExists > 0) {
        await increment(checkProduct.id);
        return;
      }

      const { id, title, image_url, price } = product;

      const productQuantified = {
        id,
        title,
        image_url,
        price,
        quantity: 1,
      };

      setProducts([...products, productQuantified]);

      await AsyncStorage.setItem(
        '@GoMarketplace:items',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
