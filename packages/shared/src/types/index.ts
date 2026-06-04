export type ProfileType = 'adult' | 'baby' | 'teen' | 'senior';
export type Gender = 'male' | 'female' | 'other';
export type FamilyRole = 'owner' | 'member' | 'child';
export type AuthProvider = 'google' | 'apple' | 'phone';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 1 | 2 | 3 | 4 | 5;

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

export interface UiPreferences {
  fontScale: number;
  theme: 'default' | 'vibrant' | 'pastel' | 'senior';
  simplifiedMode: boolean;
}

export interface PrivacySettings {
  showDetailsToFamily: boolean;
  showMealLogs: boolean;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  authProvider: AuthProvider;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  type: ProfileType;
  avatarUrl?: string;
  birthDate?: Date;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  activityLevel: ActivityLevel;
  tdeeKcal?: number;
  nutritionTargets?: NutritionTargets;
  uiPreferences?: UiPreferences;
  isActive: boolean;
}

export interface Family {
  id: string;
  ownerId: string;
  name: string;
  inviteCode: string;
  isActive: boolean;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  profileId: string;
  role: FamilyRole;
  privacySettings: PrivacySettings;
  joinedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  activityMultiplier: number;
}
