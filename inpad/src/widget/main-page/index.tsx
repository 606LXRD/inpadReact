import {Button, Image} from 'antd';
import logo1 from "../../shared/ui/img/logo-man-page.png";


export const PictureComponent = () => {
    return (
        <div style={{ height: '50%', width: '100%', background: '#fff', paddingInline: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%' }}>
                <Image src={logo1} preview={false} style={{ width: '70%', height: '70%', display: 'block', margin: '0 auto', marginTop: '7%' }} />
                <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <h1 style={{fontSize:'48px', marginBottom:'5px'}}>Мечтай и придумывай</h1>
                    <h2 style={{fontSize:'20px',color:'#757575',  marginBottom:'30px'}}>Мы поможем воплотить это в реальность</h2>
                    <Button style={{fontSize:'16px',background:'#373737',color:'#fff', width: '200px', height: '50px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.08)',
                        borderRadius: '5px',
                        border: 'none',
                    }}>Начать</Button>
                </div>
            </div>
        </div>



    );
};