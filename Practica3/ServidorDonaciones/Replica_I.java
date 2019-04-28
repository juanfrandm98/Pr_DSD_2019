// Define la interfaz remota para las réplicas

import java.rmi.Remote;
import java.rmi.RemoteException;

public interface Replica_I extends Remote {

	public void conectaReplicas( ) throws RemoteException;
	public boolean login( String usuario, String contrasenia ) throws RemoteException;
	public boolean otroLogin( String usuario, String contrasenia ) throws RemoteException; 
	public void registrar( String usuario, String contrasenia ) throws RemoteException;
	public void donar( double cantidad, String usuario ) throws RemoteException;
	public void otroDonar( double cantidad, String usuario ) throws RemoteException;
	public double getDonado( String usuario ) throws RemoteException;
	public double otroGetDonado() throws RemoteException;
	public boolean getUsuarioDono( String usuario ) throws RemoteException;
	public boolean encuentraUsuario( String usuario ) throws RemoteException;
	public int getNumUsuarios() throws RemoteException;

}