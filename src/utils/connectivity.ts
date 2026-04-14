/**
 * connectivity.ts – Sensor de Conectividad Real
 * Verifica acceso real a internet haciendo un fetch HEAD a google.com
 * Requisito del profesor: no depender solo de NetInfo, verificar acceso real
 * Usa exclusivamente fetch nativo (sin librerías externas de red)
 */

const CONNECTIVITY_CHECK_URL = 'https://www.google.com';
const CONNECTIVITY_TIMEOUT_MS = 5000; // 5 segundos máximo para el check

/**
 * Verifica si hay acceso real a internet haciendo un fetch HEAD a google.com
 * Retorna true si el servidor responde, false si no hay conexión
 */
export async function checkRealConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS);

    const response = await fetch(CONNECTIVITY_CHECK_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    return response.ok || response.status > 0;
  } catch {
    // Cualquier error (timeout, sin red, DNS fail) = sin internet
    return false;
  }
}

/**
 * Alias para compatibilidad
 */
export const isOnline = checkRealConnectivity;
