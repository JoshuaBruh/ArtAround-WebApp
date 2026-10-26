import { useState, useEffect } from 'react';
import { CONFIG } from './config';
import { getMuseo, getUtente } from './api';

import HeroSection from './components/HeroSection';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import VisiteAdottate from './components/VisiteAdottate';
import Preferenze from './components/Preferenze';
import Player from './components/Player/Player';

function applicaColoriMuseo(colori) {
    if (!colori) return;
    const root = document.documentElement;

    if (colori.primario) root.style.setProperty('--museo-primario', colori.primario);
    if (colori.secondario) root.style.setProperty('--museo-secondario', colori.secondario);
    if (colori.terziario) root.style.setProperty('--museo-terziario', colori.terziario);
    if (colori.sfondo) root.style.setProperty('--museo-sfondo', colori.sfondo);
}

function utenteIniziale() {
    try {
        const u = JSON.parse(localStorage.getItem('artaround_utente') || 'null');
        return u?.id_utente || u?._id || u?.username || null;
    } catch {
        return null;
    }
}

function App() {
    const [schermata, setSchermata] = useState('hero');
    const [visitaId, setVisitaId] = useState(null);
    const [utenteId, setUtenteId] = useState(utenteIniziale);
    const [museo, setMuseo] = useState(null);
    const [configPlayer, setConfigPlayer] = useState(null);
    const [provenienza, setProvenienza] = useState('hero');
    const [ruolo, setRuolo] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('artaround_utente') || 'null')?.ruolo || null;
        } catch {
            return null;
        }
    });

    const naviga = (nuovaSchermata, extra = {}) => {
        if (extra.visitaId !== undefined) setVisitaId(extra.visitaId);
        if (extra.configPlayer !== undefined) setConfigPlayer(extra.configPlayer);
        setSchermata(nuovaSchermata);
        window.history.pushState(
            { schermata: nuovaSchermata, visitaId: extra.visitaId ?? visitaId },
            ''
        );
    };

    useEffect(() => {
        getMuseo(CONFIG.id_museo)
            .then(data => {
                setMuseo(data);
                applicaColoriMuseo(data?.colori); // Applica i colori personalizzati
                if (data?.icona) {
                    let link = document.querySelector("link[rel*='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'shortcut icon';
                        document.head.appendChild(link);
                    }
                    link.href = data.icona;
                }
                if (data?.nome) document.title = `ArtAround — ${data.nome}`;
                if (data) {
                    localStorage.setItem('artaround_museo', JSON.stringify(data));
                }
            })
            .catch(err => console.error('Errore nel caricamento del museo:', err));


        const params = new URLSearchParams(window.location.search);
        const v = params.get('visita');
        const u = params.get('utente');
        async function avviaDaLink() {
            try {
                const datiUtente = await getUtente(u);
                const adottate = (datiUtente.visite_adottate || []).map(String);

                if (adottate.includes(String(v))) {
                    setUtenteId(u);
                    if (datiUtente.ruolo) setRuolo(datiUtente.ruolo);
                    localStorage.setItem('artaround_utente', JSON.stringify(datiUtente));
                    setVisitaId(v);
                    setSchermata('preferenze');
                    window.history.replaceState({ schermata: 'preferenze', visitaId: v }, '', window.location.pathname);
                } else {
                    console.warn('Utente non autorizzato per questa visita.');
                    setSchermata('hero');
                    window.history.replaceState({ schermata: 'hero', visitaId: null }, '', window.location.pathname);
                }
            } catch (err) {
                console.error('Errore nella verifica utente/visita:', err);
                setSchermata('hero');
                window.history.replaceState({ schermata: 'hero', visitaId: null }, '', window.location.pathname);
            }
        }

        if (v && u) {
            avviaDaLink();
        } else if (window.history.state && window.history.state.schermata) {
            const stato = window.history.state;
            if (stato.visitaId !== undefined) setVisitaId(stato.visitaId);
            setSchermata(stato.schermata === 'player' ? 'preferenze' : stato.schermata);
        } else {
            window.history.replaceState({ schermata: 'hero', visitaId: null }, '');
        }


    }, []);


    useEffect(() => {
        const handlePopState = (event) => {
            const stato = event.state || { schermata: 'hero', visitaId: null };

            if (stato.visitaId !== undefined) setVisitaId(stato.visitaId);

            if (stato.schermata === 'player' && !configPlayer) {
                setSchermata('preferenze');
            } else {
                setSchermata(stato.schermata);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [configPlayer]);


    const handleLogout = () => {
        localStorage.removeItem('artaround_utente');
        setRuolo(null);
        setUtenteId(null);
        naviga('hero');
    };
    const handleGoLogin = () => {
        if (schermata !== 'login') {
            setProvenienza(schermata);
        }
        naviga('login');
    };

    return (
        <div className="d-flex flex-column min-vh-100">

            {schermata !== 'player' && <Header museo={museo} utenteId={utenteId} onLogout={handleLogout} onGoHome={() => naviga('hero')} onLogin={handleGoLogin} />}

            {schermata === 'hero' && (<HeroSection museo={museo} onIniziaVisita={() => { if (utenteId) { naviga('listaVisite'); } else { setProvenienza('listaVisite'); naviga('login'); } }} />)}

            {schermata === 'login' && <Login onSelectUtente={(uId, ruoloUtente) => { setUtenteId(uId); setRuolo(ruoloUtente); naviga(provenienza); }} />}

            {schermata === 'listaVisite' && <VisiteAdottate utenteId={utenteId} ruolo={ruolo} museo={museo} onSelectVisita={(vId) => naviga('preferenze', { visitaId: vId })} />}

            {schermata === 'preferenze' && <Preferenze visitaId={visitaId} onStartPlayer={(config) => naviga('player', { configPlayer: config })} />}

            {schermata === 'player' && (<Player config={configPlayer} museo={museo} onExit={(destinazione) => naviga(destinazione || 'listaVisite')} />)}

            {schermata !== 'player' && <Footer museo={museo} />}

        </div>
    );
}

export default App;

