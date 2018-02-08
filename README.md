
# botbuilder-MongoDbStorage
Microsoft Bot Framework V3 Mongo Db(custom storage )
[![npm version](https://badge.fury.io/js/botbuilder-mongodb-storage.svg)](https://badge.fury.io/js/botbuilder-mongodb-storage)
[![dependencies Status](https://david-dm.org/Wolke/botbuilder-mongodb-storage/status.svg)](https://david-dm.org/Wolke/botbuilder-mongodb-storage)

# BotBuilder-MongoDB
Bot builder with Mongo Db(custom storage )

## Introduction 
mongodb connect to botframework stroage


# Installation

```bash
npm install --save botbuilder-mongodb-storage
```


## Code Sample

```js
var bot = new builder.UniversalBot(connector)
    .set("storage", new MongoDbStorage({
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
