import { useCallback, useRef, useState, useEffect } from 'react';

interface VoiceAlertOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

export const useVoiceAlerts = (enabled: boolean = true) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load available voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        speechSynthesis.cancel();
      };
    }
  }, []);

  const speak = useCallback((text: string, options: VoiceAlertOptions = {}) => {
    if (!isSupported || !enabled) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for clear, urgent alerts
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Try to find a good English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferredVoice = englishVoices.find(v => 
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')
    ) || englishVoices[0] || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, enabled, voices]);

  const speakAlert = useCallback((
    zoneName: string, 
    riskLevel: string, 
    score: number,
    explanation: string,
    suggestedAction: string
  ) => {
    if (!enabled) return;

    let urgency = '';
    let rate = 1.0;
    
    if (riskLevel === 'critical') {
      urgency = 'Critical warning!';
      rate = 1.1;
    } else if (riskLevel === 'high') {
      urgency = 'High risk alert!';
      rate = 1.05;
    } else if (riskLevel === 'moderate') {
      urgency = 'Caution!';
      rate = 1.0;
    }

    const message = `${urgency} Approaching ${zoneName}. Risk score: ${score}. ${explanation}. ${suggestedAction}`;
    
    speak(message, { rate });
  }, [enabled, speak]);

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    speak,
    speakAlert,
    stop,
    voices,
  };
};
