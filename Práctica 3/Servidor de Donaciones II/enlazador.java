import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

public class enlazador {
	public static void main( String args[] ){
		if (System.getSecurityManager() == null) {
	            System.setSecurityManager(new SecurityManager());
	    }

	    try {
	            Registry registry = LocateRegistry.getRegistry("localhost",1100);
	            Registry registry2 = LocateRegistry.getRegistry("localhost",1101);
	            Registry registry3 = LocateRegistry.getRegistry("localhost",1102);

	            Replica_I r1 = (Replica_I) registry.lookup( "Replica1" );
	            Replica_I r2 = (Replica_I) registry2.lookup( "Replica2" );
	            Replica_I r3 = (Replica_I) registry3.lookup( "Replica3" );

	            r1.conectaReplicas();
	            r2.conectaReplicas();
	            r3.conectaReplicas();

	            System.out.println( "Réplicas enlazadas con éxito." );

	        } catch (Exception e) {
	            System.err.println("Client exception:");
	            e.printStackTrace();
	        }
	}
}