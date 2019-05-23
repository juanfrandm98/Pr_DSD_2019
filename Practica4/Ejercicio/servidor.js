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

		// if( uri == '/sensor.html' ) uri = 'sensor.html';
		// else if( uri == '/agente.html' ) uri = 'agente.html';
		// else if( uri == '/cliente.html' ) uri = 'cliente.html';
		if( uri == '/' ) uri = 'cliente.html';

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

var luminosidad = 50;
var temperatura = 25;
var persianas = "abiertas";
var aire = "apagado";

var allConnections = new Array();
var sensor;

MongoClient.connect( "mongodb://127.0.0.1:27017", function( err, db ) {
	if( !err )
		console.log( "Conectado a Base de Datos" );
	else
		console.log( "Error al conectar a la Base de datos: " + err );

	var dbo = db.db( "datosSensores" );

	httpServer.listen( 8080 );
	var io = socketio.listen( httpServer );

	dbo.collection( "conexiones" ).drop();
	dbo.createCollection( "conexiones", function( err, collection1 ) {
		if( !err )
			console.log( "Colección creada en Mongo: " + collection1.collectionName );
	});

	dbo.collection( "cambiosEstado" ).drop();
	dbo.createCollection( "cambiosEstado", function( err, collection2 ) {
		if( !err )
			console.log( "Colección creada en Mongo: " + collection2.collectionName );
	});

	io.sockets.on( 'connection', function( client ) {
		client.emit( 'peticion_tipo' );

		// El cliente envía qué tipo de conexión es (sensor, agente o cliente)
		client.on( 'respuesta_tipo', function( tipo ) {
			console.log( 'Nueva conexión desde ' + client.request.connection.remoteAddress +
						 ':' + client.request.connection.remotePort + ', se trata de un ' +
						 tipo );

			identificador = client.id;
			dbo.collection( "conexiones" ).insertOne( {identificador:identificador,
													 address:client.request.connection.remoteAddress,
													 port:client.request.connection.remotePort,
													 tipo:tipo}, {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Insertado en la colección de Mongo usuario " + identificador + " (" + tipo + ")." );
					dbo.collection( "conexiones" ).find().toArray( function( err, results ) {
						io.sockets.emit( 'conexiones', results );
					});
				} else
					console.log( "Error al insertar datos en la colección." );
			});

			client.emit( 'inicializar', {lum:luminosidad, tem:temperatura,
										 per:persianas, ac:aire} );
		});

		// Un sensor manda una nueva luminosidad
		client.on( 'actualizar_luminosidad', function( lum ) {
			luminosidad = lum;
			console.log( 'Nueva luminosidad detectada: ' + luminosidad );
			io.sockets.emit( 'nueva_luminosidad', luminosidad );
		});

		// Un sensor manda una nueva temperatura
		client.on( 'actualizar_temperatura', function( tem ) {
			temperatura = tem;
			console.log( 'Nueva temperatura detectada: ' + temperatura );
			io.sockets.emit( 'nueva_temperatura', temperatura );
		});

		// Un cliente solicita cambiar el estado de las persianas
		client.on( 'cambiar_persianas', function() {
			console.log( 'Nueva solicitud para cambiar el estado de las persianas.' );
			io.sockets.emit( 'solicitud_persianas' );
		});

		// Un sensor permite cambiar el estado de las persianas y manda el nuevo
		client.on( 'adelante_persianas', function( nuevo_estado ) {
			persianas = nuevo_estado;
			console.log( 'Nuevo estado de las persianas: ' + persianas );
			io.sockets.emit( 'nueva_persiana', persianas );
		});

		// Un sensor permite cambiar el estado de las persianas por un agente y manda el nuevo
		client.on( 'adelante_persianas_agente', function( nuevo_estado ) {
			persianas = nuevo_estado;
			console.log( 'Nuevo estado de las persianas: ' + persianas );
			io.sockets.emit( 'nueva_persiana', persianas );
			io.sockets.emit( 'nueva_persiana_agente', persianas );
		});

		// Un cliente solicita cambiar el estado del ac
		client.on( 'cambiar_ac', function() {
			console.log( 'Nueva solicitud para cambiar el estado del ac.' );
			io.sockets.emit( 'solicitud_ac' );
		});

		// Un sensor permite cambiar el estado del ac por un agente y manda el nuevo
		client.on( 'adelante_ac_agente', function( nuevo_estado ) {
			aire = nuevo_estado;
			console.log( 'Nuevo estado del ac: ' + aire );
			io.sockets.emit( 'nuevo_ac', aire );
			io.sockets.emit( 'nuevo_ac_agente', aire );
		});

		// Un sensor permite cambiar el estado del ac y manda el nuevo
		client.on( 'adelante_ac', function( nuevo_estado ) {
			aire = nuevo_estado;
			console.log( 'Nuevo estado del ac: ' + aire );
			io.sockets.emit( 'nuevo_ac', aire );
		});

		// Un agente avisa que hay que abrir las persianas
		client.on( 'aviso_abrir_persianas', function() {
			console.log( 'El agente avisa a los clientes para que abran las persianas.' );
			io.sockets.emit( 'aviso_abrir_persianas' );
		});

		// Un agente avisa que hay que cerrar las persianas
		client.on( 'aviso_cerrar_persianas', function() {
			console.log( 'El agente avisa a los clientes para que cierren las persianas.' );
			io.sockets.emit( 'aviso_cerrar_persianas' );
		});

		// Un agente obliga a cambiar el estado de las persianas
		client.on( 'forzar_persianas', function() {
			console.log( 'El agente quiere modificar el estado de las persianas.' );
			io.sockets.emit( 'solicitud_persianas_agente' );
		});

		// Un agente avisa que hay que encender el ac
		client.on( 'aviso_encender_ac', function() {
			console.log( 'El agente avisa a los clientes para que enciendan el ac.' );
			io.sockets.emit( 'aviso_encender_ac' );
		});

		// Un agente avisa que hay que apagar el ac
		client.on( 'aviso_apagar_ac', function() {
			console.log( 'El agente avisa a los clientes para que apaguen el ac.' );
			io.sockets.emit( 'aviso_apagar_ac' );
		});

		// Un agente obliga a cambiar el estado del ac
		client.on( 'forzar_ac', function() {
			console.log( 'El agente quiere modificar el estado del ac.' );
			io.sockets.emit( 'solicitud_ac_agente' );
		});

		// Un agente quita los avisos de persianas (amarillos) de los clientes
		client.on( 'quitar_aviso_persianas', function() {
			console.log( 'El agente detecta que el nivel de luminosidad vuelve a ser normal.' );
			io.sockets.emit( 'quitar_aviso_persianas' );
		});

		// Un agente quita los avisos de ac (amarillos) de los clientes
		client.on( 'quitar_aviso_ac', function() {
			console.log( 'El agente detecta que la temperatura vuelve a ser normal.' );
			io.sockets.emit( 'quitar_aviso_ac' );
		});

		// Desconexión
		client.on( 'disconnect', function() {
			identificador = client.id;

			dbo.collection( "conexiones" ).findOneAndDelete( {identificador:identificador}, {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( 'El usuario ' + identificador + ' se ha desconectado.' );
					dbo.collection( "conexiones" ).find().toArray( function( err, results ) {
						io.sockets.emit( 'conexiones', results );
					});
				} else
					console.log( 'El usuario ' + identificador + ' no pudo desconectarse.' );
			});
		});
	});

});

console.log( "Servidor iniciado.");