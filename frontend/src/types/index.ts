export type LanguageCode = string;

export const SUPPORTED_LANGUAGES: Record<string, { code: string; name: string; nativeName: string }> = {
  'ml-IN': { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  'ta-IN': { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  'hi-IN': { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  'en-IN': { code: 'en-IN', name: 'English', nativeName: 'English' },
};

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  sttSupported?: boolean;
  translationSupported?: boolean;
  ttsSupported?: boolean;
  voiceCloningSupported?: boolean;
  isActive?: boolean;
}

export interface LanguagePair {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  isActive: boolean;
}

export interface SupportedLanguagesResponse {
  languages: SupportedLanguage[];
  pairs: LanguagePair[];
  defaultPair: string[];
}

export interface Workspace {
  id: string;
  name: string;
  ownerId?: string | null;
  planType: string;
  monthlyMinuteLimit: number;
  createdAt: string;
}

export interface UsageSummary {
  workspaceId: string;
  workspaceName: string;
  planType: string;
  totalMinutesUsed: number;
  monthlyMinuteLimit: number;
  minutesRemaining: number;
  totalCallsCount: number;
  activeCallsCount: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  speakingLanguage: string;
  listeningLanguage: string;
  workspaceId?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export type CallStatus = 'waiting' | 'active' | 'ended';

export interface CallRoom {
  id: string;
  code: string;
  createdBy: string;
  workspaceId?: string | null;
  status: CallStatus;
  primaryLanguage: string;
  secondaryLanguage: string;
  createdAt: string;
  endedAt?: string | null;
}

export type AudioOutputMode = 'translated' | 'original' | 'standard_voice';

export type VoiceProfileStatus = 'not_enrolled' | 'pending' | 'ready' | 'failed';

export interface VoiceProfile {
  id: string;
  userId: string;
  status: VoiceProfileStatus;
  provider: string;
  languagesSupported: string[];
  createdAt: string;
}

export interface VoiceConsentRecord {
  id: string;
  userId: string;
  consentVersion: string;
  grantedAt: string;
  revokedAt?: string | null;
}

export type TranslationState = 'idle' | 'listening' | 'translating' | 'speaking' | 'delayed' | 'unavailable';

export interface CaptionItem {
  id: string;
  speakerId?: string;
  speakerName: string;
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  targetLanguage: string;
  isFinal: boolean;
  isPassthrough?: boolean;
  timestamp?: number;
}

export interface SignalingMessage<T = unknown> {
  type:
    | 'join'
    | 'peer-joined'
    | 'peer-left'
    | 'offer'
    | 'answer'
    | 'ice-candidate'
    | 'mute-state'
    | 'output-mode'
    | 'translation-status'
    | 'caption'
    | 'error'
    | 'ping'
    | 'pong'
    | 'end-call';
  payload: T;
  seq: number;
}
