const express = require('express');
const router = express.Router();
 
const INTENTS_VALIDI = [
    'PROSSIMO', 'PRECEDENTE',
    'ASCOLTA',
    'DIMMI_DI_PIU', 'DIMMI_DI_MENO',
    'TROPPO_SEMPLICE', 'NON_CAPISCO',
    'CHI_AUTORE', 'QUAL_STILE', 'QUAL_TECNICA',
    'DOVE_USCITA', 'DOVE_BAGNO', 'DOVE_BAR', 'DOVE_SHOP',
    'OSTACOLI', 'SONO_SALA_GIUSTA',
    'SCONOSCIUTO'
];
 
// Vocabolario controllato: riconoscimento locale, senza dipendenze esterne.
// L'LLM interviene solo sul linguaggio libero.
const VOCABOLARIO = [
    { intent: 'PROSSIMO', chiavi: ['prossimo', 'avanti', 'successiva'] },
    { intent: 'PRECEDENTE', chiavi: ['precedente', 'indietro', 'torna'] },
    { intent: 'DIMMI_DI_PIU', chiavi: ['dimmi di piu', 'dimmi di più', 'approfondisci'] },
    { intent: 'DIMMI_DI_MENO', chiavi: ['dimmi di meno', 'piu breve', 'più breve'] },
    { intent: 'NON_CAPISCO', chiavi: ['non capisco', 'piu semplice', 'più semplice'] },
    { intent: 'TROPPO_SEMPLICE', chiavi: ['troppo semplice', 'meno scolastico'] },
    { intent: 'CHI_AUTORE', chiavi: ['chi e l autore', "chi è l'autore", 'chi ha dipinto'] },
    { intent: 'QUAL_STILE', chiavi: ['che stile', 'quale stile', "qual è lo stile"] },
    { intent: 'QUAL_TECNICA', chiavi: ['che tecnica', 'quale tecnica', 'con che tecnica'] },
    { intent: 'DOVE_BAGNO', chiavi: ['bagno', 'bagni', 'toilette', 'servizi'] },
    { intent: 'DOVE_USCITA', chiavi: ['uscita', 'uscire'] },
    { intent: 'DOVE_BAR', chiavi: ['bar', 'caffe', 'caffè'] },
    { intent: 'DOVE_SHOP', chiavi: ['shop', 'negozio', 'bookshop'] },
    { intent: 'OSTACOLI', chiavi: ['ostacoli', 'ostacolo', 'accessibilita', 'accessibilità'] },
    { intent: 'ASCOLTA', chiavi: ['cos e questo', "cos'è questo", 'che cos e'] },
    { intent: 'SONO_SALA_GIUSTA', chiavi: ['sono nel posto giusto', 'sono nella sala giusta', 'e questa la sala'] }
];
 
function normalizza(s) {
    return s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // toglie gli accenti
        .replace(/[^\w\s]/g, ' ') // toglie la punteggiatura
        .replace(/\s+/g, ' ').trim();
}
 
function intentLocale(testo) {
    const t = normalizza(testo);
    for (const v of VOCABOLARIO) {
        if (v.chiavi.some(k => t.includes(normalizza(k)))) return v.intent;
    }
    return null;
}
 
const SYSTEM_PROMPT = `Sei un classificatore di intenti per una guida museale vocale.
Dato il testo pronunciato da un visitatore, rispondi SOLO con un oggetto JSON
nella forma {"intent": "NOME"}, scegliendo esattamente uno tra questi intent:
${INTENTS_VALIDI.join(', ')}.
Se il testo non corrisponde chiaramente a nessuno di questi, rispondi con
{"intent": "SCONOSCIUTO"}. Non aggiungere altro testo oltre al JSON.
 
Esempi:
"vai avanti" -> {"intent": "PROSSIMO"}
"torna indietro" -> {"intent": "PRECEDENTE"}
"cos'e' questo" -> {"intent": "ASCOLTA"}
"dimmi di piu'" -> {"intent": "DIMMI_DI_PIU"}
"basta cosi', dimmi di meno" -> {"intent": "DIMMI_DI_MENO"}
"e' troppo semplice, voglio saperne di piu'" -> {"intent": "TROPPO_SEMPLICE"}
"non capisco, puoi semplificare?" -> {"intent": "NON_CAPISCO"}
"troppo difficile" -> {"intent": "NON_CAPISCO"}
"e' troppo complesso" -> {"intent": "NON_CAPISCO"}
"chi ha dipinto quest'opera" -> {"intent": "CHI_AUTORE"}
"che stile e' questo" -> {"intent": "QUAL_STILE"}
"qual e' la tecnica utilizzata" -> {"intent": "QUAL_TECNICA"}
"dove sono i bagni" -> {"intent": "DOVE_BAGNO"}
"dov'e' l'uscita" -> {"intent": "DOVE_USCITA"}
"c'e' un bar qui" -> {"intent": "DOVE_BAR"}
"dove posso comprare qualcosa" -> {"intent": "DOVE_SHOP"}
"ci sono ostacoli" -> {"intent": "OSTACOLI"}
"sono nel posto giusto?" -> {"intent": "SONO_SALA_GIUSTA"}`;
 
router.post('/', async (req, res) => {
    const { testo } = req.body;
 
    if (!testo || typeof testo !== 'string' || !testo.trim()) {
        return res.status(400).json({ errore: 'Testo mancante', intent: 'SCONOSCIUTO' });
    }
 
    // Vocabolario controllato: se il testo lo riconosce, rispondi subito,
    // senza toccare la rete. Requisito obbligatorio del 18-24, indipendente
    // da servizi esterni.
    const locale = intentLocale(testo);
    if (locale) return res.json({ intent: locale, fonte: 'vocabolario' });
 
    // Linguaggio libero (estensione): instradato tramite LLM verso lo stesso
    // insieme chiuso di intent.
    let timeoutId;
    try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 5000);
 
        const risposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: testo }
                ],
                temperature: 0,
                max_tokens: 140,
                reasoning_effort: 'low'
            }),
            signal: controller.signal
        });
 
        if (!risposta.ok) {
            console.error('Errore chiamata LLM:', risposta.status, await risposta.text());
            return res.json({ intent: 'SCONOSCIUTO', fonte: 'llm' });
        }
 
        const dati = await risposta.json();
        const testoRisposta = dati?.choices?.[0]?.message?.content || '';
 
        const pulito = testoRisposta.replace(/```json|```/g, '').trim();
 
        let intent = 'SCONOSCIUTO';
        try {
            const parsed = JSON.parse(pulito);
            if (INTENTS_VALIDI.includes(parsed.intent)) {
                intent = parsed.intent;
            }
        } catch (e) {
            console.error('Risposta LLM non interpretabile come JSON:', testoRisposta);
        }
 
        res.json({ intent, fonte: 'llm' });
 
    } catch (e) {
        console.error('Errore routing vocale:', e.message);
        res.json({ intent: 'SCONOSCIUTO', fonte: 'llm' });
    } finally {
        clearTimeout(timeoutId);
    }
});
 
module.exports = router;
