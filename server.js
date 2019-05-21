var socketIO = require('socket.io');
var http = require('http');
var nodeStatic = require('node-static');
var os = require('os');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res){
    fileServer.serve(req,res);
}).listen(9999);

var thisRoom;

var io = socketIO.listen(app);

io.sockets.on('connection', function(socket){
    socket.setBroadcast = true;
    console.log('connection created');

    //메시지 처리
    socket.on('message', function(message){
        console.log('from client : '+message);

        if(thisRoom !== ''){
            io.sockets.in(thisRoom).emit('message', message);
        }

    });


    //초기화
    socket.on('create or join', function(roomName){

        var chatRoom = io.sockets.adapter.rooms[roomName];
        var numClients = chatRoom ? Object.keys(chatRoom.sockets).length : 0;

        thisRoom = roomName;

        console.log('numClients : '+numClients);
        //방을 만들어야 하는 상황
        if(numClients === 0){
            console.log('create Room and join');
            socket.join(roomName);

            console.log('created', roomName, socket.id);
            socket.emit('created', roomName, socket.id);
        }else if(numClients === 1){
            console.log('Client ID ' + socket.id + ' joined room ' + roomName);
            io.sockets.in(roomName).emit('join', roomName);

            socket.join(roomName);


            socket.emit('joined', roomName, socket.id);
            io.sockets.in(roomName).emit('ready');
        }else{
            console.log('full');
            socket.emit('full', roomName);

        }
    });



    socket.on('ipaddr', function() {
        console.log('When ipaddr call?');

        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('bye', function(){
        console.log('received bye');
    });


});


//
