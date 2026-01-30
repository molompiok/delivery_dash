import React, { useMemo } from 'react';
import { Box, Sphere, Cylinder, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface Vehicle3DModelProps {
    type: 'citerne' | 'conteneur' | 'bus';
    data: any;
    viewMode: 'external' | 'internal';
}

export const Vehicle3DModel: React.FC<Vehicle3DModelProps> = ({ type, data, viewMode }) => {
    return (
        <group>
            {/* Base Chassis (Shared) */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[4.2, 0.2, 1.4]} />
                <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Wheels */}
            {[[-1.5, 0.2, 0.6], [1.5, 0.2, 0.6], [-1.5, 0.2, -0.6], [1.5, 0.2, -0.6]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.3, 32]} />
                    <meshStandardMaterial color="#000000" metalness={0.5} roughness={0.8} />
                </mesh>
            ))}

            {/* Cab */}
            <mesh position={[1.8, 1, 0]} castShadow>
                <boxGeometry args={[0.8, 1, 1.2]} />
                <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
            </mesh>

            <SuspenseBoundary>
                {type === 'citerne' && <TankerModel data={data} viewMode={viewMode} />}
                {type === 'conteneur' && <CargoModel data={data} viewMode={viewMode} />}
                {type === 'bus' && <BusModel data={data} viewMode={viewMode} />}
            </SuspenseBoundary>
        </group>
    );
};

const TankerModel = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    const fillPercent = data.filling / 100;

    return (
        <group position={[-0.4, 1.1, 0]}>
            {/* Tank Shell */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.7, 0.7, 3.2, 32]} />
                <meshStandardMaterial
                    color="#94a3b8"
                    transparent={viewMode === 'internal'}
                    opacity={viewMode === 'internal' ? 0.3 : 1}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Liquid Content (Internal View) */}
            {viewMode === 'internal' && (
                <mesh position={[0, -0.7 + (fillPercent * 0.7), 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.65 * fillPercent, 0.65 * fillPercent, 3.1, 32]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.5} />
                </mesh>
            )}

            {/* Fill indicator text in 3D */}
            {viewMode === 'internal' && (
                <Text
                    position={[0, 1.2, 0]}
                    fontSize={0.2}
                    color="#60a5fa"
                    anchorX="center"
                    anchorY="middle"
                >
                    {data.filling}% CAPACITY
                </Text>
            )}
        </group>
    );
};

const CargoModel = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    // Generate some mock boxes
    const boxes = useMemo(() => {
        const items = [];
        for (let x = -1.2; x < 1.3; x += 0.6) {
            for (let z = -0.4; z < 0.5; z += 0.4) {
                if (Math.random() < (data.occupation / 100)) {
                    items.push({ x, z, h: 0.3 + Math.random() * 0.5, color: Math.random() > 0.5 ? '#f59e0b' : '#d1d5db' });
                }
            }
        }
        return items;
    }, [data.occupation]);

    return (
        <group position={[-0.4, 1.1, 0]}>
            {/* Box Shell */}
            <mesh castShadow>
                <boxGeometry args={[3.2, 1.4, 1.3]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent={viewMode === 'internal'}
                    opacity={viewMode === 'internal' ? 0.2 : 1}
                    roughness={0.5}
                />
            </mesh>

            {/* Internal Boxes */}
            {viewMode === 'internal' && (
                <group position={[0, -0.6, 0]}>
                    {boxes.map((b, i) => (
                        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
                            <boxGeometry args={[0.5, b.h, 0.3]} />
                            <meshStandardMaterial color={b.color} roughness={1} />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
};

const BusModel = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    // Generate seats
    const seats = useMemo(() => {
        const items = [];
        for (let x = -1.6; x < 1.8; x += 0.6) {
            items.push({ x, z: -0.3, occupied: Math.random() < 0.7 });
            items.push({ x, z: 0.3, occupied: Math.random() < 0.7 });
        }
        return items;
    }, []);

    return (
        <group position={[0, 1, 0]}>
            {/* Bus Body */}
            <mesh castShadow>
                <boxGeometry args={[4, 1.2, 1.2]} />
                <meshStandardMaterial
                    color="#ef4444"
                    transparent={viewMode === 'internal'}
                    opacity={viewMode === 'internal' ? 0.3 : 1}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Windows */}
            {!viewMode === 'internal' && (
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[3.8, 0.6, 1.21]} />
                    <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.1} />
                </mesh>
            )}

            {/* Interior Seats */}
            {viewMode === 'internal' && (
                <group position={[0, -0.4, 0]}>
                    {seats.map((s, i) => (
                        <group key={i} position={[s.x, 0, s.z]}>
                            <mesh>
                                <boxGeometry args={[0.4, 0.1, 0.4]} />
                                <meshStandardMaterial color={s.occupied ? '#1fb6ff' : '#475569'} />
                            </mesh>
                            <mesh position={[0.2, 0.25, 0]}>
                                <boxGeometry args={[0.05, 0.5, 0.4]} />
                                <meshStandardMaterial color={s.occupied ? '#1fb6ff' : '#475569'} />
                            </mesh>
                            {/* Seat Number */}
                            <Text
                                position={[0, 0.4, 0]}
                                rotation={[0, Math.PI / 2, 0]}
                                fontSize={0.1}
                                color="white"
                            >
                                {i + 1}
                            </Text>
                        </group>
                    ))}
                </group>
            )}
        </group>
    );
};

const SuspenseBoundary = ({ children }: { children: React.ReactNode }) => {
    return <React.Suspense fallback={null}>{children}</React.Suspense>;
};
