var http = require( "http" );
var url = require( "url" );
var fs = require( "fs" );
var path = require( "path" );
var socketio = require( "socket.io" );

var MongoClient = require( 'mongodb' ).MongoClient;
var MongoServer = require( 'mongodb' ).Server;

var mimeTypes = {"html":"text/html", "jpeg":"image/jpeg", "jpg":"image/jpeg",
				 "png":"image/png", "js":"text/javascript", "css":"text/css",
				 "swf":"applications/x-shockwave-flash"};

var httpServer = http.createServer(
	function( request, response ) {
		var uri = url.parse( request.url ).pathname;
		if( uri == "/" ) uri = "/cliente.html";
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
						response.writeHead( 200, {"Content-Type":"text/plain"} );
						response.write( "Error de lectura en el fichero: " + uri );
						response.end();
					}
				});
			} else {
				console.log( "Petición inválida: " + uri );

				response.writeHead( 200, {"Content-Type":"text/plain"} );
				response.write( "404 - Not Found\n" );
				response.end();
			}
		});
	}
);

var mongoClient = new MongoClient( new MongoServer( 'localhost', 27017 ) );
var luminosidad = 0;
var temperatura = 0;
var persianas = "abiertas";
var ac = "apagado";
var clientes = new Array();

mongoClient.connect( "mongodb://localhost:27017/mibd", function( err, db ) {
	httpServer.listen( 8080 );
	var io = socketio.listen( httpServer );

	db.createCollection( "ejercicio", function( err, collection ) {
		io.sockets.on( 'connection', function( client ) {

			// Un sensor cambia los valores
			client.on( 'actualizar', function( data ) {
				luminosidad = data.lum;
				temperatura = data.tem;

				collection.insert( lum:luminosidad, tem:temperatura, tiempo: new Date() );

				io.sockets.emit( 'mostrar', {lum:luminosidad, tem:temperatura} );
			});

			// Un cliente cambia el estado de las persianas
			client.on( 'cambiar_persiana', function() {
				if( persianas == "abiertas" )
					persianas = "cerradas";
				else
					persianas = "abiertas";

				io.sockets.emit( 'nuevo_estado_persiana', persianas );
			});

			// Un cliente cambia el estado del ac
			client.on( 'cambiar_ac', function() {
				if( ac == "apagado" )
					ac = "encendido";
				else
					ac = "apagado";

				io.sockets.emit( 'nuevo_estado_ac', ac );
			});

			// Un agente abre las persianas
			client.on( 'abrir_persianas' , function() {
				persianas = "abiertas";
				io.sockets.emit( 'nuevo_estado_persiana', persianas );
			});

			// Un agente cierra las persianas
			client.on( 'cerrar_persianas', function() {
				persianas = "cerradas";
				io.sockets.emit( 'nuevo_estado_persiana', persianas );
			});

			// Un agente enciende el ac
			client.on( 'encender_ac', function() {
				ac = "encendido";
				io.sockets.emit( 'nuevo_estado_ac', ac );
			});

			// Un agente apaga el ac
			client.on( 'apagar_ac', function() {
				ac = "apagado";
				io.sockets.emit( 'nuevo_estado_ac', ac );
			});

		});
	});
});