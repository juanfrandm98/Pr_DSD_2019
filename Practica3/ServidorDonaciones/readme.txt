EJERCICIO DE: Juan Francisco Díaz Moreno
FECHA: 26/04/19
GRUPO: DSD2

Primero compilamos:
javac *.java

Luego levantamos los tres servidores:
java -cp . -Djava.rmi.java -cp . -Djava.rmi.server.codebase=file:./ -Djava.rmi.server.hostname=localhost -Djava.security.policy=server.policy Replica1
java -cp . -Djava.rmi.java -cp . -Djava.rmi.server.codebase=file:./ -Djava.rmi.server.hostname=localhost -Djava.security.policy=server.policy Replica2
java -cp . -Djava.rmi.java -cp . -Djava.rmi.server.codebase=file:./ -Djava.rmi.server.hostname=localhost -Djava.security.policy=server.policy Replica3

Ahora ejecutamos el enlazador:
java -cp . -Djava.security.policy=server.policy enlazador

Finalmente, ejecutamos los clientes que queramos:
java -cp . -Djava.security.policy=server.policy Cliente