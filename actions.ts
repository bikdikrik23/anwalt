import * as bot_tools from "./tg_bot_tools"
import * as types from "./types"
import * as bt from "./basictools"
import dedent from "dedent"
import * as ai from "./aitools"
import { backNav } from "./anwalt"

export async function createWiderspruch(action: types.Action,bot: bot_tools.bot, request_chain: bot_tools.request_chain, input: string) {
    
    let beratung = request_chain.data.beratung

    let loLoadingContext = await bt.initLoadingBar(bot, request_chain.user, `Wiedersrpuchserklärung wird generiert...`)

    // Infos aus der Beratung laden
    let klausur = beratung.infos.find(i => i.name === "Klausur");
    let korrektur = beratung.infos.find(i => i.name === "Korrektur");
    let aufgabenstellung = beratung.infos.find(i => i.name === "Aufgabenstellung");
    
    // Textextraktion
    const klausurText = await bt.getTextFromFile(klausur.value as string);
    const korrekturText = await bt.getTextFromFile(korrektur.value as string);
    const JaPROText = await bt.getTextFromFile('./japrobw2023.txt');
    
    let aufgabenstellungText = "Nicht vorhanden";
    if (aufgabenstellung) {
        aufgabenstellungText = await bt.getTextFromFile(aufgabenstellung.value as string);
    }
    
    // Prompt erstellen
    const prompt = dedent`
    Ich benötige eine fundierte Widerspruchsbegründung gegen einen Bescheid, der auf der Grundlage einer Klausurkorrektur ergangen ist. 
    Ziel ist es, die Bewertung der Klausur nachweislich als fehlerhaft zu kennzeichnen und eine Neubewertung durchzusetzen. 
    Die Begründung soll auf sprachlich hohem Niveau formuliert sein, präzise juristische Argumente enthalten und sich an die geltenden Rechtsvorschriften im Landesrecht BW orientieren.
    
    ### Bereitstellung von Unterlagen:
    - **Abgetippter Text der Klausur:**
    ${klausurText}
    - **Korrektur der Klausur:**
    ${korrekturText}
    - **JaPro Baden Württemberg Stand 2023:**
    ${JaPROText}
    
    ### Anforderungen an die Struktur der Begründung:
    1. **Einleitung:** Darstellung des Sachverhalts und der Verfahrenshistorie.
    2. **Kernargumente:** Kritische Auseinandersetzung mit den Fehlern in der Klausurkorrektur. 
    - Konkrete Bezugnahme auf die Kriterien aus der JaPRO (BW).
    - Verfassungsrechtliche Maßstäbe (z. B. Gleichbehandlungsgrundsatz, Willkürverbot).
    3. **Forderungen:** Explizite Forderung nach Aufhebung des Bescheids und Neubewertung.
    
    ### Detaillierte Anforderungen an die Argumentation:
    - Inwiefern die Korrekturmethodik den Anforderungen der JaPRO (BW) nicht entspricht.
    - Welche inhaltlichen, methodischen oder formalen Fehler bei der Bewertung vorliegen.
    - Hinweise auf willkürliche Bewertungen oder logische Brüche in der Argumentation des Korrektors.
    - Bezugnahme auf relevante Urteile oder wissenschaftliche Studien (z. B. Fehleranfälligkeit bei Klausurbewertungen).
    
    ### Zusätzliche Vorgaben:
    - Prägnante und überzeugende Sprache.
    - Modularer Aufbau, um die Begründung leicht an andere Klausuren anzupassen.
    `;
    
    // API-Aufruf
    const response = await ai.openai.chat.completions.create({
        model: "gpt-4-turbo", // GPT-4 Turbo mit großem Kontext
        messages: [
            { role: "system", content: "Du bist ein erfahrener Anwalt für Prüfungsrecht. Erstelle eine professionelle Widerspruchsbegründung." },
            { role: "user", content: prompt },
        ],
        max_tokens: 4096, // Platz für die Antwort
        temperature: 0.7,
    });
    
    let loWiderspruchserklärung = response.choices[0].message.content.trim();

    console.log("Antwort der KI:", response.choices[0].message.content.trim());
    await bt.endLoadingBar(bot, request_chain.user, loLoadingContext, '✅ Widerspruchserklärung wurde generiert!')
    await bot.sendMessage(request_chain.user, loWiderspruchserklärung)

    let loMessage = dedent`
    📝 Möchten Sie die Widerspruchserklärung anpassen? Kein Problem! Teilen Sie mir einfach mit, welche Änderungen vorgenommen werden sollen.
    
    ✅ Andernfalls können Sie die Widerspruchserklärung direkt speichern, wenn alles passt!
    `;

    request_chain.data.widerspruch = loWiderspruchserklärung

    await bot.sendMessage(request_chain.user, loMessage, [backNav, [{text: "💾 Speichern"}]])
    request_chain.requests.push({command_name: "create_widerspruch", input: ""})
  }

  export async function createWiderspruchAnalyse(action: types.Action, bot: bot_tools.bot, request_chain: bot_tools.request_chain, input: string) {
    let beratung = request_chain.data.beratung;

    // Infos aus der Beratung laden
    let klausur = beratung.infos.find(i => i.name === "Klausur");
    let korrektur = beratung.infos.find(i => i.name === "Korrektur");
    let aufgabenstellung = beratung.infos.find(i => i.name === "Aufgabenstellung");
    const klausurText = await bt.getTextFromFile(klausur.value as string);
    const korrekturText = await bt.getTextFromFile(korrektur.value as string);
    const JaPROText = await bt.getTextFromFile('./japrobw2023.txt');
    let aufgabenstellungText = "Nicht vorhanden";
    if (aufgabenstellung) {
        aufgabenstellungText = await bt.getTextFromFile(aufgabenstellung.value as string);
    }

    let loLoadingContext = await bt.initLoadingBar(bot, request_chain.user, `Widerspruchserklärung wird schrittweise generiert...`);

    // Phase 1: Analyse der Klausur und der Korrektur
    const phase1Prompt = dedent`
    Bitte analysiere die Klausur und die dazugehörige Korrektur. Identifiziere relevante Abschnitte, in denen methodische, sprachliche oder verfassungsrechtliche Schwächen sichtbar sind. Gib auch konkrete Fehler in der Korrektur an und prüfe die Übereinstimmung mit den gesetzlichen Anforderungen (§§ 14–16 JAPrO BW).
    
    ### Klausur:
    ${klausurText}

    ### Korrektur:
    ${korrekturText}

    ### JaPro Baden-Württemberg (§§ 14-16):
    ${JaPROText}

    ### Grundgesetz (Art. 3, 12):
    - Artikel 3 GG: "Alle Menschen sind vor dem Gesetz gleich. Niemand darf wegen seines Geschlechts, seiner Abstammung, seiner Rasse, seiner Sprache, seiner Heimat und Herkunft, seines Glaubens, seiner religiösen oder politischen Anschauungen benachteiligt oder bevorzugt werden."
    - Artikel 12 GG: "Alle Deutschen haben das Recht, Beruf, Arbeitsplatz und Ausbildungsstätte frei zu wählen. Die Berufsausübung kann durch Gesetz oder auf Grund eines Gesetzes geregelt werden."
`;

    const phase1Response = await ai.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
            { role: "system", content: "Du bist ein erfahrener Anwalt für Prüfungsrecht." },
            { role: "user", content: phase1Prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
    });

    let kritikpunkte = phase1Response.choices[0].message.content.trim();
    console.log("Kritikpunkte:", kritikpunkte);
    loLoadingContext = await bt.updateLoadingBar(bot, request_chain.user, loLoadingContext, 'Kritikpunkte wurden identifiziert.');

    // Phase 2: Juristische Analyse
    const phase2Prompt = dedent`
    Basierend auf den folgenden Kritikpunkten:
    ${kritikpunkte}

    Gib mir die passenden rechtlichen Argumente und mögliche Verstöße gemäß JaPRO BW und den Grundrechten (Art. 3, 12 GG).

    ### JaPro Baden-Württemberg (§§ 14-16):
    ${JaPROText}

    ### Grundgesetz (Art. 3, 12):
    - Artikel 3 GG: "Alle Menschen sind vor dem Gesetz gleich. Niemand darf wegen seines Geschlechts, seiner Abstammung, seiner Rasse, seiner Sprache, seiner Heimat und Herkunft, seines Glaubens, seiner religiösen oder politischen Anschauungen benachteiligt oder bevorzugt werden."
    - Artikel 12 GG: "Alle Deutschen haben das Recht, Beruf, Arbeitsplatz und Ausbildungsstätte frei zu wählen. Die Berufsausübung kann durch Gesetz oder auf Grund eines Gesetzes geregelt werden."
`;

    const phase2Response = await ai.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
            { role: "system", content: "Du bist ein erfahrener Anwalt für Prüfungsrecht." },
            { role: "user", content: phase2Prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
    });

    let rechtlicheArgumente = phase2Response.choices[0].message.content.trim();
    console.log("Rechtliche Argumente:", rechtlicheArgumente);
    loLoadingContext = await bt.updateLoadingBar(bot, request_chain.user, loLoadingContext, 'Rechtliche Grundlagen wurden ergänzt.');

    // Phase 3: Erstellung der Widerspruchsbegründung
    const phase3Prompt = dedent`
        Erstelle eine fundierte Widerspruchsbegründung basierend auf den identifizierten Schwächen und rechtlichen Argumenten.

        ### Kritikpunkte:
        ${kritikpunkte}

        ### Rechtliche Argumente:
        ${rechtlicheArgumente}

        Verwende die folgende Struktur: 
        1. **Einleitung**: Formuliere höflich die Widerspruchsbegründung mit Datum, Bezug auf Bescheid und Kennziffer.
        2. **Rechtsgrundlagen**: Zitierfähige Darstellung der gesetzlichen und verfassungsrechtlichen Maßstäbe.
        3. **Kritikpunkte**: Logische, sprachliche und methodische Fehler in der Bewertung.
        4. **Begehren**: Formuliere Primär- und Sekundärantrag.
    `;

    const phase3Response = await ai.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
            { role: "system", content: "Du bist ein erfahrener Anwalt für Prüfungsrecht." },
            { role: "user", content: phase3Prompt },
        ],
        max_tokens: 3000,
        temperature: 0.7,
    });

    let loWiderspruchserklärung = phase3Response.choices[0].message.content.trim();
    console.log("Widerspruchserklärung:", loWiderspruchserklärung);
    await bt.endLoadingBar(bot, request_chain.user, loLoadingContext, '✅ Widerspruchserklärung wurde generiert!');
    await bot.sendMessage(request_chain.user, loWiderspruchserklärung);

    let loMessage = dedent`
        📝 Möchten Sie die Widerspruchserklärung anpassen? Kein Problem! Teilen Sie mir einfach mit, welche Änderungen vorgenommen werden sollen.

        ✅ Andernfalls können Sie die Widerspruchserklärung direkt speichern, wenn alles passt!
    `;

    request_chain.data.widerspruch = loWiderspruchserklärung;
    await bot.sendMessage(request_chain.user, loMessage, [backNav, [{text: "💾 Speichern"}]]);
    request_chain.requests.push({command_name: "create_widerspruch", input: ""});
}
