import {Layout} from 'antd';
import {Outlet} from "react-router-dom";

export const MainLayout = () =>{
    return (
        <Layout
            style={{minHeight: '100%',background:'#fff'}}>
            <Layout.Content style={{minHeight: '100%'}}>
                <Outlet/>
            </Layout.Content>
        </Layout>
    )
}