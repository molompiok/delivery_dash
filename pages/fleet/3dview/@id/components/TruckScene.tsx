import React, { useMemo, useState } from 'react';
import { HeavyChassis12m } from './Common3DComponents';

/**
 * Scène : Camion Conteneur 12m
 */
export const ContainerTruck12mScene = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    const [isDoorOpen, setIsDoorOpen] = useState(data.uiState?.doors?.backMain || false);
    const pallets = useMemo(() => {
        const items = [];
        const filling = data.cargo?.fillingPercent || 50;
        const count = Math.floor(filling / 10);
        for (let i = 0; i < count; i++) {
            items.push({
                id: `PAL-${i}`,
                pos: [(-4.5 + i * 1.1), -0.5, (i % 2 === 0 ? 0.35 : -0.35)]
            });
        }
        return items;
    }, [data.cargo?.fillingPercent]);

    return (
        <HeavyChassis12m>
            <group position={[-0.5, 1.5, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[10, 2.2, 2.4]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent={viewMode === 'internal'}
                        opacity={viewMode === 'internal' ? 0.2 : 1}
                        roughness={0.5}
                    />
                </mesh>
                <group position={[-5, 0, 0]}>
                    <mesh position={[0, 0, 0.6]} rotation={[0, isDoorOpen ? Math.PI * 0.7 : 0, 0]} onClick={(e) => {
                        e.stopPropagation();
                        setIsDoorOpen(!isDoorOpen);
                    }}>
                        <boxGeometry args={[0.1, 2.2, 1.2]} />
                        <meshStandardMaterial color="#cbd5e1" />
                    </mesh>
                    <mesh position={[0, 0, -0.6]} rotation={[0, isDoorOpen ? -Math.PI * 0.7 : 0, 0]} onClick={(e) => {
                        e.stopPropagation();
                        setIsDoorOpen(!isDoorOpen);
                    }}>
                        <boxGeometry args={[0.1, 2.2, 1.2]} />
                        <meshStandardMaterial color="#cbd5e1" />
                    </mesh>
                </group>
                {viewMode === 'internal' && (
                    <group>
                        {pallets.map((p, i) => (
                            <mesh key={i} position={p.pos as [number, number, number]}>
                                <boxGeometry args={[0.9, 1.2, 0.9]} />
                                <meshStandardMaterial color="#b45309" />
                            </mesh>
                        ))}
                    </group>
                )}
            </group>
        </HeavyChassis12m>
    );
};
