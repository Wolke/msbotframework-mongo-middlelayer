"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
var builder = require('botbuilder');
var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector)
    .set("storage", new index_1.MongoDbStorage({
    DatabaseName: "abc123456",
    collectionName: "botState",
    mongoIp: "127.0.0.1",
    mongoPort: "27017",
}));
bot.dialog("/", [
    (s) => { builder.Prompts.text(s, "name?"); },
    (s, r) => {
        s.userData.name = r.response;
        console.log("after name", s.userData);
        builder.Prompts.number(s, "age?");
    },
    (s, r) => {
        console.log("after age", s.userData);
        s.userData.age = r.response;
        s.endDialog("bady " + s.userData.name);
    }
]);
