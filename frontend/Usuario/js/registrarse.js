document
  .getElementById("registrationForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;
    const telefono = document.getElementById("telefono").value;
    const seguridad = document.getElementById("seguridad").value;

    if (password !== password2) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    const userData = {
      username,
      email,
      password,
      telefono,
      seguridad,
    };

    try {
      const response = await fetch(
        "http://localhost:3000/usuario/registrarUsuario",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Error en la respuesta del servidor: " + response.status
        );
      }

      const data = await response.json();
      alert(data.message);
      alert(
        "Debes esperar que el administrador acepte tu solicitud de registro para ingresar al sistema. Gracias por confiar en InventoryTech!"
      );

      window.location.href = "../../../landinghome.html";
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      alert("Ocurrió un error al registrar el usuario. Intente nuevamente.");
    }
  });
