

Base URL: `{VITE_API_BASE_URL}` (mặc định `http://localhost:3000/api`)

Response chuẩn:
```json
{ "success": true, "message": "string", "data": {}, "meta": { "page": 1, "pageSize": 10, "total": 100 } }
```
Error chuẩn:
```json
{ "success": false, "message": "string", "errorCode": "SEAT_ALREADY_BOOKED" }
```

Auth: Bearer JWT trong header `Authorization: Bearer <accessToken>` (đã gắn sẵn qua interceptor tại `src/lib/axios.ts`).

---

## 1. POST /api/auth/register
- Auth: Không
- Body: `{ username, password, email, phone, fullName }`
- Response: `{ user: User, accessToken, refreshToken }`
- Error: `USERNAME_TAKEN` (409)
- Màn hình: [RegisterPage](src/pages/public/RegisterPage.tsx)

## 2. POST /api/auth/login
- Auth: Không
- Body: `{ username, password }`
- Response: `{ user: User, accessToken, refreshToken }`
- Error: `INVALID_CREDENTIALS` (401), `ACCOUNT_LOCKED` (403)
- Màn hình: [LoginPage](src/pages/public/LoginPage.tsx)

## 3. GET /api/auth/me
- Auth: Bắt buộc
- Response: `User`
- Màn hình: khởi tạo session toàn app

## 4. POST /api/auth/forgot-password
- Auth: Không
- Body: `{ email }`
- Response: `{ sent: true }`
- Màn hình: [ForgotPasswordPage](src/pages/public/ForgotPasswordPage.tsx)

## 5. GET /api/movies
- Auth: Không
- Query: `keyword?`, `status?` (`showing` | `upcoming` | `all`)
- Response: `Movie[]`
- Màn hình: [HomePage](src/pages/public/HomePage.tsx), [SchedulePage](src/pages/public/SchedulePage.tsx)

## 6. GET /api/movies/:id
- Auth: Không
- Response: `Movie`
- Màn hình: [MovieDetailPage](src/pages/public/MovieDetailPage.tsx)

## 7. GET /api/movies/:id/showtimes
- Auth: Không
- Query: `city?`
- Response: nhóm theo hệ thống rạp → cụm rạp → ngày → suất chiếu (kèm `status`: `AVAILABLE` | `ALMOST_FULL` | `SOLD_OUT` | `EXPIRED`)
- Màn hình: [MovieDetailPage](src/pages/public/MovieDetailPage.tsx)

## 8. GET /api/cinema-systems
- Auth: Không
- Response: `CinemaSystem[]` (kèm `cinemas[].rooms[]`)
- Màn hình: [HomePage](src/pages/public/HomePage.tsx), [CinemaListPage](src/pages/public/CinemaListPage.tsx)

## 9. GET /api/cinemas/:id
- Auth: Không
- Response: `Cinema`

## 10. GET /api/showtimes/:id
- Auth: Không
- Response: `Showtime` (kèm tên phim/rạp để hiển thị nhanh)
- Màn hình: [BookingPage](src/pages/public/BookingPage.tsx)

## 11. GET /api/showtimes/:id/seats
- Auth: Không
- Response: `Seat[]` (`type`: STANDARD|VIP|COUPLE, `status`: AVAILABLE|HELD|BOOKED)
- Màn hình: [BookingPage](src/pages/public/BookingPage.tsx)

## 12. POST /api/bookings/hold-seats
- Auth: Bắt buộc
- Body: `{ showtimeId, seatCodes: string[] }`
- Response: `{ heldUntil: string }` — giữ ghế tạm thời (đề xuất TTL 5 phút)
- Error: `SEAT_ALREADY_HELD` (409)
- Màn hình: [BookingPage](src/pages/public/BookingPage.tsx) (đếm ngược `useCountdown`)

## 13. POST /api/bookings
- Auth: Bắt buộc
- Body: `{ showtimeId, seatCodes: string[] }`
- Response: `Booking` (`code`, `total`, `status: UPCOMING`)
- Error: `SEAT_ALREADY_BOOKED` (409) — bắt buộc dùng transaction để tránh 2 người đặt trùng ghế
- Màn hình: [BookingPage](src/pages/public/BookingPage.tsx)

## 14. GET /api/bookings/me
- Auth: Bắt buộc
- Query: `status?` (UPCOMING|WATCHED|CANCELLED)
- Response: `Booking[]`
- Màn hình: [ProfilePage](src/pages/public/ProfilePage.tsx)

## 15. GET /api/bookings/:id
- Auth: Bắt buộc (chỉ chủ sở hữu hoặc admin)
- Response: `Booking` chi tiết
- Màn hình: [TicketDetailPage](src/pages/public/TicketDetailPage.tsx)

## 16. GET /api/admin/movies
- Auth: Admin
- Query: `keyword?`, `page?`, `pageSize?`
- Response: `Movie[]` + `meta`
- Màn hình: [MovieListPage](src/pages/admin/MovieListPage.tsx)

## 17. POST /api/admin/movies
- Auth: Admin
- Body: `multipart/form-data` (poster, backdrop) + các field text
- Response: `Movie`
- Màn hình: [MovieFormPage](src/pages/admin/MovieFormPage.tsx)

## 18. PATCH /api/admin/movies/:id
- Auth: Admin
- Body: giống trên (partial)
- Response: `Movie`

## 19. DELETE /api/admin/movies/:id
- Auth: Admin
- Response: `null`

## 20. POST /api/admin/showtimes
- Auth: Admin
- Body: `{ movieId, cinemaSystemId, cinemaId, date, time, price }`
- Response: `Showtime`
- Error: `ROOM_SCHEDULE_CONFLICT` (409)
- Màn hình: [ShowtimeFormPage](src/pages/admin/ShowtimeFormPage.tsx)

## 21. PATCH /api/admin/showtimes/:id — sửa suất chiếu
## 22. DELETE /api/admin/showtimes/:id — xóa suất chiếu

## 23. GET /api/admin/users
- Auth: Admin
- Query: `keyword?`, `page?`, `pageSize?`
- Response: `User[]` + `meta`
- Màn hình: [UserListPage](src/pages/admin/UserListPage.tsx)

## 24. POST /api/admin/users — thêm người dùng
## 25. PATCH /api/admin/users/:id — sửa người dùng
## 26. PATCH /api/admin/users/:id/lock — khóa/mở khóa tài khoản
- Màn hình: [UserFormPage](src/pages/admin/UserFormPage.tsx)

## 27. GET /api/admin/bookings
- Auth: Admin
- Response: `Booking[]` kèm thông tin khách hàng/phim
- Màn hình: [BookingListPage](src/pages/admin/BookingListPage.tsx)

## 28. GET /api/admin/dashboard/stats
- Auth: Admin
- Response: `{ showingMovies, todayShowtimes, ticketsSold, revenue, topMovies[], upcomingShowtimes[] }`
- Màn hình: [DashboardPage](src/pages/admin/DashboardPage.tsx)

---

## TypeScript interfaces tham chiếu
Xem đầy đủ tại [src/types/index.ts](src/types/index.ts): `Movie`, `CinemaSystem`, `Cinema`, `Room`, `Showtime`, `Seat`, `Booking`, `User`, `ApiResponse`.


