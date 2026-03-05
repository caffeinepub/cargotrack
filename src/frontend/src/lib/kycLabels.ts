import { KycType } from "../backend.d";

export const KYC_LABEL: Record<string, string> = {
  [KycType.aadhaar]: "Aadhaar Card",
  [KycType.pan]: "PAN Card",
  [KycType.passport]: "Passport",
  [KycType.drivingLicense]: "Driving License",
};
