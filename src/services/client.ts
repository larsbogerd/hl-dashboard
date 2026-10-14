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
