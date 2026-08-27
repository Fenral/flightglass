# Export verification

- Source commit: `410a365d47de5c7a1542edc71d0336cd5b7d1b56`
- Result: **PASS**
- Manifest records: **130**
- Exported HTML entry files: **7**
- Hash and byte checks: **PASS**
- Seven-page Chromium smoke: **PASS**

## Browser smoke

- set-b-home: HTTP 200; `Flightglass — Understand the numbers`; selector visible=true; local 404=0; runtime errors=0.
- set-b-ball-flight: HTTP 200; `See the Shot — Live Outcome, Side and Top`; selector visible=true; local 404=0; runtime errors=0.
- set-b-impact-studio: HTTP 200; `Impact Studio`; selector visible=true; local 404=0; runtime errors=0.
- set-a-connections: HTTP 200; `Flightglass · Connections`; selector visible=true; local 404=0; runtime errors=0.
- set-a-impact-viz: HTTP 200; `VIZ MOCK — See the Shot (visualization-primary + chip row + transient lens overlays)`; selector visible=true; local 404=0; runtime errors=0.
- set-a-impact-kamera: HTTP 200; `StrikeArc · Impact · kamera-mock`; selector visible=true; local 404=0; runtime errors=0.
- set-a-impact-studio: HTTP 200; `Impact Studio`; selector visible=true; local 404=0; runtime errors=0.

## Intentionally excluded navigation targets

- Home retains links to jarvis.html, terms.html and privacy.html, which are outside the explicitly requested seven surfaces.
- Shared shell code retains Guide/support route strings from the original source; those pages are intentionally not exported.
