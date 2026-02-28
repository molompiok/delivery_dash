import React, { useMemo, useRef, useEffect } from 'react';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Scène : Bus réaliste — Modèle FBX "Setia Negara"
 * Remplace la géométrie procédurale par un vrai modèle 3D.
 */
export const BusDoubleDecker90Scene = ({ data, viewMode }: { data: any, viewMode: 'external' | 'internal' }) => {
    const fbx = useFBX('/models/bus_setia_negara_texturizer.fbx');
    const modelRef = useRef<THREE.Group>(null);

    // Clone the model so we can safely modify materials
    const scene = useMemo(() => {
        const clone = fbx.clone(true);

        // Enable shadows on all meshes
        clone.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Improve material quality
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((mat: any) => {
                        mat.side = THREE.DoubleSide;
                        mat.needsUpdate = true;
                    });
                }
            }
        });

        return clone;
    }, [fbx]);

    // Handle viewMode transparency for internal view
    useEffect(() => {
        if (!scene) return;

        scene.traverse((child: any) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat: any) => {
                    if (viewMode === 'internal') {
                        // Make body panels semi-transparent to see inside
                        mat.transparent = true;
                        mat.opacity = 0.15;
                        mat.depthWrite = false;
                    } else {
                        mat.transparent = false;
                        mat.opacity = 1;
                        mat.depthWrite = true;
                    }
                    mat.needsUpdate = true;
                });
            }
        });
    }, [viewMode, scene]);

    return (
        <group ref={modelRef}>
            {/* 
             * Scale & position may need adjusting depending on the FBX model's
             * original coordinate system. Common adjustments:
             * - FBX models are often in cm → scale down by 0.01
             * - Y-up vs Z-up rotation
             */}
            <primitive
                object={scene}
                scale={0.01}
                position={[0, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
            />
        </group>
    );
};
