// Código de una réplica

import java.rmi.*;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.UnicastRemoteObject;
import java.util.ArrayList;

public class Replica2 implements Replica_I {

	private String nombreReplica = "Replica2";
	private int numReplica = 2;
	private ArrayList<Usuario> usuarios = new ArrayList();
	private ArrayList<Replica_I> otrasReplicas = new ArrayList();
	private double totalDonadoCausa1 = 0;
	private double totalDonadoCausa2 = 0;
	private boolean permiteDonarCausa2 = true;

	public static void main( String[] args ) {

		// Crea e instala el gestor de seguridad
		if( System.getSecurityManager() == null )
			System.setSecurityManager( new SecurityManager() );

		try {

			String nombre = "Replica2";
			Replica_I replica = new Replica2( );
			Replica_I stub = (Replica_I) UnicastRemoteObject.exportObject( replica, 0 );

			Registry reg = LocateRegistry.createRegistry(1101);
			reg.rebind( nombre, stub );

			System.out.println( "Réplica 2 - preparada..." );

		} catch( Exception e ) {
			System.err.println( "Excepción: " + e.getMessage() );
		}

	}

	public void conectaReplicas( ) {

		try {

			otrasReplicas = new ArrayList();

			Registry reg2 = LocateRegistry.getRegistry( "localhost",1100 );
			Replica_I replica1 = (Replica_I) reg2.lookup( "Replica1" );

			Registry reg3 = LocateRegistry.getRegistry( "localhost", 1102 );
			Replica_I replica3 = (Replica_I) reg3.lookup( "Replica3" );

			otrasReplicas.add( replica1 );
			otrasReplicas.add( replica3 );

		} catch( Exception e ) {
			System.err.println( "Réplica 1 - excepción al conectar réplicas: " + e.getMessage() );
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

	public void otroDonar( double cantidad, String usuario, int numCausa ){
		
		if( numCausa == 1 )
			totalDonadoCausa1 += cantidad;
		else {
			if( permiteDonarCausa2 )
				totalDonadoCausa2 += cantidad;
			else {
				try {
					int numReplica = otrasReplicas.get(0).getNumReplica();
					int numUsuarios = otrasReplicas.get(0).getNumUsuarios();

					for( int i = 1; i < otrasReplicas.size(); i++ )
						if( numUsuarios > otrasReplicas.get(i).getNumUsuarios() ){
							numReplica = i;
							numUsuarios = otrasReplicas.get(i).getNumUsuarios();
					}

					otrasReplicas.get(numReplica).otroDonar( cantidad, usuario, numCausa );
				} catch( Exception e ){
					System.err.println( "Excepción en la donación: " + e.getMessage() );
				}
			}
		}

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				user.setHaDonado( true, numCausa );

		System.out.println( usuario + " ha donado " + cantidad + "€ a la causa " + numCausa + "." );
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

	public void donar( double cantidad, String usuario, int numCausa ) {

		if( encuentraUsuario( usuario ) ){
			
			for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				user.setHaDonado( true, numCausa );

			if( numCausa == 1 )
				totalDonadoCausa1 += cantidad;
			else {
				if( permiteDonarCausa2 )
					totalDonadoCausa2 += cantidad;
				else {
					try {

						int numReplica = otrasReplicas.get(0).getNumReplica();
						int numUsuarios = otrasReplicas.get(0).getNumUsuarios();

						for( int i = 1; i < otrasReplicas.size(); i++ )
							if( numUsuarios > otrasReplicas.get(i).getNumUsuarios() ){
								numReplica = i;
								numUsuarios = otrasReplicas.get(i).getNumUsuarios();
						}

						otrasReplicas.get(numReplica).otroDonar( cantidad, usuario, numCausa );

					} catch( Exception e ) {
						System.err.println( "Excepción en la donación: " + e.getMessage() );
					}
				}
			}

			System.out.println( usuario + " ha donado " + cantidad + "€ a la causa " + numCausa + "." );
		} else {
			try {
				boolean donado = false;

				for( Replica_I r : otrasReplicas ){
					if( !donado ) {
						if( r.encuentraUsuario( usuario ) ){
							r.otroDonar( cantidad, usuario, numCausa );
							donado = true;
						}
					}
				}

			} catch( Exception e ) {
				System.out.println( "Excepción: " + e.getMessage() );
			}
		}

	}

	public double getDonado( String usuario, int numCausa ) {

		double donado = 0;
		boolean haDonado = false;

		if( encuentraUsuario( usuario ) )
			haDonado = getUsuarioDono( usuario, numCausa );
		else {

			try {

				for( Replica_I r : otrasReplicas )
					if( r.encuentraUsuario( usuario ) )
						haDonado = r.getUsuarioDono( usuario, numCausa );

			} catch( Exception e ) {
				System.out.println( "Excepción :" + e.getMessage() );
			}

		}

		if( haDonado ) {
			donado += getTotalDonado( numCausa );

			try {

				for( Replica_I r : otrasReplicas )
					donado += r.getTotalDonado( numCausa );

			} catch( Exception e ) {
				System.out.println( "Excepción :" + e.getMessage() );
			}
		}

		return donado;
	}

	public int getNumUsuarios() {
		return usuarios.size();
	}

	public boolean getUsuarioDono( String usuario, int numCausa ){

		boolean haDonado = false;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				haDonado = user.getHaDonado( numCausa );

		return haDonado;
					
	}

	public double getTotalDonado( int numCausa ){

		if( numCausa == 1 )
			return totalDonadoCausa1;
		else if( numCausa == 2 )
			return totalDonadoCausa2;
		else
			return totalDonadoCausa1 + totalDonadoCausa2;

	}

	public int getNumReplica() {
		return numReplica;
	}

}