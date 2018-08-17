const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

mongo.connect('mongodb://127.0.0.1/mogochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('Connection to the mongo successful');

    //Connection to socket.IO

    client.on('connection',function(socket){
        let chat = db.collection('chats');

        //Creat function to send status
        sendstatus = function(s){
            socket.emit('emit', s);
        }

        //Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            //Emit the messages
            socket.emit('output', res);
        });

        //Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            //Check for name and message
            if(name=='' || message==''){
                //Send error status
                sendstatus('Please eter a name and message');
            }else{
                //Insert message in the database

                chat.insert({name:name, message:message}, function(){
                    client.emit('output', [data]);

                    //Send status object

                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });
        //Handle clear

        socket.on('clear',function(data){
            //Remove all chats from the collection

            chat.remove({}, function(){
                //Emit cleared
                socket.emit('cleared');
            });
        })
    });
});