import { useRef, useCallback, useEffect, useState } from 'react';
import { Button, Select } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import styles from '../style.module.css';
import { fetchUsers } from '../../../../../shared/api/users';
import { updateUserListForProject } from '../../../../../shared/api/projects';
import { Project } from "../../../../../entities/project/model";

interface User {
    id: number;
    username: string;
    state: boolean;
    login: string;
    role: string | null;
    token: string | null;
    projectList: any[] | null;
}

interface AddUsersTriggerProps {
    onActivate: () => void;
}

export const AddUsersTrigger: React.FC<AddUsersTriggerProps> = ({ onActivate }) => {
    return (
        <Button
            icon={<UserAddOutlined />}
            onClick={onActivate}
            className={styles.button}
        >
        </Button>
    );
};

interface AddUsersActionsProps {
    projectId: number;
    project: Project;
    value: User[];
    onCancel: () => void;
    onSave: (selectedUsers: User[]) => void;
    onChange: (newValue: User[]) => void;
}

export const AddUsersActions: React.FC<AddUsersActionsProps> = ({
                                                                    projectId,
                                                                    project,
                                                                    value,
                                                                    onCancel,
                                                                    onSave,
                                                                    onChange,
                                                                }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);


    const handleKeyDown = useCallback(
        async (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                try {

                    const userList = fetchedUsers.filter((user) =>
                        value.some((selectedUser) => selectedUser.id === user.id)
                    );


                    await updateUserListForProject(projectId, userList);

                    onSave(value);
                } catch (error) {
                    console.error('Ошибка при добавлении пользователей:', error);

                }
            }
            if (e.key === 'Escape') {
                onCancel();
            }
        },
        [value, onSave, onCancel, projectId, fetchedUsers, project]
    );


    const handleBlur = useCallback(() => {
        onCancel();
    }, [onCancel]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))
            ) {
                onCancel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onCancel]);

    const handleDropdownVisibleChange = async (open: boolean) => {
        if (open) {
            try {
                const users = await fetchUsers();

                const adaptedUsers: User[] = users.map((userData) => ({
                    ...userData,
                    token: userData.token ?? null,
                }));

                setFetchedUsers(adaptedUsers);

                const dropdownElement = document.querySelector('.ant-select-dropdown') as HTMLDivElement;
                if (dropdownElement) {
                    dropdownRef.current = dropdownElement;
                }
            } catch (error) {
                console.error("Ошибка при получении данных:", error);
            }
        } else {
            dropdownRef.current = null;
        }
    };

    return (
        <div ref={containerRef} className={`${styles.actions} ${styles.addActions}`}>
            <Select
                mode="multiple"
                placeholder="Выберите пользователей"
                value={value.map((user) => user.id.toString())}
                onChange={(newValue) => {
                    const selectedUsers = fetchedUsers.filter((user) =>
                        newValue.includes(user.id.toString())
                    );
                    onChange(selectedUsers);
                }}
                options={fetchedUsers.map((user) => ({
                    label: user.username,
                    value: user.id.toString(),
                }))}
                style={{ width: '100%' }}
                dropdownStyle={{ zIndex: 1001 }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                autoFocus
                onDropdownVisibleChange={handleDropdownVisibleChange}
            />
        </div>
    );
};