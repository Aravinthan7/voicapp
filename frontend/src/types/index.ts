export type LanguageCode = 'ml-IN' | 'ta-IN';

export interface SupportedLanguage {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, SupportedLanguage> = {
  'ml-IN': {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
  },
  'ta-IN': {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
  },
} as const;

export interface User {
  id: string;
  email: string;
  displayName: string;
  speakingLanguage: LanguageCode;
  listeningLanguage: LanguageCode;
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
  status: CallStatus;
  primaryLanguage: LanguageCode;
  secondaryLanguage: LanguageCode;
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
  languagesSupported: LanguageCode[];
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
  speakerId: string;
  speakerName: string;
  originalText: string;
  translatedText: string;
  originalLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  isFinal: boolean;
  timestamp: number;
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
