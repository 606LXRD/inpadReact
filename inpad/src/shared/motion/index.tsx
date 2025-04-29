import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export const AnimatedRoutes = () => {
    const location = useLocation();
    const currentOutlet = useOutlet();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {currentOutlet}
            </motion.div>
        </AnimatePresence>
    );
};