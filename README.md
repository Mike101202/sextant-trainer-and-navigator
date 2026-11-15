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
2. Select your Body and Time.
3. Press **SIGHT** to lock in the time, and enter your Sextant Altitude (Hs).
4. Press **Save sight**. The app instantly calculates Ho, Hc, Zn, and the intercept.
5. Tick the sight, go to the **Fix** tab, and your position is plotted.

### Way 2: Manual Mode (The Paper Way)
Use this to practice looking up values in your printed Nautical Almanac and Pub. 229.
1. Go to **Setup** and change the **Level of assistance** to **Full manual**. *This reveals the new **Manual** tab.*
2. Go to the **Sights** tab, take your sight, and press **Save sight**.
3. Go to the new **Manual** tab. You will see a worksheet for your sighting, mirroring the Vanderbilt standard form.
4. Work through the sheet using your paper books. Use the `○` button to reveal hints, or `✓` to let the app check your work.
5. Once the intercept is calculated, tick the sight, and go to the **Fix** tab.

## Getting a Fix

To calculate a fix, you need at least **two ticked sightings**. 
- **Geometry**: Lines of position should cross near 90°.
- **Intercepts**: Small intercepts (under 3–5 nm) usually mean good sights.
- **Scatter**: With 3+ sights, the RMS scatter shows if one sight is bad.
- **Direct Fix**: With exactly two stationary sights, the Van Allen two-circle intersection is calculated as a cross-check.

## Running Fixes

Combines sights of the same body taken hours apart while moving. Tick "Running fix session" in the Sights tab, enter track and speed, and take your sights. The app advances earlier lines of position along your track.

## The 15-Hour Lifecycle

To prevent clutter, sights automatically untick after 15 hours. Sights in an open Running Fix session are exempt. You can adjust the time limit in Setup.

## Accuracy

The app's ephemeris is coarser than the printed Nautical Almanac. The Sun is good to ±0.6′, stars to ±0.3′, the Moon to ±0.3′, planets to ±1–2′. When the app and the printed book disagree, trust the printed book.

| Condition | Typical |
| :--- | :--- |
| 2 sights, good geometry | 2–5 nm |
| 3+ sights, ~90° apart | 1–3 nm |
| Running fix, Sun morning + afternoon | 3–6 nm |
| Midday zenith-distance fit | ±0.5–2 nm |
| Noon latitude (single sight) | ±0.5–1 nm |

## Credits

- **Sextant diagram:** Joaquim Alves Gaspar, Wikimedia Commons, CC BY-SA 3.0.
- **Moon position:** ELP-2000/82 truncated series, from Meeus, Astronomical Algorithms.
- **Sun position:** Meeus low-precision solar coordinates.
- **Planet positions:** JPL approximate Keplerian elements (Standish), with light-time, aberration and precession applied.
- **Star catalogue:** J2000 positions with proper motion and IAU 1976 precession.
