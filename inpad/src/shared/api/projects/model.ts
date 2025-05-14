
interface Geometry {
    type: string;
    coordinates: Array<Array<Array<number>>>;
}

interface Feature {
    id: string;
    type: string;
    properties: object;
    geometry: Geometry;
}

interface GeoData {
    type: string;
    features: Feature[];
}

interface PolygonInfo {
    id: string;
    area: number;
    floors: number;
    floorHeight: number;
}

export interface ProjectData {
    geoData: GeoData;
    polygonInfo: PolygonInfo[];
}

export type Project = {
    id: number;
    projectname: string;
    state: boolean;
    projectinfo: string;
    startCoordinates: any;
    insideCoordinates: any;
    outsideCoordinates: any;
    dtcreation: string,
    dtupdate: string;
    projectdata: ProjectData;
    userList: User[];
};

export type User = {
    id: number;
    username: string;
    state: boolean;
    login: string;
    role: string | null;
    token: string | null;
    projectList: Project[] | null;
};

export type coefficient_factual = {
    id : number;
    projectId : number;
    modelId : string;
    tepId: number;
    flatAreaCoeff: number;
    commAreaCoeff: number;
    parkingFlatCoeff: number;
    parkingCommCoeff: number;
    residentsCoeff: number;
    ddu10Coeff: number;
    utilCoeff: number;
};

export type coefficient_normative ={
    project_id: number;
    model_id : string;
    tep_id: number;
    flat_area_coeff: number;
    comm_area_coeff: number;
    ddu10_coeff: number;
    residents_coeff: number;
    child_coeff: number;
    school_coeff: number;
    ddu25_coeff: number;
    playground_coeff: number;
    sportground_coeff: number;
    recreation_coeff: number;
    util_coeff: number;
};

export type TechEconPerformanceFactual= {
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

export type TEPResponse ={
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
    techEconPerformanceFactual: TechEconPerformanceFactual;
}