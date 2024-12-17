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
exports.bot = exports.russian_proxy_port = exports.russian_proxy_ip = void 0;
const { Telegraf } = require('telegraf');
const path = require('path');
const axios = require('axios');
const fs = __importStar(require("fs/promises"));
const bt = __importStar(require("./basictools"));
exports.russian_proxy_ip = "37.18.73.94"; //needed for better more reliable communication with telegram api
exports.russian_proxy_port = 5566;
class bot {
    commandList = [];
    user_requests;
    tg_bot; //Telegraf Bot Object
    options;
    constructor(tg_token, options = { button_type: "keyboard" }) {
        this.commandList = [];
        this.tg_bot = new Telegraf(tg_token, { polling: true });
        this.options = options;
        this.user_requests = [];
    }
    async getTgUsername(chat_id) {
        let loChat = await this.tg_bot.telegram.getChat(chat_id);
        return loChat.username;
    }
    updateRequestChain(tg_chat_id, request_chain) {
        let loUserRequests = this.user_requests.find(ur => ur.user === tg_chat_id);
        if (!loUserRequests) {
            this.user_requests.push(request_chain);
        }
        else {
            loUserRequests = request_chain;
        }
    }
    getRequestChainByUser(tg_chat_id) {
        return this.user_requests.find(ur => ur.user === tg_chat_id);
    }
    getCommandByName(name) {
        let loIndex = bt.indexOfPropertyValue(this.commandList, 'name', name);
        return this.commandList[loIndex];
    }
    addCommand(command) { this.commandList.push(command); }
    async handleRequest(chat_id, input) {
        let request_chain = this.getRequestChainByUser(chat_id);
        if (request_chain === undefined) {
            request_chain = { data: {}, requests: [], user: chat_id };
            this.user_requests.push(request_chain);
        }
        if (input === "🔙 Zurück") {
            request_chain.requests.pop();
            if (request_chain.requests.length > 0) {
                request_chain.requests.pop();
                if (request_chain.requests.length > 0) {
                    input = request_chain.requests[request_chain.requests.length - 1].input;
                }
            }
        }
        else if (input === "🏠 Startseite") {
            request_chain.requests = [];
            let loBenutzer = request_chain.data.benutzer;
            request_chain.data = {};
            request_chain.data.benutzer = loBenutzer;
        }
        let loCurrentCommand;
        if (request_chain.requests.length == 0) {
            loCurrentCommand = this.getCommandByName('start');
        }
        else {
            request_chain.requests[request_chain.requests.length - 1].input = input;
            loCurrentCommand = this.getCommandByName(request_chain.requests[request_chain.requests.length - 1].command_name);
        }
        if (loCurrentCommand === undefined) {
            this.tg_bot.telegram.sendMessage(chat_id, 'Command not found ❌\n\nTry again or reset your current command ', { reply_markup: { keyboard: [[{ text: "🔙" }, { text: "🏠 Startseite" }]] } });
        }
        else {
            await loCurrentCommand.onExecute(request_chain, input);
        }
    }
    async sendMessage(user, message, button, options, request_chain) {
        try {
            const mergedOptions = {
                expand: true,
                padding: 50,
                markdown: true,
                button_type: this.options.button_type,
                ...options
            };
            if (mergedOptions.markdown) {
                mergedOptions.parse_mode = "Markdown";
            }
            if (button) {
                mergedOptions.reply_markup = {};
                if (request_chain) {
                    request_chain.data.last_menu = button;
                }
                if (mergedOptions.button_type === "keyboard") {
                    mergedOptions.reply_markup.keyboard = button;
                }
                else if (mergedOptions.button_type === "inline") {
                    button = button.map(row => row.map(b => ({ ...b, callback_data: b.callback ?? b.text })));
                    console.log(`BUTTON: ${JSON.stringify(button)}`);
                    mergedOptions.reply_markup.inline_keyboard = button;
                }
            }
            if (message.length < mergedOptions.padding && mergedOptions.expand) {
                const totalPadding = mergedOptions.padding - message.length;
                const leftPadding = Math.floor(totalPadding / 2);
                const rightPadding = totalPadding - leftPadding;
                message = "..." + " ".repeat(leftPadding) + message + " ".repeat(rightPadding) + "...";
            }
            let loMessage = await this.tg_bot.telegram.sendMessage(user, message, mergedOptions);
            await bt.sleep(1000);
            return loMessage.message_id;
        }
        catch (e) {
            console.log(e.message);
        }
    }
    async editMessage(chat_id, message_id, message) {
        try {
            this.tg_bot.telegram.editMessageText(chat_id, message_id, undefined, message);
        }
        catch (e) {
            console.log(e.message);
        }
    }
    async sendDocument(chat_id, filePath) {
        try {
            await this.tg_bot.telegram.sendDocument(chat_id, { source: filePath });
            console.log("Dokument erfolgreich gesendet!");
        }
        catch (error) {
            console.error("Fehler beim Senden des Dokuments:", error);
        }
    }
    async handleFile(ctx, fileId, input = "") {
        let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000));
        if (msgInTime) {
            let loChatId = ctx.update.message.chat.id;
            let loRequestChain = this.getRequestChainByUser(loChatId);
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
    async startListening(request_cache_path = "") {
        this.tg_bot.launch();
        if (request_cache_path !== "") {
            console.log(`READ FILE: ${request_cache_path}`);
            let dbString = await fs.readFile(request_cache_path, 'utf-8');
            console.log(`${dbString}`);
            this.user_requests = JSON.parse(dbString);
            console.log(`USER REQUEST CACHE LOADED SUCCESSFULLY: ${JSON.stringify(this.user_requests)}`);
        }
        this.tg_bot.on('text', async (ctx) => {
            try {
                console.log("Telegram Message Recieved!");
                if (ctx.updateType == "message") {
                    let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000));
                    console.log(`Message: ${ctx.update.message.text}`);
                    console.log(`CHAT ID: ${ctx.update.message.chat.id}`);
                    if (msgInTime) {
                        await this.handleRequest(ctx.update.message.chat.id, ctx.update.message.text);
                    }
                }
            }
            catch (e) {
                console.log(e.message);
            }
        });
        this.tg_bot.on('callback_query', async (ctx) => {
            try {
                console.log("Telegram Callback Query Received!");
                if (ctx.updateType === "callback_query") {
                    const callbackData = ctx.update.callback_query.data;
                    const chatId = ctx.update.callback_query.message.chat.id;
                    console.log(`Callback Data: ${callbackData}`);
                    console.log(`CHAT ID: ${chatId}`);
                    await this.handleRequest(chatId, callbackData);
                    await ctx.answerCbQuery();
                }
            }
            catch (e) {
                console.log(e.message);
            }
        });
        this.tg_bot.on('document', async (ctx) => {
            console.log("Telegram Message Recieved!");
            let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000));
            console.log(ctx.update.message.chat.id);
            if (msgInTime) {
                const fileId = ctx.update.message.document.file_id;
                const input = ctx.update.message.caption || "";
                await this.handleFile(ctx, fileId, input);
            }
        });
        this.tg_bot.on('photo', async (ctx) => {
            console.log("Telegram Photo Message Received!");
            let msgInTime = (ctx.update.message.date * 1000 > (new Date().getTime() - 10000));
            console.log(ctx.update.message.chat.id);
            if (msgInTime) {
                const fileId = ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id; // Get the highest resolution photo
                const input = ctx.update.message.caption || "";
                await this.handleFile(ctx, fileId, input);
            }
        });
    }
}
exports.bot = bot;
