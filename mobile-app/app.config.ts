// apps/mobile/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

export interface TenantBuildManifest {
  ident: string;
  appDisplayName: string;
  iosBundleId: string;
  androidPackageName: string;
  version: string;
  iosBuildNumber: number;
  androidVersionCode: number;
  primaryColor: string;
  splashBackgroundColor: string;
  easUpdateChannel: string;
  associatedDomain: string; // e.g., "consult.myclinic.com"
  defaultLocale?: string;   // Marketplace Admin Default Language (e.g., "en", "hi", "ar", "es")
  supportedLocales?: string[];
  autoDetectCountryLocale?: boolean;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // Loaded by pre-build script `scripts/prepare-tenant-assets.ts` from Rails API
  const manifestPath = path.resolve(__dirname, '.tenant-build/manifest.json');
  const tenant: TenantBuildManifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    : {
        ident: 'default',
        appDisplayName: 'ExpertHub Pass',
        iosBundleId: 'app.experthub.pass',
        androidPackageName: 'app.experthub.pass',
        version: '1.0.0',
        iosBuildNumber: 1,
        androidVersionCode: 1,
        primaryColor: '#2563EB',
        splashBackgroundColor: '#FFFFFF',
        easUpdateChannel: 'production',
        associatedDomain: 'app.experthub.app',
        defaultLocale: 'en',
        supportedLocales: ['en', 'hi', 'ar', 'es', 'fr', 'de', 'pt', 'ja'],
        autoDetectCountryLocale: true,
      };

  const defaultLocale = tenant.defaultLocale || 'en';
  const supportedLocales = tenant.supportedLocales?.length
    ? tenant.supportedLocales
    : ['en', 'hi', 'ar', 'es', 'fr', 'de', 'pt', 'ja'];

  return {
    ...config,
    name: tenant.appDisplayName,
    slug: `experthub-${tenant.ident}`,
    version: tenant.version,
    orientation: 'portrait',
    icon: './.tenant-build/icon-1024.png',
    scheme: `experthub-${tenant.ident}`,
    userInterfaceStyle: 'automatic',
    locales: {
      en: './.tenant-build/locales/en.json',
      hi: './.tenant-build/locales/hi.json',
      ar: './.tenant-build/locales/ar.json',
      es: './.tenant-build/locales/es.json',
      fr: './.tenant-build/locales/fr.json',
      de: './.tenant-build/locales/de.json',
      pt: './.tenant-build/locales/pt.json',
      ja: './.tenant-build/locales/ja.json',
    },
    splash: {
      image: './.tenant-build/splash.png',
      resizeMode: 'contain',
      backgroundColor: tenant.splashBackgroundColor,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: tenant.iosBundleId,
      buildNumber: String(tenant.iosBuildNumber),
      associatedDomains: [`applinks:${tenant.associatedDomain}`],
      googleServicesFile: './.tenant-build/GoogleService-Info.plist',
      infoPlist: {
        CFBundleAllowMixedLocalizations: true,
        CFBundleDevelopmentRegion: defaultLocale,
        CFBundleLocalizations: supportedLocales,
        NSCameraUsageDescription: `${tenant.appDisplayName} requires camera access for live video consultations and uploading diagnostic or advisory documents.`,
        NSMicrophoneUsageDescription: `${tenant.appDisplayName} requires microphone access for live audio/video consultations and voice intake notes.`,
        NSPhotoLibraryUsageDescription: `${tenant.appDisplayName} requires photo library access so you can attach reports and files for your expert.`,
        UIBackgroundModes: ['audio', 'voip', 'fetch', 'remote-notification'],
      },
    },
    android: {
      package: tenant.androidPackageName,
      versionCode: tenant.androidVersionCode,
      googleServicesFile: './.tenant-build/google-services.json',
      adaptiveIcon: {
        foregroundImage: './.tenant-build/adaptive-icon.png',
        backgroundColor: tenant.splashBackgroundColor,
      },
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'MODIFY_AUDIO_SETTINGS',
        'POST_NOTIFICATIONS',
        'FOREGROUND_SERVICE',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: tenant.associatedDomain, pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-localization',
      [
        '@daily-co/config-plugin-rn-daily-js',
        { enableCamera: true, enableMicrophone: true, enableScreenShare: true },
      ],
    ],
    extra: {
      tenantIdent: tenant.ident,
      primaryColor: tenant.primaryColor,
      defaultLocale,
      supportedLocales,
      autoDetectCountryLocale: tenant.autoDetectCountryLocale !== false,
      supportsRTL: true,
      forcesRTL: defaultLocale === 'ar',
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.experthub.app',
    },
    updates: {
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
      requestHeaders: { 'expo-channel-name': tenant.easUpdateChannel },
    },
    runtimeVersion: { policy: 'appVersion' },
  };
};
