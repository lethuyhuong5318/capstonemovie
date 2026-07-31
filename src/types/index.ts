export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export type AgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18';

export interface Movie {
  id: number;
  name: string;
  englishName: string;
  trailerUrl: string;
  description: string;
  genres: string[];
  durationMinutes: number;
  releaseDate: string;
  ageRating: AgeRating;
  director: string;
  cast: string[];
  country: string;
  language: string;
  isUpcoming: boolean;
  isShowing: boolean;
  isHot: boolean;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
}

export type MovieDetail = Movie;

export interface Room {
  id: number;
  name: string;
  rows: number;
  cols: number;
  roomType: '2D' | '3D' | 'IMAX';
}

export interface Cinema {
  id: number;
  name: string;
  address: string;
  city: string;
  rooms: Room[];
}

export interface CinemaSystem {
  id: number;
  name: string;
  shortName: string;
  cinemas: Cinema[];
}

export type ShowtimeStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'SOLD_OUT' | 'EXPIRED';

export interface Showtime {
  id: number;
  movieId: number;
  cinemaSystemId: number;
  cinemaId: number;
  roomId: number;
  date: string;
  time: string;
  price: number;
  roomType: '2D' | '3D' | 'IMAX';
}

export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE';
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';

export interface Seat {
  id: number;
  showtimeId: number;
  seatId: number;
  code: string;
  type: SeatType;
  price: number;
  status: SeatStatus;
}

export type BookingStatus = 'UPCOMING' | 'WATCHED' | 'CANCELLED';

export interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  items: string[];
}

export interface BookingCombo {
  comboId: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type FnbStatus = 'NOT_REDEEMED' | 'REDEEMED' | 'CANCELLED';

export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'EWALLET' | 'QR';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Booking {
  id: number;
  code: string;
  userId: number;
  showtimeId: number;
  seatCodes: string[];
  seatTotal: number;
  combos: BookingCombo[];
  comboTotal: number;
  total: number;
  status: BookingStatus;
  createdAt: string;
  fnbCode?: string;
  fnbStatus?: FnbStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionCode: string;
}

export interface Review {
  id: number;
  movieId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  verified: boolean;
  likedBy: number[];
  reportedBy: number[];
  createdAt: string;
  updatedAt?: string;
}

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  isLocked?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
