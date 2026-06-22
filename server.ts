import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Ports and hosts
const PORT = 3000;
const HOST = '0.0.0.0';

// DB File Location
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'gateway_db.json');

// Initialize Database structure
interface DB {
  users: any[];
  merchants: any[];
  merchant_kyc: any[];
  api_keys: any[];
  orders: any[];
  transactions: any[];
  settlements: any[];
  withdrawals: any[];
  commissions: any[];
  webhooks: any[];
  activity_logs: any[];
  tickets: any[];
  commission_settings: any;
}

const defaultDB: DB = {
  users: [
    {
      id: "u-admin",
      email: "admin@smartpay360.com",
      password_hash: "admin123", // Humble clear password for demo purposes
      role: "admin",
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "u-merchant-1",
      email: "merchant@startech.co",
      password_hash: "merchant123",
      role: "merchant",
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "u-merchant-pending",
      email: "jane@retrofashion.com",
      password_hash: "jane123",
      role: "merchant",
      created_at: new Date().toISOString()
    }
  ],
  merchants: [
    {
      id: "m-startech",
      user_id: "u-merchant-1",
      business_name: "StarTech Solutions Co",
      email: "merchant@startech.co",
      phone: "+91 98765 43210",
      support_email: "support@startech.co",
      wallet_balance: 142500.50,
      settlement_cycle: "T+1",
      status: "active",
      commission_pct: 1.8,
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "m-pending",
      user_id: "u-merchant-pending",
      business_name: "Retro Fashion Hub",
      email: "jane@retrofashion.com",
      phone: "+91 99999 88888",
      support_email: "help@retrofashion.com",
      wallet_balance: 0.00,
      settlement_cycle: "T+2",
      status: "pending",
      commission_pct: 2.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  merchant_kyc: [
    {
      id: "kyc-startech",
      merchant_id: "m-startech",
      pan_number: "ABCDE1234F",
      aadhaar_number: "4455-8899-1122",
      bank_account_no: "9180023455110",
      bank_ifsc: "HDFC0001243",
      bank_name: "HDFC Bank Ltd",
      account_holder_name: "StarTech Solutions Corp",
      status: "approved",
      remarks: "Documents verified successfully by Admin on registration.",
      uploaded_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
    }
  ],
  api_keys: [
    {
      id: "api-startech",
      merchant_id: "m-startech",
      api_key: "sp360_live_key_9fb1526a3cc4",
      secret_key: "sp360_secret_841e2a87b5d985aee2",
      is_active: true,
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    }
  ],
  orders: [
    {
      id: "ord-1",
      merchant_id: "m-startech",
      order_id_custom: "ST_ORDER_101",
      amount: 15000.00,
      currency: "INR",
      status: "success",
      callback_url: "https://startech.co/api/payment-callback",
      redirect_url: "https://startech.co/payment-success",
      customer_email: "alice@gmail.com",
      customer_phone: "+91 91234 56789",
      description: "Enterprise Subscription Pack Plan A",
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "ord-2",
      merchant_id: "m-startech",
      order_id_custom: "ST_ORDER_102",
      amount: 500.00,
      currency: "INR",
      status: "success",
      callback_url: "https://startech.co/api/payment-callback",
      redirect_url: "https://startech.co/payment-success",
      customer_email: "bob@yahoo.com",
      customer_phone: "+91 81234 56780",
      description: "Developer API Access Key",
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "ord-3",
      merchant_id: "m-startech",
      order_id_custom: "ST_ORDER_103",
      amount: 2500.00,
      currency: "INR",
      status: "pending",
      callback_url: "https://startech.co/api/payment-callback",
      redirect_url: "https://startech.co/payment-success",
      customer_email: "charlie@outlook.com",
      customer_phone: "+91 71234 56781",
      description: "IoT Starter Hardware Kit Promo",
      created_at: new Date().toISOString()
    }
  ],
  transactions: [
    {
      id: "tx-1",
      order_id: "ord-1",
      merchant_id: "m-startech",
      utr_no: "UTR994821034912",
      payment_mode: "UPI_QR_DYNAMIC",
      status: "success",
      amount: 15000.00,
      commission_deducted: 270.00, // 1.8% of 15000
      gst_deducted: 48.60,         // 18% of 270
      settlement_amount: 14681.40,
      tracking_ip: "103.49.21.43",
      fraud_score: 8,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "tx-2",
      order_id: "ord-2",
      merchant_id: "m-startech",
      utr_no: "UTR391204859063",
      payment_mode: "PAYMENT_LINK",
      status: "success",
      amount: 500.00,
      commission_deducted: 9.00,  // 1.8% of 500
      gst_deducted: 1.62,        // 18% of 9
      settlement_amount: 489.38,
      tracking_ip: "152.19.4.52",
      fraud_score: 15,
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ],
  settlements: [
    {
      id: "set-1",
      merchant_id: "m-startech",
      amount: 15170.78,
      transactions_count: 2,
      status: "processed",
      settlement_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ],
  withdrawals: [
    {
      id: "wth-1",
      merchant_id: "m-startech",
      amount: 5000.00,
      bank_account_no: "9180023455110",
      bank_ifsc: "HDFC0001243",
      bank_name: "HDFC Bank Ltd",
      status: "approved",
      remarks: "Payout successfully wired.",
      requested_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      processed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ],
  commissions: [
    {
      id: "com-1",
      transaction_id: "tx-1",
      rate: 1.8,
      amount: 270.00,
      gst_amount: 48.60,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "com-2",
      transaction_id: "tx-2",
      rate: 1.8,
      amount: 9.00,
      gst_amount: 1.62,
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ],
  webhooks: [
    {
      id: "wh-1",
      merchant_id: "m-startech",
      webhook_url: "https://startech.co/api/webhook-receiver",
      status: "success",
      payload: JSON.stringify({ event: "payment.captured", order_id: "ord-1", custom_id: "ST_ORDER_101", amount: 15000 }),
      response_status: 200,
      response_body: "{\"status\": \"received\"}",
      triggered_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ],
  activity_logs: [
    {
      id: "act-1",
      user_id: "u-admin",
      user_email: "admin@smartpay360.com",
      action: "MERCHANT_KYC_APPROVE",
      ip_address: "127.0.0.1",
      details: "Approved KYC & Setup 1.8% commission for StarTech Solutions Co (m-startech)",
      created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
    }
  ],
  tickets: [
    {
      id: "tkt-1",
      merchant_id: "m-startech",
      subject: "API Signature verification fails on Python",
      message: "Hi support, we are trying to verify signatures inside our Python SDK using SHA-256 HMAC, but we get mismatched outputs. Please share a clean code sample.",
      status: "replied",
      reply: "Hi StarTech! Standard signature formulation takes key-sorted JSON payload values joined with '&' or simply 'merchant_id|amount|order_id_custom|secret_key' via HMAC SHA256. See the Docs tab inside our portal for an exact copy-paste sample.",
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ],
  commission_settings: {
    id: "global-config",
    rate: 2.0, // Default 2.0%
    gst_rate: 18.0, // Default 18%
    updated_at: new Date().toISOString()
  }
};

// Database utility functions
const loadDB = (): DB => {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), 'utf-8');
      return defaultDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, using fallback in-memory:", err);
    return defaultDB;
  }
};

const saveDB = (db: DB) => {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to save database file:", err);
  }
};

// Simple secure session signature simulator (role based authentication)
// Since we have no token library by default, we generate a cryptographically solid session token
const createSessionToken = (user: any) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    exp: Date.now() + 24 * 3600 * 1000 
  })).toString('base64url');
  
  const signature = crypto.createHmac('sha256', 'super-secret-gateway-key-smartpay')
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  return `${header}.${payload}.${signature}`;
};

const verifySessionToken = (token: string): any => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const computedSig = crypto.createHmac('sha256', 'super-secret-gateway-key-smartpay')
    .update(`${header}.${payload}`)
    .digest('base64url');
  
  if (computedSig !== signature) return null;
  
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp < Date.now()) return null; // expired
    return data;
  } catch (e) {
    return null;
  }
};

// Main Server Setup
async function launchServer() {
  const app = express();
  app.use(express.json());

  // Log and check
  console.log("Loading database...");
  let database = loadDB();

  // Authentication Middleware
  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifySessionToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Session token expired or corrupted" });
    }
    (req as any).user = decoded;
    next();
  };

  // --------------------------------------------------------
  // 1. PUBLIC AUTH & INITIALIZATION
  // --------------------------------------------------------
  app.post('/api/auth/register', (req, res) => {
    const { email, password, businessName, phone } = req.body;
    if (!email || !password || !businessName || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    database = loadDB();
    const existing = database.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "Email address already registered" });
    }

    const userId = "u-" + crypto.randomBytes(4).toString('hex');
    const merchantId = "m-" + crypto.randomBytes(4).toString('hex');
    
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: password, // simple storage for showcase
      role: "merchant",
      created_at: new Date().toISOString()
    };

    const newMerchant = {
      id: merchantId,
      user_id: userId,
      business_name: businessName,
      email: email.toLowerCase(),
      phone: phone,
      support_email: `support@${email.split('@')[1] || 'smartpay360.com'}`,
      wallet_balance: 0.00,
      settlement_cycle: "T+1",
      status: "pending",
      commission_pct: database.commission_settings.rate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    database.users.push(newUser);
    database.merchants.push(newMerchant);

    // Create Empty KYC entry ready
    database.merchant_kyc.push({
      id: "kyc-" + crypto.randomBytes(4).toString('hex'),
      merchant_id: merchantId,
      pan_number: "",
      aadhaar_number: "",
      bank_account_no: "",
      bank_ifsc: "",
      bank_name: "",
      account_holder_name: "",
      status: "pending",
      uploaded_at: new Date().toISOString()
    });

    // Create activity log
    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: userId,
      user_email: email,
      action: "MERCHANT_REGISTER",
      ip_address: req.ip || '127.0.0.1',
      details: `Registered business: ${businessName}`,
      created_at: new Date().toISOString()
    });

    saveDB(database);

    const token = createSessionToken(newUser);
    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
      merchant: newMerchant
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide email and password" });
    }

    database = loadDB();
    const user = database.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password_hash === password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password credentials" });
    }

    const merchant = database.merchants.find(m => m.user_id === user.id) || null;
    const token = createSessionToken(user);

    // Create log
    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: user.id,
      user_email: user.email,
      action: "USER_LOGIN",
      ip_address: req.ip || '127.0.0.1',
      details: `User logged in with role ${user.role}`,
      created_at: new Date().toISOString()
    });
    saveDB(database);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      merchant
    });
  });


  // --------------------------------------------------------
  // 2. MERCHANT PROTECTED API
  // --------------------------------------------------------
  
  // Get Merchant Profile & Verification
  app.get('/api/merchant/dashboard', authMiddleware, (req, res) => {
    const user = (req as any).user;
    database = loadDB();
    
    if (user.role !== 'merchant') {
      return res.status(403).json({ error: "Forbidden: Not a merchant account" });
    }

    const merchant = database.merchants.find(m => m.user_id === user.id);
    if (!merchant) {
      return res.status(404).json({ error: "Merchant settings not found" });
    }

    const kyc = database.merchant_kyc.find(k => k.merchant_id === merchant.id) || null;
    const key = database.api_keys.find(k => k.merchant_id === merchant.id && k.is_active) || null;
    
    // Quick statistics
    const merchOrders = database.orders.filter(o => o.merchant_id === merchant.id);
    const merchTx = database.transactions.filter(t => t.merchant_id === merchant.id);
    const merchWithdrawals = database.withdrawals.filter(w => w.merchant_id === merchant.id);
    const merchSettlements = database.settlements.filter(s => s.merchant_id === merchant.id);

    const totalOrdersCount = merchOrders.length;
    const successOrders = merchOrders.filter(o => o.status === 'success');
    const totalEarnings = successOrders.reduce((sum, o) => sum + o.amount, 0);

    res.json({
      merchant,
      kyc,
      apiKeys: key ? { api_key: key.api_key, secret_key: key.secret_key, is_active: key.is_active, created_at: key.created_at } : null,
      stats: {
        totalOrdersCount,
        successOrdersCount: successOrders.length,
        totalVolume: totalEarnings,
        walletBalance: merchant.wallet_balance,
        transactions: merchTx.slice(-15).reverse(), // Last 15 transactions
        recentOrders: merchOrders.slice(-15).reverse(),
        withdrawals: merchWithdrawals,
        settlements: merchSettlements
      }
    });
  });

  // KYC Upload / Update
  app.post('/api/merchant/kyc', authMiddleware, (req, res) => {
    const user = (req as any).user;
    const { pan_number, aadhaar_number, bank_account_no, bank_ifsc, bank_name, account_holder_name } = req.body;
    
    database = loadDB();
    const merchant = database.merchants.find(m => m.user_id === user.id);
    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    let kyc = database.merchant_kyc.find(k => k.merchant_id === merchant.id);
    if (!kyc) {
      kyc = {
        id: "kyc-" + crypto.randomBytes(4).toString('hex'),
        merchant_id: merchant.id,
        uploaded_at: new Date().toISOString()
      };
      database.merchant_kyc.push(kyc);
    }

    kyc.pan_number = pan_number || kyc.pan_number;
    kyc.aadhaar_number = aadhaar_number || kyc.aadhaar_number;
    kyc.bank_account_no = bank_account_no || kyc.bank_account_no;
    kyc.bank_ifsc = bank_ifsc || kyc.bank_ifsc;
    kyc.bank_name = bank_name || kyc.bank_name;
    kyc.account_holder_name = account_holder_name || kyc.account_holder_name;
    kyc.status = "pending"; // Reset to pending of updated
    kyc.uploaded_at = new Date().toISOString();

    // Log action
    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: user.id,
      user_email: user.email,
      action: "KYC_UPLOAD",
      ip_address: req.ip || '127.0.0.1',
      details: "Merchant uploaded business KYC documents for verification.",
      created_at: new Date().toISOString()
    });

    saveDB(database);
    res.json({ message: "KYC details uploaded successfully. Verification is pending approval.", kyc });
  });

  // Generate / Rotated API Keys
  app.post('/api/merchant/api-keys/generate', authMiddleware, (req, res) => {
    const user = (req as any).user;
    database = loadDB();
    
    const merchant = database.merchants.find(m => m.user_id === user.id);
    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    if (merchant.status !== 'active') {
      return res.status(400).json({ error: "API Key generation is locked. Your Merchant Account is not Active." });
    }

    // Inactivate existing keys
    database.api_keys.forEach(k => {
      if (k.merchant_id === merchant.id) k.is_active = false;
    });

    const apiKey = "sp360_live_key_" + crypto.randomBytes(8).toString('hex');
    const secretKey = "sp360_secret_" + crypto.randomBytes(12).toString('hex');

    const newKeyRecord = {
      id: "api-" + crypto.randomBytes(4).toString('hex'),
      merchant_id: merchant.id,
      api_key: apiKey,
      secret_key: secretKey,
      is_active: true,
      created_at: new Date().toISOString()
    };

    database.api_keys.push(newKeyRecord);

    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: user.id,
      user_email: user.email,
      action: "API_KEYS_GENERATE",
      ip_address: req.ip || '127.0.0.1',
      details: "Merchant rotated API security credentials.",
      created_at: new Date().toISOString()
    });

    saveDB(database);
    res.json({ message: "API Credentials provisioned successfully.", credentials: newKeyRecord });
  });

  // Create Withdrawal Request
  app.post('/api/merchant/payouts/request', authMiddleware, (req, res) => {
    const user = (req as any).user;
    const { amount } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Please enter a valid payout amount" });
    }

    database = loadDB();
    const merchant = database.merchants.find(m => m.user_id === user.id);
    if (!merchant) {
      return res.status(404).json({ error: "Merchant records not found" });
    }

    if (merchant.wallet_balance < amount) {
      return res.status(400).json({ error: `Insufficient balance. Available wallet: ₹${merchant.wallet_balance.toFixed(2)}` });
    }

    const kyc = database.merchant_kyc.find(k => k.merchant_id === merchant.id && k.status === 'approved');
    if (!kyc) {
      return res.status(400).json({ error: "Payouts locked. Approved KYC & verified bank details are required." });
    }

    // Create withdrawal
    const wtId = "wth-" + crypto.randomBytes(4).toString('hex');
    const withdrawal = {
      id: wtId,
      merchant_id: merchant.id,
      amount: parseFloat(amount),
      bank_account_no: kyc.bank_account_no,
      bank_ifsc: kyc.bank_ifsc,
      bank_name: kyc.bank_name,
      status: "pending",
      requested_at: new Date().toISOString()
    };

    // Deduct from wallet instantly to escrow/hold
    merchant.wallet_balance -= parseFloat(amount);

    database.withdrawals.push(withdrawal);

    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: user.id,
      user_email: user.email,
      action: "WITHDRAWAL_REQUEST",
      ip_address: req.ip || '127.0.0.1',
      details: `Requested withdrawal payout: ₹${amount} to bank ${kyc.bank_name}`,
      created_at: new Date().toISOString()
    });

    saveDB(database);
    res.json({ message: "Withdrawal request received and is being processed (T+1 payouts schedule).", withdrawal, wallet_balance: merchant.wallet_balance });
  });

  // Ticket / Support Ticket Creation
  app.post('/api/merchant/tickets', authMiddleware, (req, res) => {
    const user = (req as any).user;
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    database = loadDB();
    const merchant = database.merchants.find(m => m.user_id === user.id);
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const ticket = {
      id: "tkt-" + crypto.randomBytes(4).toString('hex'),
      merchant_id: merchant.id,
      subject,
      message,
      status: "open",
      created_at: new Date().toISOString()
    };

    database.tickets.push(ticket);
    saveDB(database);
    res.json({ message: "Support ticket registered successfully.", ticket });
  });

  // Generate Payment Links (directly from Merchant Panel)
  app.post('/api/merchant/payment-links', authMiddleware, (req, res) => {
    const user = (req as any).user;
    const { amount, description, customer_email, customer_phone, callback_url } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment link amount" });
    }

    database = loadDB();
    const merchant = database.merchants.find(m => m.user_id === user.id);
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const orderId = "ord-" + crypto.randomBytes(5).toString('hex');
    const customId = "PLINK_" + crypto.randomBytes(3).toString('hex').toUpperCase();

    const newOrder = {
      id: orderId,
      merchant_id: merchant.id,
      order_id_custom: customId,
      amount: parseFloat(amount),
      currency: "INR",
      status: "pending",
      callback_url: callback_url || `http://localhost:${PORT}/api/webhooks/mock`,
      redirect_url: `http://localhost:${PORT}/checkout/${orderId}?type=link`,
      customer_email: customer_email || "customer@example.com",
      customer_phone: customer_phone || "+91 90000 00000",
      description: description || "Payment link order",
      created_at: new Date().toISOString()
    };

    database.orders.push(newOrder);
    saveDB(database);

    // Provide testing payment URL
    res.json({
      message: "Payment link created successfully",
      coupon_code: customId,
      payment_url: `/checkout/${orderId}`,
      order: newOrder
    });
  });


  // --------------------------------------------------------
  // 3. GATEWAY / CLIENT INTERACTIVE CHECKOUT & CORE API (No JWT Needed)
  // --------------------------------------------------------

  // Public order loader for Checkout
  app.get('/api/gateway/order/:orderId', (req, res) => {
    const { orderId } = req.params;
    database = loadDB();
    const order = database.orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Payment order session not found or expired" });
    }
    const merchant = database.merchants.find(m => m.id === order.merchant_id);
    res.json({ order, merchantBusiness: merchant ? merchant.business_name : "SmartPay360 Merchant" });
  });

  // Resolve Customer Pay action (scans UPI QR, pays Link, etc.)
  app.post('/api/gateway/pay', (req, res) => {
    const { orderId, paymentMode } = req.body;
    if (!orderId || !paymentMode) {
      return res.status(400).json({ error: "Payment order details are required" });
    }

    database = loadDB();
    const order = database.orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order details not found" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: `Payment already ${order.status}` });
    }

    const merchant = database.merchants.find(m => m.id === order.merchant_id);
    if (!merchant) {
      return res.status(404).json({ error: "Associated merchant account is missing" });
    }

    // Core billing processing
    const currentCommPct = merchant.commission_pct || database.commission_settings.rate;
    const commissionDeducted = parseFloat(((order.amount * currentCommPct) / 100).toFixed(2));
    const gstRate = database.commission_settings.gst_rate;
    const gstDeducted = parseFloat(((commissionDeducted * gstRate) / 100).toFixed(2));
    const settlementAmount = parseFloat((order.amount - commissionDeducted - gstDeducted).toFixed(2));

    // Dynamic simple Fraud scoring engine:
    // Large single payments or suspicious client locations get higher fraud score flagged, but allowed for demo representation
    let fraudWeight = 5;
    if (order.amount > 50000) fraudWeight += 35;
    if (order.customer_email.includes('temp') || order.customer_email.includes('test')) fraudWeight += 15;
    
    // Update order state
    order.status = 'success';

    // Log transaction record
    const txId = "tx-" + crypto.randomBytes(5).toString('hex');
    const uNo = "UTR" + crypto.randomBytes(6).toString('hex').toUpperCase();
    const newTx = {
      id: txId,
      order_id: order.id,
      merchant_id: merchant.id,
      utr_no: uNo,
      payment_mode: paymentMode,
      status: "success",
      amount: order.amount,
      commission_deducted,
      gst_deducted,
      settlement_amount: settlementAmount,
      tracking_ip: req.ip || "192.168.1.100",
      fraud_score: Math.min(100, fraudWeight + Math.floor(Math.random() * 15)),
      created_at: new Date().toISOString()
    };

    database.transactions.push(newTx);

    // Save commission log details
    database.commissions.push({
      id: "com-" + crypto.randomBytes(4).toString('hex'),
      transaction_id: txId,
      rate: currentCommPct,
      amount: commissionDeducted,
      gst_amount: gstDeducted,
      created_at: new Date().toISOString()
    });

    // Credit funds to Merchant Wallet balance
    merchant.wallet_balance += settlementAmount;

    // Trigger Dynamic Simulated Webhook Integration Callback
    const webhookUrl = "https://smartpay360-merchant-api.requestcatcher.com/capture"; // demo destination 
    const webhookPayload = {
      event: "payment.captured",
      gateway: "SmartPay360",
      order_id: order.id,
      custom_order_id: order.order_id_custom,
      amount: order.amount,
      currency: order.currency,
      status: "success",
      utr_no: uNo,
      timestamp: new Date().toISOString()
    };

    const webhookId = "wh-" + crypto.randomBytes(5).toString('hex');
    database.webhooks.push({
      id: webhookId,
      merchant_id: merchant.id,
      webhook_url: webhookUrl,
      status: "success", // simulated webhook success
      payload: JSON.stringify(webhookPayload),
      response_status: 200,
      response_body: "{\"status\":\"ok\",\"received\":true}",
      triggered_at: new Date().toISOString()
    });

    saveDB(database);
    res.json({
      message: "Payment authorized successfully",
      status: "success",
      transaction: newTx
    });
  });


  // --------------------------------------------------------
  // 4. ADMIN PROTECTED SYSTEM CHANNELS
  // --------------------------------------------------------
  app.get('/api/admin/dashboard', authMiddleware, (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    database = loadDB();
    
    // Admin overall stats calculations
    const merchantsCount = database.merchants.length;
    const activeMerchantsCount = database.merchants.filter(m => m.status === 'active').length;
    
    // Core ledger analytics
    const allTransactions = database.transactions;
    const totals = allTransactions.reduce((acc, t) => {
      if (t.status === 'success') {
        acc.totalVolume += t.amount;
        acc.totalCommission += t.commission_deducted;
        acc.totalGST += t.gst_deducted;
      }
      return acc;
    }, { totalVolume: 0, totalCommission: 0, totalGST: 0 });

    const totalSettledPay = database.settlements.reduce((sum, s) => sum + s.amount, 0);
    const pendingWithdrawals = database.withdrawals.filter(w => w.status === 'pending');

    res.json({
      metrics: {
        totalMerchants: merchantsCount,
        activeMerchants: activeMerchantsCount,
        totalVolume: totals.totalVolume,
        totalCommissionCollected: totals.totalCommission,
        totalGstCollected: totals.totalGST,
        totalPayoutsSettled: totalSettledPay,
        pendingWithdrawalsCount: pendingWithdrawals.length
      },
      merchants: database.merchants,
      kycRecords: database.merchant_kyc,
      allTransactions: allTransactions.slice(-25).reverse(), // Last 25 general transactions
      withdrawals: database.withdrawals.slice(-25).reverse(),
      settlements: database.settlements.slice(-25).reverse(),
      tickets: database.tickets.slice(-25).reverse(),
      logs: database.activity_logs.slice(-25).reverse(),
      configs: database.commission_settings
    });
  });

  // Admin Accept/Reject Merchant Status (Approve Merchant KYC)
  app.post('/api/admin/merchants/verify', authMiddleware, (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'admin') return res.status(403).json({ error: "Admin privilege required" });

    const { merchantId, decision, remarks, custom_rate } = req.body;
    if (!merchantId || !decision) {
      return res.status(400).json({ error: "Merchant ID and approval decision are required" });
    }

    database = loadDB();
    const merchant = database.merchants.find(m => m.id === merchantId);
    if (!merchant) return res.status(404).json({ error: "Merchant record not found" });

    const kyc = database.merchant_kyc.find(k => k.merchant_id === merchantId);

    if (decision === 'approve') {
      merchant.status = 'active';
      if (custom_rate && !isNaN(custom_rate)) {
        merchant.commission_pct = parseFloat(custom_rate);
      }
      if (kyc) {
        kyc.status = 'approved';
        kyc.remarks = remarks || "KYC approved. Merchant capabilities updated to live.";
      }
    } else {
      merchant.status = 'rejected';
      if (kyc) {
        kyc.status = 'rejected';
        kyc.remarks = remarks || "Rejected by Admin review.";
      }
    }
    merchant.updated_at = new Date().toISOString();

    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: user.id,
      user_email: user.email,
      action: "MERCHANT_KYC_ACTION",
      ip_address: req.ip || '127.0.0.1',
      details: `Set merchant ${merchant.business_name} status to ${merchant.status}`,
      created_at: new Date().toISOString()
    });

    saveDB(database);
    res.json({ message: `Successfully updated merchant verification status to ${merchant.status}`, merchant });
  });

  // Admin Handle Withdrawal payouts (Approve / Reject payouts)
  app.post('/api/admin/withdrawals/action', authMiddleware, (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'admin') return res.status(403).json({ error: "Admin privilege required" });

    const { withdrawalId, decision, remarks } = req.body;
    
    database = loadDB();
    const wth = database.withdrawals.find(w => w.id === withdrawalId);
    if (!wth) return res.status(404).json({ error: "Withdrawal request record not found" });

    if (wth.status !== 'pending') {
      return res.status(400).json({ error: "Withdrawal is already processed" });
    }

    const merchant = database.merchants.find(m => m.id === wth.merchant_id);

    if (decision === 'approve') {
      wth.status = 'approved';
      wth.remarks = remarks || "Withdrawal payout transfer completed successfully via banking terminal.";
      wth.processed_at = new Date().toISOString();
    } else {
      wth.status = 'rejected';
      wth.remarks = remarks || "Payout request cancelled by admin.";
      wth.processed_at = new Date().toISOString();
      if (merchant) {
        // Refund back to merchant wallet
        merchant.wallet_balance += wth.amount;
      }
    }

    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: user.id,
      user_email: user.email,
      action: "WITHDRAWAL_PAYOUT_ACTION",
      ip_address: req.ip || '127.0.0.1',
      details: `Processed withdrawal payout ${withdrawalId} with action ${wth.status}`,
      created_at: new Date().toISOString()
    });

    saveDB(database);
    res.json({ message: "Payout updated successfully", wth });
  });

  // Admin Update Global Commission Settings
  app.post('/api/admin/commissions/settings', authMiddleware, (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'admin') return res.status(403).json({ error: "Admin privilege required" });

    const { rate, gst_rate } = req.body;
    database = loadDB();

    database.commission_settings.rate = parseFloat(rate) || database.commission_settings.rate;
    database.commission_settings.gst_rate = parseFloat(gst_rate) || database.commission_settings.gst_rate;
    database.commission_settings.updated_at = new Date().toISOString();

    saveDB(database);
    res.json({ message: "Global standard gateway parameters saved.", config: database.commission_settings });
  });

  // Admin Ticketing Reply
  app.post('/api/admin/tickets/reply', authMiddleware, (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'admin') return res.status(403).json({ error: "Admin privilege required" });

    const { ticketId, reply } = req.body;
    database = loadDB();
    const tick = database.tickets.find(t => t.id === ticketId);
    if (!tick) return res.status(404).json({ error: "Ticket not found" });

    tick.status = "replied";
    tick.reply = reply;
    saveDB(database);

    res.json({ message: "Ticket reply sent successfully.", ticket: tick });
  });

  // Trigger Automatic Settlements loop simulation (settles all transactions into settlements table)
  app.post('/api/admin/settlements/trigger', authMiddleware, (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'admin') return res.status(403).json({ error: "Admin privilege required" });

    database = loadDB();
    
    // Collect all transactions that are NOT yet bound to any settlements records
    const allSecTx = database.transactions.filter(t => t.status === 'success');
    
    // Group them by merchant
    const merchantTxMap = new Map<string, any[]>();
    allSecTx.forEach(tx => {
      // check if this tx is already in settlements. 
      // For simulation, we can settle active transactions that don't have settlements logged.
      // We can generate a new T+1 settlement record representing all unsettled success transactions!
      const isSelled = database.settlements.some(s => s.merchant_id === tx.merchant_id && s.created_at.split('T')[0] === new Date().toISOString().split('T')[0]);
      if (!isSelled) {
        if (!merchantTxMap.has(tx.merchant_id)) {
          merchantTxMap.set(tx.merchant_id, []);
        }
        merchantTxMap.get(tx.merchant_id)!.push(tx);
      }
    });

    const newSettlements: any[] = [];
    merchantTxMap.forEach((txs, merchantId) => {
      const sumSettle = txs.reduce((sum, t) => sum + t.settlement_amount, 0);
      const newSettle = {
        id: "set-" + crypto.randomBytes(4).toString('hex'),
        merchant_id: merchantId,
        amount: parseFloat(sumSettle.toFixed(2)),
        transactions_count: txs.length,
        status: "processed",
        settlement_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };
      database.settlements.push(newSettle);
      newSettlements.push(newSettle);
    });

    database.activity_logs.push({
      id: "act-" + crypto.randomBytes(4).toString('hex'),
      user_id: user.id,
      user_email: user.email,
      action: "SETTLEMENTS_TRIGGER",
      ip_address: req.ip || '127.0.0.1',
      details: `Triggered global automated payouts. Generated ${newSettlements.length} settlement cycles.`,
      created_at: new Date().toISOString()
    });

    saveDB(database);
    res.json({ message: `Automated settlements completed. Processed ${newSettlements.length} records.`, settlements: newSettlements });
  });


  // --------------------------------------------------------
  // 5. MERCHANT MERCHANT CLIENT INTEGRATION GATEWAY API (DEVELOPER ENDPOINTS)
  // --------------------------------------------------------
  
  // Rate Limiter Mock mapping
  const rateLimitMap = new Map<string, number[]>();
  const isRateLimited = (apiKey: string): boolean => {
    const now = Date.now();
    const timestamps = rateLimitMap.get(apiKey) || [];
    // Keep only last 1 minute stamps
    const recent = timestamps.filter(t => now - t < 60000);
    if (recent.length > 50) return true; // max 50 calls per min
    recent.push(now);
    rateLimitMap.set(apiKey, recent);
    return false;
  };

  // Helper verifying ApiKey + Signature
  const verifyApiSignature = (req: express.Request, body: any): { merchant: any, error?: string } => {
    const apiKeyHeader = req.headers['x-api-key'] as string;
    const signatureHeader = req.headers['x-pay-signature'] as string;

    if (!apiKeyHeader) {
      return { merchant: null, error: "Missing required 'x-api-key' header authorization." };
    }

    database = loadDB();
    const keyRecord = database.api_keys.find(k => k.api_key === apiKeyHeader && k.is_active);
    if (!keyRecord) {
      return { merchant: null, error: "Invalid Active API Key provided." };
    }

    if (isRateLimited(apiKeyHeader)) {
      return { merchant: null, error: "Rate Limit Exceeded. Max 50 requests per minute." };
    }

    const merchant = database.merchants.find(m => m.id === keyRecord.merchant_id);
    if (!merchant) {
      return { merchant: null, error: "Merchant profile missing or suspended." };
    }

    if (merchant.status !== 'active') {
      return { merchant: null, error: "API transactions blocked because Merchant account is verification pending/rejected." };
    }

    // Verify cryptographic signature if sent
    if (signatureHeader) {
      // Standard Signature formulation string: merchant_id + amount + order_id_custom + SecretKey
      const expectedData = `${merchant.id}|${body.amount}|${body.order_id_custom}|${keyRecord.secret_key}`;
      const expectedSig = crypto.createHmac('sha256', keyRecord.secret_key)
        .update(expectedData)
        .digest('hex');

      if (expectedSig !== signatureHeader) {
        return { merchant: null, error: "API Signature verification failed. Cryptographic mismatch." };
      }
    }

    return { merchant };
  };

  // MERCHANT INTEGRATION ENDPOINT: Create Order API
  app.post('/api/v1/orders/create', (req, res) => {
    const { amount, currency, order_id_custom, callback_url, redirect_url, customer_email, customer_phone, description } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Product field 'amount' is invalid or missing." });
    }
    if (!order_id_custom) {
      return res.status(400).json({ error: "Missing parameter 'order_id_custom'." });
    }

    const authCheck = verifyApiSignature(req, req.body);
    if (authCheck.error) {
      return res.status(401).json({ error: authCheck.error });
    }

    const merchant = authCheck.merchant;
    const orderId = "ord-" + crypto.randomBytes(5).toString('hex');
    
    const newOrder = {
      id: orderId,
      merchant_id: merchant.id,
      order_id_custom,
      amount: parseFloat(amount),
      currency: currency || "INR",
      status: "pending",
      callback_url: callback_url || `https://webhook.site/smartpay360/${merchant.id}`,
      redirect_url: redirect_url || `https://smartpay360.com/dev/success`,
      customer_email: customer_email || "customer@example.com",
      customer_phone: customer_phone || "+91 91111 22222",
      description: description || "Product checkout gateway cart",
      created_at: new Date().toISOString()
    };

    database = loadDB();
    database.orders.push(newOrder);
    saveDB(database);

    res.status(201).json({
      status: "success",
      message: "Gateway order generated and awaiting payment.",
      order_details: {
        order_id: newOrder.id,
        merchant_id: merchant.id,
        custom_id: newOrder.order_id_custom,
        amount: newOrder.amount,
        currency: newOrder.currency,
        checkout_url: `/checkout/${newOrder.id}`,
        created_at: newOrder.created_at
      }
    });
  });

  // MERCHANT INTEGRATION ENDPOINT: Verify Payment API & Verify Signature API
  app.post('/api/v1/payments/verify', (req, res) => {
    const { order_id, utr_no } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: "Parameter 'order_id' is mandatory." });
    }

    const authCheck = verifyApiSignature(req, req.body);
    if (authCheck.error) {
      return res.status(401).json({ error: authCheck.error });
    }

    database = loadDB();
    const order = database.orders.find(o => o.id === order_id && o.merchant_id === authCheck.merchant.id);
    if (!order) {
      return res.status(404).json({ error: "Payment Order not found under your merchant credentials." });
    }

    const transaction = database.transactions.find(t => t.order_id === order.id);

    res.json({
      status: "success",
      payment_status: order.status,
      order_details: {
        order_id: order.id,
        custom_id: order.order_id_custom,
        amount: order.amount,
        status: order.status
      },
      transaction_details: transaction ? {
        utr_no: transaction.utr_no,
        payment_mode: transaction.payment_mode,
        fraud_score: transaction.fraud_score,
        processed_at: transaction.created_at
      } : null
    });
  });

  // MERCHANT INTEGRATION ENDPOINT: Check Status API
  app.get('/api/v1/orders/status/:customOrderId', (req, res) => {
    const { customOrderId } = req.params;
    
    // Auth checks
    const apiKeyHeader = req.headers['x-api-key'] as string;
    if (!apiKeyHeader) {
      return res.status(401).json({ error: "Missing header credentials" });
    }

    database = loadDB();
    const key = database.api_keys.find(k => k.api_key === apiKeyHeader && k.is_active);
    if (!key) return res.status(401).json({ error: "Invalid API authorization." });

    const merchant = database.merchants.find(m => m.id === key.merchant_id);
    if (!merchant) return res.status(404).json({ error: "Merchant credentials not valid" });

    const order = database.orders.find(o => o.order_id_custom === customOrderId && o.merchant_id === merchant.id);
    if (!order) {
      return res.status(404).json({ error: `Order custom_id '${customOrderId}' not found.` });
    }

    res.json({
      status: "success",
      order_id: order.id,
      custom_id: order.order_id_custom,
      amount: order.amount,
      payment_status: order.status,
      created_at: order.created_at
    });
  });


  // --------------------------------------------------------
  // SERVING STATIC ASSETS & SINGLE PAGE APPLICATION FRAMEWORK
  // --------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Single page entry fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind and serve incoming connections safely
  app.listen(PORT, HOST, () => {
    console.log(`SmartPay360 Gateway Server securely bound at http://${HOST}:${PORT}`);
  });
}

launchServer().catch(err => {
  console.error("FATAL ERROR - Developer Server failed starting:", err);
});
