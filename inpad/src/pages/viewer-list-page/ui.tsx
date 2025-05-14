import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { CodepenOutlined, DeleteOutlined, GatewayOutlined, BarChartOutlined,ArrowRightOutlined} from "@ant-design/icons";
import {Button, FloatButton, Popover, Radio, Select, Input} from 'antd';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {useNavigate} from "react-router-dom";
import {
    getProjectId,
    fetchProject,
    onSetFactCoeff,
    fetchTEPofID
} from "../../shared/api/projects";
import {Client} from "@stomp/stompjs";
import {getAuthToken} from '../../shared/api/http-client';
import SockJS from 'sockjs-client';
import 'global';
import {getUserId} from "../../shared/api/users";


interface PolygonInfo {
    id: string;
    area: number;
    floors: number;
    comm_floors: number;
    floorHeight: number;
}
interface TechEconPerformance {
    id: number;
    floorNum: number;
    apartsArea: number;
    commArea: number;
    douArea: number;
    apartsParkingSpotAmount: number;
    commParkingSpotAmount: number;
    residentsNum: number;
    douPlacesNum: number;
    souPlacesNum: number;
    totalDouArea: number;
    totalPlaygroundArea: number;
    totalSportgroundArea: number;
    totalRecreationArea: number;
    totalUtilArea: number;
}

interface TEPResponse {
    id: number;
    projectId: number;
    modelId: string;
    tepId: number;
    flatAreaCoeff: number;
    commAreaCoeff: number;
    parkingFlatCoeff: number;
    parkingCommCoeff: number;
    residentsCoeff: number;
    ddu10Coeff: number;
    utilCoeff: number;
    techEconPerformanceFactual: TechEconPerformance; // <-- нужное поле
}
interface ImportedPolygonData {
    projectId: number | null;
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

    const [teps, setTeps] = useState<TechEconPerformance | null>(null);

    const [activePolygonId, setActivePolygonId] = useState<string | null>(null);
    const [isAdjustingFloors, setIsAdjustingFloors] = useState(false);
    const navigate = useNavigate();
    const [messages, setMessages] = useState<string[]>([]);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isBuildingFloors, setIsBuildingFloors] = useState(false);
    const [floorSettings, setFloorSettings] = useState<{ floors: number; floorHeight: number }>({
        floors: 1,
        floorHeight: 3,
    });
    function convertToImportedPolygonData(input: string): ImportedPolygonData {
        const parsedData = JSON.parse(input);

        if (!parsedData.geoData || !parsedData.polygonInfo) {
            throw new Error("Invalid input format. Missing required fields.");
        }
        const projectId = getProjectId();
        const result: ImportedPolygonData = {
            projectId: projectId,
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
                comm_floors: info.comm_floors || 0,
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
        const projectId = getProjectId();
        client.onConnect = (frame) => {
            client.subscribe(`/topic/messages/${projectId}`, (message) => {
                if (message.body) {
                    setMessages((prevMessages) => [...prevMessages, message.body]);
                    const importedData = convertToImportedPolygonData(message.body);
                    importPolygonsFromJSON(importedData);
                    console.log(frame,messages);
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
          console.log('activePolygonIdRef',activePolygonIdRef.current);
          if(activePolygonIdRef.current!==null) {
              loadTEP(activePolygonIdRef.current);
          }
    }, [activePolygonId]);
    useEffect(() => {
        isAdjustingFloorsRef.current = isAdjustingFloors;
    }, [isAdjustingFloors]);

    const [centerCoordinates, setCenterCoordinates] = useState<[number, number]>();
    const [insideCoordinates, setInsideCoordinates] = useState<[number, number][]>([]);
    const [projectName, setProjectName] = useState<string | null>(null);

    useEffect(() => {
        const loadProjectData = async () => {
            const projectId = getProjectId();
            if (projectId !== null) {
                try {
                    const prj_inf = await fetchProject(projectId);
                    const startCoordinatesString = prj_inf.startCoordinates;
                    const insideCoordinatesString = prj_inf.insideCoordinates;
                    setProjectName(prj_inf.projectname);
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
                    if (insideCoordinatesString) {
                        const cleanedString = insideCoordinatesString.replace(/[\[\]]/g, '');

                        const flatCoordinates = cleanedString.split(',').map(Number);

                        if (flatCoordinates.every((coord: number) => !isNaN(coord))) {
                            const coordinates: [number, number][] = [];
                            for (let i = 0; i < flatCoordinates.length; i += 2) {
                                coordinates.push([flatCoordinates[i], flatCoordinates[i + 1]]);
                            }

                            if (coordinates.length > 0) {
                                coordinates.push(coordinates[0]);
                            }

                            setInsideCoordinates(coordinates);

                        } else {
                            console.error('Некорректные координаты:', insideCoordinatesString);
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
                zoom: 15.3,
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
                                        insideCoordinates
                                    ]
                                }
                            }
                        ]
                    }
                });
                mapRef.current!.addSource('local', {
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
                                        insideCoordinates
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
    useEffect(() => {
        const timer = setTimeout(() => {
            if (mapRef.current) {
                const id = getProjectId();
                const fileName = `${id}.png`;
                const dataUrl = mapRef.current.getCanvas().toDataURL();
                const link = document.createElement('a');
                link.download = fileName;
                link.href = dataUrl;
                link.click();
            }
        }, 2000);

        return () => {
            clearTimeout(timer);
        };

    }, []);
    useEffect(() => {
        console.log(isAdjustingFloorsRef.current, isAdjustingFloors)
        if (isAdjustingFloorsRef.current === true && isAdjustingFloors === true) {
            exportPolygonsToJSON();
        }

        isAdjustingFloorsRef.current = isAdjustingFloors;
    }, [isAdjustingFloors]);

    const loadProject = async () => {
        const projectId = getProjectId();
        console.log('projectId',projectId);
        if (projectId !== null) {
            try {
                const projectData = await fetchProject(projectId);
                const jsonPolyData = projectData.projectdata;
                console.log(projectData.projectdata);
                if (jsonPolyData) {
                    importPolygonsFromJSON(jsonPolyData as ImportedPolygonData);
                    console.log('importPolygonsFromJSON');
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
        const roundedArea = 0;

        const newPolygon = {
            id: newFeature.id,
            area: roundedArea,
            floors: 1,
            comm_floors: 0,
            floorHeight: floorHeightRef.current
        };
        setPolygons(prev => [...prev, newPolygon]);
        setActivePolygonId(newFeature.id);
        setIsAdjustingFloors(true);
        lastYRef.current = 0;
        setIsBuildingFloors(true);
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
        // console.log('1');
        const features = mapRef.current.queryRenderedFeatures(e.point, {
            layers: polygons.map(p => `extrusion-${p.id}`)
        });
        // console.log('2');
        // console.log(activePolygon);

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

            const color = i <= polygon.comm_floors ? '#FF0000' : '#cacaca'; // Красный для коммерческих, серый для остальных

            mapRef.current.addLayer({
                id: `floor-line-${id}-${i}`,
                type: 'fill-extrusion',
                source: lineSourceId,
                paint: {
                    'fill-extrusion-color': color,
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

                const feature = drawRef.current.get(polygon.id);
                if (feature) {
                    createFloorLines(feature, polygon); // Обновляем слои этажей
                }
            } else {
                const feature = drawRef.current.get(polygon.id);
                if (feature) {
                    createExtrusionLayer(feature, polygon.floors * polygon.floorHeight);
                    createFloorLines(feature, polygon);
                }
            }
        });
    };

    const [open, setOpen] = useState(false);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    const activePolygon = polygons.find(p => p.id === activePolygonId);

    const { Option, OptGroup } = Select;

    const [value, setValue] = useState('Жилое');

    const handleChange = (newValue: string) => {
        setValue(newValue);
    };

    const createJsonFile = useCallback(async (): Promise<string | 0> => {
        if (drawRef.current) {
            const geoData = drawRef.current.getAll();
            const projectId = getProjectId();
            const exportData = {
                projectId: projectId,
                geoData: geoData,
                polygonInfo: polygons
            };
            return JSON.stringify(exportData, null, 2);
        }
        return 0;
    }, [polygons]);
    const sendMessage = (data: any) => {
        const projectId = getProjectId();
        if (stompClient && stompClient.active) {
            stompClient.publish({
                destination: `/app/sendMessage/${projectId}`,
                body: JSON.stringify(data),
                headers: {
                    'content-type': 'application/json'
                }
            });
            console.log(data);
        } else {
            console.error('STOMP client is not active');
        }
    };

    const exportPolygonsToJSON = async () => {
        console.log('ExportPolygonsToJSON-1');
        const projectId = getProjectId();
        if (projectId !== null) {
            try {
                console.log('ExportPolygonsToJSON-2');
                const jsonString = await createJsonFile();
                if (typeof jsonString === 'string') {
                    const jsonData = JSON.parse(jsonString); // Парсим строку в объект
                    sendMessage(jsonData); // Отправляем объект
                }
            } catch (error) {
                console.error('Error exporting polygons', error);
            }
        }
    };
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
            style={{ width: 270, marginLeft: '5px' }}
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
    const [selectedOption, setSelectedOption] = useState(null);
    const [additionalOption, setAdditionalOption] = useState(null);
    const [coeffValues, setCoeffValues] = useState({
        flat_area_coeff: 0,
        comm_area_coeff: 0,
        parking_flat_coeff: 0,
        parking_comm_coeff: 0,
        residents_coeff: 0,
        ddu10_coeff: 0,
        util_coeff: 0
    });


    const handleSendCoefficients = async () => {
        const projectId = getProjectId();

        if (projectId !== null && activePolygon) {
            try {
                await onSetFactCoeff(
                    projectId,
                    activePolygon.id,
                    coeffValues.flat_area_coeff,
                    coeffValues.comm_area_coeff,
                    coeffValues.parking_flat_coeff,
                    coeffValues.parking_comm_coeff,
                    coeffValues.residents_coeff,
                    coeffValues.ddu10_coeff,
                    coeffValues.util_coeff
                );
            } catch (error) {
                console.error('Error', error);
            }
        }
    }


    const loadTEP = async (apId: string) => {
        console.log('apID', apId);
        try {
            const tep_inf: TEPResponse = await fetchTEPofID(apId); // Теперь TS знает про .techEconPerformanceFactual
            console.log('tep_inf_opopo', tep_inf);

            if (tep_inf?.techEconPerformanceFactual) {
                setTeps(tep_inf.techEconPerformanceFactual); //  Теперь всё работает
            } else {
                console.warn('Фактические данные ТЭП отсутствуют');
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных ТЭП:', error);
        }
    };

    const content = (
        <div style={{minWidth:'300px'}}>
            {/* ТЭП и Коэффициенты */}
            <Radio.Group
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 0,
                    width: '100%',
                    marginBottom: '2%',
                }}
            >
                <Radio.Button
                    value="tep"
                    style={{ flexGrow: 1, textAlign: 'center', width: '100px' }}
                >
                    ТЭП
                </Radio.Button>
                <Radio.Button
                    value="coeff"
                    style={{ flexGrow: 1, textAlign: 'center', width: '100px' }}
                >
                    Коэффициенты
                </Radio.Button>
            </Radio.Group>

            {/* Вкладка "ТЭП" */}
            {selectedOption === "tep" && activePolygon ? (
                <div>
                    <Radio.Group
                        value={additionalOption}
                        onChange={(e) => setAdditionalOption(e.target.value)}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 0,
                            width: '100%',
                        }}
                    >
                        <Radio.Button
                            style={{
                                textAlign: 'center',
                                width: '100%',
                            }}
                            value="norm"
                        >
                            Нормативные
                        </Radio.Button>
                        <Radio.Button
                            style={{
                                textAlign: 'center',
                                width: '100%',
                            }}
                            value="fact"
                        >
                            Фактические
                        </Radio.Button>
                    </Radio.Group>
                    <>
                        <p>Тип объекта: {selectValue}</p>
                        {/*object_type int,*/}
                        {/*object_subtype int,*/}
                        <p>Этажность: <strong>{activePolygon.floors}</strong></p>
                        {/*floor_num int,*/}
                        <p>Высота: <strong>{Math.round(activePolygon.floors * activePolygon.floorHeight)} м</strong></p>
                        <p>Общая площадь квартир: <strong>{activePolygon.area} м²</strong></p>
                        {/*aparts_area real,*/}
                        <p>Общая площадь коммерции, м² <strong>{teps?.apartsArea} м²</strong> </p>
                        {/*comm_area real,*/}
                        <p>Общая площадь ДОУ, м²</p>
                        {/*dou_area real,*/}
                        <p>Количество машино-мест жилых объектов, м/м</p>
                        {/*aparts_parking_spot_amount int,*/}
                        <p>Количество машино-мест коммерции, м/м</p>
                        {/*comm_parking_spot_amount int,*/}
                        <p>Количество жителей, чел.</p>
                        {/*residents_num real,*/}
                        <p>Количество мест в ДОУ, чел.</p>
                        {/*dou_places_num real,*/}
                        <p>Количество мест в СОУ, чел.</p>
                        {/*sou_places_num real,*/}
                        <p>Общ. Площ. Территории ДОУ, м²</p>
                        {/*total_dou_area real,*/}
                        <p>Общ. Площ. Детских площадок, м²</p>
                        {/*total_playground_area real,*/}
                        <p>Общ. Площ. Спорт. площадок, м²</p>
                        {/*total_sportground_area real,*/}
                        <p>Общ. Площ. площадок отдыха, м²</p>
                        {/*total_recreation_area real,*/}
                        <p>Общ. Площ. хозяйственных площадок, м²</p>
                        {/*total_util_area real,*/}
                    </>
                </div>
            ) : selectedOption === "tep" && !activePolygon ? (
                <p    style={{fontSize:'18px', textAlign: 'center'}}>Нет данных для расчета</p>
            ) : null}

            {/* Вкладка "Коэффициенты" */}
            {selectedOption === "coeff" && (
                <div>
                    <Radio.Group
                        value={additionalOption}
                        onChange={(e) => setAdditionalOption(e.target.value)}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 0,
                            width: '100%',
                        }}
                    >
                        <Radio.Button
                            style={{
                                textAlign: 'center',
                                width: '100%',
                            }}
                            value="option1"
                        >
                            Нормативные
                        </Radio.Button>
                        <Radio.Button
                            style={{
                                textAlign: 'center',
                                width: '100%',
                            }}
                            value="option2"
                        >
                            Фактические
                        </Radio.Button>
                    </Radio.Group>
                    {additionalOption === "option1" && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Общая площадь квартир */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь квартир</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* flat_area_coeff real, */}

                            {/* Общая площадь коммерции */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь коммерции</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* comm_area_coeff real, */}

                            {/* Общая площадь ДОУ */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь ДОУ</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* ddu10_coeff real, */}

                            {/* Количество жителей */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Количество жителей, чел.</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* residents_coeff real, */}

                            {/* Количество мест в ДОУ */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Количество мест в ДОУ, чел.</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* child_coeff real, */}

                            {/* Количество мест в СОУ */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Количество мест в СОУ, чел.</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* school_coeff real, */}

                            {/* Общая площадь территории ДОУ */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь территории ДОУ</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* ddu25_coeff real, */}

                            {/* Общая площадь детских площадок */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь детских площадок</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* playground_coeff real, */}

                            {/* Общая площадь спортивных площадок */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь спортивных площадок</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* sportground_coeff real, */}

                            {/* Общая площадь площадок отдыха */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь площадок отдыха</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* recreation_coeff real, */}

                            {/* Общая площадь хозяйственных площадок */}
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <span>Общая площадь хозяйственных площадок</span>
                                <Input placeholder="Введите значение..." style={{ width: '200px' }} />
                            </p>
                            {/* util_coeff real, */}
                        </div>
                    )}
                    {additionalOption === "option2" && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <span>Общая площадь квартир</span>
                                <Input
                                    placeholder="Введите значение..."
                                    style={{ width: '200px' }}
                                    onChange={(e) => setCoeffValues(prev => ({...prev, flat_area_coeff: parseFloat(e.target.value)}))}
                                />
                            </p>
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <span>Общая площадь коммерции</span>
                                <Input
                                    placeholder="Введите значение..."
                                    style={{ width: '200px' }}
                                    onChange={(e) => setCoeffValues(prev => ({...prev, comm_area_coeff: parseFloat(e.target.value)}))}
                                />
                            </p>
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <span>Кол-во машино-мест жилых объектов, м/м</span>
                                <Input
                                    placeholder="Введите значение..."
                                    style={{ width: '200px' }}
                                    onChange={(e) => setCoeffValues(prev => ({...prev, parking_flat_coeff: parseFloat(e.target.value)}))}
                                />
                            </p>
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <span>Кол-во машино-мест коммерции, м/м</span>
                                <Input
                                    placeholder="Введите значение..."
                                    style={{ width: '200px' }}
                                    onChange={(e) => setCoeffValues(prev => ({...prev, parking_comm_coeff: parseFloat(e.target.value)}))}
                                />
                            </p>
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <span>Кол-во жителей, чел.</span>
                                <Input
                                    placeholder="Введите значение..."
                                    style={{ width: '200px' }}
                                    onChange={(e) => setCoeffValues(prev => ({...prev, residents_coeff: parseFloat(e.target.value)}))}
                                />
                            </p>
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <span>Общая площадь ДОУ</span>
                                <Input
                                    placeholder="Введите значение..."
                                    style={{ width: '200px' }}
                                    onChange={(e) => setCoeffValues(prev => ({...prev, ddu10_coeff: parseFloat(e.target.value)}))}
                                />
                            </p>
                            <p style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <span>Общ. Площ. хозяйственных площадок, м²</span>
                                <Input
                                    placeholder="Введите значение..."
                                    style={{ width: '200px' }}
                                    onChange={(e) => setCoeffValues(prev => ({...prev, util_coeff: parseFloat(e.target.value)}))}
                                />
                            </p>
                            <Button
                                onClick={handleSendCoefficients}
                                style={{ marginTop: '20px', alignSelf: 'center' }}
                            >
                                Отправить коэффициенты
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
    const handleExit = () => {
        const id = getUserId();
        navigate(`/projects/${id}`);
    }
    const [open_area, setOpen_area] = useState<boolean>(false);
    const handleToggle = () => {
        setOpen_area((prev) => !prev);
    };

    const handleOnlyLocal = () => {
        // mapRef.current!.removeLayer('delete-build-all-local');
        // mapRef.current!.removeLayer('delete-build-closely');
        // mapRef.current!.removeLayer('delete-build-local-closely');
        mapRef.current!.removeLayer('delete-build-all-local');

        mapRef.current!.addLayer({
            'id': 'delete-build-global',
            'type': 'clip',
            'source': 'local',
            'layout': {

                'clip-layer-types': ['symbol', 'model']
            },
            'maxzoom': 24
        });
        mapRef.current!.addLayer({
            'id': 'delete-build-local',
            'type': 'clip',
            'source': 'global',
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
        // mapRef.current!.removeLayer('delete-build-global');
        // mapRef.current!.removeLayer('delete-build-local');
        // mapRef.current!.removeLayer('white-fill');

        mapRef.current!.removeLayer('white-fill');
        mapRef.current!.removeLayer('delete-build-local');
        mapRef.current!.removeLayer('delete-build-global');
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



    return (
        <>

            <div style={{position: 'relative', width: '100%', height: '100vh'}}>

                <div id="map" ref={mapContainerRef} style={{width: '100%', height: '100%'}}/>
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        textAlign: 'center',
                        color: '#373737',
                        fontSize: '8px',
                        fontWeight: 'bold',
                    }}
                >
                    <h1>{projectName}</h1>
                </div>
                {/* Панель настройки этажей */}
                {isBuildingFloors && activePolygonId && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 20,
                            right: 20,
                            backgroundColor: "white",
                            padding: "10px",
                            borderRadius: "5px",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                            zIndex: 1000,
                        }}
                    >
                        <h4>Настройка этажей</h4>
                        <div style={{ marginBottom: "10px" }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Этажность:</label>
                            <Input
                                type="number"
                                value={floorSettings.floors}
                                onChange={(e) =>
                                    setFloorSettings({ ...floorSettings, floors: parseInt(e.target.value, 10) })
                                }
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div style={{ marginBottom: "10px" }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Высота этажа (м):</label>
                            <Input
                                type="number"
                                value={floorSettings.floorHeight}
                                onChange={(e) =>
                                    setFloorSettings({ ...floorSettings, floorHeight: parseFloat(e.target.value) })
                                }
                                style={{ width: "100%" }}
                            />
                        </div>
                        <Button
                            type="primary"
                            onClick={() => {
                                setPolygons((prev) =>
                                    prev.map((p) =>
                                        p.id === activePolygonId
                                            ? { ...p, floors: floorSettings.floors, floorHeight: floorSettings.floorHeight }
                                            : p
                                    )
                                );

                                setIsBuildingFloors(false);

                                updateExtrusionLayers();
                            }}
                            style={{ width: "100%" }}
                        >
                            Задать
                        </Button>
                    </div>
                )}

                <Button style={{width: '100px', zIndex: 100, left: '94%', marginTop: '10px'}}
                        icon={<ArrowRightOutlined style={{fontWeight: "bold", fontSize: '15px'}}
                                                  onClick={handleExit}/>}/>
                <FloatButton.Group placement="bottom" style={{insetInlineEnd: 50, bottom: 100}}>
                    <FloatButton onClick={handleDrawPolygon} tooltip="Нарисовать полигон" icon={<CodepenOutlined/>}/>
                    <FloatButton onClick={handleDelete} tooltip="Удалить полигон" icon={<DeleteOutlined/>}/>
                    <FloatButton.Group
                        open={open_area}
                        trigger="click"
                        placement="left"
                        onClick={handleToggle} icon={<GatewayOutlined/>}
                        style={{insetInlineEnd: 50}}
                    >
                        <FloatButton onClick={handleAllMap} tooltip="Полная карта"/>
                        <FloatButton onClick={handleOnlyLocal} tooltip="Только территория"/>
                    </FloatButton.Group>
                    {/*<FloatButton  icon={<VerticalAlignBottomOutlined/>}*/}
                    {/*             tooltip="Отправить JSON"/>*/}
                    <Popover
                        content={content}
                        trigger="click"
                        placement="right"
                        open={open}
                        onOpenChange={handleOpenChange}
                        style={{width:'30%'}}
                    >
                        <FloatButton icon={<BarChartOutlined/>} tooltip="ТЭП"/>
                    </Popover>
                </FloatButton.Group>
            </div>
        </>
    );
};
