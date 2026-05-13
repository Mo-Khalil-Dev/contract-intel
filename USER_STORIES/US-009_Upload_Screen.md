# US-009: Upload Screen (Document Upload)

**Epic**: Core Screens  
**Priority**: P1  
**Story Points**: 13  
**Status**: Ready for Implementation  

---

## User Story

As a **legal operations user**, I want to upload contract documents (PDF/DOCX) via drag-and-drop or file picker so that ContractIntel can analyze them against our playbook.

---

## Acceptance Criteria

### 3-Tier API Architecture (MANDATORY)

**API Call Stack**:
```
UI Hook (useUpload.ts) 
  → Service (documentService.ts) 
    → httpService (httpService.ts) 
      → Axios (client.ts)
```

**Rules**:
- [ ] **Layer 1 - UI Hook**: Calls service methods only, no httpService or axios imports
- [ ] **Layer 2 - Service**: Calls httpService, unwraps `ApiResponse<T>`, no axios imports
- [ ] **Layer 3 - httpService**: ONLY file that imports axios
- [ ] **All API URLs**: Defined in `src/api/endpoints.ts`
- [ ] **Every service method**: Calls `.then(unwrap)` to extract data

### Component Structure (MANDATORY - ALL Components)
- [ ] **ComponentName.tsx**: JSX only, max 15 lines, no logic
- [ ] **useComponentName.ts**: All UI logic (hooks, state, handlers)
- [ ] **ComponentName.module.css**: All styles
- [ ] **ComponentName.test.tsx**: Unit tests
- [ ] **ComponentName.stories.tsx**: Storybook story

### Layout & Structure
- [ ] Page uses PageShell component
- [ ] Title: "Upload contract"
- [ ] Subtitle: "Drop a PDF or Word file to begin analysis"
- [ ] Full-height scrollable container with background color #FAFAF9
- [ ] Max-width 720px centered layout with horizontal padding 32px

### Upload Dropzone (Mobile-First)

#### Mobile Design (320px-640px)
- [ ] Dropzone: full-width, min-height 240px
- [ ] Dashed border: 2px dashed #CBD5E1
- [ ] Border-radius: 12px
- [ ] Background: #FFFFFF
- [ ] Padding: 32px 24px
- [ ] Drag-over state: border-color #2563EB, background #EFF6FF
- [ ] Icon: Upload icon (32×32), color #94A3B8
- [ ] Text: "Drag and drop a file here" (14px, weight 600, color #0F172A)
- [ ] Sub-text: "or click to browse" (12px, color #64748B)
- [ ] File types: "PDF, DOCX · up to 50 MB" (11px, color #94A3B8)
- [ ] "Choose file" button: full-width, ≥48px touch target
- [ ] Tested on real iPhone (portrait + landscape)
- [ ] Tested on real Android phone

#### Tablet Design (640px-1024px)
- [ ] Dropzone: max-width 600px, min-height 280px
- [ ] Padding: 40px 32px
- [ ] Icon: 40×40
- [ ] Text: 15px
- [ ] "Choose file" button: auto-width, ≥44px touch target
- [ ] Tested on real iPad

#### Desktop Design (1024px+)
- [ ] Dropzone: max-width 720px, min-height 320px
- [ ] Padding: 48px 40px
- [ ] Icon: 48×48
- [ ] Text: 16px
- [ ] Hover state: border-color #94A3B8, cursor pointer
- [ ] "Choose file" button: auto-width, ≥40px touch target
- [ ] Tested on desktop monitor with mouse

### File Validation
- [ ] **File size**: ≤50MB (show error if exceeded)
- [ ] **File type**: PDF or DOCX only (show error if invalid)
- [ ] **Error message**: Red text below dropzone, ARIA live region
- [ ] **Error examples**:
  - "File size exceeds 50 MB limit"
  - "Only PDF and DOCX files are supported"

### Selected File Display
- [ ] Shows file name (truncated if > 40 chars)
- [ ] Shows file size (formatted: "2.4 MB")
- [ ] Shows file type icon (PDF or DOCX)
- [ ] "Remove" button (×) to clear selection
- [ ] Remove button: ≥44px touch target, ARIA label "Remove file"

### Consent Checkbox (Base: Shadcn UI Checkbox)
- [ ] Checkbox + label: "I confirm this document is authorized for review and does not contain confidential information beyond standard contract terms."
- [ ] Required before upload (button disabled until checked)
- [ ] Keyboard accessible (Space to toggle)
- [ ] ARIA required
- [ ] Touch target ≥44px on mobile
- [ ] Focus indicator visible (3px outline)

### Upload Button
- [ ] Text: "Upload and analyze"
- [ ] Variant: primary
- [ ] Size: lg on mobile, md on tablet/desktop
- [ ] Disabled states:
  - No file selected
  - Consent not checked
  - Upload in progress
- [ ] Shows loading spinner during upload
- [ ] Touch target ≥48px on mobile, ≥44px on tablet, ≥40px on desktop
- [ ] Focus indicator visible
- [ ] ARIA label: "Upload contract for analysis"

### Upload Progress
- [ ] Progress bar (0-100%)
- [ ] Status text:
  - "Uploading..." (0-50%)
  - "Processing..." (50-100%)
  - "Complete" (100%)
- [ ] ARIA live region for status updates
- [ ] Cancel button (if upload in progress)
- [ ] Cancel button: ≥44px touch target, ARIA label "Cancel upload"

### Upload Flow
1. User selects file (drag-and-drop or file picker)
2. File validation (size, type)
3. File info displayed
4. User checks consent checkbox
5. User clicks "Upload and analyze"
6. Frontend calls `documentService.initiateUpload(file)`
7. Backend returns presigned URL + documentId
8. Frontend uploads file to GCS presigned URL
9. Frontend calls `documentService.completeUpload(documentId)`
10. Backend triggers OCR + AI analysis
11. Frontend redirects to processing screen

### Accessibility Requirements (WCAG 2.1 AA)
- [ ] **Focus indicators**: 3px outline, visible on all interactive elements
- [ ] **Touch targets**: ≥48px on mobile, ≥44px on tablet, ≥40px on desktop
- [ ] **ARIA labels**: All buttons, checkbox, file input
- [ ] **Keyboard navigation**: Tab, Enter, Space, Escape
- [ ] **Color contrast**: ≥4.5:1 for all text
- [ ] **ARIA live regions**: Status updates, error messages
- [ ] **Screen reader tested**: VoiceOver (iOS/macOS), NVDA (Windows)

### Testing Requirements
- [ ] **Mock at service boundary**: Test hooks against mocked `documentService`
- [ ] **Unit tests**: All components (dropzone, checkbox, button, progress)
- [ ] **Unit tests**: File validation (size, type)
- [ ] **Unit tests**: Upload flow (initiate, upload, complete)
- [ ] **Storybook stories**: All components, all states
- [ ] **Real device testing**:
  - iPhone (portrait + landscape)
  - Android phone
  - iPad
  - Desktop monitor
- [ ] **Zoom testing**: 100%, 150%, 200%
- [ ] **Keyboard navigation**: Tab through all elements, Space to toggle checkbox, Enter to upload
- [ ] **Screen reader**: Announces file selection, validation errors, upload progress
- [ ] **axe DevTools**: 0 critical violations
- [ ] **Lighthouse a11y**: ≥95
- [ ] **Integration test**: Full upload flow (mock backend)

---

## Design Specifications

### Colors Used
- Background: #FAFAF9
- Surface: #FFFFFF
- Border: #CBD5E1
- Border (hover): #94A3B8
- Border (drag-over): #2563EB
- Background (drag-over): #EFF6FF
- Text (primary): #0F172A
- Text (secondary): #64748B
- Text (muted): #94A3B8
- Error: #EF4444
- Success: #10B981
- Accent (blue): #2563EB

### Typography
- Font family: DM Sans (all text)
- Monospace: DM Mono (file size)
- Sizes: 11px (file types), 12px (sub-text), 14px (main text), 15px (tablet), 16px (desktop)

### Spacing
- Container padding: 32px horizontal
- Dropzone padding: 32px 24px (mobile), 40px 32px (tablet), 48px 40px (desktop)
- Element gaps: 12px (vertical spacing)

### Border Radius
- Dropzone: 12px
- Buttons: 8px
- File display: 8px

---

## API Layer Setup

### src/api/endpoints.ts
```typescript
export const API = {
  // ... existing endpoints
  INITIATE_UPLOAD: '/api/v1/documents/upload/initiate',
  COMPLETE_UPLOAD: '/api/v1/documents/upload/complete',
  UPLOAD_STATUS: (id: string) => `/api/v1/documents/${id}/status`,
};
```

### src/services/documentService.ts
```typescript
export const documentService = {
  initiateUpload: async (file: File): Promise<UploadResponse> => {
    return httpService
      .post<UploadResponse>(API.INITIATE_UPLOAD, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })
      .then(unwrap);
  },
  
  uploadToStorage: async (url: string, file: File): Promise<void> => {
    // Direct upload to GCS presigned URL (not through httpService)
    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
  },
  
  completeUpload: async (documentId: string): Promise<void> => {
    return httpService
      .post<void>(API.COMPLETE_UPLOAD, { documentId })
      .then(unwrap);
  },
  
  getUploadStatus: async (documentId: string): Promise<UploadStatus> => {
    return httpService
      .get<UploadStatus>(API.UPLOAD_STATUS(documentId))
      .then(unwrap);
  },
};
```

### src/hooks/useUpload.ts
```typescript
export function useUpload() {
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Initiate upload
      const { uploadUrl, documentId } = await documentService.initiateUpload(file);
      
      // 2. Upload to storage
      await documentService.uploadToStorage(uploadUrl, file);
      
      // 3. Complete upload
      await documentService.completeUpload(documentId);
      
      return { documentId };
    },
  });
  
  return {
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
  };
}
```

---

## File Structure

```
frontend/src/
├── api/
│   └── endpoints.ts           # Add upload endpoints
├── services/
│   └── documentService.ts     # Upload domain logic, calls httpService
├── hooks/
│   └── useUpload.ts           # React Query mutation hook, calls service
├── pages/UploadPage/
│   ├── UploadPage.tsx         # JSX only, max 15 lines
│   ├── useUploadPage.ts       # All logic (uses useUpload)
│   ├── UploadPage.module.css  # Styles
│   ├── UploadPage.test.tsx    # Tests
│   └── UploadPage.stories.tsx # Storybook
└── components/upload/
    ├── UploadDropzone/
    │   ├── UploadDropzone.tsx
    │   ├── useUploadDropzone.ts
    │   ├── UploadDropzone.module.css
    │   ├── UploadDropzone.test.tsx
    │   └── UploadDropzone.stories.tsx
    ├── ConsentCheckbox/
    │   ├── ConsentCheckbox.tsx
    │   ├── useConsentCheckbox.ts
    │   ├── ConsentCheckbox.module.css
    │   ├── ConsentCheckbox.test.tsx
    │   └── ConsentCheckbox.stories.tsx
    ├── UploadButton/
    │   ├── UploadButton.tsx
    │   ├── useUploadButton.ts
    │   ├── UploadButton.module.css
    │   ├── UploadButton.test.tsx
    │   └── UploadButton.stories.tsx
    └── UploadProgress/
        ├── UploadProgress.tsx
        ├── useUploadProgress.ts
        ├── UploadProgress.module.css
        ├── UploadProgress.test.tsx
        └── UploadProgress.stories.tsx
```

---

## Implementation Tasks

### Task 1: API Infrastructure Setup
**Goal**: Set up 3-tier API call stack for upload

**Deliverables**:
- [ ] Add upload endpoints to `src/api/endpoints.ts`
- [ ] Create `src/services/documentService.ts`
  - `initiateUpload(file)`: Calls httpService, unwraps response
  - `uploadToStorage(url, file)`: Direct upload to GCS
  - `completeUpload(documentId)`: Calls httpService
  - `getUploadStatus(documentId)`: Calls httpService
  - No axios imports
- [ ] Create `src/hooks/useUpload.ts`
  - React Query mutation hook
  - Calls documentService methods
  - No httpService or axios imports
  - Returns { upload, isUploading, error }

**Definition of Done**: 3-tier architecture in place, service layer tested

---

### Task 2: UploadDropzone Component (Mobile-First)
**Goal**: Build drag-and-drop file picker with Shadcn UI base

**Deliverables**:
- [ ] Create UploadDropzone component (5 files)
- [ ] Implement mobile design (320px-640px):
  - Full-width, min-height 240px
  - Dashed border, 32px 24px padding
  - Upload icon 32×32
  - "Choose file" button full-width, ≥48px touch target
- [ ] Implement tablet design (640px-1024px):
  - Max-width 600px, min-height 280px
  - 40px 32px padding
  - Upload icon 40×40
  - "Choose file" button auto-width, ≥44px touch target
- [ ] Implement desktop design (1024px+):
  - Max-width 720px, min-height 320px
  - 48px 40px padding
  - Upload icon 48×48
  - Hover state: border-color change
  - "Choose file" button auto-width, ≥40px touch target
- [ ] Implement drag-and-drop:
  - `onDragOver`, `onDragLeave`, `onDrop` handlers
  - Drag-over state: border-color #2563EB, background #EFF6FF
- [ ] Implement file picker:
  - Hidden file input
  - Triggered by click on dropzone or button
  - Accept: `.pdf,.docx`
- [ ] File validation:
  - Size ≤50MB
  - Type: PDF or DOCX
  - Show error message if invalid
- [ ] Selected file display:
  - File name (truncated if > 40 chars)
  - File size (formatted: "2.4 MB")
  - File type icon
  - "Remove" button (×), ≥44px touch target

**Definition of Done**: Dropzone works on all devices, drag-and-drop functional, file validation works

---

### Task 3: ConsentCheckbox Component
**Goal**: Build accessible consent checkbox with Shadcn UI base

**Deliverables**:
- [ ] Install Shadcn UI Checkbox: `npx shadcn-ui@latest add checkbox`
- [ ] Create ConsentCheckbox component (5 files)
- [ ] Checkbox + label: "I confirm this document is authorized..."
- [ ] Required before upload
- [ ] Keyboard accessible (Space to toggle)
- [ ] ARIA required
- [ ] Touch target ≥44px on mobile
- [ ] Focus indicator visible (3px outline)
- [ ] Storybook stories (checked, unchecked, focus)

**Definition of Done**: Checkbox accessible, keyboard navigation works, screen reader announces

---

### Task 4: UploadButton Component
**Goal**: Build upload button with loading state

**Deliverables**:
- [ ] Create UploadButton component (5 files)
- [ ] Text: "Upload and analyze"
- [ ] Variant: primary
- [ ] Size: lg on mobile, md on tablet/desktop
- [ ] Disabled states:
  - No file selected
  - Consent not checked
  - Upload in progress
- [ ] Loading state: spinner icon, disabled
- [ ] Touch target ≥48px on mobile, ≥44px on tablet, ≥40px on desktop
- [ ] Focus indicator visible
- [ ] ARIA label: "Upload contract for analysis"
- [ ] Storybook stories (enabled, disabled, loading)

**Definition of Done**: Button works on all devices, loading state functional, accessible

---

### Task 5: UploadProgress Component
**Goal**: Build progress indicator with status updates

**Deliverables**:
- [ ] Create UploadProgress component (5 files)
- [ ] Progress bar (0-100%)
- [ ] Status text:
  - "Uploading..." (0-50%)
  - "Processing..." (50-100%)
  - "Complete" (100%)
- [ ] ARIA live region for status updates
- [ ] ARIA role="progressbar"
- [ ] aria-valuenow, aria-valuemin, aria-valuemax
- [ ] Cancel button (if upload in progress)
- [ ] Cancel button: ≥44px touch target, ARIA label "Cancel upload"
- [ ] Storybook stories (0%, 25%, 50%, 75%, 100%)

**Definition of Done**: Progress bar works, status updates announced by screen reader

---

### Task 6: UploadPage Integration
**Goal**: Integrate all components into UploadPage

**Deliverables**:
- [ ] Create UploadPage component (5 files)
- [ ] Uses useUpload hook
- [ ] Passes upload function to child components
- [ ] No API calls directly
- [ ] Layout: PageShell with title and subtitle
- [ ] Max-width 720px centered
- [ ] Vertical spacing between components
- [ ] Upload flow:
  1. User selects file
  2. File validation
  3. User checks consent
  4. User clicks upload
  5. Progress indicator shown
  6. Redirect to processing screen on complete
- [ ] Error handling: Show error message if upload fails
- [ ] Storybook stories (empty, file selected, uploading, error)

**Definition of Done**: Full upload flow works, all components integrated

---

### Task 7: Testing
**Goal**: Comprehensive testing on all devices

**Deliverables**:
- [ ] Mock at service boundary (not axios)
- [ ] Unit tests for all components
- [ ] Unit tests for file validation
- [ ] Unit tests for upload flow
- [ ] Storybook stories for all components
- [ ] Test on real iPhone (portrait + landscape)
- [ ] Test on real Android phone
- [ ] Test on real iPad
- [ ] Test on desktop monitor
- [ ] Test at 100%, 150%, 200% zoom
- [ ] Test keyboard navigation
- [ ] Test screen reader
- [ ] Run axe DevTools (0 critical violations)
- [ ] Run Lighthouse a11y (≥95)
- [ ] Integration test: Full upload flow (mock backend)

**Definition of Done**: All tests pass, upload works on all devices, fully accessible

---

## Edge Cases & States

### No File Selected
- [ ] Upload button disabled
- [ ] Dropzone shows default state

### File Too Large
- [ ] Error message: "File size exceeds 50 MB limit"
- [ ] Error shown below dropzone
- [ ] ARIA live region announces error
- [ ] Upload button disabled

### Invalid File Type
- [ ] Error message: "Only PDF and DOCX files are supported"
- [ ] Error shown below dropzone
- [ ] ARIA live region announces error
- [ ] Upload button disabled

### Upload Failed
- [ ] Error message: "Upload failed. Please try again."
- [ ] Error shown below progress bar
- [ ] ARIA live region announces error
- [ ] Upload button re-enabled
- [ ] File selection retained

### Upload Cancelled
- [ ] Progress bar hidden
- [ ] Status text: "Upload cancelled"
- [ ] Upload button re-enabled
- [ ] File selection retained

---

## Notes for Implementation

1. **Shadcn UI Base**: Use Shadcn UI Checkbox for consent checkbox
2. **Mobile-First**: Build for 320px first, enhance for larger screens
3. **Touch Targets**: Minimum 48px on mobile (WCAG 2.5.5)
4. **Focus Indicators**: Always visible, never remove without replacement
5. **ARIA Live Regions**: Announce status updates and errors
6. **Real Device Testing**: Test drag-and-drop on real devices
7. **Screen Reader**: Test with VoiceOver (iOS/macOS) and NVDA (Windows)
8. **Mock at Service Boundary**: Test hooks against mocked `documentService`

---

## Acceptance Checklist

- [ ] 3-tier API architecture implemented (hook → service → httpService)
- [ ] All components follow mandatory structure (5 files each)
- [ ] UploadDropzone works on all devices
- [ ] Drag-and-drop functional
- [ ] File validation works (size, type)
- [ ] ConsentCheckbox accessible
- [ ] UploadButton has loading state
- [ ] UploadProgress shows status updates
- [ ] Full upload flow works
- [ ] Mobile-first responsive (320px → 1024px+)
- [ ] Touch targets ≥48px on mobile
- [ ] Focus indicators visible (3px outline)
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Color contrast ≥4.5:1
- [ ] ARIA live regions announce updates
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] Unit tests pass (all components)
- [ ] Storybook stories created (all components)
- [ ] Tested on real iPhone
- [ ] Tested on real Android phone
- [ ] Tested on real iPad
- [ ] Tested on desktop monitor
- [ ] Tested at 100%, 150%, 200% zoom
- [ ] axe DevTools: 0 critical violations
- [ ] Lighthouse a11y: ≥95
- [ ] Integration test passes (full upload flow)
- [ ] Code review approved
- [ ] Ready for merge to main
