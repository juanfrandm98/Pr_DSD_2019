var http = require( "http" ); 	// Se obtiene el módulo "http" de Node.js que permite implementar servicios
			      				// que sirvan contenidos usando el protocolo http

var httpServer = http.createServer(						// Se crea un servidor http
	function( request, response ) { 					// El parámetro del constructor de un servidor es una función con dos parámetros: request y response.
		console.log( request.headers );								// Imprime el mensaje codificado en request (petición recibida en el servicio)
		response.writeHead( 200, {"Context-Type": "text/plain"}); 	// Manda el encabezado de la respuesta (código de 3 dígitos)
		response.write( "Hola mundo" );								// Manda el cuerpo de la respuesta
		response.end();												// Finaliza el envío de la respuesta
	}
);

httpServer.listen(8080);					// El servidor recibe peticiones en el puerto 8080
console.log( "Servicio HTTP iniciado" );	// Imprime en la terminal
