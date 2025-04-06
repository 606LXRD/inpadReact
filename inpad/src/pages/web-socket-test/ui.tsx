import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { getAuthToken } from '../../shared/api/http-client';
import SockJS from 'sockjs-client';
import 'global';

export const WebSocketComponent = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [stompClient, setStompClient] = useState<Client | null>(null);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            console.error("Authentication token is missing or invalid");
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('Connected: ', frame);

            client.subscribe('/topic/messages', (message) => {
                if (message.body) {
                    setMessages((prevMessages) => [...prevMessages, message.body]);
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ', frame.headers['message']);
            console.error('Additional details: ', frame.body);
        };

        setStompClient(client);
        client.activate();

        return () => {
            if (client && client.active) {
                client.deactivate();
            }
        };
    }, []);

    const sendMessage = (message: string) => {
        if (stompClient && stompClient.active) {
            stompClient.publish({
                destination: '/app/sendMessage',
                body: message,
            });
        } else {
            console.error('STOMP client is not active');
        }
    };


    return (
        <div>
            <h1>WebSocket Chat</h1>
            <div>
                <h2>Messages:</h2>
                <ul>
                    {messages.map((msg, index) => (
                        <li key={index}>{msg}</li>
                    ))}
                </ul>
            </div>
            <div>
                <input
                    type="text"
                    id="messageInput"
                    placeholder="Введите сообщение"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            sendMessage(e.currentTarget.value);
                            e.currentTarget.value = '';
                        }
                    }}
                />
            </div>
        </div>
    );
};