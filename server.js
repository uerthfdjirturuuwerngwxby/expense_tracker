import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import multer from "multer";
import Groq from "groq-sdk";
import { createRequire } from "module";
import FormData from "form-data";
import fetch from "node-fetch";

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const app = express();

const REQUIRED_ENV = [
  "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY",
  "JWT_SECRET", "CLIENT_ORIGIN", "SERVER_ORIGIN",
  "GROQ_API_KEY", "OCR_SPACE_API_KEY",
];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) { console.error("Missing env var: " + key); process.exit(1); }
}

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const JWT_SECRET    = process.env.JWT_SECRET;
const JWT_EXPIRES   = "7d";
const groq          = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
const upload = multer({ storage: multer.memoryStorage() });

const COOKIE_NAME    = "auth_token";
const COOKIE_VISIBLE = "auth_token_info";
const COOKIE_BASE = { secure:false, sameSite:process.env.NODE_ENV==="production"?"strict":"lax", maxAge:7*24*60*60*1000, path:"/" };
const sendAuthCookie = (res,token) => { res.cookie(COOKIE_NAME,token,{...COOKIE_BASE,httpOnly:true}); res.cookie(COOKIE_VISIBLE,token,{...COOKIE_BASE,httpOnly:false}); };
const clearAuthCookie = (res) => { res.clearCookie(COOKIE_NAME,{path:"/"}); res.clearCookie(COOKIE_VISIBLE,{path:"/"}); };
const signToken = (p) => jwt.sign(p, JWT_SECRET, { expiresIn:JWT_EXPIRES });
const verifyToken = (t) => { try { return jwt.verify(t,JWT_SECRET); } catch { return null; } };

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message:"Not authenticated" });
  const decoded = verifyToken(token);
  if (!decoded) { clearAuthCookie(res); return res.status(401).json({ message:"Session expired." }); }
  req.user = decoded; next();
}

async function upsertProfile({ id,email,first_name,last_name,full_name,avatar_url,provider,password_hash }) {
  const { data, error } = await supabaseAdmin.from("profiles")
    .upsert({ id,email,first_name:first_name||null,last_name:last_name||null,full_name:full_name||null,
      avatar_url:avatar_url||null,provider,password_hash:password_hash||null,updated_at:new Date().toISOString() },
    { onConflict:"id", ignoreDuplicates:false }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// Maps DB row to frontend object (expense_date → date, snake_case → camelCase)
function dbToExpense(row) {
  return {
    id:              row.id,
    title:           row.title,
    amount:          Number(row.amount),
    category:        row.category,
    type:            row.type,
    date:            row.expense_date,
    receiptGroupId:  row.receipt_group_id  || null,
    receiptMerchant: row.receipt_merchant  || null,
    isTax:           row.is_tax            || false,
    created_at:      row.created_at,
  };
}

const MODEL_KEYS = [
  "Food_Dining","Transportation","Entertainment","Shopping","Utilities",
  "Housing","Healthcare","Education","Travel","Personal_Care","Other"
];
const UI_TO_MODEL = {
  "Food & Dining":"Food_Dining",
  "Transportation":"Transportation",
  "Entertainment":"Entertainment",
  "Shopping":"Shopping",
  "Utilities":"Utilities",
  "Housing":"Housing",
  "Healthcare":"Healthcare",
  "Education":"Education",
  "Travel":"Travel",
  "Personal Care":"Personal_Care",
  "Other":"Other",
};
const HIGH_INCOME_AREAS = new Set(["Banjara Hills","Jubilee Hills","Hitech City","Madhapur","Gachibowli","Kondapur"]);
const MID_INCOME_AREAS = new Set(["Manikonda","Begumpet","Somajiguda","Khairatabad","Nallagandla","Kompally"]);
const analyticsCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function areaGroup(area) {
  if (HIGH_INCOME_AREAS.has(area)) return "high";
  if (MID_INCOME_AREAS.has(area)) return "mid";
  return "other";
}

function sanitizeNum(v) {
  const n = Number(v) || 0;
  return n > 0 && n < 1 ? Math.round(n * 1000 * 100) / 100 : n;
}

function monthKeyFromDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string" || dateStr.length < 7) return null;
  return dateStr.slice(0, 7);
}

async function getUserArea(userId) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("area,location")
    .eq("id", userId)
    .maybeSingle();
  return data?.area || data?.location || "Madhapur";
}

function buildMonthlyExpenseRows(expenses, area) {
  const monthlyMap = new Map();
  for (const row of expenses || []) {
    const month = monthKeyFromDate(row.expense_date);
    if (!month) continue;
    if (!monthlyMap.has(month)) {
      const init = { area, month, Income: 0, Total_Expense: 0 };
      for (const k of MODEL_KEYS) init[k] = 0;
      monthlyMap.set(month, init);
    }
    const bucket = monthlyMap.get(month);
    const amount = sanitizeNum(row.amount);
    const isIncome = row.type === "income" || row.category === "Income";
    if (isIncome) {
      bucket.Income += amount;
      continue;
    }
    const modelKey = UI_TO_MODEL[row.category] || "Other";
    bucket[modelKey] += amount;
    bucket.Total_Expense += amount;
  }
  return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function groupBaseWeights(group) {
  if (group === "high") return { Food_Dining: 0.16, Transportation: 0.07, Entertainment: 0.08, Shopping: 0.11, Utilities: 0.06, Housing: 0.33, Healthcare: 0.04, Education: 0.05, Travel: 0.06, Personal_Care: 0.03, Other: 0.01 };
  if (group === "mid") return { Food_Dining: 0.17, Transportation: 0.08, Entertainment: 0.07, Shopping: 0.10, Utilities: 0.07, Housing: 0.30, Healthcare: 0.04, Education: 0.06, Travel: 0.05, Personal_Care: 0.04, Other: 0.02 };
  return { Food_Dining: 0.18, Transportation: 0.09, Entertainment: 0.06, Shopping: 0.09, Utilities: 0.08, Housing: 0.29, Healthcare: 0.05, Education: 0.06, Travel: 0.04, Personal_Care: 0.04, Other: 0.02 };
}

function buildRecommendedSpending(area, latestRow) {
  const group = areaGroup(area);
  const weights = groupBaseWeights(group);
  const income = sanitizeNum(latestRow?.Income);
  const actualTotal = sanitizeNum(latestRow?.Total_Expense);
  const targetTotal = income > 0 ? Math.min(actualTotal || income * 0.75, income * 0.78) : actualTotal || 0;
  const rec = {};
  for (const k of MODEL_KEYS) rec[k] = Math.round(targetTotal * (weights[k] || 0));
  return rec;
}

function buildForecast(monthlyRows) {
  const lastSix = monthlyRows.slice(-6);
  const totals = lastSix.map(r => sanitizeNum(r.Total_Expense));
  const latestTotal = totals[totals.length - 1] || 0;
  const avgGrowth = totals.length >= 2
    ? totals.slice(1).reduce((acc, v, i) => {
        const prev = totals[i] || 1;
        return acc + ((v - prev) / prev);
      }, 0) / (totals.length - 1)
    : 0;
  const boundedGrowth = Math.max(-0.08, Math.min(0.12, avgGrowth || 0.02));
  const lastMonth = monthlyRows[monthlyRows.length - 1]?.month || new Date().toISOString().slice(0, 7);
  const [y, m] = lastMonth.split("-").map(Number);
  const result = [];
  let rolling = latestTotal;
  for (let i = 1; i <= 3; i++) {
    const date = new Date(y, (m - 1) + i, 1);
    rolling = Math.max(0, rolling * (1 + boundedGrowth + (i * 0.007)));
    result.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      expense: Math.round(rolling),
    });
  }
  return result;
}

function buildAdvice(latestRow, recommended) {
  const advice = [];
  for (const k of MODEL_KEYS) {
    const actual = sanitizeNum(latestRow?.[k]);
    const rec = sanitizeNum(recommended?.[k]);
    if (!rec) continue;
    const ratio = actual / rec;
    if (ratio > 1.15) {
      const pct = Math.max(5, Math.min(25, Math.round((ratio - 1) * 100)));
      advice.push(`Reduce ${k.replace("_", " ")} by ${pct}% to improve savings.`);
    } else if (ratio >= 0.9 && ratio <= 1.1) {
      advice.push(`${k.replace("_", " ")} spending is within optimal range.`);
    }
  }
  if (advice.length === 0) advice.push("Spending is balanced. Keep tracking your categories weekly.");
  return advice.slice(0, 5);
}

function buildLineChart(monthlyRows, forecast) {
  const actual = monthlyRows.slice(-6).map(r => ({ month: r.month, expense: Math.round(sanitizeNum(r.Total_Expense)), type: "actual" }));
  const pred = (forecast || []).map(f => ({ month: f.month, expense: Math.round(sanitizeNum(f.expense)), type: "predicted" }));
  return [...actual, ...pred];
}

function getCached(key) {
  const hit = analyticsCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) { analyticsCache.delete(key); return null; }
  return hit.value;
}

function setCached(key, value) {
  analyticsCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ══════════════════════════════════════════════════════════════════════════
//  EXPENSE CRUD ROUTES
// ══════════════════════════════════════════════════════════════════════════

// GET all expenses for logged-in user
app.get("/api/expenses", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("expenses").select("*")
      .eq("user_id", req.user.id)
      .order("expense_date", { ascending:false })
      .order("created_at",   { ascending:false });
    if (error) return res.status(500).json({ message:error.message });
    return res.json({ expenses:(data||[]).map(dbToExpense) });
  } catch (err) { console.error("GET /expenses:", err); return res.status(500).json({ message:"Failed to fetch." }); }
});

// POST create single expense
app.post("/api/expenses", requireAuth, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || amount == null) return res.status(400).json({ message:"title and amount required." });
    const cat = category || "Other";
    const { data, error } = await supabaseAdmin.from("expenses").insert({
      user_id:req.user.id, title, amount:Number(amount), category:cat,
      type:cat==="Income"?"income":"expense",
      expense_date:date||new Date().toISOString().split("T")[0],
    }).select().single();
    if (error) return res.status(500).json({ message:error.message });
    console.log("✅ Created:", data.id, title);
    return res.status(201).json({ expense:dbToExpense(data) });
  } catch (err) { console.error("POST /expenses:", err); return res.status(500).json({ message:"Failed to create." }); }
});

// PUT update expense
app.put("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const cat = category || "Other";
    const { data, error } = await supabaseAdmin.from("expenses").update({
      title, amount:Number(amount), category:cat,
      type:cat==="Income"?"income":"expense",
      expense_date:date||new Date().toISOString().split("T")[0],
    }).eq("id", req.params.id).eq("user_id", req.user.id).select().single();
    if (error) return res.status(500).json({ message:error.message });
    if (!data)  return res.status(404).json({ message:"Expense not found." });
    console.log("✅ Updated:", req.params.id);
    return res.json({ expense:dbToExpense(data) });
  } catch (err) { console.error("PUT /expenses/:id:", err); return res.status(500).json({ message:"Failed to update." }); }
});

// DELETE entire receipt group — must be defined BEFORE /:id
app.delete("/api/expenses/group/:groupId", requireAuth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("expenses")
      .delete().eq("receipt_group_id", req.params.groupId).eq("user_id", req.user.id);
    if (error) return res.status(500).json({ message:error.message });
    console.log("🗑️  Deleted group:", req.params.groupId);
    return res.json({ deletedGroup:req.params.groupId });
  } catch (err) { console.error("DELETE /expenses/group:", err); return res.status(500).json({ message:"Failed to delete group." }); }
});

// DELETE single expense
app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("expenses")
      .delete().eq("id", req.params.id).eq("user_id", req.user.id);
    if (error) return res.status(500).json({ message:error.message });
    console.log("🗑️  Deleted:", req.params.id);
    return res.json({ deleted:req.params.id });
  } catch (err) { console.error("DELETE /expenses/:id:", err); return res.status(500).json({ message:"Failed to delete." }); }
});

// POST bulk save receipt items
app.post("/api/expenses/bulk", requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)||items.length===0) return res.status(400).json({ message:"No items provided." });
    const rows = items.map(item => {
      const cat = item.category || "Other";
      return { user_id:req.user.id, title:item.title||"Expense", amount:Number(item.amount)||0, category:cat,
        type:cat==="Income"?"income":"expense", expense_date:item.date||new Date().toISOString().split("T")[0],
        receipt_group_id:item.receiptGroupId||null, receipt_merchant:item.receiptMerchant||null, is_tax:item.isTax||false };
    });
    const { data, error } = await supabaseAdmin.from("expenses").insert(rows).select();
    if (error) return res.status(500).json({ message:error.message });
    console.log("✅ Bulk saved:", data.length, "expenses");
    return res.json({ saved:data.map(dbToExpense) });
  } catch (err) { console.error("POST /expenses/bulk:", err); return res.status(500).json({ message:"Failed to bulk save." }); }
});

// ══════════════════════════════════════════════════════════════════════════
//  RECEIPT ANALYSIS  (OCR.space → Groq LLaMA 3.3)
// ══════════════════════════════════════════════════════════════════════════

async function compressImageUnder1MB(buffer, mimeType) {
  let sharp;
  try { sharp = (await import("sharp")).default; }
  catch { throw new Error("sharp not installed. Run: npm install sharp"); }
  const MAX = 900 * 1024;
  if (buffer.byteLength <= MAX) return { buffer, mimeType };
  let img = sharp(buffer).rotate();
  const meta = await img.metadata();
  if (meta.width > 2000) img = img.resize({ width:2000, withoutEnlargement:true });
  for (const q of [80, 65, 50, 35, 20]) {
    const out = await img.jpeg({ quality:q, mozjpeg:true }).toBuffer();
    if (out.byteLength <= MAX) { console.log("✅ Compressed:", (out.byteLength/1024).toFixed(0),"KB q:",q+"%"); return { buffer:out, mimeType:"image/jpeg" }; }
  }
  const last = await sharp(buffer).rotate().resize({ width:1200, withoutEnlargement:true }).jpeg({ quality:15, mozjpeg:true }).toBuffer();
  if (last.byteLength > MAX) throw new Error("Image too large to compress under 1 MB.");
  return { buffer:last, mimeType:"image/jpeg" };
}

async function extractTextViaOCR(fileBuffer, mimeType, fileName) {
  const { buffer, mimeType:finalMime } = await compressImageUnder1MB(fileBuffer, mimeType);
  const form = new FormData();
  form.append("file", buffer, { filename:fileName?.replace(/\.[^.]+$/,".jpg")||"receipt.jpg", contentType:finalMime });
  form.append("apikey", process.env.OCR_SPACE_API_KEY);
  form.append("language","eng"); form.append("isOverlayRequired","false");
  form.append("detectOrientation","true"); form.append("scale","true"); form.append("OCREngine","2");
  const res = await fetch("https://api.ocr.space/parse/image", { method:"POST", headers:form.getHeaders(), body:form });
  if (!res.ok) throw new Error("OCR.space HTTP "+res.status+": "+await res.text());
  const json = await res.json();
  if (json.IsErroredOnProcessing) throw new Error("OCR.space: "+(json.ErrorMessage?.[0]||"processing error"));
  const text = json.ParsedResults?.map(r=>r.ParsedText||"").join("\n").trim();
  if (!text) throw new Error("OCR returned empty text — try a clearer photo");
  console.log("📄 OCR text:\n", text.slice(0,400));
  return text;
}

async function parseReceiptWithGroq(ocrText) {
  const today = new Date().toISOString().split("T")[0];
  const prompt = `You are an expert receipt parser. Extract every line item from the OCR text below.

OCR Text:
"""
${ocrText}
"""

Return ONLY valid JSON (no markdown, no explanation):
{
  "merchant": "store name, max 3 words",
  "date": "YYYY-MM-DD (use ${today} if not found)",
  "total": "grand total as plain number string",
  "items": [
    { "name": "item description max 5 words", "amount": "price as plain number string", "category": "one of: Food & Dining, Transportation, Entertainment, Shopping, Utilities, Housing, Healthcare, Education, Travel, Personal Care, Income, Savings, Other" }
  ]
}`;

  const completion = await groq.chat.completions.create({
    model:"llama-3.3-70b-versatile", messages:[{ role:"user", content:prompt }],
    temperature:0, max_tokens:1200,
  });
  const raw   = completion.choices[0].message.content?.trim() || "";
  const clean = raw.replace(/```json|```/gi,"").trim();
  let parsed;
  try { parsed = JSON.parse(clean); }
  catch { const m=clean.match(/\{[\s\S]*\}/); if(!m) throw new Error("Invalid JSON from Groq"); parsed=JSON.parse(m[0]); }
  const san = (v) => { const n=parseFloat(String(v||"0").replace(/[^\d.]/g,""))||0; return (n>0&&n<1)?Math.round(n*1000*100)/100:n; };
  parsed.total = String(san(parsed.total));
  parsed.items = (parsed.items||[]).map(item=>({ ...item, amount:String(san(item.amount)) }));
  console.log("🤖 Groq:", parsed.merchant, "Total:", parsed.total, "Items:", parsed.items.length);
  return parsed;
}

// GET monthly export (default latest month, pass ?months=6 for history)
app.get("/api/export-expenses", requireAuth, async (req, res) => {
  try {
    const months = Math.max(1, Math.min(24, Number(req.query.months || 1)));
    const area = await getUserArea(req.user.id);

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select("amount,category,type,expense_date")
      .eq("user_id", req.user.id)
      .order("expense_date", { ascending: true });
    if (error) return res.status(500).json({ message: error.message });

    const monthlyRows = buildMonthlyExpenseRows(data || [], area);
    const sliced = monthlyRows.slice(-months);

    if (!sliced.length) {
      const empty = { area, month: new Date().toISOString().slice(0, 7), Income: 0, Total_Expense: 0 };
      for (const k of MODEL_KEYS) empty[k] = 0;
      return res.json(empty);
    }

    if (months === 1) return res.json(sliced[sliced.length - 1]);
    return res.json({ area, monthly_data: sliced });
  } catch (err) {
    console.error("GET /api/export-expenses:", err);
    return res.status(500).json({ message: "Failed to export expenses." });
  }
});

// GET analytics prediction with 24h cache
app.get("/api/analytics/prediction", requireAuth, async (req, res) => {
  try {
    const area = (req.query.area || await getUserArea(req.user.id) || "Madhapur").toString();

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select("amount,category,type,expense_date")
      .eq("user_id", req.user.id)
      .order("expense_date", { ascending: true });
    if (error) return res.status(500).json({ message: error.message });

    const monthlyRows = buildMonthlyExpenseRows(data || [], area);
    if (!monthlyRows.length) return res.status(400).json({ message: "Not enough data for prediction." });

    const latestMonth = monthlyRows[monthlyRows.length - 1]?.month || "na";
    const cacheKey = `${req.user.id}:${area}:${latestMonth}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const forecast = buildForecast(monthlyRows);
    const latest = monthlyRows[monthlyRows.length - 1];
    const recommended = buildRecommendedSpending(area, latest);
    const advice = buildAdvice(latest, recommended);

    const pie = MODEL_KEYS.map(k => ({ category: k, value: Math.round(sanitizeNum(latest[k])) })).filter(x => x.value > 0);
    const areaAverage = Math.round((Object.values(recommended).reduce((s, v) => s + sanitizeNum(v), 0) || 0));

    const payload = {
      area,
      forecast,
      advice,
      recommended_spending: recommended,
      charts: {
        line: buildLineChart(monthlyRows, forecast),
        pie,
        bar: [{ area, area_average: areaAverage, expense: areaAverage }],
      },
    };

    setCached(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    console.error("GET /api/analytics/prediction:", err);
    return res.status(500).json({ message: "Prediction failed." });
  }
});
app.post("/api/analyze-receipt", requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message:"No file uploaded." });
    const { mimetype, buffer, originalname } = req.file;
    let ocrText = "";
    if (mimetype==="application/pdf") {
      const pdfData = await pdfParse(buffer);
      ocrText = pdfData.text?.trim() || "";
      if (!ocrText) return res.status(422).json({ message:"Could not read PDF. Try a photo instead." });
    } else if (mimetype.startsWith("image/")) {
      try { ocrText = await extractTextViaOCR(buffer, mimetype, originalname); }
      catch (e) { return res.status(422).json({ message:e.message }); }
    } else {
      return res.status(400).json({ message:"Unsupported file type. Upload JPG, PNG, or PDF." });
    }
    let parsed;
    try { parsed = await parseReceiptWithGroq(ocrText); }
    catch (e) { return res.status(500).json({ message:"AI parsing failed: "+e.message }); }
    return res.json({ merchant:parsed.merchant||"Receipt", date:parsed.date||new Date().toISOString().split("T")[0], total:parsed.total||"0", items:parsed.items||[] });
  } catch (err) { console.error("❌ analyze-receipt:", err); return res.status(500).json({ message:"Receipt analysis failed." }); }
});

// ══════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ══════════════════════════════════════════════════════════════════════════

app.post("/api/auth/google-session", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ message:"access_token required." });
  const { data, error } = await supabaseAnon.auth.getUser(access_token);
  if (error||!data?.user) return res.status(401).json({ message:"Invalid Google session." });
  const u=data.user, full_name=u.user_metadata?.full_name||u.user_metadata?.name||"";
  const avatar_url=u.user_metadata?.avatar_url||u.user_metadata?.picture||"";
  const parts=full_name.split(" ");
  const { data:existing } = await supabaseAdmin.from("profiles").select("id,provider").eq("email",u.email).maybeSingle();
  if (existing?.provider==="email") return res.status(409).json({ message:"Email registered with password. Log in with email." });
  const profile = await upsertProfile({ id:u.id, email:u.email, first_name:parts[0]||"", last_name:parts.slice(1).join(" ")||"", full_name, avatar_url, provider:"google", password_hash:null });
  const token = signToken({ id:profile.id, email:profile.email, name:profile.full_name, provider:"google" });
  sendAuthCookie(res, token);
  return res.json({ message:"Google login successful.", user:{ id:profile.id, email:profile.email, full_name:profile.full_name, avatar_url:profile.avatar_url, provider:profile.provider } });
});

app.post("/api/signup", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!email||!password||!first_name) return res.status(400).json({ message:"first_name, email and password required." });
  const { data:existing } = await supabaseAdmin.from("profiles").select("id,provider").eq("email",email).maybeSingle();
  if (existing) return res.status(409).json({ message:existing.provider==="google"?"Linked to Google. Sign in with Google.":"Email already registered." });
  const { data:authData, error:authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm:true, user_metadata:{ first_name, last_name, full_name:`${first_name} ${last_name}`.trim() } });
  if (authError) return res.status(400).json({ message:authError.message });
  const password_hash = await bcrypt.hash(password, 12);
  const profile = await upsertProfile({ id:authData.user.id, email, first_name, last_name, full_name:`${first_name} ${last_name}`.trim(), avatar_url:null, provider:"email", password_hash });
  const token = signToken({ id:profile.id, email:profile.email, name:profile.full_name, provider:"email" });
  sendAuthCookie(res, token);
  return res.status(201).json({ message:"Account created.", user:{ id:profile.id, email:profile.email, full_name:profile.full_name, avatar_url:null, provider:"email" } });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email||!password) return res.status(400).json({ message:"Email and password required." });
  const { data:profile } = await supabaseAdmin.from("profiles").select("*").eq("email",email).maybeSingle();
  if (!profile) return res.status(401).json({ message:"Invalid email or password." });
  if (profile.provider==="google") return res.status(400).json({ message:"This account uses Google Sign-In." });
  const { error:signInError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (signInError) return res.status(401).json({ message:"Invalid email or password." });
  const token = signToken({ id:profile.id, email:profile.email, name:profile.full_name, provider:"email" });
  sendAuthCookie(res, token);
  return res.json({ message:"Login successful.", user:{ id:profile.id, email:profile.email, full_name:profile.full_name, avatar_url:profile.avatar_url, provider:profile.provider } });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const { data:profile, error } = await supabaseAdmin.from("profiles").select("id,email,full_name,avatar_url,provider,first_name,last_name").eq("id",req.user.id).single();
  if (error||!profile) { clearAuthCookie(res); return res.status(401).json({ message:"User not found." }); }
  return res.json({ user:profile });
});

// PUT /api/profile — update first_name, last_name, full_name
app.put("/api/profile", requireAuth, async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    if (!first_name && !last_name) return res.status(400).json({ message:"first_name or last_name required." });
    const full_name = [first_name, last_name].filter(Boolean).join(" ").trim();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ first_name: first_name||null, last_name: last_name||null, full_name })
      .eq("id", req.user.id)
      .select("id,email,full_name,avatar_url,provider,first_name,last_name")
      .single();
    if (error) return res.status(500).json({ message: error.message });
    if (!data)  return res.status(404).json({ message:"Profile not found." });
    console.log("✅ Profile updated:", req.user.id, "→", full_name);
    return res.json({ user: data });
  } catch (err) {
    console.error("PUT /api/profile:", err);
    return res.status(500).json({ message:"Failed to update profile." });
  }
});

app.post("/api/logout", (req,res) => { clearAuthCookie(res); return res.json({ message:"Logged out." }); });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("\n✅  ExpenseAI Server → http://localhost:"+PORT);
  console.log("    CLIENT_ORIGIN : "+process.env.CLIENT_ORIGIN);
  console.log("    SUPABASE_URL  : "+process.env.SUPABASE_URL);
  console.log("    Routes        : GET/POST/PUT/DELETE /api/expenses\n");
});

export default app;

