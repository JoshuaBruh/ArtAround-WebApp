import { useState, useCallback, useEffect, useRef } from 'react';

export default function useSpeechSynthesis() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const timeoutRef = useRef(null);

    const stopAudio = useCallback(() => {
        clearTimeout(timeoutRef.current);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const playAudio = useCallback((testoDaLeggere) => {
        if (!('speechSynthesis' in window) || !testoDaLeggere) return;
        stopAudio();
        const utter = new SpeechSynthesisUtterance(testoDaLeggere);
        utter.lang = 'it-IT';
        utter.rate = 1.0;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        timeoutRef.current = setTimeout(() => window.speechSynthesis.speak(utter), 50);
    }, [stopAudio]);

    useEffect(() => () => {
        clearTimeout(timeoutRef.current);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }, []);

    return { isSpeaking, playAudio, stopAudio };
}