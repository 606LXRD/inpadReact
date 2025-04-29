import { observer } from 'mobx-react-lite';
import {PictureComponent} from "../../widget/main-page/main-block";
import logoImage from "../../shared/ui/img/Inpadlogo.png";
import {Avatar, Button, Layout} from "antd";
import {FrownOutlined, UserOutlined} from "@ant-design/icons";
import {CreateProjectButton, HeaderComponent} from "../../widget/project/ui";
import {QuestionComponent} from "../../widget/faq/question";
import React from "react";

export const FaqPage = observer(() => {

    return (
        <div style={{background: '#ffffff', height: '100%'}}>
            <HeaderComponent/>
            <h1 style={{textAlign: 'center', paddingBottom: '2%'}}>Часто задаваемые вопросы</h1>
            <QuestionComponent
                title="Как начать работу?"
                description="Это информационный текст о начале работы."
            />
            <QuestionComponent
                title="Как создать объект?"
                description="Это информационный текст о начале работы."
            />
            <QuestionComponent
                title="Как работать с другими пользователями?"
                description="Это информационный текст о начале работы."
            />
            <QuestionComponent
                title="Как начать работу?"
                description="Это информационный текст о начале работы."
            />
        </div>
    );
});

