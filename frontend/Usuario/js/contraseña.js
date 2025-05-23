let nombreUsuarioGlobal = "";

document.addEventListener("DOMContentLoaded", function () {
  const guardarUsuarioBtn = document.getElementById("guardarusuario");
  const cambiarBtn = document.getElementById("cambiar");

  if (guardarUsuarioBtn) {
    guardarUsuarioBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const seguridad = document.getElementById("seguridad").value;

      nombreUsuarioGlobal = username;

      try {
        const response = await fetch(
          "http://localhost:3000/contrasena/solicitarCodigo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, seguridad }),
          }
        );

        const data = await response.json();
        if (data.success) {
          alert(
            "Verificación exitosa. Redirigiendo para cambiar la contraseña."
          );
          window.location.href = "cambiarcontraseña.html";
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Error al solicitar código:", error);
      }
    });
  }

  if (cambiarBtn) {
    cambiarBtn.addEventListener("click", async (event) => {
      event.preventDefault();

      const nuevaContraseña = document.getElementById("nueva-contraseña").value;
      const confirmarContraseña = document.getElementById(
        "confirmar-contraseña"
      ).value;

      if (nuevaContraseña !== confirmarContraseña) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/contrasena/cambiarContrasena",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nuevaContraseña,
              username: nombreUsuarioGlobal,
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          alert("Contraseña cambiada con éxito.");
          window.location.href = "login.html";
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
      }
    });
  }
});
