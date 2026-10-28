import type { Service } from './types'

/** A service card, with the connector id that the saved order refers to. */
export type Card = {
    id: string
    service: Service
}

/** Per browser: each device remembers its own order. */
const ORDER_KEY = 'hl-dashboard:card-order'

/** The saved card order as connector ids, or [] if none is saved yet. */
export function loadOrder(): string[] {
    const saved = localStorage.getItem(ORDER_KEY)
    if (saved === null) {
        return []
    }
    return JSON.parse(saved) as string[]
}

export function saveOrder(ids: string[]): void {
    localStorage.setItem(ORDER_KEY, JSON.stringify(ids))
}

/**
 * Cards in the saved order. Cards the order doesn't mention (a service added
 * later) go at the end; ids without a card (a service removed) are skipped.
 */
export function arrange(cards: Card[], order: string[]): Card[] {
    const arranged: Card[] = []
    for (const id of order) {
        const card = cards.find((c) => c.id === id)
        if (card) {
            arranged.push(card)
        }
    }
    for (const card of cards) {
        if (!order.includes(card.id)) {
            arranged.push(card)
        }
    }
    return arranged
}
