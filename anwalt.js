"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anwalt_bot = exports.platzhalterMessage = exports.backNav = exports.topics = exports.db = void 0;
require('dotenv').config();
const dedent_1 = __importDefault(require("dedent"));
const database = __importStar(require("./database"));
const tb = __importStar(require("./tg_bot_tools"));
const ai = __importStar(require("./aitools"));
const bt = __importStar(require("./basictools"));
const settings_json_1 = __importDefault(require("./settings.json"));
const topics_1 = require("./topics");
const endpointFunctions_1 = require("./endpointFunctions");
exports.topics = topics_1.mainTopics;
async function initDBAndTopics() {
    try {
        exports.db = await database.getDatabase();
        if (settings_json_1.default.dev_topics) {
            let dynamicTopics = await database.loadDevTopics();
            exports.topics = [...exports.topics, ...dynamicTopics];
        }
        console.log('Datenbank erfolgreich eingelesen:', exports.db);
    }
    catch (error) {
        console.error('Fehler beim Einlesen der Datenbank:', error);
    }
}
//Konstanten für Bot Routen
exports.backNav = [{ text: "🔙 Zurück" }, { text: "🏠 Startseite" }];
exports.platzhalterMessage = "...                                                               ...";
exports.anwalt_bot = new tb.bot(process.env.TG_BOT_TOKEN, { button_type: "inline" });
//Definition der einzelnen Bot-Routen wenn man so will...
exports.anwalt_bot.addCommand({
    name: "start",
    onExecute: async (request_chain, input) => {
        let loMandant = exports.db.mandanten.find(m => m.tg_id === request_chain.user);
        if (!loMandant) {
            loMandant = { beratungen: [], tg_id: request_chain.user };
            exports.db.mandanten.push(loMandant);
        }
        let loMsg = (0, dedent_1.default) `*Willkommen bei Hugel & AI ⚖*  
        _Ihrem kostenfreien Wegweiser im deutschen Recht!_

        Wir freuen uns, dass Sie uns Ihr Vertrauen schenken.  
        Unsere Mission ist es, Ihnen schnell, zuverlässig und kostenfreie rechtliche Unterstützung zu bieten.  

        💼 *Unsere Leistungen*:  
        - Kompetente Beratung in verschiedenen Rechtsgebieten  
        - Unterstützung bei rechtlichen Fragen und Dokumenten  
        - Empfehlungen zu den besten Anwälten für Ihren Fall  

        🔍 *Wie können wir Ihnen helfen?*  
        Bitte wählen Sie aus den folgenden Optionen oder schildern Sie uns direkt Ihr Anliegen.  

        *Ihr Recht – Unser Ziel!*  
        Hugel & AI – Ihr digitaler Partner für rechtliche Angelegenheiten.`;
        let loStartMenu = [
            [{ text: `🆕 Neue Beratung starten` }],
            [{ text: `⚖ Offene Beratungen (${loMandant.beratungen.length})` }],
            [{ text: `Hugel & AI 🏛` }, { text: `Nutzungsbedingungen 🛡️` }]
        ];
        await exports.anwalt_bot.sendMessage(request_chain.user, loMsg, loStartMenu, {}, request_chain);
        request_chain.requests.push({ command_name: "home", input: "" });
    }
});
exports.anwalt_bot.addCommand({
    name: "home",
    onExecute: async (request_chain, input) => {
        let loMandant = exports.db.mandanten.find(m => m.tg_id === request_chain.user);
        if (!loMandant) {
            loMandant = { beratungen: [], tg_id: request_chain.user };
            exports.db.mandanten.push(loMandant);
        }
        let loStartMenu = [
            [{ text: `🆕 Neue Beratung starten` }],
            [{ text: `⚖ Offene Beratungen (${loMandant.beratungen.length})` }],
            [{ text: `Hugel & AI 🏛` }, { text: `Nutzungsbedingungen 🛡️` }]
        ];
        if (input.startsWith(`⚖`)) {
            if (loMandant.beratungen.length === 0) {
                let loMsg = (0, dedent_1.default) `⚠️ *Keine offenen Beratungen gefunden*

                Wir konnten Ihrem Profil aktuell keine offenen Beratungen zuordnen.
                Falls Sie eine Beratung vermissen, melden Sie sich bitte direkt per E-Mail an info@hugel-ai.de – unser Team hilft Ihnen gerne weiter. ✉️

                Möchten Sie stattdessen eine *neue Beratung kostenfrei anlegen*?
                🔍 Teilen Sie uns Ihr Anliegen mit, und wir kümmern uns schnell und zuverlässig darum.

                💼 Ihr Recht – unser Fokus!`;
                await exports.anwalt_bot.sendMessage(request_chain.user, loMsg, loStartMenu, {}, request_chain);
            }
            else {
                let loOptions = [exports.backNav];
                for (let i = 0; i < loMandant.beratungen.length; i++) {
                    loOptions.push([{ text: loMandant.beratungen[i].name }]);
                }
                await exports.anwalt_bot.sendMessage(request_chain.user, `⚖ Wähle die gewünschte offene Beratung!`, loOptions, {}, request_chain);
                request_chain.requests.push({ command_name: "beratungen", input: "" });
            }
        }
        else if (input.startsWith(`🆕`)) {
            let loMsg = (0, dedent_1.default) `
            ✅ *Vielen Dank, dass Sie uns Ihr Anliegen anvertrauen!*
          
            Um für Sie die bestmögliche Beratung zu erstellen, haben Sie zwei Optionen:
            
            1️⃣ Wählen Sie ein Thema aus der untenstehenden Liste, das am besten zu Ihrem Anliegen passt.  
            2️⃣ Oder schildern Sie uns Ihr Anliegen kurz und grob in Ihren eigenen Worten.  
          
            💡 Beispiele für eigene Schilderungen:
            - "Probleme mit meinem Mietvertrag"  
            - "Fragen zur Kündigungsschutzklage"  
            - "Hilfe bei der Prüfung eines Vertrags"  
          
            Sobald wir Ihre Angaben erhalten haben:
            📂 Erstellen wir eine Beratung mit einem passenden Titel und Rechtsbereich.  
            🚀 Starten wir direkt mit der Klärung aller Details in einem Erstgespräch.  
          
            Vielen Dank, dass Sie uns Ihr Vertrauen schenken – wir freuen uns darauf, Ihnen weiterzuhelfen!
          
            💼 *Ihr Recht – unser Ziel!*  
            Hugel & AI – Ihr digitaler Partner im Recht.
          `;
            await exports.anwalt_bot.sendMessage(request_chain.user, loMsg, [exports.backNav, ...topics_1.mainTopics.map(t => { return [{ text: t.name }]; })], {}, request_chain);
            request_chain.requests.push({ command_name: "new_beratung", input: "" });
        }
        else if (input.startsWith('Hugel')) {
            let loMsg = (0, dedent_1.default) `*Willkommen bei Hugel & AI ⚖*  
            _Ihrem kostenfreien Wegweiser im deutschen Recht!_
    
            Wir freuen uns, dass Sie uns Ihr Vertrauen schenken.  
            Unsere Mission ist es, Ihnen schnell, zuverlässig und kostenfreie rechtliche Unterstützung zu bieten.  
    
            💼 *Unsere Leistungen*:  
            - Kompetente Beratung in verschiedenen Rechtsgebieten  
            - Unterstützung bei rechtlichen Fragen und Dokumenten  
            - Empfehlungen zu den besten Anwälten für Ihren Fall  
    
            🔍 *Wie können wir Ihnen helfen?*  
            Bitte wählen Sie aus den folgenden Optionen oder schildern Sie uns direkt Ihr Anliegen.  
    
            *Ihr Recht – Unser Ziel!*  
            Hugel & AI – Ihr digitaler Partner für rechtliche Angelegenheiten.`;
            await exports.anwalt_bot.sendMessage(request_chain.user, loMsg, loStartMenu, {}, request_chain);
            request_chain.requests.push({ command_name: "home", input: "" });
        }
        else if (input.startsWith(`Nutzungsbedingungen`)) {
            await exports.anwalt_bot.sendDocument(request_chain.user, './terms.txt');
        }
        else {
            let loBeratung = loMandant.beratungen.find(b => b.name === input);
            if (loBeratung) {
                (0, endpointFunctions_1.handleSelectBeratung)(exports.anwalt_bot, request_chain, input);
            }
            else {
                let aiDecision = await ai.decideHomeInputStep(loMandant, input);
                await exports.anwalt_bot.sendMessage(request_chain.user, aiDecision.text, aiDecision.actions.map(a => { return [{ text: a }]; }), {}, request_chain);
            }
        }
    }
});
exports.anwalt_bot.addCommand({
    name: "new_beratung_title",
    onExecute: async (request_chain, input) => {
        const selectedTopic = request_chain.data.selectedTopic;
        if (!selectedTopic) {
            await exports.anwalt_bot.sendMessage(request_chain.user, "❌ Fehler: Kein ausgewähltes Thema gefunden. Bitte starten Sie erneut.", [exports.backNav], {}, request_chain);
            return;
        }
        // Beratung erstellen mit ausgewähltem Topic und eingegebenem Titel
        let new_beratung = {
            id: exports.db.mandanten.find(m => m.tg_id === request_chain.user).beratungen.length,
            name: input,
            topic: selectedTopic,
            verlauf: [`User hat das Thema "${selectedTopic}" ausgewählt.`],
            actions: [],
            infos: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        request_chain.data.beratung = new_beratung;
        let loMsg = (0, dedent_1.default) `
      ...                     ✅ *Neue Beratung erstellt!*                     ...
      📂 Titel: ${new_beratung.name}
      ⚖ Bereich: ${new_beratung.topic}
      Passt das so?
    `;
        await exports.anwalt_bot.sendMessage(request_chain.user, loMsg, [
            exports.backNav,
            [{ text: "✏️ Titel ändern" }],
            [{ text: "🚀 Beratung starten" }],
        ], {}, request_chain);
        request_chain.requests.push({ command_name: "start_beratung", input: "" });
    },
});
exports.anwalt_bot.addCommand({
    name: "new_beratung",
    onExecute: async (request_chain, input) => {
        let loTopic = exports.topics.find(t => t.name === input);
        if (loTopic) {
            request_chain.data.selectedTopic = loTopic.name; // Temporär speichern
            let loMsg = (0, dedent_1.default) `
        ✅ *Sie haben das Thema "${loTopic.name}" ausgewählt.*

        Bitte geben Sie nun einen kurzen beschreibenden Titel ein, unter welchem wir den Fall für Sie speichern sollen.

        Beispiel:  
        - "Mieterhöhung prüfen"  
        - "Einspruch gegen Kündigung"  
        - "Vertragsprüfung Fitness-Studio"  

        💡 Der Titel hilft uns, Ihre Beratung klar zu benennen und weiterzuführen.
      `;
            await exports.anwalt_bot.sendMessage(request_chain.user, loMsg, [exports.backNav], {}, request_chain);
            request_chain.requests.push({ command_name: "new_beratung_title", input: "" }); // Weiterleitung zur Titelabfrage
            return;
        }
        await (0, endpointFunctions_1.handleCreateNewBeratung)(exports.anwalt_bot, request_chain, input);
    },
});
exports.anwalt_bot.addCommand({
    name: "start_beratung",
    onExecute: async (request_chain, input) => {
        let loMandant = exports.db.mandanten.find(m => m.tg_id === request_chain.user);
        let loBeratung = request_chain.data.beratung;
        if (input === '🚀 Beratung starten') {
            if (request_chain.data.new_topic) {
                exports.topics.push(request_chain.data.new_topic);
                await database.saveDevTopic(request_chain.data.new_topic);
                console.log(`NEUES DEV TOPIC ${request_chain.data.new_topic.name} wurde gespeichert`);
                request_chain.data.new_topic = null;
            }
            let loLoadingContext = await bt.initLoadingBar(exports.anwalt_bot, request_chain.user, `Beratung "${loBeratung.name}" wird initialisiert...`);
            request_chain.data.beratung = loBeratung;
            console.log(`BERATUNG GEFUNDEN!`);
            const topic = exports.topics.find(t => t.name === loBeratung.topic);
            if (!topic) {
                await exports.anwalt_bot.sendMessage(request_chain.user, `❌ Thema für diese Beratung nicht gefunden.`, request_chain.data.last_menu, {}, request_chain);
                return;
            }
            let loOptions = bt.getBeratungsMenu(loBeratung);
            let loMessage = (0, dedent_1.default) `
      🗂️ *${loBeratung.name}*
      
      Status: ✅ Initialisiert
      Beschreibung: Diese Beratung wurde erfolgreich eingerichtet und ist bereit zur Bearbeitung.
      
      Wähle eine Option aus:
      - *Gespräch fortsetzen:* Um die Beratung zu starten.
      - *Status:* Überblick über alle gesammelten Infos, noch offene Anforderungen und bereits durchgeführte Aktionen.
      - *Anwalt kontaktieren:* Kontaktiere direkt einen Anwalt.
      `;
            await exports.anwalt_bot.sendMessage(request_chain.user, loMessage, loOptions, {}, request_chain);
            request_chain.requests.push({ command_name: "beratung_menu", input: "" });
            loMandant.beratungen.push(loBeratung);
            await database.saveDatabase(exports.db);
            request_chain.requests.push({ command_name: "beratung_menu", input: "" });
            bt.endLoadingBar(exports.anwalt_bot, request_chain.user, loLoadingContext, `✅ Beratung "${loBeratung.name}" erfolgreich initialisiert!`);
        }
        else if (input.startsWith(`✏️ Titel ändern`)) {
        }
        else {
            await (0, endpointFunctions_1.handleCreateNewBeratung)(exports.anwalt_bot, request_chain, input);
        }
    }
});
exports.anwalt_bot.addCommand({
    name: "beratungen",
    onExecute: async (request_chain, input) => {
        await (0, endpointFunctions_1.handleSelectBeratung)(exports.anwalt_bot, request_chain, input);
    }
});
exports.anwalt_bot.addCommand({
    name: "beratung_gespraech_fortsetzen",
    onExecute: async (request_chain, input) => {
        let loBeratung = request_chain.data.beratung;
        if (input.startsWith(`📜 Verlauf laden`)) {
            let loadingContext = await bt.initLoadingBar(exports.anwalt_bot, request_chain.user, ' Ihre Konversation wird vorbereitet...');
            await bt.sleep(4000);
            await bt.endLoadingBar(exports.anwalt_bot, request_chain.user, loadingContext, '✅ Nachrichten werden in den Chat geladen...');
            for (let i = 0; i < loBeratung.verlauf.length; i++) {
                await exports.anwalt_bot.sendMessage(request_chain.user, loBeratung.verlauf[i]);
                await bt.sleep(1000);
            }
        }
        let loOptions = await bt.getBeratungsMenu(loBeratung);
        await exports.anwalt_bot.sendMessage(request_chain.user, (0, dedent_1.default) `
      ✅  *Das Gespräch ist bereit zur Fortsetzung.*

      Sie können direkt weitermachen und neue Informationen oder Details hinzufügen:
      - Geben Sie einfach Ihre Nachricht ein, um die Beratung fortzusetzen.

      Falls Sie Unterstützung benötigen oder Fragen haben, lassen Sie es uns wissen – wir stehen Ihnen jederzeit zur Seite.

      🛡️ *Wir kümmern uns um Ihr Anliegen – Schritt für Schritt.*  
      `, loOptions, {}, request_chain);
        request_chain.requests.push({ command_name: "beratung_menu", input: "" });
    }
});
exports.anwalt_bot.addCommand({
    name: "beratung_menu",
    onExecute: async (request_chain, input) => {
        let loBeratung = request_chain.data.beratung;
        let loTopic = exports.topics.find(t => t.name === loBeratung.topic);
        if (!loTopic) {
            console.log("Error 23");
            return;
        }
        if (request_chain.data.files && request_chain.data.files.length > 0) {
            console.log("Datei gefunden, starte Verarbeitung...");
            await (0, endpointFunctions_1.handleFileUploadBeratung)(exports.anwalt_bot, request_chain, input, loBeratung, loTopic);
            return;
        }
        if (input.startsWith(`💬 Gespräch laden`)) {
            await exports.anwalt_bot.sendMessage(request_chain.user, (0, dedent_1.default) `
              💬 *Gespräch fortsetzen*
        
              Möchten Sie:
              1. Alle bisherigen Nachrichten erneut laden, um den Verlauf zu überprüfen?
              2. Direkt dort weitermachen, wo Sie aufgehört haben?
        
              Bitte wählen Sie eine Option:
              - 📜 *Verlauf laden*: Lädt alle bisherigen Nachrichten in den Chat.
              - ✍️ *Fortsetzen*: Beginnt direkt mit Ihrer Eingabe.
            `, [
                exports.backNav,
                [{ text: "📜 Verlauf laden" }],
                [{ text: "✍️ Fortsetzen" }],
            ], {}, request_chain);
            request_chain.requests.push({ command_name: "beratung_gespraech_fortsetzen", input: "" });
        }
        else if (input.startsWith("🗂️ Status")) {
            await (0, endpointFunctions_1.handleStatusAndProgress)(exports.anwalt_bot, request_chain);
            request_chain.requests.push({ command_name: "beratung_status", input: "" });
        }
        else if (input.startsWith("👨‍⚖️ Anwälte kontaktieren")) {
        }
        else if (input.startsWith('🚫')) {
            let actionName = input.replace(/^[^\w]*\s*/, "").trim();
            let selectedAction = loTopic.actions.find(a => a.name === actionName);
            let loLoadingContext = await bt.initLoadingBar(exports.anwalt_bot, request_chain.user, `${actionName}...`);
            let loPrompt = (0, dedent_1.default) `
          Du bist eine intelligente juristische KI, die als virtueller Anwalt agiert. Der Nutzer möchte eine Aktion ausführen, aber es fehlen dafür notwendige Informationen. Deine Aufgabe ist es, eine professionelle, freundliche und klare Nachricht zu formulieren, die dem Nutzer Folgendes erklärt:
            
            1. Warum die Aktion momentan nicht ausgeführt werden kann.
            2. Welche Informationen erforderlich sind, um die Aktion verfügbar zu machen.
            3. Eine ermutigende Abschlussbemerkung, um den Nutzer zu motivieren, die fehlenden Informationen bereitzustellen.

            ### Relevante Daten:
            - *Aktion, die ausgeführt werden soll:* "${input}"
            - *Voraussetzungen der Aktion:*
              ${selectedAction.prerequisites.map((req) => `- ${req}`).join("\n")}
            - *Bereits vorhandene Informationen:*
              ${loBeratung.infos.map((info) => `- ${info.name}: ${info.value}`).join("\n") || "Keine vorhandenen Informationen"}
            - *Thema der Beratung:* "${loTopic.name}"
            
            ### Deine Aufgabe:
            - Analysiere die Voraussetzungen der Aktion und die vorhandenen Informationen.
            - Identifiziere, welche Voraussetzungen aktuell nicht erfüllt sind.
            - Formuliere eine klare, professionelle Nachricht in natürlichem und freundlichem Ton, die dem Nutzer erklärt, warum die Aktion nicht verfügbar ist und welche Informationen noch fehlen.
            - Gib dem Nutzer eine ermutigende Abschlussbemerkung.

            ### Beispielantwort:
            "Die Aktion 'Rechtsschutzdeckung prüfen' kann derzeit nicht ausgeführt werden, da folgende Informationen fehlen:
            - Kopie des Mietvertrags
            - Datum der letzten Mieterhöhung

            Bitte stellen Sie diese Informationen bereit, um fortzufahren. Falls Sie Unterstützung benötigen, lassen Sie es mich wissen – ich helfe Ihnen gerne!"
          ;
          `;
            let loResponse = await ai.getAIAnswer(loPrompt, false);
            let loBeratungsMenu = bt.getBeratungsMenu(loBeratung);
            await exports.anwalt_bot.sendMessage(request_chain.user, loResponse, loBeratungsMenu, {}, request_chain);
            await bt.endLoadingBar(exports.anwalt_bot, request_chain.user, loLoadingContext, `🚫 Voraussetzungen für "${actionName}" nicht erfüllt!`);
        }
        else if (input.startsWith(`🟢`) || input.startsWith(`🟡`)) {
            let actionName = input.replace(/^[^\w]*\s*/, "").trim();
            let action = loTopic.actions.find(a => a.name === actionName);
            console.log(`${JSON.stringify(action)}`);
            if (action) {
                let loMessage = "";
                const missingInfos = action.optionalRequisites.filter(req => !loBeratung.infos.some(info => info.name === req));
                if (missingInfos.length > 0) {
                    loMessage = (0, dedent_1.default) `
                Aktion: *${action.name}*
            
                ⚠️ Es fehlen folgende Informationen: 
                ${missingInfos.map(i => `- ${i}`).join("\n")}
            
                Möchten Sie die Aktion trotzdem ausführen?`;
                }
                else {
                    loMessage = (0, dedent_1.default) `
                Aktion: *${action.name}*
            
                ✅ Alle erforderlichen Informationen sind vorhanden.
            
                Möchten Sie die Aktion jetzt ausführen?`;
                }
                request_chain.data.action = action;
                await exports.anwalt_bot.sendMessage(request_chain.user, loMessage, [exports.backNav, [{ text: "✅ Aktion ausführen" }]], {}, request_chain);
                request_chain.requests.push({ command_name: "execute_action", input: "" });
            }
        }
        else if (input.startsWith(`-------------------`)) {
        }
        else {
            (0, endpointFunctions_1.handleBeratungsGespräch)(exports.anwalt_bot, request_chain, input);
        }
    }
});
exports.anwalt_bot.addCommand({
    name: "execute_action",
    onExecute: async (request_chain, input) => {
        let action = request_chain.data.action;
        if (input.startsWith(`✅`)) {
            try {
                await action.onExecute(action, exports.anwalt_bot, request_chain, input);
            }
            catch (err) {
                console.log(err.message);
            }
        }
    }
});
exports.anwalt_bot.addCommand({
    name: "create_widerspruch",
    onExecute: async (request_chain, input) => {
        let beratung = request_chain.data.beratung;
        if (input.startsWith(`💾 Speichern`)) {
            let widerspruch = request_chain.data.widerspruch;
            let loTimestamp = Date.now();
            let fileLink = `./files/widerspruch_${request_chain.user}_${beratung.name}_${loTimestamp}.pdf`;
            beratung.actions.push({
                name: "Widerspruchserklärung verfassen",
                result: fileLink,
                timestamp: loTimestamp
            });
            let loMandant = exports.db.mandanten.find(m => m.tg_id === request_chain.user);
            if (loMandant) {
                loMandant.beratungen.map(b => (b.name === beratung.name) ? beratung : b);
                await bt.createPDF(widerspruch, fileLink);
                await database.saveDatabase(exports.db);
            }
        }
        else {
            let loLoadingContext = await bt.initLoadingBar(exports.anwalt_bot, request_chain.user, `Wiedersrpuchserklärung wird bearbeitet...`);
            // Infos aus der Beratung laden
            let klausur = beratung.infos.find(i => i.name === "Klausur");
            let korrektur = beratung.infos.find(i => i.name === "Korrektur");
            let aufgabenstellung = beratung.infos.find(i => i.name === "Aufgabenstellung");
            // Textextraktion
            const klausurText = await bt.getTextFromFile(klausur.value);
            const korrekturText = await bt.getTextFromFile(korrektur.value);
            const JaPROText = await bt.getTextFromFile('./japrobw2023.txt');
            let aufgabenstellungText = "Nicht vorhanden";
            if (aufgabenstellung) {
                aufgabenstellungText = await bt.getTextFromFile(aufgabenstellung.value);
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
            let loWiderspruchserklärung = response.choices[0].message.content.trim();
            console.log("Antwort der KI:", response.choices[0].message.content.trim());
            bt.endLoadingBar(exports.anwalt_bot, request_chain.user, loLoadingContext, '✅ Widerspruchserklärung wurde generiert!');
            await exports.anwalt_bot.sendMessage(request_chain.user, loWiderspruchserklärung);
            request_chain.data.widerspruch = loWiderspruchserklärung;
        }
    }
});
exports.anwalt_bot.addCommand({
    name: "beratung_status",
    onExecute: async (request_chain, input) => {
        const loBeratung = request_chain.data.beratung;
        const loTopic = exports.topics.find(t => t.name === loBeratung.topic);
        if (!loTopic) {
            console.log("FEHLER: Thema konnte nicht gefunden werden.");
            await exports.anwalt_bot.sendMessage(request_chain.user, "⚠️ *Das Thema der Beratung konnte nicht gefunden werden.* Bitte versuchen Sie es erneut.");
            return;
        }
        // ✅ Vorhandene Information anzeigen oder bearbeiten
        if (input.startsWith(`✅`)) {
            const loInfoName = input.replace(/^[^\w]*\s*/, "").trim();
            const loInfo = loBeratung.infos.find(i => i.name === loInfoName);
            if (!loInfo) {
                console.log("KOMISCHER FEHLER: Information nicht gefunden.");
                await exports.anwalt_bot.sendMessage(request_chain.user, `⚠️ *Die Information „${loInfoName}“ konnte nicht gefunden werden.*`, request_chain.data.last_menu);
                return;
            }
            if (loInfo.type === 'text') {
                await exports.anwalt_bot.sendMessage(request_chain.user, `📝 *Information*: "${loInfo.name}"\n📄 Wert:\n"${loInfo.value}"`, request_chain.data.last_menu);
            }
            else if (loInfo.type === "date") {
                await exports.anwalt_bot.sendMessage(request_chain.user, `📝 *Information*: "${loInfo.name}"\n📄 Wert:"${new Date(loInfo.value).toLocaleDateString()}"`, request_chain.data.last_menu);
            }
            else if (loInfo.type === "file" || loInfo.type === "photo") {
                await exports.anwalt_bot.sendDocument(request_chain.user, loInfo.value);
                await bt.sleep(1000);
                await exports.anwalt_bot.sendMessage(request_chain.user, exports.platzhalterMessage, request_chain.data.last_menu);
            }
        }
        else if (input.startsWith(`➕`)) {
            const loInfoName = input.replace(/^[^\w]*\s*/, "").trim();
            const loInfoRequirement = loTopic.infoRequirements.find(i => i.name === loInfoName);
            if (!loInfoRequirement) {
                console.log("KOMISCHER FEHLER: Anforderung nicht gefunden.");
                await exports.anwalt_bot.sendMessage(request_chain.user, `⚠️ *Die Anforderung „${loInfoName}“ konnte nicht gefunden werden.*`, request_chain.data.last_menu);
                return;
            }
            if (loInfoRequirement.type === "text") {
                await exports.anwalt_bot.sendMessage(request_chain.user, `✍️ *Bitte geben Sie die fehlende Information an:*\n\n"${loInfoRequirement.name}"`, [exports.backNav]);
                request_chain.requests.push({ command_name: "beratung_edit_info", input: "" });
                request_chain.data.edit_info = loInfoRequirement.name;
            }
            else if (loInfoRequirement.type === "file" || loInfoRequirement.type === "photo") {
                await exports.anwalt_bot.sendMessage(request_chain.user, `📤 *Bitte laden Sie das fehlende Dokument hoch:*\n\n"${loInfoRequirement.name}"`, [exports.backNav]);
                request_chain.data.edit_info = loInfoRequirement.name;
                request_chain.requests.push({ command_name: "beratung_edit_info", input: "" });
            }
        }
        else {
            console.log("Unbekannter Input:", input);
            await exports.anwalt_bot.sendMessage(request_chain.user, "⚠️ *Ihre Eingabe konnte nicht verarbeitet werden.* Bitte wählen Sie eine gültige Option aus.");
        }
    }
});
exports.anwalt_bot.addCommand({
    name: "beratung_edit_info",
    onExecute: async (request_chain, input) => {
        let loBeratung = request_chain.data.beratung = request_chain.data.beratung;
        let loTopic = exports.topics.find(t => t.name === loBeratung.topic);
        if (!loTopic) {
            console.log("Strange error 23");
            return;
        }
        let loInfo = loTopic.infoRequirements.find(i => i.name === request_chain.data.edit_info);
        if (!loInfo) {
            console.log("Strange error 45");
            return;
        }
        if (request_chain.data.files && request_chain.data.files.length > 0) {
            if (loInfo.type === "text") {
                await exports.anwalt_bot.sendMessage(request_chain.user, `⚠️ Bei der Information "${loInfo.name}" wird eine Datei benötigt!`);
            }
            console.log("Datei gefunden, starte Verarbeitung...");
            await (0, endpointFunctions_1.handleFileUploadBeratung)(exports.anwalt_bot, request_chain, request_chain.data.edit_info, loBeratung, loTopic);
            request_chain.requests.pop();
            request_chain.requests.pop();
            console.log(`REQUEST CHAIN AFTER UPLOAD: ${JSON.stringify(request_chain.requests[request_chain.requests.length - 1])}`);
            await (0, endpointFunctions_1.handleStatusAndProgress)(exports.anwalt_bot, request_chain);
            request_chain.requests.push({ command_name: "beratung_status", input: "" });
            return;
        }
        if (loInfo.type !== 'text') {
            console.log("Strange error 777");
            return;
        }
        let loNewInfos = await ai.extractInfos(`Der User hat folgende weitere Angaben bezüglich ${loInfo.name} gemacht: ${input}`, loTopic, loBeratung.infos);
        let loNewInfo = loNewInfos.find(ni => ni.name === loInfo.name);
        if (!loNewInfo) {
            await exports.anwalt_bot.sendMessage(request_chain.user, `⚠️ Es konnten aus den Angaben keine Erkenntnisse bezüglich "${loInfo.name}" gewonnen werden, bitte versuche es erneut!`);
        }
        else {
            let loBeratungInfo = loBeratung.infos.find(i => i.name === loNewInfo.name);
            if (loBeratungInfo) {
                loBeratung.infos.map(i => (i.name === loNewInfo.name) ? loNewInfo : i);
            }
            else {
                loBeratung.infos.push(loNewInfo);
            }
            await database.saveDatabase(exports.db);
            await exports.anwalt_bot.sendMessage(request_chain.user, `✅ Informationen zu "${loInfo.name}" wurden erfolgreich ergänzt!`);
            await bt.sleep(1000);
            await (0, endpointFunctions_1.handleStatusAndProgress)(exports.anwalt_bot, request_chain);
            request_chain.requests.push({ command_name: "beratung_status", input: "" });
        }
    }
});
exports.anwalt_bot.addCommand({
    name: "beratung_gespraech",
    onExecute: async (request_chain, input) => {
        await (0, endpointFunctions_1.handleBeratungsGespräch)(exports.anwalt_bot, request_chain, input);
    }
});
async function main() {
    await initDBAndTopics();
    await exports.anwalt_bot.startListening(database.requestsPath);
    // Nachdem der Bot gestartet ist, kannst du noch einen Hinweis senden
    // Beispiel: an alle User, die noch in user_requests sind, ein „Willkommens-Zurück“-Nachricht.
    for (let i = 0; i < exports.anwalt_bot.user_requests.length; i++) {
        let loLastOptions = null;
        if (exports.anwalt_bot.user_requests[i].data.last_menu) {
            loLastOptions = exports.anwalt_bot.user_requests[i].data.last_menu;
        }
        await exports.anwalt_bot.sendMessage(exports.anwalt_bot.user_requests[i].user, "🤖 Der Anwalts-Bot ist wieder am Start und bereit, Ihnen zu helfen! Was kann ich für Sie tun?", loLastOptions);
    }
}
main().catch(err => {
    console.error("Fehler beim Starten der Anwendung:", err);
});
process.once('SIGINT', async () => {
    console.log('Bot wird beendet. Säubere Ressourcen...');
    await database.saveDatabase(exports.db);
    await database.saveRequestChains(exports.anwalt_bot.user_requests);
    for (let i = 0; i < exports.anwalt_bot.user_requests.length; i++) {
        await exports.anwalt_bot.sendMessage(exports.anwalt_bot.user_requests[i].user, "⚖️ Der Anwalts-Bot legt seine Robe ab und macht Feierabend. Bitte versuchen Sie es später erneut! 👋");
    }
    process.exit(0);
});
