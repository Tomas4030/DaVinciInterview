/**
 * Secure API Handler
 *
 * Este módulo encapsula as chamadas seguras à API externa (MockAPI)
 * Nunca exponha credentials diretamente no cliente
 */

/**
 * Tipos de requisições seguras
 */
interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Response genérica da API
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Realiza uma chamada segura via endpoint local
 * NUNCA faz chamadas diretas ao MockAPI do cliente
 *
 * @example
 * // Cliente chama o seu próprio endpoint
 * const vagas = await secureApiCall('/api/vagas', { method: 'GET' });
 *
 * // O seu endpoint (/api/vagas) chama o MockAPI de forma segura
 */
export async function secureApiCall<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(endpoint, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}`,
        status: res.status,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[secureApiCall]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
