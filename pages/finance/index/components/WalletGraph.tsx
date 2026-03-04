import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
    date: string;
    value: number;
}

interface WalletGraphProps {
    data: DataPoint[];
    color?: string;
    height?: number;
    period?: number;
}

export const WalletGraph: React.FC<WalletGraphProps> = ({
    data,
    color = '#6366f1',
    height = 200,
    period = 7
}) => {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return Array.from({ length: period }).map((_, i) => ({ x: i, y: 0, normalizedY: 1 }));

        const max = Math.max(...data.map(d => d.value), 1);
        return data.map((d, i) => ({
            x: i,
            y: d.value,
            normalizedY: 1 - (d.value / max)
        }));
    }, [data, period]);

    const width = 1000; // Reference width
    const stepX = (width - margin.left - margin.right) / (processedData.length - 1 || 1);

    const pathData = useMemo(() => {
        return processedData.map((p, i) => {
            const x = margin.left + i * stepX;
            const y = margin.top + p.normalizedY * (height - margin.top - margin.bottom);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [processedData, stepX, height]);

    const areaData = useMemo(() => {
        if (processedData.length === 0) return '';
        const lastX = margin.left + (processedData.length - 1) * stepX;
        return `${pathData} L ${lastX} ${height - margin.bottom} L ${margin.left} ${height - margin.bottom} Z`;
    }, [pathData, processedData, stepX, height]);

    return (
        <div className="relative w-full overflow-hidden" style={{ height }}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full preserve-3d"
                preserveAspectRatio="none"
            >
                {/* Gradient for Area Overlay */}
                <defs>
                    <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area under the line */}
                <motion.path
                    initial={{ opacity: 0, d: areaData.replace(/L [^ ]+ [^ ]+/g, `L ${margin.left} ${height}`) }}
                    animate={{ opacity: 1, d: areaData }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    fill="url(#graphGradient)"
                />

                {/* Main Path Line */}
                <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Circles for points */}
                {processedData.map((p, i) => (
                    <motion.circle
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.05 }}
                        cx={margin.left + i * stepX}
                        cy={margin.top + p.normalizedY * (height - margin.top - margin.bottom)}
                        r="5"
                        fill="white"
                        stroke={color}
                        strokeWidth="3"
                        className="cursor-pointer hover:r-8 transition-all"
                    >
                        <title>{p.y.toLocaleString()} F</title>
                    </motion.circle>
                ))}
            </svg>
        </div>
    );
};
