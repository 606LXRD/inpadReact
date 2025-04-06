import { observer } from 'mobx-react-lite';
import {PictureComponent} from "../../widget/main-page/main-block";
import logoImage from "../../shared/ui/img/Inpadlogo.png";
import {Avatar, Button, Layout} from "antd";
import {UserOutlined} from "@ant-design/icons";

const { Header } = Layout;
export const MainPage = observer(() => {

    return (
        <div style={{background: '#ffffff', height: '100%'}}>
            <Header style={{ height: '2%',background: '#F4F4F7', paddingInline: 30,marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={logoImage} alt="Логотип" style={{marginRight: 8, height: '25%', width: '25%'}} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button type="text">FAQ</Button>
                    <Button type="text" style={{ marginLeft: 16 }}>ПРОЕКТЫ</Button>
                    <Avatar icon={<UserOutlined />} size={24} style={{ marginLeft: 16 }} />
                </div>
            </Header>
            <PictureComponent/>
        </div>
    );
});

