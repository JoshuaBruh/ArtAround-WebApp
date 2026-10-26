import { useState } from 'react';

// Incapsula l'attraversamento delle tappe: indice corrente, tappa target
// durante le transizioni, fase, e le opzionali rifiutate. Non sa nulla di
// audio, correlati o voce — solo "dove sono, dove sto andando".
export default function useVisitaNavigazione(tappe) {
    const [opzionaliRifiutate, setOpzionaliRifiutate] = useState(new Set());

    const findNextValidIndex = (fromIndex) => {
        let idx = fromIndex;
        while (idx < tappe.length && (!tappe[idx] || !tappe[idx].item)) {
            idx++;
        }
        return idx;
    };

    const findPrevAccessibleIndex = (fromIndex) => {
        let idx = fromIndex;
        while (idx >= 0) {
            const t = tappe[idx];
            if (t && t.item) {
                if (t.opzionale && opzionaliRifiutate.has(idx)) {
                    idx--;
                    continue;
                }
                return idx;
            }
            idx--;
        }
        return -1;
    };

    const firstValidIndex = findNextValidIndex(0);

    const [indiceTappa, setIndiceTappa] = useState(firstValidIndex);
    const [tappaTarget, setTappaTarget] = useState(firstValidIndex);
    const [fase, setFase] = useState(firstValidIndex < tappe.length ? 'intermedia_sala' : 'vuoto');

    const tappaCorrente = tappe[indiceTappa] || {};
    const itemCorrente = tappaCorrente.item || {};
    const tappaDestinazione = tappe[tappaTarget] || {};
    const itemDestinazione = tappaDestinazione.item || {};

    const valutaEProsegui = (candidateIndex, originIndex) => {
        if (candidateIndex >= tappe.length) {
            setFase('fine_visita');
            return;
        }

        const candidateTappa = tappe[candidateIndex];

        if (candidateTappa.opzionale && !opzionaliRifiutate.has(candidateIndex)) {
            setTappaTarget(candidateIndex);
            setFase('intermedia_opzionale');
            return;
        }

        const originSala = tappe[originIndex]?.item?.id_sala;
        const targetSala = candidateTappa.item?.id_sala;

        if (originSala && targetSala && originSala !== targetSala) {
            setTappaTarget(candidateIndex);
            setFase('intermedia_sala');
        } else {
            setIndiceTappa(candidateIndex);
            setTappaTarget(candidateIndex);
            setFase('opera');
        }
    };

    const handleProssima = () => {
        const nextValid = findNextValidIndex(indiceTappa + 1);
        valutaEProsegui(nextValid, indiceTappa);
    };

    const handlePrecedente = () => {
        const prevIdx = findPrevAccessibleIndex(indiceTappa - 1);

        if (prevIdx >= 0) {
            setOpzionaliRifiutate(prev => {
                const nextSet = new Set(prev);
                for (let i = prevIdx; i < tappe.length; i++) {
                    nextSet.delete(i);
                }
                return nextSet;
            });

            setIndiceTappa(prevIdx);
            setTappaTarget(prevIdx);
            setFase('opera');
        } else {
            setTappaTarget(indiceTappa);
            setFase('intermedia_sala');
        }
    };

    const handleSceltaOpzionale = (accetta) => {
        if (accetta) {
            const originSala = itemCorrente?.id_sala;
            const targetSala = itemDestinazione?.id_sala;

            if (originSala && targetSala && originSala !== targetSala) {
                setFase('intermedia_sala');
            } else {
                setIndiceTappa(tappaTarget);
                setFase('opera');
            }
        } else {
            setOpzionaliRifiutate(prev => new Set(prev).add(tappaTarget));
            const nextValid = findNextValidIndex(tappaTarget + 1);
            valutaEProsegui(nextValid, indiceTappa);
        }
    };

    const handleConfermaCambioSala = () => {
        setIndiceTappa(tappaTarget);
        setFase('opera');
    };

    const eUltimaTappa = findNextValidIndex(indiceTappa + 1) >= tappe.length;
    const isUltimoTarget = findNextValidIndex(tappaTarget + 1) >= tappe.length;
    const ePrimaTappa = indiceTappa === tappaTarget;

    return {
        indiceTappa, tappaTarget, fase, setFase,
        itemCorrente, itemDestinazione,
        firstValidIndex, eUltimaTappa, isUltimoTarget, ePrimaTappa,
        handleProssima, handlePrecedente, handleSceltaOpzionale, handleConfermaCambioSala
    };
}