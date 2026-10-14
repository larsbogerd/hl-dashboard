import Fastify from 'fastify'
import { UPSTREAMS } from './config.ts'
import { getSystemInfo, startTrueNas } from './truenas.ts'

const app = Fastify({ logger: true })

/** Link URLs for the cards. Read at runtime, so nothing is baked into the bundle. */
app.get('/api/config', () =>
    Object.fromEntries(
        Object.entries(UPSTREAMS).map(([name, upstream]) => [
            name,
            upstream.url,
        ]),
    ),
)

/** TrueNAS system stats, from the WebSocket in server/truenas.ts. Not proxied. */
app.get('/api/system', (_request, reply) => {
    const system = getSystemInfo()
    if (system === null) {
        return reply.code(503).send({ error: 'Not connected to TrueNAS yet' })
    }
    return system
})

/** /api/<service>/<path> -> that service, with its credentials attached. */
app.route({
    method: ['GET', 'POST'],
    url: '/api/:service/*',
    handler: async (request, reply) => {
        const { service } = request.params as { service: string }
        const upstream = UPSTREAMS[service]

        // request.url keeps the query string; drop our own prefix off the front.
        const path = request.url.slice(`/api/${service}`.length)

        const response = await fetch(upstream.url + path, {
            method: request.method,
            headers: upstream.headers,
            body:
                request.method === 'POST'
                    ? JSON.stringify(request.body)
                    : undefined,
        })

        return reply.code(response.status).send(await response.text())
    },
})

startTrueNas()
await app.listen({ port: 3001 })
console.log('API proxy on http://localhost:3001')
