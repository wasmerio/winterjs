import { Response } from "./response";

export interface FetchParams {
    method?: string;
    headers?: Record<string, string>;
}

export async function fetch(
    url?: string,
    params?: FetchParams,
): Promise<Response> {
    const response: RawResponse | undefined = await new Promise(
        (resolve, reject) => {
            __native_fetch(resolve, reject, url?.toString(), params || {});
        },
    );
    return new Response(response?.body, response);
}

type RawResponse = {
    body: string;
    headers: Record<string, string>;
};
