

import { MongoDbStorage } from "./index"
var builder = require('botbuilder');

var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector)
    .set("storage", new MongoDbStorage({
        DatabaseName: "abc123456",
        collectionName: "botState",
        mongoIp: "127.0.0.1",
        mongoPort: "27017",
        // mongoIp: "ds125578.mlab.com",
        // mongoPort: "255xx",
        // username: "myUserAdmin",
        // password: "testtest123"
    }));

    bot.dialog("/", [
        (s:any) => { builder.Prompts.text(s, "name?") },
        (s:any, r:any) => {
            s.userData.name = r.response;
            console.log("after name", s.userData)
            builder.Prompts.number(s, "age?")
        },
        (s:any, r:any) => {
            console.log("after age", s.userData)
    
            s.userData.age = r.response
    
            s.endDialog("bady " + s.userData.name)
        }
    
    ])