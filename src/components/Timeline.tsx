
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TimelineStep {
  id: number;
  title: string;
  description: string;
}

const Timeline = () => {
  const steps: TimelineStep[] = [
    {
      id: 1,
      title: "Cadastre-se na plataforma",
      description: "Crie sua conta gratuitamente em menos de 2 minutos."
    },
    {
      id: 2,
      title: "Escolha seu plano",
      description: "Selecione entre nossos planos personalizados para suas necessidades."
    },
    {
      id: 3,
      title: "Descubra restaurantes",
      description: "Explore nossa rede de restaurantes parceiros e seus benefícios."
    },
    {
      id: 4,
      title: "Desfrute dos benefícios",
      description: "Apresente seu cartão virtual e aproveite descontos e vantagens."
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="py-12">
      <div className="relative">
        {/* Timeline line */}
        <div className="hidden md:block absolute left-0 right-0 h-2 bg-secondary/30 top-24"></div>
        
        {/* Timeline points */}
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={step.id} 
              variants={item}
              className={cn(
                "relative flex flex-col items-center text-center",
              )}>
              {/* Number circle */}
              <motion.div 
                whileHover={{ 
                  scale: 1.2, 
                  boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" 
                }}
                className={cn(
                  "w-14 h-14 rounded-custom flex items-center justify-center text-white font-bold mb-4 md:mb-8 z-10",
                  "bg-primary shadow-custom-lg border-2 border-primary-dark"
                )}>
                {step.id}
              </motion.div>
              
              {/* Content */}
              <motion.div 
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
                className="card w-full hover:border-primary/30"
              >
                <h4 className="text-lg font-semibold mb-2 text-primary-dark">{step.title}</h4>
                <p className="text-sm text-foreground-light">{step.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Timeline;
