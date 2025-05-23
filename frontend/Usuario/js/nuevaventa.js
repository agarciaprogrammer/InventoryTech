document.addEventListener("DOMContentLoaded", () => {
  const productoInput = document.getElementById("producto");
  const cantidadInput = document.getElementById("cantidad");
  const agregarBtn = document.querySelector(".agregar-btn");
  const listaProductos = document.querySelector(".producto-lista");
  const sugerenciasDiv = document.getElementById("sugerencias");
  const finalizarBtn = document.querySelector(".finalizar-btn");

  let carrito = [];
  let selectedProduct = null;
  let debounceTimeout;

  async function buscarProductos(query) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/ventas/buscarProductos?query=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const productos = await response.json();
      mostrarSugerencias(productos);
    } catch (error) {
      console.error("Error buscando productos:", error);
    }
  }

  function mostrarSugerencias(productos) {
    sugerenciasDiv.innerHTML = "";
    productos.slice(0, 5).forEach((producto) => {
      const productoDiv = document.createElement("div");
      productoDiv.classList.add("producto-sugerido");
      productoDiv.textContent = producto.Producto;
      productoDiv.addEventListener("click", () =>
        seleccionarProducto(producto)
      );
      sugerenciasDiv.appendChild(productoDiv);
    });
  }

  function seleccionarProducto(producto) {
    selectedProduct = producto;
    productoInput.value = producto.Producto;
    sugerenciasDiv.innerHTML = "";
  }

  function actualizarCarrito() {
    listaProductos.innerHTML = "";
    const tabla = document.createElement("table");
    tabla.innerHTML = `
      <tr>
        <th>CodBarra</th>
        <th>Producto</th>
        <th>Marca</th>
        <th>Stock</th>
        <th>PrecioUnitario</th>
        <th>Vencimiento</th>
        <th>Cantidad</th>
      </tr>
    `;
    carrito.forEach((item) => {
      const row = document.createElement("tr");
      [
        "CodBarra",
        "Producto",
        "Marca",
        "Stock",
        "PrecioUnitario",
        "Vencimiento",
      ].forEach((key) => {
        const td = document.createElement("td");
        td.textContent = item[key];
        row.appendChild(td);
      });
      const cantidadTd = document.createElement("td");
      cantidadTd.textContent = item.cantidad;
      row.appendChild(cantidadTd);
      tabla.appendChild(row);
    });
    listaProductos.appendChild(tabla);
  }

  agregarBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const cantidad = parseInt(cantidadInput.value, 10);

    if (!selectedProduct) {
      alert("Selecciona un producto de las sugerencias.");
      return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      alert("Ingresa un valor.");
      return;
    }
    if (cantidad > selectedProduct.Stock) {
      alert(`La cantidad excede el stock de: ${selectedProduct.Stock}.`);
      return;
    }
    const productoExistente = carrito.find(
      (item) => item.CodBarra === selectedProduct.CodBarra
    );
    if (productoExistente) {
      alert("El producto ya está en el carrito.");
      return;
    }

    for (let key in selectedProduct) {
      console.log(key + ": " + selectedProduct[key]);
    }

    carrito.push({ ...selectedProduct, cantidad });
    productoInput.value = "";
    cantidadInput.value = "";
    selectedProduct = null;
    actualizarCarrito();
  });

  productoInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    const query = productoInput.value;
    if (query.length > 0) {
      debounceTimeout = setTimeout(() => buscarProductos(query), 300);
    } else {
      sugerenciasDiv.innerHTML = "";
    }
  });

  finalizarBtn.addEventListener("click", async () => {
    if (carrito.length === 0) {
      alert(
        "El carrito está vacio. Agregue productos antes de terminar la venta."
      );
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/ventas/finalizarVenta",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ carrito }),
        }
      );
      const data = await response.json();
      if (data.message) {
        alert(data.message);
        carrito = [];
        actualizarCarrito();
      } else {
        alert("Error finalizando la venta.");
      }
    } catch (error) {
      console.error("Error finalizando la venta:", error);
    }
  });
});
