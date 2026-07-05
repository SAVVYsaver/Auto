// ============================================================
// DEALSKART AUTO DIARY - FRONTEND APP LOGIC
// ============================================================

let currentUser = null;      // sanitized user object from backend
let loginRole = 'driver';    // 'driver' | 'admin'
let charts = {};             // chart.js instances
let missedDatesCache = [];
let dashboardCache = null;
let logoutTimer = null;
let logoutCountdownInterval = null;
let logoutRemainingMs = AUTO_LOGOUT_MS;
let chatPollTimer = null;
let chatActiveWith = null; // for admin: which driver's thread is open

// ---------- API HELPER ----------
async function apiCall(payload, opts = {}) {
  const { silent = false } = opts;
  if (!silent) showLoading(opts.loadingText || 'Please wait...');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight on Apps Script
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: 'Network error: ' + err.message };
  } finally {
    if (!silent) hideLoading();
  }
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Loading...';
  document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showView(id) {
  ['viewLogin', 'viewRegister', 'viewForgot'].forEach(v => document.getElementById(v).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function money(n) {
  n = Number(n) || 0;
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function msgBox(elId, text, type) {
  const el = document.getElementById(elId);
  if (!text) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="auth-msg ${type}">${text}</div>`;
}

// ---------- LOGIN ROLE TOGGLE ----------
function setLoginRole(role) {
  loginRole = role;
  document.getElementById('btnRoleUser').classList.toggle('active', role === 'driver');
  document.getElementById('btnRoleAdmin').classList.toggle('active', role === 'admin');
  document.getElementById('linkRegister').style.display = role === 'admin' ? 'none' : 'inline';
}

// ---------- AUTH ACTIONS ----------
async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  msgBox('loginMsg', '', '');
  if (!username || !password) { msgBox('loginMsg', 'Enter username and password.', 'error'); return; }

  const data = await apiCall({ action: 'login', username, password }, { loadingText: 'Signing you in...' });
  if (!data.success) { msgBox('loginMsg', data.message || 'Login failed.', 'error'); return; }

  if (loginRole === 'admin' && data.user.Role !== 'admin') {
    msgBox('loginMsg', 'This account is not an admin account.', 'error');
    return;
  }
  if (loginRole === 'driver' && data.user.Role === 'admin') {
    msgBox('loginMsg', 'Please use Admin Login for this account.', 'error');
    return;
  }

  currentUser = data.user;
  localStorage.removeItem('dk_username'); // no persistent storage of credentials beyond prefill convenience below
  enterApp();
}

async function handleRegister() {
  const payload = {
    action: 'register',
    name: document.getElementById('regName').value.trim(),
    username: document.getElementById('regUsername').value.trim(),
    pan: document.getElementById('regPan').value.trim(),
    dob: document.getElementById('regDob').value,
    phone: document.getElementById('regPhone').value.trim(),
    address: document.getElementById('regAddress').value.trim(),
    password: document.getElementById('regPassword').value
  };
  for (const k of ['name','username','pan','dob','phone','address','password']) {
    if (!payload[k]) { msgBox('registerMsg', 'Please fill in all fields.', 'error'); return; }
  }
  const data = await apiCall(payload, { loadingText: 'Submitting registration...' });
  if (!data.success) { msgBox('registerMsg', data.message, 'error'); return; }
  msgBox('registerMsg', data.message + ' You will be able to log in once approved.', 'success');
  setTimeout(() => showView('viewLogin'), 1800);
}

async function handleResetPassword() {
  const payload = {
    action: 'resetPassword',
    username: document.getElementById('fgUsername').value.trim(),
    pan: document.getElementById('fgPan').value.trim(),
    dob: document.getElementById('fgDob').value,
    newPassword: document.getElementById('fgNewPassword').value
  };
  if (!payload.username || !payload.pan || !payload.dob || !payload.newPassword) {
    msgBox('forgotMsg', 'Please fill in all fields.', 'error'); return;
  }
  const data = await apiCall(payload, { loadingText: 'Verifying identity...' });
  msgBox('forgotMsg', data.message, data.success ? 'success' : 'error');
  if (data.success) {
    prefillUsername = payload.username;
    setTimeout(() => {
      showView('viewLogin');
      document.getElementById('loginUsername').value = payload.username;
    }, 1500);
  }
}

function handleLogout(auto = false) {
  clearTimeout(logoutTimer);
  clearInterval(logoutCountdownInterval);
  clearInterval(chatPollTimer);
  const prefillUsername = currentUser ? currentUser.Username : '';
  currentUser = null;
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};
  document.getElementById('appShell').classList.add('hidden');
  showView('viewLogin');
  document.getElementById('loginUsername').value = prefillUsername || '';
  document.getElementById('loginPassword').value = '';
  if (auto) {
    msgBox('loginMsg', 'Session expired due to inactivity. Please re-enter your password.', 'error');
  }
}

// ---------- AUTO LOGOUT ----------
const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
function resetInactivityTimer() {
  if (!currentUser) return;
  logoutRemainingMs = AUTO_LOGOUT_MS;
}
activityEvents.forEach(ev => document.addEventListener(ev, resetInactivityTimer, { passive: true }));

function startSessionWatcher() {
  logoutRemainingMs = AUTO_LOGOUT_MS;
  clearInterval(logoutCountdownInterval);
  logoutCountdownInterval = setInterval(() => {
    logoutRemainingMs -= 1000;
    if (logoutRemainingMs <= 0) {
      clearInterval(logoutCountdownInterval);
      handleLogout(true);
      return;
    }
    const totalSec = Math.ceil(logoutRemainingMs / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    const timerEl = document.getElementById('sessionTimer');
    timerEl.textContent = `Session: ${m}:${s}`;
    timerEl.classList.toggle('warn', totalSec <= 20);
  }, 1000);
}

// ---------- APP ENTRY ----------
async function enterApp() {
  showView('viewLogin'); // will be hidden below; ensures auth views hidden
  document.getElementById('viewLogin').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');

  document.getElementById('topbarAvatar').textContent = (currentUser.Name || currentUser.Username || '?')[0].toUpperCase();
  document.getElementById('navAdmin').classList.toggle('hidden', currentUser.Role !== 'admin');

  populateProfileFields();
  startSessionWatcher();

  if (currentUser.Role === 'admin') {
    switchTab('admin');
  } else {
    switchTab('dashboard');
  }
}

function toggleSidebar(open) {
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('overlayScrim').classList.toggle('show', open);
}

// ---------- TAB SWITCHING ----------
const TAB_TITLES = {
  dashboard: 'Dashboard', entry: 'Daily Entry', earnings: 'Earnings',
  profile: 'Profile', chat: 'Chat', admin: 'Admin Panel'
};

async function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('topbarTitle').textContent = TAB_TITLES[tab];
  toggleSidebar(false);

  stopChatPolling();

  if (tab === 'dashboard') await loadDashboard();
  if (tab === 'entry') await loadEntryTab();
  if (tab === 'earnings') await loadEarningsTab();
  if (tab === 'chat') await loadChatTab();
  if (tab === 'admin') await loadAdminTab();
}

// ---------- DASHBOARD ----------
async function loadDashboard() {
  const data = await apiCall({ action: 'getDashboard', username: currentUser.Username }, { loadingText: 'Loading dashboard...' });
  if (!data.success) return;
  dashboardCache = data;

  document.getElementById('dashBalance').textContent = money(data.wallet.availableBalance);
  document.getElementById('dashCash').textContent = money(data.wallet.cashAvailable);
  document.getElementById('dashOnline').textContent = money(data.wallet.onlineAvailable);
  document.getElementById('dashDeposited').textContent = money(data.wallet.totalDeposited);

  renderMissedDates('missedDatesWrap');
  await loadMissedDates();
  renderCharts(data);
}

function renderCharts(data) {
  const opts = {
    plugins: { legend: { position: 'bottom', labels: { color: '#b7bdc9', font: { size: 11 } } } },
    maintainAspectRatio: false
  };
  const palette = ['#f5a623', '#4d9dff', '#35c98f', '#ef5a6f'];

  if (charts.earningSplit) charts.earningSplit.destroy();
  charts.earningSplit = new Chart(document.getElementById('chartEarningSplit'), {
    type: 'pie',
    data: { labels: ['Cash', 'Online'], datasets: [{ data: [sumField(data.records, 'cash'), sumField(data.records, 'online')], backgroundColor: [palette[0], palette[1]], borderColor: '#111319', borderWidth: 2 }] },
    options: opts
  });

  if (charts.expenseSaving) charts.expenseSaving.destroy();
  charts.expenseSaving = new Chart(document.getElementById('chartExpenseSaving'), {
    type: 'pie',
    data: { labels: ['Expense', 'Net Saving'], datasets: [{ data: [data.stats.totalExpense, Math.max(0, data.stats.netSaving)], backgroundColor: [palette[3], palette[2]], borderColor: '#111319', borderWidth: 2 }] },
    options: opts
  });

  if (charts.walletSplit) charts.walletSplit.destroy();
  charts.walletSplit = new Chart(document.getElementById('chartWalletSplit'), {
    type: 'pie',
    data: { labels: ['Available', 'Deposited'], datasets: [{ data: [data.wallet.availableBalance, data.wallet.totalDeposited], backgroundColor: [palette[0], palette[2]], borderColor: '#111319', borderWidth: 2 }] },
    options: opts
  });
}
function sumField(arr, field) { return arr.reduce((s, r) => s + (Number(r[field]) || 0), 0); }

// ---------- MISSED DATES ----------
async function loadMissedDates() {
  const data = await apiCall({ action: 'getMissedDates', username: currentUser.Username }, { silent: true });
  if (data.success) {
    missedDatesCache = data.missedDates;
    renderMissedDates('missedDatesWrap');
    renderMissedDates('missedDatesWrap2');
  }
}
function renderMissedDates(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!missedDatesCache.length) {
    el.innerHTML = '<span class="text-muted">No missed dates 🎉</span>';
    return;
  }
  el.innerHTML = missedDatesCache.slice(0, 30).map(d =>
    `<span class="chip" onclick="fillMissedDate('${d}')">${d}</span>`
  ).join('');
}
function fillMissedDate(dateStr) {
  switchTab('entry').then(() => {
    document.getElementById('entryDate').value = dateStr;
  });
}

// ---------- DAILY ENTRY ----------
async function loadEntryTab() {
  const dateInput = document.getElementById('entryDate');
  if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
  dateInput.max = new Date().toISOString().slice(0, 10);
  await loadMissedDates();
  recalcEntry();
}
function recalcEntry() {
  const cash = Number(document.getElementById('entryCash').value) || 0;
  const online = Number(document.getElementById('entryOnline').value) || 0;
  const expense = Number(document.getElementById('entryExpense').value) || 0;
  const total = cash + online;
  document.getElementById('entryTotal').value = money(total);
  document.getElementById('entrySaving').value = money(total - expense);
}
async function handleAddEntry() {
  const payload = {
    action: 'addEntry',
    username: currentUser.Username,
    date: document.getElementById('entryDate').value,
    cashEarning: document.getElementById('entryCash').value || 0,
    onlineEarning: document.getElementById('entryOnline').value || 0,
    expenseAmount: document.getElementById('entryExpense').value || 0,
    expenseReason: document.getElementById('entryExpenseReason').value
  };
  if (!payload.date) { msgBox('entryMsg', 'Please select a date.', 'error'); return; }
  const data = await apiCall(payload, { loadingText: 'Saving entry...' });
  msgBox('entryMsg', data.message, data.success ? 'success' : 'error');
  if (data.success) {
    document.getElementById('entryCash').value = '';
    document.getElementById('entryOnline').value = '';
    document.getElementById('entryExpense').value = '';
    document.getElementById('entryExpenseReason').value = '';
    recalcEntry();
    await loadMissedDates();
  }
}

// ---------- EARNINGS TAB ----------
async function loadEarningsTab() {
  const data = await apiCall({ action: 'getDashboard', username: currentUser.Username }, { loadingText: 'Loading earnings...' });
  if (!data.success) return;
  dashboardCache = data;
  document.getElementById('statLast7').textContent = money(data.stats.last7Days);
  document.getElementById('statMonth').textContent = money(data.stats.thisMonth);
  document.getElementById('statTotal').textContent = money(data.stats.totalEarning);
  document.getElementById('statSaving').textContent = money(data.stats.netSaving);

  document.getElementById('recordsTableBody').innerHTML = data.records.map(r => `
    <tr><td>${r.driver}</td><td>${r.date}</td><td>${money(r.cash)}</td><td>${money(r.online)}</td>
    <td>${money(r.total)}</td><td>${money(r.expense)}</td><td>${r.reason || '—'}</td><td>${money(r.balance)}</td></tr>
  `).join('') || '<tr><td colspan="8" class="text-muted">No entries yet.</td></tr>';

  document.getElementById('depositsTableBody').innerHTML = data.depositHistory.map(r => `
    <tr><td>${r.driver}</td><td>${r.date}</td><td>${money(r.cashDeposit)}</td><td>${money(r.onlineDeposit)}</td><td>${money(r.totalDeposit)}</td></tr>
  `).join('') || '<tr><td colspan="5" class="text-muted">No deposits yet.</td></tr>';
}

// ---------- PROFILE ----------
function populateProfileFields() {
  document.getElementById('profileName').value = currentUser.Name || '';
  document.getElementById('profilePhone').value = currentUser.Phone || '';
  document.getElementById('profileAddress').value = currentUser.Address || '';
  document.getElementById('profileUsername').value = currentUser.Username || '';
  document.getElementById('profilePan').value = currentUser['PAN Number'] || '';
  document.getElementById('profileDob').value = currentUser.DOB || '';
  document.getElementById('profileNotes').value = currentUser['Admin Notes'] || '';
  const preview = document.getElementById('profilePhotoPreview');
  if (currentUser['Photo Data']) {
    preview.innerHTML = `<img src="${currentUser['Photo Data']}" />`;
  } else {
    preview.textContent = (currentUser.Name || '?')[0].toUpperCase();
  }
}
let pendingPhotoData = null;
function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    pendingPhotoData = ev.target.result;
    document.getElementById('profilePhotoPreview').innerHTML = `<img src="${pendingPhotoData}" />`;
  };
  reader.readAsDataURL(file);
}
async function handleUpdateProfile() {
  const payload = {
    action: 'updateProfile',
    username: currentUser.Username,
    name: document.getElementById('profileName').value.trim(),
    phone: document.getElementById('profilePhone').value.trim(),
    address: document.getElementById('profileAddress').value.trim()
  };
  if (pendingPhotoData) payload.photo = pendingPhotoData;
  const data = await apiCall(payload, { loadingText: 'Saving profile...' });
  msgBox('profileMsg', data.message || (data.success ? 'Profile updated.' : 'Update failed.'), data.success ? 'success' : 'error');
  if (data.success) {
    currentUser = data.user;
    document.getElementById('topbarAvatar').innerHTML = currentUser['Photo Data']
      ? `<img src="${currentUser['Photo Data']}" />` : (currentUser.Name || '?')[0].toUpperCase();
  }
}

// ---------- CHAT ----------
async function loadChatTab() {
  const contactsEl = document.getElementById('chatContacts');
  if (currentUser.Role === 'admin') {
    const data = await apiCall({ action: 'listUsers' }, { loadingText: 'Loading contacts...' });
    const drivers = (data.users || []).filter(u => u.Role === 'driver' && u.Status === 'approved');
    contactsEl.innerHTML = drivers.map(d => `<div class="chat-contact" data-u="${d.Username}" onclick="selectChatContact('${d.Username}','${d.Name}')">
        <div class="avatar">${(d.Name||'?')[0].toUpperCase()}</div><div>${d.Name}<div class="text-muted" style="font-size:11px;">${d.Username}</div></div>
      </div>`).join('') || '<p class="text-muted" style="font-size:13px;">No approved drivers yet.</p>';
    if (drivers.length && !chatActiveWith) {
      selectChatContact(drivers[0].Username, drivers[0].Name);
    } else if (chatActiveWith) {
      await refreshChatMessages();
      startChatPolling();
    }
  } else {
    contactsEl.innerHTML = `<div class="chat-contact active"><div class="avatar">A</div><div>Rahul Kumar<div class="text-muted" style="font-size:11px;">Admin</div></div></div>`;
    chatActiveWith = CHAT_ADMIN_USERNAME;
    await refreshChatMessages();
    startChatPolling();
  }
}
function selectChatContact(username, name) {
  chatActiveWith = username;
  document.querySelectorAll('.chat-contact').forEach(el => el.classList.toggle('active', el.dataset.u === username));
  refreshChatMessages();
  startChatPolling();
}
async function refreshChatMessages() {
  if (!chatActiveWith) return;
  const data = await apiCall({ action: 'getChatMessages', username: currentUser.Username, withUser: chatActiveWith }, { silent: true });
  if (!data.success) return;
  const box = document.getElementById('chatMessages');
  const wasAtBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 20;
  box.innerHTML = data.messages.map(m => {
    const mine = m.senderUsername === currentUser.Username;
    const time = new Date(m.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
    return `<div class="bubble ${mine ? 'me' : 'them'}">${escapeHtml(m.message)}<div class="meta">${mine ? 'You' : m.senderName} · ${time}</div></div>`;
  }).join('') || '<p class="text-muted" style="font-size:13px;">No messages yet. Say hello!</p>';
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
async function handleSendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg || !chatActiveWith) return;
  input.value = '';
  const recipientName = currentUser.Role === 'admin'
    ? (document.querySelector('.chat-contact.active') ? document.querySelector('.chat-contact.active').textContent.trim() : '')
    : 'Rahul Kumar';
  await apiCall({
    action: 'sendChatMessage', senderUsername: currentUser.Username, senderName: currentUser.Name,
    senderRole: currentUser.Role, recipientUsername: chatActiveWith, recipientName, message: msg
  }, { silent: true });
  await refreshChatMessages();
}
function startChatPolling() {
  stopChatPolling();
  chatPollTimer = setInterval(refreshChatMessages, CHAT_POLL_MS);
}
function stopChatPolling() {
  if (chatPollTimer) clearInterval(chatPollTimer);
  chatPollTimer = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopChatPolling();
  else if (currentUser && document.getElementById('tab-chat').classList.contains('active')) startChatPolling();
});

// ---------- ADMIN ----------
let allUsersCache = [];
async function loadAdminTab() {
  const [statsData, usersData] = await Promise.all([
    apiCall({ action: 'getAdminStats' }, { silent: true }),
    apiCall({ action: 'listUsers' }, { loadingText: 'Loading admin panel...' })
  ]);

  if (statsData.success) {
    document.getElementById('adminActiveUsers').textContent = statsData.stats.activeUsers;
    document.getElementById('adminPending').textContent = statsData.stats.pendingApprovals;
    document.getElementById('adminAvgEarning').textContent = money(statsData.stats.avgDailyEarning);
    document.getElementById('adminAvgExpense').textContent = money(statsData.stats.avgExpense);

    document.getElementById('pendingTableBody').innerHTML = statsData.pendingUsers.map(u => `
      <tr><td>${u.Name}</td><td>${u.Username}</td><td>${u.Phone}</td><td>${u['PAN Number']}</td>
      <td>${new Date(u['Created At']).toLocaleDateString('en-IN')}</td>
      <td>
        <button class="btn btn-sm" style="background:var(--green);color:#08130e;margin-right:6px;" onclick="handleApprove('${u.Username}')">Approve</button>
        <button class="btn btn-sm btn-danger" onclick="handleReject('${u.Username}')">Reject</button>
      </td></tr>
    `).join('') || '<tr><td colspan="6" class="text-muted">No pending approvals.</td></tr>';
  }

  if (usersData.success) {
    allUsersCache = usersData.users;
    document.getElementById('allUsersTableBody').innerHTML = usersData.users.map(u => `
      <tr><td>${u.Name}</td><td>${u.Username}</td><td>${u.Phone}</td>
      <td><span class="badge ${u.Status}">${u.Status}</span></td><td>${u.Role}</td>
      <td>${u['Created At'] ? new Date(u['Created At']).toLocaleDateString('en-IN') : '—'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="handleDeleteUser('${u.Username}')" ${u.Role==='admin'?'disabled':''}>Delete</button></td></tr>
    `).join('');

    const drivers = usersData.users.filter(u => u.Role === 'driver' && u.Status === 'approved');
    const select = document.getElementById('depositDriverSelect');
    select.innerHTML = drivers.map(d => `<option value="${d.Username}">${d.Name} (${d.Username})</option>`).join('');
    if (drivers.length) await handleDepositDriverChange();
  }
}
async function handleApprove(username) {
  const data = await apiCall({ action: 'approveUser', username }, { loadingText: 'Approving...' });
  if (data.success) await loadAdminTab();
}
async function handleReject(username) {
  if (!confirm('Reject this registration?')) return;
  const data = await apiCall({ action: 'rejectUser', username }, { loadingText: 'Rejecting...' });
  if (data.success) await loadAdminTab();
}
async function handleDeleteUser(username) {
  if (!confirm(`Delete user ${username}? This cannot be undone.`)) return;
  const data = await apiCall({ action: 'deleteUser', username }, { loadingText: 'Deleting...' });
  if (data.success) await loadAdminTab();
}
async function handleDepositDriverChange() {
  const username = document.getElementById('depositDriverSelect').value;
  if (!username) return;
  const data = await apiCall({ action: 'getDashboard', username }, { silent: true });
  if (!data.success) return;
  document.getElementById('depCashAvail').textContent = money(data.wallet.cashAvailable);
  document.getElementById('depOnlineAvail').textContent = money(data.wallet.onlineAvailable);
  document.getElementById('depPending').textContent = money(data.wallet.availableBalance);
}
async function handleDepositNow() {
  const username = document.getElementById('depositDriverSelect').value;
  const cashDeposit = document.getElementById('depCashInput').value || 0;
  const onlineDeposit = document.getElementById('depOnlineInput').value || 0;
  if (!username) { msgBox('depositMsg', 'Select a driver first.', 'error'); return; }
  const data = await apiCall({ action: 'addDeposit', username, cashDeposit, onlineDeposit }, { loadingText: 'Processing deposit...' });
  msgBox('depositMsg', data.message, data.success ? 'success' : 'error');
  if (data.success) {
    document.getElementById('depCashInput').value = '';
    document.getElementById('depOnlineInput').value = '';
    await handleDepositDriverChange();
    await loadAdminTab();
  }
}

// ---------- INIT ----------
window.addEventListener('DOMContentLoaded', () => {
  setLoginRole('driver');
  if (!API_URL || API_URL.indexOf('PASTE_YOUR') === 0) {
    msgBox('loginMsg', 'Backend not configured yet. Set API_URL in js/config.js.', 'error');
  }
});
