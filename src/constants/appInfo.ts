/** App metadata for About screen, store listings, and release builds. */
export const APP_NAME = 'Drug Wars Reloaded';
export const APP_VERSION = '1.0.0';
export const APP_BUILD = '1';
export const APP_TAGLINE = 'Offline street-trading strategy. No account required.';

export const STUDIO_NAME = 'AIventure Studios';
export const STUDIO_DISPLAY_NAME = 'AI Venture Studios';
export const COPYRIGHT_YEAR = '2026';
export const DEVELOPER_LINE = `Developed by ${STUDIO_NAME}`;
export const COPYRIGHT_LINE = `© ${COPYRIGHT_YEAR} ${STUDIO_NAME}. All rights reserved.`;
export const STUDIO_WEBSITE = 'https://www.aiventure-studios.com';

export const BUNDLE_ID = 'com.aiventurestudios.drugwarsreloaded';
export const PRIVACY_POLICY_URL =
  'https://www.aiventure-studios.com/drugwars-reloaded/privacy';
export const SUPPORT_EMAIL = 'contact@aiventure-studios.com';
export const PRIVACY_CONTACT_EMAIL = 'contact@aiventure-studios.com';

export const ABOUT_PRIVACY_BULLETS = [
  'Offline single-player',
  'No account required',
  'No ads currently',
  'No analytics currently',
  'Local save data stored on device',
] as const;

/** @deprecated Use ABOUT_PRIVACY_BULLETS — kept for any legacy imports. */
export const PRIVACY_NOTES = ABOUT_PRIVACY_BULLETS;

export const CREDITS_LINE = `© ${STUDIO_NAME}. Built with Expo & React Native.`;
