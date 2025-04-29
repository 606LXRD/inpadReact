import {Project} from '../projects/model.ts';

export type LoginCredentials ={
    login: string;
    password: string;
};

export type UserData = {
    id: number;
    username: string;
    projectList:  Project[];
    state: boolean;
    login: string;
    role: string;
    token?: string;
};

export type LoginParams ={
    id: number;
    username: string;
    login: string;
    token: string;
};

export interface RegistrationData {
    username: string;
    login: string;
    password: string;
    state: boolean;
    projectList: string[];
}

export interface RegisterResponse {
    token: string;
    id: number;
    username: string;
}
