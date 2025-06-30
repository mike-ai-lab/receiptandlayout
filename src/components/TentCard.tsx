import React, { useState } from 'react';
import type { Tent } from '../utils/tentTypes';

interface TentCardProps {
  tent: Tent;
  onClick?: (tent: Tent) => void;
}

const TentCard: React.FC<TentCardProps> = ({ tent, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColor = (status: Tent['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'reserved':
        return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600 border-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
    }
  };

  const getStatusText = (status: Tent['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'occupied':
        return 'Occupied';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="relative">
      <div
        className={`
          w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 
          ${getStatusColor(tent.status)}
          border-2 rounded-lg cursor-pointer
          flex flex-col items-center justify-center
          text-white font-bold text-xs sm:text-sm
          transition-all duration-200 transform hover:scale-105
          shadow-md hover:shadow-lg
        `}
        onClick={() => onClick?.(tent)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="text-center">
          <div className="font-bold">{tent.id}</div>
          <div className="text-xs opacity-90">{getStatusText(tent.status)}</div>
        </div>
      </div>

      {showTooltip && (tent.status === 'reserved' || tent.status === 'occupied') && tent.bookedBy && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold">Contact: {tent.bookedBy}</div>
          {tent.hours && <div>Duration: {tent.hours}h</div>}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default TentCard;