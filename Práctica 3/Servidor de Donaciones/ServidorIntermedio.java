// Código del servidor

import java.net.MalformedURLException;
import java.rmi.*;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.*;

public class ServidorIntermedio {

	public static void main( String[] args ) {

		// Comprueba argumento
		if( args.length != 1 ) {
			System.out.println( "ERROR - Uso correcto del programa:" );
			System.out.println( "java -cp - Djava.rmi.server.codebase=file:./ -Djava.rmi.server.hostname=localhost -Djava.security.policy=server.policy ServidorIntermedio numReplicas" );
			System.exit(1);
		}

		// Crea e instala el gestor de seguridad
		if( System.getSecurityManager() == null )
			System.setSecurityManager( new SecurityManager() );

		try {

			Registry reg = LocateRegistry.createRegistry(1100);
			Servidor miservidor = new Servidor( Integer.parseInt( args[0] ) );
			reg.bind( "mmiservidor", miservidor );

			System.out.println( "Servidor intermedio listo." );

		} catch( RemoteException | AlreadyBoundException e ){
			System.out.println( "Excepción: " + e.getMessage() );
		}

	}

}