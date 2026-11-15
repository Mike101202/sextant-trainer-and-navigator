import os
import re
import subprocess
import sys

filename = 'index.html'

if not os.path.exists(filename):
    print(f"Error: Could not find {filename}")
    exit()

with open(filename, 'r', encoding='utf-8') as f:
    html = f.read()

# ---------------------------------------------------------
# PATCH 1: Rearrange the Tabs
# ---------------------------------------------------------
new_nav = '''<nav id="nav">
  <button data-p="sights" class="on">Sights</button>
  <button data-p="midday" id="navMidday">Midday</button>
  <button data-p="fix">Fix</button>
  <button data-p="mancalc" id="navMancalc" hidden>Manual</button>
  <button data-p="almanac">Almanac</button>
  <button data-p="setup">Setup</button>
  <button data-p="examples">Examples</button>
  <button data-p="readme">README</button>
  <button data-p="library">Library</button>
</nav>'''

pattern_nav = re.compile(r'<nav id="nav">.*?</nav>', re.DOTALL)
if pattern_nav.search(html):
    html = pattern_nav.sub(new_nav, html)
    print("✅ Tabs rearranged.")
else:
    print("⚠️ Could not find the <nav> block.")

# ---------------------------------------------------------
# PATCH 2: Update the In-App README
# ---------------------------------------------------------
new_readme_html = '''<section id="readme" hidden>
  <div class="card">
    <b>Sextant Trainer — Fully Offline</b>
    <div class="mu">A free, fully offline sextant trainer for celestial navigation practice. Works in any modern browser, installs to the home screen as a PWA, and functions with no internet connection once loaded.</div>
  </div>
  
  <div class="card">
    <b>The Two Ways to Use the App</b>
    <div class="mu">
      <b>1. Auto Mode (The Fast Way)</b><br>
      Go to Sights, select a body, press SIGHT, enter Hs, and press Save. The app instantly calculates Ho, Hc, Zn, and the intercept. Tick it and go to Fix.<br><br>
      <b>2. Manual Mode (The Paper Way)</b><br>
      Go to Setup and change "Level of assistance" to <b>Full manual</b>. This reveals the <b>Manual tab</b>. Take your sight, then go to the Manual tab to work through a step-by-step worksheet (based on the Vanderbilt form) using your printed Nautical Almanac and Pub 229.
    </div>
  </div>

  <div class="card">
    <b>Getting a Fix</b>
    <div class="mu">To calculate a fix, tick at least two sightings in the Sights list and go to the Fix tab.<br><br>
    <b>What makes a good fix?</b><br>
    · <b>Geometry:</b> Lines of position should cross near 90°. Watch for azimuth spread warnings.<br>
    · <b>Intercepts:</b> Small intercepts (under 3–5 nm) usually mean good sights.<br>
    · <b>Scatter:</b> With 3+ sights, the RMS scatter shows if one sight is bad.<br>
    · <b>Direct Fix:</b> With exactly two stationary sights, the Van Allen two-circle intersection is calculated as a cross-check.</div>
  </div>

  <div class="card">
    <b>Running Fixes</b>
    <div class="mu">Combines sights of the same body taken hours apart while moving. Tick "Running fix session" in the Sights tab, enter track and speed, and take your sights. The app advances earlier lines of position along your track.</div>
  </div>

  <div class="card">
    <b>The 15-Hour Lifecycle</b>
    <div class="mu">To prevent clutter, sights automatically untick after 15 hours. Sights in an open Running Fix session are exempt. You can adjust the time limit in Setup.</div>
  </div>

  <div class="card">
    <b>Publication Library</b>
    <div class="mu">The Library tab has direct download links for public-domain Pub. 229 and the Nautical Almanac. On Chrome, Edge, or Brave, you can connect a local folder. The app will remember it and allow you to open your PDFs directly from the Manual tab.</div>
  </div>

  <div class="card">
    <b>Midday fit (zenith-distance)</b>
    <div class="mu">The Midday tab fits the parabola <b>z² = A + B·t + C·t²</b> across ticked Sun sightings to find true noon time (longitude) and latitude. A quality check reports if the sightings span noon.</div>
  </div>

  <div class="card">
    <b>Accuracy Hierarchy</b>
    <div class="mu"><b>The app's ephemeris is coarser than the printed Nautical Almanac.</b> The Sun is good to ±0.6′, stars to ±0.3′, the Moon to ±0.3′, planets to ±1–2′. When the app and the printed book disagree, trust the printed book.</div>
  </div>

  <div class="card">
    <b>Expected fix accuracy</b>
    <table>
      <tr><th>Condition</th><th>Typical</th></tr>
      <tr><td>2 sights, good geometry</td><td>2–5 nm</td></tr>
      <tr><td>3+ sights, ~90° apart</td><td>1–3 nm</td></tr>
      <tr><td>Running fix, Sun morning + afternoon</td><td>3–6 nm</td></tr>
      <tr><td>Midday zenith-distance fit</td><td>±0.5–2 nm</td></tr>
      <tr><td>Noon latitude (single sight)</td><td>±0.5–1 nm</td></tr>
    </table>
  </div>

  <div class="card">
    <b>Corrections applied</b>
    <ul style="list-style:disc;padding-left:20px">
      <li>Index error · Dip (or bubble = 0)</li>
      <li>Refraction: Bennett (1982) · Parallax · Semi-diameter</li>
      <li>Star precession &amp; proper motion</li>
      <li>Planet precession, light-time, annual aberration</li>
      <li>Nutation in longitude via GAST</li>
    </ul>
  </div>

  <div class="card">
    <b>Credits</b>
    <div class="mu" style="font-size:11px">
      Sextant diagram: Joaquim Alves Gaspar, Wikimedia Commons, CC BY-SA 3.0.<br>
      Ephemeris: Meeus Astronomical Algorithms, ELP-2000/82 (Moon), JPL Keplerian elements (Planets), IAU 1976 precession.
    </div>
  </div>
</section>'''

pattern_readme = re.compile(r'<section id="readme" hidden>.*?</section>', re.DOTALL)
if pattern_readme.search(html):
    html = pattern_readme.sub(new_readme_html, html)
    print("✅ In-app README updated.")
else:
    print("⚠️ Could not find the README section.")

# Save the patched index.html
with open(filename, 'w', encoding='utf-8') as f:
    f.write(html)

# ---------------------------------------------------------
# PATCH 3: Bump the Service Worker Cache
# ---------------------------------------------------------
sw_file = 'sw.js'
if os.path.exists(sw_file):
    with open(sw_file, 'r', encoding='utf-8') as f:
        sw = f.read()
    
    # Find the current version and bump it (e.g., v1.0.5 -> v1.0.6)
    match = re.search(r"const CACHE = 'sextant-v(\d+)\.(\d+)\.(\d+)';", sw)
    if match:
        major, minor, patch = map(int, match.groups())
        new_version = f"sextant-v{major}.{minor}.{patch + 1}"
        sw = re.sub(r"const CACHE = 'sextant-v\d+\.\d+\.\d+';", f"const CACHE = '{new_version}';", sw)
        
        with open(sw_file, 'w', encoding='utf-8') as f:
            f.write(sw)
        print(f"✅ Bumped service worker cache to {new_version}")
    else:
        print("⚠️ Could not find CACHE version string in sw.js. You may need to bump it manually.")
else:
    print("⚠️ sw.js not found.")

# ---------------------------------------------------------
# PATCH 4: Automatically push to GitHub
# ---------------------------------------------------------
print("\n🚀 Preparing to push to GitHub...")
try:
    # Check if we are in a git repo
    subprocess.run(["git", "status"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Git Add
    print("Adding files...")
    subprocess.run(["git", "add", "index.html", "sw.js"], check=True)
    
    # Git Commit
    print("Committing changes...")
    subprocess.run(["git", "commit", "-m", "Reorder tabs, update in-app README, bump cache"], check=True)
    
    # Git Push
    print("Pushing to origin main...")
    subprocess.run(["git", "push", "origin", "main"], check=True)
    
    print("🎉 Successfully pushed to GitHub!")
    print("Wait 1-2 minutes for GitHub Pages to deploy, then hard-refresh your live site.")
except subprocess.CalledProcessError as e:
    print(f"\n❌ Git command failed. Make sure you are in the git repository folder.")
    print("You may need to commit and push manually.")
except FileNotFoundError:
    print("\n❌ Git is not installed or not recognized in this terminal.")