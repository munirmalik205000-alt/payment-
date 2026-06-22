/**
 * SmartPay360 Gateway Shared Types
 */

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'merchant';
  created_at: string;
}

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  phone: string;
  support_email: string;
  wallet_balance: number;
  settlement_cycle: 'T+1' | 'T+2' | 'T+7';
  status: 'pending' | 'active' | 'rejected';
  commission_pct: number; // e.g. 2.0%
  created_at: string;
  updated_at: string;
}

export interface MerchantKyc {
  id: string;
  merchant_id: string;
  pan_number: string;
  aadhaar_number: string;
  bank_account_no: string;
  bank_ifsc: string;
  bank_name: string;
  account_holder_name: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  uploaded_at: string;
}

export interface ApiKey {
  id: string;
  merchant_id: string;
  api_key: string;
  secret_key: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  merchant_id: string;
  order_id_custom: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  callback_url: string;
  redirect_url: string;
  customer_email: string;
  customer_phone: string;
  description?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  merchant_id: string;
  utr_no: string; // Unique Transaction Reference
  payment_mode: 'UPI_QR_DYNAMIC' | 'UPI_QR_STATIC' | 'PAYMENT_LINK' | 'CARD' | 'NET_BANKING';
  status: 'pending' | 'success' | 'failed';
  amount: number;
  commission_deducted: number;
  gst_deducted: number;
  settlement_amount: number;
  tracking_ip?: string;
  fraud_score: number; // 0 to 100
  created_at: string;
}

export interface Settlement {
  id: string;
  merchant_id: string;
  amount: number;
  transactions_count: number;
  status: 'pending' | 'processed';
  settlement_date: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  merchant_id: string;
  amount: number;
  bank_account_no: string;
  bank_ifsc: string;
  bank_name: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  requested_at: string;
  processed_at?: string;
}

export interface CommissionSetting {
  id: string;
  rate: number; // base rate in %
  gst_rate: number; // e.g. 18%
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  merchant_id: string;
  webhook_url: string;
  status: 'success' | 'failed';
  payload: string;
  response_status?: number;
  response_body?: string;
  triggered_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  ip_address: string;
  details: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  merchant_id: string;
  subject: string;
  message: string;
  status: 'open' | 'closed' | 'replied';
  reply?: string;
  created_at: string;
}
