const AUTH_SUPABASE_URL = 'https://pltwgpnqggznunmcvtad.supabase.co';
const AUTH_SUPABASE_KEY = 'sb_publishable_7W0hgCVN_CIU0MrKdXhB0w_moW0BS_S';

const AUTH_SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': AUTH_SUPABASE_KEY,
  'Authorization': `Bearer ${AUTH_SUPABASE_KEY}`
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
async function login(curpIngresada, passwordPlana) {
  // Limpieza agresiva de CURP
  const curpLimpia = curpIngresada
  .trim()
  .replace(/\s+/g, '')
  .replace(/[^A-Z0-9]/gi, '')  // ← elimina guiones, puntos, etc.
  .toUpperCase();
  
  console.log('[Auth] Intentando login con CURP:', curpLimpia);

  let usuario;
  try {
    const res = await fetch(
      `${AUTH_SUPABASE_URL}/rest/v1/usuarios?curp=eq.${encodeURIComponent(curpLimpia)}&select=curp,nombre,rol,password_hash&limit=1`,
      { 
        method: 'GET',
        headers: AUTH_SUPABASE_HEADERS 
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Auth] Error Supabase:', res.status, errorText);
      
      if (res.status === 401 || res.status === 403) {
        return { 
          success: false, 
          message: 'Error de permisos (RLS). Revisa las políticas de la tabla "usuarios"' 
        };
      }
      return { success: false, message: 'Error al conectar con el servidor' };
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      return { success: false, message: 'CURP no encontrada' };
    }

    usuario = data[0];
  } catch (error) {
    console.error('[Auth] Error de red o fetch:', error);
    return { success: false, message: 'Sin conexión al servidor. Verifica tu internet.' };
  }

  // Verificar contraseña con SHA-256
  const hashIngresado = await calcularSHA256(passwordPlana);
  if (usuario.password_hash !== hashIngresado) {
    return { success: false, message: 'Contraseña incorrecta' };
  }

  // Guardar sesión
  const sesion = {
    curp: usuario.curp,
    nombre: usuario.nombre,
    rol: usuario.rol,
    timestamp: Date.now()
  };

  localStorage.setItem('sesionGhostPrism', JSON.stringify(sesion));

  // Actualizar estado global
  state.token = `session-${Date.now()}`;
  state.user = usuario.nombre.split(' ')[0] || usuario.nombre;

  console.log('[Auth] Login exitoso para:', usuario.nombre);
  return { success: true, message: 'Bienvenido' };
}

// ─────────────────────────────────────────────
// SHA-256 (sin cambios, está bien)
// ─────────────────────────────────────────────
async function calcularSHA256(texto) {
  // Usa CryptoJS si crypto.subtle no está disponible (HTTP)
  if (crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    return CryptoJS.SHA256(texto).toString(CryptoJS.enc.Hex);
  }
}
// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────
function estaAutenticado() {
  const sesionStr = localStorage.getItem('sesionGhostPrism');
  if (!sesionStr) return false;

  try {
    const sesion = JSON.parse(sesionStr);
    const OCHO_HORAS = 8 * 60 * 60 * 1000;

    if (Date.now() - sesion.timestamp > OCHO_HORAS) {
      localStorage.removeItem('sesionGhostPrism');
      return false;
    }
    return !!sesion.curp;
  } catch (e) {
    console.error('[Auth] Error al parsear sesión:', e);
    return false;
  }
}

function obtenerUsuarioActual() {
  const sesionStr = localStorage.getItem('sesionGhostPrism');
  if (!sesionStr) return null;
  try {
    return JSON.parse(sesionStr);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
function logout() {
  localStorage.removeItem('sesionGhostPrism');
  state.token = null;
  state.user = null;
  render('login');
}

// Exponer al scope global
window.login = login;
window.logout = logout;
window.estaAutenticado = estaAutenticado;
window.obtenerUsuarioActual = obtenerUsuarioActual;