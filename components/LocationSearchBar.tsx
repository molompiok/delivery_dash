
import React, { useState, useEffect, useCallback, useRef } from "react";
import { socketClient } from "../api/socket";
import { FaSearch, FaTimes, FaMapMarkerAlt, FaLocationArrow } from "react-icons/fa";

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    source: 'nominatim' | 'google';
}

interface LocationSearchBarProps {
    onLocationSelect: (location: { lat: number; lng: number, address: string }) => void;
    initialValue?: string;
    placeholder?: string;
    wrapperClassName?: string;
    inputClassName?: string;
}

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
    onLocationSelect,
    initialValue = "",
    placeholder = "Rechercher un lieu...",
    wrapperClassName = "rounded-[20px] shadow-lg border backdrop-blur-2xl",
    inputClassName = "placeholder-gray-400 dark:placeholder-slate-500"
}) => {
    const [query, setQuery] = useState(initialValue);

    useEffect(() => {
        if (initialValue) setQuery(initialValue);
    }, [initialValue]);

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // UseRef for Request ID to handle out-of-order responses
    const lastRequestId = useRef<number>(0);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const socket = socketClient.connect();
        console.log("LocationSearchBar: Connecting socket...", socket.id);
        if (!socket.connected) {
            console.log("LocationSearchBar: Socket not connected, force connecting...");
            socket.connect();
        }

        socket.on("search_result", (data: { requestId: number, results: SearchResult[] }) => {
            console.log("LocationSearchBar: Received result:", data);
            // Drop responses that are older than our last request
            if (data.requestId < lastRequestId.current) {
                console.log("LocationSearchBar: Dropping old request", data.requestId, lastRequestId.current);
                return;
            }

            setResults(data.results || []);
            setIsLoading(false);
            setIsOpen(true);
        });

        socket.on("connect_error", (err) => {
            console.error("LocationSearchBar: Socket connect error:", err);
        });

        return () => {
            console.log("LocationSearchBar: Cleaning up socket listeners");
            socket.off("search_result");
            socket.off("connect_error");
        };
    }, []);

    const handleSearch = useCallback((input: string) => {
        setQuery(input);
        console.log("LocationSearchBar: handleSearch", input);

        if (input.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);

        // Client-side Debounce (300ms)
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            const requestId = Date.now();
            lastRequestId.current = requestId;

            const socket = socketClient.getSocket();
            console.log("LocationSearchBar: Emitting search_place", input, requestId, socket?.id);
            if (socket) {
                socket.emit("search_place", {
                    query: input,
                    requestId: requestId
                });
            } else {
                console.error("LocationSearchBar: No socket available to emit");
            }
        }, 300);

    }, []);

    const handleSelect = (item: SearchResult) => {
        setQuery(item.display_name);
        setIsOpen(false);
        onLocationSelect({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.display_name
        });
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full z-[1000]">
            <div
                className={`relative flex items-center ${wrapperClassName}`}
                style={{
                    backgroundColor: 'var(--header-bg)',
                    borderColor: 'var(--header-border)'
                }}
            >
                <div className="pl-3" style={{ color: 'var(--header-icon)' }}>
                    <FaSearch />
                </div>
                <input
                    type="text"
                    className={`w-full px-3 py-2 rounded-lg bg-transparent focus:outline-none ${inputClassName}`}
                    style={{ color: 'var(--header-text)' }}
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="pr-3 hover:opacity-70 focus:outline-none transition-opacity"
                        style={{ color: 'var(--header-icon)' }}
                    >
                        <FaTimes />
                    </button>
                )}
                {isLoading && (
                    <div className="absolute right-10">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute w-full mt-2 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-100 dark:border-slate-800 max-h-80 overflow-y-auto">
                    {results.map((item, index) => (
                        <div
                            key={index}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer border-b border-gray-50 dark:border-slate-800 last:border-none duration-150 transition-colors"
                            onClick={() => handleSelect(item)}
                        >
                            <div className="flex items-start">
                                <span className="mt-1 text-gray-400 mr-2 flex-shrink-0">
                                    {item.source === 'google' ? <FaMapMarkerAlt className="text-red-500" /> : <FaLocationArrow className="text-blue-500" />}
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 line-clamp-1">{item.display_name.split(',')[0]}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{item.display_name}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="px-2 py-1 bg-gray-50 dark:bg-slate-800/50 text-[10px] text-right text-gray-400 dark:text-slate-500">
                        Source: {results[0]?.source === 'google' ? 'Google Maps' : 'OpenStreetMap'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSearchBar;
