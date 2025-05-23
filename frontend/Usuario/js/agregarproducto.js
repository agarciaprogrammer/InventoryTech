document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const Producto = document.getElementById("nombre").value;
    const Marca = document.getElementById("marca").value;

    const categoriaSelect = document.getElementById("categoria");
    const CategoriaID = categoriaSelect.value;
    const Categoria =
      categoriaSelect.options[categoriaSelect.selectedIndex].text;

    const PrecioUnitario = parseFloat(document.getElementById("precio").value);
    const Stock = parseInt(document.getElementById("stock").value, 10);
    const CodBarra = document.getElementById("codigo").value;
    const Vencimiento = document.getElementById("vencimiento").value;
    const IDProveedor = document.getElementById("proveedor").value;
    const LimiteStock = 1000;

    const producto = {
      CodBarra,
      Producto,
      Marca,
      Categoria,
      PrecioUnitario,
      Stock,
      Vencimiento,
      IDProveedor,
      LimiteStock,
      CategoriaID,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/productos/agregarProducto",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(producto),
        }
      );

      if (!response.ok) {
        throw new Error("Error al agregar el producto");
      }

      const result = await response.json();
      alert("Producto agregado con éxito");

      window.location.href = "stock.html";
    } catch (error) {
      console.error("Error al agregar el producto:", error);
    }
  });
});
