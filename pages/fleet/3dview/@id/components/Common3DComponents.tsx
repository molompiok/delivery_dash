import React from 'react';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// --- Shared Constants & Materials ---

export const COLORS = {
    CHASSIS: "#0f172a",
    WHEEL: "#111827",
    RIM: "#94a3b8",
    WINDOW: "#1e293b",
    METAL: "#475569",
};

export const Materials = {
    Chassis: <meshStandardMaterial color={COLORS.CHASSIS} metalness={0.9} roughness={0.1} />,
    Wheel: <meshStandardMaterial color={COLORS.WHEEL} roughness={0.8} />,
    Rim: <meshStandardMaterial color={COLORS.RIM} metalness={1} roughness={0.1} />,
    Window: <meshStandardMaterial color={COLORS.WINDOW} metalness={1} roughness={0.1} transparent opacity={0.6} />,
};

// --- Shared Components ---

/**
 * Heavy Duty Wheel with Rim
 */
export const HeavyWheel = ({ position, rotation = [Math.PI / 2, 0, 0], scale = 1 }: { position: [number, number, number], rotation?: [number, number, number], scale?: number }) => (
    <group position={position} rotation={rotation as [number, number, number]} scale={scale}>
        {/* Tire */}
        <mesh castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.4, 32]} />
            <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Rim */}
        <mesh position={[0, 0.21, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.21, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={1} roughness={0.2} />
        </mesh>
    </group>
);

/**
 * Common 12m Heavy Chassis for Trucks
 */
export const HeavyChassis12m = ({ children, cabColor = "#1e40af" }: { children?: React.ReactNode, cabColor?: string }) => {
    return (
        <group>
            {/* Chassis Frame */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[12, 0.3, 1.8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Wheels - 3 Axles */}
            {[
                [-4.5, 0.4, 0.85], [-4.5, 0.4, -0.85], // Back Axle 1
                [-3.2, 0.4, 0.85], [-3.2, 0.4, -0.85], // Back Axle 2
                [4.5, 0.4, 0.85], [4.5, 0.4, -0.85]    // Front Axle
            ].map((pos, i) => (
                <HeavyWheel key={i} position={pos as [number, number, number]} />
            ))}

            {/* Default Cab (Can be overridden by children) */}
            <group>
                <mesh position={[5.2, 1.2, 0]} castShadow>
                    <boxGeometry args={[1.5, 1.8, 2.2]} />
                    <meshStandardMaterial color={cabColor} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[5.96, 1.5, 0]}>
                    <boxGeometry args={[0.01, 0.8, 2]} />
                    <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.1} transparent opacity={0.6} />
                </mesh>
            </group>

            {children}
        </group>
    );
};
