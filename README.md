# MOGGED STUDIO

True facial harmony, decoded by science.

## Context and Purpose

MOGGED STUDIO is a premium geometric biometrics platform focused on advanced facial harmony and structural alignment analysis. Our mission is to democratize access to high-precision aesthetic analyses (golden ratios, symmetry, and mandibular axes) that were previously exclusive to elite clinics.

**Current Strategy:** The project operates under an Isolated Front-End Architecture (IFEA). All backend logic and requests to port `:8000` have been temporarily deactivated to focus on validating the UI/UX experience with simulated (mock) data.

## Design System (MOGGED PREMIUM)

Our visual identity draws inspiration from luxury editorial design and references such as Exempla, Raycast, and Vercel.

### Official Color Palette (Tailwind Classes)

- **Absolute Background (Midnight Obsidian):** `bg-[#00090b]`
- **Magnetic Gold (Accent Color):** `text-[#D3AB39]` / `bg-[#D3AB39]`
- **Secondary Text (Muted Titanium):** `text-[#a1a1a1]`
- **Translucent Borders (Laser-cut effect):** `border-white/10` or `border-white/5`

### Placeholder Rule

For visual components or 3D renders that are not yet ready, display a dashed box with the centered text "EM BREVE" in monospace font with gold-colored spaced typography:
```html
<div className="border-2 border-dashed border-[#D3AB39]/50 w-full h-[200px] flex items-center justify-center">
  <span className="font-mono text-[#D3AB39] tracking-wider">EM BREVE</span>
</div>
```

## Technical Specifications and Libraries

- **Main Stack:** React, TypeScript, Vite, and Tailwind CSS.
- **UI Componentization:** Use of flexible local components with default export (e.g., Button and Card).
- **Planned Future Integrations:** 
  - MediaPipe Face Mesh (for dynamic mapping of 468 facial landmarks)
  - OpenCV/Python in the backend ecosystem

## Engineering Instructions for Syntax

**Strict Development Rule:** All template strings with dynamic concatenation in React (`${}`) MUST use backticks (```) to avoid compilation errors in Vite's esbuild.

Example of correct usage:
```typescript
formData.append('file', blob, `capture_${Date.now()}.png`);
```

Incorrect usage (will cause build failure):
```typescript
formData.append('file', blob, capture_${Date.now()}.png);
```

---
*This document serves as the definitive manual for the MOGGED STUDIO project, consolidating business context, brand value proposition, and current technical architecture.*