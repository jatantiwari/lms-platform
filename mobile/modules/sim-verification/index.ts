export {
  getSimCards,
  getDefaultSmsSimSlot,
  getDeviceFingerprint,
  getSecurityStatus,
  getAppHash,
  startSmsRetriever,
  stopSmsRetriever,
  startSmsUserConsent,
  sendSmsForVerification,
  readRecentSms,
  addSmsReceivedListener,
  addSmsTimeoutListener,
  addSmsErrorListener,
  isSmsRetrieverSupported,
} from './src/SimVerificationModule';

export type {
  SimCardInfo,
  DeviceFingerprint,
  SecurityStatus,
  SmsRetrieverResult,
  SimVerificationEvents,
} from './src/SimVerificationModule.types';
