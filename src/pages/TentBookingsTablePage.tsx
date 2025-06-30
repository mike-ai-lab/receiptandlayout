import React, { useState, useEffect, useMemo } from 'react';
import type { Booking } from '../utils/tentTypes';

// Sample booking data
const generateSampleBookings = (): Booking[] => {
  const bookings: Booking[] = [];
  const contacts = [
    '0551234567', '0509876543', '0561234567', '0521234567',
    '0581234567', '0591234567', '0501234567', '0511234567'
  ];
  
  for (let i = 1; i <= 25; i++) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30) - 15);
    
    bookings.push({
      bookingId: `BKG-${i.toString().padStart(3, '0')}`,
      tentId: `T${i}`,
      contact: contacts[Math.floor(Math.random() * contacts.length)],
      date: date.toISOString().split('T')[0],
      duration: Math.floor(Math.random() * 8) + 1,
      status: Math.random() > 0.5 ? 'occupied' : 'reserved',
      createdAt: new Date(date.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      notes: Math.random() > 0.7 ? 'Special requirements noted' : undefined
    });
  }
  
  return bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const TentBookingsTablePage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Booking>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reserved' | 'occupied'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setBookings(generateSampleBookings());
  }, []);

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesSearch = 
        booking.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.tentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'date' || sortField === 'createdAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
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
  }, [bookings, searchTerm, sortField, sortDirection, statusFilter]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedBookings, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);

  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Tent ID', 'Contact', 'Date', 'Duration (hrs)', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedBookings.map(booking => [
        booking.bookingId,
        booking.tentId,
        booking.contact,
        booking.date,
        booking.duration,
        booking.status,
        booking.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tent-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const tableText = filteredAndSortedBookings.map(booking => 
      `${booking.bookingId}\t${booking.tentId}\t${booking.contact}\t${booking.date}\t${booking.duration}h\t${booking.status}\t${booking.notes || ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(tableText).then(() => {
      alert('Table data copied to clipboard!');
    });
  };

  const SortIcon = ({ field }: { field: keyof Booking }) => {
    if (sortField !== field) return <span className="text-slate-400">↕</span>;
    return <span className="text-primary">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Tent Bookings</h1>
              <p className="text-slate-600">Manage and view all tent rental bookings</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Export CSV
              </button>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Copy Table
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by contact, tent ID, or booking ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | 'reserved' | 'occupied');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="all">All Status</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-slate-600">
            Showing {paginatedBookings.length} of {filteredAndSortedBookings.length} bookings
            {searchTerm && ` (filtered from ${bookings.length} total)`}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th 
                    className="border border-slate-200 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('bookingId')}
                  >
                    <div className="flex items-center justify-between">
                      Booking ID
                      <SortIcon field="bookingId" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('tentId')}
                  >
                    <div className="flex items-center justify-between">
                      Tent ID
                      <SortIcon field="tentId" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('contact')}
                  >
                    <div className="flex items-center justify-between">
                      Contact
                      <SortIcon field="contact" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center justify-between">
                      Date
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('duration')}
                  >
                    <div className="flex items-center justify-between">
                      Duration
                      <SortIcon field="duration" />
                    </div>
                  </th>
                  <th 
                    className="border border-slate-200 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-between">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-left font-semibold">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-200 px-4 py-3 font-mono text-sm">
                      {booking.bookingId}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 font-semibold">
                      {booking.tentId}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {booking.contact}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {new Date(booking.date).toLocaleDateString()}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {booking.duration} hrs
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        booking.status === 'reserved' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {booking.notes || '-'}
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
          {filteredAndSortedBookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-2">No bookings found</div>
              <div className="text-slate-500 text-sm">
                {searchTerm ? 'Try adjusting your search criteria' : 'No bookings available'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TentBookingsTablePage;