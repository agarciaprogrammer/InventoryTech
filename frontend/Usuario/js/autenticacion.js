export async function verificarAutenticacion() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("No estás autenticado. Redirigiendo a la página de inicio...");
    window.location.href = "../../../landinghome.html";
    return false;
  }

  try {
    const response = await fetch("http://localhost:3000/verificar", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      alert(
        "Token inválido o sesión expirada. Redirigiendo a la página de inicio..."
      );
      window.location.href = "../../../landinghome.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error en la verificación de autenticación:", error);
    alert("Error en la conexión. Redirigiendo a la página de inicio...");
    window.location.href = "../../../landinghome.html";
    return false;
  }
}
