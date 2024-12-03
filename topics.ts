import { Topic } from "./types";
import * as ai from "./aitools"
import * as actions from "./actions"

export const mainTopics: Topic[] = [
    {
        name: "Examen einklagen",
        infoRequirements: [
            { name: "Bescheid-Datum", type: "date", optional: false},
            { name: "Korrektur-Datum", type: "date", optional: false},
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
            { name: "Sonstige Daten", type: "text", optional: false}
          
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
            },{
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