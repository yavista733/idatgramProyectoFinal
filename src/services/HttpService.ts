/**
 * HttpService – Cliente HTTP con fetch nativo
 * Timeout estricto de 10 segundos (requisito innegociable del profesor)
 * Estrategia Offline-First: nunca crashea por errores de red
 * NO usa Axios ni librerías externas – exclusivamente fetch + AbortController
 */

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lpfneudkpffhpbblcdjo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const BASE_URL = `${SUPABASE_URL}/rest/v1`;
const TIMEOUT_MS = 10000; // 10 segundos – requisito del profesor

/** Headers por defecto para Supabase REST API */
const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: 'return=representation',
};

/** Respuesta estandarizada del HttpService */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/** Error personalizado con información de la respuesta */
export class HttpError extends Error {
  status: number;
  data: any;
  code: string;

  constructor(message: string, status: number, data?: any, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
    this.code = code || 'HTTP_ERROR';
  }
}

/**
 * Construye la URL completa con query params
 */
function buildUrl(path: string, params?: Record<string, string | number>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

/**
 * Ejecuta un fetch con timeout estricto de 10 segundos
 * Lanza excepción si el servidor no responde en ese tiempo
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.warn(`⏱️ Timeout (10s) en ${url}`);
      throw new HttpError(
        `Timeout: el servidor no respondió en ${TIMEOUT_MS / 1000} segundos`,
        0,
        null,
        'ECONNABORTED'
      );
    }

    console.warn(`📴 Sin conexión – request a ${url} falló`);
    throw new HttpError(
      error.message || 'Error de red',
      0,
      null,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Parsea la respuesta y lanza error si no es exitosa
 */
async function parseResponse<T>(response: Response, url: string): Promise<HttpResponse<T>> {
  let data: any = null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text || null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    console.warn(`⚠️ Error ${response.status} en ${url}:`, data);
    throw new HttpError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data
    );
  }

  console.log(`✅ ${response.status} ${url}`);
  return { data, status: response.status, statusText: response.statusText };
}

// ============ MÉTODOS PÚBLICOS ============

const HttpService = {
  /**
   * GET request
   */
  async get<T = any>(
    path: string,
    options?: { params?: Record<string, string | number>; headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    const url = buildUrl(path, options?.params);
    console.log(`📤 GET ${url}`);

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: options?.headers,
    });

    return parseResponse<T>(response, url);
  },

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    options?: { params?: Record<string, string | number>; headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    const url = buildUrl(path, options?.params);
    console.log(`📤 POST ${url}`);

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: options?.headers,
    });

    return parseResponse<T>(response, url);
  },

  /**
   * PATCH request
   */
  async patch<T = any>(
    path: string,
    body?: any,
    options?: { params?: Record<string, string | number>; headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    const url = buildUrl(path, options?.params);
    console.log(`📤 PATCH ${url}`);

    const response = await fetchWithTimeout(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers: options?.headers,
    });

    return parseResponse<T>(response, url);
  },

  /**
   * DELETE request
   */
  async delete<T = any>(
    path: string,
    options?: { params?: Record<string, string | number>; headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    const url = buildUrl(path, options?.params);
    console.log(`📤 DELETE ${url}`);

    const response = await fetchWithTimeout(url, {
      method: 'DELETE',
      headers: options?.headers,
    });

    return parseResponse<T>(response, url);
  },
};

export default HttpService;
