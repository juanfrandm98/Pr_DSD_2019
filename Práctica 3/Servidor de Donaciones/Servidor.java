// Código del servidor

import java.rmi.*;
import java.rmi.server.UnicastRemoteObject;
import java.util.ArrayList;
import java.rmi.Remote;
import java.rmi.RemoteException;

public class Servidor extends UnicastRemoteObject implements Servidor_I {

	private ArrayList<Replica> replicas;

	public Servidor( int numReplicas ) throws RemoteException {

		replicas = new ArrayList();

		for( int i = 0; i < numReplicas; i++ )
			replicas.add( new Replica(i) );

		for( Replica replica1 : replicas )
			for( Replica replica2 : replicas )
				if( !replica1.equals( replica2 ) )
					replica1.addReplica( replica2 );

	}

	private int localizarUsuario( String usuario ) {

		int numReplica = -1;

		for( Replica replica : replicas )
			if( replica.encuentraUsuario( usuario ) )
				numReplica = replica.getNumReplica();

		return numReplica;

	}

	private int seleccionarReplica() {

		int numReplica = 0;
		int numUsuarios = replicas.get(0).getNumUsuarios();

		for( Replica replica : replicas )
			if( numUsuarios > replica.getNumUsuarios() )
				numReplica = replica.getNumReplica();

		return numReplica;

	}

	public int login( String usuario, String contrasenia ) throws RemoteException {

		int numReplica = localizarUsuario( usuario );

		if( numReplica == -1 ) {
			// Usuario no registrado, procede a hacerlo
			numReplica = seleccionarReplica();
			replicas.get( numReplica ).registrar( usuario, contrasenia );
		} else {
			// Usuario registrado, comprueba contraseña
			boolean correcto = replicas.get( numReplica ).login( usuario, contrasenia );
			if( !correcto )
				numReplica = -1;
		}

		return numReplica;

	}

	public void donar( double cantidad, String usuario, int numReplica ) throws RemoteException {
		replicas.get( numReplica ).donar( cantidad, usuario );
	}

	public double getDonado( String usuario, int numReplica ) throws RemoteException {
		return replicas.get( numReplica ).getDonado( usuario );
	}

}