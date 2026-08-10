REPO SPORTS — BARRY V3 EMERGENCY BROWSER-CRASH RECOVERY

Cause fixed:
The V3 Barry button MutationObserver watched attributes that its own callback rewrote, creating a recursive mutation loop capable of freezing/crashing the browser tab.

Recovery changes:
- MutationObserver removed completely.
- Barry button state sync reduced to a lightweight once-per-second check.
- Attribute/class/text updates occur only when the value actually changes.
- V3 tipping RPC names are retained, so if you already ran fix-barry-bramble-tipping-v3.sql you do not need to run it again.
- All current World Cup, Meet the Teams, TCG full-art and expanded binder work remains in this build.

Apply:
Replace index.html and script.js with these files. Hard refresh once after deployment.
