
# BotBuilder-MongoDB
Bot builder with Mongo Db(custom storage )

## Introduction 
mongodb connect to botframework stroage

## Code Sample

```js
var bot = new builder.UniversalBot(connector)
    .set("storage", new Storage.default({
        DatabaseName: "abc123456",
        collectionName: "botState",
        // mongoIp: "127.0.0.1",
        // mongoPort: "27017",
        mongoIp: "ds125578.mlab.com",
        mongoPort: "255xx",
        username: "myUserAdmin",
        password: "testtest123"
    }));

```

# Reference Link:
https://github.com/Manacola/msbotframework-mongo-middlelayer