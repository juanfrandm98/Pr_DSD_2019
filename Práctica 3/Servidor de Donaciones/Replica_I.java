// Define la interfaz remota para las réplicas

import java.rmi.Remote;
import java.rmi.RemoteException;

public interface Replica_I extends Remote {

	public boolean login( String usuario, String contrasenia ) throws RemoteException;
	public void donar( double cantidad, String usuario ) throws RemoteException;
	public double getDonado( String usuario ) throws RemoteException;

}