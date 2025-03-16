import {Card, Space} from 'antd';
import {Link} from 'react-router-dom';
import {ReactNode} from "react";
type Props = {
    title: string,
    id: number,
    action: ReactNode,
}
export const TaskRow = ({title,id, action}: Props) => {
    return <Card style={{width:'600px'}}>
        <Space>
            {action}
            <Link to={`/${id}`}>{title}</Link>
        </Space>

    </Card>
};