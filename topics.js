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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainTopics = void 0;
const actions = __importStar(require("./actions"));
exports.mainTopics = [
    {
        name: "Examen einklagen",
        infoRequirements: [
            { name: "Bescheid-Datum", type: "date", optional: false },
            { name: "Korrektur-Datum", type: "date", optional: false },
            { name: "Aufgabenstellung", type: "file", optional: false },
            { name: "Klausur", type: "file", optional: false },
            { name: "Korrektur", type: "file", optional: true }
        ],
        actions: [
            {
                name: "👨‍⚖️ Anwalt kontaktieren",
                prerequisites: []
            },
            {
                name: "Wiederspruchserklärung verfassen",
                prerequisites: ["Klausur", "Korrektur"],
                optionalRequisites: ["Aufgabenstellung"],
                onExecute: actions.createWiderspruch
            }
        ]
    }, {
        name: "Impfschaden",
        infoRequirements: [
            { name: "Arzt", type: "text", optional: false },
            { name: "Schaden", type: "text", optional: false },
            { name: "Sonstige Daten", type: "text", optional: false }
        ],
        actions: [
            {
                name: "👨‍⚖️ Anwalt kontaktieren",
                prerequisites: ["Arzt", "Schaden"]
            }
        ]
    },
    {
        name: "Vertragskündigung",
        infoRequirements: [
            { name: "Art des Vertrags", type: "text", optional: false },
            { name: "Kündigungsschreiben", type: "photo", optional: true },
            { name: "Grund der Kündigung", type: "text", optional: true },
            { name: "Kopie des Vertrags", type: "photo", optional: false }
        ],
        actions: [
            {
                name: "👨‍⚖️ Anwalt kontaktieren",
                prerequisites: []
            },
            {
                name: "Rechtsschutzdeckung prüfen",
                prerequisites: ["Art des Vertrags", "Kopie des Vertrags"]
            },
            {
                name: "Kündigung auf Rechtmäßigkeit prüfen",
                prerequisites: ["Art des Vertrags", "Kopie des Vertrags", "Kündigungsschreiben"]
            },
            {
                name: "Einspruch gegen Kündigung vorbereiten",
                prerequisites: ["Art des Vertrags", "Kündigungsschreiben", "Grund der Kündigung"]
            }
        ]
    },
    {
        name: "Schadensersatzforderung stellen",
        infoRequirements: [
            { name: "Art des Schadens", type: "text", optional: false },
            { name: "Belege oder Nachweise des Schadens", type: "photo", optional: false },
            { name: "Relevante Verträge oder Absprachen", type: "photo", optional: true },
            { name: "Schadenshöhe (falls bekannt)", type: "text", optional: true }
        ],
        actions: [
            {
                name: "👨‍⚖️ Anwalt kontaktieren",
                prerequisites: []
            },
            {
                name: "Schadensersatzanspruch prüfen",
                prerequisites: ["Art des Schadens", "Belege oder Nachweise des Schadens"]
            },
            {
                name: "Schadensersatzforderung vorbereiten",
                prerequisites: ["Art des Schadens", "Belege oder Nachweise des Schadens", "Relevante Verträge oder Absprachen"]
            },
            {
                name: "Verhandlungen mit der Gegenseite vorbereiten",
                prerequisites: ["Art des Schadens", "Belege oder Nachweise des Schadens", "Schadenshöhe (falls bekannt)"]
            }
        ]
    },
    {
        name: "Arbeitszeugnis prüfen oder erstellen",
        infoRequirements: [
            { name: "Arbeitszeugnis", type: "photo", optional: true },
            { name: "Angaben zu Ihrer Position", type: "text", optional: false },
            { name: "Erwünschte Details im Zeugnis", type: "text", optional: true }
        ],
        actions: [
            {
                name: "👨‍⚖️ Anwalt kontaktieren",
                prerequisites: []
            }, {
                name: "Arbeitszeugnis prüfen",
                prerequisites: ["Arbeitszeugnis"]
            },
            {
                name: "Arbeitszeugnis erstellen",
                prerequisites: ["Angaben zu Ihrer Position", "Erwünschte Details im Zeugnis"]
            },
            {
                name: "Vorschläge zur Verbesserung des Zeugnisses machen",
                prerequisites: ["Arbeitszeugnis"]
            }
        ]
    }
];
