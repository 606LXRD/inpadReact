import { Layout } from "antd";
import { Outlet } from "react-router-dom";

interface MainLayoutProps {
    children?: React.ReactNode; // Явно указываем, что MainLayout может принимать children
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Layout style={{ minHeight: "100%", background: "#fff" }}>
            <Layout.Content style={{ minHeight: "100%" }}>
                {children || <Outlet />} {/* Если children переданы, отображаем их. Иначе — <Outlet /> */}
            </Layout.Content>
        </Layout>
    );
};