import { useState, useRef, useCallback, useEffect } from 'react';

export default function useSpeechRecognition({ onResult }) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported] = useState(() =>
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );

    const [errore, setErrore] = useState('');
    const recognitionRef = useRef(null);
    const onResultRef = useRef(onResult);

    // Mantiene sempre il riferimento aggiornato alla funzione onResult
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'it-IT';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setErrore('');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript && onResultRef.current) {
                onResultRef.current(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.warn("Errore riconoscimento vocale:", event.error);
            setIsListening(false);

            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setErrore("Permesso al microfono negato — controlla le impostazioni del browser.");
            } else if (event.error === 'audio-capture') {
                setErrore("Nessun microfono trovato su questo dispositivo.");
            } else if (event.error === 'no-speech') {
                setErrore("Non ho sentito, riprova.");
            } else {
                setErrore("Errore del riconoscimento vocale, riprova.");
            }
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setErrore('');
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Errore avvio microfono:", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return { isListening, isSupported, errore, startListening, stopListening };
}