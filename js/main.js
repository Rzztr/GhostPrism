// js/main.js — GhostPrism PWA
// Punto de entrada principal, manejo de vistas y navegación

const state = {
  currentView: 'login',
  user: null,
  token: null
};

const app = document.getElementById('app');

// ─────────────────────────────────────────────
// RENDER — decide qué vista mostrar
// ─────────────────────────────────────────────
function render(view) {
  state.currentView = view;

  if (view === 'login') {
    renderLogin();
  } else {
    renderDashboardLayout();
    navigate(view);
  }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function renderLogin() {
  app.innerHTML = `
    <div class="login-container">
      <h1>Ghost <span style="color:#238636">prISM</span></h1>
      <p>Estación de Operación Alfa • Mundial 2026</p>

      <!-- Formulario de login -->
      <div id="login-form-container">
        <form id="loginForm">
          <input type="text" id="curp" placeholder="CURP (18 caracteres)" maxlength="18" required>
          <input type="password" id="password" placeholder="Contraseña" required>
          <button type="submit" class="btn-primary">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  `;

  // ── Evento: submit login ──
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const curp = document.getElementById('curp').value.trim();
    const password = document.getElementById('password').value;

    if (curp.length !== 18) {
      alert('La CURP debe tener exactamente 18 caracteres');
      return;
    }

    const resultado = await login(curp, password);

    if (resultado.success) {
      render('dashboard');
    } else {
      alert(resultado.message || 'Error al iniciar sesión');
    }
  });
}

// ─────────────────────────────────────────────
// LAYOUT PRINCIPAL — sidebar + content
// ─────────────────────────────────────────────
function renderDashboardLayout() {
  app.innerHTML = `
    <div class="dashboard-wrapper">
      <aside class="sidebar">
        <div class="logo">GHOST PRISM</div>
        <nav>
          <button id="nav-dashboard" class="nav-btn active" onclick="navigate('dashboard')">Dashboard</button>
          <button id="nav-map" class="nav-btn" onclick="navigate('map')">Mapa en Tiempo Real</button>
          <button id="nav-control" class="nav-btn" onclick="navigate('control')">Control Remoto</button>
          <button id="nav-historial" class="nav-btn" onclick="navigate('historial')">Historial</button>
        </nav>
        <div class="user-info">
          <strong id="user-name">${state.user || 'Usuario'}</strong><br>
          <small>Sentinel - Operador</small>
          <button onclick="logout()" class="btn-danger small">Cerrar Sesión</button>
        </div>
      </aside>
      <main class="content">
        <header>
          <h2 id="page-title">Dashboard</h2>
        </header>
        <div id="view-content"></div>
      </main>
    </div>
  `;
}

// ─────────────────────────────────────────────
// NAVEGACIÓN — carga la vista dentro de #view-content
// ─────────────────────────────────────────────
window.navigate = function(view) {
  // Actualiza botón activo en sidebar
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const btnActivo = document.getElementById(`nav-${view}`);
  if (btnActivo) btnActivo.classList.add('active');

  const content = document.getElementById('view-content');
  if (!content) return;

  content.innerHTML = '';

  // Actualiza título del header
  const titulos = {
    dashboard: 'Dashboard',
    map: 'Mapa en Tiempo Real',
    control: 'Control Remoto',
    historial: 'Historial'
  };
  document.getElementById('page-title').textContent = titulos[view] || view;

  // Renderiza la vista correspondiente
  if (view === 'dashboard')      renderDashboardView(content);
  else if (view === 'map')       renderMapView(content);
  else if (view === 'control')   renderControlView(content);
  else if (view === 'historial') renderHistorialView(content);
  else content.innerHTML = '<p>Vista no implementada aún</p>';
};

// ─────────────────────────────────────────────
// HISTORIAL — vista básica (puedes expandirla)
// ─────────────────────────────────────────────
function renderHistorialView(container) {
  container.innerHTML = `<p style="padding:1rem;">Cargando historial...</p>`;

  verTodasIncidencias().then(data => {
    if (!data || data.length === 0) {
      container.innerHTML = '<p style="padding:1rem;">Sin registros en el historial.</p>';
      return;
    }

    container.innerHTML = `
      <h3>Historial de Incidencias</h3>
      <table class="alert-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Dispositivo</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(item => {
            const dispText = item.dispositivo_id ? (item.dispositivo_id.nombre || item.dispositivo_id.mac || 'Desconocido') : 'Anónimo (Web)';
            const ubiText = (item.lat && item.lng) ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : 'Sin datos GPS';
            const estadoBadge = item.status === 'activa' ? '<span class="badge danger">ACTIVA</span>' : '<span class="badge warning" style="background:#555; color:#fff;">RESUELTA</span>';
            const tipoBadge = item.tipo === 'panic' ? '<span class="badge danger">PÁNICO</span>' : `<span class="badge warning">${item.tipo.toUpperCase()}</span>`;
            
            return `
            <tr>
              <td>${new Date(item.created_at).toLocaleString('es-MX', { hour12: true, dateStyle: 'short', timeStyle: 'short' })}</td>
              <td>${dispText}</td>
              <td>${tipoBadge}</td>
              <td>${ubiText}</td>
              <td>${estadoBadge}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  });
}

// ─────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────
window.onload = () => {
  if (estaAutenticado()) {
    const usuario = obtenerUsuarioActual();
    if (usuario) {
      state.user = usuario.nombre.split(' ')[0] || 'Sentinel';
      render('dashboard');
    } else {
      render('login');
    }
  } else {
    render('login');
  }
};