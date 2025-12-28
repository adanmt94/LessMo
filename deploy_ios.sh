#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  iOS Production Build & Deploy${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if EAS CLI is installed
echo -e "${YELLOW}[1/6] Checking EAS CLI...${NC}"
if ! command -v eas &> /dev/null; then
    echo -e "${RED}EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install EAS CLI${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ EAS CLI installed successfully${NC}\n"
else
    echo -e "${GREEN}✅ EAS CLI is installed ($(eas --version))${NC}\n"
fi

# Check if Xcode is installed
echo -e "${YELLOW}[2/6] Checking Xcode...${NC}"
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode is not installed. Please install Xcode from the App Store.${NC}"
    exit 1
fi
XCODE_VERSION=$(xcodebuild -version | head -n 1)
echo -e "${GREEN}✅ Xcode is installed ($XCODE_VERSION)${NC}\n"

# Check Apple login via EAS
echo -e "${YELLOW}[3/6] Checking Apple credentials...${NC}"
echo -e "${BLUE}EAS will prompt for Apple login if needed${NC}\n"

# Clean previous builds
echo -e "${YELLOW}[4/6] Cleaning previous builds...${NC}"
rm -rf ios/build
rm -f *.ipa
echo -e "${GREEN}✅ Cleaned build directory${NC}\n"

# Build locally with EAS
echo -e "${YELLOW}[5/6] Building iOS app locally (this may take 10-20 minutes)...${NC}"
echo -e "${BLUE}Running: eas build --platform ios --profile production --local${NC}\n"

eas build --platform ios --profile production --local

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}\n"

# Find the generated .ipa file
echo -e "${YELLOW}[6/6] Locating generated .ipa file...${NC}"

# Search for .ipa files in current directory
IPA_PATH=""
IPA_FILES=(*.ipa)

if [ -f "${IPA_FILES[0]}" ]; then
    IPA_PATH="${IPA_FILES[0]}"
else
    # Search in build directory
    if [ -d "ios/build" ]; then
        IPA_FILES=(ios/build/*.ipa)
        if [ -f "${IPA_FILES[0]}" ]; then
            IPA_PATH="${IPA_FILES[0]}"
        fi
    fi
fi

if [ -z "$IPA_PATH" ] || [ ! -f "$IPA_PATH" ]; then
    echo -e "${RED}❌ Could not find .ipa file${NC}"
    echo -e "${YELLOW}Please locate the .ipa file manually and run:${NC}"
    echo -e "${BLUE}eas submit --platform ios --path \"<path_to_ipa>\"${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found IPA: $IPA_PATH${NC}\n"

# Submit to App Store Connect
echo -e "${YELLOW}Submitting to App Store Connect...${NC}"
echo -e "${BLUE}Running: eas submit --platform ios --path \"$IPA_PATH\"${NC}\n"

eas submit --platform ios --path "$IPA_PATH"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Submission failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ SUCCESS!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Your iOS app has been built and submitted to App Store Connect${NC}"
echo -e "${GREEN}Check TestFlight in App Store Connect for the new build${NC}\n"
