import {Button, Image} from 'antd';
import logo1 from "../../../shared/ui/img/logo-man-page.png";
import {useNavigate} from "react-router-dom";
import {projectStore} from "../../../entities/project/model";

export const PictureComponent = () => {
    const navigate = useNavigate();
    const handleStart = async () => {
        navigate('/login');
    };

    return (
        <div style={{ height: '100%', width: '100%', background: '#F4F4F7', paddingInline: 30, display: 'flex', justifyContent: 'center',
             alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', }}>
                <Image src={logo1} preview={false} style={{ width: '70%', height: '70%', display: 'block', margin: '0 auto', marginTop: '14%' }} />
                <div style={{ position: 'absolute', top: '23%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <h1 style={{fontSize:'48px', marginBottom:'5px'}}>Мечтай и придумывай</h1>
                    <h2 style={{fontSize:'20px',color:'#757575',  marginBottom:'30px'}}>Мы поможем воплотить это в реальность</h2>
                    <Button style={{fontSize:'16px',background:'#373737',color:'#fff', width: '200px', height: '50px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.08)',
                        borderRadius: '5px',
                        border: 'none',
                    }}
                    onClick={handleStart}>Начать</Button>
                </div>
            </div>

        </div>



    );
};