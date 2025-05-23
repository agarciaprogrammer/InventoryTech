document.addEventListener("DOMContentLoaded", async function () {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const CodBarra = urlParams.get("CodBarra");

  if (!CodBarra) {
    alert("No se ha proporcionado el código de barras del producto.");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `http://localhost:3000/productos/producto/${CodBarra}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Error al obtener los datos del producto");
    }
    const producto = await response.json();

    document.getElementById("codigo").value = producto.CodBarra;
    document.getElementById("nombre").value = producto.Producto;
    document.getElementById("marca").value = producto.Marca;
    document.getElementById("precio").value = producto.PrecioUnitario;
    document.getElementById("stock").value = producto.Stock;
    document.getElementById("vencimiento").value = producto.Vencimiento;
    document.getElementById("proveedor").value = producto.IDProveedor;
    const categoriaSelect = document.getElementById("categoria");
    categoriaSelect.value = producto.CategoriaID;
  } catch (error) {
    console.error("Error al cargar los datos del producto:", error);
  }
});

document
  .querySelector("form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const CodBarra = document.getElementById("codigo").value;
    const Producto = document.getElementById("nombre").value;
    const Marca = document.getElementById("marca").value;
    const categoriaSelect = document.getElementById("categoria");
    const CategoriaID = categoriaSelect.value;
    const Categoria =
      categoriaSelect.options[categoriaSelect.selectedIndex].text;
    const PrecioUnitario = parseFloat(document.getElementById("precio").value);
    const Stock = parseInt(document.getElementById("stock").value, 10);
    const Vencimiento = document.getElementById("vencimiento").value;
    const IDProveedor = document.getElementById("proveedor").value;

    const producto = {
      CodBarra,
      Producto,
      Marca,
      Categoria,
      PrecioUnitario,
      Stock,
      Vencimiento,
      IDProveedor,
      CategoriaID,
    };

    console.log(CodBarra, Categoria, CategoriaID);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:3000/productos/modificarProducto`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(producto),
        }
      );

      if (!response.ok) {
        throw new Error("Error al modificar el producto");
      }

      alert("Producto modificado con éxito");
      window.location.href = "stock.html";
    } catch (error) {
      console.error("Error al modificar el producto:", error);
    }
  });
