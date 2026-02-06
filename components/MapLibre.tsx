"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import {
    Map as MapCN,
    MapMarker,
    MarkerContent,
    MapRoute,
    useMap
} from './ui/map';
import MapLibreGL from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

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
}

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
    onClick
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
            onClick={(e: MapLibreGL.MapMouseEvent & any) => {
                if (onClick && e.lngLat) {
                    onClick({ latLng: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
                }
            }}
        >
            {children}
        </MapCN>
    );
};

// --- Marker ---

interface MarkerProps {
    position: LatLng;
    icon?: any;
    label?: string;
    onClick?: () => void;
}

export const Marker: React.FC<MarkerProps> = ({ position, icon, label, onClick }) => {
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
            rotation={rotation}
        >
            <MarkerContent>
                {label && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow text-[10px] font-bold whitespace-nowrap text-gray-700 border border-gray-100">
                        {label}
                    </div>
                )}
                {icon?.path && typeof icon.path === 'string' ? (
                    <div
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
                        style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: color,
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    />
                )}
            </MarkerContent>
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

        const points = 64;
        const km = radius / 1000;
        const ret = [];
        const distanceX = km / (111.32 * Math.cos(center.lat * Math.PI / 180));
        const distanceY = km / 110.574;

        for (let i = 0; i < points; i++) {
            const theta = (i / points) * (2 * Math.PI);
            const x = distanceX * Math.cos(theta);
            const y = distanceY * Math.sin(theta);
            ret.push([center.lng + x, center.lat + y]);
        }
        ret.push(ret[0]);

        map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [ret as [number, number][]]
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
            map.off('click', layerId, handleClick);
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
        };
    }, [map, isLoaded, center, radius, fillColor, fillOpacity, strokeColor, strokeWeight]);

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
        if (!isLoaded || !map || !paths || !Array.isArray(paths) || paths.length < 3) return;

        const coordinates = paths.map(p => [p.lng, p.lat]);
        coordinates.push(coordinates[0]);

        map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coordinates as [number, number][]]
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
            map.off('click', layerId, handleClick);
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
        };
    }, [map, isLoaded, paths, fillColor, fillOpacity, strokeColor, strokeWeight]);

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
    return <MapRoute coordinates={coords} color={color || strokeColor} width={width || strokeWeight || 3} />;
};

// --- Drawing Manager ---

export const DrawingManager: React.FC<{
    drawingMode: string | null;
    onCircleComplete?: (circle: any) => void;
    onPolygonComplete?: (polygon: any) => void;
    onRectangleComplete?: (rectangle: any) => void;
}> = ({ drawingMode, onCircleComplete, onPolygonComplete, onRectangleComplete }) => {
    const { map, isLoaded } = useMap();
    const drawRef = useRef<MapboxDraw | null>(null);

    useEffect(() => {
        if (!isLoaded || !map) return;

        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            },
            defaultMode: 'simple_select'
        });

        map.addControl(draw as any);
        drawRef.current = draw;

        const handleCreate = (e: any) => {
            const feature = e.features[0];
            if (feature.geometry.type === 'Polygon') {
                const paths = feature.geometry.coordinates[0].map((coord: any) => ({
                    lat: coord[1],
                    lng: coord[0]
                }));

                if (onPolygonComplete) {
                    onPolygonComplete({
                        getPath: () => ({
                            getArray: () => paths.map((p: any) => ({ lat: () => p.lat, lng: () => p.lng }))
                        }),
                        setMap: () => { }
                    });
                }
            }
        };

        map.on('draw.create', handleCreate);

        return () => {
            map.off('draw.create', handleCreate);
            map.removeControl(draw as any);
        };
    }, [map, isLoaded]);

    useEffect(() => {
        if (drawRef.current) {
            if (drawingMode === 'polygon') {
                drawRef.current.changeMode('draw_polygon');
            } else if (drawingMode === null) {
                drawRef.current.changeMode('simple_select');
            }
        }
    }, [drawingMode]);

    return null;
};

export const HexagonDrawer: React.FC<any> = () => {
    return null;
};
