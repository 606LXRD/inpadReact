import { Row, Col } from 'antd';
import {ProjectCard} from '../project-card';
import { Project } from '../../../../entities/project/model';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectRowProps {
    projects: Project[];
}

export const ProjectRow: React.FC<ProjectRowProps> = ({ projects }) => {
    return (

        <Row style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: '10%',
            marginRight: '10%',
            }}
             gutter={[8, 16]}>


            {projects.map((project) => (
                <Col
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    key={project.id}
                    span={8}
                >
                    <AnimatePresence>
                    <motion.div
                        initial={{opacity: 0, y: -20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.3}}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                    >
                        <ProjectCard
                            project={{
                                ...project,
                                projectdata: project.projectdata,
                            }}
                        />                    </motion.div>
                    </AnimatePresence>
                </Col>
                ))}

        </Row>
);
};
