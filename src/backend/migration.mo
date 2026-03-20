import Map "mo:core/Map";
import Time "mo:core/Time";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  type OldActor = {
    nextFranchiseIdCount : Nat;
    nextBookingIdCount : Nat;
    nextInvoiceIdCount : Nat;
    franchisees : Map.Map<Text, { franchiseId : Text; username : Text; franchiseName : Text; contactPhone : Text; contactEmail : Text; isActive : Bool; principal : Principal }>;
    principalToFranchiseId : Map.Map<Principal, Text>;
    userPasswords : Map.Map<Text, Text>;
    bookings : Map.Map<Nat, {
      bookingId : Nat;
      status : { #pending; #approved; #rejected };
      createdBy : Text;
      awbNumber : ?Text;
      awbAssignedDate : ?Time.Time;
      shipper : {
        name : Text;
        phone : Text;
        address : Text;
        kycType : { #aadhaar; #pan; #passport; #drivingLicense };
        kycNumber : Text;
      };
      consignee : {
        name : Text;
        phone : Text;
        address : Text;
        idType : { #aadhaar; #pan; #passport; #drivingLicense };
        idNumber : Text;
      };
      originCountry : Text;
      destinationCountry : Text;
      invoice : {
        invoiceNumber : Text;
        invoiceDate : Time.Time;
        currency : Text;
      };
      boxes : [{
        boxNumber : Nat;
        grossWeight : Float;
        length : Float;
        width : Float;
        height : Float;
        volumeWeight : Float;
      }];
      boxItems : [{
        boxNumber : Nat;
        description : Text;
        hsCode : Text;
        quantity : Nat;
        rate : Float;
        total : Float;
      }];
      createdTimestamp : Time.Time;
      updatedTimestamp : Time.Time;
    }>;
    trackingUpdates : Map.Map<Text, List.List<{
      awbNumber : Text;
      milestone : {
        #baggingDone;
        #customsClearanceAtOrigin;
        #inTransit;
        #reachedDestinationPort;
        #movedToWarehouse;
        #handoverToCarrier;
        #outForDelivery;
      };
      timestamp : Time.Time;
      notes : ?Text;
      carrierName : ?Text;
      carrierTrackingNumber : ?Text;
      carrierTrackingURL : ?Text;
    }>>;
    unreadNotifications : Nat;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    nextFranchiseIdCount : Nat;
    nextBookingIdCount : Nat;
    nextInvoiceIdCount : Nat;
    franchisees : Map.Map<Text, { franchiseId : Text; username : Text; franchiseName : Text; contactPhone : Text; contactEmail : Text; isActive : Bool; principal : Principal }>;
    principalsToFranchiseId : Map.Map<Principal, Text>;
    userPasswords : Map.Map<Text, Text>;
    bookings : Map.Map<Nat, {
      bookingId : Nat;
      status : { #pending; #approved; #rejected };
      createdBy : Text;
      awbNumber : ?Text;
      awbAssignedDate : ?Time.Time;
      shipper : {
        name : Text;
        phone : Text;
        address : Text;
        kycType : { #aadhaar; #pan; #passport; #drivingLicense };
        kycNumber : Text;
      };
      consignee : {
        name : Text;
        phone : Text;
        address : Text;
        idType : { #aadhaar; #pan; #passport; #drivingLicense };
        idNumber : Text;
      };
      originCountry : Text;
      destinationCountry : Text;
      invoice : {
        invoiceNumber : Text;
        invoiceDate : Time.Time;
        currency : Text;
      };
      boxes : [{
        boxNumber : Nat;
        grossWeight : Float;
        length : Float;
        width : Float;
        height : Float;
        volumeWeight : Float;
      }];
      boxItems : [{
        boxNumber : Nat;
        description : Text;
        hsCode : Text;
        quantity : Nat;
        rate : Float;
        total : Float;
      }];
      createdTimestamp : Time.Time;
      updatedTimestamp : Time.Time;
    }>;
    trackingUpdates : Map.Map<Text, List.List<{
      awbNumber : Text;
      milestone : {
        #baggingDone;
        #customsClearanceAtOrigin;
        #inTransit;
        #reachedDestinationPort;
        #movedToWarehouse;
        #handoverToCarrier;
        #outForDelivery;
      };
      timestamp : Time.Time;
      notes : ?Text;
      carrierName : ?Text;
      carrierTrackingNumber : ?Text;
      carrierTrackingURL : ?Text;
    }>>;
    unreadNotifications : Nat;
    nextCustomerIdCount : Nat;
    nextProductIdCount : Nat;
    nextBillingRecordIdCount : Nat;
    nextPaymentRecordIdCount : Nat;
    customers : Map.Map<Text, {
      id : Text;
      name : Text;
      phone : Text;
      address : Text;
      gstin : Text;
      createdAt : Time.Time;
    }>;
    products : Map.Map<Text, {
      id : Text;
      name : Text;
      price : Float;
      gstPercent : Float;
      hsnSacCode : Text;
      unit : Text;
      isActive : Bool;
    }>;
    billingRecords : Map.Map<Text, {
      id : Text;
      billNumber : Text;
      billDate : Time.Time;
      billType : { #gst; #nonGst };
      customerId : Text;
      customerName : Text;
      customerGstin : Text;
      items : [{
        productId : Text;
        description : Text;
        quantity : Nat;
        rate : Float;
        gstPercent : Float;
        amount : Float;
      }];
      subtotal : Float;
      discountAmount : Float;
      taxableAmount : Float;
      cgst : Float;
      sgst : Float;
      igst : Float;
      totalAmount : Float;
      taxType : { #cgstSgst; #igst; #none };
      paymentMethod : Text;
      status : { #paid; #unpaid; #partial };
      notes : Text;
      createdAt : Time.Time;
    }>;
    paymentRecords : Map.Map<Text, {
      id : Text;
      billingRecordId : Text;
      amount : Float;
      paymentMethod : Text;
      paymentDate : Time.Time;
      notes : Text;
    }>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    let newPrincipalsToFranchiseId = old.principalToFranchiseId;
    {
      old with
      nextCustomerIdCount = 0;
      nextProductIdCount = 0;
      nextBillingRecordIdCount = 0;
      nextPaymentRecordIdCount = 0;
      customers = Map.empty<Text, {
        id : Text;
        name : Text;
        phone : Text;
        address : Text;
        gstin : Text;
        createdAt : Time.Time;
      }>();
      products = Map.empty<Text, {
        id : Text;
        name : Text;
        price : Float;
        gstPercent : Float;
        hsnSacCode : Text;
        unit : Text;
        isActive : Bool;
      }>();
      billingRecords = Map.empty<Text, {
        id : Text;
        billNumber : Text;
        billDate : Time.Time;
        billType : { #gst; #nonGst };
        customerId : Text;
        customerName : Text;
        customerGstin : Text;
        items : [{
          productId : Text;
          description : Text;
          quantity : Nat;
          rate : Float;
          gstPercent : Float;
          amount : Float;
        }];
        subtotal : Float;
        discountAmount : Float;
        taxableAmount : Float;
        cgst : Float;
        sgst : Float;
        igst : Float;
        totalAmount : Float;
        taxType : { #cgstSgst; #igst; #none };
        paymentMethod : Text;
        status : { #paid; #unpaid; #partial };
        notes : Text;
        createdAt : Time.Time;
      }>();
      paymentRecords = Map.empty<Text, {
        id : Text;
        billingRecordId : Text;
        amount : Float;
        paymentMethod : Text;
        paymentDate : Time.Time;
        notes : Text;
      }>();
      principalsToFranchiseId = newPrincipalsToFranchiseId;
    };
  };
};
