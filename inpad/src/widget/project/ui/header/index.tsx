import { Layout, Avatar, Button, Popover } from 'antd';
import { UserOutlined,ArrowRightOutlined} from '@ant-design/icons';
import logoImage from '../../../../shared/ui/img/Inpadlogo.png';
import {useNavigate} from "react-router-dom";
import {getUserDataById, getUserId} from "../../../../shared/api/users";
import React, {useEffect, useState} from "react";
import {getAuthToken} from "../../../../shared/api/http-client";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {fetchProject, getProjectId} from "../../../../shared/api/projects";

const { Header } = Layout;

export const HeaderComponent = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            const userId = getUserId();
            if (userId !== null) {
                try {
                    const userIdData = await getUserDataById(userId);
                    console.log(userIdData); // Проверяем данные
                    setUsername(userIdData.username);
                    setEmail(userIdData.login);
                } catch (error) {
                    console.error('Ошибка при загрузке данных проекта:', error);
                }
            } else {
                console.error('Project ID is null. Cannot fetch project data.');
            }
        };

        fetchUserData();
    }, []);
    const handleFAQ = () =>{
        navigate(`/faq`);
    }
    const handleProject = () =>{
        const id = getUserId();
        navigate(`/projects/${id}`);
    }
    const [open, setOpen] = useState(false);

    const hide = () => {
        setOpen(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };
    const handleExit = () => {
        navigate('/');
    }
    const content = (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '130px',
            paddingRight: '120px',
            height: '60px',
        }}>
            {/* Логотип */}
            <div style={{marginRight: '16px'}}>
                <Avatar icon={<UserOutlined/>} size={24} style={{marginLeft: 16, height: '48px', width: '48px',}}/>
            </div>

            <div style={{flexGrow: 1,marginLeft: '8px',marginTop: '12px'}}>
                <p style={{fontWeight: 'bold', marginBottom: '0px',marginTop: '1px'}}>{username}</p>
                <p style={{color: '#666', fontSize: '14px',marginTop: '0px'}}>{email}</p>
            </div>
            <Button style={{minWidth: '30px',marginLeft: '10px',}}
                    icon={<ArrowRightOutlined style={{fontWeight: "bold", fontSize: '15px'}}
                                              onClick={handleExit}/>}/>
            <a
                style={{marginLeft: 'auto', cursor: 'pointer', fontSize: '18px', color: '#666'}}
                onClick={hide}
            >
            </a>
        </div>
    );

    return (
        <Header style={{
            marginTop: 10,
            height: '2%',
            background: '#fff',
            paddingInline: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
                <img src={logoImage} alt="Логотип" style={{marginRight: 8, height: '20%', width: '20%'}}/>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
                <Button onClick={handleFAQ} type="text">FAQ</Button>
                <Button onClick={handleProject} type="text" style={{marginLeft: 16}}>ПРОЕКТЫ</Button>
                <Popover
                    content={content}
                    trigger="click"
                    placement="bottom"
                    open={open}
                    onOpenChange={handleOpenChange}
                >
                    <Avatar icon={<UserOutlined/>} size={24} style={{marginLeft: 16}}/>
                </Popover>
            </div>
        </Header>
    );
};