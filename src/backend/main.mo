import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import List "mo:core/List";
import Bool "mo:core/Bool";
import Nat8 "mo:core/Nat8";
import Char "mo:core/Char";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type UserId = Text;
  type FranchiseId = Text;
  type BookingId = Nat;
  type AWBNumber = Text;

  public type UserRole = AccessControl.UserRole;
  public type BookingStatus = { #pending; #approved; #rejected };

  public type KycType = { #aadhaar; #pan; #passport; #drivingLicense };

  public type Franchise = {
    franchiseId : FranchiseId;
    username : Text;
    franchiseName : Text;
    contactPhone : Text;
    contactEmail : Text;
    isActive : Bool;
    principal : Principal;
  };

  module Franchise {
    public func compare(franchise1 : Franchise, franchise2 : Franchise) : Order.Order {
      Text.compare(franchise1.franchiseId, franchise2.franchiseId);
    };
  };

  public type Shipper = {
    name : Text;
    phone : Text;
    address : Text;
    kycType : KycType;
    kycNumber : Text;
  };

  public type Consignee = {
    name : Text;
    phone : Text;
    address : Text;
    idType : KycType;
    idNumber : Text;
  };

  public type Invoice = {
    invoiceNumber : Text;
    invoiceDate : Time.Time;
    currency : Text;
  };

  public type Box = {
    boxNumber : Nat;
    grossWeight : Float;
    length : Float;
    width : Float;
    height : Float;
    volumeWeight : Float;
  };

  public type BoxItem = {
    boxNumber : Nat;
    description : Text;
    hsCode : Text;
    quantity : Nat;
    rate : Float;
    total : Float;
  };

  public type Booking = {
    bookingId : BookingId;
    status : BookingStatus;
    createdBy : UserId;
    awbNumber : ?AWBNumber;
    awbAssignedDate : ?Time.Time;
    shipper : Shipper;
    consignee : Consignee;
    originCountry : Text;
    destinationCountry : Text;
    invoice : Invoice;
    boxes : [Box];
    boxItems : [BoxItem];
    createdTimestamp : Time.Time;
    updatedTimestamp : Time.Time;
  };

  public type TrackingMilestone = {
    #baggingDone;
    #customsClearanceAtOrigin;
    #inTransit;
    #reachedDestinationPort;
    #movedToWarehouse;
    #handoverToCarrier;
    #outForDelivery;
  };

  public type TrackingUpdate = {
    awbNumber : AWBNumber;
    milestone : TrackingMilestone;
    timestamp : Time.Time;
    notes : ?Text;
    carrierName : ?Text;
    carrierTrackingNumber : ?Text;
    carrierTrackingURL : ?Text;
  };

  public type LoginResponse = {
    success : Bool;
    userId : Text;
    role : UserRole;
    message : Text;
  };

  public type CreateFranchiseRequest = {
    username : Text;
    franchiseName : Text;
    contactPhone : Text;
    contactEmail : Text;
  };

  public type BookingRequest = {
    shipper : Shipper;
    consignee : Consignee;
    destinationCountry : Text;
    invoice : Invoice;
    boxes : [Box];
    boxItems : [BoxItem];
  };

  public type AWBAssignRequest = {
    bookingId : BookingId;
    awbNumber : Text;
  };

  public type UserProfile = {
    userId : Text;
    name : Text;
    role : UserRole;
    franchiseId : ?FranchiseId;
  };

  var nextFranchiseIdCount : Nat = 0;
  var nextBookingIdCount : Nat = 100000;
  var nextInvoiceIdCount : Nat = 0;

  let franchisees = Map.empty<FranchiseId, Franchise>();
  let principalToFranchiseId = Map.empty<Principal, FranchiseId>();
  let userPasswords = Map.empty<UserId, Text>();
  let bookings = Map.empty<BookingId, Booking>();
  let trackingUpdates = Map.empty<AWBNumber, List.List<TrackingUpdate>>();
  var unreadNotifications : Nat = 0;
  let adminUserId : Text = "admin";
  let adminUserRole : UserRole = #admin;
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type FranchiseError = {
    #franchiseNotFound;
    #franchiseNotActive;
    #usernameExists;
    #invalidCredentials;
    #notAuthorized;
    #unknownError;
  };
  public type BookingError = {
    #notAuthorized;
    #franchiseNotActive;
    #invalidStatusTransition;
    #bookingNotFound;
    #unknownError;
  };
  public type TrackingError = {
    #invalidStatusTransition;
    #invalidBookingStatus;
    #emptyAWBNumber;
    #invalidRequest;
    #unknownError;
  };

  func getNextFranchiseId() : FranchiseId {
    let currentId = "franchise-" # nextFranchiseIdCount.toText();
    nextFranchiseIdCount += 1;
    currentId;
  };

  func getNextBookingId() : BookingId {
    let currentId = nextBookingIdCount;
    nextBookingIdCount += 1;
    currentId;
  };

  func getNextInvoiceId() : Text {
    let currentId = "invoice-" # nextInvoiceIdCount.toText();
    nextInvoiceIdCount += 1;
    currentId;
  };

  func getFranchiseIdForCaller(caller : Principal) : ?FranchiseId {
    principalToFranchiseId.get(caller);
  };

  func verifyFranchiseOwnership(caller : Principal, franchiseId : FranchiseId) : Bool {
    switch (principalToFranchiseId.get(caller)) {
      case (null) { false };
      case (?callerFranchiseId) {
        callerFranchiseId == franchiseId;
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getFranchise(franchiseId : FranchiseId) : async Franchise {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access this endpoint");
    };
    switch (franchisees.get(franchiseId)) {
      case (null) { Runtime.trap("Franchise ID does not exist") };
      case (?franchise) { franchise };
    };
  };

  public query ({ caller }) func getAllFranchisees() : async [Franchise] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access this endpoint");
    };
    let franchises = franchisees.values();
    let franchiseArray = franchises.toArray();
    franchiseArray.sort();
  };

  public shared ({ caller }) func createFranchise(
    franchisePrincipal : Principal,
    username : Text,
    franchiseName : Text,
    contactPhone : Text,
    contactEmail : Text,
  ) : async Franchise {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create franchises");
    };
    let franchiseId = getNextFranchiseId();
    let newFranchise : Franchise = {
      franchiseId;
      username;
      franchiseName;
      contactPhone;
      contactEmail;
      isActive = true;
      principal = franchisePrincipal;
    };
    let defaultPassword = franchiseId;
    franchisees.add(franchiseId, newFranchise);
    principalToFranchiseId.add(franchisePrincipal, franchiseId);
    userPasswords.add(franchiseId, defaultPassword);
    AccessControl.assignRole(accessControlState, caller, franchisePrincipal, #user);

    let profile : UserProfile = {
      userId = franchiseId;
      name = franchiseName;
      role = #user;
      franchiseId = ?franchiseId;
    };
    userProfiles.add(franchisePrincipal, profile);

    newFranchise;
  };

  public shared ({ caller }) func adminResetFranchisePassword(
    franchiseId : FranchiseId,
    newPassword : Text,
  ) : async Franchise {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reset passwords");
    };
    if (newPassword == "") {
      Runtime.trap("Password cannot be empty");
    };
    switch (franchisees.get(franchiseId)) {
      case (null) {
        Runtime.trap("Franchise ID does not exist");
      };
      case (?franchise) {
        userPasswords.add(franchiseId, newPassword);
        franchise;
      };
    };
  };

  public shared ({ caller }) func updateFranchise(
    franchiseId : FranchiseId,
    franchiseName : Text,
    contactPhone : Text,
    contactEmail : Text,
  ) : async Franchise {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update franchises");
    };
    switch (franchisees.get(franchiseId)) {
      case (null) {
        Runtime.trap("Franchise ID does not exist");
      };
      case (?franchise) {
        let updatedFranchise : Franchise = {
          franchiseId = franchise.franchiseId;
          username = franchise.username;
          franchiseName;
          contactPhone;
          contactEmail;
          isActive = franchise.isActive;
          principal = franchise.principal;
        };
        franchisees.add(franchiseId, updatedFranchise);
        updatedFranchise;
      };
    };
  };

  public shared ({ caller }) func updateFranchiseStatus(
    franchiseId : FranchiseId,
    isActive : Bool,
  ) : async Franchise {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update franchise status");
    };
    switch (franchisees.get(franchiseId)) {
      case (null) { Runtime.trap("Franchise ID does not exist") };
      case (?franchise) {
        let updatedFranchise : Franchise = {
          franchise with
          isActive;
        };
        franchisees.add(franchiseId, updatedFranchise);
        updatedFranchise;
      };
    };
  };

  public shared ({ caller }) func franchiseeUpdatePassword(
    currentPassword : Text,
    newPassword : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only franchise users can update passwords");
    };

    switch (getFranchiseIdForCaller(caller)) {
      case (null) {
        Runtime.trap("Franchise not found for caller");
      };
      case (?franchiseId) {
        switch (userPasswords.get(franchiseId)) {
          case (null) {
            Runtime.trap("Franchise password not found");
          };
          case (?storedPassword) {
            if (currentPassword != storedPassword) {
              Runtime.trap("Current password is incorrect");
            };
            if (newPassword == "") {
              Runtime.trap("New password cannot be empty");
            };
            userPasswords.add(franchiseId, newPassword);
          };
        };
      };
    };
  };

  public query ({ caller }) func getBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access bookings");
    };

    let bookingsList = bookings.values().toArray();

    if (AccessControl.isAdmin(accessControlState, caller)) {
      return bookingsList;
    };

    switch (getFranchiseIdForCaller(caller)) {
      case (null) {
        Runtime.trap("Franchise not found for caller");
      };
      case (?franchiseId) {
        bookingsList.filter(
          func(b : Booking) : Bool {
            b.createdBy == franchiseId;
          }
        );
      };
    };
  };

  public query ({ caller }) func getBookingById(bookingId : BookingId) : async Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access bookings");
    };

    switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          switch (getFranchiseIdForCaller(caller)) {
            case (null) {
              Runtime.trap("Franchise not found for caller");
            };
            case (?franchiseId) {
              if (booking.createdBy != franchiseId) {
                Runtime.trap("Unauthorized: Can only view your own bookings");
              };
            };
          };
        };
        booking;
      };
    };
  };

  public query ({ caller }) func getBookingByAWB(awbNumber : AWBNumber) : async Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access bookings");
    };

    let filteredBookings = bookings.values().filter(
      func(booking) {
        switch (booking.awbNumber) {
          case (null) { false };
          case (?number) {
            number == awbNumber;
          };
        };
      }
    );

    switch (filteredBookings.next()) {
      case (null) { Runtime.trap("Booking not found for AWB: " # awbNumber) };
      case (?booking) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          switch (getFranchiseIdForCaller(caller)) {
            case (null) {
              Runtime.trap("Franchise not found for caller");
            };
            case (?franchiseId) {
              if (booking.createdBy != franchiseId) {
                Runtime.trap("Unauthorized: Can only view your own bookings");
              };
            };
          };
        };
        booking;
      };
    };
  };

  public shared ({ caller }) func createBooking(
    shipper : Shipper,
    consignee : Consignee,
    destinationCountry : Text,
    invoice : Invoice,
    boxes : [Box],
    boxItems : [BoxItem],
  ) : async Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bookings");
    };

    let franchiseId = switch (getFranchiseIdForCaller(caller)) {
      case (null) {
        Runtime.trap("Franchise not found for caller");
      };
      case (?id) { id };
    };

    switch (franchisees.get(franchiseId)) {
      case (null) { Runtime.trap("Franchise does not exist") };
      case (?franchise) {
        if (not franchise.isActive) {
          Runtime.trap("Franchise is not active. Please contact admin for approval.");
        };
      };
    };

    let bookingId = getNextBookingId();
    let booking : Booking = {
      bookingId;
      status = #pending;
      createdBy = franchiseId;
      awbNumber = null;
      awbAssignedDate = null;
      shipper;
      consignee;
      originCountry = "India";
      destinationCountry;
      invoice;
      boxes;
      boxItems;
      createdTimestamp = Time.now();
      updatedTimestamp = Time.now();
    };

    bookings.add(bookingId, booking);
    unreadNotifications += 1;
    booking;
  };

  public shared ({ caller }) func assignAWBAndApprove(
    awbAssignRequest : AWBAssignRequest,
  ) : async Booking {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign AWB and approve bookings");
    };

    switch (bookings.get(awbAssignRequest.bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (booking.status != #pending) {
          Runtime.trap("Booking must be in pending status. Current status is: " # debug_show (booking.status));
        };

        let updatedBooking = {
          booking with
          awbNumber = ?awbAssignRequest.awbNumber;
          awbAssignedDate = ?Time.now();
          status = #approved;
          updatedTimestamp = Time.now();
        };

        bookings.add(awbAssignRequest.bookingId, updatedBooking);
        updatedBooking;
      };
    };
  };

  public shared ({ caller }) func rejectBooking(bookingId : BookingId) : async Booking {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject bookings");
    };
    switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (booking.status != #pending) {
          Runtime.trap("Booking must be in pending status. Current status is: " # debug_show (booking.status));
        };
        let updatedBooking = {
          booking with
          status = #rejected;
          updatedTimestamp = Time.now();
        };
        bookings.add(bookingId, updatedBooking);
        updatedBooking;
      };
    };
  };

  public query ({ caller }) func getUnreadCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access notification count");
    };
    unreadNotifications;
  };

  public shared ({ caller }) func markNotificationsRead() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can mark notifications as read");
    };
    unreadNotifications := 0;
  };

  public shared ({ caller }) func addTrackingUpdate(
    awbNumber : AWBNumber,
    milestone : TrackingMilestone,
    notes : ?Text,
    carrierName : ?Text,
    carrierTrackingNumber : ?Text,
    carrierTrackingURL : ?Text,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add tracking updates");
    };
    if (awbNumber == "") {
      Runtime.trap("AWB Number must be provided");
    };

    let trackingUpdate : TrackingUpdate = {
      awbNumber;
      milestone;
      timestamp = Time.now();
      notes;
      carrierName;
      carrierTrackingNumber;
      carrierTrackingURL;
    };

    switch (trackingUpdates.get(awbNumber)) {
      case (null) {
        let newUpdates = List.fromArray<TrackingUpdate>([trackingUpdate]);
        trackingUpdates.add(awbNumber, newUpdates);
      };
      case (?updates) {
        updates.add(trackingUpdate);
      };
    };
  };

  public query func getTrackingByAWB(awbNumber : AWBNumber) : async [TrackingUpdate] {
    switch (trackingUpdates.get(awbNumber)) {
      case (null) { [] };
      case (?updates) {
        updates.toArray();
      };
    };
  };

  public query ({ caller }) func getTrackingByBookingId(
    bookingId : BookingId,
  ) : async [TrackingUpdate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tracking information");
    };

    switch (bookings.get(bookingId)) {
      case (null) {
        Runtime.trap("Booking not found");
      };
      case (?booking) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          switch (getFranchiseIdForCaller(caller)) {
            case (null) {
              Runtime.trap("Franchise not found for caller");
            };
            case (?franchiseId) {
              if (booking.createdBy != franchiseId) {
                Runtime.trap("Unauthorized: Can only view tracking for your own bookings");
              };
            };
          };
        };

        switch (booking.awbNumber) {
          case (null) {
            [];
          };
          case (?awbNumber) {
            switch (trackingUpdates.get(awbNumber)) {
              case (null) {
                [];
              };
              case (?updates) {
                let trackingArray = updates.toArray();
                trackingArray.sort(trackingCompare);
              };
            };
          };
        };
      };
    };
  };

  func trackingCompare(a : TrackingUpdate, b : TrackingUpdate) : Order.Order {
    Int.compare(a.timestamp, b.timestamp);
  };

  public shared ({ caller }) func test() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access test endpoint");
    };
  };
};
