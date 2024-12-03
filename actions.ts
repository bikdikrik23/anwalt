import * as bot_tools from "./tg_bot_tools"
import * as types from "./types"
import * as bt from "./basictools"
import dedent from "dedent"
import * as ai from "./aitools"

export async function createWiderspruch(action: types.Action,bot: bot_tools.bot, request_chain: bot_tools.request_chain, input: string) {
    
    let beratung = request_chain.data.beratung

    if(request_chain.data[action.name]){
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
        const prompt = `
            Ich benötige eine überarbeitete und verfeinerte Widerspruchsbegründung. Es gibt bereits eine bestehende Version, die auf den bereitgestellten Unterlagen basiert. Zudem liegt Benutzer-Feedback vor, das berücksichtigt werden muss. Ziel ist es, eine präzisere und rechtlich fundierte Begründung zu erstellen, die die vorhandenen Schwächen ausbessert und den Benutzeranforderungen entspricht.

            ### Bereitstellung von Unterlagen:
            - **Abgetippter Text der Klausur:**
            ${klausurText}
            - **Korrektur der Klausur:**
            ${korrekturText}
            - **JaPro Baden Württemberg Stand 2023:**
            ${JaPROText}

            ### Bestehende Version der Widerspruchsbegründung:
            """
            ${request_chain.data.action_result}
            """

            ### Benutzer-Feedback:
            """
            ${input}
            """

            ### Anforderungen an die neue Version:
            1. **Überarbeitung und Verfeinerung:**
            - Verbessere die bestehende Version in Sprache und Argumentation.
            - Berücksichtige die Anmerkungen aus dem Benutzer-Feedback vollständig.
            - Halte dich weiterhin an die Struktur und Anforderungen aus der ursprünglichen Aufgabe.

            2. **Struktur der überarbeiteten Begründung:**
            1. **Einleitung:** Darstellung des Sachverhalts und der Verfahrenshistorie.
            2. **Kernargumente:** Kritische Auseinandersetzung mit den Fehlern in der Klausurkorrektur.
                - Konkrete Bezugnahme auf die Kriterien aus der JaPRO (BW).
                - Verfassungsrechtliche Maßstäbe (z. B. Gleichbehandlungsgrundsatz, Willkürverbot).
            3. **Forderungen:** Explizite Forderung nach Aufhebung des Bescheids und Neubewertung.

            3. **Detaillierte Anforderungen an die Argumentation:**
            - Inwiefern die Korrekturmethodik den Anforderungen der JaPRO (BW) nicht entspricht.
            - Welche inhaltlichen, methodischen oder formalen Fehler bei der Bewertung vorliegen.
            - Hinweise auf willkürliche Bewertungen oder logische Brüche in der Argumentation des Korrektors.
            - Bezugnahme auf relevante Urteile oder wissenschaftliche Studien (z. B. Fehleranfälligkeit bei Klausurbewertungen).

            4. **Zusätzliche Vorgaben:**
            - Prägnante und überzeugende Sprache.
            - Modularer Aufbau, um die Begründung leicht an andere Klausuren anzupassen.

            ### Ziel:
            Erstelle eine verbesserte und vollständig überarbeitete Widerspruchsbegründung, die die Anforderungen der ursprünglichen Aufgabe erfüllt und das Benutzer-Feedback integriert.
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
        
        let loWiederspruchserklärung = response.choices[0].message.content.trim();

        console.log("Antwort der KI:", response.choices[0].message.content.trim());
        bt.endLoadingBar(bot, request_chain.user, loLoadingContext, '✅ Wiederspruchserklärung wurde generiert!')
        await bot.sendMessage(request_chain.user, loWiederspruchserklärung)
    }else{
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
        
        let loWiederspruchserklärung = response.choices[0].message.content.trim();

        request_chain.data[action.name] = loWiederspruchserklärung

        console.log("Antwort der KI:", response.choices[0].message.content.trim());
        await bt.endLoadingBar(bot, request_chain.user, loLoadingContext, '✅ Wiederspruchserklärung wurde generiert!')
        await bot.sendMessage(request_chain.user, loWiederspruchserklärung)
    }
  }