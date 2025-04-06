import React, { useEffect, useState } from 'react';
import { Card, Image } from 'antd';
import logo from '../../../../shared/ui/img/logo.png';
// import logo from '../../../../shared/map-pic-storage/199.png';
//  import logo from '../../../../public/199.png';

import { ButtonCard } from '../button-card';
import { DeleteActions } from '../button-card/delete-button';
import { EditActions } from '../button-card/edit-button';
import { AddUsersActions } from '../button-card/add-users-button';
import {
    deleteProject, getProjectId,
    onUpdate,
    updateUserListForProject
} from '../../../../shared/api/projects';
import '@ant-design/v5-patch-for-react-19';
import {useNavigate} from "react-router-dom";
import styles from './styles.module.css';

export interface ProjectCardProps {
    project: Project;
}
export interface User {
    id: number;
    username: string;
    state: boolean;
    login: string;
    role: string | null;
    token: string | null;
    projectList: any[] | null;
}
export interface Project {
    id: number;
    projectname: string;
    state: boolean;
    projectinfo: string;
    projectdata: any;
    userList: User[];
}
export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const [showButtons, setShowButtons] = useState(false);
    const [activeMode, setActiveMode] = useState<'addusers' | 'delete' | 'edit' | null>(null);
    const [deleteMode, setDeleteMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [newProjectName, setNewProjectName] = useState(project.projectname || '');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const navigate = useNavigate();
    const handleButtonClick = (buttonType: 'addusers' | 'delete' | 'edit') => {
        console.log(`handleButtonClick called with buttonType: ${buttonType}`);
        setActiveMode(buttonType);

        if (buttonType === 'delete') {
            setDeleteMode(true);
        } else if (buttonType === 'edit') {
            setEditMode(true);
        } else if (buttonType === 'addusers') {
            setIsDropdownOpen(true);
        }
    };

    useEffect(() => {
        if (activeMode === 'delete' && deleteMode) {
            console.log('DeleteActions should be visible now');
        }
        if (activeMode === 'edit' && editMode) {
            console.log('EditActions should be visible now');
        }
    }, [activeMode, deleteMode, editMode]);

    const handleUpdateProject = async (newValue: string) => {
        try {
            const projectId = project.id;
            console.log(projectId);
            const response = await onUpdate(projectId, newValue);
            console.log('Проект успешно обновлен:', response);
            setNewProjectName(newValue);
        } catch (error) {
            console.error('Ошибка при обновлении проекта:', error);
        }
    };

    const handleOpenProject = async()=>{
        try {
            console.log(project.id);
            getProjectId();
            if (project.id) {
                window.localStorage.setItem('project_id', project.id.toString());
                navigate(`/viewer/${project.id}`);
            } else {
                navigate('/viewer');
            }
        } catch (error) {
            console.error('Ошибка при создании проекта:', error);
        }
    }

    const primarySrc = `/${project.id}.png`;
    const [imageSrc, setImageSrc] = React.useState(primarySrc);


    return (
        <Card className={styles.card}>
            <div
                className={styles.imageContainer}
                onMouseEnter={() => setShowButtons(true)}
                onMouseLeave={() => setShowButtons(false)}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest(`.${styles.buttonsContainer}`)) {
                        return;
                    }
                    handleOpenProject();
                }}
            >
                {/*<Image src={logo} preview={false}/>*/}
                <Image
                    src={imageSrc}
                    preview={false}
                    onError={() => {
                        console.error(`Failed to load image: ${imageSrc}`);
                        setImageSrc(logo);
                    }}
                />

                <div
                    className={`${styles.buttonsContainer} ${
                        showButtons ? styles.buttonsContainerVisible : ''
                    }`}
                >
                    <ButtonCard onButtonClick={handleButtonClick}/>
                </div>

            </div>
            <div className={styles.projectInfo}>
                {activeMode === 'delete' && deleteMode && (
                    <DeleteActions
                        onCancel={() => {
                            setDeleteMode(false);
                            setActiveMode(null);
                        }}
                        onConfirm={() => {
                            deleteProject(project.id);
                            setDeleteMode(false);
                            setActiveMode(null);
                        }}
                    />
                )}

                {activeMode === 'edit' && editMode && (
                    <EditActions
                        value={newProjectName}
                        onCancel={() => {
                            setEditMode(false);
                            setNewProjectName(project.projectname || '');
                            setActiveMode(null);
                        }}
                        onSave={(newValue) => {
                            handleUpdateProject(newValue);
                            setEditMode(false);
                            setActiveMode(null);
                        }}
                        onChange={(newValue) => setNewProjectName(newValue)}
                    />
                )}

                {activeMode === 'addusers' && isDropdownOpen && (
                    <AddUsersActions
                        projectId={project.id}
                        project={project}
                        value={selectedUsers}
                        onCancel={() => {
                            setIsDropdownOpen(false);
                            setSelectedUsers([]);
                            setActiveMode(null);
                        }}
                        onSave={async (selectedUsers) => {
                            try {

                                await updateUserListForProject(
                                    project.id,
                                    selectedUsers
                                );

                                console.log('Пользователи успешно добавлены в проект');
                            } catch (error) {
                                console.error('Ошибка при добавлении пользователей:', error);
                            } finally {
                                setIsDropdownOpen(false);
                                setSelectedUsers([]);
                                setActiveMode(null);
                            }
                        }}
                        onChange={(newValue) => setSelectedUsers(newValue)}
                    />
                )}

                {!activeMode && (
                    <>
                        <h2 className={styles.projectName}>
                            {project.projectname || 'Без названия'}
                        </h2>
                        <p className={styles.projectDate}>Создан 20.03.2025</p>
                    </>
                )}
            </div>
        </Card>
    );
};