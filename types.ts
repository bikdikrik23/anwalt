// Typ für einen Anwalt
export interface Anwalt {
  id: number;
  name: string;
  addresse: string;
  info: string;
}
  
export interface Topic {
  name: string;                   
  infoRequirements: InfoRequirement[]; 
  actions: Action[];          
}

export interface Action {
  name: string;                  
  prerequisites: string[];  
  optionalRequisites?: string[];
  onExecute?: Function
}

export interface InfoRequirement {
  name: string;                  
  type: "text" | "date" | "photo" | "file"; 
  optional: boolean;            
}

export interface InfoData {
  name: string;                  
  type: "text" | "date" | "photo" | "file"; 
  value: string | string[] | number; 
}

export interface ActionLog {
  name: string;                   
  timestamp: Date;             
  result: string | null;         
}

export interface Beratung {
  id: number;                     
  name: string;                   
  topic: string;                
  verlauf: string[];              
  infos: InfoData[];              
  actions: ActionLog[];           
  createdAt: number;                
  updatedAt: number;                
}
  
export interface Mandant {
  tg_id: number; // Telegram-ID des Mandanten
  beratungen: Beratung[]; 
}
  
  // Gesamte Datenbankstruktur
export interface Datenbank {
  anwaelte: Anwalt[]; 
  mandanten: Mandant[];
}
  
export type LoadingContext = {
  messageId: number;
  intervalId: NodeJS.Timeout;
  startTime: number;
};