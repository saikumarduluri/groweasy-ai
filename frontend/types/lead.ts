export type CrmStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE"
  | "";

export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots"
  | "";

export interface CrmLead {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  originalRecord: Record<string, unknown>;
  reason: string;
}

export interface ImportResult {
  success: boolean;
  records: CrmLead[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  error?: string;
}

export type RawCsvRecord = Record<string, string>;

export interface ParsedCsv {
  headers: string[];
  rows: RawCsvRecord[];
  fileName: string;
  rowCount: number;
}
