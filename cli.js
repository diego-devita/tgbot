#!/usr/bin/env node

import TelegramBot from 'node-telegram-bot-api';
import WebSocket from 'ws';
import fs from 'fs';
import os from 'os';
import path from 'path';

let params;

function resolve(pathToResolve){
    if(pathToResolve.startsWith('~'))
        return path.join(os.homedir(), pathToResolve.slice(1));
    else
        return  pathToResolve;
}

const fileparams = resolve('~/.tgbot/targets');
if(!fs.existsSync(fileparams)){
    console.log(`il file ${fileparams} non esiste. È stato creato. Completare la configurazione prima di rilanciare lo script.`);
    process.exit();
}else{
    try{
        const content = fs.readFileSync(fileparams, 'utf-8');
        params = JSON.parse(content);
        if(!params.token || !params.wsUrl || !params.cookie)
            throw new Error('Tutti i parametri sono obbligatori');
    }catch(e){
        console.log(`il file ${fileparams} ha dei problemi. Completare la configurazione prima di rilanciare lo script.`);
        process.exit();
    }
}

const ws = new WebSocket(params.wsUrl, {
    rejectUnauthorized: false,
    headers: {
        Cookie: params.cookie
    }
});
const bot = new TelegramBot(params.token, {polling: true});

let latest_chatid = undefined;

export function botListening(){

    bot.on('message', async (msg) => {
        switch(msg.text.toLowerCase()){
            default:
                latest_chatid = msg.chat.id;
                await bot.sendMessage(latest_chatid, 'conversazione collegata!');
        }
    });

    bot.on('callback_query', async (callbackQuery) => {
        //bot.sendMessage(callbackQuery.message.chat.id, message);
    });
}

botListening();

ws.on('message', async (data) => {
    console.log('Dati ricevuti: ' + data);
    if(latest_chatid)
        await bot.sendMessage(latest_chatid, data);
});

ws.on('open', () => {
    console.log('Connesso al WebSocket');
});

ws.on('close', () => {
    console.log('Connessione al WebSocket chiusa');
});