let map;
let markerLayer;
let mapUpdateInterval = null;

function renderMapView(container) {
  container.innerHTML = `
    <div id="map" class="map-container"></div>
  `;
  setTimeout(initMap, 100);
}

function initMap() {
  map = L.map("map").setView([21.8818, -102.2825], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  cargarMarcadoresDinámicos(true);

  if (window.mapUpdateInterval) {
      clearInterval(window.mapUpdateInterval);
  }

  if (window.trackingAlert) {
      window.mapUpdateInterval = setInterval(() => cargarMarcadoresDinámicos(false), 500);
  }
}

async function cargarMarcadoresDinámicos(fitBounds = true) {
  try {
    const incidencias = await window.verIncidenciasActivas();
    const bounds = [];
    
    if (markerLayer) {
        markerLayer.clearLayers();
    }

    if (incidencias && incidencias.length > 0) {
      incidencias.forEach(inc => {
        if (inc.lat && inc.lng) {
          const lat = parseFloat(inc.lat);
          const lng = parseFloat(inc.lng);
          const time = new Date(inc.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
          const typeText = inc.tipo === "panic" ? "PÁNICO" : inc.tipo.toUpperCase();
          const notas = inc.notas || "Sin notas";
          const popupContent = `<b>ALERTA DE ${typeText}</b><br>Hora: ${time}<br>Notas: ${notas}`;
          
          const marker = L.marker([lat, lng]).addTo(markerLayer).bindPopup(popupContent);
          
          if (marker._icon) {
            marker._icon.style.filter = "hue-rotate(330deg)";
          } else {
            marker.on("add", function () {
              if (marker._icon) marker._icon.style.filter = "hue-rotate(330deg)";
            });
          }

          marker.on('click', () => {
              if (!window.mapUpdateInterval) {
                  window.trackingAlert = true;
                  window.mapUpdateInterval = setInterval(() => cargarMarcadoresDinámicos(false), 500);
              }
          });

          bounds.push([lat, lng]);
        }
      });
      if (bounds.length > 0 && fitBounds) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  } catch (err) {
    console.error("Error al cargar marcadores en el mapa:", err);
  }
}
