import React, { useState } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
type MenuItem = Required<MenuProps>['items'][number];

interface QuestionComponentProps {
    title: string;
    description: string;
}

export const QuestionComponent: React.FC<QuestionComponentProps> = ({ title, description }) => {
    const [selectedKey, setSelectedKey] = useState<string>('');

    const onClick: MenuProps['onClick'] = (e) => {
        console.log('click ', e);
        setSelectedKey(e.key);
    };

    const items: MenuItem[] = [
        {
            key: 'sub1',
            label: (
                <div style={{ color: '#373737', fontSize: '20px', padding: '4px 8px',}}>
                    {title}
                </div>
            ),
            children: [
                {
                    key: '1',
                    label: (
                        <div style={{ color: '#373737', fontSize: '14px', padding: '4px 8px' }}>
                            {description}
                        </div>
                    ),
                    disabled:true,
                },
            ],
        },
        {
            type: 'divider',
        },
    ];

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                background: '#ffffff',
                paddingInline: 30,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
            }}
        >
            <Menu
                onClick={onClick}
                style={{ width: '80%' }}
                mode="inline"
                items={items}
                selectedKeys={[selectedKey]}
            />
        </div>
    );
};