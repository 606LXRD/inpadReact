import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from '../style.module.css';

interface DeleteTriggerProps {
    onActivate: () => void;
}

export const DeleteTrigger: React.FC<DeleteTriggerProps> = ({ onActivate }) => {
    return (
        <Button
            icon={<DeleteOutlined />}
            onClick={() => {
                onActivate();
            }}
            className={styles.button}
        >
        </Button>
    );
};

interface DeleteActionsProps {
    onCancel: () => void;
    onConfirm: () => void;
}

export const DeleteActions: React.FC<DeleteActionsProps> = ({ onCancel, onConfirm }) => {
    return (
        <div className={`${styles.actions} ${styles.deleteActions}`}>
            <Button style={{background: '#fff', color: '#333', width:'50%', minHeight: '35px', fontSize:'18px',fontWeight: 'bold'}} onClick={onCancel}>Отмена</Button>
            <Button style={{background: '#333', color: '#fff', width:'50%', minHeight: '35px', fontSize:'18px',fontWeight: 'bold'}} onClick={onConfirm}>
                Удалить
            </Button>
        </div>
    );
};