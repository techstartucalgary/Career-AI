# Expo Migration Plan for Career-AI

## Overview
This plan migrates your React + Vite web app to Expo, enabling simultaneous web and mobile development while preserving all existing components and functionality.

---

## Pre-Migration Checklist

### Current Project State
- ✅ React 19.1.1 with Vite
- ✅ Bootstrap 5.3.8 for styling
- ✅ React Router DOM 7.9.5 (installed, not yet used)
- ✅ Components: App, Header, HomePage
- ✅ CSS-based styling
- ✅ Simple single-page structure

### Migration Goals
- Preserve all existing components (App, Header, HomePage)
- Maintain current functionality and styling
- Enable web + iOS + Android development
- Minimize code changes
- Avoid breaking existing features

---

## Phase 1: Project Structure Setup

### Step 1.1: Install Expo CLI and Dependencies
**Location:** Root directory (`/Users/sardarwaheed/Developer/Career-AI/`)

**Actions:**
1. Install Expo CLI globally (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

2. Install Expo in frontend directory:
   ```bash
   cd frontend
   npm install expo expo-web expo-router react-native react-native-web
   npm install --save-dev @expo/metro-config
   ```

**Why:** Sets up Expo core dependencies without removing existing ones.

---

### Step 1.2: Create Expo Configuration Files
**Location:** `frontend/`

**New Files to Create:**
1. `app.json` - Expo configuration
2. `metro.config.js` - Metro bundler config (replaces Vite for mobile)
3. `babel.config.js` - Babel configuration for Expo

**Configuration Details:**
- `app.json`: Basic Expo app config with web support enabled
- `metro.config.js`: Configure Metro to work with Expo and web
- `babel.config.js`: Expo preset for Babel

**Why:** Expo requires these config files. We'll keep Vite config for now as backup.

---

### Step 1.3: Update package.json Scripts
**Location:** `frontend/package.json`

**Changes:**
- Add Expo scripts alongside existing Vite scripts
- Keep existing scripts for backward compatibility during migration

**New Scripts to Add:**
```json
{
  "scripts": {
    "dev": "vite",                    // Keep existing
    "dev:expo": "expo start",         // New: Expo dev server
    "dev:web": "expo start --web",    // New: Expo web
    "dev:ios": "expo start --ios",    // New: Expo iOS
    "dev:android": "expo start --android", // New: Expo Android
    "build": "vite build",            // Keep existing
    "build:expo:web": "expo export:web", // New: Expo web build
    "preview": "vite preview"         // Keep existing
  }
}
```

**Why:** Allows gradual migration - you can test Expo while keeping Vite working.

---

## Phase 2: Component Migration (Preserve Existing)

### Step 2.1: Create Expo Entry Point
**Location:** `frontend/src/`

**New File:** `index.expo.js` (or `App.expo.js`)

**Purpose:** 
- Entry point for Expo (separate from `main.jsx` for Vite)
- Imports your existing `App.jsx` component
- Handles Expo-specific initialization

**Why:** Keeps Vite entry point (`main.jsx`) untouched, allowing both to coexist.

---

### Step 2.2: Convert CSS to StyleSheet (Gradual Approach)
**Location:** Component files

**Strategy:** Create parallel styling approach
- Keep existing CSS files (`.css`) for web compatibility
- Create StyleSheet versions (`.styles.js`) for React Native
- Use conditional imports based on platform

**Files to Create:**
1. `src/components/Header.styles.js`
2. `src/pages/HomePage.styles.js`
3. `src/App.styles.js`

**Why:** Preserves existing CSS while adding React Native support. Can remove CSS later once verified.

---

### Step 2.3: Migrate Header Component
**Location:** `frontend/src/components/Header.jsx`

**Changes Required:**
1. Replace HTML elements:
   - `<header>` → `<View>`
   - `<nav>` → `<View>`
   - `<a>` → `<Pressable>` or `<TouchableOpacity>` with Expo Router's `<Link>`
   - `<ul>`, `<li>` → `<View>` with flexbox
   - `<button>` → `<Pressable>`

2. Replace Bootstrap classes:
   - `className="container"` → `style={styles.container}`
   - `className="d-flex"` → `style={styles.flexRow}`
   - Bootstrap utilities → StyleSheet equivalents

3. Import React Native components:
   ```jsx
   import { View, Text, Pressable, StyleSheet } from 'react-native';
   import { Link } from 'expo-router'; // For navigation
   ```

4. Create StyleSheet:
   - Convert CSS to StyleSheet API
   - Maintain visual appearance

**Preservation Strategy:**
- Keep original component structure
- Maintain same props and state (if any)
- Keep same functionality (navigation, buttons)

**Why:** Header is simple, good starting point for migration pattern.

---

### Step 2.4: Migrate HomePage Component
**Location:** `frontend/src/pages/HomePage.jsx`

**Changes Required:**
1. Replace HTML elements:
   - `<div>` → `<View>`
   - `<section>` → `<View>`
   - `<h1>`, `<h2>`, `<p>` → `<Text>` with style props
   - `<form>` → `<View>` (handle submit with Pressable)
   - `<input>` → `<TextInput>`
   - `<button>` → `<Pressable>`

2. Replace Bootstrap grid:
   - `className="row"` → `<View style={styles.row}>`
   - `className="col-md-6"` → `<View style={styles.colMd6}>`
   - Use flexbox for responsive layout

3. Convert CSS classes:
   - All Bootstrap classes → StyleSheet
   - Maintain gradient backgrounds (use `expo-linear-gradient`)
   - Preserve hover effects (use `Pressable` states)

4. Preserve state management:
   - Keep `useState` hooks exactly as they are
   - Keep `handleSearch` function unchanged

5. Preserve data:
   - Keep `features` array exactly as is
   - Keep all text content

**Preservation Strategy:**
- Maintain exact same component logic
- Keep all state and handlers
- Preserve visual design (colors, spacing, layout)

**Why:** HomePage is the main component - careful migration ensures core functionality preserved.

---

### Step 2.5: Migrate App Component
**Location:** `frontend/src/App.jsx`

**Changes Required:**
1. Minimal changes - just wrapper updates
2. Replace CSS import with StyleSheet if needed
3. Keep `<HomePage />` import and usage exactly as is

**Why:** App is already minimal, easy migration.

---

## Phase 3: Styling Migration

### Step 3.1: Convert CSS to StyleSheet
**Approach:** One file at a time, test after each

**Priority Order:**
1. `Header.css` → `Header.styles.js`
2. `HomePage.css` → `HomePage.styles.js`
3. `App.css` → `App.styles.js`
4. `index.css` → Global styles in Expo entry point

**Conversion Rules:**
- CSS classes → StyleSheet objects
- `px` values → Keep as numbers (React Native uses numbers)
- `rem`/`em` → Convert to numbers or use `Dimensions` API
- Flexbox → Use React Native flexbox (slightly different syntax)
- Colors → Keep hex values as strings
- Gradients → Use `expo-linear-gradient` component
- Shadows → Use React Native `shadowColor`, `shadowOffset`, etc.

**Bootstrap Replacement Strategy:**
- Container: `{ width: '100%', maxWidth: 1200, marginHorizontal: 'auto', paddingHorizontal: 15 }`
- Flex utilities: Use StyleSheet flexbox
- Spacing: Use `margin` and `padding` in StyleSheet
- Typography: Use `fontSize`, `fontWeight` in Text styles

**Why:** Systematic conversion ensures nothing is missed.

---

### Step 3.2: Handle Platform-Specific Styles
**Location:** StyleSheet files

**Strategy:**
- Use `Platform.OS` for platform-specific values
- Web can use more CSS-like properties
- Mobile may need adjustments for touch targets

**Example:**
```jsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  button: {
    padding: Platform.OS === 'web' ? 12 : 16, // Larger on mobile
    // ...
  }
});
```

**Why:** Ensures optimal UX on each platform.

---

## Phase 4: Navigation Setup

### Step 4.1: Install Expo Router
**Location:** `frontend/`

**Actions:**
```bash
npm install expo-router
npx expo install expo-router react-native-safe-area-context react-native-screens
```

**Why:** Expo Router provides file-based routing that works on web and mobile.

---

### Step 4.2: Set Up Expo Router Structure
**Location:** `frontend/`

**New Directory Structure:**
```
frontend/
├── app/                    # Expo Router app directory
│   ├── _layout.js          # Root layout
│   └── index.js            # Home page (uses HomePage component)
├── src/                    # Keep existing structure
│   ├── components/
│   ├── pages/
│   └── ...
```

**Migration Strategy:**
- Keep existing `src/` structure
- Create `app/` directory for Expo Router
- Import components from `src/` into `app/` routes
- Gradually move to `app/` structure if desired

**Why:** Allows keeping existing structure while adding Expo Router.

---

### Step 4.3: Update Navigation Links
**Location:** `Header.jsx`

**Changes:**
- Replace `<a href="/">` with `<Link href="/">` from `expo-router`
- Update all navigation links
- Keep same routes/paths

**Why:** Expo Router provides navigation that works on web and mobile.

---

## Phase 5: Dependencies Cleanup

### Step 5.1: Evaluate Bootstrap Usage
**Decision Point:** Remove or keep Bootstrap

**Options:**
- **Option A:** Remove Bootstrap entirely, use StyleSheet only
- **Option B:** Keep Bootstrap for web, use StyleSheet for mobile (conditional)

**Recommendation:** Option A - Remove Bootstrap after StyleSheet migration complete

**Why:** Reduces bundle size, cleaner codebase, React Native doesn't support Bootstrap.

---

### Step 5.2: Update React Router DOM
**Decision:** Replace with Expo Router or keep both

**Recommendation:** Replace with Expo Router (works on all platforms)

**Actions:**
- Remove `react-router-dom` after Expo Router setup
- Update all routing to use Expo Router

**Why:** Expo Router is cross-platform, React Router DOM is web-only.

---

### Step 5.3: Add Required Expo Packages
**Location:** `frontend/`

**Packages to Install:**
```bash
npx expo install expo-linear-gradient  # For gradients
npx expo install expo-status-bar      # Status bar control
```

**Why:** Replace web-specific features with Expo equivalents.

---

## Phase 6: Testing & Validation

### Step 6.1: Test Web Build
**Actions:**
1. Run `npm run dev:web` (Expo web)
2. Verify all components render correctly
3. Test all interactions (search, buttons, navigation)
4. Compare with original Vite version

**Success Criteria:**
- ✅ All components visible
- ✅ Styling matches original
- ✅ All functionality works
- ✅ No console errors

---

### Step 6.2: Test Mobile (iOS Simulator)
**Actions:**
1. Run `npm run dev:ios`
2. Test in iOS Simulator
3. Verify touch interactions
4. Check layout on mobile screen sizes

**Success Criteria:**
- ✅ App launches without errors
- ✅ Components render correctly
- ✅ Touch targets are appropriate size
- ✅ Layout is responsive

---

### Step 6.3: Test Mobile (Android Emulator)
**Actions:**
1. Run `npm run dev:android`
2. Test in Android Emulator
3. Verify platform-specific behaviors

**Success Criteria:**
- ✅ App launches without errors
- ✅ Android-specific styling correct
- ✅ All features functional

---

## Phase 7: Production Build Setup

### Step 7.1: Configure Build Scripts
**Location:** `package.json`

**Add Production Scripts:**
```json
{
  "scripts": {
    "build:web": "expo export:web",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android"
  }
}
```

**Why:** Separate builds for each platform.

---

### Step 7.2: Set Up EAS (Expo Application Services)
**Actions:**
1. Install EAS CLI: `npm install -g eas-cli`
2. Run `eas login`
3. Run `eas build:configure`
4. Configure `eas.json` for builds

**Why:** EAS handles iOS/Android builds and app store submissions.

---

## Phase 8: Cleanup (Optional)

### Step 8.1: Remove Vite (After Verification)
**Decision:** Only after confirming Expo web works perfectly

**Actions:**
- Remove Vite dependencies
- Remove `vite.config.js`
- Remove `index.html` (Expo generates this)
- Update scripts to use Expo only

**Why:** Reduces complexity, but only do this after full verification.

---

### Step 8.2: Remove Old CSS Files (After Verification)
**Decision:** Only after StyleSheet migration verified

**Actions:**
- Remove `.css` files
- Remove CSS imports from components
- Clean up unused dependencies

**Why:** Reduces bloat, but keep until migration fully verified.

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current project
- [ ] Commit current state to git
- [ ] Create new branch: `expo-migration`

### Phase 1: Setup
- [ ] Install Expo CLI and dependencies
- [ ] Create `app.json`
- [ ] Create `metro.config.js`
- [ ] Create `babel.config.js`
- [ ] Update `package.json` scripts

### Phase 2: Components
- [ ] Create Expo entry point
- [ ] Migrate Header component
- [ ] Migrate HomePage component
- [ ] Migrate App component
- [ ] Test each component individually

### Phase 3: Styling
- [ ] Convert Header.css to StyleSheet
- [ ] Convert HomePage.css to StyleSheet
- [ ] Convert App.css to StyleSheet
- [ ] Handle global styles
- [ ] Test styling on all platforms

### Phase 4: Navigation
- [ ] Install Expo Router
- [ ] Set up app directory structure
- [ ] Update navigation links
- [ ] Test navigation on all platforms

### Phase 5: Dependencies
- [ ] Remove Bootstrap (or make conditional)
- [ ] Replace React Router with Expo Router
- [ ] Install required Expo packages
- [ ] Clean up unused dependencies

### Phase 6: Testing
- [ ] Test web build
- [ ] Test iOS build
- [ ] Test Android build
- [ ] Verify all functionality
- [ ] Fix any issues

### Phase 7: Production
- [ ] Configure build scripts
- [ ] Set up EAS
- [ ] Test production builds

### Phase 8: Cleanup
- [ ] Remove Vite (optional)
- [ ] Remove CSS files (optional)
- [ ] Final code cleanup
- [ ] Update documentation

---

## Risk Mitigation

### Potential Issues & Solutions

1. **Bootstrap Dependencies**
   - **Risk:** Heavy reliance on Bootstrap classes
   - **Solution:** Convert gradually, keep CSS files until verified

2. **CSS to StyleSheet Conversion**
   - **Risk:** Styling differences between web and mobile
   - **Solution:** Test on all platforms, use Platform.OS checks

3. **Navigation Changes**
   - **Risk:** Breaking existing navigation
   - **Solution:** Keep React Router until Expo Router fully tested

4. **Bundle Size**
   - **Risk:** Expo adds some overhead
   - **Solution:** Use `expo export:web` for optimized web builds

5. **Third-party Libraries**
   - **Risk:** Some web libraries don't work with React Native
   - **Solution:** Check compatibility, find alternatives if needed

---

## Rollback Plan

If issues arise:
1. Keep Vite setup intact during migration
2. Use git branches for each phase
3. Can revert to Vite by using `npm run dev` instead of `npm run dev:expo`
4. Keep CSS files until migration verified
5. Maintain both entry points during transition


## Notes

- This plan preserves all existing components and functionality
- Migration can be done incrementally, testing after each phase
- Vite setup remains as backup until migration verified
- All CSS and components are preserved during migration
- Can rollback at any point if needed

---