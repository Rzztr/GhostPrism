const state = { currentView: "login", user: null, token: null };
const app = document.getElementById("app");
function render(view) {
  state.currentView = view;
  if (view === "login") {
    renderLogin();
  } else {
    renderDashboardLayout();
    navigate(view);
  }
}
function renderLogin() {
  app.innerHTML = `\n    <div class="login-container">\n      <h1>Ghost <span style="color:#238636">prISM</span></h1>\n      <p>Estación de Operación Alfa • Mundial 2026</p>\n\n      \x3c!-- Formulario de login --\x3e\n      <div id="login-form-container">\n        <form id="loginForm">\n          <input type="text" id="curp" placeholder="CURP (18 caracteres)" maxlength="18" required>\n          <input type="password" id="password" placeholder="Contraseña" required>\n          <button type="submit" class="btn-primary">Iniciar Sesión</button>\n        </form>\n      </div>\n    </div>\n  `;
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const curp = document.getElementById("curp").value.trim();
    const password = document.getElementById("password").value;
    if (curp.length !== 18) {
      alert("La CURP debe tener exactamente 18 caracteres");
      return;
    }
    const resultado = await login(curp, password);
    if (resultado.success) {
      render("dashboard");
    } else {
      alert(resultado.message || "Error al iniciar sesión");
    }
  });
}
function renderDashboardLayout() {
  app.innerHTML = `\n    <div class="dashboard-wrapper">\n      <aside class="sidebar">\n        <div class="logo">GHOST PRISM</div>\n        <nav>\n          <button id="nav-dashboard" class="nav-btn active" onclick="navigate('dashboard')">Dashboard</button>\n          <button id="nav-map" class="nav-btn" onclick="navigate('map')">Mapa en Tiempo Real</button>\n          <button id="nav-historial" class="nav-btn" onclick="navigate('historial')">Historial</button>\n        </nav>\n        <div class="user-info">\n          <strong id="user-name">${state.user || "Usuario"}</strong><br>\n          <small>Sentinel - Operador</small>\n          <button onclick="logout()" class="btn-danger small">Cerrar Sesión</button>\n        </div>\n      </aside>\n      <main class="content">\n        <header>\n          <h2 id="page-title">Dashboard</h2>\n        </header>\n        <div id="view-content"></div>\n      </main>\n    </div>\n  `;
}
window.navigate = function (view) {
  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const btnActivo = document.getElementById(`nav-${view}`);
  if (btnActivo) btnActivo.classList.add("active");
  const content = document.getElementById("view-content");
  if (!content) return;
  content.innerHTML = "";
  const titulos = {
    dashboard: "Dashboard",
    map: "Mapa en Tiempo Real",
    historial: "Historial",
  };
  document.getElementById("page-title").textContent = titulos[view] || view;
  if (view === "dashboard") renderDashboardView(content);
  else if (view === "map") renderMapView(content);
  else if (view === "historial") renderHistorialView(content);
  else content.innerHTML = "<p>Vista no implementada aún</p>";
};
function renderHistorialView(container) {
  container.innerHTML = `<p style="padding:1rem;">Cargando historial...</p>`;
  verTodasIncidencias().then((data) => {
    if (!data || data.length === 0) {
      container.innerHTML =
        '<p style="padding:1rem;">Sin registros en el historial.</p>';
      return;
    }
    container.innerHTML = `\n      <h3>Historial de Incidencias</h3>\n      <table class="alert-table">\n        <thead>\n          <tr>\n            <th>Fecha</th>\n            <th>Dispositivo</th>\n            <th>Tipo</th>\n            <th>Ubicación</th>\n            <th>Estado</th>\n          </tr>\n        </thead>\n        <tbody>\n          ${data
      .map((item) => {
        const dispText = item.dispositivo_id
          ? item.dispositivo_id.nombre ||
            item.dispositivo_id.mac ||
            "Desconocido"
          : "Anónimo (Web)";
        const ubiText =
          item.lat && item.lng
            ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`
            : "Sin datos GPS";
        const estadoBadge =
          item.status === "activa"
            ? '<span class="badge danger">ACTIVA</span>'
            : '<span class="badge warning" style="background:#555; color:#fff;">RESUELTA</span>';
        const tipoBadge =
          item.tipo === "panic"
            ? '<span class="badge danger">PÁNICO</span>'
            : `<span class="badge warning">${item.tipo.toUpperCase()}</span>`;
        return `\n            <tr>\n              <td>${new Date(item.created_at).toLocaleString("es-MX", { hour12: true, dateStyle: "short", timeStyle: "short" })}</td>\n              <td>${dispText}</td>\n              <td>${tipoBadge}</td>\n              <td>${ubiText}</td>\n              <td>${estadoBadge}</td>\n            </tr>\n            `;
      })
      .join("")}\n        </tbody>\n      </table>\n    `;
  });
}
window.onload = () => {
  if (estaAutenticado()) {
    const usuario = obtenerUsuarioActual();
    if (usuario) {
      state.user = usuario.nombre.split(" ")[0] || "Sentinel";
      render("dashboard");
    } else {
      render("login");
    }
  } else {
    render("login");
  }
};
