//BasicFuncitonality
import * as fs from 'fs';
import * as types from './types';
import { backNav } from './anwalt';
import * as main from "./anwalt"
import { bot } from './tg_bot_tools';

import pdfParse from 'pdf-parse';
import docxParser from 'docx-parser';
import axios from 'axios';
import PDFDocument from 'pdfkit';

export const loadingSymbols = ["⚖️", "🔍", "✍️", "📂", "⏳"];
export const loadingText = "Die KI arbeitet an Ihrer Anfrage. Bitte einen Moment Geduld...";

export function isThisMonth(ts: number) {
    const now = new Date();
    const date = new Date(ts);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function formatTimeAgo(ts: number) {
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
            if(['Jahr', 'Monat', 'Tag'].includes(unit)){
                return interval === 1 ? `vor ${interval} ${unit}` : `vor ${interval} ${unit}en`;
            }else{
                return interval === 1 ? `vor ${interval} ${unit}` : `vor ${interval} ${unit}n`;
            }
        }
    }

    return 'gerade eben';
}

export function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}

export async function loop(func, interval){
    await func()
    setTimeout(async ()=>{
        await loop(func, interval)
    }, interval)
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function indexOfPropertyValue(array: any[], propertyName: string, propertyValue: any){
    let result = -1

    for (let i=0; i<array.length; i++){
        if(array[i][propertyName] == propertyValue){
            result = i
        }
    }

    return result
}

export async function initLoadingBar(bot: any,userId: number,text = loadingText): Promise<types.LoadingContext> {
    
    const messageId = await bot.sendMessage(userId, `${loadingSymbols[0]} ${text}`);
  
    let step = 0;
    const startTime = Date.now();
  
    const intervalId = setInterval(async () => {
      step = (step + 1) % loadingSymbols.length;
      await bot.editMessage(
        userId,
        messageId,
        `${loadingSymbols[step]} ${text} (${Math.floor((Date.now() - startTime) / 1000)}s)`
      );
    }, 1200);

    return { messageId, intervalId, startTime };
  }
  
  export async function updateLoadingBar(bot: bot, userId: number, loadingContext: types.LoadingContext, text: string): Promise<types.LoadingContext>{
    clearInterval(loadingContext.intervalId)
    await sleep(2000)
    await bot.editMessage(userId, loadingContext.messageId, text);

    let step = 0;
    const startTime = Date.now();
  
    const intervalId = setInterval(async () => {
      step = (step + 1) % loadingSymbols.length;
      await bot.editMessage(
        userId,
        loadingContext.messageId,
        `${loadingSymbols[step]} ${text} (${Math.floor((Date.now() - startTime) / 1000)}s)`
      );
    }, 1200);

    return { messageId: loadingContext.messageId, intervalId, startTime };
  }

  export async function endLoadingBar(bot: any, userId: number, loadingContext: types.LoadingContext, finalMessage: string = "✅ *Fertig*: Ihre Antwort ist bereit!") {
    clearInterval(loadingContext.intervalId); 
  
    await sleep(1200)
    await bot.editMessage(userId, loadingContext.messageId, finalMessage);
    await sleep(1200)
  }

  export function updateInfos(existingInfos: types.InfoData[], newInfos: types.InfoData[]): types.InfoData[] {
    const updatedInfos = [...existingInfos]; 
  
    for (const newInfo of newInfos) {
      const existingIndex = updatedInfos.findIndex((info) => info.name === newInfo.name);
  
      if (existingIndex !== -1) {
        updatedInfos[existingIndex] = newInfo;
      } else {
        updatedInfos.push(newInfo);
      }
    }
  
    return updatedInfos;
  }

  export function getBeratungsMenu(beratung: types.Beratung): { text: string }[][] {
    const topic = main.topics.find(t => t.name === beratung.topic);

    const allActions = topic.actions.map(action => {
        // Prüfen, ob alle Pflichtvoraussetzungen erfüllt sind
        const prerequisitesMet = action.prerequisites.every(prereq =>
            beratung.infos.some(info => info.name === prereq)
        );

        // Prüfen, ob optionale Voraussetzungen erfüllt sind (falls definiert)
        const optionalMet = !action.optionalRequisites || action.optionalRequisites.every(optReq =>
            beratung.infos.some(info => info.name === optReq)
        );

        return {
            name: action.name,
            available: prerequisitesMet,
            optionalMet,
            missingPrerequisites: action.prerequisites.filter(prereq =>
                !beratung.infos.some(info => info.name === prereq && info.value)
            ),
            missingOptionalRequisites: (action.optionalRequisites || []).filter(optReq =>
                !beratung.infos.some(info => info.name === optReq && info.value)
            )
        };
    });

    const dynamicOptions = allActions.map(action => {
        let actionSymbol = "🚫"; // Standardmäßig nicht verfügbar
        if (action.available && !action.optionalMet) {
            actionSymbol = "🟡"; // Pflicht erfüllt, optionale fehlen
        } else if (action.available) {
            actionSymbol = "🟢"; // Alles erfüllt
        }

        return [{ text: `${actionSymbol} ${action.name}` }];
    });
   
    const totalInfoCount = topic.infoRequirements.length;
    const completedInfoCount = beratung.infos.length;
    const newInfoCount = beratung.infos.filter(i => i.new).length;
    
    // Fortschritt in Prozent berechnen
    const progressPercentage = (totalInfoCount > 0) ? Math.round((completedInfoCount / totalInfoCount) * 100) : 0;
    
    // Fortschrittsbalken generieren
    const progressBarLength = 5; // Länge des Balkens
    const filledBars = Math.round((progressPercentage / 100) * progressBarLength);
    const progressBar = `${"🟩".repeat(filledBars)}${"⬜".repeat(progressBarLength - filledBars)}`;
    
    // Dynamischen Text erstellen
    let progressText = `🗂️ Status`;
        
    // Neue Infos markieren, falls vorhanden
    //progressText = newInfoCount > 0 ? `${progressText} (${newInfoCount} ${(newInfoCount === 1) ? `neue Info` : `neue Infos`} ⚠️)` : progressText;

    progressText = `${progressText}   ${progressBar} ${progressPercentage}%`

    const loOptions = [
        backNav,
        [{ text: `💬 Gespräch laden (${beratung.verlauf.length} Nachrichten)`  }],
        [{ text: progressText }],
        [{text: `********** ${dynamicOptions.length} ${(dynamicOptions.length === 1) ? `ausführbare Aktion` : `ausführbare Aktionen`} **********`}],
        ...dynamicOptions 
    ];

    return loOptions;
}

export async function getTextFromFile(filePath: string): Promise<string> {
    const fileExtension = filePath.split('.').pop()?.toLowerCase();

    try {
        if (fileExtension === 'txt') {
            // Textdatei lesen
            return fs.readFileSync(filePath, 'utf-8');
        } else if (fileExtension === 'pdf') {
            // PDF-Datei lesen
            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);
            return data.text;
        } else if (fileExtension === 'docx') {
            // DOCX-Datei lesen
            const data = await docxParser.parseDocx(filePath);
            return data;
        } else {
            throw new Error(`Unsupported file type: ${fileExtension}`);
        }
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return '';
    }
}

export async function downloadFile(fileUrl: string, outputPath: string) {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios.get(fileUrl, {
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// PDF erstellen mit pdfkit
export async function createPDF(text, filePath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
  
      // Text im PDF darstellen
      doc.font('Helvetica').fontSize(12).text(text, { align: 'justify' });
  
      doc.end();
  
      stream.on('finish', () => {
        resolve(filePath);
      });
  
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }