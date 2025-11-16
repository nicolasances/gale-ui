export type ApiName = 'gale-broker' | 'auth'
export interface ApiEndpoint { name: ApiName, endpoint: string }
 
const ApiEndpoints = new Map<ApiName, string>();
ApiEndpoints.set("auth", String(process.env.NEXT_PUBLIC_AUTH_API_ENDPOINT))
ApiEndpoints.set("gale-broker", String(process.env.NEXT_PUBLIC_GALE_BROKER_API_ENDPOINT))

export function endpoint(api: ApiName) {
    return ApiEndpoints.get(api)
}

export const APP_VERSION = "0.1.0"
