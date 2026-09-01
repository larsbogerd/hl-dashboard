/** GET a JSON endpoint through the dev proxy, throwing on non-2xx. */
export async function get<T>(path: string): Promise<T> {
    const res = await fetch(path)
    if (!res.ok) throw new Error(`${path} responded ${res.status}`)
    return res.json() as Promise<T>
}

export async function getText(path: string): Promise<string> {
    const res = await fetch(path)
    if (!res.ok) throw new Error(`${path} responded ${res.status}`)
    return res.text()
}

/** POST JSON and parse the JSON response. */
export async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`${path} responded ${res.status}`)
    return res.json() as Promise<T>
}
