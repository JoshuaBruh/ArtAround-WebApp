import { useState, useEffect, useCallback, useRef } from 'react';
import { getItem, postVoiceCommand } from '../../api';
import useSpeechSynthesis from './SpeechSynt';
import useSpeechRecognition from './SpeechRec';
import useVisitaNavigazione from './useVisitaNavigazione';
import { costruisciDettaglioMappa } from './Mappa';
import VistaFineVisita from './VistaFineVisita';
import VistaIntermediaSala from './VistaIntermediaSala';
import VistaOperaOpzionale from './VistaOperaOpzionale';
import VistaOpera from './VistaOpera';
import VistaCorrelato from './VistaCorrelato';

const LIVELLI_TONO = ['infantile', 'semplice', 'medio', 'avanzato'];
const LIVELLI_DURATA = ['3s', '15s', '1m', '3m'];

export default function Player({ config, museo, onExit }) {
    const visita = config?.visita;
    const tappe = visita?.tappe || [];

    const {
        indiceTappa, fase, setFase, itemCorrente, itemDestinazione,
        firstValidIndex, eUltimaTappa, isUltimoTarget, ePrimaTappa,
        handleProssima, handlePrecedente, handleSceltaOpzionale, handleConfermaCambioSala
    } = useVisitaNavigazione(tappe);

    // Tono e Durata dell'opera corrente
    const [tono, setTono] = useState(config?.tonoIniziale || 'medio');
    const [durata, setDurata] = useState(config?.durataIniziale || '1m');

    // Tono e Durata del correlato aperto (indipendenti da quelli dell'opera)
    const [tonoCorrelato, setTonoCorrelato] = useState(config?.tonoIniziale || 'medio');
    const [durataCorrelato, setDurataCorrelato] = useState('1m');

    const [correlatoAttivo, setCorrelatoAttivo] = useState(null);
    const [caricamentoCorrelato, setCaricamentoCorrelato] = useState(false);
    const [caricamentoVoce, setCaricamentoVoce] = useState(false);

    // mostraHelp resta qui (non dentro VistaOpera) perche' i comandi vocali
    // "dove sono i bagni" ecc. devono poterlo aprire da questo componente
    const [mostraHelp, setMostraHelp] = useState(false);
    const [dettaglioHelpIniziale, setDettaglioHelpIniziale] = useState(null);

    const { isSpeaking, playAudio, stopAudio } = useSpeechSynthesis();

    const saltaStopAudioRef = useRef(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [indiceTappa, fase]);

    useEffect(() => {
        if (saltaStopAudioRef.current) {
            saltaStopAudioRef.current = false;
            return;
        }
        stopAudio();
    }, [indiceTappa, fase, tono, durata, tonoCorrelato, durataCorrelato, stopAudio]);

    const infoSalaCorrente = museo?.struttura_sale?.[itemCorrente.id_sala] || null;
    const infoSalaDestinazione = museo?.struttura_sale?.[itemDestinazione.id_sala] || null;

    const getTestoDescrizione = useCallback(() => {
        if (!itemCorrente?.descrizioni) return "Descrizione non disponibile per questa opera.";
        return itemCorrente.descrizioni?.[tono]?.[durata]?.testo || "Descrizione non disponibile per questa combinazione.";
    }, [itemCorrente, tono, durata]);

    const getTestoDescrizioneCorrelato = (data) => {
        if (!data?.descrizioni) return data?.descrizione || "Descrizione non disponibile per questo correlato.";
        return data.descrizioni?.[tonoCorrelato]?.[durataCorrelato]?.testo ||
            data.descrizione ||
            "Descrizione non disponibile per questa combinazione.";
    };

    const handleApriCorrelato = async (id, tipo) => {
        if (!id) return;
        setCaricamentoCorrelato(true);
        try {
            const data = await getItem(id);
            setCorrelatoAttivo({ tipo, data });
            setTonoCorrelato(tono);
            setDurataCorrelato(durata === '15s' ? '15s' : '1m');
            setFase('dettaglio_correlato');
        } catch (e) {
            console.error("Errore caricamento correlato:", e);
            saltaStopAudioRef.current = false;
            alert("Impossibile caricare le informazioni sul correlato.");
        } finally {
            setCaricamentoCorrelato(false);
        }
    };


    // -------------------------------------------------------------------------
    // COMANDI VOCALI
    // -------------------------------------------------------------------------

    const haTestoValido = (descrizioni, tonoCheck, durataCheck) => {
        const testo = descrizioni?.[tonoCheck]?.[durataCheck]?.testo;
        return typeof testo === 'string' && testo.trim().length > 0;
    };

    const calcolaNuovoLivello = (item, tipo, dir, tonoAttuale, durataAttuale) => {
        const descrizioni = item?.descrizioni || {};
        const arr = tipo === 'tono' ? LIVELLI_TONO : LIVELLI_DURATA;
        const valAttuale = tipo === 'tono' ? tonoAttuale : durataAttuale;
        const idxAttuale = arr.indexOf(valAttuale);

        let targetIdx = idxAttuale + dir;
        let prossimoValido = null;

        while (targetIdx >= 0 && targetIdx < arr.length) {
            const t = tipo === 'tono' ? arr[targetIdx] : tonoAttuale;
            const d = tipo === 'durata' ? arr[targetIdx] : durataAttuale;

            if (haTestoValido(descrizioni, t, d)) {
                prossimoValido = arr[targetIdx];
                break;
            }
            targetIdx += dir;
        }

        if (!prossimoValido) {
            const messaggio = dir < 0
                ? (tipo === 'tono'
                    ? "Sei già al livello di linguaggio più semplice disponibile per questa scheda."
                    : "Sei già alla descrizione più breve disponibile per questa scheda.")
                : (tipo === 'tono'
                    ? "Sei già al livello di linguaggio più avanzato disponibile per questa scheda."
                    : "Sei già al massimo livello di approfondimento disponibile per questa scheda.");
            return { nuovoValore: valAttuale, messaggioErrore: messaggio };
        }

        return { nuovoValore: prossimoValido, messaggioErrore: null };
    };

    const handleTranscriptInput = async (testo) => {
        stopAudio();
        setCaricamentoVoce(true);

        const inCorrelato = fase === 'dettaglio_correlato' && correlatoAttivo;
        const itemTarget = inCorrelato ? correlatoAttivo?.data : itemCorrente;
        const tonoAtt = inCorrelato ? tonoCorrelato : tono;
        const durataAtt = inCorrelato ? durataCorrelato : durata;

        try {
            const data = await postVoiceCommand(testo);
            const intent = (data?.intent || '').trim().toUpperCase();

            switch (intent) {
                case 'PROSSIMO':
                    saltaStopAudioRef.current = true;
                    playAudio("Passo alla prossima tappa.");
                    if (inCorrelato) { setCorrelatoAttivo(null); setFase('opera'); }
                    handleProssima();
                    break;

                case 'PRECEDENTE':
                    saltaStopAudioRef.current = true;
                    if (inCorrelato) {
                        playAudio("Torno all'opera.");
                        setCorrelatoAttivo(null);
                        setFase('opera');
                    } else {
                        playAudio("Torno alla tappa precedente.");
                        handlePrecedente();
                    }
                    break;

                case 'ASCOLTA':
                    if (inCorrelato) playAudio(getTestoDescrizioneCorrelato(correlatoAttivo.data));
                    else playAudio(getTestoDescrizione());
                    break;

                case 'DIMMI_DI_PIU': {
                    const { nuovoValore, messaggioErrore } = calcolaNuovoLivello(itemTarget, 'durata', 1, tonoAtt, durataAtt);
                    if (messaggioErrore) {
                        playAudio(messaggioErrore);
                    } else {
                        saltaStopAudioRef.current = true;
                        playAudio("Aumento il livello di dettaglio.");
                        if (inCorrelato) setDurataCorrelato(nuovoValore); else setDurata(nuovoValore);
                    }
                    break;
                }

                case 'DIMMI_DI_MENO': {
                    const { nuovoValore, messaggioErrore } = calcolaNuovoLivello(itemTarget, 'durata', -1, tonoAtt, durataAtt);
                    if (messaggioErrore) {
                        playAudio(messaggioErrore);
                    } else {
                        saltaStopAudioRef.current = true;
                        playAudio("Riduco la durata della spiegazione.");
                        if (inCorrelato) setDurataCorrelato(nuovoValore); else setDurata(nuovoValore);
                    }
                    break;
                }

                case 'TROPPO_SEMPLICE': {
                    const { nuovoValore, messaggioErrore } = calcolaNuovoLivello(itemTarget, 'tono', 1, tonoAtt, durataAtt);
                    if (messaggioErrore) {
                        playAudio(messaggioErrore);
                    } else {
                        saltaStopAudioRef.current = true;
                        playAudio("Imposto un linguaggio più approfondito.");
                        if (inCorrelato) setTonoCorrelato(nuovoValore); else setTono(nuovoValore);
                    }
                    break;
                }

                case 'NON_CAPISCO': {
                    const { nuovoValore, messaggioErrore } = calcolaNuovoLivello(itemTarget, 'tono', -1, tonoAtt, durataAtt);
                    if (messaggioErrore) {
                        playAudio(messaggioErrore);
                    } else {
                        saltaStopAudioRef.current = true;
                        playAudio("Semplifico il linguaggio.");
                        if (inCorrelato) setTonoCorrelato(nuovoValore); else setTono(nuovoValore);
                    }
                    break;
                }

                case 'CHI_AUTORE':
                    if (itemCorrente.id_artista) {
                        saltaStopAudioRef.current = true;
                        playAudio("Apro la scheda dell'artista.");
                        handleApriCorrelato(itemCorrente.id_artista, 'Artista');
                    } else {
                        playAudio("Informazione sull'autore non disponibile.");
                    }
                    break;

                case 'QUAL_TECNICA':
                    if (itemCorrente.id_tecnica) {
                        saltaStopAudioRef.current = true;
                        playAudio("Apro la scheda della tecnica.");
                        handleApriCorrelato(itemCorrente.id_tecnica, 'Tecnica');
                    } else {
                        playAudio("Informazione sulla tecnica non disponibile.");
                    }
                    break;

                case 'QUAL_STILE':
                    if (itemCorrente.id_movimento) {
                        saltaStopAudioRef.current = true;
                        playAudio("Apro la scheda dello stile.");
                        handleApriCorrelato(itemCorrente.id_movimento, 'Movimento');
                    } else {
                        playAudio("Informazione sullo stile non disponibile.");
                    }
                    break;

                // Da qui in giù nessun saltaStopAudioRef necessario: mostraHelp e
                // dettaglioHelpIniziale non sono osservati dall'effetto di stopAudio,
                // quindi non c'e' alcun rischio che la risposta venga interrotta.
                case 'DOVE_USCITA': {
                    const d = costruisciDettaglioMappa('ingressi_uscite', { museo, infoSalaCorrente, posizioneOpera: itemCorrente.posizione });
                    playAudio(d.testo);
                    setDettaglioHelpIniziale(d);
                    setMostraHelp(true);
                    break;
                }
                case 'DOVE_BAGNO': {
                    const d = costruisciDettaglioMappa('bagni', { museo, infoSalaCorrente, posizioneOpera: itemCorrente.posizione });
                    playAudio(d.testo);
                    setDettaglioHelpIniziale(d);
                    setMostraHelp(true);
                    break;
                }
                case 'DOVE_BAR': {
                    const d = costruisciDettaglioMappa('bar', { museo, infoSalaCorrente, posizioneOpera: itemCorrente.posizione });
                    playAudio(d.testo);
                    setDettaglioHelpIniziale(d);
                    setMostraHelp(true);
                    break;
                }
                case 'DOVE_SHOP': {
                    const d = costruisciDettaglioMappa('shop', { museo, infoSalaCorrente, posizioneOpera: itemCorrente.posizione });
                    playAudio(d.testo);
                    setDettaglioHelpIniziale(d);
                    setMostraHelp(true);
                    break;
                }
                case 'OSTACOLI': {
                    const d = costruisciDettaglioMappa('ostacoli', { museo, infoSalaCorrente, posizioneOpera: itemCorrente.posizione });
                    playAudio(d.testo);
                    setDettaglioHelpIniziale(d);
                    setMostraHelp(true);
                    break;
                }
                case 'SONO_SALA_GIUSTA': {
                    const d = costruisciDettaglioMappa('sala_corrente', { museo, infoSalaCorrente, posizioneOpera: itemCorrente.posizione });
                    playAudio(d.testo);
                    setDettaglioHelpIniziale(d);
                    setMostraHelp(true);
                    break;
                }

                default:
                    playAudio("Comando non riconosciuto, riprova o usa i bottoni.");
                    break;
            }
        } catch (e) {
            console.error("Errore processamento voce:", e);
            playAudio("Si è verificato un errore nel servizio di ascolto.");
        } finally {
            setCaricamentoVoce(false);
        }
    };

    const { isListening, isSupported, errore, startListening, stopListening: stopMic } = useSpeechRecognition({
        onResult: handleTranscriptInput
    });

    const micProps = { isSupported, caricamentoVoce, isListening, onStart: startListening, onStop: stopMic };

    // -------------------------------------------------------------------------
    // RENDER: sceglie la vista in base alla fase
    // -------------------------------------------------------------------------

    if (firstValidIndex >= tappe.length) {
        return (
            <div className="container py-5 text-center">
                <div className="alert alert-warning py-4">
                    Nessuna opera valida presente in questa visita.
                </div>
                <button type="button" className="btn btn-secondary"
                    onClick={() => onExit && onExit('listaVisite')}>Torna indietro</button>
            </div>
        );
    }

    if (fase === 'fine_visita') {
        return <VistaFineVisita visita={visita} onExit={onExit} />;
    }

    if (fase === 'intermedia_sala') {
        return (
            <VistaIntermediaSala
                ePrimaTappa={ePrimaTappa}
                itemDestinazione={itemDestinazione}
                infoSalaDestinazione={infoSalaDestinazione}
                museo={museo}
                isSpeaking={isSpeaking}
                playAudio={playAudio}
                stopAudio={stopAudio}
                onConferma={handleConfermaCambioSala}
            />
        );
    }

    if (fase === 'intermedia_opzionale') {
        return (
            <VistaOperaOpzionale
                itemDestinazione={itemDestinazione}
                isUltimoTarget={isUltimoTarget}
                onScelta={handleSceltaOpzionale}
            />
        );
    }

    if (fase === 'opera') {
        return (
            <VistaOpera
                indiceTappa={indiceTappa}
                totaleTappe={tappe.length}
                titoloVisita={visita?.titolo}
                itemCorrente={itemCorrente}
                infoSalaCorrente={infoSalaCorrente}
                museo={museo}
                testoDescrizione={getTestoDescrizione()}
                isSpeaking={isSpeaking}
                playAudio={playAudio}
                stopAudio={stopAudio}
                tono={tono}
                setTono={setTono}
                durata={durata}
                setDurata={setDurata}
                onPrecedente={handlePrecedente}
                onProssima={handleProssima}
                eUltimaTappa={eUltimaTappa}
                onApriCorrelato={handleApriCorrelato}
                caricamentoCorrelato={caricamentoCorrelato}
                micProps={micProps}
                errore={errore}
                mostraHelp={mostraHelp}
                dettaglioHelpIniziale={dettaglioHelpIniziale}
                onApriHelp={() => { setDettaglioHelpIniziale(null); setMostraHelp(true); }}
                onChiudiHelp={() => { setMostraHelp(false); setDettaglioHelpIniziale(null); }}
                onEsci={() => onExit && onExit('listaVisite')}
            />
        );
    }

    if (fase === 'dettaglio_correlato' && correlatoAttivo) {
        return (
            <VistaCorrelato
                tipo={correlatoAttivo.tipo}
                data={correlatoAttivo.data}
                testoCorrelato={getTestoDescrizioneCorrelato(correlatoAttivo.data)}
                isSpeaking={isSpeaking}
                playAudio={playAudio}
                stopAudio={stopAudio}
                micProps={micProps}
                errore={errore}
                tonoCorrelato={tonoCorrelato}
                setTonoCorrelato={setTonoCorrelato}
                durataCorrelato={durataCorrelato}
                setDurataCorrelato={setDurataCorrelato}
                indiceTappa={indiceTappa}
                onTornaAllaVisita={() => { setCorrelatoAttivo(null); setFase('opera'); }}
                mostraHelp={mostraHelp}
                dettaglioHelpIniziale={dettaglioHelpIniziale}
                onApriHelp={() => { setDettaglioHelpIniziale(null); setMostraHelp(true); }}
                onChiudiHelp={() => { setMostraHelp(false); setDettaglioHelpIniziale(null); }}
                museo={museo}
                infoSalaCorrente={infoSalaCorrente}
                posizioneOpera={itemCorrente?.posizione}
            />
        );
    }

    return null;
}