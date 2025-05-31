export enum ScreenQuality {
  ORIGINAL = 'Original',
  OEM = 'OEM',
  AAA_PLUS = 'AAA+',
  INCELL = 'Incell',
  OLED_GENERIC = 'OLED Genérico',
  OTHER = 'Otro',
}

export interface Screen {
  id: string;
  brand: string;
  model: string;
  quality: ScreenQuality;
  quantity: number;
  purchasePrice: number; // This is per-unit purchase price
  supplier: string;
  entryDate: string; // ISO Date string
  notes?: string;
  minStockThreshold?: number;
}

export interface SoldScreen {
  id: string; // Can be a new unique ID for the sale transaction
  originalScreenId: string;
  brand: string;
  model: string;
  quality: ScreenQuality;
  purchasePrice: number; // Per-unit purchase price of the item sold
  salePrice: number; // TOTAL sale price for this transaction (unit sale price * quantitySold)
  saleDate: string; // ISO Date string
  profit: number; // TOTAL profit for this transaction (total sale price - (unit purchase price * quantitySold))
  customerInfo?: string;
  quantitySold: number; // Number of units sold in this transaction
}

export enum GeminiAnalysisType {
  PROFITABILITY = 'Profitability Analysis',
  INVENTORY_OPTIMIZATION = 'Inventory Optimization',
  TREND_IDENTIFICATION = 'Trend Identification',
  NATURAL_LANGUAGE_QUERY = 'Natural Language Query',
  PROACTIVE_SUGGESTIONS = 'Proactive Suggestions',
  PDF_CATALOG_ANALYSIS = 'PDF Product Catalog Analysis',
}

export interface GeminiReport {
  title: GeminiAnalysisType;
  content: string;
  timestamp: string;
}

export interface PdfExtractedScreen {
  brand?: string;
  model?: string;
  productDescription?: string; // Added for "Producto" column
  quality?: ScreenQuality | string; // Allow string for flexibility from AI
  color?: string; // Added for "Color" column
  purchasePrice?: number; // For "Precio" column
  quantity?: number; // Added for "Cantidad" column
  notes?: string; // For any other details or AI notes
}