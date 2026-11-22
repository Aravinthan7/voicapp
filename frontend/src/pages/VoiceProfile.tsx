import React, { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle2, ShieldCheck, Trash2, Play, Square, Sparkles } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { InlineAlert } from '../components/common/InlineAlert';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { voiceProfileService } from '../services/voiceProfileService';
import { getErrorMessage } from '../utils/errors';
import type { VoiceProfile as VoiceProfileType } from '../types';

export const VoiceProfile: React.FC = () => {
  const [profile, setProfile] = useState<VoiceProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Enrollment Stepper: 1: Consent, 2: Record, 3: Test & Review, 4: Done
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Consent
  const [hasConsented, setHasConsented] = useState(false);
  const [submittingConsent, setSubmittingConsent] = useState(false);

  // Step 2: Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [submittingSample, setSubmittingSample] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  // Step 3: Test Playback
  const [testingPlayback, setTestingPlayback] = useState(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);

  // Deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await voiceProfileService.getProfile();
        setProfile(res);
        if (res.status === 'ready') {
          setStep(4);
        }
      } catch {
        // If not found or not enrolled, stay on step 1
      }
    }
    void loadProfile();
  }, []);

  const handleGrantConsent = async () => {
    if (!hasConsented) return;
    setError(null);
    setSubmittingConsent(true);
    try {
      await voiceProfileService.recordConsent('v1.0-voiceapp-consent');
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingConsent(false);
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setError('Unable to access microphone for voice sample recording.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSubmitSample = async () => {
    if (!audioBlob) return;
    setError(null);
    setSubmittingSample(true);
    try {
      const formData = new FormData();
      formData.append('sample', audioBlob, 'voice_sample.webm');
      const updatedProfile = await voiceProfileService.uploadVoiceSample(formData);
      setProfile(updatedProfile);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingSample(false);
    }
  };

  const handleTestPlayback = async () => {
    setError(null);
    setTestingPlayback(true);
    try {
      const res = await voiceProfileService.testVoicePlayback(
        'வணக்கம், வாய்ஸ்ஆப் மூலம் உங்கள் குரலில் பேசுகிறேன்.',
        'ta-IN'
      );
      setTestAudioUrl(res.audioUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTestingPlayback(false);
    }
  };

  const handleDeleteProfile = async () => {
    setError(null);
    setDeleting(true);
    try {
      await voiceProfileService.deleteProfile();
      setProfile(null);
      setAudioBlob(null);
      setTestAudioUrl(null);
      setHasConsented(false);
      setStep(1);
      setShowDeleteModal(false);
      setSuccessMsg('Your voice profile and sample were permanently deleted.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full py-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-purple-400" />
          <h1 className="text-2xl font-bold text-ink-primary">Voice Cloning &amp; Consent</h1>
        </div>
        <p className="text-sm text-ink-secondary">
          Voice cloning allows the translated speech heard by your peer to resemble your natural voice tone and timbre.
        </p>
      </div>

      {error && <InlineAlert type="error" message={error} />}
      {successMsg && <InlineAlert type="success" message={successMsg} />}

      {/* Existing Profile Status Card */}
      {profile?.status === 'ready' && step === 4 ? (
        <Card elevated className="flex flex-col gap-5 border-purple-500/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-primary">Your Voice Profile is Active</h2>
                <p className="text-xs text-ink-muted">
                  Enrolled via authorized speaker conditioning &bull; Supported for Malayalam &amp; Tamil
                </p>
              </div>
            </div>
            <Badge tone="audioAi">Active Profile</Badge>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated text-xs text-ink-secondary leading-relaxed border border-border-subtle">
            When you join calls, translated speech sent to the listener will be synthesized using your authorized voice model. You can re-record your voice sample or delete it at any time.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border-subtle">
            <Button
              variant="secondary"
              onClick={() => {
                setStep(2);
                setAudioBlob(null);
              }}
            >
              Re-record Voice Sample
            </Button>

            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              leadingIcon={<Trash2 className="size-4" />}
            >
              Delete My Voice Profile
            </Button>
          </div>
        </Card>
      ) : (
        /* Stepper Enrollment Flow */
        <Card elevated className="flex flex-col gap-6">
          {/* Stepper Header */}
          <div className="grid grid-cols-3 gap-2 pb-4 border-b border-border-subtle text-xs text-center font-medium">
            <div className={`p-2 rounded-xl ${step === 1 ? 'bg-brand-600 text-white' : 'text-ink-muted'}`}>
              1. Consent &amp; Privacy
            </div>
            <div className={`p-2 rounded-xl ${step === 2 ? 'bg-brand-600 text-white' : 'text-ink-muted'}`}>
              2. Record Sample
            </div>
            <div className={`p-2 rounded-xl ${step === 3 ? 'bg-brand-600 text-white' : 'text-ink-muted'}`}>
              3. Verify &amp; Finish
            </div>
          </div>

          {/* Step 1: Explicit Consent */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-brand-500" />
                <h2 className="text-base font-bold text-ink-primary">Explicit Voice Consent</h2>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated text-xs text-ink-secondary space-y-2 border border-border-subtle leading-relaxed">
                <p>
                  <strong>How your audio is used:</strong> You are authorizing VoiceApp to capture a short voice sample (10-20 seconds) solely to configure a voice-conditioned speech synthesis profile.
                </p>
                <p>
                  <strong>Strict Privacy Principles:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Only <strong>your own voice</strong> may be recorded and enrolled. Recording another person is strictly prohibited.</li>
                  <li>Your audio sample is processed solely for generating your speech profile and is never sold or used for public training.</li>
                  <li>You retain the right to delete your voice sample and profile at any time with a single click.</li>
                  <li>If voice cloning is unavailable or disabled during a call, standard synthesized fallback voices are used.</li>
                </ul>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-border-subtle cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-1 size-4 accent-brand-500 cursor-pointer"
                />
                <span className="text-xs text-ink-primary font-medium leading-relaxed">
                  I explicitly consent to providing a sample of my own voice for the sole purpose of real-time translated voice synthesis in VoiceApp.
                </span>
              </label>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  disabled={!hasConsented}
                  loading={submittingConsent}
                  onClick={handleGrantConsent}
                >
                  Confirm &amp; Proceed to Recording
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Record Audio Sample */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-bold text-ink-primary">Record Your Voice Sample</h2>
              <p className="text-xs text-ink-secondary">
                Please read the following sentence clearly in your natural speaking voice (approx. 10 to 15 seconds):
              </p>

              <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-brand-500/30 text-sm font-medium text-ink-primary text-center italic leading-relaxed">
                "Hello, I am testing my voice for VoiceApp real-time speech translation. This sample will represent my voice in live conversations."
              </div>

              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-bg border border-border-subtle gap-4">
                <div className="text-2xl font-mono font-bold text-ink-primary">
                  00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </div>

                {isRecording ? (
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={handleStopRecording}
                    leadingIcon={<Square className="size-5" />}
                  >
                    Stop Recording
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartRecording}
                    leadingIcon={<Mic className="size-5" />}
                  >
                    {audioBlob ? 'Re-record Sample' : 'Start Recording'}
                  </Button>
                )}

                {audioBlob && !isRecording && (
                  <p className="text-xs text-status-success font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    <span>Sample captured ({recordingSeconds}s). Ready to submit.</span>
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!audioBlob || isRecording}
                  loading={submittingSample}
                  onClick={handleSubmitSample}
                >
                  Upload &amp; Build Voice Profile
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Test & Review */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-bold text-ink-primary">Verify Cross-Lingual Playback</h2>
              <p className="text-xs text-ink-secondary">
                Listen to a sample phrase generated using your voice profile to verify speech quality and naturalness:
              </p>

              <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle flex flex-col gap-3">
                <span className="text-xs font-semibold text-ink-muted">Test Phrase (Tamil Synthesis):</span>
                <p className="text-sm font-medium text-emerald-300">
                  "வணக்கம், வாய்ஸ்ஆப் மூலம் உங்கள் குரலில் பேசுகிறேன்."
                </p>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleTestPlayback}
                  loading={testingPlayback}
                  leadingIcon={<Play className="size-4" />}
                  className="self-start"
                >
                  Generate &amp; Play Test Audio
                </Button>

                {testAudioUrl && (
                  <audio controls autoPlay src={testAudioUrl} className="w-full mt-2" />
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Re-record
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setStep(4);
                    setSuccessMsg('Voice profile successfully activated for your calls!');
                  }}
                >
                  Accept &amp; Finish
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Voice Profile"
        description="Are you sure you want to permanently delete your voice profile?"
      >
        <div className="flex flex-col gap-4 text-sm text-ink-secondary">
          <p>
            Deleting your voice profile will permanently remove your recorded audio sample and all synthesized voice metadata. Future calls will automatically fall back to standard synthesized voices.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProfile} loading={deleting}>
              Confirm Permanent Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
