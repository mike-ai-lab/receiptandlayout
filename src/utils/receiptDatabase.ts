export interface StoredReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  receivedFrom: string;
  amount: string;
  tentNumber: string;
  usagePurpose: string;
  description: string;
  notes: string;
  receiverName: string;
  payerName: string;
  services: {
    electricity: boolean;
    chairs: boolean;
    table: boolean;
  };
  advertisements: {
    zones: string[];
    totalQuantity: string;
    carFlags: string;
    bannerFlags: string;
  };
  createdAt: Date;
  status: 'active' | 'archived';
}

const RECEIPTS_STORAGE_KEY = 'TKR_RECEIPTS_DATABASE';

export class ReceiptDatabase {
  private static instance: ReceiptDatabase;
  
  static getInstance(): ReceiptDatabase {
    if (!ReceiptDatabase.instance) {
      ReceiptDatabase.instance = new ReceiptDatabase();
    }
    return ReceiptDatabase.instance;
  }

  private getStoredReceipts(): StoredReceipt[] {
    try {
      const stored = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (!stored) return [];
      
      const receipts = JSON.parse(stored);
      return receipts.map((receipt: any) => ({
        ...receipt,
        createdAt: new Date(receipt.createdAt)
      }));
    } catch (error) {
      console.error('Error loading receipts from storage:', error);
      return [];
    }
  }

  private saveReceipts(receipts: StoredReceipt[]): void {
    try {
      localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
    } catch (error) {
      console.error('Error saving receipts to storage:', error);
      throw new Error('Failed to save receipt data');
    }
  }

  saveReceipt(receiptDetails: any): string {
    const receipts = this.getStoredReceipts();
    
    // Get active advertisement zones
    const activeZones = [];
    if (receiptDetails.adsZoneA) activeZones.push('Zone A');
    if (receiptDetails.adsZoneB) activeZones.push('Zone B');
    if (receiptDetails.adsZoneC) activeZones.push('Zone C');
    if (receiptDetails.adsZoneD) activeZones.push('Zone D');
    if (receiptDetails.adsZoneE) activeZones.push('Zone E');
    if (receiptDetails.adsZoneF) activeZones.push('Zone F');

    const newReceipt: StoredReceipt = {
      id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receiptNumber: receiptDetails.receiptNumber || 'N/A',
      date: receiptDetails.receiptDate || new Date().toISOString().split('T')[0],
      receivedFrom: receiptDetails.receivedFromName || '',
      amount: receiptDetails.amount || '',
      tentNumber: receiptDetails.tentNumber || '',
      usagePurpose: receiptDetails.usagePurpose || '',
      description: receiptDetails.description || '',
      notes: receiptDetails.notes || '',
      receiverName: receiptDetails.receiverName || '',
      payerName: receiptDetails.payerName || '',
      services: {
        electricity: receiptDetails.electricityAvailable || false,
        chairs: receiptDetails.chairsAvailable || false,
        table: receiptDetails.tableAvailable || false,
      },
      advertisements: {
        zones: activeZones,
        totalQuantity: receiptDetails.adsTotalQuantity || '',
        carFlags: receiptDetails.carFlagsCount || '',
        bannerFlags: receiptDetails.bannerFlagsCount || '',
      },
      createdAt: new Date(),
      status: 'active'
    };

    receipts.unshift(newReceipt); // Add to beginning for newest first
    this.saveReceipts(receipts);
    
    return newReceipt.id;
  }

  getAllReceipts(): StoredReceipt[] {
    return this.getStoredReceipts().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getReceiptById(id: string): StoredReceipt | null {
    const receipts = this.getStoredReceipts();
    return receipts.find(receipt => receipt.id === id) || null;
  }

  deleteReceipt(id: string): boolean {
    const receipts = this.getStoredReceipts();
    const filteredReceipts = receipts.filter(receipt => receipt.id !== id);
    
    if (filteredReceipts.length === receipts.length) {
      return false; // Receipt not found
    }
    
    this.saveReceipts(filteredReceipts);
    return true;
  }

  clearAllReceipts(): void {
    this.saveReceipts([]);
  }

  getReceiptStats() {
    const receipts = this.getStoredReceipts();
    const totalReceipts = receipts.length;
    const totalAmount = receipts.reduce((sum, receipt) => {
      const amount = parseFloat(receipt.amount.replace(/[^0-9.-]/g, '')) || 0;
      return sum + amount;
    }, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthReceipts = receipts.filter(receipt => 
      new Date(receipt.date) >= thisMonth
    ).length;

    const tentNumbers = receipts
      .filter(receipt => receipt.tentNumber)
      .map(receipt => receipt.tentNumber);
    const uniqueTents = new Set(tentNumbers).size;

    return {
      totalReceipts,
      totalAmount,
      thisMonthReceipts,
      uniqueTents,
      averageAmount: totalReceipts > 0 ? totalAmount / totalReceipts : 0
    };
  }

  exportToCSV(): string {
    const receipts = this.getStoredReceipts();
    const headers = [
      'Receipt Number',
      'Date',
      'Received From',
      'Amount',
      'Tent Number',
      'Usage Purpose',
      'Description',
      'Services',
      'Ad Zones',
      'Total Ads',
      'Car Flags',
      'Banner Flags',
      'Notes',
      'Receiver',
      'Issuer',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...receipts.map(receipt => [
        receipt.receiptNumber,
        receipt.date,
        `"${receipt.receivedFrom}"`,
        `"${receipt.amount}"`,
        receipt.tentNumber,
        `"${receipt.usagePurpose}"`,
        `"${receipt.description}"`,
        `"${Object.entries(receipt.services).filter(([_, value]) => value).map(([key]) => key).join(', ')}"`,
        `"${receipt.advertisements.zones.join(', ')}"`,
        receipt.advertisements.totalQuantity,
        receipt.advertisements.carFlags,
        receipt.advertisements.bannerFlags,
        `"${receipt.notes}"`,
        `"${receipt.receiverName}"`,
        `"${receipt.payerName}"`,
        receipt.createdAt.toISOString()
      ].join(','))
    ].join('\n');

    return csvContent;
  }
}