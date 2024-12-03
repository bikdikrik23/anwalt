const { OpenAI } = require('openai');
export const openai = new OpenAI();

import dedent from 'dedent';
import * as types from './types'
import { topics } from './anwalt';
import fs from "fs"

// Funktion für den Dateiupload
export async function uploadDocument(filePath: string, fileName: string): Promise<string> {
  try {
    const fileContent = fs.readFileSync(filePath);
    const response = await openai.files.create({
      purpose: 'answers',
      file: fileContent,
      fileName: fileName,
    });
    return response.id; // Dateiname zurückgeben
  } catch (error) {
    console.error(`Fehler beim Hochladen der Datei (${fileName}):`, error);
    return null;
  }
}

export async function getAIAnswer(prompt: string, json: boolean): Promise<string | any>{
    try{

        let responseObject: any
        if(json){
            responseObject = await openai.chat.completions.create({
                messages: [{role: "system",content: prompt}],model: "gpt-4o",response_format: { type: "json_object" }
            });
        }else{
            responseObject = await openai.chat.completions.create({messages: [{role: "system",content: prompt}],model: "gpt-4o"});
        }
    
        let content = responseObject.choices[0].message.content.trim()

        if(json){return JSON.parse(content)}else{return content}
    }catch(error){
        return `There was an unexpected error:  ${error.message}`
    }
}

export async function provideLegalInsights(verlauf: string[]): Promise<string> {
    const loPrompt = dedent`
      Du bist eine KI, die juristische Erstgespräche führt. Analysiere den folgenden Verlauf:
      ${JSON.stringify(verlauf)}
  
      Identifiziere den möglichen Rechtsbereich (z. B. Mietrecht, Arbeitsrecht) und gib eine erste Einschätzung. 
      Formatiere deine Antwort wie folgt:
  
      - **Rechtsbereich**: [z. B. Mietrecht]
      - **Einschätzung**: [Kurzer Hinweis, z. B. "Es scheint, als ob es sich um eine Kündigung des Mietvertrags handelt."]
      - **Nächste Schritte**: [Z. B. "Fordern Sie den Mietvertrag an."]
    `;
    return await getAIAnswer(loPrompt, false);
}

export async function requestDocuments(verlauf: string[]): Promise<string> {
    const loPrompt = dedent`
        Du bist eine KI, die juristische Fälle analysiert. Basierend auf folgendem Verlauf:
        ${JSON.stringify(verlauf)}

        Identifiziere alle relevanten Dokumente, die für diesen Fall benötigt werden könnten. Gib eine klare, höfliche Liste zurück, die an den Mandanten gesendet werden kann.
    `;
    return await getAIAnswer(loPrompt, false);
}

export async function generateInsuranceRequest(verlauf: string[]): Promise<string> {
    const loPrompt = dedent`
      Du bist eine KI, die Anfragen für Rechtsschutzversicherungen generiert. Basierend auf folgendem Verlauf:
      ${JSON.stringify(verlauf)}
  
      Erstelle ein professionelles Schreiben für eine Rechtsschutzversicherung, das die relevanten Informationen enthält. Formatiere es klar und höflich.
    `;
    return await getAIAnswer(loPrompt, false);
}

export async function generateLegalAdvice(beratung: types.Beratung): Promise<string> {
    // Prompt erstellen
  let loTopic = topics.find(t=>t.name === beratung.topic)

  if(loTopic){
    const loPrompt = dedent`
    Du bist eine hochintelligente KI, die als erfahrener Anwalt agiert. Deine Aufgabe ist es, den Mandanten durch eine juristische Beratung zu führen. Dabei entscheidest du, was der nächste logische Schritt im Gespräch ist, basierend auf den bisherigen Gesprächen, den verfügbaren Informationen und den Anforderungen des aktuellen Themas.

    Sei stets:
    - **Freundlich:** Sprich den Mandanten direkt und höflich an.
    - **Professionell:** Gib präzise und durchdachte Antworten.
    - **Hilfreich:** Konzentriere dich immer auf den nächsten relevanten Schritt, ohne den Mandanten mit unnötigen Informationen zu überfordern.

    ### Relevante Daten:
    1. **Thema der Beratung:**
      - ${loTopic.name}

    2. **Bisheriger Gesprächsverlauf:**
      - ${JSON.stringify(beratung.verlauf)}

    3. **Gesammelte Informationen:**
      ${beratung.infos.map((info) => `- ${info.name}: ${info.value}`).join("\n") || "Keine Informationen vorhanden"}

    4. **Anforderungen des Themas:**
      - Erforderliche Informationen:
        ${loTopic.infoRequirements.map((req) => `- ${req.name} (${req.optional ? "optional" : "erforderlich"})`).join("\n")}

    5. **Verfügbare Aktionen (basierend auf aktuellen Informationen):**
      - ${loTopic.actions.filter((action) =>
          action.prerequisites.every((prereq) =>
            beratung.infos.some((info) => info.name === prereq && info.value)
          )
        ).map((action) => `- ${action.name}`).join("\n") || "Keine verfügbaren Aktionen"}

    6. **Nicht verfügbare Aktionen (und Gründe):**
      - ${loTopic.actions.filter((action) =>
          action.prerequisites.some((prereq) =>
            !beratung.infos.some((info) => info.name === prereq && info.value)
          )
        ).map((action) => `- ${action.name}: Fehlt ${action.prerequisites.filter((prereq) => 
          !beratung.infos.some((info) => info.name === prereq && info.value)
        ).join(", ")}`).join("\n") || "Keine"}

    ### Deine Aufgabe:
    - Analysiere die vorhandenen Informationen und den Gesprächsverlauf.
    - Entscheide, was der nächste logische Schritt ist.
    - Stelle präzise Fragen, falls wichtige Informationen fehlen, und konzentriere dich dabei auf den nächsten relevanten Punkt, nicht auf alles gleichzeitig.
    - Schlage eine verfügbare Aktion vor, falls sie im aktuellen Kontext sinnvoll ist.
    - Gib dem Mandanten das Gefühl, dass er gut beraten wird, und erkläre, warum du bestimmte Schritte vorschlägst.
    - Formuliere deine Antwort so, als ob du ein erfahrener Anwalt bist, der in einem Gespräch eine klare und durchdachte Empfehlung ausspricht.

    Beispiel für eine Antwort:
    - „Vielen Dank für die bisherigen Informationen. Um den Fall weiter zu bearbeiten, bräuchte ich jetzt noch eine Kopie Ihres Mietvertrags. Könnten Sie diese hochladen?“
    - „Auf Basis der vorliegenden Daten könnte ich jetzt prüfen, ob Ihre Rechtsschutzversicherung greift. Soll ich das tun?“
    - „Die vorliegenden Informationen reichen für eine erste Einschätzung aus. Meine Empfehlung: Kontaktieren Sie einen Fachanwalt, um diese Angelegenheit weiter zu verfolgen.“

    Antworte in einem prägnanten und professionellen Freitext, der den Mandanten klar durch die nächsten Schritte leitet.
    `
  
    const response = await getAIAnswer(loPrompt, false);
  
    return response
  }else{
    return 'Technischer Fehler 723'
  }
}

export async function extractInfos(input: string, topic: types.Topic, existingInfos: types.InfoData[]): Promise<types.InfoData[]> {
  const loPrompt = dedent
  `
    Hier ist eine Eingabe eines Mandanten:
    "${input}"
    
    Hier sind die Anforderungen des aktuellen Themas:
    ${topic.infoRequirements.map((req) => `- ${req.name} (${req.optional ? "optional" : "erforderlich"})`).join("\n")}

    Hier sind die bereits erfassten Informationen:
    ${existingInfos.map((info) => `- ${info.name}: ${info.value}`).join("\n") || "Keine Informationen vorhanden"}

    Deine Aufgabe:
    1. Analysiere die Eingabe des Mandanten.
    2. Extrahiere relevante Informationen, die streng zu den Anforderungen des Themas passen.
      - **Orientiere dich ausschließlich an den vorgegebenen Anforderungen (oben gelistet).**
      - Falls eine Information nicht eindeutig zugeordnet werden kann, prüfe, ob eine allgemeine Kategorie (z. B. „Vertragsdaten“) existiert, und füge sie dort ein.
      - Erfinde keine neuen Informationsnamen.
    3. Ergänze bestehende Informationen, falls neue Details hinzugefügt wurden.
    4. Überschreibe vorhandene Informationen, falls eine neue Version sinnvoller ist.
    5. Füge neue Informationen hinzu, falls sie den Anforderungen entsprechen.

    Gib die Ergebnisse im JSON-Format zurück, streng basierend auf der bestehenden Struktur:
    {
      "new_infos": [
        { "name": "<Name der Information aus den Anforderungen>", "type": "<Typ der Information>", "value": "<Wert>" }
      ]
    }
    Falls keine Informationen extrahiert werden können, antworte mit "{}".

    Beispiele:
    1. Eingabe: "Ich habe den Mietvertrag hochgeladen."  
      Anforderungen: ["Kopie des Mietvertrags"]  
      Ergebnis: { "new_infos": [ { "name": "Kopie des Mietvertrags", "type": "photo", "value": "file_path.jpg" } ] }

    2. Eingabe: "Der Vertrag begann am 01.01.2023."  
      Anforderungen: ["Vertragsdaten"]  
      Ergebnis: { "new_infos": [ { "name": "Vertragsdaten", "type": "text", "value": "Vertrag begann am 01.01.2023" } ] }

    3. Eingabe: "Die Kündigung wurde am 15.10.2023 verschickt."  
      Anforderungen: ["Kündigungsschreiben"]  
      Ergebnis: { "new_infos": [ { "name": "Kündigungsschreiben", "type": "text", "value": "15.10.2023" } ] }

    Hinweis: Verarbeite die Eingabe präzise und halte dich strikt an die oben definierten Anforderungen.
  `;

  try {

    const response = await getAIAnswer(loPrompt, true); // JSON-Antwort
    console.log(`AI INFO EXTRACTION: ${JSON.stringify(response)}`)
    
    if(response.new_infos){
      return response.new_infos
    }else{
      return []
    }
  } catch (error) {
    console.error("Fehler bei der Informations-Extraktion:", error);
    return [];
  }
}

  export async function decideHomeInputStep(user: types.Mandant, input: string) {
    // Namen aller offenen Beratungen als Kontext
    const openCases = user.beratungen.map(beratung => beratung.name);

    const prompt = dedent`
    Du bist ein digitaler juristischer Assistent namens "Hugel & AI". Der Benutzer hat im Hauptmenü eine Eingabe gemacht: "${input}".
    
    Kontext:
    - Der Benutzer hat Zugriff auf folgende Optionen:
      1. '🆕 Neue Beratung starten'
      2. '⚖ Offene Beratungen'
      3. 'Hugel & AI 🏛'
      4. 'Nutzungsbedingungen 🛡️'
      5. 'Name einer speziellen offenen Beratung'

    - Es gibt bereits folgende offene Beratungen: ${openCases.length > 0 ? openCases.join(", ") : "Keine"}
    - Ziel: Analysiere die Eingabe und erstelle eine Antwort, die den Benutzer professionell und freundlich durch die relevanten Optionen führt.

    Deine Aufgabe:
    1. Analysiere den Text, um zu verstehen, was der Benutzer möchte.
       - Gehe davon aus, dass der Benutzer entweder eine neue Beratung starten möchte oder sich auf eine seiner offenen Beratungen bezieht.
       - Falls unklar, gib allgemeine Optionen an.
    2. Erstelle eine kurze Antwort, die die Eingabe des Benutzers aufgreift.
    3. Gib eine Liste von maximal 3 relevanten Aktionen zurück, basierend auf den oben genannten Optionen.

    JSON-Format der Antwort:
    {
      "text": "Antwort auf die Eingabe des Nutzers",
      "actions": ['🆕 Neue Beratung starten', '⚖ Offene Beratungen']
    }

    Beispiele:
    1. Eingabe: "Ich brauche Hilfe bei meinem Mietvertrag"
       Antwort: {
         "text": "Es klingt so, als ob Sie Unterstützung zu einem Mietvertrag benötigen. Möchten Sie eine neue Beratung starten?",
         "actions": ['🆕 Neue Beratung starten', '⚖ Offene Beratungen']
       }
    2. Eingabe: "Ich will die Beratung zu meiner Kündigungsschutzklage sehen"
       Antwort: {
         "text": "Es klingt so, als ob Sie die Beratung zu 'Kündigungsschutzklage' öffnen möchten. Soll ich das tun?",
         "actions": ["{Spezieller Name der offenen Beratung}", '⚖ Offene Beratungen']
       }
    3. Eingabe: "Was macht ihr genau?"
       Antwort: {
         "text": "Wir sind ein digitaler Rechtsassistent und helfen Ihnen bei rechtlichen Fragen. Möchten Sie mehr über uns erfahren?",
         "actions": ['Hugel & AI 🏛', '🆕 Neue Beratung starten']
       }
    4. Eingabe: "Ich will eure Bedingungen sehen"
       Antwort: {
         "text": "Natürlich, hier sind unsere Nutzungsbedingungen. Soll ich diese für Sie öffnen?",
         "actions": ['Nutzungsbedingungen 🛡️', 'Hugel & AI 🏛']
       }
    `;

    const aiResponse = await getAIAnswer(prompt, true);

    console.log(`AI DECISION: ${JSON.stringify(aiResponse)}`)

    if (aiResponse && aiResponse.text && aiResponse.actions) {
        return aiResponse
    } else {
        return {
            text: "Entschuldigung, ich konnte Ihre Eingabe nicht genau zuordnen. Bitte wählen Sie eine der untenstehenden Optionen aus:",
            actions: ["🆕 Neue Beratung starten", "⚖ Offene Beratungen", "Hugel & AI 🏛", "Nutzungsbedingungen 🛡️"]
        };
    }
}