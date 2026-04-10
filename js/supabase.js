const SUPABASE_URL = "https://pltwgpnqggznunmcvtad.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7W0hgCVN_CIU0MrKdXhB0w_moW0BS_S";
const HEADERS = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};
async function sbFetch(endpoint, options = {}) {
  const { extraHeaders: extraHeaders, ...fetchOptions } = options;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      headers: { ...HEADERS, ...extraHeaders },
      ...fetchOptions,
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.error(
        `[Supabase] Error ${res.status} en /${endpoint}:`,
        errorBody,
      );
      return { data: null, error: errorBody };
    }
    if (res.status === 204) return { data: null, error: null };
    const data = await res.json();
    return { data: data, error: null };
  } catch (err) {
    console.error("[Supabase] Error de red:", err);
    return { data: null, error: err };
  }
}
async function verTodosDispositivos() {
  const { data: data, error: error } = await sbFetch(
    "dispositivos?select=id,mac,nombre,propietario,status,lat,lng,ultima_conexion&order=created_at.desc",
  );
  if (error) {
    console.error("[Supabase] verTodosDispositivos:", error);
    return null;
  }
  return data;
}
async function verActivos() {
  const { data: data, error: error } = await sbFetch(
    "dispositivos?select=*&status=eq.active&order=ultima_conexion.desc",
  );
  if (error) {
    console.error("[Supabase] verActivos:", error);
    return null;
  }
  return data;
}
async function verDataCelular() {
  const { data: data, error: error } = await sbFetch(
    "dispositivos?select=*&tipo=eq.mobile&order=ultima_conexion.desc",
  );
  if (error) {
    console.error("[Supabase] verDataCelular:", error);
    return null;
  }
  return data;
}
async function buscarPorMAC(mac) {
  if (!mac) return null;
  const { data: data, error: error } = await sbFetch(
    `dispositivos?mac=eq.${encodeURIComponent(mac)}&select=*&limit=1`,
  );
  if (error) {
    console.error("[Supabase] buscarPorMAC:", error);
    return null;
  }
  return data?.[0] || null;
}
async function actualizarUbicacion(mac, lat, lng) {
  if (!mac || lat == null || lng == null) return null;
  const { data: data, error: error } = await sbFetch(
    `dispositivos?mac=eq.${encodeURIComponent(mac)}`,
    {
      method: "PATCH",
      extraHeaders: { Prefer: "return=representation" },
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        ultima_conexion: new Date().toISOString(),
      }),
    },
  );
  if (error) {
    console.error("[Supabase] actualizarUbicacion:", error);
    return null;
  }
  return data;
}
async function saveIncident(incident) {
  if (!incident?.tipo) {
    console.warn("[Supabase] saveIncident: datos incompletos", incident);
    return null;
  }
  const { data: data, error: error } = await sbFetch("incidencias", {
    method: "POST",
    extraHeaders: { Prefer: "return=representation" },
    body: JSON.stringify({
      tipo: incident.tipo,
      status: "activa",
      lat: incident.lat ?? null,
      lng: incident.lng ?? null,
      notas: incident.notas ?? null,
    }),
  });
  if (error) {
    console.error("[Supabase] saveIncident:", error);
    return null;
  }
  console.log("[Supabase] Incidencia guardada:", data);
  return data;
}
async function verTodasIncidencias() {
  const { data: data, error: error } = await sbFetch(
    "incidencias?select=id,tipo,status,lat,lng,notas,created_at&order=created_at.desc&limit=100",
  );
  if (error) {
    console.error("[Supabase] verTodasIncidencias:", error);
    return null;
  }
  return data;
}
async function verIncidenciasActivas() {
  const { data: data, error: error } = await sbFetch(
    "incidencias?select=id,tipo,status,lat,lng,notas,created_at&status=eq.activa&order=created_at.desc",
  );
  if (error) {
    console.error("[Supabase] verIncidenciasActivas:", error);
    return null;
  }
  return data;
}
async function resolverIncidencia(id) {
  if (!id) return null;
  const { data: data, error: error } = await sbFetch(
    `incidencias?id=eq.${id}`,
    {
      method: "PATCH",
      extraHeaders: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "resuelta" }),
    },
  );
  if (error) {
    console.error("[Supabase] resolverIncidencia:", error);
    return null;
  }
  return data;
}
async function verHistorial() {
  const { data: data, error: error } = await sbFetch(
    "historial?select=id,accion,detalle,created_at,dispositivo_id(mac,nombre),usuario_id(nombre)&order=created_at.desc&limit=100",
  );
  if (error) {
    console.error("[Supabase] verHistorial:", error);
    return null;
  }
  return data;
}
async function verHistorialPorMAC(mac) {
  if (!mac) return null;
  const dispositivo = await buscarPorMAC(mac);
  if (!dispositivo) return null;
  const { data: data, error: error } = await sbFetch(
    `historial?dispositivo_id=eq.${dispositivo.id}&select=*&order=created_at.desc`,
  );
  if (error) {
    console.error("[Supabase] verHistorialPorMAC:", error);
    return null;
  }
  return data;
}
async function registrarAccion(accion) {
  if (!accion?.mac || !accion?.accion) {
    console.warn("[Supabase] registrarAccion: datos incompletos", accion);
    return null;
  }
  const dispositivo = await buscarPorMAC(accion.mac);
  const sesion = obtenerUsuarioActual();
  const { data: data, error: error } = await sbFetch("historial", {
    method: "POST",
    extraHeaders: { Prefer: "return=representation" },
    body: JSON.stringify({
      dispositivo_id: dispositivo?.id ?? null,
      usuario_id: sesion ? await _getUsuarioId(sesion.curp) : null,
      accion: accion.accion,
      detalle: accion.detalle ?? null,
    }),
  });
  if (error) {
    console.error("[Supabase] registrarAccion:", error);
    return null;
  }
  return data;
}
async function _getUsuarioId(curp) {
  const { data: data } = await sbFetch(
    `usuarios?curp=eq.${encodeURIComponent(curp)}&select=id&limit=1`,
  );
  return data?.[0]?.id ?? null;
}
window.verTodosDispositivos = verTodosDispositivos;
window.verActivos = verActivos;
window.verDataCelular = verDataCelular;
window.buscarPorMAC = buscarPorMAC;
window.actualizarUbicacion = actualizarUbicacion;
window.saveIncident = saveIncident;
window.verTodasIncidencias = verTodasIncidencias;
window.verIncidenciasActivas = verIncidenciasActivas;
window.resolverIncidencia = resolverIncidencia;
window.verHistorial = verHistorial;
window.verHistorialPorMAC = verHistorialPorMAC;
window.registrarAccion = registrarAccion;
