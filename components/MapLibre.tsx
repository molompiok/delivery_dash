"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map as MapCN,
    MapMarker,
    MarkerContent,
    MarkerPopup,
    MapRoute,
    useMap
} from './ui/map';

export { useMap };
import MapLibreGL from 'maplibre-gl';
import Supercluster from 'supercluster';

// Types to match Google Maps API as used in the project
export interface LatLng {
    lat: number;
    lng: number;
}

interface MapLibreProps {
    center?: LatLng;
    zoom?: number;
    bounds?: LatLng[];
    children?: React.ReactNode;
    className?: string;
    styles?: any[];
    onCenterChanged?: (center: LatLng) => void;
    onZoomChanged?: (zoom: number) => void;
    onClick?: (e: { latLng: LatLng }) => void;
    cursor?: string;
    projection?: 'mercator' | 'globe';
    rotateOnLowZoom?: boolean;
}

/**
 * Automatically rotates the map when zoom is low (Globe view)
 */
const GlobeRotationEffect: React.FC<{ enabled: boolean }> = ({ enabled }) => {
    const { map, isLoaded } = useMap();
    const rotationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isLoaded || !map || !enabled) {
            if (rotationRef.current) {
                cancelAnimationFrame(rotationRef.current);
                rotationRef.current = null;
            }
            return;
        }

        const rotate = () => {
            if (!map || map.isMoving()) {
                rotationRef.current = requestAnimationFrame(rotate);
                return;
            }

            const zoom = map.getZoom();
            if (zoom < 4) {
                const center = map.getCenter();
                // Rotate longitude slowly (0.5 degree per frame/request roughly)
                // MapLibre handleWorldCopies must be true for seamless transition
                map.setCenter([center.lng + 0.05, center.lat], { animate: false });
            }

            rotationRef.current = requestAnimationFrame(rotate);
        };

        rotationRef.current = requestAnimationFrame(rotate);

        return () => {
            if (rotationRef.current) {
                cancelAnimationFrame(rotationRef.current);
                rotationRef.current = null;
            }
        };
    }, [map, isLoaded, enabled]);

    return null;
};

/**
 * Compatibility wrapper for MapLibre that mimics the GoogleMap component API.
 */
export const MapLibre: React.FC<MapLibreProps> = ({
    center,
    zoom,
    children,
    className,
    onCenterChanged,
    onZoomChanged,
    onClick,
    ...props
}) => {
    const viewport = useMemo(() => {
        if (!center) return undefined;
        return {
            center: [center.lng, center.lat] as [number, number],
            zoom: zoom ?? 13
        };
    }, [center, zoom]);

    const handleViewportChange = (v: { center: [number, number]; zoom: number }) => {
        if (onCenterChanged) {
            onCenterChanged({ lat: v.center[1], lng: v.center[0] });
        }
        if (onZoomChanged) {
            onZoomChanged(v.zoom);
        }
    };

    return (
        <MapCN
            className={className}
            viewport={viewport}
            onViewportChange={handleViewportChange}
            projection={props.projection ? { type: props.projection } : { type: 'globe' }}
            // @ts-ignore
            cursor={props.cursor}
        >
            <MapClickInterceptor onClick={onClick} />
            <GlobeRotationEffect enabled={props.rotateOnLowZoom !== false} />
            {children}
        </MapCN>
    );
};

const MapClickInterceptor: React.FC<{ onClick?: (e: { latLng: LatLng }) => void }> = ({ onClick }) => {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!isLoaded || !map || !onClick) return;

        const handleClick = (e: MapLibreGL.MapMouseEvent) => {
            // Check if any OF OUR features were hit (points, lines, polygons)
            const features = map.queryRenderedFeatures(e.point);
            const hasOurFeature = features.some(f =>
                f.layer.id.startsWith('route-layer') ||
                f.layer.id.startsWith('poly-layer') ||
                f.layer.id.startsWith('circle-layer')
            );
            if (hasOurFeature) return;

            onClick({ latLng: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
        };

        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [map, isLoaded, onClick]);

    return null;
};

export { MarkerPopup, MapMarker, MarkerContent };

// --- Marker ---

interface MarkerProps {
    position: LatLng;
    icon?: any;
    label?: React.ReactNode;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isBouncing?: boolean;
    children?: React.ReactNode;
}

export const Marker: React.FC<MarkerProps> = ({ position, icon, label, onClick, onMouseEnter, onMouseLeave, isBouncing, children }) => {
    if (!position) return null;
    const color = icon?.fillColor || (icon?.path === 0 ? '#ef4444' : '#3b82f6');
    const rotation = icon?.rotation || 0;

    return (
        <MapMarker
            longitude={position.lng}
            latitude={position.lat}
            onClick={(e: any) => {
                e.stopPropagation();
                onClick?.();
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            rotation={rotation}
        >
            <MarkerContent>
                {label && (
                    <div className={`absolute ${icon === null ? 'top-1/2 -translate-y-1/2' : 'bottom-8'} left-1/2 -translate-x-1/2 z-10`}>
                        {label}
                    </div>
                )}
                {icon !== null && (
                    icon?.path && typeof icon.path === 'string' ? (
                        <div
                            className={isBouncing ? 'animate-marker-bounce' : ''}
                            style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: color,
                                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                                transform: `rotate(${rotation}deg)`,
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        />
                    ) : (
                        <div
                            className={`group relative flex items-center justify-center ${isBouncing ? 'animate-marker-bounce' : ''}`}
                        >
                            <div
                                className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95"
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill={color} stroke="white" strokeWidth="2" />
                                    <circle cx="12" cy="10" r="3" fill="white" />
                                </svg>
                            </div>
                        </div>
                    )
                )}
            </MarkerContent>
            {children}
        </MapMarker>
    );
};

// --- Circle ---

interface CircleProps {
    center: LatLng;
    radius: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    onClick?: (e: any) => void;
    onEdit?: (data: { radius?: number; center?: LatLng }) => void;
    editable?: boolean;
    draggable?: boolean;
    zIndex?: number;
}

export const Circle: React.FC<CircleProps> = ({
    center,
    radius,
    fillColor = '#3b82f6',
    fillOpacity = 0.2,
    strokeColor = '#3b82f6',
    strokeWeight = 2,
    onClick
}) => {
    const { map, isLoaded } = useMap();
    const id = React.useId().replace(/:/g, '');
    const sourceId = `circle-source-${id}`;
    const layerId = `circle-layer-${id}`;
    const strokeLayerId = `circle-stroke-${id}`;

    useEffect(() => {
        if (!isLoaded || !map) return;

        map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[]]
                },
                properties: {}
            }
        });

        map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': fillColor,
                'fill-opacity': fillOpacity
            }
        });

        map.addLayer({
            id: strokeLayerId,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': strokeColor,
                'line-width': strokeWeight
            }
        });

        const handleClick = (e: any) => {
            if (onClick) onClick({ latLng: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
        };

        map.on('click', layerId, handleClick);

        return () => {
            try {
                if (map) {
                    map.off('click', layerId, handleClick);
                    if (map.getStyle()) {
                        if (map.getLayer(layerId)) map.removeLayer(layerId);
                        if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);
                        if (map.getSource(sourceId)) map.removeSource(sourceId);
                    }
                }
            } catch (err) {
                console.warn('Error during Circle cleanup:', err);
            }
        };
    }, [map, isLoaded, sourceId, layerId]);

    useEffect(() => {
        if (!isLoaded || !map || !map.getSource(sourceId)) return;

        const pointsCount = 64;
        const km = radius / 1000;
        const ret = [];
        const distanceX = km / (111.32 * Math.cos(center.lat * Math.PI / 180));
        const distanceY = km / 110.574;

        for (let i = 0; i < pointsCount; i++) {
            const theta = (i / pointsCount) * (2 * Math.PI);
            const x = distanceX * Math.cos(theta);
            const y = distanceY * Math.sin(theta);
            ret.push([center.lng + x, center.lat + y]);
        }
        ret.push(ret[0]);

        const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
        source.setData({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [ret as [number, number][]]
            },
            properties: {}
        });
    }, [map, isLoaded, center, radius, sourceId]);

    useEffect(() => {
        if (!isLoaded || !map || !map.getLayer(layerId)) return;
        map.setPaintProperty(layerId, 'fill-color', fillColor);
        map.setPaintProperty(layerId, 'fill-opacity', fillOpacity);
        map.setPaintProperty(strokeLayerId, 'line-color', strokeColor);
        map.setPaintProperty(strokeLayerId, 'line-width', strokeWeight);
    }, [map, isLoaded, layerId, strokeLayerId, fillColor, fillOpacity, strokeColor, strokeWeight]);

    return null;
};

// --- Polygon ---

interface PolygonProps {
    paths: LatLng[];
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    onClick?: (e: any) => void;
    onEdit?: (data: { paths: LatLng[] }) => void;
    editable?: boolean;
    draggable?: boolean;
    zIndex?: number;
}

export const Polygon: React.FC<PolygonProps> = ({
    paths,
    fillColor = '#3b82f6',
    fillOpacity = 0.2,
    strokeColor = '#3b82f6',
    strokeWeight = 2,
    onClick
}) => {
    const { map, isLoaded } = useMap();
    const id = React.useId().replace(/:/g, '');
    const sourceId = `poly-source-${id}`;
    const layerId = `poly-layer-${id}`;
    const strokeLayerId = `poly-stroke-${id}`;

    useEffect(() => {
        if (!isLoaded || !map) return;

        map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[]]
                },
                properties: {}
            }
        });

        map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': fillColor,
                'fill-opacity': fillOpacity
            }
        });

        map.addLayer({
            id: strokeLayerId,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': strokeColor,
                'line-width': strokeWeight
            }
        });

        const handleClick = (e: any) => {
            if (onClick) onClick({ latLng: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
        };

        map.on('click', layerId, handleClick);

        return () => {
            try {
                if (map) {
                    map.off('click', layerId, handleClick);
                    if (map.getStyle()) {
                        if (map.getLayer(layerId)) map.removeLayer(layerId);
                        if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);
                        if (map.getSource(sourceId)) map.getSource(sourceId) && map.removeSource(sourceId);
                    }
                }
            } catch (err) {
                console.warn('Error during Polygon cleanup:', err);
            }
        };
    }, [map, isLoaded, sourceId, layerId]);

    useEffect(() => {
        if (!isLoaded || !map || !map.getSource(sourceId) || !paths || paths.length < 3) return;

        const coordinates = paths.map(p => [p.lng, p.lat]);
        coordinates.push(coordinates[0]);

        const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
        source.setData({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates as [number, number][]]
            },
            properties: {}
        });
    }, [map, isLoaded, paths, sourceId]);

    useEffect(() => {
        if (!isLoaded || !map || !map.getLayer(layerId)) return;
        map.setPaintProperty(layerId, 'fill-color', fillColor);
        map.setPaintProperty(layerId, 'fill-opacity', fillOpacity);
        map.setPaintProperty(strokeLayerId, 'line-color', strokeColor);
        map.setPaintProperty(strokeLayerId, 'line-width', strokeWeight);
    }, [map, isLoaded, layerId, strokeLayerId, fillColor, fillOpacity, strokeColor, strokeWeight]);

    return null;
};

// --- Rectangle ---

interface RectangleProps {
    bounds: { north: number; south: number; east: number; west: number };
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    onClick?: (e: any) => void;
    onEdit?: (data: { bounds: any }) => void;
    editable?: boolean;
    draggable?: boolean;
    zIndex?: number;
}

export const Rectangle: React.FC<RectangleProps> = ({
    bounds,
    fillColor = '#3b82f6',
    fillOpacity = 0.2,
    strokeColor = '#3b82f6',
    strokeWeight = 2,
    onClick
}) => {
    const paths = useMemo(() => [
        { lat: bounds.north, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east },
        { lat: bounds.south, lng: bounds.east },
        { lat: bounds.south, lng: bounds.west },
    ], [bounds]);

    return <Polygon paths={paths} fillColor={fillColor} fillOpacity={fillOpacity} strokeColor={strokeColor} strokeWeight={strokeWeight} onClick={onClick} />;
};

// --- Polyline ---

export const Polyline: React.FC<{
    path?: LatLng[],
    paths?: LatLng[],
    color?: string,
    strokeColor?: string,
    width?: number,
    strokeWeight?: number,
    strokeOpacity?: number
}> = ({ path, paths, color, strokeColor, width, strokeWeight }) => {
    const actualPath = path || paths;
    if (!actualPath || !Array.isArray(actualPath)) return null;

    const coords = actualPath.map(p => [p.lng, p.lat] as [number, number]);
    return <MapRoute coordinates={coords} color={color || strokeColor} width={width || strokeWeight || 3} interactive={false} />;
};

// --- Drawing Manager ---

export const DrawingManager: React.FC<{
    drawingMode: 'circle' | 'rectangle' | 'polygon' | 'hexagon' | null;
    onCircleComplete?: (data: { center: LatLng; radius: number }) => void;
    onPolygonComplete?: (data: { paths: LatLng[] }) => void;
    onRectangleComplete?: (data: { bounds: { north: number; south: number; east: number; west: number } }) => void;
    onHexagonComplete?: (paths: LatLng[]) => void;
}> = ({ drawingMode, onCircleComplete, onPolygonComplete, onRectangleComplete, onHexagonComplete }) => {
    const { map, isLoaded } = useMap();
    const [points, setPoints] = useState<LatLng[]>([]);
    const [mousePos, setMousePos] = useState<LatLng | null>(null);
    const [center, setCenter] = useState<LatLng | null>(null);

    // Cleanup when mode changes
    useEffect(() => {
        setPoints([]);
        setMousePos(null);
        setCenter(null);
    }, [drawingMode]);

    useEffect(() => {
        if (!isLoaded || !map || !drawingMode) return;

        const canvas = map.getCanvas();
        const originalCursor = canvas.style.cursor;
        canvas.style.cursor = 'crosshair';

        const handleClick = (e: any) => {
            const latLng = { lat: e.lngLat.lat, lng: e.lngLat.lng };

            if (drawingMode === 'polygon') {
                setPoints(prev => [...prev, latLng]);
            } else if (drawingMode === 'circle') {
                if (!center) {
                    setCenter(latLng);
                } else {
                    const radiusMeters = getDistance(center, latLng);
                    onCircleComplete?.({ center, radius: radiusMeters });
                    setCenter(null);
                }
            } else if (drawingMode === 'rectangle') {
                if (!center) {
                    setCenter(latLng);
                } else {
                    onRectangleComplete?.({
                        bounds: {
                            north: Math.max(center.lat, latLng.lat),
                            south: Math.min(center.lat, latLng.lat),
                            east: Math.max(center.lng, latLng.lng),
                            west: Math.min(center.lng, latLng.lng)
                        }
                    });
                    setCenter(null);
                }
            } else if (drawingMode === 'hexagon') {
                if (!center) {
                    setCenter(latLng);
                } else {
                    const radiusMeters = getDistance(center, latLng);
                    const hexPoints = calculateHexagonPoints(center, radiusMeters);
                    onHexagonComplete?.(hexPoints);
                    setCenter(null);
                }
            }
        };

        const handleMouseMove = (e: any) => {
            setMousePos({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        };

        const handleDblClick = (e: any) => {
            if (drawingMode === 'polygon' && points.length >= 2) {
                e.preventDefault();
                onPolygonComplete?.({ paths: [...points] });
                setPoints([]);
            }
        };

        map.on('click', handleClick);
        map.on('mousemove', handleMouseMove);
        map.on('dblclick', handleDblClick);

        return () => {
            canvas.style.cursor = originalCursor;
            map.off('click', handleClick);
            map.off('mousemove', handleMouseMove);
            map.off('dblclick', handleDblClick);
        };
    }, [map, isLoaded, drawingMode, points, center]);

    if (!isLoaded || !map || !drawingMode) return null;

    return (
        <>
            {/* Polygon Preview */}
            {drawingMode === 'polygon' && points.length > 0 && (
                <Polyline
                    paths={mousePos ? [...points, mousePos] : points}
                    color="#3b82f6"
                    width={2}
                />
            )}
            {drawingMode === 'polygon' && points.length >= 2 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-lg z-50 animate-bounce">
                    Double-cliquez pour terminer
                </div>
            )}

            {/* Circle Preview */}
            {drawingMode === 'circle' && center && mousePos && (
                <Circle
                    center={center}
                    radius={getDistance(center, mousePos)}
                    fillColor="#10b981"
                    fillOpacity={0.2}
                    strokeColor="#10b981"
                />
            )}

            {/* Rectangle Preview */}
            {drawingMode === 'rectangle' && center && mousePos && (
                <Rectangle
                    bounds={{
                        north: Math.max(center.lat, mousePos.lat),
                        south: Math.min(center.lat, mousePos.lat),
                        east: Math.max(center.lng, mousePos.lng),
                        west: Math.min(center.lng, mousePos.lng)
                    }}
                    fillColor="#8b5cf6"
                    fillOpacity={0.2}
                    strokeColor="#8b5cf6"
                />
            )}

            {/* Hexagon Preview */}
            {drawingMode === 'hexagon' && center && mousePos && (
                <Polygon
                    paths={calculateHexagonPoints(center, getDistance(center, mousePos))}
                    fillColor="#f59e0b"
                    fillOpacity={0.2}
                    strokeColor="#f59e0b"
                />
            )}
        </>
    );
};

// --- Helper Functions ---

function getDistance(p1: LatLng, p2: LatLng): number {
    const R = 6371e3; // metres
    const φ1 = p1.lat * Math.PI / 180;
    const φ2 = p2.lat * Math.PI / 180;
    const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
    const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function calculateHexagonPoints(center: LatLng, radiusMeters: number): LatLng[] {
    const points: LatLng[] = [];
    const radiusKm = radiusMeters / 1000;

    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * (Math.PI / 180);
        const lat = center.lat + (radiusKm / 111) * Math.sin(angle);
        const lng = center.lng + (radiusKm / (111 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(angle);
        points.push({ lat, lng });
    }

    return points;
}

export const HexagonDrawer: React.FC<any> = () => {
    return null;
};

// --- Marker Clusterer ---

export interface ClusterPoint {
    lat: number;
    lng: number;
    id: string | number;
    properties?: any;
}

interface MarkerClustererProps {
    points: ClusterPoint[];
    children: (clusters: any[], supercluster: Supercluster, map: any) => React.ReactNode;
    radius?: number;
    maxZoom?: number;
}

export const MarkerClusterer: React.FC<MarkerClustererProps> = ({
    points,
    children,
    radius = 50,
    maxZoom = 16
}) => {
    const { map, isLoaded } = useMap();
    const [bounds, setBounds] = React.useState<any>(null);
    const [zoom, setZoom] = React.useState<number>(12);

    const supercluster = useMemo(() => {
        const index = new Supercluster({
            radius,
            maxZoom
        });

        index.load(points.map(p => ({
            type: 'Feature' as const,
            properties: { ...p.properties, pointId: p.id },
            geometry: {
                type: 'Point' as const,
                coordinates: [p.lng, p.lat]
            }
        })));

        return index;
    }, [points, radius, maxZoom]);

    useEffect(() => {
        if (!map || !isLoaded) return;

        const update = () => {
            const b = map.getBounds();
            setBounds([
                b.getWest(),
                b.getSouth(),
                b.getEast(),
                b.getNorth()
            ]);
            setZoom(map.getZoom());
        };

        map.on('moveend', update);
        update();

        return () => {
            map.off('moveend', update);
        };
    }, [map, isLoaded]);

    const clusters = useMemo(() => {
        if (!bounds) return [];
        return supercluster.getClusters(bounds, Math.floor(zoom));
    }, [supercluster, bounds, zoom]);

    return (
        <>
            {children(clusters, supercluster, map)}
        </>
    );
};
