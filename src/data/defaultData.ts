import { Department, Specialty, Category, Protocol, AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Rx Protocol',
  appSubtitle: 'Clinical Protocol Reference',
  theme: 'system',
  accentColor: 'blue',
  fontSize: 'normal',
  showDisclaimerNotice: true,
};

export const DEFAULT_DEPARTMENTS: Department[] = [];

export const DEFAULT_SPECIALTIES: Specialty[] = [];
export const DEFAULT_CATEGORIES: Category[] = DEFAULT_SPECIALTIES;

export const DEFAULT_PROTOCOLS: Protocol[] = [];
