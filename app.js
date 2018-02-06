"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Storage = require("./index");
var builder = require("botbuilder");
var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector)
    .set("storage", new Storage.default({
    DatabaseName: "test",
    mongoIp: "127.0.0.1",
    mongoPort: "27017",
    collectionName: "gogo"
}, {
    gzipData: false
}));
bot.use(builder.Middleware.dialogVersion({ version: 3.0, resetCommand: /^reset/i }));
bot.dialog("/", [
    function (s) { builder.Prompts.text(s, "name?"); },
    function (s, r) {
        s.userData.name = r.response;
        console.log("after name", s.userData);
        builder.Prompts.number(s, "age?");
    },
    function (s, r) {
        console.log("after age", s.userData);
        s.userData.age = r.response;
        s.endDialog("bady " + s.userData.name);
    }
]);
// bot.dialog('/', [
//     function (session: builder.Session, args: any, next: any) {
//         if (!session.userData.name) {
//             session.beginDialog('/profile');
//         } else {
//             next();
//         }
//     },
//     function (session, results) {
//         session.send('Hello %s!', session.userData.name);
//     }
// ]);
// bot.dialog('/profile', [
//     function (session) {
//         builder.Prompts.text(session, 'Hi! What is your name?');
//     },
//     function (session, results) {
//         console.log("results.response==>", results.response);
//         session.userData.name = results.response;
//         session.endDialog();
//     }
// ]);
