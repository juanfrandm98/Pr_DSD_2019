// Define la interfaz remota para los servidores

import java.rmi.Remote;
import java.rmi.RemoteException;

public interface Servidor_I extends Remote {

	public int login( String usuario, String contrasenia ) throws RemoteException;
	public void donar( double cantidad, String usuario, int numReplica ) throws RemoteException;
	public double getDonado( String usuario, int numReplica ) throws RemoteException;

}