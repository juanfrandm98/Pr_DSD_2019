#!/bin/sh -e
# ejecutar = Macro para compilación y ejecución del programa ejemplo 
# en una sola máquina Unix de nombre localhost

echo
echo "Lanzando el ligador de RMI..."
rmiregistry &

echo
echo "Compilando con javac..."
javac *.java

sleep 2

echo
echo "Lanzando el servidor"
java -cp . -Djava.rmi.server.codebase=file:./ -Djava.rmi.server.hostname=localhost -Djava.security.policy=server.policy Ejemplo &

sleep 2

echo
echo "Lanzando los clientes"
echo
java -cp . -Djava.security.policy=server.policy Cliente_Ejemplo_Multi_Threaded localhost 5
