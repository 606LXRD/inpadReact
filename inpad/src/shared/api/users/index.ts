import {LoginCredentials, LoginParams, UserData,RegistrationData, RegisterResponse} from "./model.ts";
import {httpClient,setAuthHeader,getAuthToken} from "../http-client";

export const getUserDataById = (userId: number): Promise<UserData> => {

    const token = getAuthToken();
    if (!token) {
        throw new Error('Authentication token is missing');
    }

    return httpClient
        .get(`users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .json<UserData>()
        .then((userData) => {

            userData.token = token;
            console.log('Token:', userData.token);
            return userData;
        })
        .catch((error) => {
            console.error('Failed to fetch user data:', error);
            throw error;
        });
};

export const getUserId = (): number | null => {
    const userId = window.localStorage.getItem('user_id');
    return userId ? parseInt(userId, 10) : null;
};

export const login = (credentials: LoginCredentials) =>
    httpClient.post('login', { json: credentials }).json<LoginParams>()
        .then(({ id, token }) => {
            console.log('Received token:', token);
            setAuthHeader(token);
            window.localStorage.setItem('user_id', id.toString());
            console.log('Token saved in localStorage:', getAuthToken());
        })
        .catch((error) => {
            console.error('Login failed:', error);
            throw error;
        });

export const register = (registrationData: RegistrationData) =>
    httpClient.post('register', { json: registrationData })
        .json<RegisterResponse>()
        .then(({ id, token }) => {
            setAuthHeader(token);
            console.log('Received token:', token);
            console.log('User data:', id);
            window.localStorage.setItem('user_id', id.toString());
            return { token, id };
        })
        .catch((error) => {
            console.error('Registration failed:', error);
            throw error;
        });


export const fetchUsers = async (): Promise<UserData[]> => {
    const authToken = getAuthToken();
    if (!authToken) {
        throw new Error('Authentication token is missing');
    }
    return httpClient.get(`users/all`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).json<UserData[]>();
};

