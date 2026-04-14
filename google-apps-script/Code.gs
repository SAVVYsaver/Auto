const USER_SHEET_NAME = "Users";
const EARNING_SHEET_NAME = "Auto Earnings";
const DEPOSIT_SHEET_NAME = "Bank Deposits";

const USER_HEADERS = ["Role", "Name", "Username", "PAN Number", "DOB", "Password Hash", "Status", "Created At"];
const EARNING_HEADERS = ["Driver Name", "Username", "Entry Date", "Cash Earning", "Online Earning", "Total Earning", "Expense Amount", "Expense Reason", "Balance", "Created At"];
const DEPOSIT_HEADERS = ["Driver Name", "Username", "Deposit Date", "Cash Deposit", "Online Deposit", "Total Deposit", "Created At"];

function doGet(event) {
  try {
    ensureAdminUser();
    const params = event.parameter || {};
    const action = params.action || "read";

    if (action === "read") {
      const user = getUserByKey(params.userKey);
      if (!user) {
        return jsonResponse({ ok: false, message: "Login required." });
      }

      const scopeKey = user.role === "admin" ? "" : user.userKey;
      return jsonResponse({
        ok: true,
        data: {
          records: getRecords(scopeKey),
          deposits: getDeposits(scopeKey),
          wallet: getWallet(scopeKey),
        },
      });
    }

    return jsonResponse({ ok: false, message: "Unknown action." });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message });
  }
}

function doPost(event) {
  try {
    ensureAdminUser();
    const payload = JSON.parse(event.postData.contents || "{}");
    const action = ((event.parameter || {}).action) || payload.action || "create";

    if (action === "register") return registerUser(payload, false);
    if (action === "login") return loginUser(payload);
    if (action === "resetPassword") return resetPassword(payload);
    if (action === "listUsers") return listUsers(payload);
    if (action === "adminCreateUser") return registerUser(payload, true);
    if (action === "deleteUser") return deleteUser(payload);
    if (action === "deposit") return saveDeposit(payload);
    if (action === "create") return saveEntry(payload);

    return jsonResponse({ ok: false, message: "Unknown action." });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message });
  }
}

function registerUser(payload, byAdmin) {
  if (byAdmin) requireAdmin(payload.adminKey);

  const role = payload.role === "admin" ? "admin" : "user";
  const name = cleanText(payload.name);
  const userKey = cleanKey(payload.username || payload.userKey);
  const pan = cleanKey(payload.pan);
  const dob = payload.dob || "";
  const password = String(payload.password || "");

  if (!name || !userKey || !password || (role === "user" && (!dob || !pan))) {
    return jsonResponse({ ok: false, message: "Name, username, PAN, DOB and password required." });
  }

  if (getUserByKey(userKey)) {
    return jsonResponse({ ok: false, message: "This PAN / username is already registered." });
  }

  getUserSheet().appendRow([role, name, userKey, pan, dob, hashPassword(password), "active", new Date()]);
  return jsonResponse({ ok: true, message: "User registered." });
}

function loginUser(payload) {
  const userKey = cleanKey(payload.username || payload.userKey);
  const password = String(payload.password || "");
  const requestedRole = payload.role || "user";
  const user = getUserByKey(userKey);

  if (!user || user.status !== "active" || user.role !== requestedRole) {
    return jsonResponse({ ok: false, message: "Invalid login details." });
  }

  if (user.passwordHash !== hashPassword(password)) {
    return jsonResponse({ ok: false, message: "Invalid password." });
  }

  return jsonResponse({
    ok: true,
    data: {
      user: {
        role: user.role,
        name: user.name,
        userKey: user.userKey,
      },
    },
  });
}

function resetPassword(payload) {
  const userKey = cleanKey(payload.username || payload.userKey);
  const pan = cleanKey(payload.pan);
  const dob = payload.dob || "";
  const newPassword = String(payload.newPassword || "");
  const user = getUserByKey(userKey);

  if (!user || user.role !== "user" || user.pan !== pan || user.dob !== dob) {
    return jsonResponse({ ok: false, message: "Username, PAN and DOB verification failed." });
  }

  if (!newPassword) {
    return jsonResponse({ ok: false, message: "New password required." });
  }

  getUserSheet().getRange(user.rowIndex, 6).setValue(hashPassword(newPassword));
  return jsonResponse({ ok: true, message: "Password reset." });
}

function listUsers(payload) {
  requireAdmin(payload.adminKey);
  return jsonResponse({
    ok: true,
    data: {
      users: getUsers().map((user) => ({
        role: user.role,
        name: user.name,
        username: user.userKey,
        pan: user.pan,
        dob: user.dob,
        status: user.status,
        createdAt: normalizeDateTime(user.createdAt),
      })),
    },
  });
}

function deleteUser(payload) {
  requireAdmin(payload.adminKey);
  const userKey = cleanKey(payload.userKey);
  const user = getUserByKey(userKey);

  if (!user) return jsonResponse({ ok: false, message: "User not found." });
  if (user.role === "admin") return jsonResponse({ ok: false, message: "Admin cannot be deleted." });

  getUserSheet().getRange(user.rowIndex, 7).setValue("deleted");
  return jsonResponse({ ok: true, message: "User deleted." });
}

function saveEntry(payload) {
  const user = getUserByKey(payload.userKey);
  if (!user || user.status !== "active" || user.role !== "user") {
    return jsonResponse({ ok: false, message: "Valid user login required." });
  }

  const entryDate = payload.entryDate || formatDate(new Date());
  if (hasEntryForDate(user.userKey, entryDate)) {
    return jsonResponse({ ok: false, message: "Data already entered for this date." });
  }

  const cashEarning = toNumber(payload.cashEarning);
  const onlineEarning = toNumber(payload.onlineEarning);
  const expenseAmount = toNumber(payload.expenseAmount);
  const totalEarning = cashEarning + onlineEarning;
  const balance = totalEarning - expenseAmount;

  getEarningSheet().appendRow([
    user.name,
    user.userKey,
    entryDate,
    cashEarning,
    onlineEarning,
    totalEarning,
    expenseAmount,
    payload.expenseReason || "",
    balance,
    new Date(),
  ]);

  return jsonResponse({ ok: true, message: "Entry saved." });
}

function saveDeposit(payload) {
  const user = getUserByKey(payload.userKey);
  if (!user || user.status !== "active" || user.role !== "user") {
    return jsonResponse({ ok: false, message: "Valid user login required." });
  }

  const wallet = getWallet(user.userKey);
  const cashDeposit = toNumber(payload.cashDeposit);
  const onlineDeposit = toNumber(payload.onlineDeposit);
  const totalDeposit = cashDeposit + onlineDeposit;

  if (totalDeposit <= 0) return jsonResponse({ ok: false, message: "No available amount to deposit." });
  if (cashDeposit > wallet.availableCash || onlineDeposit > wallet.availableOnline) {
    return jsonResponse({ ok: false, message: "Deposit amount is higher than available amount." });
  }

  getDepositSheet().appendRow([user.name, user.userKey, formatDate(new Date()), cashDeposit, onlineDeposit, totalDeposit, new Date()]);
  return jsonResponse({ ok: true, message: "Deposit saved." });
}

function hasEntryForDate(userKey, entryDate) {
  return getRecords(userKey).some((record) => record.entryDate === entryDate);
}

function getRecords(userKey) {
  const values = getEarningSheet().getDataRange().getValues();
  return values.slice(1)
    .filter((row) => !userKey || cleanKey(row[1]) === userKey)
    .reverse()
    .map((row) => ({
      driverName: row[0],
      userKey: row[1],
      entryDate: normalizeDate(row[2]),
      cashEarning: toNumber(row[3]),
      onlineEarning: toNumber(row[4]),
      totalEarning: toNumber(row[5]),
      expenseAmount: toNumber(row[6]),
      expenseReason: row[7],
      balance: toNumber(row[8]),
      createdAt: normalizeDateTime(row[9]),
    }));
}

function getDeposits(userKey) {
  const values = getDepositSheet().getDataRange().getValues();
  return values.slice(1)
    .filter((row) => !userKey || cleanKey(row[1]) === userKey)
    .reverse()
    .map((row) => ({
      driverName: row[0],
      userKey: row[1],
      depositDate: normalizeDate(row[2]),
      cashDeposit: toNumber(row[3]),
      onlineDeposit: toNumber(row[4]),
      totalDeposit: toNumber(row[5]),
      createdAt: normalizeDateTime(row[6]),
    }));
}

function getWallet(userKey) {
  const records = getRecords(userKey);
  const deposits = getDeposits(userKey);
  const earnedCash = records.reduce((total, record) => total + toNumber(record.cashEarning), 0);
  const earnedOnline = records.reduce((total, record) => total + toNumber(record.onlineEarning), 0);
  const totalExpense = records.reduce((total, record) => total + toNumber(record.expenseAmount), 0);
  const depositedCash = deposits.reduce((total, deposit) => total + toNumber(deposit.cashDeposit), 0);
  const depositedOnline = deposits.reduce((total, deposit) => total + toNumber(deposit.onlineDeposit), 0);
  const expenseFromCash = Math.min(earnedCash, totalExpense);
  const expenseFromOnline = Math.max(totalExpense - expenseFromCash, 0);
  const availableCash = Math.max(earnedCash - expenseFromCash - depositedCash, 0);
  const availableOnline = Math.max(earnedOnline - expenseFromOnline - depositedOnline, 0);

  return {
    availableCash,
    availableOnline,
    availableTotal: availableCash + availableOnline,
    depositedCash,
    depositedOnline,
    depositedTotal: depositedCash + depositedOnline,
    totalExpense,
  };
}

function ensureAdminUser() {
  const admin = getUserByKey("RAHUL");
  if (!admin) {
    getUserSheet().appendRow(["admin", "Rahul", "RAHUL", "", "", hashPassword("1912"), "active", new Date()]);
  }
}

function requireAdmin(adminKey) {
  const admin = getUserByKey(adminKey);
  if (!admin || admin.role !== "admin" || admin.status !== "active") {
    throw new Error("Admin access required.");
  }
}

function getUserByKey(userKey) {
  return getUsers().find((user) => user.userKey === cleanKey(userKey));
}

function getUsers() {
  const values = getUserSheet().getDataRange().getValues();
  return values.slice(1).map((row, index) => ({
    rowIndex: index + 2,
    role: row[0],
    name: row[1],
    userKey: cleanKey(row[2]),
    pan: cleanKey(row[3]),
    dob: normalizeDate(row[4]),
    passwordHash: row[5],
    status: row[6],
    createdAt: row[7],
  }));
}

function getUserSheet() {
  return getSheetWithHeaders(USER_SHEET_NAME, USER_HEADERS);
}

function getEarningSheet() {
  return getSheetWithHeaders(EARNING_SHEET_NAME, EARNING_HEADERS);
}

function getDepositSheet() {
  return getSheetWithHeaders(DEPOSIT_SHEET_NAME, DEPOSIT_HEADERS);
}

function getSheetWithHeaders(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0];
  const isMissingHeaders = headers.some((header, index) => currentHeaders[index] !== header);
  if (isMissingHeaders) {
    headerRange.setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password), Utilities.Charset.UTF_8);
  return digest.map((byte) => {
    const value = byte < 0 ? byte + 256 : byte;
    return (`0${value.toString(16)}`).slice(-2);
  }).join("");
}

function cleanKey(value) {
  return String(value || "").trim().toUpperCase();
}

function cleanText(value) {
  return String(value || "").trim();
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isNaN(number) ? 0 : number;
}

function normalizeDate(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") return formatDate(value);
  return String(value);
}

function normalizeDateTime(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }
  return String(value);
}

function formatDate(value) {
  return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
