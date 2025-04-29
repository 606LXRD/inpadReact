import React, {useState} from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import {projectStore} from "../../../../entities/project/model";
import {useNavigate} from "react-router-dom";
import {PlusOutlined} from "@ant-design/icons";
import {onCreate} from "../../../../shared/api/projects";

interface ProjectResponse {
    id: number;
    projectName: string;
}

export const CreateProjectButton: React.FC = observer(() => {
    const handleCreateProject = async () => {
        projectStore.createProject();
    };
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);

    const navigate = useNavigate();

    return (
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '50px'}}>
            <Button
                style={{
                    width: '77%',
                    height: '60px',
                    background: hoveredButton === 'add' ?  '#303030' : '#373737',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '48px',
                    boxShadow: '0 5px 10px rgba(0, 0, 0, 0.5)',
                }}
                type="primary"
                icon={<PlusOutlined style={{
                    color: '#fff',
                    paddingLeft: '27%',
                    width: '100px',
                    height: '100px',
                    fontSize: '40px'
                }} />}
                onClick={handleCreateProject}
                loading={projectStore.isLoading}
                onMouseEnter={() => setHoveredButton('add')}
                onMouseLeave={() => setHoveredButton(null)}
            >

            </Button>
        </div>
    );
});

