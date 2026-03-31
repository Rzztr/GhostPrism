// ==================== control.js ====================
function renderControlView(container) {
  container.innerHTML = `
    <div class="control-panel">
      <h3>Control Remoto de Dispositivo</h3>
      <input type="text" id="mac-input" placeholder="Ingresa MAC (ej: A4:BB:6D:22:11:CC)" style="width:100%; padding:12px; margin:10px 0;">
      <button onclick="loadDeviceControl()" class="btn-primary">Cargar Dispositivo</button>
      <div id="device-control-info" style="margin-top:20px;"></div>
    </div>
  `;
}

window.loadDeviceControl = async function() {
  const mac = document.getElementById('mac-input').value.trim();
  if (!mac) return alert('Ingresa una MAC');

  const info = document.getElementById('device-control-info');
  info.innerHTML = `
    <div class="card">
      <h4>Dispositivo: ${mac}</h4>
      <p>Estado: <span class="badge danger">EN PELIGRO</span></p>
      <p>Ubicación: Estadio Jalisco - Sector C</p>
      <div style="margin-top:15px;">
        <button onclick="sendRemoteCommand('${mac}', 'locate')" class="btn-primary">📍 Ubicar</button>
        <button onclick="sendRemoteCommand('${mac}', 'lock')" class="btn-warning">🔒 Bloquear</button>
        <button onclick="sendRemoteCommand('${mac}', 'panic')" class="btn-danger">🚨 Forzar Modo Pánico</button>
      </div>
    </div>
  `;
};

window.sendRemoteCommand = async (mac, command) => {
  try {
    await sendCommand(mac, command);
    alert(`Comando "${command}" enviado a ${mac}`);
  } catch (e) {
    alert('Error al enviar comando');
  }
};