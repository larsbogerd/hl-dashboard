import Fastify from 'fastify'
import { UPSTREAMS } from './config.ts'

const app = Fastify({ logger: true })

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

await app.listen({ port: 3001 })
console.log('API proxy on http://localhost:3001')
