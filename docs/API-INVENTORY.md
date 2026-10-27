# HomeHub API inventory

Generated from the running backend OpenAPI and checked against all 16 controller sources. Protected requests use `Authorization: Bearer <token>`. Root API URL: `/api` (local proxy to port 8070). Auth routes are public; other routes require login. Ownership and state checks remain server-side.

## PUT /api/admin/providers/{providerId}/approve

- Controller tag: Admin
- Frontend / role: Admin.jsx — ADMIN
- Parameters: providerId (path, required, integer)
- Body: none
- Responses: 200: ProviderResponse; 400: ProviderResponse; 401: ProviderResponse; 403: ProviderResponse; 404: ProviderResponse

## GET /api/admin/users

- Controller tag: Admin
- Frontend / role: Admin.jsx — ADMIN
- Parameters: pageable (query, required, Pageable)
- Body: none
- Responses: 200: PageUserResponse; 400: PageUserResponse; 401: PageUserResponse; 403: PageUserResponse

## DELETE /api/admin/users/{userId}

- Controller tag: Admin
- Frontend / role: Admin.jsx — ADMIN
- Parameters: userId (path, required, integer)
- Body: none
- Responses: 204: empty; 400: empty; 401: empty; 403: empty; 404: empty

## GET /api/assessments/booking/{bookingId}

- Controller tag: HomeownerAssessment
- Frontend / role: Bookings.jsx — PROVIDER, pending read / completed submission
- Parameters: bookingId (path, required, integer)
- Body: none
- Responses: 200: array<object>; 400: array<object>; 401: array<object>; 403: array<object>; 404: array<object>

## POST /api/assessments/booking/{bookingId}

- Controller tag: HomeownerAssessment
- Frontend / role: Bookings.jsx — PROVIDER, pending read / completed submission
- Parameters: bookingId (path, required, integer)
- Body: application/json: AssessmentRequest
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## POST /api/auth/forgot-password

- Controller tag: Auth
- Frontend / role: Auth.jsx — public
- Parameters: none
- Body: application/json: ForgotPasswordRequest
- Responses: 200: object; 400: object

## POST /api/auth/login

- Controller tag: Auth
- Frontend / role: Auth.jsx — public
- Parameters: none
- Body: application/json: LoginRequest
- Responses: 200: LoginResponse; 400: LoginResponse; 401: LoginResponse; 403: LoginResponse

## POST /api/auth/register

- Controller tag: Auth
- Frontend / role: Auth.jsx — public
- Parameters: none
- Body: application/json: RegisterRequest
- Responses: 201: object; 400: object; 403: object; 409: object

## POST /api/auth/reset-password

- Controller tag: Auth
- Frontend / role: Auth.jsx — public
- Parameters: none
- Body: application/json: ResetPasswordRequest
- Responses: 200: object; 400: object; 404: object

## GET /api/auth/verify

- Controller tag: Auth
- Frontend / role: Auth.jsx — public
- Parameters: token (query, required, string)
- Body: none
- Responses: 200: object; 400: object; 403: object; 404: object; 409: object

## GET /api/availability

- Controller tag: Availability
- Frontend / role: Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: providerId (query, required, integer); date (query, required, string)
- Body: none
- Responses: 200: array<Availability>; 400: array<Availability>; 401: array<Availability>; 403: array<Availability>; 404: array<Availability>

## POST /api/availability

- Controller tag: Availability
- Frontend / role: Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: none
- Body: application/json: AvailabilityRequest
- Responses: 201: Availability; 400: Availability; 401: Availability; 403: Availability; 404: Availability

## POST /api/availability/time-off

- Controller tag: Availability
- Frontend / role: Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: none
- Body: application/json: AvailabilityRequest
- Responses: 201: Availability; 400: Availability; 401: Availability; 403: Availability; 404: Availability

## DELETE /api/availability/{availabilityId}

- Controller tag: Availability
- Frontend / role: Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: availabilityId (path, required, integer)
- Body: none
- Responses: 204: empty; 400: empty; 401: empty; 403: empty; 404: empty

## GET /api/booking

- Controller tag: Booking
- Frontend / role: Bookings.jsx / Services.jsx — participant reads, HOMEOWNER create/cancel, PROVIDER/ADMIN status; ADMIN lookup/cancel
- Parameters: status (query, optional, string); pageable (query, required, Pageable)
- Body: none
- Responses: 200: PageBookingResponse; 400: PageBookingResponse; 401: PageBookingResponse; 403: PageBookingResponse

## POST /api/booking

- Controller tag: Booking
- Frontend / role: Bookings.jsx / Services.jsx — participant reads, HOMEOWNER create/cancel, PROVIDER/ADMIN status; ADMIN lookup/cancel
- Parameters: none
- Body: application/json: BookingRequest
- Responses: 201: BookingResponse; 400: BookingResponse; 401: BookingResponse; 403: BookingResponse; 404: BookingResponse; 422: BookingResponse

## GET /api/booking/{bookingId}

- Controller tag: Booking
- Frontend / role: Bookings.jsx / Services.jsx — participant reads, HOMEOWNER create/cancel, PROVIDER/ADMIN status; ADMIN lookup/cancel
- Parameters: bookingId (path, required, integer)
- Body: none
- Responses: 200: BookingResponse; 401: BookingResponse; 403: BookingResponse; 404: BookingResponse

## DELETE /api/booking/{bookingId}

- Controller tag: Booking
- Frontend / role: Bookings.jsx / Services.jsx — participant reads, HOMEOWNER create/cancel, PROVIDER/ADMIN status; ADMIN lookup/cancel
- Parameters: bookingId (path, required, integer)
- Body: none
- Responses: 200: BookingResponse; 400: BookingResponse; 401: BookingResponse; 403: BookingResponse; 404: BookingResponse; 422: BookingResponse

## PUT /api/booking/{bookingId}/status

- Controller tag: Booking
- Frontend / role: Bookings.jsx / Services.jsx — participant reads, HOMEOWNER create/cancel, PROVIDER/ADMIN status; ADMIN lookup/cancel
- Parameters: bookingId (path, required, integer)
- Body: application/json: BookingStatusRequest
- Responses: 200: BookingResponse; 400: BookingResponse; 401: BookingResponse; 403: BookingResponse; 404: BookingResponse; 422: BookingResponse

## GET /api/categories

- Controller tag: Category
- Frontend / role: Services.jsx / Admin.jsx — authenticated reads; ADMIN mutations
- Parameters: pageable (query, required, Pageable)
- Body: none
- Responses: 200: PageCategory; 400: PageCategory; 401: PageCategory; 403: PageCategory; 404: PageCategory

## POST /api/categories

- Controller tag: Category
- Frontend / role: Services.jsx / Admin.jsx — authenticated reads; ADMIN mutations
- Parameters: none
- Body: application/json: CategoryRequest
- Responses: 201: Category; 400: Category; 401: Category; 403: Category; 404: Category

## GET /api/categories/{categoryId}

- Controller tag: Category
- Frontend / role: Services.jsx / Admin.jsx — authenticated reads; ADMIN mutations
- Parameters: categoryId (path, required, integer)
- Body: none
- Responses: 200: Category; 400: Category; 401: Category; 403: Category; 404: Category

## PUT /api/categories/{categoryId}

- Controller tag: Category
- Frontend / role: Services.jsx / Admin.jsx — authenticated reads; ADMIN mutations
- Parameters: categoryId (path, required, integer)
- Body: application/json: CategoryRequest
- Responses: 200: Category; 400: Category; 401: Category; 403: Category; 404: Category

## DELETE /api/categories/{categoryId}

- Controller tag: Category
- Frontend / role: Services.jsx / Admin.jsx — authenticated reads; ADMIN mutations
- Parameters: categoryId (path, required, integer)
- Body: none
- Responses: 204: empty; 400: empty; 401: empty; 403: empty; 404: empty

## GET /api/favorites

- Controller tag: ServiceFavorite
- Frontend / role: Saved.jsx / Services.jsx — HOMEOWNER
- Parameters: none
- Body: none
- Responses: 200: array<object>; 400: array<object>; 401: array<object>; 403: array<object>; 404: array<object>

## DELETE /api/favorites/{favoriteId}

- Controller tag: ServiceFavorite
- Frontend / role: Saved.jsx / Services.jsx — HOMEOWNER
- Parameters: favoriteId (path, required, integer)
- Body: none
- Responses: 200: empty; 400: empty; 401: empty; 403: empty; 404: empty

## POST /api/favorites/{serviceId}

- Controller tag: ServiceFavorite
- Frontend / role: Saved.jsx / Services.jsx — HOMEOWNER
- Parameters: serviceId (path, required, integer)
- Body: none
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## GET /api/homes

- Controller tag: Home
- Frontend / role: Homes.jsx / Services.jsx — HOMEOWNER
- Parameters: pageable (query, required, Pageable)
- Body: none
- Responses: 200: PageHome; 400: PageHome; 401: PageHome; 403: PageHome; 404: PageHome

## POST /api/homes

- Controller tag: Home
- Frontend / role: Homes.jsx / Services.jsx — HOMEOWNER
- Parameters: none
- Body: application/json: HomeRequest
- Responses: 201: Home; 400: Home; 401: Home; 403: Home; 404: Home

## GET /api/homes/{homeId}

- Controller tag: Home
- Frontend / role: Homes.jsx / Services.jsx — HOMEOWNER
- Parameters: homeId (path, required, integer)
- Body: none
- Responses: 200: Home; 400: Home; 401: Home; 403: Home; 404: Home

## PUT /api/homes/{homeId}

- Controller tag: Home
- Frontend / role: Homes.jsx / Services.jsx — HOMEOWNER
- Parameters: homeId (path, required, integer)
- Body: application/json: HomeRequest
- Responses: 200: Home; 400: Home; 401: Home; 403: Home; 404: Home

## DELETE /api/homes/{homeId}

- Controller tag: Home
- Frontend / role: Homes.jsx / Services.jsx — HOMEOWNER
- Parameters: homeId (path, required, integer)
- Body: none
- Responses: 204: empty; 400: empty; 401: empty; 403: empty; 404: empty

## GET /api/notifications

- Controller tag: Notification
- Frontend / role: NotificationContext / Saved.jsx — authenticated, own records
- Parameters: none
- Body: none
- Responses: 200: array<object>; 400: array<object>; 401: array<object>; 403: array<object>; 404: array<object>

## GET /api/notifications/stream

- Controller tag: Notification
- Frontend / role: NotificationContext / Saved.jsx — authenticated, own records
- Parameters: none
- Body: none
- Responses: 200: SseEmitter; 400: SseEmitter; 401: SseEmitter; 403: SseEmitter; 404: SseEmitter

## GET /api/notifications/unread-count

- Controller tag: Notification
- Frontend / role: NotificationContext / Saved.jsx — authenticated, own records
- Parameters: none
- Body: none
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## PATCH /api/notifications/{id}/read

- Controller tag: Notification
- Frontend / role: NotificationContext / Saved.jsx — authenticated, own records
- Parameters: id (path, required, integer)
- Body: none
- Responses: 200: empty; 400: empty; 401: empty; 403: empty; 404: empty

## POST /api/providers

- Controller tag: Provider
- Frontend / role: Provider.jsx — PROVIDER
- Parameters: none
- Body: application/json: ProviderRequest
- Responses: 201: ProviderResponse; 400: ProviderResponse; 401: ProviderResponse; 403: ProviderResponse; 404: ProviderResponse

## PUT /api/providers/portfolio

- Controller tag: Provider
- Frontend / role: Provider.jsx — PROVIDER
- Parameters: none
- Body: application/json: PortfolioRequest
- Responses: 200: ProviderResponse; 400: ProviderResponse; 401: ProviderResponse; 403: ProviderResponse; 404: ProviderResponse

## GET /api/providers/profile

- Controller tag: Provider
- Frontend / role: Provider.jsx — PROVIDER
- Parameters: none
- Body: none
- Responses: 200: ProviderResponse; 400: ProviderResponse; 401: ProviderResponse; 403: ProviderResponse; 404: ProviderResponse

## GET /api/reports/booking/{bookingId}

- Controller tag: ServiceReport
- Frontend / role: Bookings.jsx — participant reads; PROVIDER submission
- Parameters: bookingId (path, required, integer)
- Body: none
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## POST /api/reports/booking/{bookingId}

- Controller tag: ServiceReport
- Frontend / role: Bookings.jsx — participant reads; PROVIDER submission
- Parameters: bookingId (path, required, integer)
- Body: application/json: ReportRequest
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## POST /api/reschedules/booking/{bookingId}

- Controller tag: BookingReschedule
- Frontend / role: Bookings.jsx request (HOMEOWNER); Provider.jsx decision (PROVIDER)
- Parameters: bookingId (path, required, integer)
- Body: application/json: Request
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## PUT /api/reschedules/{id}/decision

- Controller tag: BookingReschedule
- Frontend / role: Bookings.jsx request (HOMEOWNER); Provider.jsx decision (PROVIDER)
- Parameters: id (path, required, integer)
- Body: application/json: Decision
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## POST /api/reviews

- Controller tag: ServiceReview
- Frontend / role: Saved.jsx reads (authenticated); Bookings.jsx create (HOMEOWNER)
- Parameters: none
- Body: application/json: ReviewRequest
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## GET /api/reviews/provider/{providerId}

- Controller tag: ServiceReview
- Frontend / role: Saved.jsx reads (authenticated); Bookings.jsx create (HOMEOWNER)
- Parameters: providerId (path, required, integer)
- Body: none
- Responses: 200: array<object>; 400: array<object>; 401: array<object>; 403: array<object>; 404: array<object>

## GET /api/services

- Controller tag: ServiceOffering
- Frontend / role: Services.jsx / Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: categoryId (query, optional, integer); pageable (query, required, Pageable)
- Body: none
- Responses: 200: PageServiceResponse; 400: PageServiceResponse; 401: PageServiceResponse; 403: PageServiceResponse; 404: PageServiceResponse

## POST /api/services

- Controller tag: ServiceOffering
- Frontend / role: Services.jsx / Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: none
- Body: application/json: ServiceRequest
- Responses: 201: ServiceResponse; 400: ServiceResponse; 401: ServiceResponse; 403: ServiceResponse; 404: ServiceResponse

## GET /api/services/search

- Controller tag: ServiceOffering
- Frontend / role: Services.jsx / Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: name (query, optional, string); categoryId (query, optional, integer); minPrice (query, optional, number); maxPrice (query, optional, number); pageable (query, required, Pageable)
- Body: none
- Responses: 200: PageServiceResponse; 400: PageServiceResponse; 401: PageServiceResponse; 403: PageServiceResponse; 404: PageServiceResponse

## GET /api/services/{serviceId}

- Controller tag: ServiceOffering
- Frontend / role: Services.jsx / Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: serviceId (path, required, integer)
- Body: none
- Responses: 200: ServiceResponse; 400: ServiceResponse; 401: ServiceResponse; 403: ServiceResponse; 404: ServiceResponse

## PUT /api/services/{serviceId}

- Controller tag: ServiceOffering
- Frontend / role: Services.jsx / Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: serviceId (path, required, integer)
- Body: application/json: ServiceRequest
- Responses: 200: ServiceResponse; 400: ServiceResponse; 401: ServiceResponse; 403: ServiceResponse; 404: ServiceResponse

## DELETE /api/services/{serviceId}

- Controller tag: ServiceOffering
- Frontend / role: Services.jsx / Provider.jsx — authenticated reads; PROVIDER mutations
- Parameters: serviceId (path, required, integer)
- Body: none
- Responses: 204: empty; 400: empty; 401: empty; 403: empty; 404: empty

## PUT /api/users/change-password

- Controller tag: User
- Frontend / role: Account.jsx / AuthContext — authenticated
- Parameters: none
- Body: application/json: ChangePasswordRequest
- Responses: 204: empty; 400: empty; 401: empty; 403: empty; 404: empty

## GET /api/users/profile

- Controller tag: User
- Frontend / role: Account.jsx / AuthContext — authenticated
- Parameters: none
- Body: none
- Responses: 200: UserResponse; 400: UserResponse; 401: UserResponse; 403: UserResponse; 404: UserResponse

## PUT /api/users/profile

- Controller tag: User
- Frontend / role: Account.jsx / AuthContext — authenticated
- Parameters: none
- Body: application/json: UpdateUserRequest
- Responses: 200: UserResponse; 400: UserResponse; 401: UserResponse; 403: UserResponse; 404: UserResponse

## POST /api/users/profile-picture

- Controller tag: User
- Frontend / role: Account.jsx / AuthContext — authenticated
- Parameters: none
- Body: multipart/form-data: object
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## GET /api/waitlist

- Controller tag: BookingWaitlist
- Frontend / role: Saved.jsx / Services.jsx — HOMEOWNER
- Parameters: none
- Body: none
- Responses: 200: array<object>; 400: array<object>; 401: array<object>; 403: array<object>; 404: array<object>

## POST /api/waitlist

- Controller tag: BookingWaitlist
- Frontend / role: Saved.jsx / Services.jsx — HOMEOWNER
- Parameters: none
- Body: application/json: JoinRequest
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

## DELETE /api/waitlist/{id}

- Controller tag: BookingWaitlist
- Frontend / role: Saved.jsx / Services.jsx — HOMEOWNER
- Parameters: id (path, required, integer)
- Body: none
- Responses: 200: empty; 400: empty; 401: empty; 403: empty; 404: empty

## POST /api/waitlist/{id}/claim

- Controller tag: BookingWaitlist
- Frontend / role: Saved.jsx / Services.jsx — HOMEOWNER
- Parameters: id (path, required, integer)
- Body: none
- Responses: 200: object; 400: object; 401: object; 403: object; 404: object

Total: 59 operations.

## Exact request and response schemas

See [openapi.json](openapi.json) for full schemas, validation constraints, enums, and Spring Page structures. To keep controller-defined maps explicit, their source return mappings are included below.

### AdminController.java

```java
package com.ga.HomeHub.controller;

@Tag(name="Admin", description="HomeHub admin API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserService userService;
    private final ProviderService providerService;
    @GetMapping("/users")
    public Page<UserResponse> getAllUsers(Pageable pageable){
        return userService.getAllUsers(pageable);
    }
    @PutMapping("/providers/{providerId}/approve")
    public ProviderResponse approveProvider(@PathVariable Long providerId){
        ProviderProfile provider = providerService.updateProviderStatus(providerId);
        return providerService.toResponse(provider);
    }
    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateUser(@PathVariable Long userId){
        userService.deactivate(userId);
    }
}
```

### AuthController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="Auth", description="HomeHub auth API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request){
        authService.registerUser(request);
        return ResponseEntity.status(201).body(Map.of("message","Registration success. Verify your email."));
    }
    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified. You can login."));
    }
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request){
        return authService.loginUser(request);
    }
    @PostMapping("/forgot-password")
    public Map<String,String> forgot(@Valid @RequestBody ForgotPasswordRequest request){
        authService.requestPasswordReset(request.email());
        return Map.of("message","Sent reset if the account exist");
    }
    @PostMapping("/reset-password")
    public Map<String,String> reset(@Valid @RequestBody ResetPasswordRequest request){
        authService.resetPassword(request);
        return Map.of("message","Password reset successful");
    }
}
```

### AvailabilityController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="Availability", description="HomeHub availability API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/availability")
public class AvailabilityController {
    private final AvailabilityService availabilityService;
    @GetMapping
    public List<Availability> getProviderAvailabilityByDate(@RequestParam Long providerId, @RequestParam LocalDate date){
        return availabilityService.getProviderAvailabilityByDate(providerId, date);
    }
    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<Availability> createAvailability(@Valid @RequestBody AvailabilityRequest request){
        return ResponseEntity.status(201).body(availabilityService.createAvailability(request));
    }
    @DeleteMapping("/{availabilityId}")
    @PreAuthorize("hasRole('PROVIDER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAvailability(@PathVariable Long availabilityId){
        availabilityService.deleteAvailability(availabilityId);
    }
    @PostMapping("/time-off")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<Availability> blockTimeOff(@Valid @RequestBody AvailabilityRequest request){
        return ResponseEntity.status(201).body(availabilityService.blockTimeOff(request));
    }
}
```

### BookingController.java

```java
package com.ga.HomeHub.controller;


@Tag(name="Booking", description="HomeHub booking API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/booking")
public class BookingController {
    private final BookingService bookingService;
    @PostMapping
    @PreAuthorize("hasRole('HOMEOWNER')")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request){
        Booking booking = bookingService.createBooking(request);
        return ResponseEntity.status(201).body(bookingService.toResponse(booking));
    }
    @GetMapping
    public Page<BookingResponse> getCurrentUserBookings(@RequestParam(required = false)BookingStatus status, Pageable pageable){
        return bookingService.getCurrentUserBookings(status, pageable).map(bookingService::toResponse);
    }
    @GetMapping("/{bookingId}")
    public BookingResponse getBookingById(@PathVariable Long bookingId) {
        return bookingService.toResponse(bookingService.getBookingById(bookingId));
    }
    @DeleteMapping("/{bookingId}")
    public BookingResponse cancelBooking(@PathVariable Long bookingId){
        return bookingService.toResponse(bookingService.cancelBooking(bookingId));
    }
    @PutMapping("/{bookingId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','PROVIDER')")
    public BookingResponse updateBookingStatus(@PathVariable Long bookingId, @Valid @RequestBody BookingStatusRequest request){
        return bookingService.toResponse(bookingService.updateBookingStatus(bookingId, request.status()));
    }
}
```

### BookingRescheduleController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="BookingReschedule", description="HomeHub bookingreschedule API endpoints")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reschedules")
public class BookingRescheduleController {
    private final BookingRescheduleService service;
    public record Request(@NotNull LocalDate date, @NotNull LocalTime start){}
    public record Decision(@NotNull boolean approve){}
    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasRole('HOMEOWNER')")
    public Map<String,Object> requestReschedule(@PathVariable Long bookingId,@Valid @RequestBody Request request){
        return response(service.request(bookingId,request.date(),request.start()));
    }
    @PutMapping("/{id}/decision")
    @PreAuthorize("hasRole('PROVIDER')")
    public Map<String,Object> decideReschedule(@PathVariable Long id,@Valid @RequestBody Decision decision){
        return response(service.decide(id,decision.approve()));
    }

    private Map<String,Object> response(BookingRescheduleRequest r){
        return Map.of("id",r.getId(),"bookingId",r.getBooking().getId(),"date",r.getRequestedDate().toString(), "start",r.getRequestedStartTime().toString(),"status",r.getStatus().name());
    }
}
```

### BookingWaitlistController.java

```java
package com.ga.HomeHub.controller;


@Tag(name="BookingWaitlist", description="HomeHub bookingwaitlist API endpoints")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/waitlist")
@PreAuthorize("hasRole('HOMEOWNER')")
public class BookingWaitlistController {
    private final BookingWaitlistService waitlist;
    private final BookingService bookings;
    public record JoinRequest(@NotNull Long serviceId,@NotNull Long homeId,@NotNull LocalDate date,@NotNull LocalTime start){}
    @PostMapping
    public Map<String,Object> joinWaitlist(@Valid @RequestBody JoinRequest request){
        return response(waitlist.joinWaitlist(request.serviceId(),request.homeId(),request.date(),request.start()));
    }
    @GetMapping
    public List<Map<String,Object>> getMyWaitlist(){
        return waitlist.getMyWaitlist().stream().map(this::response).toList();
    }
    @DeleteMapping("/{id}")
    public void leaveWaitlist(@PathVariable Long id){
        waitlist.leaveWaitlist(id);
    }
    @PostMapping("/{id}/claim")
    public Object claimWaitlistOffer(@PathVariable Long id){
        Booking booking=waitlist.claimWaitlistOffer(id);
        return bookings.toResponse(booking);
    }

    private Map<String,Object> response(BookingWaitlist entry){
        return Map.of("id",entry.getId(),"serviceId",entry.getService().getId(),"homeId",entry.getHome().getId(), "date",entry.getRequestedDate().toString(),"start",entry.getRequestedStartTime().toString(),"status",entry.getStatus().name());
    }
}
```

### CategoryController.java

```java
package com.ga.HomeHub.controller;


@Tag(name="Category", description="HomeHub category API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;
    @GetMapping
    public Page<Category> getAllCategories(Pageable pageable){
        return categoryService.getAllCategories(pageable);
    }
    @GetMapping("/{categoryId}")
    public Category getCategoryById(@PathVariable Long categoryId){
        return categoryService.getCategoryById(categoryId);
    }
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryRequest request){
        return ResponseEntity.status(201).body(categoryService.createCategory(request));
    }
    @PutMapping("/{categoryId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Category updateCategory(@PathVariable Long categoryId, @Valid @RequestBody CategoryRequest request){
        return categoryService.updateCategory(categoryId,request);
    }
    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long categoryId){
        categoryService.deleteCategory(categoryId);
    }
}
```

### HomeController.java

```java
package com.ga.HomeHub.controller;


@Tag(name="Home", description="HomeHub home API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/homes")
public class HomeController {
    private final HomeService homeService;
    @PostMapping
    @PreAuthorize("hasRole('HOMEOWNER')")
    public ResponseEntity<Home> createHome(@Valid @RequestBody HomeRequest request){
        return ResponseEntity.status(201).body(homeService.createHome(request));
    }
    @GetMapping
    @PreAuthorize("hasRole('HOMEOWNER')")
    public Page<Home> getCurrentUserHomes(Pageable pageable){
        return homeService.getCurrentUserHomes(pageable);
    }
    @GetMapping("/{homeId}")
    @PreAuthorize("hasRole('HOMEOWNER')")
    public Home getHomeById(@PathVariable Long homeId){
        return homeService.getHomeById(homeId);
    }
    @PutMapping("/{homeId}")
    @PreAuthorize("hasRole('HOMEOWNER')")
    public Home updateHome(@PathVariable Long homeId, @Valid @RequestBody HomeRequest request){
        return homeService.updateHome(homeId, request);
    }
    @DeleteMapping("/{homeId}")
    @PreAuthorize("hasRole('HOMEOWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHome(@PathVariable Long homeId){
        homeService.deleteHome(homeId);
    }
}
```

### HomeownerAssessmentController.java

```java
package com.ga.HomeHub.controller;


@Tag(name="HomeownerAssessment", description="HomeHub homeownerassessment API endpoints")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assessments")
@PreAuthorize("hasRole('PROVIDER')")
public class HomeownerAssessmentController {
    private final HomeownerAssessmentService service;
    public record AssessmentRequest(Integer rating,String comment){}
    @PostMapping("/booking/{bookingId}")
    public Map<String, Object> submitAssessment(@PathVariable Long bookingId, @Valid @RequestBody AssessmentRequest request){
        return response(service.submitHomeownerAssessment(bookingId, request.rating(), request.comment()));
    }
    @GetMapping("/booking/{bookingId}")
    public List<Map<String,Object>> getAssessment(@PathVariable Long bookingId){
        return service.getHomeownerAssessments(bookingId).stream().map(this::response).toList();
    }

    private Map<String, Object> response(HomeownerAssessment assessment){
        Map<String, Object> result = new HashMap<>();
        result.put("id", assessment.getId());
        result.put("rating", assessment.getRating());
        result.put("comment", assessment.getComment());
        return result;
    }
}
```

### NotificationController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="Notification", description="HomeHub notification API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToNotifications(){
        return notificationService.subscribeToNotifications(currentUserService.getCurrentUser().getId());
    }
    @GetMapping
    public List<Map<String, Object>> getHistory(){
        return notificationService.history(currentUserService.getCurrentUser().getId()).stream().map(n->Map.<String,Object>of("id",n.getId(),"message",n.getMessage(),"read",n.isRead(),"type",n.getEventType())).toList();
    }
    @GetMapping("/unread-count")
    public Map<String,Long> getUnreadCount(){
        return Map.of("count",notificationService.unread(currentUserService.getCurrentUser().getId()));
    }
    @PatchMapping("/{id}/read")
    public void markRead(@PathVariable Long id){
        notificationService.markRead(currentUserService.getCurrentUser().getId(),id);
    }
}
```

### ProviderController.java

```java
package com.ga.HomeHub.controller;


@Tag(name="Provider", description="HomeHub provider API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/providers")
public class ProviderController {
    private final ProviderService providerService;
    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ProviderResponse> createProviderProfile(@Valid @RequestBody ProviderRequest request){
        ProviderProfile provider = providerService.createProviderProfile(request);
        return ResponseEntity.status(201).body(providerService.toResponse(provider));
    }
    @GetMapping("/profile")
    @PreAuthorize("hasRole('PROVIDER')")
    public ProviderResponse getCurrentProviderProfile(){
        return providerService.toResponse(providerService.getCurrentProviderProfile());
    }

    public record PortfolioRequest(String description,boolean emergencyEnabled){}
    @PutMapping("/portfolio")
    @PreAuthorize("hasRole('PROVIDER')")
    public ProviderResponse updatePortfolio(@RequestBody PortfolioRequest request){
        return providerService.toResponse(providerService.updatePortfolio(request.description(),request.emergencyEnabled()));
    }

}
```

### ServiceFavoriteController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="ServiceFavorite", description="HomeHub servicefavorite API endpoints")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/favorites")
@PreAuthorize("hasRole('HOMEOWNER')")
public class ServiceFavoriteController {
    private final ServiceFavoriteService service;
    @PostMapping("/{serviceId}")
    public Map<String,Object> addFavorite(@PathVariable Long serviceId){
        return response(service.addFavorite(serviceId));
    }
    @GetMapping
    public List<Map<String,Object>> getMyFavorites(){
        return service.getMyFavorite().stream().map(this::response).toList();
    }
    @DeleteMapping("/{favoriteId}")
    public void removefavorite(@PathVariable Long favoriteId){
        service.removeFavorite(favoriteId);
    }

    private Map<String,Object> response(ServiceFavorite favorite){
        return Map.of("id",favorite.getId(), "serviceId",favorite.getService().getId());
    }
}
```

### ServiceOfferingController.java

```java
package com.ga.HomeHub.controller;


@Tag(name="ServiceOffering", description="HomeHub serviceoffering API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/services")
public class ServiceOfferingController {
    private final ServiceOfferingService serviceOfferingService;
    @GetMapping
    public Page<ServiceResponse> getAllServiceOffering(@RequestParam(required = false) Long categoryId, Pageable pageable){
        return serviceOfferingService.getAllServiceOffering(categoryId, pageable);
    }
    @GetMapping("/{serviceId}")
    public ServiceResponse getServiceOfferingById(@PathVariable Long serviceId){
        return serviceOfferingService.getServiceResponseById(serviceId);
    }
    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ServiceResponse> createServiceOffering(@Valid @RequestBody ServiceRequest request){
        ServiceOffering service = serviceOfferingService.createServiceOffering(request);
        return ResponseEntity.status(201).body(serviceOfferingService.toResponse(service));
    }
    @PutMapping("/{serviceId}")
    @PreAuthorize("hasRole('PROVIDER')")
    public ServiceResponse updateServiceOffering(@PathVariable Long serviceId, @Valid @RequestBody ServiceRequest request){
        ServiceOffering service = serviceOfferingService.updateServiceOffering(serviceId, request);
        return serviceOfferingService.toResponse(service);
    }
    @DeleteMapping("/{serviceId}")
    @PreAuthorize("hasRole('PROVIDER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateServiceOffering(@PathVariable Long serviceId){
        serviceOfferingService.deactivateServiceOffering(serviceId);
    }
    @GetMapping("/search")
    public Page<ServiceResponse> searchServices(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            Pageable pageable){

        return serviceOfferingService.searchServices(name, categoryId, minPrice, maxPrice, pageable);
    }
}
```

### ServiceReportController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="ServiceReport", description="HomeHub servicereport API endpoints")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports")
public class ServiceReportController {
    private final ServiceReportService service;
    public record ReportRequest(@NotBlank String workDone, String materialsUsed, String recommendation){}
    @GetMapping("/booking/{bookingId}")
    public Map<String,Object> getReport(@PathVariable Long bookingId){
        return response(service.getServiceReport(bookingId));
    }
    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasRole('PROVIDER')")
    public Map<String,Object> submitReport(@PathVariable Long bookingId, @Valid @RequestBody ReportRequest request){
        return response(service.submitServiceReport(bookingId, request.workDone(), request.materialsUsed(), request.recommendation()));
    }

    private Map<String,Object> response(ServiceReport report) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", report.getId());
        result.put("bookingId", report.getBooking().getId());
        result.put("workPerformed", report.getWorkPerformed());
        result.put("materialsUsed", report.getMaterialsUsed());
        result.put("recommendation", report.getRecommendations());
        return result;
    }
}
```

### ServiceReviewController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="ServiceReview", description="HomeHub servicereview API endpoints")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ServiceReviewController {
    private final ServiceReviewService service;
    public record ReviewRequest(@NotNull Long bookingId, @Min(1) @Max(5) int rating, String comment){}
    @PostMapping
    @PreAuthorize("hasRole('HOMEOWNER')")
    public Map<String,Object> createReview(@Valid @RequestBody ReviewRequest request){
        return response(service.createServiceReviw(request.bookingId(), request.rating(), request.comment()));
    }
    @GetMapping("/provider/{providerId}")
    public List<Map<String,Object>> getProvider(@PathVariable Long providerId){
        return service.providerReviews(providerId).stream().map(this::response).toList();
    }

    private Map<String,Object> response(ServiceReview review){
        Map<String,Object> result = new HashMap<>();
        result.put("id", review.getId());
        result.put("bookingId", review.getBooking().getId());
        result.put("rating", review.getRating());
        result.put("providerId", review.getBooking().getService().getProvider().getId());
        result.put("comment", review.getComment());
        return result;
    }
}
```

### UserController.java

```java
package com.ga.HomeHub.controller;



@Tag(name="User", description="HomeHub user API endpoints")
@RestController
@AllArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    @GetMapping("/profile")
    public UserResponse getCurrentUserProfile(){
        return userService.getCurrentUserProfile();
    }
    @PutMapping("/profile")
    public UserResponse updateUserProfile(@Valid @RequestBody UpdateUserRequest request){
        return userService.update(request);
    }
    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request){
        userService.changePassword(request);
        return ResponseEntity.noContent().build(); //Status: 204 No Content, Body:(empty)
    }
    @PostMapping(value = "/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String,String> uploadProfilePicture(@RequestParam MultipartFile file){
        return Map.of("url",userService.picture(file));
    }

}
```

