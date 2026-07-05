# DealsKart Auto Diary

A dark-themed web app for auto drivers to log daily earnings/expenses and for admin to manage drivers, approvals, deposits and chat — backed entirely by **Google Sheets** via **Google Apps Script**.

## 1. Set up the Google Sheet + Apps Script backend

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet. Name it e.g. `DealsKart Auto Diary DB`.
2. In the sheet, go to **Extensions → Apps Script**.
3. Delete any starter code in `Code.gs`, then paste in the full contents of `gas/Code.gs` from this project.
4. In the Apps Script editor toolbar, select the function `setupSheets` from the dropdown next to "Debug", then click **Run**.
   - The first run will ask you to authorize the script — approve it (it only touches this one spreadsheet).
   - This creates the 4 tabs (`Users`, `AutoEarnings`, `BankDeposits`, `ChatMessages`) with correct headers and seeds the default admin account:
     - **Username:** `RAHUL`
     - **Password:** `1912`
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, authorize again if asked, then copy the **Web app URL** (ends in `/exec`).

> Whenever you edit `Code.gs` later, use **Deploy → Manage deployments → Edit (pencil) → New version** so the live URL picks up your changes.

## 2. Connect the frontend

1. Open `js/config.js`.
2. Replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the Web app URL you copied above.

```js
const API_URL = 'https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec';
```

## 3. Deploy the frontend to GitHub Pages

1. Create a new GitHub repository (e.g. `dealskart-auto-diary`).
2. Push the entire project folder (`index.html`, `css/`, `js/`) to the repo's default branch.
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`, choose your branch (e.g. `main`) and folder `/ (root)`.
5. Save. GitHub will give you a URL like `https://yourusername.github.io/dealskart-auto-diary/`.
6. Open that URL — the app is live.

## 4. Logging in

- **Admin:** Toggle "Admin Login", username `RAHUL`, password `1912`.
- **Driver:** New drivers use "Create driver account" on the login screen. Their account is created with status `pending` and only becomes usable once an admin approves it from the **Admin → Pending Approvals** table.

## 5. Google Sheets column mapping

### `Users`
| Column | Meaning |
|---|---|
| Role | `admin` or `driver` |
| Name | Full name |
| Username | Login username (unique) |
| PAN Number | Used for password-reset verification |
| DOB | Date of birth, used for password-reset verification |
| Password Hash | SHA-256 hash — never plain text |
| Status | `pending`, `approved`, or `rejected` |
| Created At | ISO timestamp of registration |
| Photo Data | Base64 data URI of profile photo |
| Phone | Phone number |
| Address | Address |
| Admin Notes | Optional notes admin adds (e.g. rejection reason) |
| Approved At | ISO timestamp of approval |

### `AutoEarnings`
| Column | Meaning |
|---|---|
| Driver Name | Denormalized name for quick reading |
| Username | Owner of the entry |
| Entry Date | `yyyy-MM-dd` |
| Cash Earning | ₹ cash earned that day |
| Online Earning | ₹ online/UPI earned that day |
| Total Earning | Cash + Online (auto-computed) |
| Expense Amount | ₹ spent that day |
| Expense Reason | Free text |
| Balance | Total Earning − Expense |
| Created At | ISO timestamp |

### `BankDeposits`
| Column | Meaning |
|---|---|
| Driver Name | Denormalized name |
| Username | Owner |
| Deposit Date | `yyyy-MM-dd` |
| Cash Deposit | ₹ moved from cash-available to deposited |
| Online Deposit | ₹ moved from online-available to deposited |
| Total Deposit | Cash + Online deposit |
| Created At | ISO timestamp |

### `ChatMessages`
| Column | Meaning |
|---|---|
| Thread Id | `sorted(usernameA, usernameB)` joined by `__` |
| Sender Username | Who sent it |
| Sender Name | Display name of sender |
| Sender Role | `driver` or `admin` |
| Recipient Username | Who it's addressed to |
| Recipient Name | Display name of recipient |
| Message | Text content |
| Created At | ISO timestamp |

## 6. How the wallet math works

- **Available cash/online** = earnings so far **minus** expenses **minus** amounts already deposited (never just total earnings).
- Expenses are deducted from cash first; if cash goes negative, the remainder is borrowed from online — this keeps "available" numbers realistic even on heavy-expense days.
- Only admin can trigger `addDeposit`, and it's capped so a driver can never "deposit" more than what's currently available.

## 7. Notes on behavior

- **Duplicate entries** for the same date are blocked server-side.
- **Future dates** are rejected server-side.
- **Missed dates** are computed from account creation date (or last 60 days, whichever is shorter) up to today, excluding dates that already have an entry.
- **Auto logout** happens after 2 minutes of no mouse/keyboard/touch activity; the top bar shows a live countdown. On expiry, you're returned to login with the username prefilled.
- **Chat polling** runs every 4 seconds only while the Chat tab is open and the browser tab is visible — it pauses automatically when you switch tabs or minimize the window, and never triggers the full-screen loading overlay.
- Passwords are hashed with SHA-256 in Apps Script (`Utilities.computeDigest`) before being written to the sheet — plain-text passwords are never stored.

## 8. Customizing the look

All colors live in `css/style.css` under the `:root` block (`--accent`, `--accent-2`, `--bg-0` etc.) — change these to match your exact DealsKart brand palette without touching layout code.
