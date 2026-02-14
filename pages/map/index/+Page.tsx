import React, { useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Package, Truck, Maximize, Minimize, Menu } from 'lucide-react';
import { mockService, DriverPosition, Zone, Driver } from '../../../api/mock';
import { zoneService } from '../../../api/zones';
import { MapLibre as GoogleMap, Marker, Circle, Polygon, DrawingManager, Rectangle, HexagonDrawer } from '../../../components/MapLibre';
import { AnimatePresence } from 'framer-motion';
import { usePageContext } from 'vike-react/usePageContext';
import { useTheme } from '../../../context/ThemeContext';

// Refactored Components
import { useHeader } from '../../../context/HeaderContext';
// Refactored Components
import { SidebarHeader } from './components/SidebarHeader';
import { TabNavigation } from './components/TabNavigation';
import { DriverList } from './components/DriverList';
import { DriverDetail } from './components/DriverDetail';
import { ZoneList } from './components/ZoneList';
import { ZoneDetail } from './components/ZoneDetail';
import { VehicleList } from './components/VehicleList';
import { VehicleDetail } from './components/VehicleDetail';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { Vehicle } from '../../../api/types';
import LocationSearchBar from '../../../components/LocationSearchBar';
import { socketClient } from '../../../api/socket';

type MapTab = 'DRIVERS' | 'ZONES' | 'ORDERS' | 'VEHICLES';

export default function Page() {
    const { headerHeight } = useHeader();
    const { theme } = useTheme();
    const pageContext = usePageContext();
    const zoneIdParam = pageContext.urlParsed.search.zone_id;
    const driverIdParam = pageContext.urlParsed.search.driver_id;
    const vehicleIdParam = pageContext.urlParsed.search.vehicle_id;

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [positions, setPositions] = useState<DriverPosition[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState({ lat: 5.345, lng: -4.020 });
    const [mapZoom, setMapZoom] = useState(13);
    const [activeDriver, setActiveDriver] = useState<string | null>(null);
    const [activeZone, setActiveZone] = useState<string | null>(null);
    const [activeVehicle, setActiveVehicle] = useState<string | null>(null);
    const [showZones, setShowZones] = useState(true);
    const [activeTab, setActiveTab] = useState<MapTab>('DRIVERS');
    const [panelCollapsed, setPanelCollapsed] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);

    // Zone Edition States
    const [isEditing, setIsEditing] = useState(false);
    const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | 'hexagon' | null>(null);
    const [newZone, setNewZone] = useState<Zone | null>(null);
    const [modifiedZoneData, setModifiedZoneData] = useState<Partial<Zone> | null>(null);

    // Driver Details State
    const [driverDetailId, setDriverDetailId] = useState<string | null>(null);
    const [driverOrders, setDriverOrders] = useState<any[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fullscreen State
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Zone Detail & Grouping State
    const [zoneDetailId, setZoneDetailId] = useState<string | null>(null);
    const [vehicleDetailId, setVehicleDetailId] = useState<string | null>(null);
    const [assignMode, setAssignMode] = useState(false);
    const [collapsedSectors, setCollapsedSectors] = useState<string[]>([]);
    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        const savedDriverDetail = localStorage.getItem('map_driver_detail');
        if (savedDriverDetail) setDriverDetailId(savedDriverDetail);

        const savedZoneDetail = localStorage.getItem('map_zone_detail');
        if (savedZoneDetail) setZoneDetailId(savedZoneDetail);

        const savedVehicleDetail = localStorage.getItem('map_vehicle_detail');
        if (savedVehicleDetail) setVehicleDetailId(savedVehicleDetail);

        const savedCenter = localStorage.getItem('map_center');
        if (savedCenter) {
            try {
                setMapCenter(JSON.parse(savedCenter));
            } catch (e) {
                console.error('Failed to parse saved map center', e);
            }
        }

        const savedZoom = localStorage.getItem('map_zoom');
        if (savedZoom) {
            setMapZoom(parseInt(savedZoom));
        }
    }, []);

    const handleCenterChanged = (center: google.maps.LatLngLiteral) => {
        // We DO NOT update React state here to avoid re-render loops and freezing.
        // We only persist to localStorage for the next reload.
        localStorage.setItem('map_center', JSON.stringify(center));
    };

    const handleZoomChanged = (zoom: number) => {
        // Same here: passive storage only.
        localStorage.setItem('map_zoom', zoom.toString());
    };

    useEffect(() => {
        if (driverDetailId) {
            localStorage.setItem('map_driver_detail', driverDetailId);
            setActiveDriver(driverDetailId); // Sync for focus mode
            setDetailsLoading(true);
            mockService.getDriverOrders(driverDetailId).then(orders => {
                setDriverOrders(orders);
                setDetailsLoading(false);
            });
        } else {
            localStorage.removeItem('map_driver_detail');
            setActiveDriver(null);
        }
    }, [driverDetailId]);

    useEffect(() => {
        if (zoneDetailId) {
            localStorage.setItem('map_zone_detail', zoneDetailId);
            setActiveZone(zoneDetailId); // Sync for editing
        } else {
            localStorage.removeItem('map_zone_detail');
            setAssignMode(false);
            setActiveZone(null);
        }
    }, [zoneDetailId]);

    useEffect(() => {
        if (vehicleDetailId) {
            localStorage.setItem('map_vehicle_detail', vehicleDetailId);
            setActiveVehicle(vehicleDetailId);
        } else {
            localStorage.removeItem('map_vehicle_detail');
            setActiveVehicle(null);
        }
    }, [vehicleDetailId]);

    // URL params handling - only on mount or when params actually change
    // URL params handling - only on mount or when params change
    useEffect(() => {
        if (zoneIdParam) {
            setZoneDetailId(zoneIdParam as string);
            setActiveTab('ZONES');
            setIsFollowing(true);
        } else if (driverIdParam) {
            setDriverDetailId(driverIdParam as string);
            setActiveTab('DRIVERS');
            setIsFollowing(true);
        } else if (vehicleIdParam) {
            setVehicleDetailId(vehicleIdParam as string);
            setActiveTab('VEHICLES');
            setIsFollowing(true);
        }

        // Clean up URL parameters after processing
        if (zoneIdParam || driverIdParam || vehicleIdParam) {
            const url = new URL(window.location.href);
            url.searchParams.delete('zone_id');
            url.searchParams.delete('driver_id');
            url.searchParams.delete('vehicle_id');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, [zoneIdParam, driverIdParam, vehicleIdParam]);

    // Separate effect for "Initial positioning" once positions are loaded after deep link
    useEffect(() => {
        if (vehicleDetailId && positions.length > 0 && !activeDriver) {
            const pos = positions.find(p => p.vehicleId === vehicleDetailId);
            if (pos) {
                setActiveDriver(pos.driverId);
                setIsFollowing(true);
            }
        }
    }, [positions, vehicleDetailId]);


    const handleZoneEdit = (data: any) => {
        const id = activeZone || zoneDetailId;
        if (!id) return;

        const geom: any = {};
        if (data.radius) geom.radiusKm = data.radius / 1000;
        if (data.center) geom.center = data.center;
        if (data.paths) geom.paths = data.paths;
        if (data.bounds) geom.bounds = data.bounds;

        // Visual feedback immediately
        setZones(prev => prev.map(z => {
            if (z.id !== id) return z;
            return {
                ...z,
                ...data,
                geometry: { ...(z.geometry || {}), ...geom }
            };
        }));

        setModifiedZoneData(prev => ({
            ...prev,
            ...data,
            geometry: { ...(prev?.geometry || {}), ...geom }
        }));
    };

    useEffect(() => {
        const loadZones = async () => {
            const zonesData = await mockService.getZones();
            setZones(zonesData);
            setLoading(false);
        };
        loadZones();

        const interval = setInterval(async () => {
            const pos = await mockService.getDriverPositions();
            setPositions(pos);
        }, 3000);

        Promise.all([
            mockService.getDriverPositions(),
            mockService.getDrivers(),
            mockService.getVehicles()
        ]).then(([p, d, v]) => {
            setPositions(p);
            setDrivers(d);
            setVehicles(v);
        });

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const socket = socketClient.connect();
        const userStr = localStorage.getItem('delivery_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const companyId = user.effectiveCompanyId || user.companyId;
                if (companyId) {
                    socket.emit('join', `fleet:${companyId}`);
                    console.log(`[MAP] Subscribed to fleet:${companyId}`);
                }
            } catch (e) { }
        }

        socket.on('route_updated', (payload: any) => {
            console.log('[MAP] Route update received, refreshing positions:', payload);
            // Refresh positions immediately
            mockService.getDriverPositions().then(setPositions);
        });

        return () => {
            socket.off('route_updated');
        };
    }, []);

    useEffect(() => {
        if (!isFollowing) return;
        const g = (window as any).google;
        if (!g || !g.maps) return;

        if (activeDriver) {
            const driver = positions.find(p => p.driverId === activeDriver);
            if (driver) {
                setMapCenter({ lat: driver.lat, lng: driver.lng });
                setMapZoom(16);
            }
        } else if (activeZone) {
            const zone = zones.find(z => z.id === activeZone);
            if (zone) {
                const geom = zone.geometry;
                if (zone.type === 'circle' && geom.center) {
                    setMapCenter(geom.center);
                    if (geom.radiusKm) {
                        const z = Math.round(14 - Math.log2(geom.radiusKm));
                        setMapZoom(Math.max(10, Math.min(18, z)));
                    }
                }
                else if (zone.type === 'polygon' && geom.paths && geom.paths.length > 0) {
                    let lat = 0, lng = 0;
                    geom.paths.forEach(p => { lat += p.lat; lng += p.lng; });
                    setMapCenter({ lat: lat / geom.paths.length, lng: lng / geom.paths.length });
                    setMapZoom(14);
                }
                else if (zone.type === 'rectangle' && geom.bounds) {
                    const lat = (geom.bounds.north + geom.bounds.south) / 2;
                    const lng = (geom.bounds.east + geom.bounds.west) / 2;
                    setMapCenter({ lat, lng });
                    setMapZoom(14);
                }
            }
        }
    }, [isFollowing, activeDriver, activeZone, positions, zones]);

    const handleCircleComplete = (circle: google.maps.Circle) => {
        const center = circle.getCenter();
        const radius = circle.getRadius();
        if (center) {
            const tempZone: Partial<Zone> = {
                id: `custom-circle-${Date.now()}`,
                name: `Zone ${zones.filter(z => z.id.startsWith('custom')).length + 1}`,
                color: '#10b981',
                type: 'circle',
                geometry: {
                    radiusKm: radius / 1000,
                    center: { lat: center.lat(), lng: center.lng() }
                },
                isActive: true
            };
            saveNewZone(tempZone as Zone, false);
        }
        circle.setMap(null);
        setDrawingMode(null);
    };

    const handlePolygonComplete = (polygon: google.maps.Polygon) => {
        const paths = polygon.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
        const tempZone: Partial<Zone> = {
            id: `custom-poly-${Date.now()}`,
            name: `Zone ${zones.filter(z => z.id.startsWith('custom')).length + 1}`,
            color: '#3b82f6',
            type: 'polygon',
            geometry: { paths: paths as { lat: number, lng: number }[] },
            isActive: true
        };
        saveNewZone(tempZone as Zone, false);
        polygon.setMap(null);
        setDrawingMode(null);
    };

    const handleRectangleComplete = (rectangle: google.maps.Rectangle) => {
        const bounds = rectangle.getBounds();
        if (bounds) {
            const b = bounds.toJSON();
            const tempZone: Partial<Zone> = {
                id: `custom-rect-${Date.now()}`,
                name: `Zone ${zones.filter(z => z.id.startsWith('custom')).length + 1}`,
                color: '#8b5cf6',
                type: 'rectangle',
                geometry: {
                    bounds: { north: b.north, south: b.south, east: b.east, west: b.west }
                },
                isActive: true
            };
            saveNewZone(tempZone as Zone, false);
        }
        rectangle.setMap(null);
        setDrawingMode(null);
    };

    const addHexagonPreset = () => {
        setDrawingMode('hexagon' as any);
    };

    const handleHexagonComplete = (paths: { lat: number, lng: number }[]) => {
        const tempZone: Partial<Zone> = {
            id: `custom-hex-${Date.now()}`,
            name: `Hexagone ${zones.filter(z => z.id.startsWith('custom')).length + 1}`,
            color: '#f59e0b',
            type: 'polygon',
            geometry: { paths },
            isActive: true
        };
        saveNewZone(tempZone as Zone, false);
        setDrawingMode(null);
    };

    const saveNewZone = async (zone: Zone, deselect = true) => {
        try {
            const { id, ...payload } = zone;
            const createdZone = await zoneService.create(payload);
            setZones(prev => [...prev.filter(z => z.id !== id), createdZone]);
            if (deselect) {
                setNewZone(null);
                setIsEditing(false);
                setActiveZone(null);
            } else {
                setNewZone(null);
                setIsEditing(false);
                setActiveZone(createdZone.id);
            }
        } catch (error) {
            console.error('Failed to create zone on server:', error);
            setZones(prev => [...prev, zone]);
        }
    };

    const saveModifiedZone = async (deselect = true) => {
        if (!activeZone || !modifiedZoneData) return;
        if (newZone && activeZone === newZone.id) {
            const updatedNewZone = { ...newZone, ...modifiedZoneData };
            saveNewZone(updatedNewZone, deselect);
            setModifiedZoneData(null);
            return;
        }
        const zoneIndex = zones.findIndex(z => z.id === activeZone);
        if (zoneIndex > -1) {
            setModifiedZoneData(null);
            try {
                const updatedZone = await zoneService.update(activeZone, modifiedZoneData);
                // Update state with server response to ensure consistency
                const updatedZones = [...zones];
                updatedZones[zoneIndex] = {
                    ...updatedZone,
                    assignedDriverIds: updatedZone.assignedDriverIds || updatedZone.drivers?.map((d: any) => d.id) || []
                };
                setZones(updatedZones);
            } catch (error) {
                console.error('Failed to update zone on server:', error);
                // Reload zones from server on error to ensure consistency
                const zonesData = await mockService.getZones();
                setZones(zonesData);
            }
            if (deselect) setActiveZone(null);
        }
    };

    useEffect(() => {
        if (!modifiedZoneData || !activeZone) return;
        const timer = setTimeout(() => {
            saveModifiedZone(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, [modifiedZoneData, activeZone]);

    const cancelEditing = () => {
        setNewZone(null);
        setModifiedZoneData(null);
        setDrawingMode(null);
        setIsEditing(false);
        setActiveZone(null);
    };

    const deleteZone = async (id: string) => {
        try {
            await zoneService.delete(id);
            setZones(prev => prev.filter(z => z.id !== id));
            if (activeZone === id) setActiveZone(null);
            if (zoneDetailId === id) setZoneDetailId(null);
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Failed to delete zone on server:', error);
            setZones(prev => prev.filter(z => z.id !== id));
            setConfirmDeleteId(null);
        }
    };



    const handleZoneClick = (e: any, clickedZoneId: string) => {
        if (!e.latLng) {
            if (clickedZoneId === activeZone) setActiveZone(null);
            else { setActiveZone(clickedZoneId); setActiveDriver(null); }
            return;
        }
        const point = e.latLng;
        const g = (window as any).google;
        const candidates = zones.filter(z => {
            const geom = z.geometry || {};
            if (z.type === 'circle' && geom.center && geom.radiusKm) {
                const center = new g.maps.LatLng(geom.center.lat, geom.center.lng);
                const distance = g.maps.geometry.spherical.computeDistanceBetween(point, center);
                return distance <= (geom.radiusKm * 1000);
            }
            if (z.type === 'polygon' && geom.paths) {
                const path = geom.paths.map((p: any) => new g.maps.LatLng(p.lat, p.lng));
                const poly = new g.maps.Polygon({ paths: path });
                return g.maps.geometry.poly.containsLocation(point, poly);
            }
            if (z.type === 'rectangle' && geom.bounds) {
                const bounds = new g.maps.LatLngBounds(
                    { lat: geom.bounds.south, lng: geom.bounds.west },
                    { lat: geom.bounds.north, lng: geom.bounds.east }
                );
                return bounds.contains(point);
            }
            return false;
        });

        if (candidates.length > 1) {
            const currentIndex = candidates.findIndex(z => z.id === activeZone);
            const nextIndex = (currentIndex + 1) % candidates.length;
            setActiveZone(candidates[nextIndex].id);
            setActiveDriver(null);
        } else {
            if (clickedZoneId === activeZone) setActiveZone(null);
            else { setActiveZone(clickedZoneId); setActiveDriver(null); }
        }
    };

    const toggleDriverAssignment = async (zoneId: string, driverId: string) => {
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;
        const isAssigned = (zone.assignedDriverIds || []).includes(driverId);

        // Optimistic update
        setZones(prev => prev.map(z => {
            if (z.id !== zoneId) return z;
            const current = z.assignedDriverIds || [];
            const newAssigned = isAssigned ? current.filter(id => id !== driverId) : [...current, driverId];
            return { ...z, assignedDriverIds: newAssigned };
        }));

        try {
            if (isAssigned) {
                // Clear the active zone for this driver
                await zoneService.clearActiveZoneETP(driverId);
            } else {
                // Set this zone as active for the driver
                await zoneService.setActiveZoneETP(zoneId, driverId);
            }
        } catch (error) {
            console.error('Failed to toggle assignment:', error);
            // Revert on error
            setZones(prev => prev.map(z => z.id === zoneId ? zone : z));
        }
    };



    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#f4f7fa] dark:bg-slate-950' : 'h-full w-full relative bg-[#f4f7fa] dark:bg-slate-950'} overflow-hidden transition-colors duration-500`}>
            {/* Fullscreen Toggle Button */}
            <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute right-2 md:right-4 z-20 p-2 md:p-2.5 bg-white dark:bg-slate-900/95 backdrop-blur-sm hover:bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-all hover:scale-105"
                style={{ top: isFullscreen ? (windowWidth < 650 ? '12px' : '16px') : `${headerHeight}px` }}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            {/* Location Search Bar */}
            <div
                className="absolute left-1/2 -translate-x-1/2 z-20 w-full pointer-events-auto px-4 transition-all duration-300"
                style={{
                    top: isFullscreen ? (windowWidth < 650 ? '12px' : '16px') : `${headerHeight}px`,
                    maxWidth: windowWidth < 650 ? 'calc(100% - 130px)' : '400px'
                }}
            >
                <LocationSearchBar onLocationSelect={(loc) => {
                    setMapCenter({ lat: loc.lat, lng: loc.lng });
                    setMapZoom(16);
                }} />
            </div>

            <GoogleMap
                center={mapCenter}
                zoom={mapZoom}
                className="w-full h-full"
                onCenterChanged={handleCenterChanged}
                onZoomChanged={handleZoomChanged}
                // @ts-ignore
                theme={theme}
            >
                {zones.map(zone => {
                    if (!showZones && activeZone !== zone.id) return null;
                    if (!zone.isActive && activeZone !== zone.id) return null;
                    const isSelected = activeZone === zone.id;
                    const effectiveZone = isSelected && modifiedZoneData ? { ...zone, ...modifiedZoneData } : zone;
                    const geom = effectiveZone.geometry || {};

                    if (effectiveZone.type === 'circle' && geom.center && geom.radiusKm) {
                        return <Circle key={zone.id} center={geom.center} radius={geom.radiusKm * 1000} fillColor={effectiveZone.color} fillOpacity={isSelected ? 0.35 : (effectiveZone.isActive ? 0.15 : 0.05)} strokeColor={effectiveZone.color} strokeOpacity={effectiveZone.isActive ? 0.8 : 0.3} strokeWeight={isSelected ? 4 : 2} onClick={(e: any) => handleZoneClick(e, zone.id)} draggable={isSelected} editable={isSelected} onEdit={handleZoneEdit} zIndex={isSelected ? 100 : 10} />;
                    }
                    if (effectiveZone.type === 'polygon' && geom.paths) {
                        return <Polygon key={zone.id} paths={geom.paths} fillColor={effectiveZone.color} fillOpacity={isSelected ? 0.35 : (effectiveZone.isActive ? 0.15 : 0.05)} strokeColor={effectiveZone.color} strokeOpacity={effectiveZone.isActive ? 0.8 : 0.3} strokeWeight={isSelected ? 4 : 2} onClick={(e: any) => handleZoneClick(e, zone.id)} draggable={isSelected} editable={isSelected} onEdit={handleZoneEdit} zIndex={isSelected ? 100 : 10} />;
                    }
                    if (effectiveZone.type === 'rectangle' && geom.bounds) {
                        return <Rectangle key={zone.id} bounds={geom.bounds} fillColor={effectiveZone.color} fillOpacity={isSelected ? 0.35 : (effectiveZone.isActive ? 0.15 : 0.05)} strokeColor={effectiveZone.color} strokeOpacity={effectiveZone.isActive ? 0.8 : 0.3} strokeWeight={isSelected ? 4 : 2} onClick={(e: any) => handleZoneClick(e, zone.id)} draggable={isSelected} editable={isSelected} onEdit={handleZoneEdit} zIndex={isSelected ? 100 : 10} />;
                    }
                    return null;
                })}

                {newZone && (
                    <React.Fragment>
                        {newZone.type === 'circle' && newZone.geometry.center && newZone.geometry.radiusKm && (
                            <Circle center={newZone.geometry.center} radius={newZone.geometry.radiusKm * 1000} fillColor={newZone.color} fillOpacity={0.4} strokeColor={newZone.color} strokeWeight={4} editable={true} draggable={true} onEdit={handleZoneEdit} />
                        )}
                        {newZone.type === 'polygon' && newZone.geometry.paths && (
                            <Polygon paths={newZone.geometry.paths} fillColor={newZone.color} fillOpacity={0.4} strokeColor={newZone.color} strokeWeight={4} editable={true} draggable={true} onEdit={handleZoneEdit} />
                        )}
                        {newZone.type === 'rectangle' && newZone.geometry.bounds && (
                            <Rectangle bounds={newZone.geometry.bounds} fillColor={newZone.color} fillOpacity={0.4} strokeColor={newZone.color} strokeWeight={4} editable={true} draggable={true} onEdit={handleZoneEdit} />
                        )}
                    </React.Fragment>
                )}

                {isEditing && <DrawingManager drawingMode={drawingMode === 'hexagon' ? null : drawingMode} onCircleComplete={handleCircleComplete} onPolygonComplete={handlePolygonComplete} onRectangleComplete={handleRectangleComplete} />}

                {isEditing && <HexagonDrawer active={drawingMode === 'hexagon'} onComplete={handleHexagonComplete} />}

                {positions.map((pos) => {
                    const g = typeof window !== 'undefined' ? (window as any).google : null;
                    const icon = g && g.maps && g.maps.SymbolPath ? { path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5, fillColor: activeDriver === pos.driverId ? '#ef4444' : '#10b981', fillOpacity: 1, strokeWeight: 2, strokeColor: '#ffffff', rotation: pos.heading } : undefined;
                    return <Marker key={pos.driverId} position={{ lat: pos.lat, lng: pos.lng }} icon={icon} onClick={() => { if (activeDriver === pos.driverId) setActiveDriver(null); else { setActiveDriver(pos.driverId); setActiveZone(null); } }} />;
                })}
            </GoogleMap>

            {/* Sidebar UI (Left side, Full Height, Glass Style) */}
            <div
                className={`absolute left-2 md:left-4 z-30 transition-all duration-500 ease-in-out ${panelCollapsed ? '-translate-x-[calc(100%+60px)] opacity-0' : 'translate-x-0 opacity-100'}`}
                style={{
                    top: isFullscreen ? (windowWidth < 650 ? '12px' : '24px') : `${headerHeight}px`,
                    bottom: windowWidth < 650 ? '12px' : '24px',
                    right: windowWidth < 650 ? '8px' : 'auto'
                }}
            >
                <div className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[24px] md:rounded-[32px] shadow-2xl border border-white/20 dark:border-slate-800 pointer-events-auto overflow-hidden flex flex-col h-full transition-all duration-500`}
                    style={{ width: windowWidth < 650 ? '100%' : '400px' }}
                >
                    <SidebarHeader isFollowing={isFollowing} onToggleFollow={() => setIsFollowing(!isFollowing)} onClose={() => setPanelCollapsed(!panelCollapsed)}/>
                    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="flex-1 overflow-y-auto p-4 content-scrollbar">
                        <AnimatePresence mode='wait' initial={false}>
                            {activeTab === 'DRIVERS' && (
                                !driverDetailId ? (
                                    <DriverList
                                        drivers={drivers}
                                        positions={positions}
                                        activeDriverId={activeDriver}
                                        onSelectDriver={(id) => {
                                            setActiveDriver(id);
                                            setActiveZone(null);
                                            if (id) setIsFollowing(true);
                                        }}
                                        onOpenDetail={(id) => {
                                            setDriverDetailId(id);
                                            setIsFollowing(true);
                                        }}
                                    />
                                ) : (
                                    <DriverDetail driver={drivers.find(d => d.id === driverDetailId)!} orders={driverOrders} loading={detailsLoading} onBack={() => setDriverDetailId(null)} />
                                )
                            )}

                            {activeTab === 'ZONES' && (
                                (!zoneDetailId || !zones.find(z => z.id === zoneDetailId)) ? (
                                    <ZoneList
                                        zones={zones}
                                        drivers={drivers}
                                        activeZoneId={activeZone}
                                        onSelectZone={(id) => {
                                            setActiveZone(id);
                                            setActiveDriver(null);
                                            if (id) setIsFollowing(true);
                                        }}
                                        onOpenDetail={(id) => {
                                            setZoneDetailId(id);
                                            setIsFollowing(true);
                                        }}
                                        showZones={showZones}
                                        setShowZones={setShowZones}
                                        isEditing={isEditing}
                                        setIsEditing={setIsEditing}
                                        drawingMode={drawingMode}
                                        setDrawingMode={setDrawingMode}
                                        addHexagonPreset={addHexagonPreset}
                                        cancelEditing={cancelEditing}
                                        collapsedSectors={collapsedSectors}
                                        setCollapsedSectors={setCollapsedSectors}
                                        onZoneImported={(newZone) => {
                                            // Add the newly imported zone to the list
                                            setZones(prev => [...prev, newZone]);
                                        }}
                                        onFocusZone={(zone) => {
                                            // Focus map on the zone's center
                                            const geom = zone.geometry;
                                            if (geom.center) {
                                                setMapCenter(geom.center);
                                                setMapZoom(14);
                                            } else if (geom.paths && geom.paths.length > 0) {
                                                // Calculate center of polygon
                                                const avgLat = geom.paths.reduce((sum, p) => sum + p.lat, 0) / geom.paths.length;
                                                const avgLng = geom.paths.reduce((sum, p) => sum + p.lng, 0) / geom.paths.length;
                                                setMapCenter({ lat: avgLat, lng: avgLng });
                                                setMapZoom(14);
                                            } else if (geom.bounds) {
                                                // Calculate center of rectangle
                                                const centerLat = (geom.bounds.north + geom.bounds.south) / 2;
                                                const centerLng = (geom.bounds.east + geom.bounds.west) / 2;
                                                setMapCenter({ lat: centerLat, lng: centerLng });
                                                setMapZoom(14);
                                            }
                                            setIsFollowing(true);
                                        }}
                                    />
                                ) : (
                                    <ZoneDetail
                                        zone={zones.find(z => z.id === zoneDetailId)!}
                                        allDrivers={drivers}
                                        onBack={() => setZoneDetailId(null)}
                                        onEdit={handleZoneEdit}
                                        onDelete={() => setConfirmDeleteId(zoneDetailId)}
                                        onToggleAssignment={(dId) => toggleDriverAssignment(zoneDetailId, dId)}
                                        assignMode={assignMode}
                                        setAssignMode={setAssignMode}
                                        showColorPicker={showColorPicker}
                                        setShowColorPicker={setShowColorPicker}
                                        existingSectors={Array.from(new Set(zones.map(z => z.sector).filter(Boolean))) as string[]}
                                    />
                                )
                            )}

                            {activeTab === 'VEHICLES' && (
                                !vehicleDetailId ? (
                                    <VehicleList
                                        vehicles={vehicles}
                                        activeVehicleId={activeVehicle}
                                        onSelectVehicle={(id) => {
                                            setActiveVehicle(id);
                                            setActiveDriver(null);
                                            setActiveZone(null);
                                            if (id) {
                                                const pos = positions.find(p => p.vehicleId === id);
                                                if (pos) {
                                                    setActiveDriver(pos.driverId);
                                                    setIsFollowing(true);
                                                }
                                            }
                                        }}
                                        onOpenDetail={(id) => {
                                            setVehicleDetailId(id);
                                            setIsFollowing(true);
                                        }}
                                    />
                                ) : (() => {
                                    const vhc = vehicles.find(v => v.id === vehicleDetailId);
                                    if (!vhc) return (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Chargement...</p>
                                        </div>
                                    );
                                    return (
                                        <VehicleDetail
                                            vehicle={vhc}
                                            onBack={() => setVehicleDetailId(null)}
                                        />
                                    );
                                })()
                            )}

                            {activeTab === 'ORDERS' && (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 opacity-50">
                                    <Package size={48} className="mb-2" />
                                    <p className="text-sm font-bold">Prochainement...</p>
                                    <p className="text-[10px] uppercase">Gestion des commandes</p>
                                </div>
                            )}

                            {activeTab === 'VEHICLES' && (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 opacity-50">
                                    <Truck size={48} className="mb-2" />
                                    <p className="text-sm font-bold">Prochainement...</p>
                                    <p className="text-[10px] uppercase">Flotte véhicule</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                
            </div>

            {/* Floating Mobile Toggle (when sidebar is hidden) */}
            {panelCollapsed && (
                <button
                    onClick={() => setPanelCollapsed(false)}
                    className="absolute left-2 md:left-4 z-40 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-800 text-emerald-600 transition-all hover:scale-105 active:scale-95"
                    style={{ top: isFullscreen ? (windowWidth < 650 ? '12px' : '16px') : `${headerHeight}px` }}
                >
                    <Menu size={24} />
                </button>
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900/50 backdrop-blur-sm z-50">
                    <Loader2 className="animate-spin text-emerald-600" size={48} />
                </div>
            )}

            <DeleteConfirmationModal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={() => deleteZone(confirmDeleteId!)} title="Supprimer la zone ?" description="Cette action est irréversible. Toutes les données de cette zone seront perdues." />
        </div>
    );
}
