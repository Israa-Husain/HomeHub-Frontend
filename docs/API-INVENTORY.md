# HomeHub consolidated backend API inventory after Phase 4

Generated from current Java controller source, not from a running OpenAPI server. This accounts for application controller operations only. Phase 1-4 changes remain uncommitted. Live PostgreSQL, JWT-account and deployment integration remain unverified.

Base URL: http://localhost:8070. Protected calls require `Authorization: Bearer <JWT>`. The existing security chain permits auth routes, Swagger/OpenAPI and /uploads/** anonymously; all other application API routes require authentication. Marketplace/public-facing reads therefore currently require login. Controller role checks shown below are additional restrictions; ownership and booking-state checks are enforced by services.

Pageable means query parameters page (zero-based), size and sort=field,asc|desc. Page responses contain content, totalElements, totalPages, number and size. RequestBody parameters refer to JSON unless multipart/form-data is explicitly specified. Query date/time values use ISO dates/times without timezone offsets.

## AdminController.java - /api/admin

Frontend consumer: Admin.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/admin/users` | hasRole('ADMIN') | `public Page<UserResponse> getAllUsers(Pageable pageable)` | `200: Page<UserResponse>` |
| `GET /api/admin/providers` | hasRole('ADMIN') | `public Page<Map<String,Object>> getProviderApplications(@RequestParam(required=false) ProviderStatus status,Pageable pageable)` | `200: Page<Map<String,Object>>` |
| `GET /api/admin/providers/{providerId}` | hasRole('ADMIN') | `public Map<String,Object> getProviderApplication(@PathVariable Long providerId)` | `200: Map<String,Object>` |
| `PUT /api/admin/providers/{providerId}/approve` | hasRole('ADMIN') | `public ProviderResponse approveProvider(@PathVariable Long providerId)` | `200: ProviderResponse` |
| `DELETE /api/admin/users/{userId}` | hasRole('ADMIN') | `public void deactivateUser(@PathVariable Long userId)` | `204: void` |

## AuthController.java - /api/auth

Frontend consumer: Auth.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `POST /api/auth/register` | Public (no JWT required) | `public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request)` | `201: ResponseEntity<?>` |
| `GET /api/auth/verify` | Public (no JWT required) | `public ResponseEntity<?> verifyEmail(@RequestParam String token)` | `200: ResponseEntity<?>` |
| `POST /api/auth/login` | Public (no JWT required) | `public LoginResponse login(@Valid @RequestBody LoginRequest request)` | `200: LoginResponse` |
| `POST /api/auth/forgot-password` | Public (no JWT required) | `public Map<String,String> forgot(@Valid @RequestBody ForgotPasswordRequest request)` | `200: Map<String,String>` |
| `POST /api/auth/reset-password` | Public (no JWT required) | `public Map<String,String> reset(@Valid @RequestBody ResetPasswordRequest request)` | `200: Map<String,String>` |

## AvailabilityController.java - /api/availability

Frontend consumer: Provider.jsx / service booking.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/availability` | !#timeOff &#124;&#124; hasRole('PROVIDER') | `public List<AvailabilityResponse> getProviderAvailabilityByDate(@RequestParam Long providerId, @RequestParam LocalDate date,@RequestParam(defaultValue="false") boolean timeOff)` | `200: List<AvailabilityResponse>` |
| `POST /api/availability` | hasRole('PROVIDER') | `public ResponseEntity<AvailabilityResponse> createAvailability(@Valid @RequestBody AvailabilityRequest request)` | `201: ResponseEntity<AvailabilityResponse>` |
| `PUT /api/availability/{availabilityId}` | hasRole('PROVIDER') | `public AvailabilityResponse updateAvailability(@PathVariable Long availabilityId,@Valid @RequestBody AvailabilityRequest request)` | `200: AvailabilityResponse` |
| `DELETE /api/availability/{availabilityId}` | hasRole('PROVIDER') | `public void deleteAvailability(@PathVariable Long availabilityId)` | `204: void` |
| `POST /api/availability/time-off` | hasRole('PROVIDER') | `public ResponseEntity<AvailabilityResponse> blockTimeOff(@Valid @RequestBody AvailabilityRequest request)` | `201: ResponseEntity<AvailabilityResponse>` |

## BookingController.java - /api/booking

Frontend consumer: Bookings.jsx / Services.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `POST /api/booking` | hasRole('HOMEOWNER') | `public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request)` | `201: ResponseEntity<BookingResponse>` |
| `GET /api/booking` | Authenticated; service authorization applies | `public Page<BookingResponse> getCurrentUserBookings(@RequestParam(required = false)BookingStatus status, Pageable pageable)` | `200: Page<BookingResponse>` |
| `GET /api/booking/available-times` | Authenticated; service authorization applies | `public List<LocalTime> getAvailableAppointmentTimes(@RequestParam Long serviceId,@RequestParam LocalDate date, @RequestParam(defaultValue="NORMAL") BookingType bookingType)` | `200: List<LocalTime>` |
| `GET /api/booking/{bookingId}/history` | Authenticated; service authorization applies | `public Page<Map<String,Object>> getBookingHistory(@PathVariable Long bookingId,Pageable pageable)` | `200: Page<Map<String,Object>>` |
| `GET /api/booking/{bookingId}` | Authenticated; service authorization applies | `public BookingResponse getBookingById(@PathVariable Long bookingId)` | `200: BookingResponse` |
| `DELETE /api/booking/{bookingId}` | Authenticated; service authorization applies | `public BookingResponse cancelBooking(@PathVariable Long bookingId)` | `200: BookingResponse` |
| `PUT /api/booking/{bookingId}/status` | hasAnyRole('ADMIN','PROVIDER') | `public BookingResponse updateBookingStatus(@PathVariable Long bookingId, @Valid @RequestBody BookingStatusRequest request)` | `200: BookingResponse` |

## BookingRescheduleController.java - /api/reschedules

Frontend consumer: Homeowner/provider reschedule pages.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/reschedules` | hasAnyRole('HOMEOWNER','PROVIDER') | `public Page<Map<String,Object>> getCurrentUserRequests(@RequestParam(required=false) RescheduleStatus status, @RequestParam(required=false) Long bookingId,Pageable pageable)` | `200: Page<Map<String,Object>>` |
| `GET /api/reschedules/{id}` | hasAnyRole('HOMEOWNER','PROVIDER') | `public Map<String,Object> getRequestById(@PathVariable Long id)` | `200: Map<String,Object>` |
| `POST /api/reschedules/booking/{bookingId}` | hasRole('HOMEOWNER') | `public Map<String,Object> requestReschedule(@PathVariable Long bookingId,@Valid @RequestBody Request request)` | `200: Map<String,Object>` |
| `PUT /api/reschedules/{id}/decision` | hasRole('PROVIDER') | `public Map<String,Object> decideReschedule(@PathVariable Long id,@Valid @RequestBody Decision decision)` | `200: Map<String,Object>` |

## BookingWaitlistController.java - /api/waitlist

Frontend consumer: Saved.jsx / Services.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `POST /api/waitlist` | hasRole('HOMEOWNER') | `public Map<String,Object> joinWaitlist(@Valid @RequestBody JoinRequest request)` | `200: Map<String,Object>` |
| `GET /api/waitlist` | hasRole('HOMEOWNER') | `public List<Map<String,Object>> getMyWaitlist()` | `200: List<Map<String,Object>>` |
| `DELETE /api/waitlist/{id}` | hasRole('HOMEOWNER') | `public void leaveWaitlist(@PathVariable Long id)` | `200: void` |
| `POST /api/waitlist/{id}/claim` | hasRole('HOMEOWNER') | `public Object claimWaitlistOffer(@PathVariable Long id)` | `200: Object` |

## CategoryController.java - /api/categories

Frontend consumer: Services.jsx / Admin.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/categories` | Authenticated; service authorization applies | `public Page<Category> getAllCategories(Pageable pageable)` | `200: Page<Category>` |
| `GET /api/categories/{categoryId}` | Authenticated; service authorization applies | `public Category getCategoryById(@PathVariable Long categoryId)` | `200: Category` |
| `POST /api/categories` | hasRole('ADMIN') | `public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryRequest request)` | `201: ResponseEntity<Category>` |
| `PUT /api/categories/{categoryId}` | hasRole('ADMIN') | `public Category updateCategory(@PathVariable Long categoryId, @Valid @RequestBody CategoryRequest request)` | `200: Category` |
| `DELETE /api/categories/{categoryId}` | hasRole('ADMIN') | `public void deleteCategory(@PathVariable Long categoryId)` | `204: void` |

## HomeController.java - /api/homes

Frontend consumer: Homes.jsx / service booking.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `POST /api/homes` | hasRole('HOMEOWNER') | `public ResponseEntity<Home> createHome(@Valid @RequestBody HomeRequest request)` | `201: ResponseEntity<Home>` |
| `GET /api/homes` | hasRole('HOMEOWNER') | `public Page<Home> getCurrentUserHomes(Pageable pageable)` | `200: Page<Home>` |
| `GET /api/homes/{homeId}` | hasRole('HOMEOWNER') | `public Home getHomeById(@PathVariable Long homeId)` | `200: Home` |
| `PUT /api/homes/{homeId}` | hasRole('HOMEOWNER') | `public Home updateHome(@PathVariable Long homeId, @Valid @RequestBody HomeRequest request)` | `200: Home` |
| `DELETE /api/homes/{homeId}` | hasRole('HOMEOWNER') | `public void deleteHome(@PathVariable Long homeId)` | `204: void` |

## HomeownerAssessmentController.java - /api/assessments

Frontend consumer: Booking details (provider only).

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `POST /api/assessments/booking/{bookingId}` | hasRole('PROVIDER') | `public Map<String, Object> submitAssessment(@PathVariable Long bookingId, @Valid @RequestBody AssessmentRequest request)` | `200: Map<String, Object>` |
| `GET /api/assessments/booking/{bookingId}` | hasRole('PROVIDER') | `public List<Map<String,Object>> getAssessment(@PathVariable Long bookingId)` | `200: List<Map<String,Object>>` |

## NotificationController.java - /api/notifications

Frontend consumer: NotificationContext / Saved.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/notifications/stream` | Authenticated; service authorization applies | `public SseEmitter subscribeToNotifications()` | `200: SseEmitter` |
| `GET /api/notifications` | Authenticated; service authorization applies | `public List<Map<String, Object>> getHistory()` | `200: List<Map<String, Object>>` |
| `GET /api/notifications/unread-count` | Authenticated; service authorization applies | `public Map<String,Long> getUnreadCount()` | `200: Map<String,Long>` |
| `PATCH /api/notifications/{id}/read` | Authenticated; service authorization applies | `public void markRead(@PathVariable Long id)` | `200: void` |

## ProviderController.java - /api/providers

Frontend consumer: Provider.jsx / provider details.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `POST /api/providers` | hasRole('PROVIDER') | `public ResponseEntity<ProviderResponse> createProviderProfile(@Valid @RequestBody ProviderRequest request)` | `201: ResponseEntity<ProviderResponse>` |
| `GET /api/providers/profile` | hasRole('PROVIDER') | `public ProviderResponse getCurrentProviderProfile()` | `200: ProviderResponse` |
| `PUT /api/providers/profile` | hasRole('PROVIDER') | `public ProviderResponse updateProviderProfile(@Valid @RequestBody ProviderRequest request)` | `200: ProviderResponse` |
| `GET /api/providers/{providerId}` | Authenticated; service authorization applies | `public ProviderResponse getProviderDetails(@PathVariable Long providerId)` | `200: ProviderResponse` |
| `PUT /api/providers/portfolio` | hasRole('PROVIDER') | `public ProviderResponse updatePortfolio(@RequestBody PortfolioRequest request)` | `200: ProviderResponse` |

## ServiceFavoriteController.java - /api/favorites

Frontend consumer: Saved.jsx / Services.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `POST /api/favorites/{serviceId}` | hasRole('HOMEOWNER') | `public Map<String,Object> addFavorite(@PathVariable Long serviceId)` | `200: Map<String,Object>` |
| `GET /api/favorites` | hasRole('HOMEOWNER') | `public List<Map<String,Object>> getMyFavorites()` | `200: List<Map<String,Object>>` |
| `DELETE /api/favorites/{favoriteId}` | hasRole('HOMEOWNER') | `public void removefavorite(@PathVariable Long favoriteId)` | `200: void` |

## ServiceOfferingController.java - /api/services

Frontend consumer: Services.jsx / Provider.jsx.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/services` | Authenticated; service authorization applies | `public Page<ServiceResponse> getAllServiceOffering(@RequestParam(required = false) Long categoryId, @RequestParam(required = false) Long providerId, Pageable pageable)` | `200: Page<ServiceResponse>` |
| `GET /api/services/mine` | hasRole('PROVIDER') | `public Page<ServiceResponse> getCurrentProviderServices(Pageable pageable)` | `200: Page<ServiceResponse>` |
| `GET /api/services/{serviceId}` | Authenticated; service authorization applies | `public ServiceResponse getServiceOfferingById(@PathVariable Long serviceId)` | `200: ServiceResponse` |
| `POST /api/services` | hasRole('PROVIDER') | `public ResponseEntity<ServiceResponse> createServiceOffering(@Valid @RequestBody ServiceRequest request)` | `201: ResponseEntity<ServiceResponse>` |
| `PUT /api/services/{serviceId}` | hasRole('PROVIDER') | `public ServiceResponse updateServiceOffering(@PathVariable Long serviceId, @Valid @RequestBody ServiceRequest request)` | `200: ServiceResponse` |
| `DELETE /api/services/{serviceId}` | hasRole('PROVIDER') | `public void deactivateServiceOffering(@PathVariable Long serviceId)` | `204: void` |
| `GET /api/services/search` | Authenticated; service authorization applies | `public Page<ServiceResponse> searchServices( @RequestParam(required = false) String name, @RequestParam(required = false) Long categoryId, @RequestParam(required = false) Long providerId, @RequestParam(required = false) Double minPrice, @RequestParam(required = false) Double maxPrice, Pageable pageable)` | `200: Page<ServiceResponse>` |

## ServiceReportController.java - /api/reports

Frontend consumer: Booking details.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/reports/booking/{bookingId}` | Authenticated; service authorization applies | `public Map<String,Object> getReport(@PathVariable Long bookingId)` | `200: Map<String,Object>` |
| `POST /api/reports/booking/{bookingId}` | hasRole('PROVIDER') | `public Map<String,Object> submitReport(@PathVariable Long bookingId, @Valid @RequestBody ReportRequest request)` | `200: Map<String,Object>` |

## ServiceReviewController.java - /api/reviews

Frontend consumer: Provider details / own reviews.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/reviews/mine` | hasRole('HOMEOWNER') | `public Page<Map<String,Object>> getMyReviews(Pageable pageable)` | `200: Page<Map<String,Object>>` |
| `POST /api/reviews` | hasRole('HOMEOWNER') | `public Map<String,Object> createReview(@Valid @RequestBody ReviewRequest request)` | `200: Map<String,Object>` |
| `GET /api/reviews/provider/{providerId}` | Authenticated; service authorization applies | `public List<Map<String,Object>> getProvider(@PathVariable Long providerId)` | `200: List<Map<String,Object>>` |

## UserController.java - /api/users

Frontend consumer: Account.jsx / AuthContext.

| Method and complete path | Additional role restriction | Exact request signature | Success response |
|---|---|---|---|
| `GET /api/users/profile` | Authenticated; service authorization applies | `public UserResponse getCurrentUserProfile()` | `200: UserResponse` |
| `PUT /api/users/profile` | Authenticated; service authorization applies | `public UserResponse updateUserProfile(@Valid @RequestBody UpdateUserRequest request)` | `200: UserResponse` |
| `PUT /api/users/change-password` | Authenticated; service authorization applies | `public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request)` | `204: ResponseEntity<Void>` |
| `POST /api/users/profile-picture` | Authenticated; service authorization applies | `public Map<String,String> uploadProfilePicture(@RequestParam MultipartFile file)` | `200: Map<String,String>` |

**Total: 70 operations across 16 controllers.**

## Map response contracts and authorization details

- Auth registration/verification/recovery/reset return message objects; login returns LoginResponse with token and type. Verification emails link directly to the backend; reset emails contain a token. There is no server logout/revocation or refresh-token endpoint.
- Admin provider list returns Page<{provider: ProviderResponse, applicant: UserResponse, createdAt, updatedAt}>. Detail returns that same application object. Applicant contact/status/verification data is ADMIN-only; no password/hash is exposed. Status filters use only PENDING, APPROVED and SUSPENDED. Approval reuses the original approval method.
- Service list/search return discoverable active offerings; optional categoryId/providerId filters, search price/name filters and pagination are supported. Mine includes the current provider's inactive services. Hidden detail reads are restricted to owner/ADMIN; authorized historical booking reads are independent and remain available.
- Provider marketplace details require approved/active provider accounts. Current profile reads permit the provider to see their own pending status. Portfolio uses existing stored text and emergency preferences; no portfolio-image API exists.
- AvailabilityResponse contains scheduling fields and providerId, not a nested account entity. timeOff=true reads are PROVIDER-only and require ownership. DELETE soft-removes availability/time off without enabling a period. PUT preserves its period type.
- Available-times returns sorted unique LocalTime suggestions at one-minute resolution; no reservation is created. Booking creation revalidates under the provider lock. Normal notice, emergency opt-in, same-day end time, occupancy, time off and live offers apply.
- Booking list is current-user scoped: assigned provider bookings for PROVIDER; customer bookings otherwise, including ADMIN. It is not a global admin list. Detail/history permit owner, assigned provider or ADMIN. Cancellation permits homeowner owner or ADMIN; status changes permit assigned provider/ADMIN with the existing transition rules. BookingResponse exposes response/report deadlines, final price, provider ID and timestamps.
- Booking history is Page<{id,action,recordedAt,actorId,actorRole,status}> from existing audits. It excludes raw descriptions/contact data and does not reconstruct missing events. No exact persisted expiredAt is available.
- Reschedule map: id, bookingId, date, start, status, bookingDate, bookingStartTime, bookingEndTime, bookingStatus, serviceId, serviceName, providerId, providerName, createdAt, updatedAt. Booking fields describe the current appointment, not an immutable original snapshot after approval. Listing is participant scoped before pagination; ADMIN has no participant endpoint privilege.
- Waitlist map: id, serviceId, homeId, date, start, status, offerExpiresAt. The expiry can be null and is informational; backend claim/expiration logic remains authoritative. Listing already includes own offers and historical statuses; no duplicate offers endpoint is required.
- Favorite map: id, serviceId. DELETE takes the favorite ID, not the service ID.
- Public/provider review map: id, rating, providerId, comment, createdAt. Internal bookingId is intentionally omitted. Own/submission maps additionally include bookingId, serviceId and serviceName. Mine is a HOMEOWNER-only Page scoped to authentication. Provider review listing retains its existing List response.
- Report map: id, bookingId, workPerformed, materialsUsed, recommendation. Submission uses workDone, materialsUsed and recommendation. Reads are private to the booking homeowner/assigned provider; ADMIN has no override. Submission requires an ended CONFIRMED/AWAITING_REPORT appointment and assigned provider. Required report before COMPLETED remains enforced by BookingService. Report deadline is already in BookingResponse.
- Assessment map: id, rating, comment. Only assigned PROVIDER reviewing a PENDING booking can read prior homeowner assessments. Only assigned PROVIDER after COMPLETED can submit one. No homeowner/admin/public assessment access or raw author/homeowner entity is exposed.
- Notification history is List<{id,message,read,type}> sorted newest first. Count is {count}. History, count, read mutation and stream use the current account ID; no client-selected recipient. PATCH retains the existing empty HTTP 200 response. Stream requires Accept: text/event-stream plus the Bearer header and sends named booking events. Persistent after-commit delivery covers bookings/reschedules/waitlists; no second system was added.
- Report/review/assessment text request limits now match existing 3000-character columns. No schema was changed. Other validation and business exceptions remain in the existing services.

## Errors and frontend handling

ApiError is {timestamp,status,error,message,path}. Missing/invalid query and path parameter conversions return safe 400 messages. Authentication is 401, authorization 403, missing records 404, duplicate-information conflicts 409, booking/status conflicts 422, rate limiting 429 where configured, unexpected server errors 500. Handle empty responses/204 without JSON parsing. Multipart profile upload uses field file and permits verified JPG/PNG/WEBP content up to 5,000,000 bytes; /uploads serves the returned URL. Native EventSource cannot send the required Bearer header; existing frontend streaming fetch is the applicable approach.

## Exact DTO and enum source contracts

The following current source declarations are included to preserve exact JSON field spellings and validation annotations. Controller-local request records and Map contracts are shown in the operation signatures/notes above.

### dto/AvailabilityRequest.java

```java
package com.ga.HomeHub.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AvailabilityRequest(@NotNull LocalDate date, @NotNull LocalTime startTime, @NotNull LocalTime endTime) {
}
```

### dto/AvailabilityResponse.java

```java
package com.ga.HomeHub.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

//Expose scheduling fields without serializing the provider's linked user account.
public record AvailabilityResponse(Long id,Long providerId,LocalDate date,LocalTime startTime,LocalTime endTime,
                                   boolean available,boolean timeOff,LocalDateTime createdAt,LocalDateTime updatedAt){
}
```

### dto/BookingRequest.java

```java
package com.ga.HomeHub.dto;

import com.ga.HomeHub.model.enums.BookingType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookingRequest(@NotNull Long homeId, @NotNull Long serviceId, @NotNull LocalDate bookingDate, @NotNull LocalTime startTime, String note, BookingType bookingType) {
}
```

### dto/BookingResponse.java

```java
package com.ga.HomeHub.dto;

import com.ga.HomeHub.model.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record BookingResponse(
        Long id,
        Long homeId,
        Long serviceId,
        String serviceName,
        String providerName,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        BookingStatus status,
        String note,
        String bookingType,
        Double finalPrice,
        LocalDateTime responseDeadline,
        Long providerId,
        LocalDateTime reportDeadline,
        boolean lateCancellation,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
```

### dto/BookingStatusRequest.java

```java
package com.ga.HomeHub.dto;

import com.ga.HomeHub.model.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record BookingStatusRequest(@NotNull BookingStatus status) {
}
```

### dto/CategoryRequest.java

```java
package com.ga.HomeHub.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(@NotBlank String name, String description) {
}
```

### dto/HomeRequest.java

```java
package com.ga.HomeHub.dto;

import jakarta.validation.constraints.NotBlank;

public record HomeRequest(@NotBlank String name, @NotBlank String city, @NotBlank String address) {
}
```

### dto/ProviderRequest.java

```java
package com.ga.HomeHub.dto;

import jakarta.validation.constraints.NotBlank;

public record ProviderRequest(@NotBlank String businessName, String description) {
}
```

### dto/ProviderResponse.java

```java
package com.ga.HomeHub.dto;

public record ProviderResponse(
        Long id,
        String businessName,
        String description,
        String providerStatus,
        String portfolioDescription,
        boolean emergencyEnabled
) {
}
```

### dto/ServiceRequest.java

```java
package com.ga.HomeHub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ServiceRequest(@NotNull Long categoryId, @NotBlank String name, String description, @NotNull @Positive Double price, @NotNull @Positive Integer durationMinutes, Boolean emergencyEnabled) {
}
```

### dto/ServiceResponse.java

```java
package com.ga.HomeHub.dto;

public record ServiceResponse(
        Long id,
        String name,
        String description,
        Double price,
        Integer durationMinutes,
        String categoryName,
        String providerName,
        Long categoryId,
        Long providerId,
        String status,
        String categoryStatus,
        String providerStatus,
        boolean emergencyEnabled,
        boolean providerEmergencyEnabled,
        boolean emergencyEligible
) {
}
```

### dto/auth/ChangePasswordRequest.java

```java
package com.ga.HomeHub.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank
        String currentPassword,
        @NotBlank
        @Size(min = 8)
        String newPassword) { }
```

### dto/auth/ForgotPasswordRequest.java

```java
package com.ga.HomeHub.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(@Email @NotBlank String email) {
}
```

### dto/auth/LoginRequest.java

```java
package com.ga.HomeHub.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {
}
```

### dto/auth/LoginResponse.java

```java
package com.ga.HomeHub.dto.auth;

public record LoginResponse(String token, String type) {
    public LoginResponse(String token){
        this(token, "Bearer");
    }
}
```

### dto/auth/RegisterRequest.java

```java
package com.ga.HomeHub.dto.auth;

import com.ga.HomeHub.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String firstname,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String phoneNumber,
        @NotNull Role role) { }
```

### dto/auth/ResetPasswordRequest.java

```java
package com.ga.HomeHub.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank
        String token,
        @NotBlank
        @Size(min = 8)
        String newPassword) { }
```

### dto/user/UpdateUserRequest.java

```java
package com.ga.HomeHub.dto.user;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserRequest(@NotBlank String firstName, @NotBlank String lastName, String phoneNumber) {
}
```

### dto/user/UserResponse.java

```java
package com.ga.HomeHub.dto.user;

import com.ga.HomeHub.model.User;
import com.ga.HomeHub.model.enums.Role;
import com.ga.HomeHub.model.enums.UserStatus;
import lombok.Data;

import java.time.LocalDateTime;


public record UserResponse(Long id, String firstName, String lastName, String email, String phoneNumber, String profilePictureUrl, Role role, UserStatus status, boolean isEmailVerified, LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmailAddress(), user.getPhoneNumber(), user.getProfilePictureUrl(), user.getRole(), user.getStatus(), user.isEmailVerified(), user.getCreatedAt(), user.getUpdatedAt());
    }
}
```

### model/enums/BookingStatus.java

```java
package com.ga.HomeHub.model.enums;

public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED,
    EXPIRED,
    REJECTED,
    AWAITING_REPORT
}
```

### model/enums/BookingType.java

```java
package com.ga.HomeHub.model.enums;

public enum BookingType {
    NORMAL,
    EMERGENCY
}
```

### model/enums/CategoryStatus.java

```java
package com.ga.HomeHub.model.enums;

public enum CategoryStatus {
    ACTIVE,
    INACTIVE
}
```

### model/enums/ProviderStatus.java

```java
package com.ga.HomeHub.model.enums;

public enum ProviderStatus {
    PENDING,
    APPROVED,
    SUSPENDED
}
```

### model/enums/RescheduleStatus.java

```java
package com.ga.HomeHub.model.enums;

public enum RescheduleStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED
}
```

### model/enums/Role.java

```java
package com.ga.HomeHub.model.enums;

public enum Role {
    HOMEOWNER,
    PROVIDER,
    ADMIN
}
```

### model/enums/ServiceStatus.java

```java
package com.ga.HomeHub.model.enums;

public enum ServiceStatus {
    ACTIVE,
    INACTIVE
}
```

### model/enums/UserStatus.java

```java
package com.ga.HomeHub.model.enums;

public enum UserStatus {
    ACTIVE,
    INACTIVE
}
```

### model/enums/WaitlistStatus.java

```java
package com.ga.HomeHub.model.enums;

public enum WaitlistStatus {
    WAITING,
    OFFERED,
    CLAIMED,
    EXPIRED,
    CANCELLED
}
```


## Controller-local request records

These are existing records nested in their controller classes, not new standalone DTOs.

### BookingRescheduleController.java

```java
public record Request(@NotNull LocalDate date, @NotNull LocalTime start){}
```

### BookingRescheduleController.java

```java
public record Decision(@NotNull Boolean approve){}
```

### BookingWaitlistController.java

```java
public record JoinRequest(@NotNull Long serviceId,@NotNull Long homeId,@NotNull LocalDate date,@NotNull LocalTime start){}
```

### HomeownerAssessmentController.java

```java
public record AssessmentRequest(Integer rating,@Size(max=3000) String comment){}
```

### ProviderController.java

```java
public record PortfolioRequest(String description,boolean emergencyEnabled){}
```

### ServiceReportController.java

```java
public record ReportRequest(@NotBlank @Size(max=3000) String workDone, @Size(max=3000) String materialsUsed, @Size(max=3000) String recommendation){}
```

### ServiceReviewController.java

```java
public record ReviewRequest(@NotNull Long bookingId, @Min(1) @Max(5) int rating, @Size(max=3000) String comment){}
```



Phase 5 frontend consumers: Provider.jsx handles provider details, owned services and availability; Reschedules.jsx handles homeowner/provider requests and decisions; Bookings.jsx includes reports, assessments and booking history; Saved.jsx includes reviews, favorites, waitlists and notifications. See PHASE-5-INTEGRATION.md for verification limits.
