'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    "Kiosk Ordering": "Kiosk Ordering",
    "Self Service": "Self Service",
    "Preparing Menu...": "Preparing Menu...",
    "Your Order": "Your Order",
    "items": "items",
    "Your cart is empty.": "Your cart is empty.",
    "Tap an item to start ordering.": "Tap an item to start ordering.",
    "Subtotal": "Subtotal",
    "Estimated Tax": "Estimated Tax",
    "Total": "Total",
    "Place Order": "Place Order",
    "Placing Order...": "Placing Order...",
    "Edit": "Edit",
    "Add to Order": "Add to Order",
    "Save Changes": "Save Changes",
    "All": "All",
    "Menu": "Menu",
    "Employee": "Employee",
    "Manager": "Manager",
    "Kiosk": "Kiosk",
    "Portal": "Portal",
    "Team Matcha": "Team Matcha",
    "Team Matcha POS": "Team Matcha POS",
    "Fresh drinks and cafe favorites, served in a simple menu view.": "Fresh drinks and cafe favorites, served in a simple menu view.",
    "Item": "Item",
    "Price": "Price",
    "Loading menu...": "Loading menu...",
    "No menu items are available right now.": "No menu items are available right now.",
    "Order Placed Successfully!": "Order Placed Successfully!",
    "View Order": "View Order",
    "Close": "Close",
    "Back to Menu": "Back to Menu",
    "Back to Portal": "Back to Portal",
    "Skip to main content": "Skip to main content",
    "Failed to load menu items.": "Failed to load menu items.",
    "Failed to place order.": "Failed to place order.",
    "Customize Your Drink": "Customize Your Drink",
    "Includes": "Includes",
    "add-on": "add-on",
    "Ice Level": "Ice Level",
    "Sugar Level": "Sugar Level",
    "Toppings": "Toppings",
    "No Ice": "No Ice",
    "Less Ice": "Less Ice",
    "Regular Ice": "Regular Ice",
    "Extra Ice": "Extra Ice",
    "None": "None",
    "Boba": "Boba",
    "Pudding": "Pudding",
    "Grass Jelly": "Grass Jelly",
    "Red Bean": "Red Bean",
    "Aloe Vera": "Aloe Vera",
    "Decrease quantity of": "Decrease quantity of",
    "Increase quantity of": "Increase quantity of",
    "Cart contents": "Cart contents",
    "Menu categories": "Menu categories",
    "Close customization": "Close customization",
    "Lattes & Milk": "Lattes & Milk",
    "Tea & Matcha": "Tea & Matcha",
    "Treats": "Treats",
    "Specials": "Specials",
    "Classic Milk Tea": "Classic Milk Tea",
    "Taro Milk Tea": "Taro Milk Tea",
    "Matcha Milk Tea": "Matcha Milk Tea",
    "Thai Milk Tea": "Thai Milk Tea",
    "Honeydew Milk Tea": "Honeydew Milk Tea",
    "Brown Sugar Milk Tea": "Brown Sugar Milk Tea",
    "Strawberry Milk Tea": "Strawberry Milk Tea",
    "Mango Milk Tea": "Mango Milk Tea",
    "Oolong Milk Tea": "Oolong Milk Tea",
    "Wintermelon Tea": "Wintermelon Tea",
    "Passionfruit Tea": "Passionfruit Tea",
    "Lychee Tea": "Lychee Tea",
    "Peach Green Tea": "Peach Green Tea",
    "Coconut Milk Tea": "Coconut Milk Tea",
    "Almond Milk Tea": "Almond Milk Tea",
    "Coffee Milk Tea": "Coffee Milk Tea",
    "Red Bean Milk Tea": "Red Bean Milk Tea",
    "Pineapple Tea": "Pineapple Tea",
    "Guava Green Tea": "Guava Green Tea",
    "Caramel Milk Tea": "Caramel Milk Tea",
    "Accessibility Mode": "Accessibility Mode",
    "Local Weather Forecast": "Local Weather Forecast",
    "College Station, TX": "College Station, TX",
    "Loading weather...": "Loading weather...",
    "Failed to load weather.": "Failed to load weather.",
    "Current conditions": "Current conditions",
    "Weather unavailable": "Weather unavailable",
    "Wind": "Wind",
  },
  es: {
    "Kiosk Ordering": "Pedido en Kiosko",
    "Self Service": "Autoservicio",
    "Preparing Menu...": "Preparando Menú...",
    "Your Order": "Tu Pedido",
    "items": "artículos",
    "Your cart is empty.": "Tu carrito está vacío.",
    "Tap an item to start ordering.": "Toca un artículo para empezar a pedir.",
    "Subtotal": "Subtotal",
    "Estimated Tax": "Impuesto Estimado",
    "Total": "Total",
    "Place Order": "Realizar Pedido",
    "Placing Order...": "Realizando Pedido...",
    "Edit": "Editar",
    "Add to Order": "Agregar al Pedido",
    "Save Changes": "Guardar Cambios",
    "All": "Todos",
    "Menu": "Menú",
    "Employee": "Empleado",
    "Manager": "Gerente",
    "Kiosk": "Kiosko",
    "Portal": "Portal",
    "Team Matcha": "Equipo Matcha",
    "Team Matcha POS": "TPV Equipo Matcha",
    "Fresh drinks and cafe favorites, served in a simple menu view.": "Bebidas frescas y favoritos de cafetería, servidos en una vista de menú sencilla.",
    "Item": "Artículo",
    "Price": "Precio",
    "Loading menu...": "Cargando menú...",
    "No menu items are available right now.": "No hay artículos de menú disponibles en este momento.",
    "Order Placed Successfully!": "¡Pedido Realizado con Éxito!",
    "View Order": "Ver Pedido",
    "Close": "Cerrar",
    "Back to Menu": "Volver al Menú",
    "Back to Portal": "Volver al Portal",
    "Skip to main content": "Saltar al contenido principal",
    "Failed to load menu items.": "Error al cargar los artículos del menú.",
    "Failed to place order.": "Error al realizar el pedido.",
    "Customize Your Drink": "Personaliza tu Bebida",
    "Includes": "Incluye",
    "add-on": "extra",
    "Ice Level": "Nivel de Hielo",
    "Sugar Level": "Nivel de Azúcar",
    "Toppings": "Ingredientes",
    "No Ice": "Sin Hielo",
    "Less Ice": "Poco Hielo",
    "Regular Ice": "Hielo Regular",
    "Extra Ice": "Hielo Extra",
    "None": "Ninguno",
    "Boba": "Boba",
    "Pudding": "Pudín",
    "Grass Jelly": "Gelatina de Hierba",
    "Red Bean": "Frijol Rojo",
    "Aloe Vera": "Aloe Vera",
    "Decrease quantity of": "Disminuir cantidad de",
    "Increase quantity of": "Aumentar cantidad de",
    "Cart contents": "Contenido del carrito",
    "Menu categories": "Categorías del menú",
    "Close customization": "Cerrar personalización",
    "Lattes & Milk": "Lattes y Leche",
    "Tea & Matcha": "Té y Matcha",
    "Treats": "Dulces",
    "Specials": "Especiales",
    "Classic Milk Tea": "Té de Leche Clásico",
    "Taro Milk Tea": "Té de Leche de Taro",
    "Matcha Milk Tea": "Té de Leche de Matcha",
    "Thai Milk Tea": "Té de Leche Tailandés",
    "Honeydew Milk Tea": "Té de Leche de Melón",
    "Brown Sugar Milk Tea": "Té de Leche de Azúcar Morena",
    "Strawberry Milk Tea": "Té de Leche de Fresa",
    "Mango Milk Tea": "Té de Leche de Mango",
    "Oolong Milk Tea": "Té de Leche Oolong",
    "Wintermelon Tea": "Té de Melón de Invierno",
    "Passionfruit Tea": "Té de Maracuyá",
    "Lychee Tea": "Té de Lichi",
    "Peach Green Tea": "Té Verde de Durazno",
    "Coconut Milk Tea": "Té de Leche de Coco",
    "Almond Milk Tea": "Té de Leche de Almendra",
    "Coffee Milk Tea": "Té de Leche de Café",
    "Red Bean Milk Tea": "Té de Leche de Frijol Rojo",
    "Pineapple Tea": "Té de Piña",
    "Guava Green Tea": "Té Verde de Guayaba",
    "Caramel Milk Tea": "Té de Leche de Caramelo",
    "Accessibility Mode": "Modo de Accesibilidad",
    "Local Weather Forecast": "Pronóstico del Tiempo Local",
    "College Station, TX": "College Station, TX",
    "Loading weather...": "Cargando clima...",
    "Failed to load weather.": "Error al cargar el clima.",
    "Current conditions": "Condiciones actuales",
    "Weather unavailable": "Clima no disponible",
    "Wind": "Viento",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  accessibilityMode: boolean;
  setAccessibilityMode: (mode: boolean) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, accessibilityMode, setAccessibilityMode, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
