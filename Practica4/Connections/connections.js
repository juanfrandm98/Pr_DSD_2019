// Envía una notificación que contiene las direcciones de todos los clientes conectados
// al servicio cada vez que un nuevo cliente se conecta o desconecta mediante emit().
// Cuando el servicio recibe un evento del tipo "output-evt" le envía al cliente el
// mensaje "Hola Cliente!"

var http = require( "http" );		// Servicios que usen el protocolo HTTP
var url = require( "url" );			// Servicios que usen las URLs
var fs = require( "fs" );			// Operaciones con ficheros
var path = require( "path" );		// Utilizar la ruta como cadena de caracteres
var socketio = require( "socket.io" );
var mimeTypes = { "html": "text/html", "jpeg": "image/jpeg", "jpg": "image/jpeg",
				  "png": "image/png", "js": "text/javascript", "css": "text/css",
				  "swf": "application/x-shockwave-flash" };

var httpServer = http.createServer(
	function( request, response ) {
		var uri = url.parse( request.url ).pathname;
		if( uri == "/" ) uri = "connections.html";
		var fname = path.join( process.cwd(), uri );

		fs.exists( fname, function( exists ) {
			if( exists ) {
				fs.readFile( fname, function( err, data ) {
					if( !err ) {
						var extension = path.extname( fname ).split( "." )[1];
						var mimeType = mimeTypes[extension];
						response.writeHead( 200, mimeType );
						response.write( data );
						response.end();
					} else {
						response.writeHead( 200, {"Content-Type": "text/plain"} );
						response.write( 'Error de lectura en el fichero: ' + uri );
						response.end();
					}
				});
			} else {
				console.log( "Peticion invalida: " + uri );
				response.writeHead( 200, {"Content-Type": "text/plain"} );
				response.write( '404 Not Found\n' );
				response.end();
			}
		});
	}
);

httpServer.listen(8080);
var io = socketio.listen( httpServer );

var allClients = new Array();
io.sockets.on( 'connection', 
	function( client ) {
		allClients.push( {address:client.request.connection.remoteAddress,
						  port:client.request.connection.remotePort} );
		console.log( 'New connection from ' + client.request.connection.remoteAddress +
					 ':' + client.request.connection.remotePort );
		io.sockets.emit( 'all-connections', allClients );
		client.on( 'output-evt', function( data ) {
			client.emit( 'output-evt', 'Hola Cliente!' );
		});
		client.on( 'disconnect', function() {
			var index = -1;

			for( var i = 0; i < allClients.length; i++ )
				if( allClients[i].address == client.request.connection.remoteAddress )
					if( allClients[i].port == client.request.connection.remotePort )
						index = i;

			if( index != -1 ) {
				allClients.splice( index, 1 );
				io.sockets.emit( 'all-connections', allClients );
			}
			console.log( 'El usuario ' + client.request.connection.remoteAddress +
						 ' se ha desconectado' + index );
		});
	}
);

console.log( "Servicio Socket.io iniciado" );
// Eventos de socket.io:
// 		- 'connect'/'connection': se emite al realizarse una conexión correctamente
//		- 'reconnecting': notifica un intento de reconexión
// 		- 'disconnect': notificación de la desconexión entre cliente y servicio
//		- 'connect-failed': se emite cuando socket.io no es capaz de establecer una conexión
//		- 'error': notificación de un error que no puede ser tratado mediante cualquier otro
//		  evento por defecto
//		- 'message': la función emit() es la que notifica eventos. También está la función
//		  send(), que envía información arbitraria a nivel de sockets. Si usamos la segunda,
//		  se notificará este evento en el receptor para que pueda gestionar la información
//		  recibida
//		- 'anything': notificación de que se ha recibido cualquier tipo de evento definido por
//		  el usuario. No se recibe para los eventos de esta lista
//		- 'reconnect': se emite cuando un cliente trata de reconectarse a un servicio
//		- 'reconnect_failed': error de reconexión a un servicio
//		- 'reconnectiong': notificación de que un cliente está tratando de reconectarse al servicio