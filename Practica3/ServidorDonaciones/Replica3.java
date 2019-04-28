// Código de una réplica

import java.rmi.*;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.UnicastRemoteObject;
import java.util.ArrayList;

public class Replica3 implements Replica_I {

	private String nombreReplica = "Replica3";
	private int numReplica = 3;
	private ArrayList<Usuario> usuarios = new ArrayList();
	private ArrayList<Replica_I> otrasReplicas = new ArrayList();
	private double totalDonado = 0;

	public static void main( String[] args ) {

		// Crea e instala el gestor de seguridad
		if( System.getSecurityManager() == null )
			System.setSecurityManager( new SecurityManager() );

		try {

			String nombre = "Replica3";
			Replica_I replica = new Replica3( );
			Replica_I stub = (Replica_I) UnicastRemoteObject.exportObject( replica, 0 );

			Registry reg = LocateRegistry.createRegistry(1102);
			reg.rebind( nombre, stub );

			System.out.println( "Réplica 3 - preparada..." );

		} catch( Exception e ) {
			System.err.println( "Excepción: " + e.getMessage() );
		}

	}

	public void conectaReplicas( ) {

		try {

			otrasReplicas = new ArrayList();

			Registry reg2 = LocateRegistry.getRegistry( "localhost",1101 );
			Replica_I replica2 = (Replica_I) reg2.lookup( "Replica2" );

			Registry reg3 = LocateRegistry.getRegistry( "localhost", 1100 );
			Replica_I replica1 = (Replica_I) reg3.lookup( "Replica1" );

			otrasReplicas.add( replica2 );
			otrasReplicas.add( replica1 );

		} catch( Exception e ) {
			System.err.println( "Réplica 3 - excepción al conectar réplicas: " + e.getMessage() );
		}

	}

	private int balanceo(){

		int numReplica = 2;
		int numUsuarios = usuarios.size();

		try{
		for( int i = 0; i < otrasReplicas.size(); i++ )
			if( numUsuarios > otrasReplicas.get(i).getNumUsuarios() ){
				numReplica = i;
				numUsuarios = otrasReplicas.get(i).getNumUsuarios();
			}
		} catch( Exception e ) {
			System.out.println( "Excepción: " + e.getMessage() );
		}


		return numReplica;
	}

	public boolean encuentraUsuario( String usuario ) {

		boolean encontrado = false;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				encontrado = true;

		return encontrado;

	}

	public boolean compruebaContrasenia( String usuario, String contrasenia ){
		boolean correcta = false;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				if( user.getContrasenia().equals( contrasenia ) )
					correcta = true;

		return correcta;
	}

	public boolean otroLogin( String usuario, String contrasenia ){

		boolean correcto = false;

		correcto = compruebaContrasenia( usuario, contrasenia );

		if( correcto )
			System.out.println( usuario + " logueado en " + nombreReplica );
		else
			System.out.println( "Contraseña incorrecta." );

		return correcto;
	}

	public void otroDonar( double cantidad, String usuario ){
		totalDonado += cantidad;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				user.setHaDonado( true );

		System.out.println( usuario + " ha donado " + cantidad + "€." );
	}

	public double otroGetDonado(){
		return totalDonado;
	}

	public void registrar( String usuario, String contrasenia ){
		usuarios.add( new Usuario( usuario, contrasenia ) );

		System.out.println( usuario + " registrado en " + nombreReplica );
	}

	public boolean login( String usuario, String contrasenia ){

		boolean log = false, encontrado = false;
		boolean correcto;

		if( encuentraUsuario( usuario ) ) {
			correcto = compruebaContrasenia( usuario, contrasenia );

			if( correcto ) {
				System.out.println( usuario + " logueado en " + nombreReplica );
				log = true;
			} else
				System.out.println( "Contraseña incorrecta." );

		} else {
			try{
			for( Replica_I r : otrasReplicas ) {
				if( !encontrado ) {
					if( r.encuentraUsuario( usuario ) ){
						encontrado = true;
						correcto = r.otroLogin( usuario, contrasenia );
						if( correcto )
							log = true;
					}
				}
			}

			if( !encontrado ){
				int n = balanceo();

				if( n == 2 )
					registrar( usuario, contrasenia );
				else
					otrasReplicas.get(n).registrar( usuario, contrasenia );

				log = true;
			}
			} catch( Exception e ) {
				System.out.println( "Excepción: " + e.getMessage() );
			}
		}

		return log;
	}

	public void donar( double cantidad, String usuario ) {

		if( encuentraUsuario( usuario ) ){
			
			for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				user.setHaDonado( true );

			totalDonado += cantidad;
			System.out.println( usuario + " ha donado " + cantidad + "€." );
		} else {
			try {
				boolean donado = false;

				for( Replica_I r : otrasReplicas ){
					if( !donado ) {
						if( r.encuentraUsuario( usuario ) ){
							r.otroDonar( cantidad, usuario );
							donado = true;
						}
					}
				}

			} catch( Exception e ) {
				System.out.println( "Excepción: " + e.getMessage() );
			}
		}

	}

	public double getDonado( String usuario ) {

		double donado = 0;
		boolean haDonado = false;

		if( encuentraUsuario( usuario ) )
			haDonado = getUsuarioDono( usuario );
		else {

			try {

				for( Replica_I r : otrasReplicas )
					if( r.encuentraUsuario( usuario ) )
						haDonado = r.getUsuarioDono( usuario );

			} catch( Exception e ) {
				System.out.println( "Excepción :" + e.getMessage() );
			}

		}

		if( haDonado ) {
			donado = totalDonado;

			try {

				for( Replica_I r : otrasReplicas )
					donado += r.otroGetDonado();

			} catch( Exception e ) {
				System.out.println( "Excepción :" + e.getMessage() );
			}
		}

		return donado;
	}

	public int getNumUsuarios() {
		return usuarios.size();
	}

	public boolean getUsuarioDono( String usuario ){

		boolean haDonado = false;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				haDonado = user.getHaDonado();

		return haDonado;
					
	}

}
