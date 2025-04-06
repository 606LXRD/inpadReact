import React from 'react';
import { DeleteTrigger } from './delete-button';
import { EditTrigger } from './edit-button';
import { AddUsersTrigger } from './add-users-button';
import styles from './style.module.css';

interface ButtonCardProps {
    onButtonClick: (buttonType: 'addusers' | 'delete' | 'edit') => void;
}

export const ButtonCard: React.FC<ButtonCardProps> = ({ onButtonClick }) => {
    return (
        <div className={styles.container}>
            <AddUsersTrigger onActivate={() => onButtonClick('addusers')} />
            <DeleteTrigger onActivate={() => onButtonClick('delete')} />
            <EditTrigger onActivate={() => onButtonClick('edit')} />
        </div>
    );
};