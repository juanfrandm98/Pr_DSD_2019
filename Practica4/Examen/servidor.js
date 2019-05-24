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
var presencia = "no detectada";
var persianas = "abiertas";
var aire = "apagado";
var television = "apagada";
var estado_agente = "encendido";

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
			console.log( '\nNueva conexión desde ' + client.request.connection.remoteAddress +
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

			client.emit( 'inicializar', {lum:luminosidad, tem:temperatura, pre:presencia,
										 per:persianas, ac:aire, tv:television,
										 estado:estado_agente} );
		});

		// Un sensor manda una nueva luminosidad
		client.on( 'actualizar_luminosidad', function( lum ) {
			luminosidad_vieja = luminosidad;
			luminosidad = lum;
			dateTime = new Date();
			console.log( '\nNueva luminosidad detectada: ' + luminosidad );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Luminosidad',
														 valor_antiguo:luminosidad_vieja,
														 valor_nuevo:luminosidad,
														 momento:dateTime},
														 {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de luminosidad insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de luminosidad en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nueva_luminosidad', luminosidad );
		});

		// Un sensor manda una nueva presencia
		client.on( 'actualizar_presencia', function( pre ) {
			presencia_vieja = presencia;
			presencia = pre;
			dateTime = new Date();
			console.log( '\nPresencia ahora: ' + presencia );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Presencia',
														 valor_antiguo:presencia_vieja,
														 valor_nuevo:presencia,
														 momento:dateTime},
														 {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de presencia insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de presencia en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nueva_presencia', presencia );
		});

		// Un sensor manda una nueva temperatura
		client.on( 'actualizar_temperatura', function( tem ) {
			temperatura_vieja = temperatura;
			temperatura = tem;
			dateTime = new Date();
			console.log( '\nNueva temperatura detectada: ' + temperatura );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Temperatura',
														  valor_antiguo:temperatura_vieja,
														  valor_nuevo:temperatura,
														  momento:dateTime},
														  {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de temperatura insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de temperatura en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nueva_temperatura', temperatura );
		});

		// Un sensor manda un nuevo estado de la televisión
		client.on( 'cambiar_tv', function( tv ) {
			television_vieja = television;
			television = tv;
			dateTime = new Date();
			console.log( '\nNuevo estado de la televisión: ' + television );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Television',
														  valor_antiguo:television_vieja,
														  valor_nuevo:television,
														  momento:dateTime},
														  {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de televisión insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de televisión en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nueva_tv', television );
		});

		// Un cliente solicita cambiar el estado de las persianas
		client.on( 'cambiar_persianas', function() {
			console.log( '\nNueva solicitud para cambiar el estado de las persianas.' );
			io.sockets.emit( 'solicitud_persianas' );
		});

		// Un sensor permite cambiar el estado de las persianas y manda el nuevo
		client.on( 'adelante_persianas', function( nuevo_estado ) {
			persianas_viejas = persianas;
			persianas = nuevo_estado;
			dateTime = new Date();
			console.log( 'Nuevo estado de las persianas: ' + persianas );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Persianas',
														  valor_antiguo:persianas_viejas,
														  valor_nuevo:persianas,
														  momento:dateTime},
														  {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de persianas insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de temperatura en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nueva_persiana', persianas );
		});

		// Un sensor permite cambiar el estado de las persianas por un agente y manda el nuevo
		client.on( 'adelante_persianas_agente', function( nuevo_estado ) {
			persianas_viejas = persianas;
			persianas = nuevo_estado;
			dateTime = new Date();
			console.log( 'Nuevo estado de las persianas: ' + persianas );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Persianas',
														  valor_antiguo:persianas_viejas,
														  valor_nuevo:persianas,
														  momento:dateTime},
														  {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de persianas insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de temperatura en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nueva_persiana', persianas );
			io.sockets.emit( 'nueva_persiana_agente', persianas );
		});

		// Un cliente solicita cambiar el estado del ac
		client.on( 'cambiar_ac', function() {
			console.log( '\nNueva solicitud para cambiar el estado del ac.' );
			io.sockets.emit( 'solicitud_ac' );
		});

		// Un sensor permite cambiar el estado del ac por un agente y manda el nuevo
		client.on( 'adelante_ac_agente', function( nuevo_estado ) {
			aire_viejo = aire;
			aire = nuevo_estado;
			dateTime = new Date();
			console.log( 'Nuevo estado del ac: ' + aire );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'AC',
														  valor_antiguo:aire_viejo,
														  valor_nuevo:aire,
														  momento:dateTime},
														  {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de AC insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de temperatura en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nuevo_ac', aire );
			io.sockets.emit( 'nuevo_ac_agente', aire );
		});

		// Un sensor permite cambiar el estado de la tv por un agente y manda el nuevo
		client.on( 'adelante_tv_agente', function( nuevo_estado ) {
			television_vieja = television;
			television = nuevo_estado;
			dateTime = new Date();
			console.log( 'Nuevo estado de la tv: ' + television );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Television',
														  valor_antiguo:television_vieja,
														  valor_nuevo:television,
														  momento:dateTime},
														  {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de televisión insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de televisión en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nueva_tv', television );
			io.sockets.emit( 'nueva_tv_agente', television );
		});

		// Un sensor permite cambiar el estado del ac y manda el nuevo
		client.on( 'adelante_ac', function( nuevo_estado ) {
			aire_viejo = aire;
			aire = nuevo_estado;
			dateTime = new Date();
			console.log( 'Nuevo estado del ac: ' + aire );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'AC',
														  valor_antiguo:aire_viejo,
														  valor_nuevo:aire,
														  momento:dateTime},
														  {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio de AC insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio de temperatura en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nuevo_ac', aire );
		});

		// Un agente avisa que hay que abrir las persianas
		client.on( 'aviso_abrir_persianas', function() {
			console.log( '\nEl agente avisa a los clientes para que abran las persianas.' );
			io.sockets.emit( 'aviso_abrir_persianas' );
		});

		// Un agente avisa que hay que cerrar las persianas
		client.on( 'aviso_cerrar_persianas', function() {
			console.log( '\nEl agente avisa a los clientes para que cierren las persianas.' );
			io.sockets.emit( 'aviso_cerrar_persianas' );
		});

		// Un agente obliga a cambiar el estado de las persianas
		client.on( 'forzar_persianas', function() {
			console.log( '\nEl agente quiere modificar el estado de las persianas.' );
			io.sockets.emit( 'solicitud_persianas_agente' );
		});

		// Un agente avisa que hay que encender el ac
		client.on( 'aviso_encender_ac', function() {
			console.log( '\nEl agente avisa a los clientes para que enciendan el ac.' );
			io.sockets.emit( 'aviso_encender_ac' );
		});

		// Un agente avisa que hay que apagar el ac
		client.on( 'aviso_apagar_ac', function() {
			console.log( '\nEl agente avisa a los clientes para que apaguen el ac.' );
			io.sockets.emit( 'aviso_apagar_ac' );
		});

		// Un agente obliga a cambiar el estado del ac
		client.on( 'forzar_ac', function() {
			console.log( '\nEl agente quiere modificar el estado del ac.' );
			io.sockets.emit( 'solicitud_ac_agente' );
		});

		// Un agente avisa que hay que apagar la tv
		client.on( 'aviso_apagar_tv', function() {
			console.log( '\nEl agente avisa a los clientes para que apaguen la tv.' );
			io.sockets.emit( 'aviso_apagar_tv' );
		});

		// Un agente quita los avisos de tv (amarillos) de los clientes
		client.on( 'quitar_aviso_tv', function() {
			console.log( '\nEl agente detecta que la televisión puede seguir encendida.' );
			io.sockets.emit( 'quitar_aviso_tv' );
		});

		// Un agente quita los avisos de persianas (amarillos) de los clientes
		client.on( 'quitar_aviso_persianas', function() {
			console.log( '\nEl agente detecta que el nivel de luminosidad vuelve a ser normal.' );
			io.sockets.emit( 'quitar_aviso_persianas' );
		});

		// Un agente quita los avisos de ac (amarillos) de los clientes
		client.on( 'quitar_aviso_ac', function() {
			console.log( '\nEl agente detecta que la temperatura vuelve a ser normal.' );
			io.sockets.emit( 'quitar_aviso_ac' );
		});

		// Un agente obliga a cambiar el estado de la tv
		client.on( 'forzar_tv', function() {
			console.log( '\nEl agente quiere modificar el estado de la tv.' );
			io.sockets.emit( 'solicitud_tv_agente' );
		});

		// Se solicita un cambio de estado del agente
		client.on( 'cambiar_agente', function() {
			console.log( '\nSe solicita un cambio de estado del agente.' );
			io.sockets.emit( 'solicitud_cambio_agente' );
		});

		// El agente permite el cambio de estado
		client.on( 'adelante_agente', function( estado ) {
			estado_agente_viejo = estado_agente;
			estado_agente = estado;
			dateTime = new Date();
			console.log( 'Nuevo estado del agente: ' + estado_agente );

			dbo.collection( "cambiosEstado" ).insertOne( {afectado:'Agente',
														 valor_antiguo:estado_agente_viejo,
														 valor_nuevo:estado_agente,
														 momento:dateTime},
														 {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( "Cambio en el agente insertado en la colección de Mongo." );
					dbo.collection( "cambiosEstado" ).find().sort( {$natural:-1} ).limit(5).toArray( function( err, results ) {
						io.sockets.emit( 'cambios', results );
					});
				} else {
					console.log( "Error al introducir el cambio en el agente en la colección de Mongo." );
				}
			});

			io.sockets.emit( 'nuevo_agente', estado_agente );
		});

		// Desconexión
		client.on( 'disconnect', function() {
			identificador = client.id;

			dbo.collection( "conexiones" ).findOneAndDelete( {identificador:identificador}, {safe:true}, function( err, result ) {
				if( !err ) {
					console.log( '\nEl usuario ' + identificador + ' se ha desconectado.' );
					dbo.collection( "conexiones" ).find().toArray( function( err, results ) {
						io.sockets.emit( 'conexiones', results );
					});
				} else
					console.log( '\nEl usuario ' + identificador + ' no pudo desconectarse.' );
			});
		});
	});

});

console.log( "Servidor iniciado.");