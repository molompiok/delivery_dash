import React, { Suspense } from 'react';
import { ContainerTruck12mScene } from './TruckScene';
import { Tanker12mScene } from './TankerScene';
import { BusDoubleDecker90Scene } from './BusScene';
import { CargoModel } from './MiscScenes';

interface Vehicle3DModelProps {
    type: string;
    data: any;
    viewMode: 'external' | 'internal';
}

export const Vehicle3DModel: React.FC<Vehicle3DModelProps> = ({ type, data, viewMode }) => {
    const renderScene = () => {
        const t = type?.toUpperCase();

        switch (t) {
            case 'CONTENEUR':
            case 'TRUCK':
            case 'CONTAINER_12M':
                return <ContainerTruck12mScene data={data} viewMode={viewMode} />;

            case 'CITERNE':
            case 'TANKER':
            case 'TANKER_12M':
                return <Tanker12mScene data={data} viewMode={viewMode} />;

            case 'BUS':
            case 'SHUTTLE':
            case 'BUS_DOUBLE':
                return <BusDoubleDecker90Scene data={data} viewMode={viewMode} />;

            default:
                return <CargoModel data={data} viewMode={viewMode} />;
        }
    };

    return (
        <group>
            <Suspense fallback={null}>
                {renderScene()}
            </Suspense>
        </group>
    );
};
