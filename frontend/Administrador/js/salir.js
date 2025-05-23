document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector("a[href='/landinghome.html']");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      localStorage.removeItem("token");
      localStorage.removeItem("nombreUsuario");
      window.location.href = "/landinghome.html";
    });
  }
});
