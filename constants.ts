
import type { ReceiptDetails } from './utils/types'; // Updated path
import type { CompanyDetails } from './types'; // Assuming CompanyDetails is defined in types.ts or create it

const today = new Date();

export const DEFAULT_RECEIPT_DETAILS: ReceiptDetails = {
  day: today.getDate().toString().padStart(2, '0'),
  month: (today.getMonth() + 1).toString().padStart(2, '0'),
  year: today.getFullYear().toString(),
  receiptDate: today.toISOString().split('T')[0], // Default to today in YYYY-MM-DD for <input type="date">
  dayAr: '', 
  monthAr: '',
  yearAr: '',
  receivedFromName: '',
  amount: '',
  subscriptionPurpose: 'Subscription in Tripoli Karting Race / اشتراك في مهرجان طرابلس للكارتينج',
  tentNumber: '',
  usagePurpose: '',
  description: '',
  electricityAvailable: false,
  chairsAvailable: false,
  tableAvailable: false,
  adsZoneA: false,
  adsZoneB: false,
  adsZoneC: false,
  adsZoneD: false,
  adsZoneE: false,
  adsZoneF: false,
  adsTotalQuantity: '',
  carFlagsCount: '',
  bannerFlagsCount: '',
  notes: '',
  receiverName: '',
  payerName: '',
  receiptNumber: '', // Default value, will be dynamically assigned
};

export const MAX_FILE_SIZE_MB = 10; // Example: 10MB

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

export const QUOTATION_COMPANY_DETAILS: CompanyDetails = {
  name: "Tripoli Events & Services Co.",
  address: "123 Event Street, Tripoli, Lebanon",
  phone: "+961 X XXX XXX",
  email: "info@tripolievents.com",
  logoUrl: "https://hbslewdkkgwsaohjyzak.supabase.co/storage/v1/object/public/tkr//logo.png" // Existing logo
};

// Defines the sort order for units in the quotation PDF and modal.
// Items will be grouped by category first, then sorted by these units.
export const UNIT_SORT_ORDER: string[] = [
  // Lump Sum / Allowances first
  "LUMPSUM", "LS", "LUMP SUM",
  "ALLOWANCE", "ALLOW",
  // Area based units
  "SQM", "M2", "SQUARE METER", "SQUARE METERS",
  "SQFT", "SF", "SQUARE FOOT", "SQUARE FEET",
  // Length based units
  "LM", "LINEAR METER", "LINEAR METERS",
  "LF", "LINEAR FOOT", "LINEAR FEET",
  "M", "METER", "METERS",
  "FT", "FOOT", "FEET",
  // Count based units
  "EACH", "EA", "ITEM", "ITEMS", "UNIT", "UNITS", "NO", "NOS", "NUMBER",
  "SET", "SETS",
  // Weight based units
  "KG", "KILOGRAM", "KILOGRAMS",
  "TONNE", "TONNES", "TON", "TONS",
  // Time based units
  "DAY", "DAYS",
  "HOUR", "HOURS",
  // Volume based units
  "CBM", "M3", "CUBIC METER", "CUBIC METERS",
  "CY", "CUBIC YARD", "CUBIC YARDS",
  // Other / Uncategorized (will be sorted alphabetically after known units)
];

export const RECEIPT_COUNTER_STORAGE_KEY = 'RECEIPT_COUNTER_VALUE'; // Key for localStorage
