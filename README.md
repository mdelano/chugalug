
       ___    _                __ _             _              __ _  
      / __|  | |_     _  _    / _` |  __ _     | |    _  _    / _` | 
     | (__   | ' \   | +| |   \__, | / _` |    | |   | +| |   \__, | 
      \___|  |_||_|   \_,_|   |___/  \__,_|   _|_|_   \_,_|   |___/  
    _|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""| 
    "`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'  


MediaSilo's Event Runner Bot

Chugalug chugs mediasilo events and digests them into a search database

### How to run it
```sh 
git clone git@github.com:mediasilo/chugalug.git
cd chugalug
npm install && node server logLevel=info

```
### How to deploy it
``` sh
heroku config:set AWS_ACCESS_KEY_ID=<THE ACCESS KEY OF THE USER WHO CAN READ FROM THE SQS QUEUE>
heroku config:set AWS_REGION=<THE AWS REGION (us-east-1)>
heroku config:set AWS_SECRET_ACCESS_KEY=<THE ACCESS SECRET OF THE USER WHO CAN READ FROM THE SQS QUEUE>
heroku config:set MEDIASILO_AWS_SQSQ=<THE NAME OF THE SQS QUEUE>
heroku config:set MEDIASILO_ES_SERVERS=<THE URL OF THE ELASTIC SEARCH HOST>

git remote add <YOUR HEROKU REPO>
git push heroku master
```

### How does it work?

BirdCall monitors a Q for events like this:
``` json
  {
    "created": 1415295797413,
    "user": {
        "id": "C088B3E3-AC0B-01FF-38CB9FB5E8305255",
        "firstName": "Media",
        "lastName": "Silo",
        "userName": "mediasilo",
        "tags": [],
        "email": "dev@mediasilo.com"
    },
    "accountId": "892325355JKXZ",
    "hostname": "nerfwar",
    "eventName": "project.update",
    "entity": {
        "project": {
            "id": "51644190-e6c8-46a6-8155-9a6016aa56c8",
            "numericId": 50840,
            "name": "MikeD",
            "description": "",
            "dateCreated": 1415291237000,
            "ownerId": "C088B3E3-AC0B-01FF-38CB9FB5E8305255",
            "folderCount": 0,
            "favorite": false
        }
    }
}
```

When it receives events it sends them into ElasticSearch using the configured host URL
