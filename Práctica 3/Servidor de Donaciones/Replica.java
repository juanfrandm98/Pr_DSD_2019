// Código de una réplica

import java.rmi.*;
import java.rmi.server.UnicastRemoteObject;
import java.util.ArrayList;

public class Replica implements Replica_I, Runnable {

	private int numReplica;
	private ArrayList<Usuario> usuarios;
	private ArrayList<Replica> otrasReplicas;
	private double totalDonado;

	public Replica( int numReplica ) {

		this.numReplica = numReplica;
		usuarios = new ArrayList();
		otrasReplicas = new ArrayList();
		totalDonado = 0;

	}

	public void addReplica( Replica replica ){
		otrasReplicas.add( replica );
	}

	public boolean encuentraUsuario( String usuario ) {

		boolean encontrado = false;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				encontrado = true;

		return encontrado;

	}

	public void registrar( String usuario, String contrasenia ){
		usuarios.add( new Usuario( usuario, contrasenia ) );

		System.out.println( "Usuario registrado en el servidor número " + numReplica );
	}

	public boolean login( String usuario, String contrasenia ){

		boolean correcto = false;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				if( user.getContrasenia().equals( contrasenia ) )
					correcto = true;

		if( correcto )
			System.out.println( "Usuario logueado en el servidor número " + numReplica );

		return correcto;
	}

	public void donar( double cantidad, String usuario ) {

		totalDonado += cantidad;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				user.setHaDonado(true);

		System.out.println( usuario + " ha hecho una donación de " + cantidad + "€." );

	}

	public int getNumReplica() {
		return numReplica;
	}

	public int getNumUsuarios() {
		return usuarios.size();
	}

	public double getDonado( String usuario ) {

		double donado = 0;

		for( Usuario user : usuarios )
			if( user.getUsuario().equals( usuario ) )
				if( user.getHaDonado() == true ){
					donado += totalDonado;

					for( Replica replica : otrasReplicas )
						donado += replica.totalDonado;

				}

		return donado;
	}

	@Override
	public void run() {

	}

}