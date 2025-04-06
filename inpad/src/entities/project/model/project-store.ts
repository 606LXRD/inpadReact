import { makeAutoObservable, runInAction } from 'mobx';
import { Project } from './model';
import { getUserProjects, onCreate } from '../../../shared/api/projects';

interface ProjectResponse {
    id: number;
    projectName: string;
}

class ProjectStore {
    projects: Project[] = [];
    isLoading = false;
    error = '';

    constructor() {
        makeAutoObservable(this);
    }

    loadProjects = async () => {
        try {
            this.isLoading = true;
            const data = await getUserProjects();
            runInAction(() => {
                this.projects = data;
                this.error = '';
            });
        } catch (error) {
            runInAction(() => {
                this.error = error instanceof Error ? error.message : 'ошибка';
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    };

    createProject = async () => {
        this.setLoading(true);
        try {
            const newProject = await onCreate() as ProjectResponse;
            console.log(newProject);
            console.log(newProject.id);

            window.localStorage.setItem('project_id', newProject.id.toString());

            await this.loadProjects();

            // if (newProject && newProject.id) {
            //     navigate(`/previewer/${newProject.id}`);
            // } else {
            //     navigate('/previewer');
            // }
        } catch (error) {
            console.error('Ошибка при создании проекта:', error);
        } finally {
            this.setLoading(false);
        }
    };

    setLoading = (value: boolean) => {
        this.isLoading = value;
    };
}

export const projectStore = new ProjectStore();