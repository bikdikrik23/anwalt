import * as types from "./types"
import * as fs from 'fs/promises';

export const devTopicsPath = './data/dev_topics.json';
export const dbPath = './data/db.json'

export async function saveDevTopic(topic: any) {
  try {
    const existingTopics = await loadDevTopics();
    existingTopics.push(topic);
    await fs.writeFile(devTopicsPath, JSON.stringify(existingTopics, null, 2), 'utf-8');
    console.log(`Neues Topic gespeichert: ${topic.name}`);
  } catch (error) {
    console.error('Fehler beim Speichern eines neuen Topics:', error);
  }
}

export async function loadDevTopics(): Promise<types.Topic[]> {
  try {
    const data = await fs.readFile(devTopicsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Fehler beim Laden der dynamischen Topics. Erstelle leere Liste.');
    return [];
  }
}

export async function saveDatabase(db: types.Datenbank) {
    console.log('Speichere Datenbank...');
    try {
      await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
      console.log('Datenbank erfolgreich gespeichert.');
      console.log(db)
    } catch (error) {
      console.error('Fehler beim Speichern der Datenbank:', error);
    }
  }

export async function getDatabase(): Promise<types.Datenbank>{
    let dbString = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(dbString) 
}