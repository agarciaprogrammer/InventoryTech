document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("nombreUsuario", data.nombre);

        if (data.admin) {
          window.location.href = "../../Administrador/html/administrador.html";
        } else {
          window.location.href = "home.html";
        }
      } else {
        alert(data.message || "Error en el login");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error en la conexión");
    }
  });
