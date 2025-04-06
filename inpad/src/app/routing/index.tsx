import {createBrowserRouter} from "react-router-dom";
import {MainLayout} from "../../shared/ui/main-layout";
import {LoginPage} from "../../pages/login-page";
import {ProjectListPage} from "../../pages/project-list-page";
import {ViewerPage} from "../../pages/viewer-list-page";
import {PreViewerPage} from "../../pages/pre-viewer-page";
import {MainPage} from "../../pages/main-page";
import {WebSocketComponent} from "../../pages/web-socket-test";


export const router = createBrowserRouter([
    {
        path: '/',
        element:<MainLayout/>,
        children:[
            {
                index: true,
                element: <LoginPage/>
            },
            {
                path:':id',
                element:<ProjectListPage/>
            },
            {
                path:'viewer/:projectId',
                element:<ViewerPage/>
            },
            {
                path:'viewer',
                element:<ViewerPage/>
            },
            {
                path:'previewer',
                element:<PreViewerPage/>
            },
            {
                path:'previewer/:projectId',
                element:<PreViewerPage/>
            },
            {
                path:'mainpage',
                element:<MainPage/>
            },
            {
                path:'websocketcomponent',
                element:<WebSocketComponent/>
            },
        ]
    }
])