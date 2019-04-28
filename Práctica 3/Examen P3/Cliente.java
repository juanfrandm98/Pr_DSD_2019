// Código del cliente

import java.net.MalformedURLException;
import java.rmi.*;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.util.Scanner;

public class Cliente {

	private static Scanner teclado = new Scanner( System.in );

	private static void donar( Replica_I miservidor, String usuario, int numCausa ) {
		System.out.print( "Inserte la cantidad que quiere donar: " );
		double cantidad;

		do{
			cantidad = Double.parseDouble( teclado.nextLine() );

			if( cantidad <= 0 )
				System.out.print( "Error, inserte una cantidad positiva: " );
		} while( cantidad <= 0 );

		try {
			miservidor.donar( cantidad, usuario, numCausa );

			System.out.println( "\n¡Gracias por su donación!" );
		} catch( Exception e ){
			System.err.println( "Excepción al donar: " + e.getMessage() );
		}

	}

	private static void getDonado( Replica_I miservidor, String usuario, int numCausa ) {

		try {
			double donado = miservidor.getDonado( usuario, numCausa );

			if( donado > 0 )
				if( numCausa == 0 )
					System.out.println( "\nSe han recaudado " + donado + "€ entre todas las causas." );
				else
					System.out.println( "\nLa causa " + numCausa + " lleva recaudados " + donado + "€." );
			else
				System.out.println( "\nPara saber la cantidad total que se ha donado, primero dona tú también." );
		} catch( Exception e ) {
			System.err.println( "Excepción al leer lo donado: " + e.getMessage() );
		}
	}

	public static void main( String args[] ) {

		// Declaración de variables
		String opcion1, opcion2;
		boolean log;

		// Crea e instala el gestor de seguridad
		if( System.getSecurityManager() == null )
			System.setSecurityManager( new SecurityManager() );

		try {

			// Crea el stub para el cliente especificando el nombre del servidor
			String nombreReplica = "";
			System.out.println( "Escribe una réplica: Replica1, Replica2, Replica3." );
			nombreReplica = teclado.nextLine();

			Registry mireg;

			if( nombreReplica.equals( "Replica1" ) )
				mireg = LocateRegistry.getRegistry( "127.0.0.1", 1100 );
			else if( nombreReplica.equals( "Replica2" ) )
				mireg = LocateRegistry.getRegistry( "127.0.0.1", 1101 );
			else
				mireg = LocateRegistry.getRegistry( "127.0.0.1", 1102 );

			Replica_I miservidor = (Replica_I)mireg.lookup( nombreReplica );

			// Primer menú
			do {

				System.out.println( "¡Hola! ¿Qué desea?" );
				System.out.println( "1 - Login." );
				System.out.println( "0 - Salir." );
				System.out.print( "Elige: " );
				opcion1 = teclado.nextLine();

				switch( opcion1 ){
					case "1":
						// Recogemos datos para el login
						System.out.print( "\nNombre de usuario: " );
						String usuario = teclado.nextLine();
						System.out.print( "Contraseña: " );
						String contrasenia = teclado.nextLine();

						// Intentamos hacer login
						log = miservidor.login( usuario, contrasenia );

						if( log ) {

							System.out.println( "\nBienvenid@, " + usuario + "." );
							do {
								System.out.println( "¿Qué quiere hacer?" );
								System.out.println( "1 - Donar a la causa 1." );
								System.out.println( "2 - Donar a la causa 2." );
								System.out.println( "3 - Ver total donado a la causa 1.");
								System.out.println( "4 - Ver total donado a la causa 2.");
								System.out.println( "5 - Ver total donado a ambas causas juntas." );
								System.out.println( "0 - Cerrar sesión." );
								System.out.print( "Elige: " );
								opcion2 = teclado.nextLine();

								switch( opcion2 ){
									case "1":
										donar( miservidor, usuario, 1 );
										break;

									case "2":
										donar( miservidor, usuario, 2 );
										break;

									case "3":
										getDonado( miservidor, usuario, 1 );
										break;

									case "4":
										getDonado( miservidor, usuario, 2 );
										break;

									case "5":
										getDonado( miservidor, usuario, 0 );
										break;

									case "0":
										System.out.println( "\nGracias por su visita, " + usuario + "." );
										break;

									default:
										System.out.println( "Tecla incorrecta." );
										break;
								}
							} while( !opcion2.equals("0") );
							
						} else {
							System.out.println( "\nContraseña incorrecta." );
						}
						break;

					case "0":
						System.out.println( "\n\n¡Vuelve cuando quieras!" );
						break;

					default:
						System.out.println( "Tecla incorrecta." );
						break;
				}
			} while( !opcion1.equals("0") );

		} catch( NotBoundException | RemoteException e ) {
			System.err.println( "Excepción del sistema: " + e );
		}

		System.exit(0);

	}

}