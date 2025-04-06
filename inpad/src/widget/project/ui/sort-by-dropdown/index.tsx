import { Typography, Select,Button, } from 'antd';
import {SearchOutlined} from '@ant-design/icons';

const { Text } = Typography;

export const SortByDropdown = () => {
    const options = [
        { value: 'created', label: 'Created' },
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Updated' },
    ];

    return (
        <div style={{   display: 'flex',justifyContent: 'center', alignItems: 'center', marginTop: '0.7%', marginLeft: '70%' }}>
            <Text style={{ marginRight: 8 }}>Sort by:</Text>
            <Select defaultValue="created" style={{ width: 120 }}>
                {options.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                        {option.label}
                    </Select.Option>
                ))}
            </Select>
            <Button style={{
                marginRight: '30%',
                width: '30px',
                height: '30px',
                backgroundColor: '#373737',

            }} type="primary" icon={<SearchOutlined style={{

                color: '#fff',

            }}/>} onClick={() => console.log('Search clicked')}>
            </Button>
        </div>
    );
};
