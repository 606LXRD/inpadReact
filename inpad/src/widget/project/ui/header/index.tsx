import { Layout, Avatar, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import logoImage from '../../../../shared/ui/img/Inpadlogo.png';

const { Header } = Layout;

export const HeaderComponent = () => {
    return (
        <Header style={{ marginTop: 10,height: '2%',background: '#fff', paddingInline: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={logoImage} alt="Логотип" style={{marginRight: 8, height:'20%', width:'20%'}} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button type="text">FAQ</Button>
                <Button type="text" style={{ marginLeft: 16 }}>ПРОЕКТЫ</Button>
                <Avatar icon={<UserOutlined />} size={24} style={{ marginLeft: 16 }} />
            </div>
        </Header>
    );
};