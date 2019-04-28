
public class Usuario {

	private String usuario;
	private String contrasenia;
	private boolean haDonado;

	public Usuario( String usuario, String contrasenia ){
		this.usuario = usuario;
		this.contrasenia = contrasenia;
	}

	public String getUsuario() {
		return usuario;
	}

	public String getContrasenia() {
		return contrasenia;
	}

	public boolean getHaDonado() {
		return haDonado;
	}

	public void setHaDonado( boolean haDonado ) {
		this.haDonado = haDonado;
	}

}