import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';

export const TankerModel = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    const fillPercent = (data.filling || 0) / 100;

    return (
        <group position={[-0.4, 1.1, 0]}>
            <mesh position={[0.4, -0.7, 0]} castShadow>
                <boxGeometry args={[4.2, 0.2, 1.4]} />
                <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.1} />
            </mesh>
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
            {viewMode === 'internal' && (
                <mesh position={[0, -0.7 + (fillPercent * 0.7), 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.65 * fillPercent, 0.65 * fillPercent, 3.1, 32]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.5} />
                </mesh>
            )}
            {viewMode === 'internal' && (
                <Text position={[0, 1.2, 0]} fontSize={0.2} color="#60a5fa">
                    {data.filling}% CAPACITY
                </Text>
            )}
        </group>
    );
};

export const CargoModel = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    const boxes = useMemo(() => {
        const items = [];
        const occupation = data.occupation || 50;
        for (let x = -1.2; x < 1.3; x += 0.6) {
            for (let z = -0.4; z < 0.5; z += 0.4) {
                if (Math.random() < (occupation / 100)) {
                    items.push({ x, z, h: 0.3 + Math.random() * 0.5, color: Math.random() > 0.5 ? '#f59e0b' : '#d1d5db' });
                }
            }
        }
        return items;
    }, [data.occupation]);

    return (
        <group position={[-0.4, 1.1, 0]}>
            <mesh position={[0.4, -0.7, 0]} castShadow>
                <boxGeometry args={[4.2, 0.2, 1.4]} />
                <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh castShadow>
                <boxGeometry args={[3.2, 1.4, 1.3]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent={viewMode === 'internal'}
                    opacity={viewMode === 'internal' ? 0.2 : 1}
                    roughness={0.5}
                />
            </mesh>
            {viewMode === 'internal' && (
                <group position={[0, -0.6, 0]}>
                    {boxes.map((b: any, i: number) => (
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
