import ky from 'ky';


export const getAuthToken = (): string | null => {
    return window.localStorage.getItem('auth_token');
};
export const setAuthHeader = (token: string | null): void => {
    if (token) {
        window.localStorage.setItem('auth_token', token);
    } else {
        window.localStorage.removeItem('auth_token');
    }
};
export const httpClient = ky.create({
    prefixUrl: 'http://localhost:8080/',
    hooks: {
        beforeRequest: [
            (request) => {
                const token = getAuthToken();
                const lastUrlSegment = request.url.split('/').pop() ?? '';
                if (token && !['login', 'register'].includes(lastUrlSegment)) {
                    request.headers.set('Authorization', `Bearer ${token}`);
                }
            },
        ],
    },
});


