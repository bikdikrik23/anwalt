import { request_chain, bot } from "./tg_bot_tools";
import * as types from "./types"
import {backNav, db, topics} from "./anwalt"
import dedent from "dedent";
import * as ai from "./aitools"
import * as bt from "./basictools";
import * as main from "./anwalt"
import * as database from "./database"

export async function handleCreateNewBeratung(bot: bot, request_chain: request_chain, input: string){
    let new_beratung: types.Beratung = {
        id: db.mandanten.find(m=>m.tg_id===request_chain.user).beratungen.length, 
        name: "",
        topic: "",
        verlauf: [
            `KI: ✅ *Vielen Dank, dass Sie uns Ihr Anliegen anvertrauen!*
  
            Um für Sie eine passende Beratung zu erstellen, bitten wir Sie, uns kurz und grob zu schildern, worum es geht. 
            
            💡 Keine Sorge: Alle Details und offenen Fragen klären wir anschließend gemeinsam!
  
            Um den Einstieg zu erleichtern, können Sie z. B. schreiben:
  
            "Probleme mit meinem Mietvertrag"
            "Fragen zur Kündigungsschutzklage"
            "Hilfe bei der Prüfung eines Vertrags"
            Sobald wir Ihre Angaben erhalten haben:
  
            📂 Erstellen wir eine Beratung mit einem passenden Titel und Rechtsbereich.
            🚀 Starten wir direkt mit der Klärung aller Details in einem Erstgespräch.
  
            Vielen Dank, dass Sie uns Ihr Vertrauen schenken – wir freuen uns darauf, Ihnen weiterzuhelfen!
  
            💼 Ihr Recht – unser Ziel!
            Hugel & AI – Ihr digitaler Partner im Recht.`,
            `User: ${input}`
        ],
        actions: [],
        infos: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    
      const topicNames = topics.map(t => t.name); // Namen aller Topics
      const actionNames = Array.from(
        new Set(topics.flatMap(t => t.actions.map(a => a.name))) // Alle Aktionen
      );
      
      let loPrompt = dedent
        `Du bist eine hochintelligente KI mit Expertenwissen im deutschen Recht.
  
        Deine Aufgabe ist es:
        1. Basierend auf der folgenden Beschreibung ein passendes Thema (Topic) aus einer Liste bestehender Topics zu finden.
        2. Falls kein passendes Topic existiert, ein neues Thema mit präzisem Namen zu erstellen.
        3. Für den spezifischen Fall eine Liste benötigter Informationen (Infos) und möglicher Aktionen zu generieren.
  
        Beschreibung: "${input}"
  
        **Liste der existierenden Topics:**
        ${topicNames.map(name => `- ${name}`).join("\n")}
  
        **Liste aller möglichen Aktionen:**
        ${actionNames.map(name => `- ${name}`).join("\n")}
  
        Bei der Generierung von Infos und Aktionen beachte bitte:
        - Die Infos sollten die wichtigsten Dokumente, Daten oder Inputs abdecken, die für den Fall erforderlich sind.
        - Aktionen sollen die möglichen nächsten Schritte enthalten, die der Nutzer basierend auf den gesammelten Informationen durchführen kann.
        - Jede Aktion sollte eine Liste von Voraussetzungen haben, die erfüllt sein müssen, damit die Aktion möglich ist.
  
        Bitte antworte strikt in folgendem JSON-Format:
        {
          "topic": "Name eines existierenden Topics oder eines neuen Themas",
          "titel": "Passender Titel für den spezifischen Fall",
          "infoRequirements": [
            { "name": "Name der Information", "type": "text|photo|file", "optional": true|false }
          ],
          "actions": [
            { "name": "Name der Aktion", "prerequisites": ["Info 1", "Info 2"] }
          ]
        }
  
        Beachte:
        - Sei präzise in der Wahl des Topics oder bei der Erstellung eines neuen.
        - Generiere nur sinnvolle Informationen und Aktionen für den gegebenen Kontext.
      `;
    
      let loLoadingContext = await bt.initLoadingBar(bot, request_chain.user)

      let extractedInfo: any = await ai.getAIAnswer(loPrompt, true);

      await bt.endLoadingBar(bot, request_chain.user, loLoadingContext)
    
      console.log(`TOPIC VORSCHLAG!`)
      console.log(`${JSON.stringify(extractedInfo)}`)
  
      if (!topics.some(t => t.name === extractedInfo.topic)) { 
        let loNewTopic: types.Topic = {
            name: extractedInfo.topic,
            infoRequirements: extractedInfo.infoRequirements,
            actions: extractedInfo.actions
        }

        request_chain.data.new_topic = loNewTopic
      }
  
      if (extractedInfo.titel && extractedInfo.topic) {
        new_beratung.name = extractedInfo.titel;
        new_beratung.topic = extractedInfo.topic;
  
        request_chain.data.beratung = new_beratung
        
        // Nachricht mit Vorschlägen
        let loMsg = dedent`
          ✅ *Wir haben eine neue Beratung für Sie erstellt!*
  
          📂 *Titel*: ${new_beratung.name}  
          ⚖ *Bereich*: ${new_beratung.topic}  
  
          Passt das so?  
          - Klicken Sie auf "Titel ändern", um den Titel anzupassen.  
          - Oder wählen Sie "Beratung starten", um direkt fortzufahren.
        `;
    
        await bot.sendMessage(request_chain.user,loMsg,[backNav, [{ text: "✏️ Titel ändern" }], [{ text: "🚀 Beratung starten" }]]);
        request_chain.requests.push({ command_name: "start_beratung", input: "" });
      } else {
        // Nachricht bei unzureichenden Informationen
        let loMsg = dedent`
          ❌ *Entschuldigung, wir konnten aus Ihrer Beschreibung nicht genügend Informationen extrahieren.*  
  
          Bitte beschreiben Sie Ihr Anliegen etwas genauer, damit wir einen passenden Titel und Rechtsbereich vorschlagen können.  
          Beispiel:  
          - "Ich habe Probleme mit meinem Mietvertrag"  
          - "Fragen zur Kündigungsschutzklage"  
          - "Hilfe bei der Prüfung eines Vertrags"  
  
          💡 Falls Sie Unterstützung benötigen, stehen wir Ihnen selbstverständlich zur Seite!
        `;
  
        await bot.sendMessage(request_chain.user,loMsg,[backNav, [{ text: "Erneut versuchen" }]]);
  
        request_chain.requests.push({ command_name: "new_beratung", input: "" });
      }
}

export async function handleSelectBeratung(bot: bot, request_chain: request_chain, input: string) {
    let loMandant = db.mandanten.find(m => m.tg_id === request_chain.user);
    let loBeratung = loMandant?.beratungen.find(b => b.name === input);
    console.log(`BERATUNGEN: ${input}`);

    if (loBeratung) {
        request_chain.data.beratung = loBeratung;
        console.log(`BERATUNG GEFUNDEN!`);

        const topic = topics.find(t => t.name === loBeratung.topic);
        if (!topic) {
            await bot.sendMessage(request_chain.user, `❌ Thema für diese Beratung nicht gefunden.`);
            return;
        }

        let loMenu = bt.getBeratungsMenu(loBeratung)
        

        let loMessage = dedent`
        🗂️ *${loBeratung.name}*
        
        Status: ✅ Aktiv
        Beschreibung: Diese Beratung wurde erfolgreich eingerichtet und ist bereit zur Bearbeitung.
        
        Wähle eine Option aus:
        - *Gespräch fortsetzen:* Um die laufende Beratung weiterzuführen.
        - *Status und Fortschritt:* Überblick über alle gesammelten Infos, noch offene Anforderungen und bereits durchgeführte Aktionen.
        - *Anwalt kontaktieren:* Kontaktiere direkt einen Anwalt.
        
        Zusätzliche Aktionen basieren auf den bisher gesammelten Informationen.
        `;

        await bot.sendMessage(request_chain.user, loMessage, loMenu, null, request_chain);
        request_chain.requests.push({ command_name: "beratung_menu", input: "" });
    } else {
        console.log(`KEINE BERATUNG MIT DEM NAMEN GEFUNDEN!`);
        await bot.sendMessage(request_chain.user, `❌ Keine Beratung mit dem Namen "${input}" gefunden. Bitte versuche es erneut.`);
    }
}

export async function handleStatusAndProgress(bot: bot, request_chain: request_chain) {
    const loBeratung: types.Beratung = request_chain.data.beratung;
    const currentTopic = topics.find(t=>t.name === loBeratung.topic);

    if (!currentTopic) {
        await bot.sendMessage(request_chain.user, "⚠️ Thema der Beratung konnte nicht gefunden werden.");
        return;
    }

    const missingInfos = currentTopic.infoRequirements.filter(req => !loBeratung.infos.some(info => info.name === req.name));
    const generatedResults = loBeratung.actions.map(result => `📂 ${result.name}: ${result.result}`).join("\n");
    const availableActions = currentTopic.actions.filter(action =>action.prerequisites.every(req => loBeratung.infos.some(info => info.name === req)));

    const loMessage = dedent`
    📜 **Status & Fortschritt: ${loBeratung.name}**
    
    🔎 *Zusammenfassung:*
    - Erfasste Informationen: ${loBeratung.infos.length}/${currentTopic.infoRequirements.length}
    - Fehlende Informationen: ${missingInfos.map(info => info.name).join(", ") || "Keine"}
    - Generierte Ergebnisse:
      ${generatedResults || "Noch keine Ergebnisse erstellt"}
    - Verfügbare Aktionen:
      ${availableActions.map(action => `✅ ${action.name}`).join("\n") || "Noch keine verfügbar"}
    `;

    // Dynamische Buttons
    const loOptions = [
        backNav,
        ...loBeratung.infos.map(info => [{ text: `✅ ${info.name}`}]),
        ...missingInfos.map(info => [{ text: `➕ ${info.name}`}]),
        //...availableActions.map(action => [{ text: `⚙️ ${action.name}`, callback_data: `action_${action.name}` }])
    ];

    await bot.sendMessage(request_chain.user, loMessage, loOptions, null, request_chain);
}

export async function initBeratungMenu(bot, request_chain: request_chain, beratung: types.Beratung){
    let loMessage = dedent`
    🗂️ *${beratung.name}*
    
    Status: ✅ Aktiv
    Beschreibung: Diese Beratung wurde erfolgreich eingerichtet und ist bereit zur Bearbeitung.
    
    Wähle eine Option aus:
    - *Gespräch fortsetzen:* Um die laufende Beratung weiterzuführen.
    - *Status und Fortschritt:* Überblick über alle gesammelten Infos, noch offene Anforderungen und bereits durchgeführte Aktionen.
    - *Anwalt kontaktieren:* Kontaktiere direkt einen Anwalt.
    
    Zusätzliche Aktionen basieren auf den bisher gesammelten Informationen.
    `;

    let loMenu = bt.getBeratungsMenu(beratung)
    await bot.sendMessage(request_chain.user, loMessage, loMenu)
    request_chain.requests.push({ command_name: "beratung_menu", input: "" });
}

import fs from "fs";
import path from "path";
import axios from "axios";

export async function handleFileUploadBeratung(bot: bot,request_chain: request_chain,input: string,beratung: types.Beratung,topic: types.Topic) {
  const loPrompt = dedent`
    Du bist eine intelligente juristische KI, die hochgeladene Dokumente analysiert und ihnen die passende Anforderung eines bestimmten Themas zuordnet.

    Hier sind die relevanten Daten:
    - **Beschreibung des hochgeladenen Dokuments:** "${input}"
    - **Anforderungen des aktuellen Themas:**
      ${topic.infoRequirements.map((req) => `- ${req.name} (${req.type}, ${req.optional ? "optional" : "erforderlich"})`).join("\n")}

    Deine Aufgabe:
    1. Ordne das Dokument einer passenden Anforderung zu.
    2. Falls keine passende Anforderung existiert, antworte mit "{}".
    3. Gib nur den Namen der Anforderung als Antwort zurück, z. B.: "Kopie des Mietvertrags".
  `;

  const loLoadingContext = await bt.initLoadingBar(bot, request_chain.user, "Datei wird analysiert...");
  try {
    const response = await ai.getAIAnswer(loPrompt, false);
    console.log(`File Zuordnung: ${response}`);

    if (!response || response.trim() === "{}") {
      console.log("Keine passende Zuordnung für die Datei gefunden.");
      await bt.endLoadingBar(bot, request_chain.user, loLoadingContext, "🚫 Datei konnte nicht zugeordnet werden.");
      await bot.sendMessage(request_chain.user, `...`, request_chain.data.last_menu)
      return;
    }

    const fileData = request_chain.data.files[request_chain.data.files.length - 1];
    const loFilePath = path.resolve(`./files/${request_chain.user}_${beratung.id}_${beratung.infos.length}${fileData.extension}`);

    const writer = fs.createWriteStream(loFilePath);
    const responseStream = await axios.get(fileData.link, { responseType: "stream" });
    responseStream.data.pipe(writer);

    await new Promise((resolve, reject) => {writer.on("finish", resolve); writer.on("error", reject);});

    console.log(`Datei erfolgreich gespeichert unter: ${loFilePath}`);
    await bt.sleep(1000)

    let loInfoRequirement = topic.infoRequirements.find(i=>i.name === response.trim())
    if(!loInfoRequirement){ 
      console.log(`Keine passende Zuordnung für Info ${response} gefunden.`);
      await bt.endLoadingBar(bot, request_chain.user, loLoadingContext, `🚫 Info "${response}" konnte nicht zugeordnet werden.`);
      await bot.sendMessage(request_chain.user, `...`, request_chain.data.last_menu)
      return;
    }

    beratung.infos.push({name: loInfoRequirement.name, type: loInfoRequirement.type, value: loFilePath, new: true});

    // Speichere die aktualisierte Beratung
    await database.saveDatabase(main.db);

    // Ladeanimation beenden und Erfolgsmeldung senden
    await bt.endLoadingBar(bot, request_chain.user, loLoadingContext, "✅ Datei wurde erfolgreich verarbeitet.");
    await bt.sleep(1000)
    await bot.sendMessage(request_chain.user, `✅ Datei wurde erfolgreich der Information "${response.trim()}" zugeordnet und gespeichert.`);
  } catch (error) {
    console.error("Fehler bei der Verarbeitung des hochgeladenen Dokuments:", error);
    await bt.endLoadingBar(bot, request_chain.user, loLoadingContext, "❌ Datei konnte nicht erfolgreich verarbeitet werden!");
    await bt.sleep(1000)
    await bot.sendMessage(request_chain.user, "❌ Fehler beim Verarbeiten der Datei. Bitte versuchen Sie es erneut.");
  } finally {
    // Aufräumen der Request-Chain
    request_chain.data.files = [];
  }
}

export async function handleBeratungsGespräch(bot: bot, request_chain: request_chain, input: string){
  if(input.startsWith(`🏠 Zurück ins Hauptmenü`)){
    await initBeratungMenu(bot, request_chain, request_chain.data.beratung) 
    return
  }

  const loMandant = db.mandanten.find((m) => m.tg_id === request_chain.user);
  const loBeratung = loMandant.beratungen.find((b) => b.name === request_chain.data.beratung.name);
  
  if(!loBeratung){
     console.log(`FEHLER BERATUNG ${request_chain.data.beratung.name} NOT FOUND!`)
     return
  }

  let loTopic = topics.find(t=>t.name === loBeratung.topic)
  if(!loTopic){
    console.log(`FEHLER TOPIC ${loBeratung.topic} NOT FOUND!`)
    return
  }

  const loLoadingContext = await bt.initLoadingBar(bot, request_chain.user);

  loBeratung.verlauf.push(`User: ${input}`);
  await database.saveDatabase(db);

  let extractInfos = await ai.extractInfos(input, loTopic, loBeratung.infos)

  if(extractInfos.length > 0){
    loBeratung.infos = bt.updateInfos(loBeratung.infos, extractInfos)
    await database.saveDatabase(db)
  }
  
  const aiResponse = await ai.generateLegalAdvice(loBeratung);
  loBeratung.verlauf.push(`Anwalt KI: ${aiResponse}`);
  await database.saveDatabase(db);
  bt.endLoadingBar(bot, request_chain.user, loLoadingContext);

  let loOptions = bt.getBeratungsMenu(loBeratung)
  await bot.sendMessage(request_chain.user, aiResponse, loOptions);

}