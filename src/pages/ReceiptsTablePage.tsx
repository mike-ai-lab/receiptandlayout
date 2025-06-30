import React, { useState, useEffect, useMemo } from 'react';
import { ReceiptDatabase, type StoredReceipt } from '../utils/receiptDatabase';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { RefreshCwIcon } from '../components/icons/RefreshCwIcon';

const ReceiptsTablePage: React.FC = () => {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof StoredReceipt>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<StoredReceipt | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const itemsPerPage = 15;

  const db = ReceiptDatabase.getInstance();

  const loadReceipts = () => {
    setReceipts(db.getAllReceipts());
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const filteredAndSortedReceipts = useMemo(() => {
    let filtered = receipts.filter(receipt => {
      const searchLower = searchTerm.toLowerCase();
      return (
        receipt.receiptNumber.toLowerCase().includes(searchLower) ||
        receipt.receivedFrom.toLowerCase().includes(searchLower) ||
        receipt.amount.toLowerCase().includes(searchLower) ||
        receipt.tentNumber.toLowerCase().includes(searchLower) ||
        receipt.usagePurpose.toLowerCase().includes(searchLower) ||
        receipt.description.toLowerCase().includes(searchLower) ||
        receipt.notes.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'createdAt') {
        aValue = new Date(aValue as Date).getTime();
        bValue = new Date(bValue as Date).getTime();
      } else if (sortField === 'date') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else if (sortField === 'amount') {
        aValue = parseFloat((aValue as string).replace(/[^0-9.-]/g, '')) || 0;
        bValue = parseFloat((bValue as string).replace(/[^0-9.-]/g, '')) || 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [receipts, searchTerm, sortField, sortDirection]);

  const paginatedReceipts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedReceipts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedReceipts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedReceipts.length / itemsPerPage);
  const stats = db.getReceiptStats();

  const handleSort = (field: keyof StoredReceipt) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const csvContent = db.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResetDatabase = () => {
    db.clearAllReceipts();
    loadReceipts();
    setShowResetConfirm(false);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? amount : `$${num.toLocaleString()}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatServices = (services: StoredReceipt['services']) => {
    const activeServices = Object.entries(services)
      .filter(([_, active]) => active)
      .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));
    return activeServices.length > 0 ? activeServices.join(', ') : 'None';
  };

  const SortIcon = ({ field }: { field: keyof StoredReceipt }) => {
    if (sortField !== field) return <span className="text-slate-400">↕</span>;
    return <span className="text-primary">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Receipt Database</h1>
              <p className="text-slate-600">View and manage all generated receipts</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadReceipts}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <RefreshCwIcon className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <DownloadIcon className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Reset Database
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalReceipts}</div>
              <div className="text-sm text-blue-800">Total Receipts</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount.toString())}</div>
              <div className="text-sm text-green-800">Total Amount</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.thisMonthReceipts}</div>
              <div className="text-sm text-orange-800">This Month</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.uniqueTents}</div>
              <div className="text-sm text-purple-800">Unique Tents</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-slate-600">{formatCurrency(stats.averageAmount.toString())}</div>
              <div className="text-sm text-slate-800">Average Amount</div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search receipts by number, customer name, amount, tent number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-lg"
            />
          </div>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-slate-600">
            Showing {paginatedReceipts.length} of {filteredAndSortedReceipts.length} receipts
            {searchTerm && ` (filtered from ${receipts.length} total)`}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th 
                    className="border border-slate-200 px-3 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-sm"
                    onClick={() => handleSort('receiptNumber')}
                  >
                    <div className="flex items-center justify-between">
                      Receipt #
                      <SortIcon field="receiptNumber" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-3 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-sm"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center justify-between">
                      Date
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-3 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-sm"
                    onClick={() => handleSort('receivedFrom')}
                  >
                    <div className="flex items-center justify-between">
                      Customer
                      <SortIcon field="receivedFrom" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-3 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-sm"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-between">
                      Amount
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-3 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-sm"
                    onClick={() => handleSort('tentNumber')}
                  >
                    <div className="flex items-center justify-between">
                      Tent
                      <SortIcon field="tentNumber" />
                    </div>
                  </th>
                  <th className="border border-slate-200 px-3 py-3 text-left font-semibold text-sm">
                    Services
                  </th>
                  <th className="border border-slate-200 px-3 py-3 text-left font-semibold text-sm">
                    Ad Zones
                  </th>
                  <th className="border border-slate-200 px-3 py-3 text-left font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-200 px-3 py-3 font-mono text-sm font-semibold text-blue-600">
                      {receipt.receiptNumber}
                    </td>
                    <td className="border border-slate-200 px-3 py-3 text-sm">
                      {formatDate(receipt.date)}
                    </td>
                    <td className="border border-slate-200 px-3 py-3 text-sm font-medium">
                      {receipt.receivedFrom || 'N/A'}
                    </td>
                    <td className="border border-slate-200 px-3 py-3 text-sm font-semibold text-green-600">
                      {formatCurrency(receipt.amount)}
                    </td>
                    <td className="border border-slate-200 px-3 py-3 text-sm font-mono">
                      {receipt.tentNumber || '-'}
                    </td>
                    <td className="border border-slate-200 px-3 py-3 text-xs">
                      {formatServices(receipt.services)}
                    </td>
                    <td className="border border-slate-200 px-3 py-3 text-xs">
                      {receipt.advertisements.zones.length > 0 ? receipt.advertisements.zones.join(', ') : 'None'}
                    </td>
                    <td className="border border-slate-200 px-3 py-3">
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-white border-primary'
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredAndSortedReceipts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-2">No receipts found</div>
              <div className="text-slate-500 text-sm">
                {searchTerm ? 'Try adjusting your search criteria' : 'No receipts have been generated yet'}
              </div>
            </div>
          )}
        </div>

        {/* Receipt Details Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Receipt Details</h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-500 hover:text-slate-700 text-3xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-slate-700">Receipt Number:</label>
                    <p className="text-lg font-mono text-blue-600">{selectedReceipt.receiptNumber}</p>
                  </div>
                  
                  <div>
                    <label className="font-semibold text-slate-700">Date:</label>
                    <p>{formatDate(selectedReceipt.date)}</p>
                  </div>
                  
                  <div>
                    <label className="font-semibold text-slate-700">Customer Name:</label>
                    <p>{selectedReceipt.receivedFrom || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="font-semibold text-slate-700">Amount:</label>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedReceipt.amount)}</p>
                  </div>
                  
                  <div>
                    <label className="font-semibold text-slate-700">Tent Number:</label>
                    <p className="font-mono">{selectedReceipt.tentNumber || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="font-semibold text-slate-700">Usage Purpose:</label>
                    <p>{selectedReceipt.usagePurpose || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-slate-700">Additional Services:</label>
                    <p>{formatServices(selectedReceipt.services)}</p>
                  </div>
                  
                  <div>
                    <label className="font-semibold text-slate-700">Advertisement Zones:</label>
                    <p>{selectedReceipt.advertisements.zones.length > 0 ? selectedReceipt.advertisements.zones.join(', ') : 'None'}</p>
                  </div>
                  
                  {selectedReceipt.advertisements.totalQuantity && (
                    <div>
                      <label className="font-semibold text-slate-700">Total Ad Quantity:</label>
                      <p>{selectedReceipt.advertisements.totalQuantity}</p>
                    </div>
                  )}
                  
                  {selectedReceipt.advertisements.carFlags && (
                    <div>
                      <label className="font-semibold text-slate-700">Car Flags:</label>
                      <p>{selectedReceipt.advertisements.carFlags}</p>
                    </div>
                  )}
                  
                  {selectedReceipt.advertisements.bannerFlags && (
                    <div>
                      <label className="font-semibold text-slate-700">Banner Flags:</label>
                      <p>{selectedReceipt.advertisements.bannerFlags}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="font-semibold text-slate-700">Created:</label>
                    <p className="text-sm text-slate-600">{selectedReceipt.createdAt.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {(selectedReceipt.description || selectedReceipt.notes) && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  {selectedReceipt.description && (
                    <div className="mb-4">
                      <label className="font-semibold text-slate-700">Description:</label>
                      <p className="mt-1">{selectedReceipt.description}</p>
                    </div>
                  )}
                  
                  {selectedReceipt.notes && (
                    <div>
                      <label className="font-semibold text-slate-700">Notes:</label>
                      <p className="mt-1">{selectedReceipt.notes}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-red-600">Reset Database</h3>
              <p className="mb-6 text-slate-700">
                Are you sure you want to delete all receipt records? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetDatabase}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reset Database
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptsTablePage;