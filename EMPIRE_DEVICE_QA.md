# Empire Systems — Device QA Checklist

Manual phone/emulator testing for Crew, Businesses, Properties, and Storage.
Run on a **dev build** with a save that has cash to hire/buy, or use Store dev credits if needed.

**Tester:** _______________  
**Device / OS:** _______________  
**Build date:** _______________  
**Save slot:** New game / Continue _______________

---

## How to use

1. Complete each step in order (or jump to a section if retesting).
2. Mark **Pass** or **Fail** for each item.
3. Note any crash, wrong number, or missing UI in **Notes**.

Legend: ☐ Pass · ☐ Fail

---

## 1. Crew

| Step | Action | Expected result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 1.1 | From Game hub, open **Crew** (bottom nav or link) | Crew screen loads with premium header, payroll summary, empty state or hired list | ☐ | ☐ | |
| 1.2 | If recruits available, tap **Hire** on a Runner (or any recruit) | Cash decreases by hire cost; crew appears in hired list; success message | ☐ | ☐ | |
| 1.3 | Tap a **hired crew card** | **Crew Detail** opens with portrait placeholder, role badge, stat bars, assignment buttons | ☐ | ☐ | |
| 1.4 | On Crew Detail, tap an assignment (e.g. **Run Local Sales**) | Assignment updates; recent event appears in timeline | ☐ | ☐ | |
| 1.5 | Advance day (**Stay Here** or travel) | Payroll line in day summary; morale/stress/loyalty change reasonably; Finance log entry if cash paid | ☐ | ☐ | |
| 1.6 | On Crew Detail, tap **Fire** | Crew removed from active list; message confirms; business/property manager slots cleared if assigned | ☐ | ☐ | |

---

## 2. Businesses

| Step | Action | Expected result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 2.1 | Travel to area with a purchasable front (e.g. Harlem pawn shop) | **Businesses** screen shows portfolio summary + local available card | ☐ | ☐ | |
| 2.2 | Tap **Buy** on an available business | Cash decreases; business moves to owned list; success message | ☐ | ☐ | |
| 2.3 | Tap **owned business card** | **Business Detail** opens with income/upkeep, condition, upgrade chips | ☐ | ☐ | |
| 2.4 | Tap a **Security** (or other) upgrade | Cash decreases; upgrade level increases; finance log entry | ☐ | ☐ | |
| 2.5 | Assign a **Dealer / Accountant / Fixer** as manager (if hired) | Manager name shown; assignedCrew linked | ☐ | ☐ | |
| 2.6 | Advance day | Business income/upkeep/laundering reflected in Finance screen and day summary | ☐ | ☐ | |

---

## 3. Properties (Safehouses)

| Step | Action | Expected result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 3.1 | Open **Properties** (Safehouses screen) | Portfolio summary; owned/available cards with security/storage stats | ☐ | ☐ | |
| 3.2 | Buy a property on-site | Cash decreases; property in owned list; storage initialized | ☐ | ☐ | |
| 3.3 | Tap **owned property card** | **Property Detail** opens with upgrades, guard slot, event timeline | ☐ | ☐ | |
| 3.4 | Upgrade **Storage Expansion** or **Locks** | Cash decreases; effective storage/security updates on card | ☐ | ☐ | |
| 3.5 | Assign **Enforcer / Lookout** as guard (if hired) | Guard shown on detail; assignment persists after day advance | ☐ | ☐ | |

---

## 4. Storage

| Step | Action | Expected result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 4.1 | Open **Storage** (Inventory) with product carried | Carried section shows units; link to Properties visible | ☐ | ☐ | |
| 4.2 | At owned local property, **Deposit** units | Carried decreases; stored increases; total unchanged | ☐ | ☐ | |
| 4.3 | **Withdraw** stored units | Carried increases; stored decreases; no duplicate totals | ☐ | ☐ | |
| 4.4 | Try deposit over capacity | Blocked with clear “property full” message | ☐ | ☐ | |
| 4.5 | Property Storage subtitle shows **Security L#** and effective capacity | Matches upgrades on Property Detail | ☐ | ☐ | |

---

## 5. Persistence (critical)

| Step | Action | Expected result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 5.1 | With hired crew, owned business, property, stored goods, and assignments set — **force-close app** | — | ☐ | ☐ | |
| 5.2 | Reopen app → **Continue** | Save loads; no crash | ☐ | ☐ | |
| 5.3 | Verify Crew assignments & recent events | Same as before close | ☐ | ☐ | |
| 5.4 | Verify Business upgrades & manager | Same as before close | ☐ | ☐ | |
| 5.5 | Verify Property upgrades & guard | Same as before close | ☐ | ☐ | |
| 5.6 | Verify **stored inventory** quantities | Match pre-close totals | ☐ | ☐ | |

---

## 6. Finance cross-check

| Step | Action | Expected result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 6.1 | Open **Finance** screen | Business Empire block shows net income/upkeep/laundering | ☐ | ☐ | |
| 6.2 | After day with crew + businesses | Payroll, business income/upkeep entries in finance log | ☐ | ☐ | |
| 6.3 | If Store **crew loyalty** consumable used (optional) | `payrollCredits` banked on Store screen; next day payroll uses credit without draining cash; finance log shows **Store effect** | ☐ | ☐ | |

---

## 7. Edge cases (optional manual)

| Step | Action | Expected result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 7.1 | Navigate to Crew Detail with invalid/deep link id (if testable) | “Crew member not found” + Back button; **no crash** | ☐ | ☐ | |
| 7.2 | Same for Business / Property Detail | “Not found” empty state; **no crash** | ☐ | ☐ | |
| 7.3 | Fire crew assigned as manager/guard | Slots cleared; no orphaned assignments on detail screens | ☐ | ☐ | |

---

## Sign-off

| Area | Pass | Fail | Blocker notes |
|------|------|------|---------------|
| Crew | ☐ | ☐ | |
| Businesses | ☐ | ☐ | |
| Properties | ☐ | ☐ | |
| Storage | ☐ | ☐ | |
| Persistence | ☐ | ☐ | |
| Finance | ☐ | ☐ | |

**Overall:** ☐ Ship · ☐ Blocked  

**Automated regression (run before device QA):**

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/empireSmokeTest.ts
npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/empireEdgeCaseTest.ts
npx tsc --noEmit
npx expo-doctor
```
