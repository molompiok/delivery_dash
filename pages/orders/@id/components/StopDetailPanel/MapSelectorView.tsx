import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Loader2 } from 'lucide-react';
import { MapLibre as GoogleMap, Marker, LatLng } from '../../../../../components/MapLibre';
import LocationSearchBar from '../../../../../components/LocationSearchBar';
import { geoApi } from '../../../../../api/geo';
import { variants, transition, ViewType } from './types';

interface MapSelectorViewProps {
    direction: number;
    stop: any;
    mapCenter: LatLng;
    setDirection: (dir: number) => void;
    setView: (view: ViewType) => void;
    setMapCenter: (center: LatLng) => void;
    handleFieldChange: (fieldPath: string, value: any) => void;
}

const MapSelectorView: React.FC<MapSelectorViewProps> = ({
    direction,
    stop,
    mapCenter,
    setDirection,
    setView,
    setMapCenter,
    handleFieldChange
}) => {
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, address?: string } | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    return (
        <motion.div
            key="map-selector"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 flex flex-col bg-[#f8fafc] dark:bg-slate-950"
        >
            {/* Floating Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-start pointer-events-none">
                <button
                    onClick={() => {
                        setDirection(-1);
                        setView('stop');
                    }}
                    className="p-3 bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all pointer-events-auto shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Centered Floating Search Bar */}
                <div className="absolute inset-x-0 top-4 flex justify-center px-16 md:px-20">
                    <div className="w-full max-w-md pointer-events-auto">
                        <LocationSearchBar
                            placeholder="Search address..."
                            onLocationSelect={(loc: { lat: number; lng: number; address: string }) => {
                                setMapCenter({ lat: loc.lat, lng: loc.lng });
                                setSelectedLocation({ lat: loc.lat, lng: loc.lng, address: loc.address });
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Map Body */}
            <div className="flex-1 relative bg-gray-100 dark:bg-slate-900 z-0">
                <GoogleMap
                    center={mapCenter}
                    zoom={15}
                    onCenterChanged={(center: LatLng) => {
                        // Update selection as map moves
                        setSelectedLocation(center);
                        // Do NOT setMapCenter here to avoid jitter/loop
                    }}
                >
                    {/* No Marker needed, we use the fixed center target */}

                    {/* Show existing stop location as a ghost/reference marker if distinct */}
                    {stop.address?.lat && stop.address?.lng && (
                        <Marker
                            position={{ lat: stop.address.lat, lng: stop.address.lng }}
                        />
                    )}
                </GoogleMap>

                {/* Fixed Center Target */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
                    {isGeocoding && (
                        <div className="mb-2 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full shadow-lg animate-spin">
                            <Loader2 size={16} className="text-blue-500" />
                        </div>
                    )}
                    <MapPin size={40} className="text-blue-600 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] animate-bounce" />
                    <div className="w-2 h-2 bg-black/20 dark:bg-white/20 rounded-full blur-[2px] mt-[-4px]"></div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex gap-3 z-10">
                <button
                    onClick={() => {
                        setDirection(-1);
                        setView('stop');
                    }}
                    className="flex-1 px-6 py-3 text-[11px] font-black text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl uppercase tracking-widest transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={async () => {
                        if (selectedLocation) {
                            setIsGeocoding(true);
                            try {
                                // If we don't have partial address components, fetching from API
                                const addrDetails = await geoApi.reverseGeocode(selectedLocation.lat, selectedLocation.lng);
                                if (addrDetails) {
                                    handleFieldChange('address.street', addrDetails.street);
                                    handleFieldChange('address.city', addrDetails.city);
                                    handleFieldChange('address.country', addrDetails.country);
                                }
                                handleFieldChange('address.lat', selectedLocation.lat);
                                handleFieldChange('address.lng', selectedLocation.lng);
                            } catch (err) {
                                console.error("Reverse geocode failed", err);
                                // Fallback just to coordinates
                                handleFieldChange('address.lat', selectedLocation.lat);
                                handleFieldChange('address.lng', selectedLocation.lng);
                            } finally {
                                setIsGeocoding(false);
                            }
                        }
                        setDirection(-1);
                        setView('stop');
                    }}
                    disabled={!selectedLocation || isGeocoding}
                    className={`flex-[2] px-6 py-3 text-[11px] font-black text-white rounded-2xl uppercase tracking-widest shadow-lg transition-all ${selectedLocation && !isGeocoding
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-500/20'
                        : 'bg-gray-300 dark:bg-slate-800 cursor-not-allowed shadow-none'
                        }`}
                >
                    {isGeocoding ? 'Geocoding...' : 'Select This Location'}
                </button>
            </div>
        </motion.div>
    );
};

export default MapSelectorView;

