/* global google */
import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

import client from '../api/client';

interface GoogleMapProps {
    center?: google.maps.LatLngLiteral;
    zoom?: number;
    bounds?: google.maps.LatLngLiteral[];
    children?: React.ReactNode;
    className?: string;
    styles?: google.maps.MapTypeStyle[];
    onCenterChanged?: (center: google.maps.LatLngLiteral) => void;
    onZoomChanged?: (zoom: number) => void;
    onClick?: (e: google.maps.MapMouseEvent) => void;
}

const MapComponent: React.FC<GoogleMapProps> = ({ center, zoom, bounds, children, className, styles, onCenterChanged, onZoomChanged, onClick }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map>();

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (ref.current && !map && g && g.maps) {
            const mapInstance = new g.maps.Map(ref.current, {
                center,
                zoom,
                styles: styles || [
                    {
                        "featureType": "all",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
                    },
                    {
                        "featureType": "administrative.country",
                        "elementType": "geometry",
                        "stylers": [{ "visibility": "on" }]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#f5f5f5" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#c9c9c9" }]
                    }
                ],
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: 'greedy',
            });
            setMap(mapInstance);
        }
    }, [ref, map]);

    // Update styles when prop changes
    useEffect(() => {
        if (map && styles) {
            map.setOptions({ styles });
        }
    }, [map, styles]);

    // Use bounds to fit the map if provided
    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (map && g && bounds && bounds.length > 0) {
            const b = new g.maps.LatLngBounds();
            bounds.forEach(p => b.extend(p));
            map.fitBounds(b, { top: 50, bottom: 50, left: 50, right: 50 });
        }
    }, [map, bounds]);

    // Update center and zoom when props change
    useEffect(() => {
        if (map) {
            if (center) map.panTo(center);
            if (zoom !== undefined) map.setZoom(zoom);
        }
    }, [map, center, zoom]);

    // Attach listeners for center and zoom changes
    useEffect(() => {
        if (map) {
            const listeners: google.maps.MapsEventListener[] = [];

            const handleIdle = () => {
                if (onCenterChanged) {
                    const c = map.getCenter();
                    if (c) {
                        onCenterChanged({ lat: c.lat(), lng: c.lng() });
                    }
                }
                if (onZoomChanged) {
                    const z = map.getZoom();
                    if (z !== undefined) {
                        onZoomChanged(z);
                    }
                }
            };

            if (onCenterChanged || onZoomChanged) {
                listeners.push(map.addListener('idle', handleIdle));
            }

            if (onClick) {
                listeners.push(map.addListener('click', onClick));
            }

            return () => {
                listeners.forEach(l => google.maps.event.removeListener(l));
            };
        }
    }, [map, onCenterChanged, onZoomChanged]);

    return (
        <div ref={ref} className={className} style={{ width: '100%', height: '100%' }}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { map });
                }
            })}
        </div>
    );
};

export const Marker: React.FC<google.maps.MarkerOptions & { map?: google.maps.Map, onClick?: (e: google.maps.MapMouseEvent) => void }> = ({ onClick, ...options }) => {
    const [marker, setMarker] = useState<google.maps.Marker>();

    useEffect(() => {
        if (!marker) {
            setMarker(new google.maps.Marker());
        }

        // remove marker from map on unmount
        return () => {
            if (marker) {
                marker.setMap(null);
            }
        };
    }, [marker]);

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (marker && g && g.maps) {
            marker.setOptions(options);

            if (onClick) {
                const listener = marker.addListener('click', onClick);
                return () => g.maps.event.removeListener(listener);
            }
        }
    }, [marker, options, onClick]);

    return null;
};

export const Polygon: React.FC<google.maps.PolygonOptions & { map?: google.maps.Map, onClick?: (e: google.maps.MapMouseEvent) => void, onEdit?: (e: any) => void }> = ({ map, onClick, onEdit, ...options }) => {
    const [polygon, setPolygon] = useState<google.maps.Polygon>();

    useEffect(() => {
        if (!polygon) {
            setPolygon(new google.maps.Polygon());
        }

        return () => {
            if (polygon) {
                polygon.setMap(null);
            }
        };
    }, [polygon]);

    useEffect(() => {
        if (polygon && map) {
            polygon.setMap(map);
        }
    }, [polygon, map]);

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (polygon && g && g.maps) {
            polygon.setOptions(options);

            const listeners: google.maps.MapsEventListener[] = [];

            if (onClick) {
                listeners.push(polygon.addListener('click', onClick));
            }

            if (onEdit) {
                // Polygon editing is complex (paths, insert_at, set_at, remove_at)
                // We simplify by listening to any path change
                const path = polygon.getPath();
                const updatePath = () => {
                    const newPath = path.getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
                    onEdit({ paths: newPath });
                };

                listeners.push(path.addListener('set_at', updatePath));
                listeners.push(path.addListener('insert_at', updatePath));
                listeners.push(path.addListener('remove_at', updatePath));
                listeners.push(polygon.addListener('dragend', updatePath));
            }

            return () => {
                listeners.forEach(l => g.maps.event.removeListener(l));
            };
        }
    }, [polygon, options, onClick, onEdit]);

    return null;
};

export const Circle: React.FC<google.maps.CircleOptions & { map?: google.maps.Map, onClick?: (e: google.maps.MapMouseEvent) => void, onEdit?: (e: any) => void }> = ({ map, onClick, onEdit, ...options }) => {
    const [circle, setCircle] = useState<google.maps.Circle>();

    useEffect(() => {
        if (!circle) {
            setCircle(new google.maps.Circle());
        }

        return () => {
            if (circle) {
                circle.setMap(null);
            }
        };
    }, [circle]);

    useEffect(() => {
        if (circle && map) {
            circle.setMap(map);
        }
    }, [circle, map]);

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (circle && g && g.maps) {
            circle.setOptions(options);

            const listeners: google.maps.MapsEventListener[] = [];

            if (onClick) {
                listeners.push(circle.addListener('click', onClick));
            }

            if (onEdit) {
                listeners.push(circle.addListener('radius_changed', () => {
                    onEdit({ radius: circle.getRadius() });
                }));
                listeners.push(circle.addListener('center_changed', () => {
                    const center = circle.getCenter();
                    if (center) onEdit({ center: { lat: center.lat(), lng: center.lng() } });
                }));
            }

            return () => {
                listeners.forEach(l => g.maps.event.removeListener(l));
            };
        }
    }, [circle, options, onClick, onEdit]);

    return null;
};

export const Rectangle: React.FC<google.maps.RectangleOptions & { map?: google.maps.Map, onClick?: (e: google.maps.MapMouseEvent) => void, onEdit?: (e: any) => void }> = ({ map, onClick, onEdit, ...options }) => {
    const [rectangle, setRectangle] = useState<google.maps.Rectangle>();

    useEffect(() => {
        if (!rectangle) {
            setRectangle(new google.maps.Rectangle());
        }

        return () => {
            if (rectangle) {
                rectangle.setMap(null);
            }
        };
    }, [rectangle]);

    useEffect(() => {
        if (rectangle && map) {
            rectangle.setMap(map);
        }
    }, [rectangle, map]);

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (rectangle && g && g.maps) {
            rectangle.setOptions(options);

            const listeners: google.maps.MapsEventListener[] = [];

            if (onClick) {
                listeners.push(rectangle.addListener('click', onClick));
            }

            if (onEdit) {
                listeners.push(rectangle.addListener('bounds_changed', () => {
                    const bounds = rectangle.getBounds();
                    if (bounds) {
                        const b = bounds.toJSON();
                        onEdit({ bounds: { north: b.north, south: b.south, east: b.east, west: b.west } });
                    }
                }));
            }

            return () => {
                listeners.forEach(l => g.maps.event.removeListener(l));
            };
        }
    }, [rectangle, options, onClick, onEdit]);

    return null;
};

export const Polyline: React.FC<google.maps.PolylineOptions & { map?: google.maps.Map }> = ({ map, ...options }) => {
    const [polyline, setPolyline] = useState<google.maps.Polyline>();

    useEffect(() => {
        if (!polyline) {
            setPolyline(new google.maps.Polyline());
        }

        return () => {
            if (polyline) {
                polyline.setMap(null);
            }
        };
    }, [polyline]);

    useEffect(() => {
        if (polyline && map) {
            polyline.setMap(map);
        }
    }, [polyline, map]);

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (polyline && g && g.maps) {
            polyline.setOptions(options);
        }
    }, [polyline, options]);

    return null;
};

export const DrawingManager: React.FC<{
    map?: google.maps.Map,
    drawingMode?: google.maps.drawing.OverlayType | null,
    onCircleComplete?: (circle: google.maps.Circle) => void,
    onPolygonComplete?: (polygon: google.maps.Polygon) => void,
    onRectangleComplete?: (rectangle: google.maps.Rectangle) => void
}> = ({ map, drawingMode, onCircleComplete, onPolygonComplete, onRectangleComplete }) => {
    const [manager, setManager] = useState<google.maps.drawing.DrawingManager>();

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (!manager && g && g.maps && g.maps.drawing) {
            const m = new g.maps.drawing.DrawingManager({
                drawingControl: false, // We'll control it from our UI
                circleOptions: {
                    fillColor: '#10b981',
                    fillOpacity: 0.3,
                    strokeWeight: 2,
                    clickable: true,
                    editable: true,
                    zIndex: 1,
                },
                polygonOptions: {
                    fillColor: '#3b82f6',
                    fillOpacity: 0.3,
                    strokeWeight: 2,
                    clickable: true,
                    editable: true,
                    zIndex: 1,
                },
                rectangleOptions: {
                    fillColor: '#8b5cf6',
                    fillOpacity: 0.3,
                    strokeWeight: 2,
                    clickable: true,
                    editable: true,
                    zIndex: 1,
                }
            });
            setManager(m);
        }

        return () => {
            if (manager) {
                manager.setMap(null);
            }
        };
    }, [manager]);

    useEffect(() => {
        if (manager && map) {
            manager.setMap(map);
        }
    }, [manager, map]);

    useEffect(() => {
        if (manager) {
            manager.setDrawingMode(drawingMode || null);
        }
    }, [manager, drawingMode]);

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (manager && g && g.maps) {
            const circleListener = g.maps.event.addListener(manager, 'circlecomplete', (circle: google.maps.Circle) => {
                if (onCircleComplete) onCircleComplete(circle);
            });
            const polyListener = g.maps.event.addListener(manager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
                if (onPolygonComplete) onPolygonComplete(polygon);
            });
            const rectListener = g.maps.event.addListener(manager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
                if (onRectangleComplete) onRectangleComplete(rectangle);
            });

            return () => {
                g.maps.event.removeListener(circleListener);
                g.maps.event.removeListener(polyListener);
                g.maps.event.removeListener(rectListener);
            };
        }
    }, [manager, onCircleComplete, onPolygonComplete, onRectangleComplete]);

    return null;
};

export const HexagonDrawer: React.FC<{
    map?: google.maps.Map,
    active?: boolean,
    onComplete?: (paths: { lat: number, lng: number }[]) => void
}> = ({ map, active, onComplete }) => {
    const [centerPoint, setCenterPoint] = useState<google.maps.LatLng | null>(null);
    const previewPolygonRef = useRef<google.maps.Polygon | null>(null);

    // Calculate hexagon points from center and radius
    const calculateHexagonPoints = (center: google.maps.LatLng, radiusMeters: number): google.maps.LatLng[] => {
        const points: google.maps.LatLng[] = [];
        const radiusKm = radiusMeters / 1000;

        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * (Math.PI / 180);
            const lat = center.lat() + (radiusKm / 111) * Math.sin(angle);
            const lng = center.lng() + (radiusKm / (111 * Math.cos(center.lat() * Math.PI / 180))) * Math.cos(angle);
            points.push(new google.maps.LatLng(lat, lng));
        }

        return points;
    };

    // Change cursor when active
    useEffect(() => {
        if (!map) return;

        const mapDiv = map.getDiv();
        if (active) {
            mapDiv.style.setProperty('cursor', 'crosshair', 'important');
        } else {
            mapDiv.style.removeProperty('cursor');
        }

        return () => {
            mapDiv.style.removeProperty('cursor');
        };
    }, [map, active]);

    useEffect(() => {
        const g = typeof window !== 'undefined' ? (window as any).google : null;
        if (!map || !active || !g || !g.maps) return;

        const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;

            if (!centerPoint) {
                // First click: set center
                setCenterPoint(e.latLng);
            } else {
                // Second click: finalize hexagon
                const distance = g.maps.geometry.spherical.computeDistanceBetween(centerPoint, e.latLng);
                const hexPoints = calculateHexagonPoints(centerPoint, distance);

                if (onComplete) {
                    onComplete(hexPoints.map(p => ({ lat: p.lat(), lng: p.lng() })));
                }

                // Cleanup
                if (previewPolygonRef.current) {
                    previewPolygonRef.current.setMap(null);
                    previewPolygonRef.current = null;
                }
                setCenterPoint(null);
            }
        });

        const mouseMoveListener = map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
            if (!centerPoint || !e.latLng) return;

            // Calculate distance from center to cursor
            const distance = g.maps.geometry.spherical.computeDistanceBetween(centerPoint, e.latLng);
            const hexPoints = calculateHexagonPoints(centerPoint, distance);

            // Update or create preview polygon
            if (!previewPolygonRef.current) {
                previewPolygonRef.current = new g.maps.Polygon({
                    paths: hexPoints,
                    fillColor: '#f59e0b',
                    fillOpacity: 0.3,
                    strokeColor: '#f59e0b',
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 1000,
                    map: map
                });
            } else {
                // Update the path
                const currentPath = previewPolygonRef.current.getPath();
                currentPath.clear();
                hexPoints.forEach(point => currentPath.push(point));
            }
        });

        return () => {
            g.maps.event.removeListener(clickListener);
            g.maps.event.removeListener(mouseMoveListener);
        };
    }, [map, active, centerPoint, onComplete]);

    // Cleanup when deactivated
    useEffect(() => {
        if (!active) {
            if (previewPolygonRef.current) {
                previewPolygonRef.current.setMap(null);
                previewPolygonRef.current = null;
            }
            setCenterPoint(null);
        }
    }, [active]);

    return null;
};

const render = (status: Status) => {
    if (status === Status.LOADING) return (
        <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-gray-400 text-sm animate-pulse">Chargement de la carte...</div>
        </div>
    );
    if (status === Status.FAILURE) return (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 p-4 text-center">
            <div className="text-red-500 font-bold mb-1">Erreur de chargement de la carte</div>
            <div className="text-red-400 text-xs">Vérifiez votre connexion internet ou désactivez votre bloqueur de publicité/VPN.</div>
        </div>
    );
    return <></>;
};

export const GoogleMap: React.FC<GoogleMapProps> = ({ children, ...props }) => {
    const [apiKey, setApiKey] = useState<string | null>(null);

    useEffect(() => {
        client.get('/auth/config').then(res => {
            if (res.data && res.data.googleMapsKey) {
                setApiKey(res.data.googleMapsKey);
            }
        }).catch(err => {
            console.error('Failed to fetch map config:', err);
        });
    }, []);

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-gray-50">
                <div className="text-gray-400 text-sm animate-pulse">Initialisation...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            <Wrapper apiKey={apiKey} render={render} libraries={['drawing', 'geometry']}>
                <MapComponent {...props}>
                    {children}
                </MapComponent>
            </Wrapper>
        </div>
    );
};
