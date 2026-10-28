import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { Card } from '../layout'
import { AppsBar } from './AppsBar'
import { ServiceCard } from './ServiceCard'

type Props = {
    /** Already in the order they should show. */
    cards: Card[]
    /** Cards only move while this is on. */
    editing: boolean
    onEditingChange: (editing: boolean) => void
    /** Called after a drop with every card id, in the new order. */
    onReorder: (ids: string[]) => void
}

/** Cards slide into place with a small overshoot: the "bubbly" part. */
const SPRING = {
    duration: 320,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

export function CardGrid({
    cards,
    editing,
    onEditingChange,
    onReorder,
}: Props) {
    // Name of the card being moved with the keyboard. Mouse and touch show
    // the card following the pointer; the keyboard needs the keys spelled out.
    const [keyboardMove, setKeyboardMove] = useState<string | null>(null)

    const sensors = useSensors(
        // Mouse: a drag starts after moving 5px, so a click stays a click.
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        // Touch: press and hold first, so a swipe still scrolls the page.
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 8 },
        }),
        // Keyboard: Space picks a card up, arrow keys move it, Space drops.
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    const ids: string[] = []
    let online = 0
    for (const card of cards) {
        ids.push(card.id)
        if (card.service.status === 'online') {
            online++
        }
    }

    function handleDragStart(event: DragStartEvent) {
        if (event.activatorEvent instanceof KeyboardEvent) {
            const card = cards.find((c) => c.id === event.active.id)
            setKeyboardMove(card ? card.service.name : null)
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        setKeyboardMove(null)
        const { active, over } = event
        // Dropped outside the grid, or back where it started.
        if (!over || active.id === over.id) {
            return
        }
        const from = ids.indexOf(String(active.id))
        const to = ids.indexOf(String(over.id))
        onReorder(arrayMove(ids, from, to))
    }

    return (
        <>
            <AppsBar
                online={online}
                total={cards.length}
                editing={editing}
                onEditingChange={onEditingChange}
                keyboardMove={keyboardMove}
            />
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setKeyboardMove(null)}
            >
                <SortableContext items={ids} strategy={rectSortingStrategy}>
                    <section className="grid" aria-label="Services">
                        {cards.map((card) => (
                            <SortableCard
                                key={card.id}
                                card={card}
                                editing={editing}
                            />
                        ))}
                    </section>
                </SortableContext>
            </DndContext>
        </>
    )
}

function SortableCard({ card, editing }: { card: Card; editing: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id, disabled: !editing, transition: SPRING })

    // Outside edit mode it's a plain card: no drag handlers, and no extra
    // keyboard stop (the link inside already is one).
    const dragProps = editing ? { ...attributes, ...listeners } : {}

    let className = 'sortable'
    if (editing) {
        className += ' sortable--editing'
    }
    if (isDragging) {
        className += ' sortable--dragging'
    }

    return (
        <div
            ref={setNodeRef}
            className={className}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            {...dragProps}
        >
            <ServiceCard service={card.service} editing={editing} />
        </div>
    )
}
