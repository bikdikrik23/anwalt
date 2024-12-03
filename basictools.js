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
exports.loadingText = exports.loadingSymbols = void 0;
exports.isThisMonth = isThisMonth;
exports.formatTimeAgo = formatTimeAgo;
exports.delay = delay;
exports.loop = loop;
exports.sleep = sleep;
exports.indexOfPropertyValue = indexOfPropertyValue;
exports.initLoadingBar = initLoadingBar;
exports.endLoadingBar = endLoadingBar;
exports.updateInfos = updateInfos;
exports.getBeratungsMenu = getBeratungsMenu;
exports.getTextFromFile = getTextFromFile;
//BasicFuncitonality
const fs = __importStar(require("fs"));
const anwalt_1 = require("./anwalt");
const main = __importStar(require("./anwalt"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const docx_parser_1 = __importDefault(require("docx-parser"));
exports.loadingSymbols = ["⚖️", "🔍", "✍️", "📂", "⏳"];
exports.loadingText = "Die KI arbeitet an Ihrer Anfrage. Bitte einen Moment Geduld...";
function isThisMonth(ts) {
    const now = new Date();
    const date = new Date(ts);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}
function formatTimeAgo(ts) {
    const secondsAgo = Math.floor((Date.now() - ts) / 1000);
    const intervals = {
        Jahr: 31536000,
        Monat: 2592000,
        Woche: 604800,
        Tag: 86400,
        Stunde: 3600,
        Minute: 60
    };
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(secondsAgo / seconds);
        if (interval >= 1) {
            // Verwende .includes() für die Überprüfung
            if (['Jahr', 'Monat', 'Tag'].includes(unit)) {
                return interval === 1 ? `vor ${interval} ${unit}` : `vor ${interval} ${unit}en`;
            }
            else {
                return interval === 1 ? `vor ${interval} ${unit}` : `vor ${interval} ${unit}n`;
            }
        }
    }
    return 'gerade eben';
}
function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}
async function loop(func, interval) {
    await func();
    setTimeout(async () => {
        await loop(func, interval);
    }, interval);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function indexOfPropertyValue(array, propertyName, propertyValue) {
    let result = -1;
    for (let i = 0; i < array.length; i++) {
        if (array[i][propertyName] == propertyValue) {
            result = i;
        }
    }
    return result;
}
async function initLoadingBar(bot, userId, text = exports.loadingText) {
    const messageId = await bot.sendMessage(userId, `${exports.loadingSymbols[0]} ${text}`);
    let step = 0;
    const startTime = Date.now();
    // Animation starten
    const intervalId = setInterval(async () => {
        step = (step + 1) % exports.loadingSymbols.length; // Durch die Symbole rotieren
        await bot.editMessage(userId, messageId, `${exports.loadingSymbols[step]} ${text} (${Math.floor((Date.now() - startTime) / 1000)}s)`);
    }, 1200); // Alle 2 Sekunden aktualisieren
    return { messageId, intervalId, startTime };
}
// Funktion: Ladeanimation beenden
async function endLoadingBar(bot, userId, loadingContext, finalMessage = "✅ *Fertig*: Ihre Antwort ist bereit!") {
    clearInterval(loadingContext.intervalId); // Animation stoppen
    // Abschlussnachricht senden
    await sleep(1200);
    await bot.editMessage(userId, loadingContext.messageId, finalMessage);
    await sleep(1200);
}
function updateInfos(existingInfos, newInfos) {
    const updatedInfos = [...existingInfos]; // Kopie der bestehenden Infos
    for (const newInfo of newInfos) {
        const existingIndex = updatedInfos.findIndex((info) => info.name === newInfo.name);
        if (existingIndex !== -1) {
            // Information existiert bereits: Überschreiben
            updatedInfos[existingIndex] = newInfo;
        }
        else {
            // Neue Information hinzufügen
            updatedInfos.push(newInfo);
        }
    }
    return updatedInfos;
}
function getBeratungsMenu(beratung) {
    const topic = main.topics.find(t => t.name === beratung.topic);
    const allActions = topic.actions.map(action => {
        // Prüfen, ob alle Pflichtvoraussetzungen erfüllt sind
        const prerequisitesMet = action.prerequisites.every(prereq => beratung.infos.some(info => info.name === prereq));
        // Prüfen, ob optionale Voraussetzungen erfüllt sind (falls definiert)
        const optionalMet = !action.optionalRequisites || action.optionalRequisites.every(optReq => beratung.infos.some(info => info.name === optReq));
        return {
            name: action.name,
            available: prerequisitesMet,
            optionalMet,
            missingPrerequisites: action.prerequisites.filter(prereq => !beratung.infos.some(info => info.name === prereq && info.value)),
            missingOptionalRequisites: (action.optionalRequisites || []).filter(optReq => !beratung.infos.some(info => info.name === optReq && info.value))
        };
    });
    const dynamicOptions = allActions.map(action => {
        let actionSymbol = "🚫"; // Standardmäßig nicht verfügbar
        if (action.available && !action.optionalMet) {
            actionSymbol = "🟡"; // Pflicht erfüllt, optionale fehlen
        }
        else if (action.available) {
            actionSymbol = "🟢"; // Alles erfüllt
        }
        return [{ text: `${actionSymbol} ${action.name}` }];
    });
    const loOptions = [
        anwalt_1.backNav,
        [{ text: "💬 Gespräch fortsetzen" }],
        [{ text: "🗂️ Status und Fortschritt" }],
        ...dynamicOptions // Dynamische Aktionen hinzufügen
    ];
    return loOptions;
}
async function getTextFromFile(filePath) {
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    try {
        if (fileExtension === 'txt') {
            // Textdatei lesen
            return fs.readFileSync(filePath, 'utf-8');
        }
        else if (fileExtension === 'pdf') {
            // PDF-Datei lesen
            const buffer = fs.readFileSync(filePath);
            const data = await (0, pdf_parse_1.default)(buffer);
            return data.text;
        }
        else if (fileExtension === 'docx') {
            // DOCX-Datei lesen
            const data = await docx_parser_1.default.parseDocx(filePath);
            return data;
        }
        else {
            throw new Error(`Unsupported file type: ${fileExtension}`);
        }
    }
    catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return '';
    }
}
