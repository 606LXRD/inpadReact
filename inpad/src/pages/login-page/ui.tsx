import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Form, message, Radio } from 'antd';
import { login } from '../../shared/api/users';
import { register } from '../../shared/api/users';

export const LoginPage = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);

    const [credentials, setCredentials] = useState({
        username: '',
        login: '',
        password: '',
        state: null,
        projectList: [],
        modelList: [],
    });

    const navigate = useNavigate();

    const handleSubmit = async () => {
        try {
            if (isLoginMode) {
                await login({ login: credentials.login, password: credentials.password });
                message.success('Вход выполнен успешно!');
                navigate('/1');
            } else {
                await register({
                    username: credentials.username,
                    login: credentials.login,
                    password: credentials.password,
                    state: true,
                    projectList: [],
                    modelList: [],
                });
                message.success('Регистрация выполнена успешно!');
                navigate('/1');
            }
        } catch (error) {
            console.error('Error:', error);
            message.error('Произошла ошибка.');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '250px auto', padding: 20,  boxShadow: '0 8px 20px rgba(133, 133, 133, 0.4)', borderRadius: 8 }}>
            <h2 style={{ textAlign: 'center' }}>{isLoginMode ? 'Вход' : 'Регистрация'}</h2>

            <Radio.Group
                value={isLoginMode}
                onChange={(e) => setIsLoginMode(e.target.value)}
                style={{
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '360px',
                }}
            >

                <Radio.Button value={true} style={{ flexGrow: 1,  textAlign: 'center',width:'100px'}}>Вход</Radio.Button>
                <Radio.Button value={false} style={{ flexGrow: 1 ,  textAlign: 'center',width:'100px'}}>Регистрация</Radio.Button>
            </Radio.Group>

            <Form layout="vertical">
                {!isLoginMode && (
                    <Form.Item label="Имя пользователя">
                        <Input
                            placeholder="Введите имя пользователя"
                            value={credentials.username}
                            onChange={(e) =>
                                setCredentials({ ...credentials, username: e.target.value })
                            }
                        />
                    </Form.Item>
                )}

                <Form.Item label="Логин">
                    <Input
                        placeholder="Введите логин"
                        value={credentials.login}
                        onChange={(e) =>
                            setCredentials({ ...credentials, login: e.target.value })
                        }
                    />
                </Form.Item>

                <Form.Item label="Пароль">
                    <Input.Password
                        placeholder="Введите пароль"
                        value={credentials.password}
                        onChange={(e) =>
                            setCredentials({ ...credentials, password: e.target.value })
                        }
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" block onClick={handleSubmit} style={{background:'#303030'}}>
                        {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};