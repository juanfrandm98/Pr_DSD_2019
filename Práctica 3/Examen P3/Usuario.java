
public class Usuario {

	private String usuario;
	private String contrasenia;
	private boolean haDonadoCausa1;
	private boolean haDonadoCausa2;

	public Usuario( String usuario, String contrasenia ){
		this.usuario = usuario;
		this.contrasenia = contrasenia;
		haDonadoCausa1 = false;
		haDonadoCausa2 = false;
	}

	public String getUsuario() {
		return usuario;
	}

	public String getContrasenia() {
		return contrasenia;
	}

	public boolean getHaDonado( int numCausa ) {
		
		if( numCausa == 1 )
			return haDonadoCausa1;
		else if( numCausa == 2 )
			return haDonadoCausa2;
		else
			return( haDonadoCausa1 || haDonadoCausa2 );
	}

	public void setHaDonado( boolean haDonado, int numCausa ) {
		
		if( numCausa == 1 )
			haDonadoCausa1 = haDonado;
		else
			haDonadoCausa2 = haDonado;

	}

}