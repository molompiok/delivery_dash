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
import StopCard from './StopCard';
import { ChevronDownIcon } from 'lucide-react';

interface SortableStopItemProps {
    stop: any;
    stopIdx: number;
    stepIdx: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
    isAnyDragging: boolean;
    onOpenDetail?: (stop: any) => void;
}

const SortableStopItem = ({
    stop,
    stopIdx,
    stepIdx,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    isAnyDragging,
    onOpenDetail
}: SortableStopItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: stop.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <StopCard
            stop={stop}
            stopIdx={stopIdx}
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
            onOpenDetail={onOpenDetail}
        />
    );
};

interface StopListWrapperProps {
    stops: any[];
    isLinked: boolean;
    onReorder: (activeId: string, overId: string) => void;
    onMoveItem: (idx: number, direction: 'up' | 'down') => void;
    onOpenDetail?: (stop: any) => void;
    children?: React.ReactNode;
}

const StopListWrapper = ({
    stops,
    isLinked,
    onReorder,
    onMoveItem,
    onOpenDetail,
    children
}: StopListWrapperProps) => {
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
                items={stops.map(s => s.id)}
                strategy={verticalListSortingStrategy}
            >
                {isLinked ? (
                    <div className="relative pl-7 transition-all duration-500 ease-in-out">
                        {/* Dashed Vertical Rail */}
                        <div className="absolute left-[12px] top-12 bottom-12 w-0 border-l-2 border-dashed border-blue-600/20"></div>

                        <div className="space-y-4">
                            {stops.map((stop, idx) => (
                                <div key={stop.id} className="relative group/linked">
                                    {/* Circular connection point on the rail */}
                                    <div className="absolute -left-[19px] top-11 w-[9px] h-[9px] rounded-full border-2 border-blue-600 bg-white z-20 shadow-sm transition-all group-hover/linked:scale-125 group-hover/linked:border-blue-700"></div>
                                    <div className="absolute -left-[23px] top-14 z-20 group-hover/linked:scale-125 group-hover/linked:border-blue-700">
                                        <ChevronDownIcon className="w-4 h-4 text-blue-600" />
                                    </div>

                                    <SortableStopItem
                                        stop={stop}
                                        stopIdx={idx}
                                        stepIdx={0}
                                        onMoveUp={() => onMoveItem(idx, 'up')}
                                        onMoveDown={() => onMoveItem(idx, 'down')}
                                        isFirst={idx === 0}
                                        isLast={idx === stops.length - 1}
                                        isAnyDragging={isAnyDragging}
                                        onOpenDetail={onOpenDetail}
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
                        {stops.map((stop, idx) => (
                            <SortableStopItem
                                key={stop.id}
                                stop={stop}
                                stopIdx={idx}
                                stepIdx={0}
                                onMoveUp={() => onMoveItem(idx, 'up')}
                                onMoveDown={() => onMoveItem(idx, 'down')}
                                isFirst={idx === 0}
                                isLast={idx === stops.length - 1}
                                isAnyDragging={isAnyDragging}
                                onOpenDetail={onOpenDetail}
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

export default StopListWrapper;
