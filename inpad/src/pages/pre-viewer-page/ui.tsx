import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from 'antd';
import {getProjectId, fetchProject, setAllCordsForProject} from "../../shared/api/projects";
import {useNavigate} from "react-router-dom";

export const PreViewerPage = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const navigate = useNavigate();

    const [coordinates, setCoordinates] = useState<{
        outer: {
            sw: [number, number],
            nw: [number, number],
            ne: [number, number],
            se: [number, number],
        },
        inner: {
            sw: [number, number],
            nw: [number, number],
            ne: [number, number],
            se: [number, number],
        },
        center: [number, number]
    } | null>(null);

    useEffect(() => {
        mapboxgl.accessToken = 'pk.eyJ1Ijoid2FsbGFieXdheSIsImEiOiJjazBuaDQ5OGgxaHFwM2NvMm8wN2Ewb2xpIn0.1XKDCgUA5YKI_U9NGh4fqg';

        if (mapContainerRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/light-v11',
                center: [0, 0],
                zoom: 1.0,
                minZoom: 1.0,
                pitch: 0,
                bearing: 0,
                projection: 'mercator',
                antialias: true,
                doubleClickZoom: false,
                dragRotate: true,
            });

            mapRef.current.on('pitch', () => {
                if (mapRef.current) {
                    mapRef.current.setPitch(0);
                }
            });

            mapRef.current.on('move', () => {
                if (!mapRef.current) return;

                const mapContainer = mapRef.current.getContainer();
                const width = mapContainer.offsetWidth;
                const height = mapContainer.offsetHeight;

                const outerSquareSize = 500;
                const innerSquareSize = 300;

                const centerX = width / 2;
                const centerY = height / 2;

                const outerHalfSize = outerSquareSize / 2;
                const outerSwPixel: [number, number] = [centerX - outerHalfSize, centerY + outerHalfSize];
                const outerNwPixel: [number, number] = [centerX - outerHalfSize, centerY - outerHalfSize];
                const outerNePixel: [number, number] = [centerX + outerHalfSize, centerY - outerHalfSize];
                const outerSePixel: [number, number] = [centerX + outerHalfSize, centerY + outerHalfSize];

                const outerSw = mapRef.current.unproject(outerSwPixel).toArray() as [number, number];
                const outerNw = mapRef.current.unproject(outerNwPixel).toArray() as [number, number];
                const outerNe = mapRef.current.unproject(outerNePixel).toArray() as [number, number];
                const outerSe = mapRef.current.unproject(outerSePixel).toArray() as [number, number];

                const innerHalfSize = innerSquareSize / 2;
                const innerSwPixel: [number, number] = [centerX - innerHalfSize, centerY + innerHalfSize];
                const innerNwPixel: [number, number] = [centerX - innerHalfSize, centerY - innerHalfSize];
                const innerNePixel: [number, number] = [centerX + innerHalfSize, centerY - innerHalfSize];
                const innerSePixel: [number, number] = [centerX + innerHalfSize, centerY + innerHalfSize];

                const innerSw = mapRef.current.unproject(innerSwPixel).toArray() as [number, number];
                const innerNw = mapRef.current.unproject(innerNwPixel).toArray() as [number, number];
                const innerNe = mapRef.current.unproject(innerNePixel).toArray() as [number, number];
                const innerSe = mapRef.current.unproject(innerSePixel).toArray() as [number, number];

                const centerPixel: [number, number] = [centerX, centerY];
                const center = mapRef.current.unproject(centerPixel).toArray() as [number, number];

                setCoordinates({
                    outer: { sw: outerSw, nw: outerNw, ne: outerNe, se: outerSe },
                    inner: { sw: innerSw, nw: innerNw, ne: innerNe, se: innerSe },
                    center
                });
            });

            mapRef.current.on('load', () => {
                if (mapRef.current) {
                    mapRef.current.fire('move');
                }
            });

            return () => {
                if (mapRef.current) {
                    mapRef.current.remove();
                }
            };
        }
    }, []);

    const getCoordinatesStrings = (coords: typeof coordinates) => {
        if (!coords) return { outer: '', inner: '', center: '' };

        const formatCoord = ([lng, lat]: [number, number]) => `[${lng.toFixed(4)}, ${lat.toFixed(4)}]`;

        const outer = [
            formatCoord(coords.outer.sw),
            formatCoord(coords.outer.nw),
            formatCoord(coords.outer.ne),
            formatCoord(coords.outer.se),
        ].join(', ');

        const inner = [
            formatCoord(coords.inner.sw),
            formatCoord(coords.inner.nw),
            formatCoord(coords.inner.ne),
            formatCoord(coords.inner.se),
        ].join(', ');

        const center = formatCoord(coords.center);

        return { outer, inner, center };
    };

    const handleButton = async () => {
        const projectId = getProjectId();
        console.log(projectId);
        if (projectId !== null && coordinates) {
            try {
                const { outer, inner, center } = getCoordinatesStrings(coordinates);
                await setAllCordsForProject(projectId, center, inner, outer);
                await fetchProject(projectId);
                 navigate(`/viewer/${projectId}`);
            } catch (error) {
                console.error('Ошибка при обработке данных проекта:', error);
            }
        }
    };

    return (
        <div style={{ position: 'relative', height: '100vh' }}>
            <Button onClick={handleButton} style={{
                zIndex: 100,
                background: '#303030',
                color: '#fff',
                position: 'absolute',
                width: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '10%',
            }}>
                Перейти
            </Button>
            <div ref={mapContainerRef} style={{ height: '100%' }}></div>

            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '500px',
                height: '500px',
                transform: 'translate(-50%, -50%)',
                border: '2px solid #303030',
                pointerEvents: 'none',
                boxSizing: 'border-box'
            }} />

            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '300px',
                height: '300px',
                transform: 'translate(-50%, -50%)',
                border: '2px solid #ff0000',
                pointerEvents: 'none',
                boxSizing: 'border-box'
            }} />

            {coordinates && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    maxWidth: '300px'
                }}>
                    <div>Outer: {getCoordinatesStrings(coordinates).outer}</div>
                    <div>Inner: {getCoordinatesStrings(coordinates).inner}</div>
                    <div>Center: {getCoordinatesStrings(coordinates).center}</div>
                </div>
            )}
        </div>
    );
};