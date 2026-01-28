import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CargoCard from './CargoCard';

interface SortableCargoItemProps {
    cargo: any;
    cargoIdx: number;
    stepIdx: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
    isAnyDragging: boolean;
}

const SortableCargoItem = ({
    cargo,
    cargoIdx,
    stepIdx,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    isAnyDragging
}: SortableCargoItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: cargo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <CargoCard
            cargo={cargo}
            cargoIdx={cargoIdx}
            stepIdx={stepIdx}
            setNodeRef={setNodeRef}
            style={style}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
            isAnyDragging={isAnyDragging}
        />
    );
};

interface CargoListWrapperProps {
    children: React.ReactNode;
    cargoes: any[];
    isLinked: boolean;
    onReorder: (activeId: string, overId: string) => void;
    onMoveItem: (idx: number, direction: 'up' | 'down') => void;
}

const CargoListWrapper = ({
    children,
    cargoes,
    isLinked,
    onReorder,
    onMoveItem
}: CargoListWrapperProps) => {
    const [isAnyDragging, setIsAnyDragging] = React.useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = () => {
        setIsAnyDragging(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsAnyDragging(false);
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorder(active.id as string, over.id as string);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setIsAnyDragging(false)}
        >
            <SortableContext
                items={cargoes.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                {isLinked ? (
                    <div className="relative pl-7 transition-all duration-500 ease-in-out">
                        {/* Dashed Vertical Rail */}
                        <div className="absolute left-[12px] top-12 bottom-12 w-0 border-l-2 border-dashed border-blue-600/20"></div>

                        <div className="space-y-4">
                            {cargoes.map((cargo, idx) => (
                                <div key={cargo.id} className="relative group/linked">
                                    {/* Circular connection point on the rail */}
                                    <div className="absolute -left-[18.5px] top-11 w-[9px] h-[9px] rounded-full border-2 border-blue-600 bg-white z-20 shadow-sm transition-all group-hover/linked:scale-125 group-hover/linked:border-blue-700"></div>

                                    {/* Minimal horizontal bridge connector */}
                                    <div className="absolute -left-[14px] top-[48px] w-2 h-[1.5px] bg-blue-600/10 group-hover/linked:bg-blue-600/30 transition-colors"></div>

                                    <SortableCargoItem
                                        cargo={cargo}
                                        cargoIdx={idx}
                                        stepIdx={0}
                                        onMoveUp={() => onMoveItem(idx, 'up')}
                                        onMoveDown={() => onMoveItem(idx, 'down')}
                                        isFirst={idx === 0}
                                        isLast={idx === cargoes.length - 1}
                                        isAnyDragging={isAnyDragging}
                                    />
                                </div>
                            ))}
                            {/* Render any non-sortable children like the "Add" button */}
                            {React.Children.toArray(children).filter((child: any) => {
                                return child && child.props && child.props.className && child.props.className.includes('border-dashed');
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cargoes.map((cargo, idx) => (
                            <SortableCargoItem
                                key={cargo.id}
                                cargo={cargo}
                                cargoIdx={idx}
                                stepIdx={0}
                                onMoveUp={() => onMoveItem(idx, 'up')}
                                onMoveDown={() => onMoveItem(idx, 'down')}
                                isFirst={idx === 0}
                                isLast={idx === cargoes.length - 1}
                                isAnyDragging={isAnyDragging}
                            />
                        ))}
                        {/* Render the "Add" button */}
                        {React.Children.toArray(children).filter((child: any) => {
                            return child && child.props && child.props.className && child.props.className.includes('border-dashed');
                        })}
                    </div>
                )}
            </SortableContext>
        </DndContext>
    );
};

export default CargoListWrapper;
