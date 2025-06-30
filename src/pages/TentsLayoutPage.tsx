import React, { useState, useEffect } from 'react';
import TentCard from '../components/TentCard';
import type { Tent } from '../utils/tentTypes';

// Sample data based on the layout image provided
const generateSampleTents = (): Tent[] => {
  const tents: Tent[] = [];
  
  // Blue tents (top row) - T1 to T8
  for (let i = 1; i <= 8; i++) {
    tents.push({
      id: `T${i}`,
      status: i <= 2 ? 'occupied' : i <= 4 ? 'reserved' : 'available',
      bookedBy: i <= 2 ? `055123456${i}` : i <= 4 ? `050987654${i}` : undefined,
      hours: i <= 2 ? 4 : i <= 4 ? 2 : undefined,
      position: { row: 0, col: i - 1 }
    });
  }
  
  // Red tents (right side) - T9 to T16
  for (let i = 9; i <= 16; i++) {
    tents.push({
      id: `T${i}`,
      status: i <= 11 ? 'occupied' : i <= 13 ? 'reserved' : 'available',
      bookedBy: i <= 11 ? `055123456${i - 8}` : i <= 13 ? `050987654${i - 8}` : undefined,
      hours: i <= 11 ? 3 : i <= 13 ? 1 : undefined,
      position: { row: i - 8, col: 8 }
    });
  }
  
  // Yellow tents (bottom right) - T17 to T24
  for (let i = 17; i <= 24; i++) {
    tents.push({
      id: `T${i}`,
      status: i <= 19 ? 'reserved' : 'available',
      bookedBy: i <= 19 ? `050987654${i - 16}` : undefined,
      hours: i <= 19 ? 2 : undefined,
      position: { row: 8, col: 24 - i }
    });
  }
  
  // Green tents (left side) - T25 to T40
  for (let i = 25; i <= 40; i++) {
    tents.push({
      id: `T${i}`,
      status: i <= 28 ? 'occupied' : i <= 32 ? 'reserved' : 'available',
      bookedBy: i <= 28 ? `055123456${i - 24}` : i <= 32 ? `050987654${i - 24}` : undefined,
      hours: i <= 28 ? 4 : i <= 32 ? 3 : undefined,
      position: { row: i - 24, col: 0 }
    });
  }
  
  // Blue tents (bottom row) - T41 to T48
  for (let i = 41; i <= 48; i++) {
    tents.push({
      id: `T${i}`,
      status: i <= 43 ? 'reserved' : 'available',
      bookedBy: i <= 43 ? `050987654${i - 40}` : undefined,
      hours: i <= 43 ? 1 : undefined,
      position: { row: 9, col: i - 41 }
    });
  }
  
  return tents;
};

const TentsLayoutPage: React.FC = () => {
  const [tents, setTents] = useState<Tent[]>([]);
  const [selectedTent, setSelectedTent] = useState<Tent | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | Tent['status']>('all');

  useEffect(() => {
    setTents(generateSampleTents());
  }, []);

  const handleTentClick = (tent: Tent) => {
    setSelectedTent(tent);
  };

  const filteredTents = tents.filter(tent => 
    filterStatus === 'all' || tent.status === filterStatus
  );

  const getStatusCounts = () => {
    return {
      total: tents.length,
      available: tents.filter(t => t.status === 'available').length,
      reserved: tents.filter(t => t.status === 'reserved').length,
      occupied: tents.filter(t => t.status === 'occupied').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Tents Layout</h1>
              <p className="text-slate-600">Tripoli Karting Race 2025 - Season 1</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <span className="text-green-800 font-semibold">Available: {statusCounts.available}</span>
              </div>
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <span className="text-orange-800 font-semibold">Reserved: {statusCounts.reserved}</span>
              </div>
              <div className="bg-red-100 px-4 py-2 rounded-lg">
                <span className="text-red-800 font-semibold">Occupied: {statusCounts.occupied}</span>
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-lg">
                <span className="text-slate-800 font-semibold">Total: {statusCounts.total}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              All Tents
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'available'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterStatus('reserved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'reserved'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Reserved
            </button>
            <button
              onClick={() => setFilterStatus('occupied')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'occupied'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Occupied
            </button>
          </div>

          {/* Layout Grid - Mimicking the provided image */}
          <div className="bg-slate-100 p-6 rounded-lg">
            <div className="relative">
              {/* Track area (green center) */}
              <div className="bg-green-400 w-full h-64 sm:h-80 md:h-96 rounded-lg relative mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white font-bold text-lg sm:text-xl md:text-2xl bg-black bg-opacity-50 px-4 py-2 rounded">
                    KARTING TRACK
                  </div>
                </div>
              </div>

              {/* Tents arranged around the track */}
              <div className="grid grid-cols-8 gap-2 sm:gap-3 md:gap-4 mb-4">
                {/* Top row - Blue tents */}
                {filteredTents
                  .filter(tent => tent.position?.row === 0)
                  .sort((a, b) => (a.position?.col || 0) - (b.position?.col || 0))
                  .map(tent => (
                    <TentCard key={tent.id} tent={tent} onClick={handleTentClick} />
                  ))}
              </div>

              <div className="flex justify-between mb-4">
                {/* Left side - Green tents */}
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                  {filteredTents
                    .filter(tent => tent.position?.col === 0 && tent.position?.row > 0 && tent.position?.row < 8)
                    .sort((a, b) => (a.position?.row || 0) - (b.position?.row || 0))
                    .map(tent => (
                      <TentCard key={tent.id} tent={tent} onClick={handleTentClick} />
                    ))}
                </div>

                {/* Right side - Red tents */}
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                  {filteredTents
                    .filter(tent => tent.position?.col === 8)
                    .sort((a, b) => (a.position?.row || 0) - (b.position?.row || 0))
                    .map(tent => (
                      <TentCard key={tent.id} tent={tent} onClick={handleTentClick} />
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-8 gap-2 sm:gap-3 md:gap-4">
                {/* Bottom row - Blue tents */}
                {filteredTents
                  .filter(tent => tent.position?.row === 9)
                  .sort((a, b) => (a.position?.col || 0) - (b.position?.col || 0))
                  .map(tent => (
                    <TentCard key={tent.id} tent={tent} onClick={handleTentClick} />
                  ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm font-medium">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm font-medium">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm font-medium">Occupied</span>
            </div>
          </div>
        </div>

        {/* Selected Tent Details Modal */}
        {selectedTent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Tent {selectedTent.id}</h3>
                <button
                  onClick={() => setSelectedTent(null)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    selectedTent.status === 'available' ? 'bg-green-100 text-green-800' :
                    selectedTent.status === 'reserved' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedTent.status.charAt(0).toUpperCase() + selectedTent.status.slice(1)}
                  </span>
                </div>
                
                {selectedTent.bookedBy && (
                  <div className="flex justify-between">
                    <span className="font-medium">Contact:</span>
                    <span>{selectedTent.bookedBy}</span>
                  </div>
                )}
                
                {selectedTent.hours && (
                  <div className="flex justify-between">
                    <span className="font-medium">Duration:</span>
                    <span>{selectedTent.hours} hours</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTent(null)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TentsLayoutPage;