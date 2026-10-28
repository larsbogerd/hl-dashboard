/**
 * Logos from the dashboard-icons set (github.com/homarr-labs/dashboard-icons),
 * loaded from its CDN. The name is the file name, which for our services is
 * the same as the connector id: 'sonarr', 'plex', ...
 */
export function iconUrl(name: string): string {
    return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${name}.svg`
}
