import { useRef, useCallback, useEffect } from 'react';
import { Input, Button } from 'antd';
import type { InputRef } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import styles from '../style.module.css';

interface EditTriggerProps {
    onActivate: () => void;
}

export const EditTrigger: React.FC<EditTriggerProps> = ({ onActivate }) => {
    return (
        <Button
            icon={<EditOutlined />}
            onClick={() => {
                onActivate();
            }}
            className={styles.button}
        >
        </Button>
    );
};


interface EditActionsProps {
    value: string;
    onCancel: () => void
    onSave: (newValue: string) => void;
    onChange: (newValue: string) => void;
}

export const EditActions: React.FC<EditActionsProps> = ({ value, onCancel, onSave, onChange }) => {
    const inputRef = useRef<InputRef>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                onSave(value);
            }
        },
        [value, onSave]
    );

    const handleBlur = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return (
        <div className={`${styles.actions} ${styles.editActions}`}>
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Новое название"
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                autoFocus
                className={styles.input}
            />
        </div>
    );
};