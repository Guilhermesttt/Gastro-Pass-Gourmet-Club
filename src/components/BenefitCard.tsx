
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BenefitCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const BenefitCard = ({ icon, title, description }: BenefitCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="card group hover:border-primary/30 transition-all duration-300"
    >
      <motion.div 
        whileHover={{ rotate: 5 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="rounded-custom bg-primary/10 w-16 h-16 flex items-center justify-center mb-6 text-primary border-2 border-primary/30 shadow-custom group-hover:bg-primary/20"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-3 text-primary-dark">{title}</h3>
      <p className="text-foreground-light">{description}</p>
    </motion.div>
  );
};

export default BenefitCard;
