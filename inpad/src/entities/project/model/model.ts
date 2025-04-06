
export interface User {
    id: number;
    username: string;
    state: boolean;
    login: string;
    role: string | null;
    token: string | null;
    projectList: any[] | null;
}

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
    startcoordinates: any;
    insidecoordinates: any;
    outsidecoordinates: any;
    dtcreation: string,
    dtupdate: string;
    projectData: ProjectData;
    userList: User[];
};
