/*************************************************************
 * DEALSKART AUTO DIARY - GOOGLE APPS SCRIPT BACKEND
 * -----------------------------------------------------------
 * Deploy this as a Web App (Execute as: Me, Access: Anyone).
 * The Web App URL becomes your API endpoint used by the
 * frontend (see js/config.js).
 *
 * SPREADSHEET SETUP
 * Create ONE Google Sheet with these 4 tabs (exact names):
 *   1. Users
 *   2. AutoEarnings
 *   3. BankDeposits
 *   4. ChatMessages
 *
 * Run the `setupSheets` function once (from the Apps Script
 * editor, select it in the dropdown and click Run) to auto
 * create headers and the default admin account.
 *************************************************************/

// ---- CONFIGURATION ---------------------------------------------------
var ADMIN_USERNAME = 'RAHUL';
var ADMIN_PASSWORD = '1912'; // only used by setupSheets() to seed the admin row
var MISSED_DATE_WINDOW_DAYS = 60; // how far back to look for missed entries
var AUTO_LOGOUT_MINUTES = 2; // informational only (enforced on frontend)

var SHEET_USERS = 'Users';
var SHEET_EARNINGS = 'AutoEarnings';
var SHEET_DEPOSITS = 'BankDeposits';
var SHEET_CHAT = 'ChatMessages';

var USERS_HEADERS = ['Role','Name','Username','PAN Number','DOB','Password Hash','Status','Created At','Photo Data','Phone','Address','Admin Notes','Approved At'];
var EARNINGS_HEADERS = ['Driver Name','Username','Entry Date','Cash Earning','Online Earning','Total Earning','Expense Amount','Expense Reason','Balance','Created At'];
var DEPOSITS_HEADERS = ['Driver Name','Username','Deposit Date','Cash Deposit','Online Deposit','Total Deposit','Created At'];
var CHAT_HEADERS = ['Thread Id','Sender Username','Sender Name','Sender Role','Recipient Username','Recipient Name','Message','Created At'];

// ---- ENTRY POINTS ------------------------------------------------------

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var result;
  try {
    var params = {};
    if (e.postData && e.postData.contents) {
      try { params = JSON.parse(e.postData.contents); } catch (err) { params = e.parameter || {}; }
    } else {
      params = e.parameter || {};
    }
    var action = params.action;
    switch (action) {
      case 'login': result = actionLogin(params); break;
      case 'register': result = actionRegister(params); break;
      case 'approveUser': result = actionApproveUser(params); break;
      case 'rejectUser': result = actionRejectUser(params); break;
      case 'resetPassword': result = actionResetPassword(params); break;
      case 'listUsers': result = actionListUsers(params); break;
      case 'updateProfile': result = actionUpdateProfile(params); break;
      case 'addEntry': result = actionAddEntry(params); break;
      case 'getMissedDates': result = actionGetMissedDates(params); break;
      case 'addDeposit': result = actionAddDeposit(params); break;
      case 'getDashboard': result = actionGetDashboard(params); break;
      case 'getAdminStats': result = actionGetAdminStats(params); break;
      case 'getChatMessages': result = actionGetChatMessages(params); break;
      case 'sendChatMessage': result = actionSendChatMessage(params); break;
      case 'deleteUser': result = actionDeleteUser(params); break;
      default: result = { success: false, message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, message: 'Server error: ' + err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- SETUP --------------------------------------------------------------

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET_USERS, USERS_HEADERS);
  ensureSheet(ss, SHEET_EARNINGS, EARNINGS_HEADERS);
  ensureSheet(ss, SHEET_DEPOSITS, DEPOSITS_HEADERS);
  ensureSheet(ss, SHEET_CHAT, CHAT_HEADERS);

  // seed default admin if not present
  var usersSheet = ss.getSheetByName(SHEET_USERS);
  var data = usersSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === ADMIN_USERNAME.toLowerCase()) { found = true; break; }
  }
  if (!found) {
    usersSheet.appendRow([
      'admin', 'Rahul Kumar', ADMIN_USERNAME, '', '', hashPassword(ADMIN_PASSWORD),
      'approved', new Date().toISOString(), '', '', '', 'Default admin account', new Date().toISOString()
    ]);
  }
  Logger.log('Setup complete.');
}

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needsHeader = firstRow.join('') === '';
  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ---- HELPERS --------------------------------------------------------------

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name + '. Run setupSheets() first.');
  return sheet;
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    obj.__row = i + 1; // 1-indexed sheet row number
    rows.push(obj);
  }
  return rows;
}

function hashPassword(password) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return digest.map(function (byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function findUserByUsername(username) {
  var users = sheetToObjects(getSheet(SHEET_USERS));
  for (var i = 0; i < users.length; i++) {
    if (String(users[i]['Username']).toLowerCase() === String(username).toLowerCase()) {
      return users[i];
    }
  }
  return null;
}

function toDateOnly(d) {
  var date = (d instanceof Date) ? d : new Date(d);
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'Etc/UTC', 'yyyy-MM-dd');
}

function sanitizeUser(user) {
  // never send password hash back to frontend
  var copy = {};
  for (var k in user) {
    if (k === 'Password Hash' || k === '__row') continue;
    copy[k] = user[k];
  }
  return copy;
}

// ---- AUTH ACTIONS -----------------------------------------------------

function actionLogin(p) {
  var username = (p.username || '').trim();
  var password = p.password || '';
  if (!username || !password) return { success: false, message: 'Username and password are required.' };

  var user = findUserByUsername(username);
  if (!user) return { success: false, message: 'Account not found.' };

  var hash = hashPassword(password);
  if (String(user['Password Hash']) !== hash) {
    return { success: false, message: 'Incorrect password.' };
  }
  if (String(user['Status']).toLowerCase() === 'pending') {
    return { success: false, message: 'Your account is pending admin approval.' };
  }
  if (String(user['Status']).toLowerCase() === 'rejected') {
    return { success: false, message: 'Your registration was rejected. Contact admin.' };
  }
  return { success: true, user: sanitizeUser(user) };
}

function actionRegister(p) {
  var required = ['name', 'username', 'pan', 'dob', 'phone', 'address', 'password'];
  for (var i = 0; i < required.length; i++) {
    if (!p[required[i]]) return { success: false, message: 'Missing field: ' + required[i] };
  }
  var existing = findUserByUsername(p.username);
  if (existing) return { success: false, message: 'Username already taken.' };

  var sheet = getSheet(SHEET_USERS);
  sheet.appendRow([
    'driver', p.name, p.username, p.pan, p.dob, hashPassword(p.password),
    'pending', new Date().toISOString(), '', p.phone, p.address, '', ''
  ]);
  return { success: true, message: 'Registration submitted. Await admin approval.' };
}

function actionResetPassword(p) {
  var user = findUserByUsername(p.username || '');
  if (!user) return { success: false, message: 'Account not found.' };
  if (String(user['PAN Number']).toLowerCase() !== String(p.pan || '').toLowerCase()) {
    return { success: false, message: 'PAN number does not match.' };
  }
  var inputDob = toDateOnly(p.dob);
  var storedDob = user['DOB'] ? toDateOnly(user['DOB']) : '';
  if (storedDob !== inputDob) {
    return { success: false, message: 'Date of birth does not match.' };
  }
  if (!p.newPassword || p.newPassword.length < 4) {
    return { success: false, message: 'New password must be at least 4 characters.' };
  }
  var sheet = getSheet(SHEET_USERS);
  var col = USERS_HEADERS.indexOf('Password Hash') + 1;
  sheet.getRange(user.__row, col).setValue(hashPassword(p.newPassword));
  return { success: true, message: 'Password reset successfully.' };
}

// ---- ADMIN: USER MANAGEMENT --------------------------------------------

function actionListUsers(p) {
  var users = sheetToObjects(getSheet(SHEET_USERS)).map(sanitizeUser);
  return { success: true, users: users };
}

function actionApproveUser(p) {
  var sheet = getSheet(SHEET_USERS);
  var user = findUserByUsername(p.username || '');
  if (!user) return { success: false, message: 'User not found.' };
  sheet.getRange(user.__row, USERS_HEADERS.indexOf('Status') + 1).setValue('approved');
  sheet.getRange(user.__row, USERS_HEADERS.indexOf('Approved At') + 1).setValue(new Date().toISOString());
  return { success: true, message: 'User approved.' };
}

function actionRejectUser(p) {
  var sheet = getSheet(SHEET_USERS);
  var user = findUserByUsername(p.username || '');
  if (!user) return { success: false, message: 'User not found.' };
  sheet.getRange(user.__row, USERS_HEADERS.indexOf('Status') + 1).setValue('rejected');
  if (p.note) sheet.getRange(user.__row, USERS_HEADERS.indexOf('Admin Notes') + 1).setValue(p.note);
  return { success: true, message: 'User rejected.' };
}

function actionDeleteUser(p) {
  var sheet = getSheet(SHEET_USERS);
  var user = findUserByUsername(p.username || '');
  if (!user) return { success: false, message: 'User not found.' };
  sheet.deleteRow(user.__row);
  return { success: true, message: 'User deleted.' };
}

function actionUpdateProfile(p) {
  var sheet = getSheet(SHEET_USERS);
  var user = findUserByUsername(p.username || '');
  if (!user) return { success: false, message: 'User not found.' };
  if (p.name) sheet.getRange(user.__row, USERS_HEADERS.indexOf('Name') + 1).setValue(p.name);
  if (p.phone) sheet.getRange(user.__row, USERS_HEADERS.indexOf('Phone') + 1).setValue(p.phone);
  if (p.address) sheet.getRange(user.__row, USERS_HEADERS.indexOf('Address') + 1).setValue(p.address);
  if (p.photo) sheet.getRange(user.__row, USERS_HEADERS.indexOf('Photo Data') + 1).setValue(p.photo);
  var updated = findUserByUsername(p.username);
  return { success: true, user: sanitizeUser(updated) };
}

// ---- DAILY ENTRY / EARNINGS ---------------------------------------------

function actionAddEntry(p) {
  var username = p.username || '';
  var user = findUserByUsername(username);
  if (!user) return { success: false, message: 'User not found.' };

  var entryDate = toDateOnly(p.date);
  var todayStr = toDateOnly(new Date());
  if (entryDate > todayStr) return { success: false, message: 'Future dates are not allowed.' };

  var sheet = getSheet(SHEET_EARNINGS);
  var rows = sheetToObjects(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['Username']).toLowerCase() === username.toLowerCase() &&
        toDateOnly(rows[i]['Entry Date']) === entryDate) {
      return { success: false, message: 'An entry for this date already exists.' };
    }
  }

  var cash = Number(p.cashEarning) || 0;
  var online = Number(p.onlineEarning) || 0;
  var total = cash + online;
  var expense = Number(p.expenseAmount) || 0;
  var balance = total - expense;

  sheet.appendRow([
    user['Name'], username, entryDate, cash, online, total,
    expense, p.expenseReason || '', balance, new Date().toISOString()
  ]);
  return { success: true, message: 'Entry saved.' };
}

function actionGetMissedDates(p) {
  var username = p.username || '';
  var user = findUserByUsername(username);
  if (!user) return { success: false, message: 'User not found.' };

  var createdAt = user['Created At'] ? new Date(user['Created At']) : new Date();
  var today = new Date();
  var windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - MISSED_DATE_WINDOW_DAYS);
  var startDate = createdAt > windowStart ? createdAt : windowStart;

  var rows = sheetToObjects(getSheet(SHEET_EARNINGS));
  var existingDates = {};
  rows.forEach(function (r) {
    if (String(r['Username']).toLowerCase() === username.toLowerCase()) {
      existingDates[toDateOnly(r['Entry Date'])] = true;
    }
  });

  var missed = [];
  var cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  var todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);
  while (cursor <= todayOnly) {
    var ds = toDateOnly(cursor);
    if (!existingDates[ds]) missed.push(ds);
    cursor.setDate(cursor.getDate() + 1);
  }
  return { success: true, missedDates: missed };
}

// ---- DEPOSITS -------------------------------------------------------------

function computeWallet(username) {
  var earnings = sheetToObjects(getSheet(SHEET_EARNINGS)).filter(function (r) {
    return String(r['Username']).toLowerCase() === username.toLowerCase();
  });
  var deposits = sheetToObjects(getSheet(SHEET_DEPOSITS)).filter(function (r) {
    return String(r['Username']).toLowerCase() === username.toLowerCase();
  });

  var totalCashEarn = 0, totalOnlineEarn = 0, totalExpense = 0;
  earnings.forEach(function (r) {
    totalCashEarn += Number(r['Cash Earning']) || 0;
    totalOnlineEarn += Number(r['Online Earning']) || 0;
    totalExpense += Number(r['Expense Amount']) || 0;
  });

  var totalCashDep = 0, totalOnlineDep = 0;
  deposits.forEach(function (r) {
    totalCashDep += Number(r['Cash Deposit']) || 0;
    totalOnlineDep += Number(r['Online Deposit']) || 0;
  });

  // expenses assumed to be deducted from cash first, then online, proportionally simple: deduct from cash first
  var cashAfterExpense = totalCashEarn - totalExpense;
  var onlineAfterExpense = totalOnlineEarn;
  if (cashAfterExpense < 0) {
    onlineAfterExpense += cashAfterExpense; // borrow from online
    cashAfterExpense = 0;
  }
  var cashAvailable = Math.max(0, cashAfterExpense - totalCashDep);
  var onlineAvailable = Math.max(0, onlineAfterExpense - totalOnlineDep);
  var totalDeposited = totalCashDep + totalOnlineDep;
  var totalEarning = totalCashEarn + totalOnlineEarn;
  var netSaving = totalEarning - totalExpense;

  return {
    cashAvailable: cashAvailable,
    onlineAvailable: onlineAvailable,
    availableBalance: cashAvailable + onlineAvailable,
    totalDeposited: totalDeposited,
    totalEarning: totalEarning,
    totalExpense: totalExpense,
    netSaving: netSaving,
    earnings: earnings,
    deposits: deposits
  };
}

function actionAddDeposit(p) {
  var username = p.username || '';
  var user = findUserByUsername(username);
  if (!user) return { success: false, message: 'User not found.' };

  var wallet = computeWallet(username);
  var cashDeposit = Number(p.cashDeposit) || 0;
  var onlineDeposit = Number(p.onlineDeposit) || 0;

  if (cashDeposit > wallet.cashAvailable + 0.01) {
    return { success: false, message: 'Cash deposit exceeds available cash balance.' };
  }
  if (onlineDeposit > wallet.onlineAvailable + 0.01) {
    return { success: false, message: 'Online deposit exceeds available online balance.' };
  }
  if (cashDeposit <= 0 && onlineDeposit <= 0) {
    return { success: false, message: 'Enter a deposit amount.' };
  }

  var sheet = getSheet(SHEET_DEPOSITS);
  sheet.appendRow([
    user['Name'], username, toDateOnly(new Date()), cashDeposit, onlineDeposit,
    cashDeposit + onlineDeposit, new Date().toISOString()
  ]);
  return { success: true, message: 'Deposit recorded.' };
}

// ---- DASHBOARD ------------------------------------------------------------

function actionGetDashboard(p) {
  var username = p.username || '';
  var user = findUserByUsername(username);
  if (!user) return { success: false, message: 'User not found.' };

  var wallet = computeWallet(username);
  var today = new Date();
  var sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  var last7 = 0, thisMonth = 0;
  wallet.earnings.forEach(function (r) {
    var d = new Date(r['Entry Date']);
    var total = Number(r['Total Earning']) || 0;
    if (d >= sevenDaysAgo) last7 += total;
    if (d >= monthStart) thisMonth += total;
  });

  var records = wallet.earnings.map(function (r) {
    return {
      driver: r['Driver Name'], date: toDateOnly(r['Entry Date']), cash: Number(r['Cash Earning']) || 0,
      online: Number(r['Online Earning']) || 0, total: Number(r['Total Earning']) || 0,
      expense: Number(r['Expense Amount']) || 0, reason: r['Expense Reason'], balance: Number(r['Balance']) || 0
    };
  }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });

  var depositHistory = wallet.deposits.map(function (r) {
    return {
      driver: r['Driver Name'], date: toDateOnly(r['Deposit Date']),
      cashDeposit: Number(r['Cash Deposit']) || 0, onlineDeposit: Number(r['Online Deposit']) || 0,
      totalDeposit: Number(r['Total Deposit']) || 0
    };
  }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });

  return {
    success: true,
    wallet: {
      cashAvailable: wallet.cashAvailable, onlineAvailable: wallet.onlineAvailable,
      availableBalance: wallet.availableBalance, totalDeposited: wallet.totalDeposited
    },
    stats: {
      last7Days: last7, thisMonth: thisMonth, totalEarning: wallet.totalEarning,
      totalExpense: wallet.totalExpense, netSaving: wallet.netSaving
    },
    records: records,
    depositHistory: depositHistory
  };
}

function actionGetAdminStats(p) {
  var users = sheetToObjects(getSheet(SHEET_USERS));
  var activeUsers = users.filter(function (u) { return String(u['Status']).toLowerCase() === 'approved' && String(u['Role']).toLowerCase() === 'driver'; });
  var pending = users.filter(function (u) { return String(u['Status']).toLowerCase() === 'pending'; });

  var earnings = sheetToObjects(getSheet(SHEET_EARNINGS));
  var totalEarn = 0, totalExpense = 0;
  earnings.forEach(function (r) { totalEarn += Number(r['Total Earning']) || 0; totalExpense += Number(r['Expense Amount']) || 0; });
  var avgDaily = earnings.length ? totalEarn / earnings.length : 0;
  var avgExpense = earnings.length ? totalExpense / earnings.length : 0;

  var pendingDepositTotal = 0;
  activeUsers.forEach(function (u) {
    var wallet = computeWallet(u['Username']);
    pendingDepositTotal += wallet.availableBalance;
  });

  return {
    success: true,
    stats: {
      activeUsers: activeUsers.length,
      pendingApprovals: pending.length,
      avgDailyEarning: avgDaily,
      avgExpense: avgExpense,
      pendingDepositTotal: pendingDepositTotal
    },
    pendingUsers: pending.map(sanitizeUser)
  };
}

// ---- CHAT -------------------------------------------------------------

function threadIdFor(userA, userB) {
  var arr = [String(userA).toLowerCase(), String(userB).toLowerCase()].sort();
  return arr.join('__');
}

function actionGetChatMessages(p) {
  var username = p.username || '';
  var withUser = p.withUser || ADMIN_USERNAME; // driver chats only with admin; admin passes driver username
  var threadId = threadIdFor(username, withUser);
  var rows = sheetToObjects(getSheet(SHEET_CHAT)).filter(function (r) {
    return r['Thread Id'] === threadId;
  }).sort(function (a, b) { return new Date(a['Created At']) - new Date(b['Created At']); });

  var messages = rows.map(function (r) {
    return {
      senderUsername: r['Sender Username'], senderName: r['Sender Name'], senderRole: r['Sender Role'],
      recipientUsername: r['Recipient Username'], message: r['Message'], createdAt: r['Created At']
    };
  });
  return { success: true, messages: messages };
}

function actionSendChatMessage(p) {
  var required = ['senderUsername', 'senderName', 'senderRole', 'recipientUsername', 'message'];
  for (var i = 0; i < required.length; i++) {
    if (!p[required[i]]) return { success: false, message: 'Missing field: ' + required[i] };
  }
  var threadId = threadIdFor(p.senderUsername, p.recipientUsername);
  var sheet = getSheet(SHEET_CHAT);
  sheet.appendRow([
    threadId, p.senderUsername, p.senderName, p.senderRole,
    p.recipientUsername, p.recipientName || '', p.message, new Date().toISOString()
  ]);
  return { success: true };
}
