# hl-dashboard

One page for a self-hosted homelab, for seeing everything at a glance instead of opening multiple tabs. 
Pulls live data from -arr apps plus a system panel for the NAS itself: CPU, memory, network and
per-pool storage. 

Runs locally on a NAS. Personal project, built to get properly familiar with React and TypeScript.

### Stack

- React 19 + TypeScript, built with Vite
- TanStack Query for polling and caching
- Fastify back-end holding the API keys


```bash
npm run dev:server   # API proxy on :3001
npm run dev          # front-end on :5173
```
