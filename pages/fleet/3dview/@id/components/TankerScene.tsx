import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { HeavyChassis12m } from './Common3DComponents';

/**
 * Scène : Camion Citerne 12m (Multi-compartiments)
 */
export const Tanker12mScene = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    const compartments = useMemo(() => {
        const list = data.cargo?.compartments || [
            { id: 'C1', filling: 80, color: '#3b82f6' },
            { id: 'C2', filling: 40, color: '#3b82f6' },
            { id: 'C3', filling: 90, color: '#3b82f6' },
            { id: 'C4', filling: 10, color: '#ef4444' }
        ];
        return list;
    }, [data.cargo?.compartments]);

    return (
        <HeavyChassis12m>
            <group position={[-0.8, 1.6, 0]}>
                {/* Main Tank Shell */}
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[1, 1, 9.5, 64]} />
                    <meshStandardMaterial
                        color="#94a3b8"
                        metalness={1}
                        roughness={0.1}
                        transparent={viewMode === 'internal'}
                        opacity={viewMode === 'internal' ? 0.3 : 1}
                    />
                </mesh>

                {/* Internal Liquid Modules */}
                {viewMode === 'internal' && compartments.map((c: any, i: number) => {
                    const width = 9 / compartments.length;
                    const x = -4.5 + (i * width) + (width / 2);
                    const fill = (c.filling || 0) / 100;
                    return (
                        <group key={c.id} position={[x, 0, 0]}>
                            {/* Compartment Separator */}
                            <mesh position={[width / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                                <circleGeometry args={[0.98, 32]} />
                                <meshStandardMaterial color="#475569" transparent opacity={0.5} />
                            </mesh>
                            {/* Liquid */}
                            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.9 + (fill * 0.9), 0]}>
                                <cylinderGeometry args={[0.9 * fill, 0.9 * fill, width - 0.1, 32]} />
                                <meshStandardMaterial color={c.color || "#3b82f6"} emissive={c.color} emissiveIntensity={0.2} />
                            </mesh>
                            <Text position={[0, 1.2, 0]} fontSize={0.2} color="white">{c.filling}%</Text>
                        </group>
                    );
                })}
            </group>
        </HeavyChassis12m>
    );
};
