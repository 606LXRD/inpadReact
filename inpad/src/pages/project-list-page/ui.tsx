import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {projectStore} from "../../entities/project/model";
import {ProjectRow, CreateProjectButton, HeaderComponent, SortByDropdown} from "../../widget/project/ui";
import {FrownOutlined} from "@ant-design/icons";
export const ProjectListPage = observer(() => {

    useEffect(() => {
        projectStore.loadProjects();

    }, []);

    if (projectStore.isLoading && projectStore.projects.length === 0) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;
    }

    if (projectStore.error) {
        return <div>Ошибка: {projectStore.error}</div>;
    }

    return (
        <div style={{background: '#ffffff', height: '100%'}}>
            <HeaderComponent />
            <SortByDropdown />
            <CreateProjectButton/>
            {projectStore.projects.length > 0 ? (
                <ProjectRow projects={projectStore.projects} />
            ) : (
                <h1 style={{textAlign:'center',marginTop:'11%'}}>Нет доступных проектов
                    <br/><FrownOutlined style={{marginTop:'2%',fontSize:'40px'}} />
                </h1>
            )}
        </div>
    );
});

