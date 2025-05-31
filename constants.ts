import { ScreenQuality, Screen, SoldScreen } from './types';

export const LOCAL_STORAGE_KEYS = {
  INVENTORY: 'screenStockProInventory',
  SALES: 'screenStockProSales',
  GEMINI_CONNECTION: 'screenStockProGeminiConnection',
};

export const GEMINI_API_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

export const INITIAL_INVENTORY: Screen[] = []; // Start with no initial inventory

export const INITIAL_SALES: SoldScreen[] = []; // Start with no initial sales

export const APP_NAME = "ScreenStock Pro";