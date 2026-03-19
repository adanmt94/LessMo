# CONTEXT

I have formatted my Mac and installed **macOS Ventura 13.7.8** using OpenCore Legacy Patcher on a **MacBook Pro 15” (Late 2016, Intel)**.

This is a CLEAN system. Nothing is installed yet.

This Mac was previously used to develop an iOS app built with:
- React Native
- Expo / EAS
- Native iOS widgets
- Firebase
- CocoaPods
- Xcode
- Local iOS builds and App Store Connect uploads

Previously, builds failed due to:
- Incompatible macOS / Xcode versions
- C++20 incompatibilities
- Wrong toolchain versions
- Missing or misconfigured dependencies
- Environment drift over time

Now the system is clean and compatible.  
**Your job is to recreate the FULL working development environment from scratch**, without inventing anything.

---

# ABSOLUTE RULES (VERY IMPORTANT)

1. ❌ DO NOT INVENT tools, versions, or workflows
2. ✅ ONLY use:
   - Standard Apple tooling
   - Official Expo / React Native / Firebase tooling
   - What can be inferred from the existing project files
3. ✅ You MUST analyze the project repository if needed
4. ❌ Do NOT assume cloud builds (EAS free quota is exhausted)
5. ✅ Target: **LOCAL iOS PRODUCTION BUILDS**
6. ✅ The result must be a **single executable `.sh` script**
7. ✅ The script must be **idempotent** (safe to re-run)
8. ✅ The script must work on **macOS Ventura 13.7.8**
9. ✅ The script must stop on errors and fix issues automatically when possible
10. ❌ Do NOT explain while running — execution must be silent

---

# OBJECTIVE

Create a script that:

- Detects system state
- Installs ALL required tools (correct versions)
- Configures environment variables
- Installs dependencies
- Prepares iOS toolchain
- Ensures React Native + Expo compatibility
- Ensures CocoaPods + Ruby compatibility
- Ensures Xcode + CLI tools are correct
- Leaves the system READY to:
  - Run the app
  - Build iOS locally (Release / Production)
  - Create widgets
  - Upload to App Store Connect

This must reproduce the **working state I had before**, but without the previous issues.

---

# REQUIRED OUTPUT

## 1️⃣ Generate a file called:

`bootstrap_ios_production.sh`

## 2️⃣ The script MUST:

### System setup
- Verify macOS version is Ventura 13.7.8
- Verify Intel architecture
- Install Homebrew (if missing)

### Developer tooling
- Install:
  - Xcode (compatible with Ventura)
  - Xcode Command Line Tools
  - Node.js (LTS compatible with React Native)
  - npm / yarn (only if required)
  - Watchman
  - Ruby (via rbenv or system-safe method)
  - CocoaPods (version compatible with Ventura + Xcode)

### iOS / React Native / Expo
- Install:
  - Expo CLI
  - EAS CLI
- Configure Expo for local builds
- Validate no cloud dependency is required

### Project-specific setup
- Detect project root
- Install JS dependencies
- Install iOS pods
- Validate widget targets
- Validate signing configuration (without hardcoding secrets)

### Safety & reliability
- Use `set -e`
- Use clear logging
- Auto-fix common issues (pods, cache, derived data)
- Fail clearly if something cannot be solved

---

# EXECUTION MODE

After generating the script:

1. You MUST execute it yourself
2. Stay in **silent execution mode**
3. Display a spinner or progress indicator
4. Do NOT respond until:
   - Script finishes successfully OR
   - Script fails definitively
5. If it fails:
   - Fix the issue
   - Re-run automatically
   - Repeat until no more fixes are possible

---

# FINAL STATE CHECKLIST (MANDATORY)

When finished, verify:

- `node -v`
- `npm -v`
- `xcodebuild -version`
- `pod --version`
- `npx expo --version`
- `npx eas --version`
- iOS project builds locally in **Release**

ONLY respond when the system is ready or impossible to complete.

---

# START NOW

Analyze the project if needed.  
Generate the script.  
Execute it.  
Remain silent until completion.
