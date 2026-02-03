import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin } from 'lucide-react';
import { GoogleMap, Marker } from '../../../../../components/GoogleMap';
import LocationSearchBar from '../../../../../components/LocationSearchBar';
import { variants, transition, ViewType } from './types';

interface MapSelectorViewProps {
    direction: number;
    stop: any;
    mapCenter: google.maps.LatLngLiteral;
    selectedLocation: google.maps.LatLngLiteral | null;
    setDirection: (dir: number) => void;
    setView: (view: ViewType) => void;
    setMapCenter: (center: google.maps.LatLngLiteral) => void;
    setSelectedLocation: (loc: google.maps.LatLngLiteral | null) => void;
    handleFieldChange: (fieldPath: string, value: any) => void;
}

const MapSelectorView: React.FC<MapSelectorViewProps> = ({
    direction,
    stop,
    mapCenter,
    selectedLocation,
    setDirection,
    setView,
    setMapCenter,
    setSelectedLocation,
    handleFieldChange
}) => {
    return (
        <motion.div
            key="map-selector"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 flex flex-col bg-[#f8fafc]"
        >
            {/* Floating Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-start gap-3 pointer-events-none">
                <button
                    onClick={() => {
                        setDirection(-1);
                        setView('stop');
                    }}
                    className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-700 hover:text-black hover:bg-white transition-all pointer-events-auto"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Floating Search Bar */}
                <div className="flex-1 pointer-events-auto">
                    <LocationSearchBar
                        placeholder="Search address..."
                        onLocationSelect={(loc) => {
                            setMapCenter({ lat: loc.lat, lng: loc.lng });
                            setSelectedLocation({ lat: loc.lat, lng: loc.lng });
                        }}
                    />
                </div>
            </div>

            {/* Map Body */}
            <div className="flex-1 relative bg-gray-100 z-0">
                <GoogleMap
                    center={mapCenter}
                    zoom={15}
                    onCenterChanged={(center) => {
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
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 6,
                                fillColor: "#94a3b8", // Gray ghost
                                fillOpacity: 0.5,
                                strokeColor: "#ffffff",
                                strokeWeight: 2,
                            }}
                        />
                    )}
                </GoogleMap>

                {/* Fixed Center Target */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center justify-center pb-8">
                    {/* Target Icon */}
                    <div className="relative">
                        <MapPin size={42} className="text-blue-600 drop-shadow-xl animate-bounce" fill="currentColor" />
                        <div className="w-1.5 h-1.5 bg-black/20 rounded-full blur-[2px] absolute bottom-[2px] left-1/2 -translate-x-1/2"></div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 flex gap-3 z-10">
                <button
                    onClick={() => {
                        setDirection(-1);
                        setView('stop');
                    }}
                    className="flex-1 px-6 py-3 text-[11px] font-black text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl uppercase tracking-widest transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        if (selectedLocation) {
                            handleFieldChange('address.lat', selectedLocation.lat);
                            handleFieldChange('address.lng', selectedLocation.lng);
                            // Optional: Reverse geocode here to update address text
                        }
                        setDirection(-1);
                        setView('stop');
                    }}
                    disabled={!selectedLocation}
                    className={`flex-[2] px-6 py-3 text-[11px] font-black text-white rounded-2xl uppercase tracking-widest shadow-lg transition-all ${selectedLocation
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        : 'bg-gray-300 cursor-not-allowed shadow-none'
                        }`}
                >
                    Select This Location
                </button>
            </div>
        </motion.div>
    );
};

export default MapSelectorView;
