function renderDashboardView(container) {
  container.innerHTML = `
    <div class="grid">
      <div class="card">
        <h3>Incidencias Activas</h3>
        <h2 id="dash-activos-count" style="color:#da3633">-</h2>
        <small>Últimas 24 horas</small>
      </div>
      <div class="card" style="display: none;">
        <h3>Dispositivos Conectados</h3>
        <h2>47</h2>
        <small>En tiempo real</small>
      </div>
      <div class="card" style="display: none;">
        <h3>Último Botón de Pánico</h3>
        <p><strong>MAC: A4:BB:6D:22:11:CC</strong><br>14:32 - Estadio Jalisco</p>
      </div>
    </div>

    <h3>Últimas Alertas (Activas)</h3>
    <table class="alert-table">
      <thead><tr><th>Hora</th><th>Dispositivo</th><th>Tipo</th><th>Notas</th><th>Ubicación</th></tr></thead>
      <tbody id="alerts-body">
        <tr><td colspan="5" style="text-align: center;">Cargando incidencias...</td></tr>
      </tbody>
    </table>
  `;

  verIncidenciasActivas().then(incidencias => {
    const tbody = document.getElementById('alerts-body');
    const countEl = document.getElementById('dash-activos-count');

    if (!incidencias || incidencias.length === 0) {
      countEl.innerText = "0";
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay alertas activas</td></tr>`;
      return;
    }

    countEl.innerText = incidencias.length;
    tbody.innerHTML = '';

    incidencias.forEach(inc => {
      const tr = document.createElement('tr');
      const time = new Date(inc.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      
      const dispositivo = inc.dispositivo_id;
      let dispText = "Anónimo (Web)";
      if (dispositivo) {
        dispText = dispositivo.nombre || dispositivo.mac || 'Desconocido';
      }

      let typeBadge = '';
      if (inc.tipo === 'panic') {
        typeBadge = '<span class="badge danger">PÁNICO</span>';
      } else if (inc.tipo === 'disconnected') {
        typeBadge = '<span class="badge warning">DESCONECTADO</span>';
      } else {
        typeBadge = `<span class="badge warning">${inc.tipo.toUpperCase()}</span>`;
      }

      const notasText = inc.notas || 'Sin notas';
      const ubiText = (inc.lat && inc.lng) ? `${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}` : 'Sin GPS';

      tr.innerHTML = `
        <td>${time}</td>
        <td>${dispText}</td>
        <td>${typeBadge}</td>
        <td>${notasText}</td>
        <td>${ubiText}</td>
      `;
      tbody.appendChild(tr);
    });
  }).catch(err => {
    console.error('Error al cargar incidencias:', err);
    document.getElementById('alerts-body').innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar datos</td></tr>`;
  });
}