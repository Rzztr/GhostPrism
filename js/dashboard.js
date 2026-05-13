function renderDashboardView(container) {
  // Ya no bloqueamos la vista del dashboard aunque el sistema esté bloqueado en la DB
  container.innerHTML = `
    <div class="grid">
      <div class="card">
        <h3>Incidencias Activas</h3>
        <h2 id="dash-activos-count" style="color:#da3633">-</h2>
        <small>Últimas 24 horas</small>
      </div>
      <div class="card" id="control-card">
        <h3>Control de Sistema</h3>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button id="btn-bloquear" class="btn-danger" style="margin: 0; flex: 1;">Bloquear</button>
          <button id="btn-liberar" class="btn-primary" style="margin: 0; flex: 1;">Liberar</button>
        </div>
        <p id="system-status-msg" style="font-size: 0.85rem; margin-top: 12px; font-weight: 600; text-align: center; color: var(--text-light);">
          ESTADO: <span id="system-status-value">CARGANDO...</span>
        </p>
      </div>
      <div class="card" style="display: none;">
        <h3>Dispositivos Conectados</h3>
        <h2>47</h2>
        <small>En tiempo real</small>
      </div>
    </div>

    <h3>Últimas Alertas (Activas)</h3>
    <table class="alert-table" id="alerts-table">
      <thead>
        <tr>
          <th>Hora</th>
          <th>Dispositivo</th>
          <th>Tipo</th>
          <th>Notas</th>
          <th>Ubicación</th>
          <th style="text-align: center;">Acciones</th>
        </tr>
      </thead>
      <tbody id="alerts-body">
        <tr><td colspan="6" style="text-align: center;">Cargando incidencias...</td></tr>
      </tbody>
    </table>
  `;

  const btnBloquear = document.getElementById("btn-bloquear");
  const btnLiberar = document.getElementById("btn-liberar");
  const statusValue = document.getElementById("system-status-value");

  const updateStatusUI = async () => {
    const latest = await getLatestSystemState();
    if (latest) {
      const isCurrentlyBlocked = latest.status === "bloqueado";
      statusValue.innerText = isCurrentlyBlocked ? "SISTEMA BLOQUEADO" : "SISTEMA LIBRE";
      statusValue.style.color = isCurrentlyBlocked ? "var(--danger)" : "var(--primary)";
      
      btnBloquear.disabled = isCurrentlyBlocked;
      btnLiberar.disabled = !isCurrentlyBlocked;
      btnBloquear.style.opacity = isCurrentlyBlocked ? "0.5" : "1";
      btnLiberar.style.opacity = !isCurrentlyBlocked ? "0.5" : "1";
    } else {
      statusValue.innerText = "SIN ESTADO DEFINIDO";
      statusValue.style.color = "var(--text-light)";
    }
  };

  btnBloquear.onclick = async () => {
    if (confirm("¿Está seguro de BLOQUEAR el sistema?")) {
      btnBloquear.disabled = true;
      btnBloquear.innerText = "Bloqueando...";
      try {
        await resolverEstadosPrevios();
        console.log("Insertando nuevo estado de bloqueo...");
        const res = await saveIncident({ 
            tipo: "bloqueo", 
            status: "bloqueado", 
            notas: "Sistema bloqueado desde Dashboard" 
        });
        console.log("Resultado saveIncident:", res);
        if (!res) throw new Error("Error al guardar incidencia (el servidor no devolvió datos).");
        await updateStatusUI();
        renderDashboardView(container);
      } catch (err) {
        console.error("Error al bloquear:", err);
        alert(`Error al bloquear el sistema: ${err.message}\n${JSON.stringify(err)}`);
      } finally {
        btnBloquear.disabled = false;
        btnBloquear.innerText = "Bloquear";
      }
    }
  };

  btnLiberar.onclick = async () => {
    if (confirm("¿Está seguro de LIBERAR el sistema?")) {
      btnLiberar.disabled = true;
      btnLiberar.innerText = "Liberando...";
      try {
        await resolverEstadosPrevios();
        console.log("Insertando nuevo estado de liberación...");
        const res = await saveIncident({ 
            tipo: "liberacion", 
            status: "libre", 
            notas: "Sistema liberado desde Dashboard" 
        });
        console.log("Resultado saveIncident:", res);
        if (!res) throw new Error("Error al guardar incidencia (el servidor no devolvió datos).");
        await updateStatusUI();
        renderDashboardView(container);
      } catch (err) {
        console.error("Error al liberar:", err);
        alert(`Error al liberar el sistema: ${err.message}\n${JSON.stringify(err)}`);
      } finally {
        btnLiberar.disabled = false;
        btnLiberar.innerText = "Liberar";
      }
    }
  };

  updateStatusUI();

  verIncidenciasActivas().then(incidencias => {
    const tbody = document.getElementById("alerts-body");
    const countEl = document.getElementById("dash-activos-count");
    if (!tbody || !countEl) return;
    if (!incidencias || incidencias.length === 0) {
      countEl.innerText = "0";
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay alertas activas</td></tr>`;
      return
    }
    countEl.innerText = incidencias.length;
    tbody.innerHTML = "";
    incidencias.forEach(inc => {
      const tr = document.createElement("tr");
      const time = new Date(inc.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
      const dispositivo = inc.dispositivo_id;
      let dispText = "Anónimo (Web)";
      if (dispositivo) {
        dispText = dispositivo.nombre || dispositivo.mac || "Desconocido"
      }
      
      let typeBadge = "";
      if (inc.status === "bloqueado" || inc.status === "bloqueada") {
        typeBadge = '<span class="badge danger" style="background:#ff0000; color:#fff;">BLOQUEADO</span>'
      } else if (inc.status === "libre" || inc.status === "liberada") {
        typeBadge = '<span class="badge success" style="background:#238636; color:#fff;">LIBRE</span>'
      } else if (inc.tipo === "panic") {
        typeBadge = '<span class="badge danger">PÁNICO</span>'
      } else if (inc.tipo === "disconnected") {
        typeBadge = '<span class="badge warning">DESCONECTADO</span>'
      } else if (inc.tipo === "bloqueo") {
        typeBadge = '<span class="badge danger">BLOQUEO</span>'
      } else if (inc.tipo === "liberacion") {
        typeBadge = '<span class="badge warning" style="background:#238636; color:#fff;">LIBERACIÓN</span>'
      } else {
        typeBadge = `<span class="badge warning">${inc.tipo.toUpperCase()}</span>`
      }
      
      const notasText = inc.notas || "Sin notas";
      const ubiText = inc.lat && inc.lng ? `${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}` : "Sin GPS";
      
      const isBlockedRow = inc.status === "bloqueado";
      
      tr.innerHTML = `
        <td>${time}</td>
        <td>${dispText}</td>
        <td>${typeBadge}</td>
        <td>${notasText}</td>
        <td>${ubiText}</td>
        <td style="text-align: center; display: flex; gap: 5px; justify-content: center;">
          <button class="btn-danger small-row-btn" data-id="${inc.id}" data-action="bloquear" ${isBlockedRow ? 'disabled style="opacity:0.5"' : ''} style="padding: 4px 8px; margin: 0; font-size: 0.75rem;">Bloquear</button>
          <button class="btn-primary small-row-btn" data-id="${inc.id}" data-action="liberar" ${inc.status === 'libre' ? 'disabled style="opacity:0.5"' : ''} style="padding: 4px 8px; margin: 0; font-size: 0.75rem;">Liberar</button>
        </td>
      `;
      
      for (let i = 0; i < 5; i++) {
        tr.cells[i].style.cursor = "pointer";
        tr.cells[i].onclick = () => { window.trackingAlert = true; window.navigate("map"); };
      }
      
      tbody.appendChild(tr)
    });

    tbody.querySelectorAll(".small-row-btn").forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const newStatus = action === "bloquear" ? "bloqueado" : "libre";
        
        if (confirm(`¿Está seguro de ${action.toUpperCase()} esta incidencia?`)) {
          btn.disabled = true;
          btn.innerText = "...";
          try {
            console.log(`Intentando cambiar estatus de ${id} a ${newStatus}`);
            const res = await cambiarEstatusIncidencia(id, newStatus);
            console.log("Respuesta de Supabase:", res);
            if (!res) throw new Error("La base de datos no devolvió el registro actualizado. Verifique permisos RLS.");
            renderDashboardView(container);
          } catch (err) {
            console.error(`Error al ${action} incidencia:`, err);
            alert(`Error: ${err.message}\n${JSON.stringify(err)}`);
            btn.disabled = false;
            btn.innerText = action === "bloquear" ? "Bloquear" : "Liberar";
          }
        }
      };
    });
    
  }).catch(err => {
    console.error("Error al cargar incidencias:", err);
    const alertsBody = document.getElementById("alerts-body");
    if (alertsBody) alertsBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar datos</td></tr>`;
  });
}
