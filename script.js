const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBaa0bgLsl5C6BXoSG6u1-kBsd7Cj14hJ8DQBmtqroSVWuY8rr3ds5QfMOaZ-2dbFaJQ/exec";
const SESSION_KEY = "dealskartAutoDiarySession";
const LANGUAGE_KEY = "dealskartAutoDiaryLanguage";

const loginScreen = document.querySelector("#loginScreen");
const appShell = document.querySelector("#appShell");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const forgotForm = document.querySelector("#forgotForm");
const loginStatus = document.querySelector("#loginStatus");
const driverBadge = document.querySelector("#driverBadge");
const logoutButton = document.querySelector("#logoutButton");
const form = document.querySelector("#entryForm");
const formStatus = document.querySelector("#formStatus");
const recordsBody = document.querySelector("#recordsBody");
const depositsBody = document.querySelector("#depositsBody");
const refreshButton = document.querySelector("#refreshButton");
const depositButton = document.querySelector("#depositButton");
const depositStatus = document.querySelector("#depositStatus");
const entryDate = document.querySelector("#entryDate");
const cashEarning = document.querySelector("#cashEarning");
const onlineEarning = document.querySelector("#onlineEarning");
const expenseAmount = document.querySelector("#expenseAmount");
const totalPreview = document.querySelector("#totalPreview");
const balancePreview = document.querySelector("#balancePreview");
const submitEntryButton = document.querySelector("#submitEntryButton");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const authForms = document.querySelectorAll(".auth-form");
const authLinks = document.querySelectorAll(".link-button");
const adminTabButton = document.querySelector("#adminTabButton");
const adminCreateUserForm = document.querySelector("#adminCreateUserForm");
const adminStatus = document.querySelector("#adminStatus");
const adminRefreshButton = document.querySelector("#adminRefreshButton");
const usersBody = document.querySelector("#usersBody");
const loginKeyLabel = document.querySelector("#loginKeyLabel");
const languageSelect = document.querySelector("#languageSelect");
const loginLanguageSelect = document.querySelector("#loginLanguageSelect");

const translations = {
  en: {
    loginIntro: "Sign in with your driver account to manage earnings, expenses, and deposits.",
    loginAsUser: "Login as User", loginAsAdmin: "Login as Admin", username: "Username", password: "Password", login: "Login",
    fullName: "Full Name", createUsername: "Create username", panNumber: "PAN Number", dob: "Date of Birth", createPassword: "Create password",
    createAccount: "Create Account", newPassword: "New Password", resetPassword: "Reset Password", createNewAccount: "Create New Account", forgotPassword: "Forgot Password",
    tagline: "Earn More, Save More", language: "Language", logout: "Logout", autoDriverDiary: "Auto Driver Diary",
    heroTitle: "A professional dashboard for daily earnings, expenses, and savings.",
    heroText: "Track cash and online earnings separately, record expenses with reasons, and fetch complete reports from Google Sheets.",
    dailyEntry: "Daily Entry", earnings: "Earnings", admin: "Admin", moneyWallet: "Money Wallet", availableNow: "Currently Available",
    walletText: "Use Deposit Now to move the available cash and online balance into bank deposits.", depositNow: "Deposit Now",
    cashAvailable: "Cash Available", onlineAvailable: "Online Available", totalDeposited: "Total Deposited", todaysEntry: "Today's Entry",
    addDailyRecord: "Add Daily Record", date: "Date", cashEarning: "Cash Earning", onlineEarning: "Online Earning", totalEarning: "Total Earning",
    expense: "Expense", expenseReason: "Expense Reason", expenseReasonPlaceholder: "CNG, repair, parking, fine...", todaySaving: "Today's Saving",
    saveToSheet: "Save to Google Sheet", googleSheetReport: "Google Sheet Report", earningsSummary: "Earnings Summary", refresh: "Refresh",
    lastSevenDays: "Last 7 Days Earning", thisMonth: "This Month Earning", totalExpense: "Total Expense", netSaving: "Net Saving",
    driver: "Driver", cash: "Cash", online: "Online", total: "Total", reason: "Reason", balance: "Balance", bankDepositHistory: "Bank Deposit History",
    cashDeposit: "Cash Deposit", onlineDeposit: "Online Deposit", totalDeposit: "Total Deposit", adminDashboard: "Admin Dashboard",
    registeredUsers: "Registered Users", refreshUsers: "Refresh Users", registerDriver: "Register Driver", createUserFromAdmin: "Create User from Admin",
    registerUser: "Register User", name: "Name", role: "Role", status: "Status", created: "Created", action: "Action",
    adminUsername: "Admin Username",
    noRecords: "No records available.", loadingRecords: "Loading records...", loadingDeposits: "Loading deposits...", noDeposits: "No bank deposit records available.",
    readyEntry: "Today's entry is ready.", adminEntryDisabled: "Entry is disabled for admin accounts.", alreadyEntered: "Data already entered for today. Only one entry is allowed per day.",
    loginProgress: "Signing in...", registerProgress: "Creating account...", resetProgress: "Resetting password...", accountCreated: "Account created. Please login with your username and password.",
    passwordReset: "Password reset successfully. Please login with your new password.", depositUnavailable: "No available amount to deposit.", depositProgress: "Saving bank deposit record...",
    depositSuccess: "Deposit saved successfully. Available amount is now zero.", entryProgress: "Saving entry...", entrySuccess: "Entry saved to Google Sheet.", delete: "Delete"
  },
  hi: {
    loginIntro: "अपनी कमाई, खर्च और जमा राशि संभालने के लिए ड्राइवर अकाउंट से लॉगिन करें.",
    loginAsUser: "यूज़र लॉगिन", loginAsAdmin: "एडमिन लॉगिन", username: "यूज़रनेम", password: "पासवर्ड", login: "लॉगिन",
    fullName: "पूरा नाम", createUsername: "यूज़रनेम बनाएं", panNumber: "पैन नंबर", dob: "जन्म तिथि", createPassword: "पासवर्ड बनाएं",
    createAccount: "अकाउंट बनाएं", newPassword: "नया पासवर्ड", resetPassword: "पासवर्ड रीसेट करें", createNewAccount: "नया अकाउंट बनाएं", forgotPassword: "पासवर्ड भूल गए",
    tagline: "ज्यादा कमाएं, ज्यादा बचाएं", language: "भाषा", logout: "लॉगआउट", autoDriverDiary: "ऑटो ड्राइवर डायरी",
    heroTitle: "रोज़ की कमाई, खर्च और बचत के लिए प्रोफेशनल डैशबोर्ड.",
    heroText: "कैश और ऑनलाइन कमाई अलग रिकॉर्ड करें, खर्च का कारण लिखें, और Google Sheets से पूरी रिपोर्ट देखें.",
    dailyEntry: "डेली एंट्री", earnings: "कमाई", admin: "एडमिन", moneyWallet: "मनी वॉलेट", availableNow: "अभी उपलब्ध",
    walletText: "Deposit Now से उपलब्ध कैश और ऑनलाइन बैलेंस बैंक डिपॉज़िट में सेव होगा.", depositNow: "डिपॉज़िट करें",
    cashAvailable: "उपलब्ध कैश", onlineAvailable: "उपलब्ध ऑनलाइन", totalDeposited: "कुल जमा", todaysEntry: "आज की एंट्री",
    addDailyRecord: "डेली रिकॉर्ड जोड़ें", date: "तारीख", cashEarning: "कैश कमाई", onlineEarning: "ऑनलाइन कमाई", totalEarning: "कुल कमाई",
    expense: "खर्च", expenseReason: "खर्च का कारण", expenseReasonPlaceholder: "CNG, repair, parking, fine...", todaySaving: "आज की बचत",
    saveToSheet: "Google Sheet में सेव करें", googleSheetReport: "Google Sheet रिपोर्ट", earningsSummary: "कमाई सारांश", refresh: "रिफ्रेश",
    lastSevenDays: "पिछले 7 दिन की कमाई", thisMonth: "इस महीने की कमाई", totalExpense: "कुल खर्च", netSaving: "नेट बचत",
    driver: "ड्राइवर", cash: "कैश", online: "ऑनलाइन", total: "कुल", reason: "कारण", balance: "बैलेंस", bankDepositHistory: "बैंक डिपॉज़िट हिस्ट्री",
    cashDeposit: "कैश डिपॉज़िट", onlineDeposit: "ऑनलाइन डिपॉज़िट", totalDeposit: "कुल डिपॉज़िट", adminDashboard: "एडमिन डैशबोर्ड",
    registeredUsers: "रजिस्टर्ड यूज़र", refreshUsers: "यूज़र रिफ्रेश करें", registerDriver: "ड्राइवर रजिस्टर करें", createUserFromAdmin: "एडमिन से यूज़र बनाएं",
    registerUser: "यूज़र रजिस्टर करें", name: "नाम", role: "रोल", status: "स्टेटस", created: "बनाया गया", action: "एक्शन",
    adminUsername: "एडमिन यूज़रनेम",
    noRecords: "अभी कोई रिकॉर्ड नहीं है.", loadingRecords: "रिकॉर्ड लोड हो रहे हैं...", loadingDeposits: "डिपॉज़िट लोड हो रहे हैं...", noDeposits: "अभी कोई बैंक डिपॉज़िट रिकॉर्ड नहीं है.",
    readyEntry: "आज की एंट्री तैयार है.", adminEntryDisabled: "एडमिन अकाउंट में एंट्री बंद है.", alreadyEntered: "आज का डेटा पहले से दर्ज है. एक दिन में सिर्फ एक एंट्री होगी.",
    loginProgress: "लॉगिन हो रहा है...", registerProgress: "अकाउंट बन रहा है...", resetProgress: "पासवर्ड रीसेट हो रहा है...", accountCreated: "अकाउंट बन गया. अब यूज़रनेम और पासवर्ड से लॉगिन करें.",
    passwordReset: "पासवर्ड रीसेट हो गया. नए पासवर्ड से लॉगिन करें.", depositUnavailable: "डिपॉज़िट के लिए कोई उपलब्ध राशि नहीं है.", depositProgress: "बैंक डिपॉज़िट रिकॉर्ड सेव हो रहा है...",
    depositSuccess: "डिपॉज़िट सेव हो गया. उपलब्ध राशि अब शून्य है.", entryProgress: "एंट्री सेव हो रही है...", entrySuccess: "एंट्री Google Sheet में सेव हो गई.", delete: "डिलीट"
  },
  gu: {
    loginIntro: "આવક, ખર્ચ અને ડિપોઝિટ મેનેજ કરવા ડ્રાઇવર એકાઉન્ટથી લોગિન કરો.",
    loginAsUser: "યૂઝર લોગિન", loginAsAdmin: "એડમિન લોગિન", username: "યૂઝરનેમ", password: "પાસવર્ડ", login: "લોગિન",
    fullName: "પૂરું નામ", createUsername: "યૂઝરનેમ બનાવો", panNumber: "PAN નંબર", dob: "જન્મ તારીખ", createPassword: "પાસવર્ડ બનાવો",
    createAccount: "એકાઉન્ટ બનાવો", newPassword: "નવો પાસવર્ડ", resetPassword: "પાસવર્ડ રીસેટ કરો", createNewAccount: "નવું એકાઉન્ટ બનાવો", forgotPassword: "પાસવર્ડ ભૂલી ગયા",
    tagline: "વધુ કમાઓ, વધુ બચાવો", language: "ભાષા", logout: "લોગઆઉટ", autoDriverDiary: "ઓટો ડ્રાઇવર ડાયરી",
    heroTitle: "દૈનિક આવક, ખર્ચ અને બચત માટે પ્રોફેશનલ ડેશબોર્ડ.",
    heroText: "કેશ અને ઓનલાઈન આવક અલગથી નોંધો, ખર્ચનું કારણ લખો, અને Google Sheetsમાંથી સંપૂર્ણ રિપોર્ટ મેળવો.",
    dailyEntry: "દૈનિક એન્ટ્રી", earnings: "આવક", admin: "એડમિન", moneyWallet: "મની વૉલેટ", availableNow: "હાલ ઉપલબ્ધ",
    walletText: "Deposit Now દ્વારા ઉપલબ્ધ કેશ અને ઓનલાઈન બેલેન્સ બેંક ડિપોઝિટમાં સેવ થશે.", depositNow: "ડિપોઝિટ કરો",
    cashAvailable: "ઉપલબ્ધ કેશ", onlineAvailable: "ઉપલબ્ધ ઓનલાઈન", totalDeposited: "કુલ ડિપોઝિટ", todaysEntry: "આજની એન્ટ્રી",
    addDailyRecord: "દૈનિક રેકોર્ડ ઉમેરો", date: "તારીખ", cashEarning: "કેશ આવક", onlineEarning: "ઓનલાઈન આવક", totalEarning: "કુલ આવક",
    expense: "ખર્ચ", expenseReason: "ખર્ચનું કારણ", expenseReasonPlaceholder: "CNG, repair, parking, fine...", todaySaving: "આજની બચત",
    saveToSheet: "Google Sheetમાં સેવ કરો", googleSheetReport: "Google Sheet રિપોર્ટ", earningsSummary: "આવક સારાંશ", refresh: "રીફ્રેશ",
    lastSevenDays: "છેલ્લા 7 દિવસની આવક", thisMonth: "આ મહિનાની આવક", totalExpense: "કુલ ખર્ચ", netSaving: "નેટ બચત",
    driver: "ડ્રાઇવર", cash: "કેશ", online: "ઓનલાઈન", total: "કુલ", reason: "કારણ", balance: "બેલેન્સ", bankDepositHistory: "બેંક ડિપોઝિટ ઇતિહાસ",
    cashDeposit: "કેશ ડિપોઝિટ", onlineDeposit: "ઓનલાઈન ડિપોઝિટ", totalDeposit: "કુલ ડિપોઝિટ", adminDashboard: "એડમિન ડેશબોર્ડ",
    registeredUsers: "રજિસ્ટર્ડ યૂઝર્સ", refreshUsers: "યૂઝર્સ રીફ્રેશ કરો", registerDriver: "ડ્રાઇવર રજીસ્ટર કરો", createUserFromAdmin: "એડમિનથી યૂઝર બનાવો",
    registerUser: "યૂઝર રજીસ્ટર કરો", name: "નામ", role: "રોલ", status: "સ્ટેટસ", created: "બનાવ્યું", action: "એક્શન",
    adminUsername: "એડમિન યૂઝરનેમ",
    noRecords: "હાલ કોઈ રેકોર્ડ નથી.", loadingRecords: "રેકોર્ડ લોડ થઈ રહ્યા છે...", loadingDeposits: "ડિપોઝિટ લોડ થઈ રહ્યા છે...", noDeposits: "હાલ કોઈ બેંક ડિપોઝિટ રેકોર્ડ નથી.",
    readyEntry: "આજની એન્ટ્રી તૈયાર છે.", adminEntryDisabled: "એડમિન એકાઉન્ટમાં એન્ટ્રી બંધ છે.", alreadyEntered: "આજનો ડેટા પહેલેથી દાખલ છે. એક દિવસમાં માત્ર એક એન્ટ્રી.",
    loginProgress: "લોગિન થઈ રહ્યું છે...", registerProgress: "એકાઉન્ટ બની રહ્યું છે...", resetProgress: "પાસવર્ડ રીસેટ થઈ રહ્યો છે...", accountCreated: "એકાઉન્ટ બની ગયું. હવે યૂઝરનેમ અને પાસવર્ડથી લોગિન કરો.",
    passwordReset: "પાસવર્ડ રીસેટ થઈ ગયો. નવા પાસવર્ડથી લોગિન કરો.", depositUnavailable: "ડિપોઝિટ માટે કોઈ ઉપલબ્ધ રકમ નથી.", depositProgress: "બેંક ડિપોઝિટ રેકોર્ડ સેવ થઈ રહ્યો છે...",
    depositSuccess: "ડિપોઝિટ સેવ થઈ ગયું. ઉપલબ્ધ રકમ હવે શૂન્ય છે.", entryProgress: "એન્ટ્રી સેવ થઈ રહી છે...", entrySuccess: "એન્ટ્રી Google Sheetમાં સેવ થઈ ગઈ.", delete: "ડિલીટ"
  }
};

let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "en";

function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

const summaryElements = {
  sevenDayEarning: document.querySelector("#sevenDayEarning"),
  monthEarning: document.querySelector("#monthEarning"),
  totalEarning: document.querySelector("#totalEarning"),
  totalExpense: document.querySelector("#totalExpense"),
  netSaving: document.querySelector("#netSaving"),
};

const walletElements = {
  availableTotal: document.querySelector("#availableTotal"),
  availableCash: document.querySelector("#availableCash"),
  availableOnline: document.querySelector("#availableOnline"),
  depositedTotal: document.querySelector("#depositedTotal"),
};

let currentSession = null;
let currentWallet = { availableCash: 0, availableOnline: 0, availableTotal: 0, depositedTotal: 0 };

function setTodayDate() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  entryDate.value = new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `status ${type}`.trim();
}

function applyLanguage(language) {
  currentLanguage = language;
  localStorage.setItem(LANGUAGE_KEY, language);
  document.documentElement.lang = language;
  if (languageSelect) languageSelect.value = language;
  if (loginLanguageSelect) loginLanguageSelect.value = language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  updateLoginLabel();
}

function getNumber(value) {
  return Number(value || 0);
}

function formatCurrency(value) {
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(getNumber(value))}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getEndpointUrl(action) {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set("action", action);
  if (currentSession?.userKey) {
    url.searchParams.set("userKey", currentSession.userKey);
    url.searchParams.set("role", currentSession.role);
  }
  return url;
}

async function postAction(action, payload) {
  const response = await fetch(getEndpointUrl(action), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.message || "Request failed.");
  }
  return result;
}

function showAuthForm(formId) {
  authForms.forEach((item) => item.classList.toggle("active", item.id === formId));
  authLinks.forEach((button) => button.classList.toggle("active", button.dataset.form === formId));
  setMessage(loginStatus, "");
}

function updateLoginLabel() {
  const role = document.querySelector('input[name="loginRole"]:checked')?.value || "user";
  loginKeyLabel.querySelector("span").textContent = role === "admin" ? t("adminUsername") || "Admin Username" : t("username");
  document.querySelector("#loginKey").placeholder = role === "admin" ? "RAHUL" : t("username");
}

function saveSession(user) {
  currentSession = user;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  currentSession = null;
  sessionStorage.removeItem(SESSION_KEY);
}

function updatePreview() {
  const total = getNumber(cashEarning.value) + getNumber(onlineEarning.value);
  const balance = total - getNumber(expenseAmount.value);
  totalPreview.textContent = formatCurrency(total);
  balancePreview.textContent = formatCurrency(balance);
}

function parseSheetDate(value) {
  const date = value ? new Date(`${value}T00:00:00`) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function calculateSummary(records) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(todayStart.getDate() - 6);

  return records.reduce((summary, record) => {
    const recordDate = parseSheetDate(record.entryDate);
    const total = getNumber(record.totalEarning);
    const expense = getNumber(record.expenseAmount);
    summary.totalEarning += total;
    summary.totalExpense += expense;

    if (recordDate && recordDate >= sevenDaysAgo && recordDate <= todayStart) {
      summary.sevenDayEarning += total;
    }
    if (recordDate && recordDate.getFullYear() === now.getFullYear() && recordDate.getMonth() === now.getMonth()) {
      summary.monthEarning += total;
    }
    return summary;
  }, { sevenDayEarning: 0, monthEarning: 0, totalEarning: 0, totalExpense: 0 });
}

function renderSummary(records) {
  const summary = calculateSummary(records);
  summaryElements.sevenDayEarning.textContent = formatCurrency(summary.sevenDayEarning);
  summaryElements.monthEarning.textContent = formatCurrency(summary.monthEarning);
  summaryElements.totalEarning.textContent = formatCurrency(summary.totalEarning);
  summaryElements.totalExpense.textContent = formatCurrency(summary.totalExpense);
  summaryElements.netSaving.textContent = formatCurrency(summary.totalEarning - summary.totalExpense);
}

function renderWallet(wallet = {}) {
  currentWallet = {
    availableCash: getNumber(wallet.availableCash),
    availableOnline: getNumber(wallet.availableOnline),
    availableTotal: getNumber(wallet.availableTotal),
    depositedTotal: getNumber(wallet.depositedTotal),
  };
  walletElements.availableTotal.textContent = formatCurrency(currentWallet.availableTotal);
  walletElements.availableCash.textContent = formatCurrency(currentWallet.availableCash);
  walletElements.availableOnline.textContent = formatCurrency(currentWallet.availableOnline);
  walletElements.depositedTotal.textContent = formatCurrency(currentWallet.depositedTotal);
  depositButton.disabled = currentWallet.availableTotal <= 0 || currentSession?.role === "admin";
}

function renderDeposits(deposits = []) {
  if (!deposits.length) {
    depositsBody.innerHTML = `<tr><td colspan="5">${t("noDeposits")}</td></tr>`;
    return;
  }
  depositsBody.innerHTML = deposits.map((row) => `
    <tr>
      <td>${escapeHtml(row.driverName)}</td>
      <td>${escapeHtml(row.depositDate)}</td>
      <td>${escapeHtml(formatCurrency(row.cashDeposit))}</td>
      <td>${escapeHtml(formatCurrency(row.onlineDeposit))}</td>
      <td>${escapeHtml(formatCurrency(row.totalDeposit))}</td>
    </tr>
  `).join("");
}

function setEntryLocked(isLocked) {
  const locked = isLocked || currentSession?.role === "admin";
  form.classList.toggle("disabled", locked);
  submitEntryButton.disabled = locked;
  [cashEarning, onlineEarning, expenseAmount, form.elements.expenseReason].forEach((input) => {
    input.disabled = locked;
  });
}

function updateTodayEntryState(records) {
  const alreadyEntered = records.some((record) => record.entryDate === entryDate.value);
  setEntryLocked(alreadyEntered);
  if (currentSession?.role === "admin") {
    setMessage(formStatus, t("adminEntryDisabled"), "error");
  } else if (alreadyEntered) {
    setMessage(formStatus, t("alreadyEntered"), "error");
  } else if (!formStatus.dataset.busy) {
    setMessage(formStatus, t("readyEntry"), "success");
  }
}

function renderRecords(records = []) {
  if (!records.length) {
    recordsBody.innerHTML = `<tr><td colspan="8">${t("noRecords")}</td></tr>`;
    return;
  }
  recordsBody.innerHTML = records.map((row) => `
    <tr>
      <td>${escapeHtml(row.driverName)}</td>
      <td>${escapeHtml(row.entryDate)}</td>
      <td>${escapeHtml(formatCurrency(row.cashEarning))}</td>
      <td>${escapeHtml(formatCurrency(row.onlineEarning))}</td>
      <td>${escapeHtml(formatCurrency(row.totalEarning))}</td>
      <td>${escapeHtml(formatCurrency(row.expenseAmount))}</td>
      <td>${escapeHtml(row.expenseReason || "-")}</td>
      <td>${escapeHtml(formatCurrency(row.balance))}</td>
    </tr>
  `).join("");
}

async function loadRecords() {
  recordsBody.innerHTML = `<tr><td colspan="8">${t("loadingRecords")}</td></tr>`;
  depositsBody.innerHTML = `<tr><td colspan="5">${t("loadingDeposits")}</td></tr>`;
  try {
    const response = await fetch(getEndpointUrl("read"));
    const result = await response.json();
    if (!result.ok) throw new Error(result.message || "Records load nahi ho paye.");
    const records = result.data.records || [];
    renderSummary(records);
    renderWallet(result.data.wallet || {});
    renderDeposits(result.data.deposits || []);
    renderRecords(records);
    updateTodayEntryState(records);
  } catch (error) {
    recordsBody.innerHTML = `<tr><td colspan="8">${escapeHtml(error.message)}</td></tr>`;
    depositsBody.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
    setMessage(formStatus, error.message, "error");
  }
}

function showApp() {
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  adminTabButton.classList.toggle("hidden", currentSession?.role !== "admin");
  driverBadge.textContent = `${currentSession.role.toUpperCase()}: ${currentSession.name}`;
  setTodayDate();
  updatePreview();
  loadRecords();
  if (currentSession.role === "admin") loadUsers();
}

function showLogin() {
  appShell.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

async function loadUsers() {
  usersBody.innerHTML = `<tr><td colspan="8">${t("loadingRecords")}</td></tr>`;
  try {
    const result = await postAction("listUsers", { adminKey: currentSession.userKey });
    const users = result.data.users || [];
    usersBody.innerHTML = users.map((user) => `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.pan || "-")}</td>
        <td>${escapeHtml(user.dob || "-")}</td>
        <td>${escapeHtml(user.role)}</td>
        <td>${escapeHtml(user.status)}</td>
        <td>${escapeHtml(user.createdAt)}</td>
        <td>${user.role === "admin" ? "-" : `<button class="secondary-button delete-user-button" data-user-key="${escapeHtml(user.username)}" type="button">${t("delete")}</button>`}</td>
      </tr>
    `).join("");
  } catch (error) {
    usersBody.innerHTML = `<tr><td colspan="8">${escapeHtml(error.message)}</td></tr>`;
  }
}

authLinks.forEach((button) => button.addEventListener("click", () => showAuthForm(button.dataset.form)));

document.querySelectorAll('input[name="loginRole"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    updateLoginLabel();
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginStatus, t("loginProgress"));
  try {
    const result = await postAction("login", {
      role: document.querySelector('input[name="loginRole"]:checked').value,
      userKey: document.querySelector("#loginKey").value.trim().toUpperCase(),
      password: document.querySelector("#loginPassword").value,
    });
    saveSession(result.data.user);
    setMessage(loginStatus, "");
    showApp();
  } catch (error) {
    setMessage(loginStatus, error.message, "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginStatus, t("registerProgress"));
  try {
    await postAction("register", {
      name: document.querySelector("#registerName").value.trim(),
      username: document.querySelector("#registerUsername").value.trim().toUpperCase(),
      pan: document.querySelector("#registerPan").value.trim().toUpperCase(),
      dob: document.querySelector("#registerDob").value,
      password: document.querySelector("#registerPassword").value,
      role: "user",
    });
    registerForm.reset();
    showAuthForm("loginForm");
    setMessage(loginStatus, t("accountCreated"), "success");
  } catch (error) {
    setMessage(loginStatus, error.message, "error");
  }
});

forgotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginStatus, t("resetProgress"));
  try {
    await postAction("resetPassword", {
      username: document.querySelector("#forgotUsername").value.trim().toUpperCase(),
      pan: document.querySelector("#forgotPan").value.trim().toUpperCase(),
      dob: document.querySelector("#forgotDob").value,
      newPassword: document.querySelector("#forgotNewPassword").value,
    });
    forgotForm.reset();
    showAuthForm("loginForm");
    setMessage(loginStatus, t("passwordReset"), "success");
  } catch (error) {
    setMessage(loginStatus, error.message, "error");
  }
});

logoutButton.addEventListener("click", () => {
  clearSession();
  showLogin();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const cash = getNumber(cashEarning.value);
  const online = getNumber(onlineEarning.value);
  const expense = getNumber(expenseAmount.value);
  formStatus.dataset.busy = "true";
  setMessage(formStatus, t("entryProgress"));
  submitEntryButton.disabled = true;
  try {
    await postAction("create", {
      userKey: currentSession.userKey,
      driverName: currentSession.name,
      entryDate: entryDate.value,
      cashEarning: cash,
      onlineEarning: online,
      totalEarning: cash + online,
      expenseAmount: expense,
      expenseReason: form.elements.expenseReason.value,
      balance: cash + online - expense,
    });
    form.reset();
    setTodayDate();
    updatePreview();
    setMessage(formStatus, t("entrySuccess"), "success");
    delete formStatus.dataset.busy;
    await loadRecords();
  } catch (error) {
    setMessage(formStatus, error.message, "error");
    delete formStatus.dataset.busy;
    submitEntryButton.disabled = false;
  }
});

depositButton.addEventListener("click", async () => {
  if (currentWallet.availableTotal <= 0) {
    setMessage(depositStatus, t("depositUnavailable"), "error");
    return;
  }
  depositButton.disabled = true;
  setMessage(depositStatus, t("depositProgress"));
  try {
    await postAction("deposit", {
      userKey: currentSession.userKey,
      driverName: currentSession.name,
      cashDeposit: currentWallet.availableCash,
      onlineDeposit: currentWallet.availableOnline,
    });
    setMessage(depositStatus, t("depositSuccess"), "success");
    await loadRecords();
  } catch (error) {
    setMessage(depositStatus, error.message, "error");
    depositButton.disabled = false;
  }
});

adminCreateUserForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(adminStatus, t("registerProgress"));
  try {
    await postAction("adminCreateUser", {
      adminKey: currentSession.userKey,
      name: document.querySelector("#adminUserName").value.trim(),
      username: document.querySelector("#adminUsername").value.trim().toUpperCase(),
      pan: document.querySelector("#adminUserPan").value.trim().toUpperCase(),
      dob: document.querySelector("#adminUserDob").value,
      password: document.querySelector("#adminUserPassword").value,
      role: "user",
    });
    adminCreateUserForm.reset();
    setMessage(adminStatus, t("accountCreated"), "success");
    await loadUsers();
  } catch (error) {
    setMessage(adminStatus, error.message, "error");
  }
});

usersBody.addEventListener("click", async (event) => {
  if (!event.target.classList.contains("delete-user-button")) return;
  const userKey = event.target.dataset.userKey;
  setMessage(adminStatus, `${t("delete")}...`);
  try {
    await postAction("deleteUser", { adminKey: currentSession.userKey, userKey });
    setMessage(adminStatus, `${t("delete")} ${t("status")}.`, "success");
    await loadUsers();
  } catch (error) {
    setMessage(adminStatus, error.message, "error");
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((tabButton) => tabButton.classList.remove("active"));
    tabPanels.forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.tab}`).classList.add("active");
    if (button.dataset.tab === "earningsPanel") loadRecords();
    if (button.dataset.tab === "adminPanel") loadUsers();
  });
});

[cashEarning, onlineEarning, expenseAmount].forEach((input) => input.addEventListener("input", updatePreview));
refreshButton.addEventListener("click", loadRecords);
adminRefreshButton.addEventListener("click", loadUsers);
languageSelect.value = currentLanguage;
loginLanguageSelect.value = currentLanguage;
languageSelect.addEventListener("change", () => applyLanguage(languageSelect.value));
loginLanguageSelect.addEventListener("change", () => applyLanguage(loginLanguageSelect.value));
setTodayDate();
updatePreview();
applyLanguage(currentLanguage);

try {
  currentSession = JSON.parse(sessionStorage.getItem(SESSION_KEY));
} catch (error) {
  currentSession = null;
}

if (currentSession?.userKey) {
  showApp();
}
