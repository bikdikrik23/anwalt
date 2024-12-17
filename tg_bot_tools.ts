const { Telegraf } = require('telegraf');
const path = require('path');
const axios = require('axios');

import * as fs from 'fs/promises';
import * as bt from "./basictools"

export const russian_proxy_ip = "37.18.73.94" //needed for better more reliable communication with telegram api
export const russian_proxy_port = 5566

export interface request_chain {
    user: number,
    requests: {command_name: string, input: string}[]
    data: any
}

export interface command {
    name: string
    onExecute: Function
}

export class bot{
    commandList: command[] = []
    user_requests: request_chain[]
    tg_bot: any//Telegraf Bot Object
    options: {button_type: "keyboard" | "inline"}

    constructor(tg_token: string, options: {button_type: "keyboard" | "inline"} = {button_type: "keyboard"}){
        this.commandList = []
        this.tg_bot = new Telegraf(tg_token, {polling: true})
        this.options = options
        this.user_requests = []
    }

    async getTgUsername(chat_id: number): Promise<string>{
        let loChat = await this.tg_bot.telegram.getChat(chat_id);
        return loChat.username
    }

    updateRequestChain(tg_chat_id: number, request_chain: request_chain){
        let loUserRequests = this.user_requests.find(ur=>ur.user === tg_chat_id)

        if(!loUserRequests){
            this.user_requests.push(request_chain)
        }else{
            loUserRequests = request_chain
        }
    }

    getRequestChainByUser(tg_chat_id: number): request_chain | undefined{
        return this.user_requests.find(ur=>ur.user === tg_chat_id)
    }
    
    getCommandByName(name: string): command{
        let loIndex = bt.indexOfPropertyValue(this.commandList, 'name', name)
        return this.commandList[loIndex]
    }

    addCommand(command: command){this.commandList.push(command)}

    async handleRequest(chat_id: number, input: string){
        
        let request_chain = this.getRequestChainByUser(chat_id)
        
        if(request_chain === undefined){
            request_chain = {data: {},requests: [],user: chat_id}
            this.user_requests.push(request_chain)
        }

        if(input === "🔙 Zurück"){
            request_chain.requests.pop()
            if(request_chain.requests.length > 0){
                request_chain.requests.pop()
                if(request_chain.requests.length > 0){
                    input = request_chain.requests[request_chain.requests.length - 1].input
                }
            }
        }else if(input === "🏠 Startseite"){
            request_chain.requests = []
            let loBenutzer = request_chain.data.benutzer
            request_chain.data = {}
            request_chain.data.benutzer = loBenutzer
        }

        let loCurrentCommand: command
        if(request_chain.requests.length == 0){
            loCurrentCommand = this.getCommandByName('start')
        }else{
            request_chain.requests[request_chain.requests.length - 1].input = input
            loCurrentCommand = this.getCommandByName(request_chain.requests[request_chain.requests.length - 1].command_name)
        }

        if (loCurrentCommand === undefined){
            this.tg_bot.telegram.sendMessage(chat_id, 'Command not found ❌\n\nTry again or reset your current command ', {reply_markup: {keyboard: [[{text: "🔙"}, {text: "🏠 Startseite"}]]}})
        }else{
            await loCurrentCommand.onExecute(request_chain, input)
        }
    }

    async sendMessage(user: number, message: string, button?: {text: string, callback?: string}[][], options?: {button_type?: "keyboard" | "inline", markdown?: boolean, expand?: boolean, padding?: number}, request_chain?: request_chain) : Promise<number>{
        try{
            const mergedOptions: any = {
                expand: true,
                padding: 50,
                markdown: true,
                button_type: this.options.button_type,
                ...options 
            };

            if(mergedOptions.markdown){
                mergedOptions.parse_mode = "Markdown"
            }
    
            if(button){
                mergedOptions.reply_markup = {}
                
                if(request_chain){request_chain.data.last_menu = button}

                if(mergedOptions.button_type === "keyboard"){
                    mergedOptions.reply_markup.keyboard = button
                }else if(mergedOptions.button_type === "inline"){
                    button = button.map(row => row.map(b => ({...b, callback_data: b.callback ?? b.text})));
                    console.log(`BUTTON: ${JSON.stringify(button)}`)
                    mergedOptions.reply_markup.inline_keyboard = button
                }
            }
    
            if (message.length < mergedOptions.padding && mergedOptions.expand) {
                const totalPadding = mergedOptions.padding - message.length;
                const leftPadding = Math.floor(totalPadding / 2); 
                const rightPadding = totalPadding - leftPadding;
                message = "..." + " ".repeat(leftPadding) + message + " ".repeat(rightPadding) + "...";
            }

            let loMessage = await this.tg_bot.telegram.sendMessage(user, message, mergedOptions)
            
            await bt.sleep(1000)

            return loMessage.message_id
        }catch(e: any){
            console.log(e.message)
        }
    }

    async editMessage(chat_id: number, message_id: number, message: string){  
        try{
            this.tg_bot.telegram.editMessageText(chat_id, message_id, undefined, message)
        }catch(e: any){
            console.log(e.message)
        }
    }

    async sendDocument(chat_id: number, filePath: string): Promise<void> {
        try {
          await this.tg_bot.telegram.sendDocument(chat_id, {source: filePath});
      
          console.log("Dokument erfolgreich gesendet!");
        } catch (error) {
          console.error("Fehler beim Senden des Dokuments:", error);
        }
    }

    async handleFile(ctx: any, fileId: string, input = "") {
    
        let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000));
    
        if (msgInTime) {
            let loChatId = ctx.update.message.chat.id;
            let loRequestChain = this.getRequestChainByUser(loChatId)!;
    
            if (!Array.isArray(loRequestChain.data.files)) {
                loRequestChain.data.files = [];
            }
    
            const file = await ctx.telegram.getFile(fileId);
            const fileLink = await ctx.telegram.getFileLink(fileId);
            const fileExtension = path.extname(file.file_path) || '.jpg'; // Default to 'jpg' if no extension found
            console.log(`${fileExtension} File Received!`);
    
    
            loRequestChain.data.files.push({ link: fileLink, extension: fileExtension });
            this.updateRequestChain(loChatId, loRequestChain);
            
            await this.handleRequest(loChatId, input);
        }
    }        

    async startListening(request_cache_path: string = ""){ 

        this.tg_bot.launch()
        
        if(request_cache_path !== ""){
            console.log(`READ FILE: ${request_cache_path}`)
            let dbString = await fs.readFile(request_cache_path, 'utf-8');
            console.log(`${dbString}`)
            this.user_requests = JSON.parse(dbString) 
        
            console.log(`USER REQUEST CACHE LOADED SUCCESSFULLY: ${JSON.stringify(this.user_requests)}`)
        }

        this.tg_bot.on('text', async (ctx: any) => {

            try{
                console.log("Telegram Message Recieved!")
        
                if(ctx.updateType == "message"){
                    let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000))
                    console.log(`Message: ${ctx.update.message.text}`)
                    console.log(`CHAT ID: ${ctx.update.message.chat.id}`)
                    if(msgInTime){
                        await this.handleRequest(ctx.update.message.chat.id, ctx.update.message.text)                   
                    }
                }            
            }catch(e: any){
                console.log(e.message)
            }
        })

        this.tg_bot.on('callback_query', async (ctx: any) => {
            try{
                console.log("Telegram Callback Query Received!");
            
                if (ctx.updateType === "callback_query") {
                    const callbackData = ctx.update.callback_query.data;
                    const chatId = ctx.update.callback_query.message.chat.id;
            
                    console.log(`Callback Data: ${callbackData}`);
                    console.log(`CHAT ID: ${chatId}`);
            
                    await this.handleRequest(chatId, callbackData);
                    await ctx.answerCbQuery(); 
                }

            }catch(e: any){
                console.log(e.message)
            }
        });

        this.tg_bot.on('document', async (ctx: any) => {
            console.log("Telegram Message Recieved!")
    
            let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000))

            console.log(ctx.update.message.chat.id)
            if(msgInTime){
                const fileId = ctx.update.message.document.file_id;
                const input = ctx.update.message.caption || ""; 
                await this.handleFile(ctx, fileId, input)
            }
        })

        this.tg_bot.on('photo', async (ctx: any) => {
            console.log("Telegram Photo Message Received!");
        
            let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000));
        
            console.log(ctx.update.message.chat.id);
            if (msgInTime) {
                const fileId = ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id; // Get the highest resolution photo
                const input = ctx.update.message.caption || ""; 
                await this.handleFile(ctx, fileId, input)
            }
        });
    }
}