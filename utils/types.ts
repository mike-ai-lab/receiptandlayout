
export interface ReceiptDetails {
  day: string; 
  month: string; 
  year: string; 
  receiptDate: string; 
  receivedFromName: string;
  amount: string; 
  subscriptionPurpose: string;
  tentNumber: string;
  usagePurpose: string;
  description: string;

  electricityAvailable: boolean;
  chairsAvailable: boolean;
  tableAvailable: boolean;

  adsZoneA: boolean;
  adsZoneB: boolean;
  adsZoneC: boolean;
  adsZoneD: boolean;
  adsZoneE: boolean;
  adsZoneF: boolean;

  adsTotalQuantity: string;
  carFlagsCount: string;
  bannerFlagsCount: string;

  notes: string;
  receiverName: string;
  payerName: string;

  // New Arabic date fields
  dayAr: string;
  monthAr: string;
  yearAr: string;

  receiptNumber: string; // Added for automatic receipt numbering
}

export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
}

// Keep other existing types from the original file if any
// For example, if ScopeItem, ExtractedFileInfo, ChatMessage etc. were here, they should remain.

export interface ScopeItem {
  category: "painting" | "cladding" | "facade_element" | "other" | string; // Allow more general strings
  itemDescription: string;
  quantity: string; // e.g., "150 LF", "2500 SQFT", "5 Doors"
  materialOrFinish: string; // e.g., "Eggshell latex, P-1A", "Granite, Giallo Ornamental, 30mm"
  dimensions?: string; // e.g., "10ft x 8ft wall", "Panel 600x1200mm"
  pageNumber?: string | number; // Can be string like "A-101" or number
  calculationDetails?: string;
  unitOfMeasure?: string; // e.g., "SQFT", "LF", "EACH" - normalized unit
}

export interface ExtractedFileInfo {
  id: string; // Unique ID for the file processing instance
  file: File;
  fileName: string;
  objectURL: string | null; // For PDF preview
  items: ScopeItem[];
  summary?: string; // Optional AI-generated summary of the document
  error?: string | null; // To store any error message during processing
  status: 'pending' | 'processing' | 'completed' | 'error';
  chatHistory?: ChatMessage[]; // Store chat specific to this file
  chatInstance?: GeminiChat; // Store Gemini chat instance
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  references?: { fileName: string; pageNumber?: string | number }[]; // For AI responses linking to source
}

// For Gemini Service
export interface GeminiChat {
  sendMessage: (params: { message: string; history?: any[] }) => Promise<GenerateContentResponse>;
  // Add other methods if you use more features of GeminiChat (e.g. sendMessageStream)
}

export interface GeminiJsonParsingError extends Error {
  name: "GeminiJsonParsingError";
  rawResponse?: string;
}

// For Quotation Generation
export interface QuotationScopeItemStructure {
  id: string | number;
  category: string;
  description: string;
  quantity: string;
  materialOrFinish: string;
  dimensions?: string;
  pageRef?: string; // Page number(s) from the PDF
  unitOfMeasure?: string; // Normalized unit like SQM, LF, EACH
  pricePlaceholder: string; // e.g., "$[ITEM_PRICE_1]"
  unitPrice?: string; // User entered unit price, e.g., "15.50"
  price?: string; // Calculated total for the item, e.g., "$775.00"
}

export interface QuotationStructure {
  title: string;
  clientInfo: ClientDetails; // Using ClientDetails interface
  companyInfo: CompanyDetails; // Using CompanyDetails interface
  introductionText: string;
  items: QuotationScopeItemStructure[];
  subtotalPlaceholder: string; // e.g. "$[SUBTOTAL_PRICE]"
  taxPlaceholder?: string; // e.g. "$[TAX_AMOUNT]"
  totalPricePlaceholder: string; // e.g. "$[GRAND_TOTAL_PRICE]"
  subtotal?: string; // Populated after pricing
  taxAmount?: string; // Populated after pricing
  grandTotal?: string; // Populated after pricing
  termsAndConditions: string[];
  conclusionText: string;
}

export interface ClientDetails {
  name: string;
  address: string;
  date: string; // YYYY-MM-DD
  projectId: string;
}

// Re-add GenerateContentResponse if it's not globally available or imported from @google/genai
// Assuming it's imported where needed from @google/genai
import type { GenerateContentResponse } from "@google/genai";
