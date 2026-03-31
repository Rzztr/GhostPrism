// ==================== map.js ====================
let map;

function renderMapView(container) {
  container.innerHTML = `
    <div id="map" class="map-container"></div>
    <div class="map-legend">
      <span class="legend-item"><span class="dot red"></span> Botón de Pánico</span>
      <span class="legend-item"><span class="dot green"></span> Normal</span>
    </div>
  `;

  setTimeout(initMap, 100);
}

function initMap() {
  map = L.map('map').setView([21.8818, -102.2825], 13); // Aguascalientes

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Marcadores mock
  const panicMarker = L.marker([21.885, -102.275]).addTo(map)
    .bindPopup('<b>BOTÓN DE PÁNICO ACTIVADO</b><br>MAC: A4:BB:6D:22:11:CC<br>14:32');
  panicMarker._icon.style.filter = 'hue-rotate(330deg)';

  L.marker([21.878, -102.290]).addTo(map)
    .bindPopup('Dispositivo normal - Estadio');
}