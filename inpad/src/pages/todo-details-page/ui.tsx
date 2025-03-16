import {Result, Row} from 'antd';
import {TaskCard, taskModel} from "../../entities/task";
import {observer} from 'mobx-react-lite';
import {ToggleTask} from "../../features/toggle-task";
import {useParams} from 'react-router-dom';
import {useEffect} from 'react';

export const TodoDetailsPage = observer(() => {
    const {store: {getTask, task, isLoading, taskError}} = taskModel;

    const {id} = useParams<{id: string}>();

    useEffect(() => {
        if(id){
            getTask(id);
        }
    },[id]);

    return <Row justify='center' align='middle'>
        {taskError ? (<Result title={taskError}/>
            ):(
            <TaskCard title={`Task#${task?.id}`}
                       text={task?.title||''}
                       loading={isLoading}
                       actions={task ? [<ToggleTask todo={task}/>] : undefined}
            />
        )}
    </Row>;
});
