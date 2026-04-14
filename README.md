# DealsKart Auto Driver Earning Diary

Ye animated static website daily auto earning ko Google Sheet me save karti hai. Cash earning, online earning, total earning, expense, expense reason aur balance Google Sheet me date-wise store hota hai.

## Website me kya hai

- Login screen: user username + password se login karega
- User registration: name, username, PAN number, date of birth aur password
- Forgot password: username + PAN number + date of birth verify karke new password set hoga
- Language switcher: English, Hindi aur Gujarati
- Password Google Sheet me plain text me nahi dikhega; SHA-256 hash store hota hai
- Admin login: username `RAHUL`, password `1912`
- Admin dashboard: registered users dekh sakte hain, new user create kar sakte hain, user delete kar sakte hain
- DealsKart logo style theme: dark navy, cyan, green aur coin yellow
- Current date automatic fill hoti hai aur readonly hai
- Ek date ke liye only one entry allowed hai
- Duplicate date par Google Apps Script error return karega: `Data already entered for this date.`
- Money Wallet card me cash available, online available aur total deposited dikhega
- Available amount earning me se expense minus karke calculate hota hai
- `Deposit Now` click karte hi available cash/online `Bank Deposits` sheet me save hoga
- Deposit ke baad available amount zero ho jayega, phir daily entries ke saath dobara badhega
- Cash aur online earning alag input
- Total earning automatic calculate
- Expense aur expense reason input
- Balance automatic calculate
- Earnings tab me last 7 days, current month, total earning, total expense aur net saving
- Google Sheet se full records fetch hote hain

## Logo

`assets/company-logo.svg` me theme logo add hai. Agar aap exact uploaded image use karna chahte hain, us image ko `assets/company-logo.png` ke naam se save karke HTML me `assets/company-logo.svg` ko `assets/company-logo.png` se replace kar dein.

## Google Sheet Setup

1. Google Sheet create karein.
2. Sheet me `Extensions > Apps Script` open karein.
3. `google-apps-script/Code.gs` ka code Apps Script editor me paste karein.
4. `Deploy > New deployment` par click karein.
5. Type me `Web app` choose karein.
6. `Execute as` me `Me` choose karein.
7. `Who has access` me `Anyone` choose karein.
8. Deploy karein aur Web app URL copy karein.
9. `script.js` me Web app URL already set hai. Agar aap naya Apps Script deploy karte hain to top line me `SCRIPT_URL` ko naye URL se replace karein.

Google Sheet me `Users`, `Auto Earnings` aur `Bank Deposits` naam ki sheets automatic banengi aur columns set ho jayenge. `Users` sheet me admin username `RAHUL` automatic create hota hai.

## GitHub Pages Hosting

1. GitHub par new repository banayein.
2. Is folder ke files repository me upload/push karein.
3. Repository settings me `Pages` open karein.
4. Source me branch `main` aur folder `/root` select karein.
5. GitHub Pages URL open karke website test karein.

## Android APK

`android` folder me Auto Diary APK ka Android Studio project add hai.

- App name: `Auto Diary`
- Default reminder: daily `9:00 PM`
- Reminder button se time change kar sakte hain
- Notification text: `Aaj ka data entry karo.`
- APK build ke time website files automatically app assets me copy hoti hain

Build steps:

1. Android Studio open karein.
2. `android` folder ko project ke roop me open karein.
3. Gradle sync complete hone dein.
4. `Build > Build Bundle(s) / APK(s) > Build APK(s)` select karein.
5. APK `android/app/build/outputs/apk/debug/app-debug.apk` me milega.

## Important

Jab bhi Apps Script me code update karein, `Deploy > Manage deployments > Edit > New version > Deploy` karke latest Web App deployment update karein.
