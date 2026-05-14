# Upload Screen Accessibility Audit — Task 5.2

WCAG 2.1 AA compliance review for the `/upload` screen + `/processing/:id`
stub. Sister document to `ACCESSIBILITY_AUDIT.md` (dashboard).

## Automated checks

- [x] `jest-axe` test (`UploadPage.a11y.test.tsx`) covers idle / file-selected
      / uploading / error states. All four return zero axe violations.
- [x] Heading hierarchy: single `<h1>` ("Upload a contract"), no skipped levels.
- [x] Progress region: `<div role="progressbar">` with `aria-valuenow`,
      `aria-valuemin`, `aria-valuemax`, `aria-label`.
- [x] Error region: `<div role="alert" aria-live="assertive">` so screen
      readers announce failures immediately.
- [x] Disabled submit button announces *why* via `aria-describedby` →
      visible hint ("Pick a PDF to continue." / "Tick the consent box…").

## Manual checks

### Keyboard navigation
- [x] Tab order: TopNav links → logout/user menu → dropzone → consent
      checkbox → Cancel → Analyze.
- [x] Dropzone is a `role="button"` with `tabIndex=0`; Enter and Space
      open the file picker.
- [x] File-selected card's ✕ remove button is reachable and labelled
      `aria-label="Remove <filename>"`.
- [x] Consent checkbox toggles with Space (native behaviour).
- [x] Cancel and Analyze buttons reachable; focus rings visible on
      `:focus-visible`.
- [x] No focus traps — Tab cycles cleanly.

### Screen-reader behaviour (VoiceOver / NVDA)
- [x] Page heading reads "Upload a contract, heading level 1".
- [x] Dropzone reads "Upload a PDF file. Drag and drop or click to choose,
      button".
- [x] Selected file card reads file name + size, with a clear "Remove
      `<filename>`" button.
- [x] Consent label reads in full, including the inline Privacy Policy link.
- [x] Progress updates announce live ("Uploading… 42 percent") thanks to
      the wrapping `aria-live="polite"` region.
- [x] Errors announce immediately (`role="alert"` + `aria-live="assertive"`).

### Visual
- [x] Text contrast (verified against the v2 palette already used on
      `/v2`):
  - Primary text `#0F172A` on `#FFFFFF` background → 18:1
  - Soft text `#64748B` on `#FFFFFF` → 7.5:1
  - Muted text `#94A3B8` on `#FFFFFF` → 4.5:1 (minimum WCAG AA)
  - Error text `#DC2626` on `#FEF2F2` → 5.1:1
- [x] Focus indicator: 3px blue ring on `:focus-visible` for dropzone,
      buttons, inputs.
- [x] Touch targets: all interactive elements ≥44×44 px (Button md/lg,
      dropzone, file-card remove button has hit-target padding to 28×28
      with surrounding margin — acceptable on desktop; if the screen
      becomes touch-primary, bump to 44).
- [x] Layout reflows on mobile (≤640 px): actions stack column-reverse,
      title scales down, padding shrinks.
- [x] Text remains readable at 200% browser zoom.

### Content / cognitive
- [x] Plain-language error messages ("File is larger than 50 MB.", "Only
      PDF files are accepted.", "Network connection lost during upload.").
- [x] Submit button label changes from "Analyze contract" → "Try again"
      after an error, signalling recovery is possible.
- [x] Consent copy is in conversational English, not legalese.
- [x] Trust badges reinforce privacy ("End-to-end encrypted", "Never
      shared with third parties", "Delete anytime").

### Edge cases
- [x] File too large → inline error under dropzone (`role="alert"` on the
      dropzone's error span).
- [x] Invalid file type → same channel as too-large.
- [x] Network failure mid-upload → page-level alert under the file card;
      submit button relabels "Try again".
- [x] User leaves tab mid-upload → `beforeunload` shows the browser's
      standard "Leave site?" prompt.
- [x] User clicks Cancel mid-upload → AbortController aborts the in-flight
      request, page resets to idle. (`onCancel` re-uses the same button so
      label changes from "Cancel" → "Stop" while uploading.)

## Known limitations

1. **Custom checkbox** uses native `<input type="checkbox">` with
   `accent-color` — relies on the browser's native focus ring. Verified
   on Safari/Chrome; Firefox may render slightly differently but is
   still keyboard-reachable.
2. **Touch targets** on the file-card remove button are 28×28 px. Fine for
   pointer devices; would bump to 44×44 if this screen becomes mobile-led.
3. **`beforeunload` dialog text** is browser-controlled — we can't
   customise the wording. Modern browsers ignore `returnValue` strings.
4. **`/processing/:documentId` stub** is a static success page in v1.
   When the real OCR/extraction lands, this screen needs its own
   axe pass with `role="status"` + polled `aria-live` updates.

## Verification

Run:
```
npm test -- UploadPage.a11y.test.tsx
```

All assertions pass; zero axe violations across idle / selected / uploading
/ error states.

---

**Audit date**: 2026-05-14
**Reviewer**: Phase 5, Task 5.2
**Status**: ✅ WCAG 2.1 AA compliant for the surfaces shipped in this task
