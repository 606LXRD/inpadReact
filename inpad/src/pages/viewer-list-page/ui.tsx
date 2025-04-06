import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { CodepenOutlined, DeleteOutlined, GatewayOutlined, BarChartOutlined,ArrowRightOutlined,
    VerticalAlignBottomOutlined  } from "@ant-design/icons";
import {Button, FloatButton, Popover
    , Select
} from 'antd';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {useNavigate} from "react-router-dom";
import {
    saveJsonProject,
    getProjectId,
    fetchProject,
} from "../../shared/api/projects";
import {Client} from "@stomp/stompjs";
import {getAuthToken} from '../../shared/api/http-client';
import SockJS from 'sockjs-client';
import 'global';
interface PolygonInfo {
    id: string;
    area: number;
    floors: number;
    floorHeight: number;
}

interface ImportedPolygonData {
    geoData: {
        type: string;
        features: Array<{
            id: string;
            type: string;
            geometry: {
                type: string;
                coordinates: number[][][];
            };
            properties: Record<string, any>;
        }>;
    };
    polygonInfo: PolygonInfo[];
}

export const ViewerPage: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const drawRef = useRef<any>(null);
    const lastYRef = useRef(0);
    const sensitivityRef = useRef(10);
    const floorHeightRef = useRef(3);
    const activePolygonIdRef = useRef<string | null>(null);
    const isAdjustingFloorsRef = useRef(false);
    const [polygons, setPolygons] = useState<PolygonInfo[]>([]);
    const [activePolygonId, setActivePolygonId] = useState<string | null>(null);
    const [isAdjustingFloors, setIsAdjustingFloors] = useState(false);
    const navigate = useNavigate();
    const [messages, setMessages] = useState<string[]>([]);
    const [stompClient, setStompClient] = useState<Client | null>(null);

    function convertToImportedPolygonData(input: string): ImportedPolygonData {
        const parsedData = JSON.parse(input);

        if (!parsedData.geoData || !parsedData.polygonInfo) {
            throw new Error("Invalid input format. Missing required fields.");
        }

        const result: ImportedPolygonData = {
            geoData: {
                type: parsedData.geoData.type || "FeatureCollection",
                features: parsedData.geoData.features.map((feature: any) => ({
                    id: feature.id,
                    type: feature.type || "Feature",
                    geometry: {
                        type: feature.geometry?.type || "Polygon",
                        coordinates: feature.geometry?.coordinates || [],
                    },
                    properties: feature.properties || {},
                })),
            },
            polygonInfo: parsedData.polygonInfo.map((info: any) => ({
                id: info.id,
                area: info.area,
                floors: info.floors,
                floorHeight: info.floorHeight,
            })),
        };

        return result;
    }
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            console.error("Authentication token is missing or invalid");
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('Connected: ', frame);

            client.subscribe('/topic/messages', (message) => {
                if (message.body) {
                    setMessages((prevMessages) => [...prevMessages, message.body]);
                    const importedData = convertToImportedPolygonData(message.body);
                    importPolygonsFromJSON(importedData);
                }
            });
        };


        client.onStompError = (frame) => {
            console.error('Broker reported error: ', frame.headers['message']);
            console.error('Additional details: ', frame.body);
        };

        setStompClient(client);
        client.activate();

        return () => {
            if (client && client.active) {
                client.deactivate();
            }
        };
    }, []);
    useEffect(() => {
        activePolygonIdRef.current = activePolygonId;
    }, [activePolygonId]);
    useEffect(() => {
        isAdjustingFloorsRef.current = isAdjustingFloors;
    }, [isAdjustingFloors]);

    const [centerCoordinates, setCenterCoordinates] = useState<[number, number]>();

    useEffect(() => {
        const loadProjectData = async () => {
            const projectId = getProjectId();
            if (projectId !== null) {
                try {
                    const prj_inf = await fetchProject(projectId);

                    const startCoordinatesString = prj_inf.startcoordinates;
                    console.log(prj_inf);
                    console.log(startCoordinatesString);

                    if (startCoordinatesString) {
                        const cleanedString = startCoordinatesString.replace(/[\[\]]/g, '');

                        const coordinates = cleanedString.split(',').map(Number) as [number, number];

                        if (!isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
                            setCenterCoordinates(coordinates);

                            if (mapRef.current) {
                                mapRef.current.setCenter(coordinates);
                            }
                        } else {
                            console.error('Некорректные координаты:', startCoordinatesString);
                        }
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке данных проекта:', error);
                }
            }
        };

        loadProjectData();
    }, []);

    useEffect(() => {
        mapboxgl.accessToken = 'pk.eyJ1Ijoid2FsbGFieXdheSIsImEiOiJjazBuaDQ5OGgxaHFwM2NvMm8wN2Ewb2xpIn0.1XKDCgUA5YKI_U9NGh4fqg';

        if (mapContainerRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/standard',
                center: centerCoordinates,
                zoom: 18.3,
                pitch: 46.9,
                bearing: 15,
                antialias: true,
                doubleClickZoom: false,
                preserveDrawingBuffer: true

            });

            mapRef.current.on('style.load', () => {
                mapRef.current!.setConfigProperty('basemap', 'lightPreset', 'dawn');
                mapRef.current!.setConfigProperty('basemap', 'showPlaceLabels', false);
                mapRef.current!.setConfigProperty('basemap', 'showRoadLabels', false);
                mapRef.current!.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
                mapRef.current!.setConfigProperty('basemap', 'showTransitLabels', false);
                mapRef.current!.setConfigProperty('basemap', 'theme', 'monochrome');
                mapRef.current!.doubleClickZoom.disable();
                mapRef.current!.addSource('global', {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [
                            {
                                'type': 'Feature',
                                'properties': {},
                                'geometry': {
                                    'type': 'Polygon',
                                    'coordinates': [
                                        [
                                            [-180, 90],
                                            [180, 90],
                                            [180, -90],
                                            [-180, -90],
                                            [-180, 90]
                                        ],
                                        [
                                            [60.5906, 56.8368],
                                            [60.5899, 56.8390],
                                            [60.5939, 56.8395],
                                            [60.5947, 56.8372],
                                            [60.5906, 56.8368]
                                        ]
                                    ]
                                }
                            }
                        ]
                    }
                });
                mapRef.current!.addSource('closely', {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [
                            {
                                'type': 'Feature',
                                'properties': {},
                                'geometry': {
                                    'type': 'Polygon',
                                    'coordinates': [
                                        [
                                            [-180, 90],
                                            [180, 90],
                                            [180, -90],
                                            [-180, -90],
                                            [-180, 90]
                                        ],
                                        [
                                            [60.5895, 56.8360],
                                            [60.5883, 56.8397],
                                            [60.5950, 56.8403],
                                            [60.5963, 56.8366],
                                            [60.5895, 56.8360],

                                        ]
                                    ]
                                }
                            }
                        ]
                    }
                });


            });
            const draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: {
                    polygon: false,
                    trash: false,
                },
                defaultMode: 'simple_select',
            });

            drawRef.current = draw;
            mapRef.current.addControl(draw);

            mapRef.current.on('load', () => {
                mapRef.current!.on('draw.create', handleDrawCreate);
                mapRef.current!.on('draw.delete', handleDrawDelete);
                mapRef.current!.on('draw.update', handleDrawUpdate);
                mapRef.current!.on('draw.selectionchange', handleSelectionChange);
                mapRef.current!.on('click', handleMapClick);

                loadProject();
            });

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            takeScreenshot();
            return () => {
                if (mapRef.current) {
                    mapRef.current.off('draw.create', handleDrawCreate);
                    mapRef.current.off('draw.delete', handleDrawDelete);
                    mapRef.current.off('draw.update', handleDrawUpdate);
                    mapRef.current.off('draw.selectionchange', handleSelectionChange);
                    mapRef.current.off('click', handleMapClick);
                    mapRef.current.remove();
                }

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [centerCoordinates]);

    useEffect(() => {
        updateExtrusionLayers();
    }, [polygons]);


    const takeScreenshot = async () => {
        if (mapRef.current) {
            const id = getProjectId();
            const dataUrl = mapRef.current.getCanvas().toDataURL();
            const link = document.createElement('a');
            link.download = `${id}.png`;
            link.href = dataUrl;
            link.click();

        }
    };

    const loadProject = async () => {
        const projectId = getProjectId();
        if (projectId !== null) {
            try {
                const projectData = await fetchProject(projectId);
                const jsonPolyData = projectData.projectData;
                if (jsonPolyData) {
                    importPolygonsFromJSON(jsonPolyData as ImportedPolygonData);
                }

            } catch (error) {
                console.error('Ошибка при загрузке данных проекта:', error);
            }
        } else {
            console.error('Project ID is null. Cannot fetch project data.');
        }
    };

    const handleDrawPolygon = () => {
        if (!drawRef.current) return;
        const mode = drawRef.current.getMode();
        if (mode === 'simple_select') {
            drawRef.current.changeMode('draw_polygon');
        } else if (mode === 'draw_polygon') {
            drawRef.current.changeMode('simple_select');
            exportPolygonsToJSON();
        }
    };

    const handleDelete = () => {
        const selectedIds = drawRef.current.getSelectedIds();
        if (selectedIds.length) {
            drawRef.current.delete(selectedIds);
            selectedIds.forEach((id: string) => {
                if (mapRef.current) {
                    if (mapRef.current.getLayer(`extrusion-${id}`)) {
                        mapRef.current.removeLayer(`extrusion-${id}`);
                    }

                    if (mapRef.current.getSource(`source-${id}`)) {
                        mapRef.current.removeSource(`source-${id}`);
                    }

                    for (let i = 1; i <= 50; i++) {
                        if (mapRef.current.getLayer(`floor-line-${id}-${i}`)) {
                            mapRef.current.removeLayer(`floor-line-${id}-${i}`);
                        }
                    }
                }
            });

            setPolygons(prev => prev.filter(p => !selectedIds.includes(p.id)));

            if (selectedIds.includes(activePolygonIdRef.current)) {
                setActivePolygonId(null);
                setIsAdjustingFloors(false);
            }
        }
    };

    const handleDrawCreate = (e: any) => {
        const newFeature = e.features[0];
        const area = turf.area(newFeature);
        const roundedArea = Math.round(area * 100) / 100;

        const newPolygon = {
            id: newFeature.id,
            area: roundedArea,
            floors: 1,
            floorHeight: floorHeightRef.current
        };

        setPolygons(prev => [...prev, newPolygon]);
        setActivePolygonId(newFeature.id);
        setIsAdjustingFloors(true);
        lastYRef.current = 0;
    };

    const handleDrawDelete = (e: any) => {
        const deletedIds = e.features.map((f: any) => f.id);

        deletedIds.forEach((id: string) => {
            if (mapRef.current) {
                if (mapRef.current.getLayer(`extrusion-${id}`)) {
                    mapRef.current.removeLayer(`extrusion-${id}`);
                }

                if (mapRef.current.getSource(`source-${id}`)) {
                    mapRef.current.removeSource(`source-${id}`);
                }

                for (let i = 1; i <= 50; i++) {
                    if (mapRef.current.getLayer(`floor-line-${id}-${i}`)) {
                        mapRef.current.removeLayer(`floor-line-${id}-${i}`);
                    }
                }
            }
        });

        setPolygons(prev => prev.filter(p => !deletedIds.includes(p.id)));

        if (deletedIds.includes(activePolygonIdRef.current)) {
            setActivePolygonId(null);
            setIsAdjustingFloors(false);
        }
    };

    const handleDrawUpdate = (e: any) => {
        const updatedFeature = e.features[0];
        const area = turf.area(updatedFeature);
        const roundedArea = Math.round(area * 100) / 100;

        setPolygons(prev => prev.map(p =>
            p.id === updatedFeature.id
                ? { ...p, area: roundedArea }
                : p
        ));

        updateExtrusionLayer(updatedFeature);

        const polygon = polygons.find(p => p.id === updatedFeature.id);
        if (polygon) {
            createFloorLines(updatedFeature, polygon);
        }

    };

    const handleSelectionChange = (e: any) => {
        if (e.features && e.features.length > 0) {
            const selectedId = e.features[0].id;
            setActivePolygonId(selectedId);
            lastYRef.current = 0;
        } else {
            setActivePolygonId(null);
            setIsAdjustingFloors(false);
        }
    };

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        if (!mapRef.current) return;

        const features = mapRef.current.queryRenderedFeatures(e.point, {
            layers: polygons.map(p => `extrusion-${p.id}`)
        });

        if (features && features.length > 0) {
            const feature = features[0];
            if (!feature) return;
            let clickedId = null;
            if (feature.properties && feature.properties.id) {
                clickedId = feature.properties.id;
            } else if (feature.id) {
                clickedId = typeof feature.id === 'string' ? feature.id : String(feature.id);
            }

            if (clickedId) {
                const matchingPolygon = polygons.find(p => p.id === clickedId);

                if (matchingPolygon) {
                    setActivePolygonId(matchingPolygon.id);
                    setIsAdjustingFloors(true);
                    lastYRef.current = 0;

                    if (drawRef.current) {
                        drawRef.current.changeMode('simple_select', { featureIds: [matchingPolygon.id] });
                    }
                }
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        const currentActivePolygonId = activePolygonIdRef.current;
        const currentIsAdjustingFloors = isAdjustingFloorsRef.current;

        if (!currentActivePolygonId || !currentIsAdjustingFloors) {
            return;
        }

        if (lastYRef.current === 0) {
            lastYRef.current = e.clientY;
            return;
        }

        const deltaY = lastYRef.current - e.clientY;

        if (Math.abs(deltaY) >= sensitivityRef.current) {
            setPolygons(prev => prev.map(p => {
                if (p.id === currentActivePolygonId) {
                    const floorChange = Math.sign(deltaY);
                    const newFloors = Math.max(1, p.floors + floorChange);
                    return { ...p, floors: newFloors };
                }
                return p;
            }));
            lastYRef.current = e.clientY;
        }
    };

    const handleMouseUp = () => {

    };

    const createFloorLines = (feature: any, polygon: PolygonInfo) => {
        if (!mapRef.current) return;

        const id = feature.id;

        for (let i = 1; i <= 50; i++) {
            if (mapRef.current.getLayer(`floor-line-${id}-${i}`)) {
                mapRef.current.removeLayer(`floor-line-${id}-${i}`);
            }
            if (mapRef.current.getSource(`floor-line-source-${id}-${i}`)) {
                mapRef.current.removeSource(`floor-line-source-${id}-${i}`);
            }
        }

        for (let i = 1; i <= polygon.floors; i++) {
            const floorHeight = i * polygon.floorHeight;

            const lineSourceId = `floor-line-source-${id}-${i}`;

            mapRef.current.addSource(lineSourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: {}
                }
            });

            mapRef.current.addLayer({
                id: `floor-line-${id}-${i}`,
                type: 'fill-extrusion',
                source: lineSourceId,
                paint: {
                    'fill-extrusion-color': '#cacaca',
                    'fill-extrusion-height': floorHeight - 0.1,
                    'fill-extrusion-base': floorHeight - 0.2,
                    'fill-extrusion-opacity': 1.0,
                    'fill-extrusion-vertical-gradient': true
                }
            });
        }
    };

    const createExtrusionLayer = (feature: any, height: number) => {
        if (!mapRef.current) return;

        const id = feature.id;

        mapRef.current.addSource(`source-${id}`, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: feature.geometry,
                properties: { id: id }
            }
        });

        mapRef.current.addLayer({
            id: `extrusion-${id}`,
            type: 'fill-extrusion',
            source: `source-${id}`,
            paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': height,
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 1.0
            }
        });
    };

    const updateExtrusionLayer = (feature: any) => {
        if (!mapRef.current) return;

        const id = feature.id;
        const polygon = polygons.find(p => p.id === id);

        if (!polygon) return;

        if (mapRef.current.getSource(`source-${id}`)) {
            (mapRef.current.getSource(`source-${id}`) as mapboxgl.GeoJSONSource).setData({
                type: 'Feature',
                geometry: feature.geometry,
                properties: { id: id }
            });
        }

        if (mapRef.current.getLayer(`extrusion-${id}`)) {
            mapRef.current.setPaintProperty(
                `extrusion-${id}`,
                'fill-extrusion-height',
                polygon.floors * polygon.floorHeight
            );
        }
    };

    const updateExtrusionLayers = () => {
        if (!mapRef.current || !drawRef.current) return;

        polygons.forEach(polygon => {

            if (mapRef.current!.getLayer(`extrusion-${polygon.id}`)) {
                mapRef.current!.setPaintProperty(
                    `extrusion-${polygon.id}`,
                    'fill-extrusion-height',
                    polygon.floors * polygon.floorHeight
                );
                checkAndExportJson();
                // exportPolygonsToJSON();
                const color = getColorForFloors();
                mapRef.current!.setPaintProperty(
                    `extrusion-${polygon.id}`,
                    'fill-extrusion-color',
                    color
                );

                const feature = drawRef.current.get(polygon.id);
                if (feature) {
                    createFloorLines(feature, polygon);
                }
            } else {
                const feature = drawRef.current.get(polygon.id);
                if (feature) {
                    createFloorLines(feature, polygon);
                    createExtrusionLayer(feature, polygon.floors * polygon.floorHeight);
                }

            }

        });

    };

    const getColorForFloors = (): string => {
        return 'rgb(195,195,195)';
        // return 'rgb(237, 237, 237)';
    };

    const [open, setOpen] = useState(false);

    const hide = () => {
        setOpen(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    const activePolygon = polygons.find(p => p.id === activePolygonId);

    const { Option, OptGroup } = Select;

    const [value, setValue] = useState('Жилое');

    const handleChange = (newValue: string) => {
        setValue(newValue);
    };
    const [previousJson, setPreviousJson] = useState<string | null>(null);



    const sendMessage = (jsonData: string) => {
        if (stompClient && stompClient.active) {
            stompClient.publish({
                destination: '/app/sendMessage',
                body: jsonData, 
            });
            console.log('JSON:', jsonData);
        } else {
            console.error('STOMP client is not active');
        }
    };


    const createJsonFile = useCallback(async (): Promise<string | 0> => {
        if (drawRef.current) {
            const geoData = drawRef.current.getAll();
            const exportData = {
                geoData: geoData,
                polygonInfo: polygons
            };
            return JSON.stringify(exportData, null, 2);
        }
        return 0;
    }, [polygons]);

    const exportPolygonsToJSON = async () => {

        const projectId = getProjectId();
        if (projectId !== null) {
            try {
                const jsonString = await createJsonFile();

                if (typeof jsonString === 'string') {
                    const importedPolygonData = convertToImportedPolygonData(jsonString);

                    await saveJsonProject(projectId, importedPolygonData);

                    const projectData_2 = await fetchProject(projectId);
                    console.log(projectData_2);
                    console.log('exportPolygonsToJSON');

                    sendMessage(projectId!.toString());
                    console.log(projectId!.toString());
                } else {
                    console.error('Ошибка');
                }
            } catch (error) {
                console.error('Ошибка', error);
            }
        }
    };
    const checkAndExportJson = useCallback(async () => {
        try {
            const currentJson = await createJsonFile();

            if (typeof currentJson === 'string') {
                if (previousJson === null || previousJson !== currentJson) {
                    setPreviousJson(currentJson);

                    await exportPolygonsToJSON();
                } else {
                }
            } else {
                console.error('Ошибка');
            }
        } catch (error) {
            console.error('Ошибка', error);
        }
    }, [previousJson, createJsonFile, exportPolygonsToJSON]);
    const importPolygonsFromJSON = useCallback((jsonData: ImportedPolygonData) => {
        try {
            if (jsonData.geoData && jsonData.polygonInfo && drawRef.current) {
                drawRef.current.set(jsonData.geoData);
                setPolygons(jsonData.polygonInfo);
                jsonData.geoData.features.forEach((feature) => {
                    const polygonInfo = jsonData.polygonInfo.find((p: PolygonInfo) => p.id === feature.id);
                    if (polygonInfo) {
                        createExtrusionLayer(feature, polygonInfo.floors * polygonInfo.floorHeight);
                        createFloorLines(feature, polygonInfo);
                    }
                });
                updateExtrusionLayers();
            }
        } catch (error) {
            console.error('Ошибка при импорте JSON:', error);
        }
    }, [createExtrusionLayer, createFloorLines, updateExtrusionLayers]);

    const selectValue = (
        <Select
            value={value}
            onChange={handleChange}
            style={{ width: 200, marginLeft: '5px' }}
            placeholder="Выберите категорию"
        >
            <Option value="Жилое">Жилое</Option>
            <Option value="Общественное">Общественное</Option>
            <Option value="Коммерческое">Коммерческое</Option>
            <Option value="Паркинг">Паркинг</Option>
            <OptGroup label="Площадки">
                <Option value="Спортивные площадки">Спортивные площадки</Option>
                <Option value="Постоянные машино-места">Постоянные машино-места</Option>
                <Option value="Временные машино-места">Временные машино-места</Option>
                <Option value="ДОУ">ДОУ (дошкольное образовательное учреждение)</Option>
                <Option value="Детские площадки">Детские площадки</Option>
                <Option value="Площадки отдыха">Площадки отдыха</Option>
                <Option value="Общая площадь хозяйственных площадок">
                    Общая площадь хозяйственных площадок
                </Option>
            </OptGroup>
        </Select>
    );

    const content = (
        <div>
            {activePolygon ? (
                <>
                    <p>Вид объекта: {selectValue}</p>
                    <p>Площадь: <strong>{activePolygon.area}</strong> m²</p>
                    <p>Этажность: <strong>{activePolygon.floors}</strong></p>
                    <p>Высота: <strong>{Math.round(activePolygon.floors * activePolygon.floorHeight)}</strong> m</p>
                    <p>Кол-во квартир  <strong>{activePolygon.floors}</strong></p>
                </>
            ) : (
                <p>Нет данных для рассчета</p>
            )}
            <a onClick={hide}>Закрыть</a>
        </div>

    );

    const handleExit = () => {
        navigate('/1');
    }

    const [open_area, setOpen_area] = useState<boolean>(false);
    const handleToggle = () => {
        setOpen_area((prev) => !prev);
    };

    const handleOnlyLocal = () => {
        mapRef.current!.removeLayer('delete-build-all-local');
        mapRef.current!.removeLayer('delete-build-closely');
        mapRef.current!.removeLayer('delete-build-local-closely');
        mapRef.current!.removeLayer('white-fill-closely');
        mapRef.current!.addLayer({
            'id': 'delete-build-global',
            'type': 'clip',
            'source': 'global',
            'layout': {

                'clip-layer-types': ['symbol', 'model']
            },
            'maxzoom': 24
        });
        mapRef.current!.addLayer({
            'id': 'delete-build-local',
            'type': 'clip',
            'source': 'local',
            'layout': {

                'clip-layer-types': ['symbol', 'model']
            },
            'maxzoom': 24
        });
        mapRef.current!.addLayer({
            'id': 'white-fill',
            'type': 'fill',
            'source': 'global',
            'paint': {
                'fill-color': 'white',
                'fill-opacity': 1
            }
        });

    };
    const handleAllMap = () => {
        mapRef.current!.removeLayer('delete-build-global');
        mapRef.current!.removeLayer('delete-build-local');
        mapRef.current!.removeLayer('white-fill');
        mapRef.current!.removeLayer('delete-build-closely');
        mapRef.current!.removeLayer('delete-build-local-closely');
        mapRef.current!.removeLayer('white-fill-closely');
        mapRef.current!.addLayer({
            'id': 'delete-build-all-local',
            'type': 'clip',
            'source': 'local',
            'layout': {

                'clip-layer-types': ['symbol', 'model']
            },
            'maxzoom': 24
        });
    };
    const handleClosely = () => {
        mapRef.current!.removeLayer('delete-build-all-local');
        mapRef.current!.removeLayer('delete-build-global');
        mapRef.current!.removeLayer('delete-build-local');
        mapRef.current!.removeLayer('white-fill');
        mapRef.current!.addLayer({
            'id': 'delete-build-closely',
            'type': 'clip',
            'source': 'closely',
            'layout': {
                'clip-layer-types': ['symbol', 'model']
            },
            'maxzoom': 24
        });
        mapRef.current!.addLayer({
            'id': 'delete-build-local-closely',
            'type': 'clip',
            'source': 'local',
            'layout': {
                'clip-layer-types': ['symbol', 'model']
            },
            'maxzoom': 24
        });
        mapRef.current!.addLayer({
            'id': 'white-fill-closely',
            'type': 'fill',
            'source': 'closely',
            'paint': {
                'fill-color': 'white',
                'fill-opacity': 1
            }
        });
    };

    return (
        <>

            <div style={{position: 'relative', width: '100%', height: '100vh'}}>
                <div id="map" ref={mapContainerRef} style={{width: '100%', height: '100%'}} />
                <Button style={{width: '100px', zIndex: 100, left: '94%', marginTop: '10px'}}
                        icon={<ArrowRightOutlined style={{fontWeight: "bold", fontSize: '15px'}}
                                                  onClick={handleExit}/>}/>
                <FloatButton.Group placement="bottom" style={{insetInlineEnd: 50, bottom: 100}}>
                    <FloatButton onClick={handleDrawPolygon} icon={<CodepenOutlined/>}/>
                    <FloatButton onClick={handleDelete} icon={<DeleteOutlined/>}/>
                    <FloatButton.Group
                        open={open_area}
                        trigger="click"
                        placement="left"
                        onClick={handleToggle} icon={<GatewayOutlined/>}
                        style={{insetInlineEnd: 50}}
                    >
                        <FloatButton onClick={handleAllMap}/>
                        <FloatButton onClick={handleClosely}/>
                        <FloatButton onClick={handleOnlyLocal}/>
                    </FloatButton.Group>
                    <FloatButton onClick={exportPolygonsToJSON} icon={<VerticalAlignBottomOutlined/>}
                                 tooltip="Отправить JSON"/>
                    <Popover
                        content={content}
                        title="ТЭП"
                        trigger="click"
                        placement="right"
                        open={open}
                        onOpenChange={handleOpenChange}
                    >
                        <FloatButton icon={<BarChartOutlined/>}/>
                    </Popover>
                </FloatButton.Group>
            </div>
        </>
    );
};
