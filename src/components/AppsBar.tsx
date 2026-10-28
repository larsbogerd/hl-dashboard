import type { ReactNode } from 'react'

type Props = {
    online: number
    total: number
    editing: boolean
    onEditingChange: (editing: boolean) => void
    /** Name of the card being moved with the keyboard, if one is. */
    keyboardMove: string | null
}

/** The strip between TrueNAS and the cards: a count, or how to move cards. */
export function AppsBar({
    online,
    total,
    editing,
    onEditingChange,
    keyboardMove,
}: Props) {
    let text: ReactNode = `${online} of ${total} up`
    if (keyboardMove) {
        text = `Moving ${keyboardMove}. Arrow keys move it, Space drops it, Escape puts it back.`
    } else if (editing) {
        // CSS shows one of the two, depending on mouse or touch screen.
        text = (
            <>
                <span className="hint-pointer">
                    Drag a card to move it, or Tab to one and press Space.
                </span>
                <span className="hint-touch">
                    Press and hold a card, then drag it.
                </span>
            </>
        )
    }

    return (
        <div className={editing ? 'apps-bar apps-bar--editing' : 'apps-bar'}>
            <h2 className="apps-bar__title">Apps</h2>
            <p className="apps-bar__text">{text}</p>
            <button
                type="button"
                className={editing ? 'button button--on' : 'button'}
                aria-pressed={editing}
                onClick={() => onEditingChange(!editing)}
            >
                {editing ? 'Done' : 'Edit layout'}
            </button>
        </div>
    )
}
