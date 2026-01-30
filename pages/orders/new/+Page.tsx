import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Plus,
    Maximize2,
    Minimize2,
    Navigation,
    ChevronLeft as ChevronLeftIcon,
    MoreVertical,
    Truck,
    Clock,
    Settings2,
    LayoutGrid,
    CheckCircle2,
    Phone,
    MessageSquare,
    Zap,
    Leaf,
    ShoppingBag,
    X,
    FileText,
    User,
    MapPin,
    AlertTriangle
} from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import ListOptions from './components/ListOptions';
import StopListWrapper from './components/StopListWrapper';
import { GoogleMap, Marker, Polyline } from '../../../components/GoogleMap';
import { useHeader } from '../../../context/HeaderContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import StopDetailPanel from './components/StopDetailPanel';

const INITIAL_STOP_LIST = [
    {
        id: '#43543534',
        type: 'Delivery',
        typeColor: 'bg-emerald-50 text-emerald-600',
        address: {
            id: 'addr_1',
            name: 'Ava Corporate HQ',
            street: '123 Main St',
            city: 'New York',
            country: 'USA',
            call: '1234',
            room: '402',
            stage: '4'
        },
        opening: {
            start: '08:00 AM',
            end: '10:00 AM'
        },
        estimatedTime: '08:00 AM',
        actions: [
            { id: 1, productName: 'iPhone 15 Pro', quantity: 5, type: 'delivery', requirements: ['fragile'], status: 'Pending', secure: 'photo' },
            { id: 2, productName: 'MacBook Air', quantity: 2, type: 'delivery', requirements: ['fragile', 'sec'], status: 'In progress', secure: 'scan' }
        ],
        client: { name: 'Ava Thompson', avatar: 'https://i.pravatar.cc/150?u=ava' }
    },
    {
        id: '#65456456',
        type: 'Pick-Up',
        typeColor: 'bg-orange-50 text-orange-600',
        address: {
            id: 'addr_2',
            name: 'North Warehouse',
            street: '456 Elm Ave',
            city: 'Springfield',
            country: 'USA'
        },
        opening: {
            start: '10:00 AM',
            end: '12:00 PM'
        },
        estimatedTime: '10:30 AM',
        actions: [
            { id: 1, productName: 'Lait Frais', quantity: 24, type: 'pickup', requirements: ['froid'], status: 'Pending', secure: 'none' },
            { id: 2, productName: 'Yaourts Bio', quantity: 48, type: 'pickup', requirements: ['froid'], status: 'Pending', secure: 'scan' }
        ],
        client: { name: 'Lucas Nelson', avatar: 'https://i.pravatar.cc/150?u=lucas' }
    }
];

export default function Page() {
    const [searchQuery, setSearchQuery] = useState('');
    const [steps, setSteps] = useState([
        { name: 'Step 1', stops: INITIAL_STOP_LIST, searchQuery: '', isSearchExpanded: false, isLinked: false },
        { name: 'Step 2', stops: [], searchQuery: '', isSearchExpanded: false, isLinked: false }
    ]);
    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0); // 1 for forward, -1 for backward
    const [isSidebarFullscreen, setIsSidebarFullscreen] = useState(false);
    const [activeRouteTab, setActiveRouteTab] = useState<'details' | 'history'>('details');
    const { setHeaderContent, clearHeaderContent } = useHeader();
    const listRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const kanbanRef = useRef<HTMLDivElement | null>(null);

    // Stop Detail Panel State
    const [selectedStop, setSelectedStop] = useState<any>(null);
    const [isStopDetailOpen, setIsStopDetailOpen] = useState(false);
    const [selectedStopMeta, setSelectedStopMeta] = useState<{ stepIdx: number; stopIdx: number } | null>(null);

    const handleOpenStopDetail = (stepIdx: number, stopIdx: number) => {
        setSelectedStop(steps[stepIdx].stops[stopIdx]);
        setSelectedStopMeta({ stepIdx, stopIdx });
        setIsStopDetailOpen(true);
    };

    const handleUpdateStop = (updatedStop: any) => {
        if (!selectedStopMeta) return;
        const { stepIdx, stopIdx } = selectedStopMeta;

        setSteps(prev => prev.map((s, sIdx) =>
            sIdx === stepIdx
                ? {
                    ...s,
                    stops: s.stops.map((stop, stIdx) =>
                        stIdx === stopIdx ? updatedStop : stop
                    )
                }
                : s
        ));
        setSelectedStop(updatedStop);
    };

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
    }>({
        isOpen: false,
        title: '',
        description: ''
    });

    const showAlert = (title: string, description: string) => {
        setAlertConfig({ isOpen: true, title, description });
    };

    const handleAddStep = () => {
        const newStepIndex = steps.length;
        setDirection(1);
        setSteps(prev => [...prev, { name: `Step ${newStepIndex + 1}`, stops: [], searchQuery: '', isSearchExpanded: false, isLinked: false }]);
        setActiveStep(newStepIndex);

        if (isSidebarFullscreen) {
            setTimeout(() => {
                if (kanbanRef.current) {
                    kanbanRef.current.scrollTo({
                        left: kanbanRef.current.scrollWidth,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    };

    const scrollToBottom = (stepIdx: number) => {
        setTimeout(() => {
            const container = listRefs.current[stepIdx];
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    const handleAddStop = (stepIdx: number) => {
        const randomTypes = [
            { type: 'Delivery', color: 'bg-emerald-50 text-emerald-600' },
            { type: 'Pick-Up', color: 'bg-blue-50 text-blue-600' },
            { type: 'Transfer', color: 'bg-orange-50 text-orange-600' }
        ];
        const randomType = randomTypes[Math.floor(Math.random() * randomTypes.length)];
        const randomNames = ['Alex Rivera', 'Sarah Chen', 'Marc Dupont', 'Julie Martin'];
        const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
        const randomAddresses = ['123 Main St, New York', '456 Elm Ave, Springfield', '789 Oak Dr, Pleasantville', '987 Maple Rd, Greenville'];
        const randomAddress = randomAddresses[Math.floor(Math.random() * randomAddresses.length)];
        //@ts-ignore
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx
                ? {
                    ...s,
                    stops: [
                        ...s.stops,
                        {
                            id: `#${Math.floor(Math.random() * 10000000)}`,
                            type: randomType.type,
                            typeColor: randomType.color,
                            address: {
                                id: `addr_${Math.random()}`,
                                name: randomName + "'s Warehouse",
                                street: randomAddress,
                                city: 'Unknown',
                                country: 'USA'
                            },
                            opening: {
                                start: '08:00 AM',
                                end: '05:00 PM'
                            },
                            actions: [
                                { id: Date.now(), productName: 'Nouveau Produit', quantity: 1, type: randomType.type === 'Pick-Up' ? 'pickup' : 'delivery', requirements: ['sec'], status: 'Pending', secure: 'none' }
                            ],
                            client: { name: randomName, avatar: `https://i.pravatar.cc/150?u=${randomName.replace(' ', '')}` }
                        }
                    ]
                }
                : s
        ));
        scrollToBottom(stepIdx);
    };

    const handleSearch = (stepIdx: number, value: string) => {
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, searchQuery: value } : s
        ));
    };

    const handleToggleSearch = (stepIdx: number) => {
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, isSearchExpanded: !s.isSearchExpanded, searchQuery: s.isSearchExpanded ? '' : s.searchQuery } : s
        ));
    };

    const handleToggleLink = (stepIdx: number) => {
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, isLinked: !s.isLinked } : s
        ));
    };

    const handleDeleteStep = (stepIdx: number) => {
        if (steps.length <= 1) {
            showAlert("Action impossible", "Au moins une étape est nécessaire pour une commande.");
            return;
        }

        if (steps[stepIdx].stops.length > 0) {
            showAlert("Étape non vide", "Veuillez d'abord supprimer tous les arrêts de cette étape avant de la supprimer.");
            return;
        }

        const newSteps = steps.filter((_, idx) => idx !== stepIdx);
        setSteps(newSteps);

        // Adjust activeStep and set direction
        if (activeStep >= newSteps.length) {
            setDirection(-1);
            setActiveStep(Math.max(0, newSteps.length - 1));
        } else if (activeStep === stepIdx && stepIdx > 0) {
            setDirection(-1);
            setActiveStep(stepIdx - 1);
        }
    };

    const handleReorderStop = (stepIdx: number, activeId: string, overId: string) => {
        setSteps(prev => prev.map((s, idx) => {
            if (idx !== stepIdx) return s;
            const oldIndex = s.stops.findIndex(c => c.id === activeId);
            const newIndex = s.stops.findIndex(c => c.id === overId);
            return {
                ...s,
                stops: arrayMove(s.stops, oldIndex, newIndex)
            };
        }));
    };

    const handleMoveItem = (stepIdx: number, itemIdx: number, direction: 'up' | 'down') => {
        setSteps(prev => prev.map((s, idx) => {
            if (idx !== stepIdx) return s;
            const newIndex = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
            if (newIndex < 0 || newIndex >= s.stops.length) return s;
            return {
                ...s,
                stops: arrayMove(s.stops, itemIdx, newIndex)
            };
        }));
    };

    useEffect(() => {
        setHeaderContent(
            <div className="flex items-center justify-between w-full h-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">New shipment</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-5 py-2 text-[11px] font-black text-[#2563eb] bg-[#dbeafe] hover:bg-[#bfdbfe] rounded-xl uppercase tracking-widest transition-colors">
                        Save as Draft
                    </button>
                    <button className="px-6 py-2 text-[11px] font-black text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl uppercase tracking-widest shadow-lg shadow-blue-100 transition-colors">
                        Submit
                    </button>
                </div>
            </div>
        );
        return () => clearHeaderContent();
    }, [setHeaderContent, clearHeaderContent]);


    const routeDetails = [
        { id: 1, location: 'Anytown, NY 12345', address: '123 Main St' },
        { id: 2, location: 'Pleasantville, NY 12345', address: '789 Oak Dr' },
        { id: 3, location: 'Greenville, NY 12345', address: '987 Maple Rd' },
        { id: 4, location: 'Springfield, IL 67890', address: '456 Elm Ave' },
        { id: 5, location: 'Lakeside, IL 67890', address: '456 Tanager Drive' },
        { id: 6, location: 'Mountain View, IL 67890', address: '321 Maple Lane' },
    ];

    const historyStatus = [
        { date: '28.01.2026', time: '08:00 AM', status: 'Created', description: 'Order initiated by system.', icon: CheckCircle2, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50' },
        { date: '28.01.2026', time: '09:30 AM', status: 'Submited', description: 'Order details verified and submitted.', icon: FileText, iconColor: 'text-blue-500', bgColor: 'bg-blue-50' },
        { date: '28.01.2026', time: '10:45 AM', status: 'Assigned', description: 'Assigned to Driver Artem Bezrukov.', icon: User, iconColor: 'text-purple-500', bgColor: 'bg-purple-50' },
        { date: '28.01.2026', time: '11:15 AM', status: 'Accepted', description: 'Driver accepted the shipment.', icon: Truck, iconColor: 'text-orange-500', bgColor: 'bg-orange-50' },
        { date: '29.01.2026', time: '07:30 AM', status: 'Arrived at', description: 'Anytown, NY 12345', icon: MapPin, iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
        { date: '29.01.2026', time: '08:15 AM', status: 'Pickup confirmed', description: 'Loading started for items #43543534.', icon: CheckCircle2, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
        { date: '29.01.2026', time: '10:00 AM', status: 'Arrived at', description: 'Load #65456456 (Springfield, IL)', icon: MapPin, iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
        { date: '29.01.2026', time: '11:30 AM', status: 'Pickup partial', description: 'Exception on load #65456456 (Load D not picked up).', icon: AlertTriangle, iconColor: 'text-rose-500', bgColor: 'bg-rose-50' },
    ];

    const mapPath = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 41.1265, lng: -73.7140 },
        { lat: 41.3828, lng: -73.9660 },
        { lat: 39.7817, lng: -89.6501 },
        { lat: 39.8000, lng: -89.5000 },
        { lat: 39.7500, lng: -89.6000 },
    ];

    return (
        <div className="flex flex-col h-full bg-[#f4f7fa] overflow-hidden font-sans">

            <main className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Stop List */}
                <aside
                    className={`flex flex-col bg-[#f4f7fa] border-r border-gray-100 px-4 pt-4 pb-2 h-full overflow-hidden transition-all duration-500 ease-in-out relative ${isSidebarFullscreen ? 'w-full' : 'w-[380px]'
                        }`}
                >
                    {/* Absolute Actions in Fullscreen Mode */}
                    {isSidebarFullscreen && (
                        <div className="absolute top-4 right-6 z-50 flex items-center gap-2 bg-white/60 backdrop-blur-xl p-1.5 rounded-[20px] border border-white/40 shadow-xl shadow-blue-900/5">
                            <button
                                onClick={handleAddStep}
                                className="p-2.5 bg-white text-blue-600 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-all shadow-sm flex items-center gap-2 group"
                                title="Add Step"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest pr-1">Add Step</span>
                            </button>
                            <button
                                onClick={() => setIsSidebarFullscreen(false)}
                                className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl transition-all shadow-sm hover:bg-blue-100 group"
                                title="Exit Fullscreen"
                            >
                                <Minimize2 size={18} className="group-scale-90 transition-transform" />
                            </button>
                        </div>
                    )}
                    {/* Step Navigation */}
                    {/* Step Navigation & Actions */}
                    {/* Step Navigation & Actions (Normal Mode only) */}
                    {!isSidebarFullscreen && (
                        <div className="flex items-center justify-between gap-3 mb-4 bg-white/50 p-1.5 rounded-2xl border border-gray-100/50 flex-shrink-0">
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                                {steps.map((step, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setDirection(idx > activeStep ? 1 : -1);
                                            setActiveStep(idx);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 group/tab ${activeStep === idx
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'bg-white/80 text-gray-400 border border-gray-100 hover:border-blue-200 hover:text-blue-500'
                                            }`}
                                    >
                                        <span>{step.name}</span>
                                        {activeStep === idx && (
                                            <X
                                                size={12}
                                                className="hover:text-rose-200 transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteStep(idx); }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200/50">
                                <button
                                    onClick={handleAddStep}
                                    className="p-2 bg-white text-blue-600 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                                    title="Add Step"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => setIsSidebarFullscreen(!isSidebarFullscreen)}
                                    className="p-2 bg-white text-gray-400 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                                    title="Fullscreen"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    <div
                        ref={kanbanRef}
                        className={`flex-1 overflow-hidden ${isSidebarFullscreen ? 'flex flex-row gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 lg:pr-60' : 'flex flex-col'}`}
                    >
                        {isSidebarFullscreen ? (
                            steps.map((step, stepIdx) => (
                                <div key={stepIdx} className="w-[340px] shrink-0 flex flex-col h-full rounded-[32px] bg-white/40 p-1 border border-white/10 hover:bg-white/30 transition-colors">
                                    <div className="flex items-center justify-between p-4 flex-shrink-0">
                                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{step.name}</h3>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{step.stops.length} stops</span>
                                    </div>

                                    <ListOptions
                                        step={step}
                                        stepIdx={stepIdx}
                                        stopCount={step.stops.length}
                                        onSearch={(val) => handleSearch(stepIdx, val)}
                                        onAdd={() => handleAddStop(stepIdx)}
                                        onToggleSearch={() => handleToggleSearch(stepIdx)}
                                        onToggleLink={() => handleToggleLink(stepIdx)}
                                        onDelete={() => handleDeleteStep(stepIdx)}
                                    />

                                    <div
                                        ref={el => { listRefs.current[stepIdx] = el; }}
                                        className="flex-1 overflow-y-auto scrollbar-hide p-3 pb-32"
                                    >
                                        <StopListWrapper
                                            stops={step.stops}
                                            isLinked={step.isLinked}
                                            onReorder={(activeId, overId) => handleReorderStop(stepIdx, activeId, overId)}
                                            onMoveItem={(idx, dir) => handleMoveItem(stepIdx, idx, dir)}
                                            onOpenDetail={(stop) => {
                                                const stopIdx = step.stops.findIndex(s => s.id === stop.id);
                                                handleOpenStopDetail(stepIdx, stopIdx);
                                            }}
                                        >
                                            {step.stops.length === 0 && (
                                                <div
                                                    onClick={() => handleAddStop(stepIdx)}
                                                    className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[28px] text-gray-400 m-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                                >
                                                    <Plus size={24} className="text-gray-300 group-hover:text-blue-400 transition-colors mb-2" />
                                                    <div className="text-[10px] font-black uppercase tracking-widest">Add Stop</div>
                                                </div>
                                            )}
                                        </StopListWrapper>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col relative overflow-hidden">
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.div
                                        key={activeStep}
                                        custom={direction}
                                        variants={{
                                            enter: (direction: number) => ({
                                                x: direction > 0 ? '100%' : '-100%',
                                                opacity: 0
                                            }),
                                            center: {
                                                x: 0,
                                                opacity: 1
                                            },
                                            exit: (direction: number) => ({
                                                x: direction < 0 ? '100%' : '-100%',
                                                opacity: 0
                                            })
                                        }}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        className="absolute inset-0 flex flex-col pt-1"
                                    >
                                        <ListOptions
                                            step={steps[activeStep]}
                                            stepIdx={activeStep}
                                            stopCount={steps[activeStep].stops.length}
                                            onSearch={(val) => handleSearch(activeStep, val)}
                                            onAdd={() => handleAddStop(activeStep)}
                                            onToggleSearch={() => handleToggleSearch(activeStep)}
                                            onToggleLink={() => handleToggleLink(activeStep)}
                                            onDelete={() => handleDeleteStep(activeStep)}
                                        />
                                        <div
                                            ref={el => { listRefs.current[activeStep] = el; }}
                                            className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-1"
                                        >
                                            <StopListWrapper
                                                stops={steps[activeStep].stops}
                                                isLinked={steps[activeStep].isLinked}
                                                onReorder={(activeId, overId) => handleReorderStop(activeStep, activeId, overId)}
                                                onMoveItem={(idx, dir) => handleMoveItem(activeStep, idx, dir)}
                                                onOpenDetail={(stop) => {
                                                    const stopIdx = steps[activeStep].stops.findIndex(s => s.id === stop.id);
                                                    handleOpenStopDetail(activeStep, stopIdx);
                                                }}
                                            >
                                                {steps[activeStep].stops.length === 0 && (
                                                    <div
                                                        onClick={() => handleAddStop(activeStep)}
                                                        className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[28px] text-gray-400 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                                    >
                                                        <Plus size={24} className="text-gray-300 group-hover:text-blue-400 transition-colors mb-2" />
                                                        <div className="text-[10px] font-black uppercase tracking-widest">Add Stop</div>
                                                    </div>
                                                )}
                                            </StopListWrapper>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <section
                    className={`flex-1 rounded-[16px] overflow-y-auto scrollbar-hide pr-4 py-4 transition-all duration-500 ease-in-out ${isSidebarFullscreen ? 'translate-x-full opacity-0 pointer-events-none w-0 h-0 p-0 overflow-hidden' : 'translate-x-0'
                        }`}
                >
                    {/* Top Row: Map and Route Details */}
                    <div className="flex gap-4 mb-4 items-start">
                        {/* Map Overview */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Map Overview</h2>
                            <div className="w-full h-[400px] rounded-[16px] overflow-hidden border border-gray-100 shadow-sm relative">
                                <GoogleMap
                                    center={{ lat: 40.5, lng: -81.0 }}
                                    zoom={5}
                                    className="w-full h-full"
                                >
                                    {mapPath.map((pos, i) => (
                                        <Marker key={i} position={pos} label={(i + 1).toString()} />
                                    ))}
                                    <Polyline path={mapPath} strokeColor="#2563eb" strokeWeight={4} />
                                </GoogleMap>
                                {/* Map controls overlay */}
                                <div className="absolute right-4 top-4 flex flex-col gap-2">
                                    <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600">+</button>
                                    <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600">-</button>
                                </div>
                                <div className="absolute right-4 bottom-4">
                                    <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600">
                                        <Navigation size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Route & History Tabs */}
                        <div className="w-[340px] shrink-0">
                            <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-2">
                                <button
                                    onClick={() => setActiveRouteTab('details')}
                                    className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${activeRouteTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Route Details
                                </button>
                                <button
                                    onClick={() => setActiveRouteTab('history')}
                                    className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${activeRouteTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    History Status
                                </button>
                            </div>

                            <div className="bg-[#f4f7fa]/50 rounded-[32px] p-5 border border-gray-50 h-[380px] overflow-y-auto scrollbar-hide">
                                {activeRouteTab === 'details' ? (
                                    <div className="space-y-6 relative">
                                        {/* Route line */}
                                        <div className="absolute left-[11px] top-[10px] bottom-[10px] w-0 border-l-2 border-dashed border-gray-300"></div>

                                        {routeDetails.map((stop) => (
                                            <div key={stop.id} className="flex gap-4 relative">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white z-10 shadow-sm">
                                                    {stop.id}
                                                </div>
                                                <div className="pt-0.5">
                                                    <div className="text-xs font-bold text-gray-900 mb-0.5">{stop.location}</div>
                                                    <div className="text-[10px] font-medium text-gray-400 uppercase">{stop.address}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6 relative">
                                        {/* History Timeline line */}
                                        <div className="absolute left-[11px] top-[10px] bottom-[10px] w-0 border-l-2 border-gray-200"></div>

                                        {historyStatus.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 relative">
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-lg ${item.bgColor} flex items-center justify-center z-10 shadow-sm`}>
                                                    <item.icon size={12} className={item.iconColor} />
                                                </div>
                                                <div className="pt-0.5 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-xs font-black text-gray-900">{item.status}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{item.time}</span>
                                                    </div>
                                                    <div className="text-[10px] font-medium text-gray-500 leading-tight">
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Area: Operation Details & Load Analytics (Inspired by shipment2.webp) */}
                    <div className="flex gap-6 mb-8 items-stretch">
                        {/* Operation Details (Left) */}
                        <div className="flex-1  relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Operation Details</h3>
                                <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400"><MoreVertical size={16} /></button>
                            </div>

                            <div className="relative">
                                {/* Side Icons - Absolute Top Left (from shipment2) */}
                                <div className="absolute top-0 left-0 flex flex-col gap-3.5 z-20">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm shadow-blue-100"><Truck size={18} /></div>
                                    <div className="p-2.5 text-gray-300 hover:text-blue-600 transition-colors cursor-pointer"><Navigation size={18} /></div>
                                    <div className="p-2.5 text-gray-300 hover:text-blue-600 transition-colors cursor-pointer"><Clock size={18} /></div>
                                    <div className="p-2.5 text-gray-300 hover:text-blue-600 transition-colors cursor-pointer"><Settings2 size={18} /></div>
                                </div>

                                {/* Truck Info - Centered/Main Area */}
                                <div className="flex flex-col pt-2">
                                    <div className="flex justify-center mb-6 relative">
                                        {/* Glow effect */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-blue-100 rounded-full blur-[80px] opacity-30"></div>
                                        <img
                                            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800"
                                            alt="Delivery Truck"
                                            className="w-72 h-44 object-contain relative z-10 drop-shadow-2xl brightness-105"
                                        />
                                    </div>

                                    <div className="text-center mb-4">
                                        <h4 className="text-xl font-black text-gray-900 mb-1">Volvo FMX 460 - <span className="text-blue-600">#XL-43543</span></h4>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[9px] font-black text-gray-500 uppercase tracking-tighter">Container ID</span>
                                            <span className="text-[10px] font-mono font-bold text-gray-400">#JAKQHH671</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-[#fff] rounded-2xl p-4 border border-gray-50 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                                <LayoutGrid size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Container Type</div>
                                                <div className="text-sm font-bold text-gray-900">FLC 20 Standart</div>
                                            </div>
                                        </div>
                                        <div className="bg-[#fff] rounded-2xl p-4 border border-gray-50 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Available Load</div>
                                                <div className="text-sm font-bold text-gray-900">6,791kg / 8,000kg</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Driver Card - Compact & Clean */}
                                    <div className="bg-[#fff] border border-gray-50 rounded-[28px] p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src="https://i.pravatar.cc/150?u=artem" alt="Driver" className="w-11 h-11 rounded-full border-2 border-white shadow-sm" />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-sm">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900">Artem Bezrukov</div>
                                                <div className="text-[10px] font-bold text-gray-400">Senior Driver • <span className="text-emerald-500 uppercase tracking-tighter">Available</span></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-100 rounded-full transition-all shadow-sm"><Phone size={15} /></button>
                                            <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-100 rounded-full transition-all shadow-sm"><MessageSquare size={15} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weight Distribution (Right) */}
                        <div className="w-[420px]  flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Weight Distribution</h3>
                                <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400"><MoreVertical size={16} /></button>
                            </div>

                            <div className="mb-8 px-2 relative">
                                <div className="flex items-baseline gap-2 mb-10">
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">80%</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">of Total Capacity</span>
                                </div>

                                {/* Capacity Gauge with Wave Effect (Simulated from shipment2) */}
                                <div className="relative mb-8 h-8 flex items-center">
                                    {/* The line */}
                                    <div className="h-[2px] w-full bg-gray-100 rounded-full relative">
                                        {/* The "Wave" / Accent */}
                                        <div className="absolute left-[80%] -translate-x-1/2 -top-6 flex flex-col items-center group/tooltip">
                                            <div className="px-2 py-1 bg-gray-900 rounded-lg text-[10px] font-black text-white mb-1 shadow-xl tracking-tighter">6,791kg</div>
                                            <div className="w-5 h-5 rounded-full border-4 border-white bg-blue-600 shadow-xl relative z-10 transition-transform hover:scale-110"></div>
                                            {/* Subtle line indicator under dot */}
                                            <div className="w-[2px] h-4 bg-gray-200 mt-[-2px]"></div>
                                        </div>
                                        {/* Blue progress line */}
                                        <div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full" style={{ width: '80%' }}></div>
                                    </div>
                                </div>

                                {/* Frequency bars visualization from shipment2 */}
                                <div className="flex justify-between h-8 items-end gap-[1px] opacity-30">
                                    {[...Array(60)].map((_, i) => {
                                        // Specific wave pattern
                                        const x = (i / 60) * Math.PI * 2.5;
                                        const h = 40 + Math.sin(x) * 30 + Math.random() * 20;
                                        return (
                                            <div
                                                key={i}
                                                className={`w-[2px] rounded-full transition-all ${i < 48 ? 'bg-gray-800' : 'bg-gray-200'}`}
                                                style={{ height: `${h}%` }}
                                            ></div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 px-2 mb-2">
                                    <span>Load Type</span>
                                    <span>Weight</span>
                                </div>

                                {/* Item: Electronic Product */}
                                <div className="flex items-center justify-between p-3 hover:bg-white hover:shadow-sm hover:border-gray-100 border border-transparent rounded-2xl transition-all cursor-default group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                            <Zap size={15} />
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-800">Electronic Product</span>
                                    </div>
                                    <div className="text-[13px] font-black text-gray-900 pr-2">100kg <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Total</span></div>
                                </div>

                                {/* Item: Food And Beverage */}
                                <div className="flex items-center justify-between p-3 hover:bg-white hover:shadow-sm hover:border-gray-100 border border-transparent rounded-2xl transition-all cursor-default group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                            <Leaf size={15} />
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-800">Food And Beverage</span>
                                    </div>
                                    <div className="text-[13px] font-black text-gray-900 pr-2">75kg <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Total</span></div>
                                </div>

                                {/* Item: Customer Goods */}
                                <div className="flex items-center justify-between p-3 hover:bg-white hover:shadow-sm hover:border-gray-100 border border-transparent rounded-2xl transition-all cursor-default group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <ShoppingBag size={15} />
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-800">Customer Goods</span>
                                    </div>
                                    <div className="text-[13px] font-black text-gray-900 pr-2">150kg <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Total</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <ConfirmModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                description={alertConfig.description}
                confirmLabel="OK"
                showCancel={false}
            />

            <StopDetailPanel
                isOpen={isStopDetailOpen}
                onClose={() => setIsStopDetailOpen(false)}
                stop={selectedStop}
                onUpdate={handleUpdateStop}
            />

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div >
    );
}
