import { observer } from 'mobx-react-lite';
import {PictureComponent} from "../../widget/main-page/main-block";
import {Layout} from "antd";
import {BlockInfo} from "../../widget/main-page/block-info";
import photo from "../../shared/ui/img/199.png";
const { Header } = Layout;
export const MainPage = observer(() => {

    return (
        <div style={{background: '#ffffff', height: '100%'}}>
            <Header style={{ height: '2%',background: '#F4F4F7', paddingInline: 30,marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                </div>
            </Header>
            <PictureComponent/>
            <BlockInfo
                title="3D-моделирование"
                text="Интуитивный редактор для создания объектов любой сложности. Работа с жилыми, коммерческими и инфраструктурными проектами."
                image={photo}
                imagePosition="left"
            />

            {/* Изображение справа */}
            <BlockInfo
                title="Автоматические расчеты"
                text="Точные технико-экономические показатели (ТЭП). Сравнение с нормативными требованиями"
                image={photo}
                imagePosition="right"
            />

            <BlockInfo
                title="Интеграция с картографией"
                text="Подгрузка реальных топографических данных. Работа с открытыми картографическими сервисами."
                image={photo}
                imagePosition="left"
            />
            <BlockInfo
                title="Как это работает?"
                text="Выберите участок на интерактивной карте. Создайте модель с помощью простых инструментов. Получите расчеты в один клик"
                image={photo}
                imagePosition="right"
            />

        </div>
    );
});

