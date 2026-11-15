# Sextant Trainer

A free, fully offline sextant trainer for celestial navigation practice. Works in any modern browser, installs to the home screen as a PWA, and functions with no internet connection once loaded.

**[Try it live →](https://mike101202.github.io/sextant-trainer-and-navigator/)**

## Features

- **Two Main Workflows** — a fast **Auto** mode for instant fixes, and a dedicated **Manual** mode for practicing paper-based sight reduction.
- **Manual Worksheet (ManCalc)** — a full, step-by-step sight reduction worksheet based on the Vanderbilt standard form. It breaks down Hs → Ho, Almanac lookups, LHA/Dec, and the intercept, with optional auto-fill hints for every step.
- **Publication Library** — direct download links for public-domain Pub. 229 (Vol 1–6), the Nautical Almanac, and GHA Aries tables. On supported browsers (Chrome, Edge, Brave), you can link a local folder so the app can open your PDFs directly from the Manual tab.
- **Running fix** — combine two or more sightings of the same body across time, with dead-reckoning advance.
- **Midday zenith-distance fit** — fits z² vs time across morning and afternoon Sun sightings to give noon time (→ longitude) and latitude.
- **Direct fix** — two-circle intersection solution (Van Allen), independent of the intercept method.
- **Practice almanac** — hourly GHA/Dec for Sun, Moon, planets, Aries and stars; printable daily pages.
- **Works completely offline** — PWA with a service worker; nothing is fetched after first load.
- **No accounts, no tracking, no data collection.** Everything stays on your device.

## Getting Started

Before taking a sight, you must configure the **Setup** tab:
- **Assumed Position (AP)**: The intercept method requires an AP. Set this to **Auto GPS**, **Last Known**, or **Manual** (enter lat/lon).
- **Height of Eye** (in metres): Used to calculate the dip of the horizon. Tick "Bubble sextant" if flying (sets dip to zero).
- **Index Correction (IE)**: The error of your sextant, in arcminutes.
- **Limb**: Choose Lower (L) or Upper (U) for the Sun and Moon.
- **Lag**: The time in seconds between taking the sight and pressing the button (reaction time).

## The Two Ways to Use the App

### Way 1: Auto Mode (The Fast Way)
Use this if you just want the app to do all the math and plot your position.

1. Go to the **Sights** tab.
2. Select your Body and Time (toggle between UT and Local time using the checkbox).
3. Press **SIGHT** to lock in the time, and enter your Sextant Altitude (Hs).
4. Press **Save sight**. 
5. The app instantly calculates Ho, Hc, Zn, and the intercept. 
6. Tick the sight in the list, go to the **Fix** tab, and your position is plotted.

### Way 2: Manual Mode (The Paper Way)
Use this to practice looking up values in your printed Nautical Almanac and Pub. 229.

1. Go to **Setup** and change the **Level of assistance** to **Full manual**. *This action reveals the new **Manual** tab in the top navigation.*
2. Go to the **Sights** tab, take your sight, and press **Save sight**.
3. Go to the new **Manual** tab. You will see a worksheet for your sighting, mirroring the Vanderbilt standard form.
4. Work through the sheet using your paper books:
   - **Section I (Hs → Ho):** Enter your corrections from the almanac.
   - **Section III & IV (Almanac & Pub 229):** Enter your GHA, Dec, Hc, and Z lookups.
   - **Hints:** Click the `○` button next to any row to reveal a hint, or click it again to let the app auto-fill the value (`✓`) so you can check your work.
   - **Library:** If you connected a local folder in the Library tab, you can click the "📖 Open Vol" link next to the Pub 229 row to open your PDF instantly.
5. Once the intercept is calculated, tick the sight in the list, and go to the **Fix** tab.

*(Note: You can also change individual sights to **Tables** mode in the Sights list if you want to type in your Hc and Zn directly without using the full worksheet).*

## Getting a Fix

To calculate a fix, you need at least **two ticked sightings** in the Sights list. Once ticked, go to the **Fix** tab.

**What makes a good fix?**
- **Geometry**: The lines of position (LOPs) should cross at roughly 90°. If the bodies are too close together in the sky, your fix will be unreliable. The Fix tab will show an "Azimuth spread" warning if the angle is too narrow.
- **Intercepts**: Small intercepts (under 3–5 nm) usually mean good sights. Large intercepts mean either a calculation error, an index error, or a misidentified body.
- **Scatter**: If you take 3 or more sights, the app calculates an RMS scatter. A high scatter means one of your sights is a "bum sight" and should be unticked.
- **Direct Fix**: If you have exactly two stationary sightings ticked, the app also calculates the independent Van Allen two-circle intersection as a cross-check.

## Running Fixes

A running fix allows you to combine multiple sights of the *same body* taken hours apart (e.g., the Sun in the morning and the Sun in the afternoon) while the vessel is moving.
1. In the Sights tab, tick **Running fix session** and enter your Track Made Good (°T) and Speed Made Good (knots).
2. Take your sights. Each time you press "Save sight", it joins the session.
3. When you stop moving (or want to freeze the session), untick the **Running fix session** box.
4. On the Fix tab, tick sightings from that specific session. The app will automatically dead-reckon (advance) the earlier lines of position along your track so they intersect properly.

## The 15-Hour Sightings Lifecycle

To keep the app clean and prevent stale data from cluttering your Fix tab, sights have a lifecycle:
- By default, sights automatically **untick themselves after 15 hours**. You can adjust this in the Setup tab.
- If a sight is currently part of an **open Running Fix session**, it is exempt from the 15-hour rule.
- You can delete a sight entirely by clicking the **✕** button next to it in the list.

## Publication Library

The app includes a **Library** tab with direct links to download the official, public-domain *Pub. 229* (all 6 volumes) and various *Nautical Almanac* PDFs. 

If you are using Chrome, Edge, or Brave, you can click **Choose Library Folder**. The app will remember your folder, allowing you to open the PDFs directly from the Manual tab while you do your calculations.

A well-maintained archive of these public-domain PDFs is at **https://thenauticalalmanac.com/**

## F-Droid

An F-Droid release is planned. Once the listing is live it will appear here.

To build the Android APK yourself, this app can be wrapped with [Capacitor](https://capacitorjs.com/):

```bash
npm install
npx cap add android
npx cap sync
cd android && ./gradlew assembleRelease



Accuracy

The app's ephemeris is coarser than the printed Nautical Almanac. The Sun is good to about ±0.6′, stars to ±0.3′, the Moon to ±0.3′, and planets to ±1–2′ (or worse for Jupiter and Saturn). When the app and the printed almanac disagree, trust the printed almanac. The app is a practice tool, not a navigation reference standard.

Expected fix accuracy for celestial positions derived with this app:
Condition	Typical
2 sights of different bodies, good geometry	2–5 nm
3+ sights, bodies ~90° apart	1–3 nm
Running fix, Sun morning + afternoon	3–6 nm
Midday zenith-distance fit (good span)	±0.5–2 nm
Noon latitude from a single sight	±0.5–1 nm
Accuracy of the almanac itself

The built-in almanac is computed from the same ephemeris as the app — Meeus, Astronomical Algorithms, with the ELP-2000 series for the Moon and JPL approximate elements for the planets. It is suitable for practice and for cross-checking, not for primary navigation.
Contributing

Bug reports and suggestions welcome — please open an issue on GitHub.
Credits

    Sextant diagram: Joaquim Alves Gaspar, Wikimedia Commons, Marine sextant.svg, CC BY-SA 3.0.

    Moon position: ELP-2000/82 truncated series, from Meeus, Astronomical Algorithms.

    Sun position: Meeus low-precision solar coordinates.

    Planet positions: JPL approximate Keplerian elements (Standish), with light-time, aberration and precession applied.

    Star catalogue: J2000 positions with proper motion and IAU 1976 precession.
