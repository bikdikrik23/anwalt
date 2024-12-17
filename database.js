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
exports.requestsPath = exports.dbPath = exports.devTopicsPath = void 0;
exports.saveDevTopic = saveDevTopic;
exports.loadDevTopics = loadDevTopics;
exports.saveDatabase = saveDatabase;
exports.getDatabase = getDatabase;
exports.saveRequestChains = saveRequestChains;
exports.getRequestChains = getRequestChains;
const fs = __importStar(require("fs/promises"));
exports.devTopicsPath = './data/dev_topics.json';
exports.dbPath = './data/db.json';
exports.requestsPath = './data/requests.json';
async function saveDevTopic(topic) {
    try {
        const existingTopics = await loadDevTopics();
        existingTopics.push(topic);
        await fs.writeFile(exports.devTopicsPath, JSON.stringify(existingTopics, null, 2), 'utf-8');
        console.log(`Neues Topic gespeichert: ${topic.name}`);
    }
    catch (error) {
        console.error('Fehler beim Speichern eines neuen Topics:', error);
    }
}
async function loadDevTopics() {
    try {
        const data = await fs.readFile(exports.devTopicsPath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Fehler beim Laden der dynamischen Topics. Erstelle leere Liste.');
        return [];
    }
}
async function saveDatabase(db) {
    console.log('Speichere Datenbank...');
    try {
        await fs.writeFile(exports.dbPath, JSON.stringify(db, null, 2), 'utf-8');
        console.log('Datenbank erfolgreich gespeichert.');
        console.log(db);
    }
    catch (error) {
        console.error('Fehler beim Speichern der Datenbank:', error);
    }
}
async function getDatabase() {
    let dbString = await fs.readFile(exports.dbPath, 'utf-8');
    return JSON.parse(dbString);
}
async function saveRequestChains(requests) {
    console.log('Speichere Requests...');
    try {
        await fs.writeFile(exports.requestsPath, JSON.stringify(requests, null, 2), 'utf-8');
        console.log('Datenbank erfolgreich gespeichert.');
        console.log(requests);
    }
    catch (error) {
        console.error('Fehler beim Speichern der Datenbank:', error);
    }
}
async function getRequestChains() {
    let dbString = await fs.readFile(exports.requestsPath, 'utf-8');
    return JSON.parse(dbString);
}
