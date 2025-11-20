# Feature Specification: Disha Digital Prints - Complete Online Printing Service

**Feature Branch**: `001-disha-digital-prints`  
**Created**: 2025-11-16  
**Status**: Draft  
**Input**: User description: "Build Disha Digital Prints, an online digital printing service for customers in India with both customer-facing and admin-facing flows"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Quick Order Flow (Priority: P1)

A customer discovers Disha Digital Prints, quickly uploads documents (PDF/JPEG), configures basic print options (color/BW, quantity), provides delivery address, pays online, and receives order confirmation. This is the core value proposition.

**Why this priority**: This is the MVP - without this flow, there's no business. It represents the simplest end-to-end customer transaction that generates revenue.

**Independent Test**: Can be fully tested by a customer uploading a single PDF, choosing color printing with default options, entering address, completing UPI payment, and receiving order confirmation with order ID. Delivers immediate business value.

**Acceptance Scenarios**:

1. **Given** a new customer visits the landing page, **When** they click "A4 Documents" category, **Then** they see the upload page with drag-and-drop area
2. **Given** customer is on upload page, **When** they drag a valid PDF file, **Then** the file uploads successfully and shows a configuration card with print options
3. **Given** customer has uploaded file, **When** they select "Color", "A4", "Single-sided", quantity 10, **Then** the order summary shows live price calculation
4. **Given** customer clicks "Proceed to Checkout", **When** they enter new delivery address with all required fields (name, phone, address, city, state, pincode), **Then** the address is validated and saved
5. **Given** customer is on payment page, **When** they select UPI/QR payment method, **Then** they see QR code with amount and "Pay Now & Confirm Order" button
6. **Given** customer clicks "Pay Now & Confirm Order", **When** payment is processed successfully, **Then** they see order confirmation screen with unique order ID, summary, and estimated delivery date
7. **Given** order is placed, **When** customer checks email/SMS, **Then** they receive "Order Placed" notification with order details

---

### User Story 2 - Admin Order Management (Priority: P1)

Admin logs into dashboard, sees new orders, views order details including uploaded files, changes order status through workflow (New → Accepted → Printing → Ready → Completed), and customer receives status notifications.

**Why this priority**: Without admin ability to process orders, customer orders sit unprocessed. This completes the minimum viable service loop.

**Independent Test**: Admin can log in, see order from User Story 1, download PDF files, mark status as "Printing" then "Ready" then "Completed", and verify customer receives status update notifications. Delivers operational capability.

**Acceptance Scenarios**:

1. **Given** admin is on login page, **When** they enter valid credentials, **Then** they see admin dashboard with today's KPIs
2. **Given** admin is on dashboard, **When** a new order arrives, **Then** it appears in "Recent Orders" table with status "New"
3. **Given** admin clicks on order, **When** order detail page loads, **Then** they see customer info, items, print options, payment status, and uploaded file download links
4. **Given** admin is viewing order detail, **When** they click "Change Status" and select "Accepted", **Then** order status updates and customer receives "Order Accepted" notification
5. **Given** admin downloads files, **When** printing is complete and they mark status as "Printing", **Then** status updates and customer receives notification
6. **Given** order is ready, **When** admin marks status as "Ready", **Then** customer receives "Order Ready" notification with pickup/delivery info
7. **Given** order is delivered/picked up, **When** admin marks status as "Completed", **Then** customer receives "Order Completed" notification and order moves to completed list

---

### User Story 3 - Customer Order Tracking (Priority: P2)

Returning customer logs into "My Account", views "My Orders" list with search/filter, clicks on specific order to see detailed status timeline, and downloads invoice if needed.

**Why this priority**: Enhances customer experience and reduces support inquiries by providing self-service tracking. Builds customer confidence.

**Independent Test**: Customer can access My Account page, see all their orders in a list, filter by date or status, click on an order to see full timeline (New → Accepted → Printing → Ready → Completed) with timestamps, and download invoice PDF. Reduces operational support load.

**Acceptance Scenarios**:

1. **Given** customer has placed orders before, **When** they visit site and click "My Orders", **Then** they see list of all their orders sorted by date (newest first)
2. **Given** customer is on My Orders page, **When** they use search box to find order by ID or filter by status, **Then** results update instantly
3. **Given** customer clicks on an order, **When** order detail page loads, **Then** they see full status timeline with timestamps and current ETA
4. **Given** order is completed, **When** customer clicks "Download Invoice", **Then** PDF invoice downloads with all order details, items, and pricing
5. **Given** customer views order detail, **When** there's a delivery tracking number, **Then** they see link to courier tracking page

---

### User Story 4 - Advanced Print Options & Multi-File Orders (Priority: P2)

Customer orders business cards and brochures in same transaction, each with different specifications (paper type 300GSM for business cards, double-sided with binding for brochures), sees accurate pricing for each item, and completes checkout.

**Why this priority**: Expands product catalog beyond basic documents, increases average order value, and serves diverse customer needs. Differentiates from basic printing services.

**Independent Test**: Customer uploads 2 files (business card PDF and brochure PDF), configures first with "300GSM, Color, A6 size, 100 quantity" and second with "100GSM, Color, A4, Double-sided, Spiral binding, 50 quantity", sees separate pricing for each item in summary, completes payment, and admin sees both items with their respective configurations. Delivers product diversity.

**Acceptance Scenarios**:

1. **Given** customer is on product catalog, **When** they select "Business Cards", **Then** they see upload page with business card specific options (sizes: 3.5"x2", paper types: 300GSM/400GSM)
2. **Given** customer uploads multiple files, **When** they configure each file independently, **Then** each file shows its own configuration card with relevant options
3. **Given** customer selects paper type "300GSM" for business cards, **When** they view order summary, **Then** pricing reflects paper type premium
4. **Given** customer selects "Double-sided" and "Spiral Binding" for brochures, **When** they view summary, **Then** pricing includes binding fees
5. **Given** customer has mixed items in cart, **When** they proceed to checkout, **Then** order summary clearly lists each item with its specifications and individual pricing
6. **Given** admin views this order, **When** they see order details, **Then** each item is clearly separated with its print configuration for production team

---

### User Story 5 - Express Delivery & Delivery Options (Priority: P2)

Customer in serviceable area orders urgent documents, selects "2-hour Express Delivery" option, pays express surcharge, provides address within service zone, and receives guaranteed 2-hour delivery.

**Why this priority**: Creates premium service tier, increases revenue per order, and serves urgent customer needs. Competitive differentiator.

**Independent Test**: Customer uploads document, sees delivery options including "2-hour Express (₹150 extra)", selects express delivery and enters pincode in serviceable zone, pays including surcharge, and admin sees order flagged as "Express" with countdown timer. Alternatively, customer enters non-serviceable pincode and only sees "Same Day" and "Standard" options. Delivers premium service capability.

**Acceptance Scenarios**:

1. **Given** customer enters delivery address, **When** pincode is in 2-hour service zone and current time is within service window (e.g., 9 AM - 6 PM), **Then** they see "2-hour Express" option with surcharge amount
2. **Given** customer enters pincode not in express service zone, **When** they view delivery options, **Then** they only see "Same Day" and "Standard" delivery options
3. **Given** customer selects "2-hour Express", **When** they view order summary, **Then** express delivery surcharge is clearly itemized in pricing
4. **Given** customer completes express order at 10:30 AM, **When** order confirmation shows, **Then** estimated delivery time is 12:30 PM (2 hours from order time)
5. **Given** admin views express order, **When** dashboard loads, **Then** order is highlighted with countdown timer and "EXPRESS" badge
6. **Given** express order is not marked "Out for Delivery" 30 minutes before deadline, **When** admin checks notifications, **Then** they see SLA risk alert
7. **Given** customer selects "Store Pickup", **When** they complete order, **Then** no delivery address is required and they see store address and pickup instructions

---

### User Story 6 - Cash on Delivery (COD) with Advance Payment (Priority: P3)

Customer prefers COD but system requires advance payment (e.g., 30% advance), customer pays advance via UPI, order is processed, and upon delivery customer pays remaining amount in cash which admin marks as collected.

**Why this priority**: Serves customers who prefer cash payments while protecting business from order abandonment. Expands payment flexibility.

**Independent Test**: Customer selects COD payment method at checkout, sees advance amount (30% of total), pays advance via UPI, order is created with "COD Pending" status, admin processes order, upon delivery marks "COD Collected" with remaining amount, and order status updates to "Completed". Delivers payment flexibility with risk mitigation.

**Acceptance Scenarios**:

1. **Given** customer is on payment page, **When** they select "Cash on Delivery (COD)", **Then** they see required advance amount (30% of total order) and payment options for advance
2. **Given** customer pays advance, **When** payment succeeds, **Then** order is created with status "COD Advance Paid" and remaining amount shown
3. **Given** order is ready for delivery, **When** delivery person collects remaining cash amount, **Then** admin marks order as "COD Collected" with amount and timestamp
4. **Given** customer doesn't pay advance, **When** they try to place order, **Then** order is not created and error message explains advance requirement
5. **Given** COD order is created, **When** customer views order details, **Then** they see "Paid: ₹X (advance), Remaining: ₹Y (pay on delivery)"
6. **Given** COD amount is not collected within 3 days of "Out for Delivery" status, **When** admin checks notifications, **Then** they see COD reminder alert

---

### User Story 7 - Product Catalog & Pricing Management (Admin) (Priority: P3)

Admin needs to update pricing for color printing from ₹5/page to ₹6/page, add new paper type "120GSM Matte", and update express delivery surcharge for specific pincodes.

**Why this priority**: Enables business to adapt pricing, add products, and manage service zones without developer intervention. Essential for business flexibility.

**Independent Test**: Admin accesses "Product & Pricing Management", updates color printing base price, adds new paper type with price premium, saves changes, and immediately new customer orders reflect updated pricing. Admin also adds new pincode to 2-hour express service zone and customer in that pincode now sees express option. Delivers business configuration autonomy.

**Acceptance Scenarios**:

1. **Given** admin is in dashboard, **When** they navigate to "Product & Pricing Management", **Then** they see list of all product types with current pricing rules
2. **Given** admin clicks "A4 Documents", **When** they edit "Color Printing" base price from ₹5 to ₹6, **Then** price updates and all new orders calculate with ₹6/page
3. **Given** admin clicks "Add Paper Type", **When** they enter "120GSM Matte" with ₹2 premium per page, **Then** new paper type appears in customer product options
4. **Given** admin is in "Delivery & Service Settings", **When** they add pincode "560001" to "2-hour Express" zone with service window "9 AM - 6 PM", **Then** customers in that pincode see express option during service hours
5. **Given** admin wants to remove product option, **When** they mark paper type as "Inactive", **Then** it no longer appears to customers but existing orders with that option remain unchanged
6. **Given** admin sets "Spiral Binding" fee to ₹50, **When** customer selects spiral binding, **Then** ₹50 is added to order total

---

### User Story 8 - Customer Address Management (Priority: P3)

Customer has multiple delivery addresses (home, office), saves both in address book, sets office as default, and on next order the default address is pre-filled at checkout.

**Why this priority**: Streamlines repeat orders, improves customer experience, and encourages customer retention. Reduces checkout friction.

**Independent Test**: Customer creates account, adds two addresses in "My Account > Address Book" with one marked as default, on next order checkout page loads with default address pre-filled, customer can select alternate address or add new one. Delivers convenience for repeat customers.

**Acceptance Scenarios**:

1. **Given** customer is in "My Account", **When** they navigate to "Address Book", **Then** they see list of saved addresses with "Default" badge on one
2. **Given** customer clicks "Add New Address", **When** they fill form (name, phone, address, city, state, pincode) and mark "Set as Default", **Then** address is saved and becomes default
3. **Given** customer has multiple addresses saved, **When** they start checkout for new order, **Then** default address is pre-selected
4. **Given** customer is at checkout, **When** they click "Use Different Address", **Then** they see dropdown of all saved addresses
5. **Given** customer edits saved address, **When** they update phone number, **Then** all future orders use updated phone number but past orders retain original
6. **Given** customer deletes address, **When** address is not used in any pending orders, **Then** it's removed from address book

---

### User Story 9 - Notifications & Communication (Priority: P3)

Customer receives timely notifications via email and SMS for every order status change, can opt-in for WhatsApp notifications in preferences, and admin can view notification log to confirm delivery of messages.

**Why this priority**: Keeps customers informed, reduces "Where is my order?" support queries, and builds trust. Multi-channel communication ensures message delivery.

**Independent Test**: Customer places order and receives email + SMS for "Order Placed", admin marks status as "Printing" and customer receives email + SMS for "Status Update", customer enables WhatsApp in preferences and receives next notification via WhatsApp link, admin views notification log and sees all sent messages with timestamps and delivery status. Delivers proactive communication.

**Acceptance Scenarios**:

1. **Given** customer completes order, **When** order is created, **Then** they receive email and SMS with order ID, summary, and ETA within 2 minutes
2. **Given** admin changes order status to "Printing", **When** status updates, **Then** customer receives email and SMS saying "Your order #XYZ is now being printed"
3. **Given** customer is in "My Account > Notification Preferences", **When** they enable "WhatsApp Notifications", **Then** future notifications include WhatsApp message with order link
4. **Given** payment fails, **When** failure is detected, **Then** customer receives email and SMS with failure reason and "Retry Payment" link
5. **Given** admin is viewing order detail, **When** they scroll to "Notification Log" section, **Then** they see all notifications sent for this order with timestamps and delivery status (Sent/Delivered/Failed)
6. **Given** COD order is "Out for Delivery" for 2 days without completion, **When** system checks, **Then** customer receives automated "COD Reminder" message
7. **Given** express order has 1 hour remaining, **When** status is still "Printing", **Then** admin receives in-app and email alert "SLA Risk: Order #XYZ"

---

### User Story 10 - Admin Reports & Analytics (Priority: P3)

Admin wants to understand business performance by viewing reports for orders per day, revenue trends, top-selling products, and repeat customer rate to make data-driven decisions.

**Why this priority**: Provides business intelligence for strategic planning, inventory management, and marketing decisions. Essential for growth and optimization.

**Independent Test**: Admin navigates to "Reports" section, selects date range (last 30 days), views graph of daily orders and revenue, sees pie chart of product distribution (60% A4 Documents, 20% Business Cards, 15% Brochures, 5% Other), views list of top 10 customers by order count, and exports data as CSV. Delivers business insights.

**Acceptance Scenarios**:

1. **Given** admin is on dashboard, **When** they click "Reports", **Then** they see reports page with date range selector and report type options
2. **Given** admin selects "Orders & Revenue" report for last 30 days, **When** report loads, **Then** they see line graph with daily order count and revenue trend
3. **Given** admin selects "Top Products" report, **When** report loads, **Then** they see pie chart showing percentage distribution of product types with exact counts
4. **Given** admin selects "Repeat Customers" report, **When** report loads, **Then** they see list of customers with 2+ orders, total order count, and total revenue per customer
5. **Given** admin views any report, **When** they click "Export as CSV", **Then** data downloads as CSV file with all visible metrics
6. **Given** admin filters report by payment method, **When** they select "COD", **Then** report shows only COD orders with advance vs. collected amounts
7. **Given** admin filters by product type and date range, **When** they view revenue, **Then** calculation is accurate for selected criteria

---

### User Story 11 - Admin Print Queue Management (Priority: P3)

Admin assigns orders to specific printers/devices, views print queue grouped by printer, marks jobs as printed or requeues failed prints, and tracks printer utilization.

**Why this priority**: Optimizes production workflow, manages multiple printers efficiently, and prevents production bottlenecks. Scales operational capacity.

**Independent Test**: Admin receives 10 new orders, assigns 7 A4 document orders to "Printer A" and 3 business card orders to "Printer B", views print queue showing both printers with their assigned jobs, marks 5 jobs on Printer A as "Printed" which auto-updates their order status to next stage, and requeues 1 job that had print quality issue. Delivers production management capability.

**Acceptance Scenarios**:

1. **Given** admin is on "Print Queue" page, **When** page loads, **Then** they see orders grouped by assigned printer/device with "Unassigned" group
2. **Given** admin clicks on unassigned order, **When** they select "Assign to Printer A", **Then** order moves to Printer A's queue
3. **Given** admin views Printer A's queue, **When** they mark job as "Printed", **Then** order status automatically updates to next stage (e.g., "Printing" → "Ready")
4. **Given** printing fails due to quality issue, **When** admin clicks "Requeue", **Then** job moves back to top of queue with "Retry" flag
5. **Given** admin wants to balance load, **When** they drag-drop order from Printer A queue to Printer B queue, **Then** reassignment is saved
6. **Given** multiple jobs are in queue, **When** admin uses "Bulk Actions" to mark selected jobs as printed, **Then** all selected jobs update simultaneously

---

### Edge Cases

#### File Upload Edge Cases

- **Large file size**: What happens when customer uploads 50MB PDF? System must either process it (if within limit) or show clear error "File size exceeds 25MB limit. Please compress or split file."
- **Invalid file type**: What happens when customer uploads .exe or .zip file? System must reject with error "Invalid file type. Accepted formats: PDF, JPEG, PNG, DOC, DOCX."
- **Corrupted file**: What happens when PDF is corrupted and can't be rendered? System must detect during upload, show preview error, and warn customer "File may be corrupted. Please verify file opens correctly before ordering."
- **Upload interruption**: What happens when internet disconnects during upload? System must support resume upload or clearly indicate failure and allow retry.
- **Zero-page PDF**: What happens when PDF has 0 pages? System must reject with error "PDF file is empty or invalid."
- **Password-protected PDF**: What happens when PDF requires password to open? System must detect and show error "Password-protected files not supported. Please remove password before uploading."

#### Address & Delivery Edge Cases

- **Non-serviceable pincode**: What happens when customer enters pincode outside service area? System must validate pincode against serviceable list and show error "Sorry, we don't deliver to this pincode yet. Available areas: [list or link]."
- **Invalid pincode format**: What happens when customer enters 4-digit or 7-digit pincode? System must validate format and show "Please enter valid 6-digit pincode."
- **Express delivery after cutoff time**: What happens when customer tries to select 2-hour express at 8 PM (outside 9 AM - 6 PM window)? System must hide express option and show "2-hour express available from 9 AM to 6 PM. Please choose same-day or standard delivery."
- **Store pickup address change**: What happens when customer selects store pickup but store location changes? System must show updated store address in order confirmation and send notification of change.
- **Incomplete address**: What happens when customer submits address without flat/building number? System must require all mandatory fields and show "Please provide complete address including flat/building number."

#### Payment Edge Cases

- **Payment timeout**: What happens when customer scans QR code but doesn't complete payment within 15 minutes? System must expire payment session and show "Payment session expired. Please try again."
- **Payment pending**: What happens when payment status is unclear (neither success nor failure)? System must poll payment gateway for 5 minutes, then mark as "Payment Pending" and send email to customer with "Complete Payment" link.
- **Payment failure**: What happens when UPI payment fails due to insufficient balance? System must show error "Payment failed: Insufficient balance. Please try different payment method" and allow retry without re-entering order details.
- **Duplicate payment**: What happens when customer accidentally pays twice for same order? System must detect duplicate payment, auto-refund extra amount, and notify customer.
- **COD advance not paid**: What happens when customer selects COD but abandons before paying advance? System must not create order and show "Order not placed. Please complete advance payment to proceed."
- **Partial COD collection**: What happens when delivery person collects less than remaining COD amount? Admin must be able to enter actual collected amount and mark remaining as "COD Pending" with follow-up task.
- **Refund request**: What happens when customer cancels order after payment? System must support refund workflow where admin approves refund and amount is returned within 5-7 business days.

#### Order Processing Edge Cases

- **Admin offline during order**: What happens when new order arrives but no admin is logged in? System must send email/SMS notification to admin mobile and show order in queue when they next log in.
- **Concurrent status updates**: What happens when two admins try to update same order status simultaneously? System must use optimistic locking and show "Order already updated by another admin. Please refresh and try again."
- **File download failure**: What happens when admin tries to download uploaded file but file is corrupted or missing in storage? System must show error "File download failed. Please contact customer for re-upload" and provide "Request Re-upload" button.
- **Order cancellation mid-production**: What happens when customer cancels order that's already in "Printing" status? Admin must be notified, partial refund calculated (e.g., 50% if printing started), and order marked "Cancelled" with reason.
- **Express order SLA breach**: What happens when 2-hour express order is not delivered in time? System must auto-notify admin and customer, optionally trigger partial refund or discount coupon for next order.
- **Multiple file upload failure**: What happens when customer uploads 5 files but 1 fails? System must allow order to proceed with 4 successful files and clearly indicate which file failed with option to retry or remove.

#### Notification Edge Cases

- **SMS delivery failure**: What happens when SMS fails due to DND or invalid number? System must log failure, attempt email delivery, and show warning to admin in notification log.
- **Email bounce**: What happens when customer email is invalid or inbox is full? System must log bounce, mark email as undeliverable, and rely on SMS/WhatsApp for communication.
- **WhatsApp opt-in not provided**: What happens when customer hasn't opted in for WhatsApp? System must only send email and SMS, and show "Enable WhatsApp notifications in My Account" message.
- **Notification template error**: What happens when notification template has variable that's missing (e.g., {{customer_name}} but name is null)? System must use fallback (e.g., "Valued Customer") and log error for admin to fix template.

#### Pricing & Product Edge Cases

- **Price change mid-order**: What happens when admin updates pricing while customer is on checkout page? System must lock pricing when customer starts checkout and honor that price even if updated before payment.
- **Product option removed mid-order**: What happens when admin marks paper type as inactive while customer has order in progress with that paper type? Existing orders must retain selected option; only new orders should not see it.
- **Bulk order pricing**: What happens when customer orders 10,000 copies? System must either apply bulk discount rule (if configured) or require manual quote with "Contact us for bulk orders over 1,000 copies."
- **Zero quantity**: What happens when customer sets quantity to 0? System must disable "Proceed to Checkout" and show "Please set quantity to at least 1."
- **Negative pricing**: What happens when admin accidentally sets price premium as negative (e.g., -₹5)? System must validate input and show error "Price must be positive value."

#### System & Security Edge Cases

- **Session timeout**: What happens when customer leaves upload page idle for 30 minutes? System must preserve uploaded files and configurations, show "Session expired" warning, and allow resume after re-login.
- **Admin unauthorized access**: What happens when admin tries to access customer data without proper role/permission? System must block access and log security event.
- **Concurrent order limit**: What happens when customer tries to place 10 orders simultaneously? System must either allow (if cart supports) or show "Please complete current order before starting new one."
- **File storage full**: What happens when server storage is full and customer tries to upload? System must show error "Upload temporarily unavailable. Please try again in few minutes" and alert admin.
- **Database connection failure**: What happens when database is unavailable during order placement? System must show graceful error "Service temporarily unavailable. Please try again" and log incident for admin investigation.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Customer Order Management

- **FR-001**: System MUST allow customers to upload files in formats PDF, JPEG, PNG, DOC, DOCX with maximum file size of 25MB per file
- **FR-002**: System MUST validate file integrity during upload and reject corrupted or password-protected files with clear error messages
- **FR-003**: System MUST provide drag-and-drop upload interface with progress indicator and upload success/failure feedback
- **FR-004**: System MUST allow customers to configure print options per file: color/BW, paper size (A4, A3, Letter, etc.), single/double sided, paper type (70GSM, 100GSM, 300GSM, etc.), binding type (none, spiral, wiro, perfect binding), and quantity (1-10,000)
- **FR-005**: System MUST calculate and display live pricing as customer changes print options, including base price, option premiums, binding fees, delivery charges, and total
- **FR-006**: System MUST support multiple files in single order with independent configuration per file
- **FR-007**: System MUST validate delivery pincode against serviceable areas list and show error for non-serviceable pincodes
- **FR-008**: System MUST display delivery options based on pincode and time: 2-hour express (if available), same-day, standard delivery, and store pickup
- **FR-009**: System MUST allow customers to save multiple delivery addresses with one marked as default
- **FR-010**: System MUST pre-fill default address at checkout for returning customers
- **FR-011**: System MUST support payment methods: UPI/QR code, debit/credit card, net banking, and cash on delivery with advance
- **FR-012**: System MUST require 30% advance payment for COD orders before order creation
- **FR-013**: System MUST generate unique order ID upon successful payment and order creation
- **FR-014**: System MUST display order confirmation with order ID, summary, estimated delivery date/time, and payment status
- **FR-015**: System MUST allow customers to track order status through "My Orders" page with search and filter capabilities
- **FR-016**: System MUST display order status timeline with timestamps for each stage (New, Accepted, Printing, Ready, Out for Delivery, Completed, Cancelled)
- **FR-017**: System MUST generate and allow download of PDF invoice for completed orders

#### Payment & Transaction Management

- **FR-018**: System MUST integrate with payment gateway to process UPI, QR code, card, and net banking payments
- **FR-019**: System MUST display QR code for UPI payments with order amount and expiry timer (15 minutes)
- **FR-020**: System MUST poll payment gateway for status and handle pending, success, and failure states
- **FR-021**: System MUST send payment confirmation notification immediately upon successful payment
- **FR-022**: System MUST allow customer to retry payment from order detail page if payment fails
- **FR-023**: System MUST detect and prevent duplicate payments for same order
- **FR-024**: System MUST support refund workflow where admin approves refund and amount is returned to customer's original payment method
- **FR-025**: System MUST track COD advance payment separately from final COD collection
- **FR-026**: System MUST calculate and display remaining COD amount due at delivery

#### Admin Order Processing

- **FR-027**: System MUST provide admin login with secure authentication
- **FR-028**: System MUST display admin dashboard with KPIs: today's orders count, in-progress orders, completed orders, today's revenue, pending COD amount
- **FR-029**: System MUST show recent orders table on dashboard with quick filters (New, In Progress, Completed)
- **FR-030**: System MUST provide orders list page with advanced filters: date range, status, product type, payment method, customer name
- **FR-031**: System MUST allow admin to view full order details including customer info, delivery address, items with print configurations, payment status, and uploaded files
- **FR-032**: System MUST provide download links for all uploaded files in admin order detail view
- **FR-033**: System MUST allow admin to change order status through defined workflow: New → Accepted → Printing → Ready → Out for Delivery → Completed (or Cancelled at any stage)
- **FR-034**: System MUST prevent invalid status transitions (e.g., cannot go from Completed back to Printing)
- **FR-035**: System MUST timestamp each status change and log admin user who made change
- **FR-036**: System MUST show notification log in order detail with all sent notifications and delivery status
- **FR-037**: System MUST allow admin to manually trigger notification resend if delivery failed

#### Print Queue Management

- **FR-038**: System MUST provide print queue view grouped by printer/device
- **FR-039**: System MUST allow admin to assign orders to specific printers
- **FR-040**: System MUST allow admin to mark print jobs as "Printed" which auto-updates order status
- **FR-041**: System MUST support requeuing of failed print jobs with retry flag
- **FR-042**: System MUST allow drag-drop or bulk reassignment of jobs between printers

#### Product Catalog & Pricing Configuration

- **FR-043**: System MUST allow admin to manage product types (A4 Documents, Business Cards, Brochures, Posters, Photos, etc.)
- **FR-044**: System MUST allow admin to configure pricing rules per product: base price per page/unit, color/BW pricing, paper size pricing, paper type premiums, binding fees
- **FR-045**: System MUST allow admin to add, edit, or deactivate product options (paper types, sizes, binding types)
- **FR-046**: System MUST apply pricing changes to new orders immediately while preserving pricing for in-progress orders
- **FR-047**: System MUST allow admin to set bulk order thresholds and pricing discounts
- **FR-048**: System MUST support express delivery surcharge configuration per pincode or zone

#### Delivery & Service Area Management

- **FR-049**: System MUST allow admin to manage serviceable pincodes list
- **FR-050**: System MUST allow admin to configure 2-hour express service zones with pincodes and service window (time range)
- **FR-051**: System MUST only display express delivery option to customers within service zone and during service hours
- **FR-052**: System MUST allow admin to set store address for pickup option
- **FR-053**: System MUST calculate and display estimated delivery date based on selected delivery option and current date/time

#### Notification System

- **FR-054**: System MUST send email and SMS notifications to customers for: order placed, payment success, payment failure, order accepted, order printing, order ready, order out for delivery, order completed, order cancelled, COD reminder
- **FR-055**: System MUST send WhatsApp message link if customer has opted in for WhatsApp notifications
- **FR-056**: System MUST allow customers to manage notification preferences (email, SMS, WhatsApp) in account settings
- **FR-057**: System MUST send admin notifications (email or in-app) for: new order received, payment failure, express order SLA risk
- **FR-058**: System MUST log all notification attempts with timestamp, channel (email/SMS/WhatsApp), status (sent/delivered/failed), and error reason if failed
- **FR-059**: System MUST allow admin to manage notification templates with dynamic variables (order_id, customer_name, order_total, etc.)
- **FR-060**: System MUST use fallback values when template variable is missing and log template error

#### Customer Account Management

- **FR-061**: System MUST allow customers to create account with email, phone, and password
- **FR-062**: System MUST allow customers to log in to view orders and manage profile
- **FR-063**: System MUST allow customers to manage profile information (name, email, phone)
- **FR-064**: System MUST allow customers to add, edit, delete delivery addresses in address book
- **FR-065**: System MUST allow customers to set one address as default
- **FR-066**: System MUST prevent deletion of address that's used in pending orders

#### Admin Customer Management

- **FR-067**: System MUST provide admin view of all customers with basic details (name, email, phone, total orders, total revenue)
- **FR-068**: System MUST allow admin to search customers by name, email, or phone
- **FR-069**: System MUST show customer order history when admin clicks on customer

#### Reporting & Analytics

- **FR-070**: System MUST provide orders and revenue report with date range selector showing daily/weekly/monthly trends
- **FR-071**: System MUST provide top products report showing product type distribution with counts and percentages
- **FR-072**: System MUST provide repeat customers report showing customers with 2+ orders and their total order value
- **FR-073**: System MUST allow filtering of reports by: product type, payment method, delivery option, status
- **FR-074**: System MUST support export of report data as CSV file
- **FR-075**: System MUST calculate and display key business metrics: average order value, conversion rate, repeat customer rate

#### System & Data Management

- **FR-076**: System MUST persist uploaded files securely with unique identifiers linked to order ID
- **FR-077**: System MUST validate file size limit (25MB) and file type before accepting upload
- **FR-078**: System MUST generate unique order IDs using format: DISHA-YYYYMMDD-XXXX (e.g., DISHA-20251116-0001)
- **FR-079**: System MUST lock pricing when customer starts checkout to prevent price changes mid-order
- **FR-080**: System MUST support session management with 30-minute idle timeout and session resume capability
- **FR-081**: System MUST log all admin actions (status changes, pricing updates, refunds) with timestamp and admin user ID for audit trail
- **FR-082**: System MUST validate all user inputs (addresses, phone numbers, email, pincodes) with appropriate format checks
- **FR-083**: System MUST handle concurrent access with optimistic locking to prevent conflicting updates
- **FR-084**: System MUST provide graceful error handling with user-friendly error messages (no raw stack traces)
- **FR-085**: System MUST support data backup and recovery mechanisms

### Key Entities

- **Customer**: Represents a registered user who places orders. Key attributes: unique ID, name, email, phone, password hash, notification preferences (email/SMS/WhatsApp enabled), created date, last login date. Relationships: has many Orders, has many Addresses.

- **Address**: Represents delivery address saved by customer. Key attributes: unique ID, customer ID (foreign key), full name, phone, address line 1, address line 2, landmark, city, state, pincode, is_default (boolean), created date. Relationships: belongs to Customer, has many Orders.

- **Order**: Represents customer's print order. Key attributes: unique order ID, customer ID, order date/time, status (New/Accepted/Printing/Ready/Out for Delivery/Completed/Cancelled), delivery option (express/same-day/standard/pickup), delivery address ID, payment method, payment status, total amount, delivery charge, express surcharge, COD advance amount, COD collected amount, estimated delivery date/time, completed date/time, cancellation reason. Relationships: belongs to Customer, has many OrderItems, belongs to Address, has many Notifications, has many StatusHistory.

- **OrderItem**: Represents individual file/product in an order. Key attributes: unique ID, order ID (foreign key), product type (A4 Document/Business Card/Brochure/etc.), file name, file storage path, color/BW, paper size, single/double sided, paper type, binding type, quantity, page count (for documents), unit price, item total, print configuration JSON. Relationships: belongs to Order, belongs to ProductType.

- **ProductType**: Represents print product category. Key attributes: unique ID, name (A4 Documents/Business Cards/Brochures/etc.), description, is_active (boolean), base_price_per_unit, available paper sizes, available paper types, available binding options. Relationships: has many PricingRules, has many OrderItems.

- **PricingRule**: Represents pricing configuration for product options. Key attributes: unique ID, product type ID, rule type (paper_type/binding/paper_size/color), option name, price modifier (fixed amount or percentage), is_active. Relationships: belongs to ProductType.

- **Payment**: Represents payment transaction. Key attributes: unique ID, order ID, payment method, payment gateway transaction ID, amount, payment status (pending/success/failed), initiated date/time, completed date/time, failure reason, refund status, refund amount, refund date. Relationships: belongs to Order.

- **ServiceZone**: Represents delivery service configuration. Key attributes: unique ID, pincode, city, state, is_serviceable, express_available (boolean), express_service_window_start, express_service_window_end, express_surcharge, standard_delivery_days. Relationships: none (reference data).

- **Notification**: Represents notification sent to customer or admin. Key attributes: unique ID, order ID, recipient (email/phone), notification type (order_placed/payment_success/status_update/etc.), channel (email/SMS/WhatsApp), template ID, sent date/time, delivery status (sent/delivered/failed), error message. Relationships: belongs to Order, uses NotificationTemplate.

- **NotificationTemplate**: Represents template for notifications. Key attributes: unique ID, template name, notification type, channel, subject (for email), body with variables ({{order_id}}, {{customer_name}}, etc.), is_active. Relationships: has many Notifications.

- **Admin**: Represents admin user who processes orders. Key attributes: unique ID, username, email, password hash, role (super_admin/order_manager/support), is_active, created date, last login date. Relationships: has many AuditLogs.

- **AuditLog**: Represents log of admin actions. Key attributes: unique ID, admin ID, action type (status_change/price_update/refund/etc.), entity type (Order/Product/Pricing), entity ID, old value, new value, timestamp. Relationships: belongs to Admin.

- **PrintQueue**: Represents printer/device assignment. Key attributes: unique ID, printer name, is_active, location. Relationships: has many PrintJobs.

- **PrintJob**: Represents job assigned to printer. Key attributes: unique ID, order item ID, printer ID, assigned date/time, printed date/time, status (queued/printing/printed/failed/requeued), retry_count, notes. Relationships: belongs to PrintQueue, belongs to OrderItem.

- **StatusHistory**: Represents order status change tracking. Key attributes: unique ID, order ID, old status, new status, changed by admin ID, changed date/time, notes. Relationships: belongs to Order, belongs to Admin.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can complete entire order flow (upload → configure → checkout → payment) in under 5 minutes for single A4 document order with saved address
- **SC-002**: System handles file uploads up to 25MB with progress indicator and completes upload within 30 seconds on standard broadband connection (5 Mbps)
- **SC-003**: Live pricing calculation updates within 500ms when customer changes any print option
- **SC-004**: Payment confirmation and order creation completes within 10 seconds after successful payment gateway response
- **SC-005**: Customers receive "Order Placed" notification via email and SMS within 2 minutes of order creation
- **SC-006**: Admin can view new order details including downloadable files within 30 seconds of order placement
- **SC-007**: Admin dashboard loads with current KPIs (today's orders, revenue, etc.) within 2 seconds
- **SC-008**: 95% of status update notifications are delivered successfully (email or SMS reaches customer)
- **SC-009**: Express orders flagged as "SLA Risk" are highlighted to admin at least 30 minutes before 2-hour deadline
- **SC-010**: Customers can filter and find specific order in "My Orders" within 3 clicks (filter by status or search by order ID)
- **SC-011**: System handles 100 concurrent customer sessions during peak hours without performance degradation (page load < 3 seconds)
- **SC-012**: Admin can update pricing for product option and change reflects for new customer orders within 1 minute
- **SC-013**: 90% of customers successfully complete checkout on first attempt without encountering errors
- **SC-014**: System validates serviceable pincode within 1 second and displays appropriate delivery options
- **SC-015**: PDF invoice generation for completed order completes within 5 seconds and contains all order details correctly
- **SC-016**: Admin can assign 20 orders to print queue and mark them printed using bulk actions within 2 minutes
- **SC-017**: Reports (orders, revenue, top products) with 30-day date range load and display visualizations within 5 seconds
- **SC-018**: CSV export of report data completes within 10 seconds for up to 1000 orders
- **SC-019**: System prevents duplicate payment processing 100% of the time by detecting payment gateway transaction ID
- **SC-020**: Customer support queries related to "Where is my order?" reduce by 60% after implementation of order tracking and proactive notifications
- **SC-021**: Average order value increases by 20% within 3 months due to multi-file orders and premium options (express delivery, premium paper)
- **SC-022**: Repeat customer rate (customers with 2+ orders) reaches 40% within 6 months of launch
- **SC-023**: 85% of customers rate overall experience as "Satisfied" or "Very Satisfied" in post-order feedback survey
- **SC-024**: Zero data loss incidents - all uploaded files and order data are recoverable from backups in case of system failure
- **SC-025**: Admin can onboard (add pricing for) new product type without developer intervention within 30 minutes using product management interface
