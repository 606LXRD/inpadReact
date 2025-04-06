import { getUserDataById, getUserId,} from "../users";
import {UserData} from "../users/model.ts";
import {Project, User, ProjectData} from "./model.ts";
import {httpClient,getAuthToken,setAuthHeader} from "../http-client";

export const getUserProjects = (): Promise<Project[]> => {
    const userId = getUserId();
    console.log('User ID:', userId);

    if (!userId) {
        throw new Error('User ID is missing or invalid');
    }

    return getUserDataById(userId)
        .then((userData) => {
            console.log('User Data:', userData.projectList.length);
            return (userData.projectList || []).map(project => ({
                ...project,
            }));
        })
        .catch((error) => {
            console.error('Failed to fetch user projects:', error);
            throw error;
        });
};
export const onCreate = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('User ID is missing or invalid');
    }
    const userData: UserData = await getUserDataById(userId);
    const requestBody = {
        projectName: "untitled",
        state: true,
        projectInfo: "untitled",
        projectData: null,
        userList: [userData],
        startCoordinates: null,
        insideCoordinates: null,
        outsideCoordinates: null,
        dtCreation: null,
        dtUpdate: null
    };

    const authToken = getAuthToken();
    if (!authToken) {
        throw new Error('Authentication token is missing');
    }

    return httpClient.post('projects/', {
        json: requestBody,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).json();
};

export const deleteProject = (id: number) => {
    httpClient.delete(`projects/${id}`)
        .then((response) => {
            console.log('Project deleted successfully:', response);
        })
        .catch((error) => {
            console.error('Failed to delete project:', error);
            if (error.response && error.response.status === 401) {
                console.warn('Unauthorized access detected. Clearing auth token.');
                setAuthHeader(null);
            }
            throw error;
        });
}

export const getProjectId = (): number | null => {
    const projectId = window.localStorage.getItem('project_id');
    return projectId ? parseInt(projectId, 10) : null;
};

export const fetchProject = async (id: number): Promise<Project> => {
    const authToken = getAuthToken();
    if (!authToken) {
        throw new Error('Authentication token is missing');
    }

    return httpClient.get(`projects/${id}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).json<Project>();
};

export const onUpdate = async (id: number, projectName: string) => {
    if (!id) {
        throw new Error('Project ID is missing or invalid');
    }

    const project = await fetchProject(id);

    const updatedProject = {
        id: project.id,
        projectName: projectName,
        state: project.state,
        projectInfo: project.projectinfo,
        startCoordinates: project.startcoordinates,
        insideCoordinates: project.startcoordinates,
        outsideCoordinates: project.startcoordinates,
        dtCreation: project.dtcreation,
        dtUpdate: project.dtupdate,
        projectData: project.projectData,
        userList: project.userList,
    };

    const authToken = getAuthToken();
    if (!authToken) {
        throw new Error('Authentication token is missing');
    }

    return httpClient.put(`projects/${id}`, {
        json: updatedProject,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).json();
};

export const updateUserListForProject = async (id: number, userList: User[]) => {
    if (!id) {
        throw new Error('Project ID is missing or invalid');
    }

    const project = await fetchProject(id);
    const updatedProject = {
        id: project.id,
        projectName: project.projectname,
        state: project.state,
        projectInfo: project.projectinfo,
        startCoordinates: project.startcoordinates,
        insideCoordinates: project.startcoordinates,
        outsideCoordinates: project.startcoordinates,
        dtCreation: project.dtcreation,
        dtUpdate: project.dtupdate,
        projectData: project.projectData,
        userList: userList,
    };

    const authToken = getAuthToken();
    if (!authToken) {
        throw new Error('Authentication token is missing');
    }

    return httpClient.put(`projects/${id}`, {
        json: updatedProject,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).json();
};

export const saveJsonProject = async (id: number, projectdata: ProjectData)    => {
    if (!id) {
        throw new Error('Project ID is missing or invalid');
    }

    const project = await fetchProject(id);

    const updatedProject = {
        id: project.id,
        projectName: project.projectname,
        state: project.state,
        projectInfo: project.projectinfo,
        startCoordinates: project.startcoordinates,
        insideCoordinates: project.startcoordinates,
        outsideCoordinates: project.startcoordinates,
        dtCreation: project.dtcreation,
        dtUpdate: project.dtupdate,
        projectData: projectdata,
        userList: project.userList,
    };

    const authToken = getAuthToken();
    if (!authToken) {
        throw new Error('Authentication token is missing');
    }

    return httpClient.put(`projects/${id}`, {
        json: updatedProject,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).json();
};

export const setAllCordsForProject = async (projectId: number, start_coordinates: string, inside_coordinates: string,
                                                                       outside_coordinates: string) => {
    const authToken = getAuthToken();
    if (!projectId) {
        throw new Error('Project ID is missing or invalid');
    }

    if (!authToken) {
        throw new Error('Authentication token is missing');
    }
    const project = await fetchProject(projectId);
    console.log('project.userListproject.userList',project.userList);
    const requestBody = {
        id: projectId,
        projectName: project.projectname,
        state: project.state,
        projectInfo: project.projectinfo,
        startCoordinates: start_coordinates,
        insideCoordinates: inside_coordinates,
        outsideCoordinates: outside_coordinates,
        dtCreation: project.dtcreation,
        dtUpdate: project.dtupdate,
        projectData: project.projectData,
        userList: project.userList,
    };

    console.log(requestBody);
    return httpClient.put(`projects/${projectId}`, {
        json: requestBody,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).json();
};
