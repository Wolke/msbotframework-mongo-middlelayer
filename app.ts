import * as Storage from "./index"
import * as builder from "botbuilder"

let connector = new builder.ConsoleConnector().listen();


var bot = new builder.UniversalBot(connector)
    .set("storage", new Storage.default({
        DatabaseName: "abc123456",
        // mongoIp: "127.0.0.1",
        // mongoPort: "27017",
        mongoIp: "ds125578.mlab.com",
        mongoPort: "25578",
  
        collectionName: "botState",
        
        username:"myUserAdmin",
        password:"testtest123"
    }, {
            gzipData: false
        }));

bot.use(builder.Middleware.dialogVersion({ version: 3.0, resetCommand: /^reset/i }));

bot.dialog("/", [
    s => { builder.Prompts.text(s, "name?") },
    (s, r) => {
        s.userData.name = r.response;
        console.log("after name",s.userData)
        builder.Prompts.number(s, "age?")
    },
    (s, r) => { 
        console.log("after age",s.userData)
    
        s.userData.age = r.response
        
        s.endDialog("bady " + s.userData.name) 
    }

])


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
