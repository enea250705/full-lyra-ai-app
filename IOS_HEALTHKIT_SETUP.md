# iOS HealthKit Setup Guide

## 🍎 Required iOS Configuration for Automatic Sleep Tracking

This guide covers all the iOS-specific configuration needed to enable automatic sleep tracking through Apple HealthKit.

---

## 📋 Prerequisites

- **iOS Development Environment**: Xcode 12+ and iOS 14+ target
- **Apple Developer Account**: Required for HealthKit entitlements
- **Physical iOS Device**: HealthKit doesn't work in simulators

---

## ⚙️ Step 1: Install Dependencies

The required dependencies have already been added to `package.json`:

```bash
npm install @react-native-community/apple-healthkit react-native-health
```

**Dependencies Added:**
- `@react-native-community/apple-healthkit@^0.6.0`
- `react-native-health@^1.19.0`

---

## 🔧 Step 2: App Configuration (app.json)

Add HealthKit configuration to your `app.json`:

```json
{
  "expo": {
    "name": "Lyra - Personal Life Operating System",
    "slug": "lyra-personal-life-operating-system",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.lyra.ai",
      "entitlements": {
        "com.apple.developer.healthkit": true,
        "com.apple.developer.healthkit.access": [
          "health-records"
        ]
      },
      "infoPlist": {
        "NSHealthShareUsageDescription": "Lyra needs access to your sleep data to provide personalized insights and track your sleep patterns automatically.",
        "NSHealthUpdateUsageDescription": "Lyra wants to save sleep data to your Health app to keep your health information synchronized.",
        "NSHealthClinicalHealthRecordsShareUsageDescription": "Lyra may access your health records to provide comprehensive health insights."
      }
    }
  }
}
```

---

## 📱 Step 3: Expo Development Build Configuration

Since HealthKit requires native code, you need an Expo Development Build:

### 3.1 Install Expo CLI and EAS CLI
```bash
npm install -g @expo/cli eas-cli
```

### 3.2 Configure EAS Build
Create `eas.json` in your project root:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.3 Build Development Client
```bash
eas build --profile development --platform ios
```

---

## 🔒 Step 4: Apple Developer Console Setup

### 4.1 Enable HealthKit Capability
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select your App ID (`com.lyra.ai`)
4. Click **Edit** → **Capabilities**
5. Enable **HealthKit**
6. Save changes

### 4.2 Create Provisioning Profile
1. Create a new **Development Provisioning Profile**
2. Select your App ID with HealthKit enabled
3. Select your development certificate
4. Select your test devices
5. Download and install the profile

---

## 📝 Step 5: Usage Descriptions for App Store

Add these detailed descriptions to ensure App Store approval:

### NSHealthShareUsageDescription
```
"Lyra needs access to your sleep data to provide personalized insights and track your sleep patterns automatically. This helps you understand your sleep quality and receive recommendations for better rest."
```

### NSHealthUpdateUsageDescription
```
"Lyra wants to save sleep data to your Health app to keep your health information synchronized across all your devices and apps."
```

### Optional: NSHealthClinicalHealthRecordsShareUsageDescription
```
"Lyra may access your health records to provide comprehensive health insights when you choose to share this information."
```

---

## 🧪 Step 6: Testing HealthKit Integration

### 6.1 Test on Physical Device
```bash
# Install development build on your iPhone
eas build --profile development --platform ios
# Install the .ipa file on your test device
```

### 6.2 Enable Health App on Device
1. Open **Health app** on iPhone
2. Go to **Health Data** → **Sleep**
3. Add some sample sleep data manually
4. Grant permissions when Lyra requests them

### 6.3 Test Permission Flow
1. Open Lyra app
2. Go to **Settings** → **Sleep Tracking**
3. Tap **Connect Apple Health**
4. Allow permissions in HealthKit dialog
5. Verify automatic sleep data sync

---

## 📦 Step 7: Production Build Configuration

### 7.1 Production App.json Updates
```json
{
  "expo": {
    "ios": {
      "buildNumber": "1",
      "bundleIdentifier": "com.lyra.ai",
      "entitlements": {
        "com.apple.developer.healthkit": true
      }
    }
  }
}
```

### 7.2 App Store Connect Setup
1. Create app in **App Store Connect**
2. Set **Bundle ID**: `com.lyra.ai`
3. Enable **HealthKit** in app capabilities
4. Add privacy policy URL
5. Complete app review information

---

## 🚀 Step 8: Deployment Commands

### Development Build
```bash
eas build --profile development --platform ios
```

### Production Build
```bash
eas build --profile production --platform ios
```

### Submit to App Store
```bash
eas submit --platform ios
```

---

## ✅ Verification Checklist

### Pre-Build Checklist
- [ ] HealthKit dependencies installed
- [ ] App.json configured with entitlements
- [ ] Usage descriptions added
- [ ] Apple Developer account HealthKit enabled
- [ ] EAS CLI configured

### Post-Build Checklist
- [ ] Development build installs on device
- [ ] HealthKit permission dialog appears
- [ ] Sleep data can be read from Health app
- [ ] Sleep data syncs to Lyra backend
- [ ] Background sync works (test by sleeping)

### App Store Submission Checklist
- [ ] Production build created
- [ ] App Store Connect configured
- [ ] Privacy policy includes HealthKit usage
- [ ] App review notes mention HealthKit features
- [ ] Screenshots show HealthKit integration

---

## 🔧 Troubleshooting

### Permission Issues
- **Problem**: HealthKit permissions denied
- **Solution**: Check Health app → Privacy → Apps → Lyra

### Build Issues
- **Problem**: HealthKit entitlement errors
- **Solution**: Verify Apple Developer console HealthKit is enabled

### Data Sync Issues
- **Problem**: No sleep data syncing
- **Solution**: Add manual sleep data in Health app for testing

### Background Sync Not Working
- **Problem**: Data only syncs when app is open
- **Solution**: iOS limitations - background sync is limited, data will sync when app becomes active

---

## 📊 HealthKit Data Types Used

The app requests access to these HealthKit data types:

### Read Permissions
- `HKCategoryTypeIdentifierSleepAnalysis` - Sleep sessions
- `HKQuantityTypeIdentifierHeartRate` - Heart rate during sleep
- `HKQuantityTypeIdentifierRestingHeartRate` - Resting heart rate
- `HKQuantityTypeIdentifierHeartRateVariability` - HRV data
- `HKQuantityTypeIdentifierOxygenSaturation` - Blood oxygen levels

### Write Permissions
- `HKCategoryTypeIdentifierSleepAnalysis` - Save sleep data back to Health

---

## 🎯 Next Steps After Configuration

1. **Install dependencies**: `npm install`
2. **Create development build**: `eas build --profile development --platform ios`
3. **Test on device**: Install and test HealthKit permissions
4. **Configure production**: Set up App Store Connect
5. **Submit for review**: Include HealthKit usage in app description

---

## 🆘 Support Resources

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [Expo HealthKit Guide](https://docs.expo.dev/versions/latest/sdk/health/)
- [React Native HealthKit Library](https://github.com/agencyenterprise/react-native-health)

---

## 🎉 Congratulations!

Once configured, your Lyra AI app will have:
- ✅ Automatic sleep tracking via HealthKit
- ✅ Sleep stages detection (light, deep, REM)
- ✅ Heart rate monitoring during sleep
- ✅ Background data synchronization
- ✅ Privacy-compliant data handling
- ✅ Seamless iOS Health app integration

Your users will be able to track sleep automatically without any manual input!