export interface Tent {
  id: string;
  status: 'available' | 'reserved' | 'occupied';
  bookedBy?: string;
  hours?: number;
  position?: {
    row: number;
    col: number;
  };
}

export interface Booking {
  bookingId: string;
  tentId: string;
  contact: string;
  date: string;
  duration: number; // in hours
  status: 'reserved' | 'occupied';
  createdAt: Date;
  notes?: string;
}

export interface TentLayoutConfig {
  rows: number;
  cols: number;
  totalTents: number;
}