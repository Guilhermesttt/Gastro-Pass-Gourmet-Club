import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BenefitCard from '@/components/BenefitCard';
import Timeline from '@/components/Timeline';
import Footer from '@/components/Footer';
import { Utensils, Gift, Star } from 'lucide-react';
import useScrollAnimation from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  // Scroll to section if hash is present in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const benefits = [
    {
      icon: <Utensils className="w-8 h-8" />,
      title: 'Descontos Exclusivos',
      description: 'Economize até 50% em restaurantes selecionados com nossos descontos exclusivos para membros.'
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: 'Benefícios Especiais',
      description: 'Acesso a menus degustação, bebidas cortesia e descontos nos melhores estabelecimento.'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Experiências Premium',
      description: 'Participe de eventos gastronômicos exclusivos e conheça chefs renomados em experiências únicas.'
    }
  ];

  const restaurantPartners = [
    {
      id: '1',
      name: 'La Tratoria',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
      category: 'Italiana • $$',
      location: 'Centro',
      rating: 4.8,
      discount: '15% OFF'
    },
    {
      id: '2',
      name: 'Sushi Kenzo',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
      category: 'Japonesa • $$$',
      location: 'Jardins',
      rating: 4.9,
      discount: '10% OFF'
    },
    {
      id: '3',
      name: 'Burger House',
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1071&q=80',
      category: 'Hamburgeria • $$',
      location: 'Pinheiros',
      rating: 4.6,
      discount: '20% OFF'
    }
  ];

  const animationOptions = { triggerOnce: true, threshold: 0.1 };
  const cardAnimationOptions = { triggerOnce: true, threshold: 0.2 };

  // Hero já tem sua própria animação de entrada
  const benefitsSectionAnim = useScrollAnimation(animationOptions);
  const howItWorksAnim = useScrollAnimation(animationOptions);
  const restaurantsAnim = useScrollAnimation(animationOptions);
  const ctaAnim = useScrollAnimation(animationOptions);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Benefits Section */}
      <section 
        id="benefits" 
        ref={benefitsSectionAnim.ref} 
        className={cn("section animate-on-scroll fade-in-up", { 'is-visible': benefitsSectionAnim.isVisible })}
      >
        <div className="container-custom">
          <div className={cn("text-center mb-10 sm:mb-12 animate-on-scroll fade-in-up", { 'is-visible': benefitsSectionAnim.isVisible })}>
            <h2 className="text-2xl sm:text-primary-dark">Benefícios Exclusivos</h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-foreground">
              Nossos membros têm acesso a vantagens especiais em restaurantes selecionados.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => {
              const cardAnim = useScrollAnimation(cardAnimationOptions);
              return (
                <div 
                  key={index} 
                  ref={cardAnim.ref} 
                  className={cn("animate-on-scroll fade-in-up", { 'is-visible': cardAnim.isVisible }, `delay-${index * 100}`)}
                >
                  <BenefitCard
                    icon={benefit.icon}
                    title={benefit.title}
                    description={benefit.description}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section 
        id="how-it-works" 
        ref={howItWorksAnim.ref} 
        className={cn("section bg-background-secondary animate-on-scroll fade-in-up", { 'is-visible': howItWorksAnim.isVisible })}
      >
        <div className="container-custom">
          <div className={cn("text-center mb-10 sm:mb-12 animate-on-scroll fade-in-up", { 'is-visible': howItWorksAnim.isVisible })}>
            <h2 className="text-2xl sm:text-primary-dark">Como Funciona</h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-foreground">
              Começar a aproveitar os benefícios é simples e rápido.
            </p>
          </div>
          
          <Timeline />
        </div>
      </section>
      
      {/* Restaurant Partners Section */}
      <section 
        id="restaurants" 
        ref={restaurantsAnim.ref} 
        className={cn("section animate-on-scroll fade-in-up", { 'is-visible': restaurantsAnim.isVisible })}
      >
        <div className="container-custom">
          <div className={cn("text-center mb-10 sm:mb-12 animate-on-scroll fade-in-up", { 'is-visible': restaurantsAnim.isVisible })}>
            <h2 className="text-2xl sm:text-primary-dark">Restaurantes Parceiros</h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-foreground">
              Conheça alguns dos restaurantes parceiros que oferecem benefícios exclusivos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {restaurantPartners.map((restaurant, index) => {
              const cardAnim = useScrollAnimation(cardAnimationOptions);
              return (
                <div 
                  key={restaurant.id} 
                  ref={cardAnim.ref} 
                  className={cn("card group cursor-pointer animate-on-scroll fade-in-up", { 'is-visible': cardAnim.isVisible }, `delay-${index * 100}`)}
                >
                  <div className="relative mb-3 sm:mb-4 overflow-hidden rounded-lg shadow-md">
                    <div className="absolute top-0 right-0 bg-primary text-white font-medium px-2 py-0.5 sm:px-3 sm:py-1 z-10 rounded-bl-lg">
                      {restaurant.discount}
                    </div>
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                      <h3 className="font-semibold text-lg text-primary-dark">{restaurant.name}</h3>
                      <div className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded text-sm">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-foreground">
                      <p className="mb-0.5 sm:mb-1">{restaurant.category}</p>
                      <p>{restaurant.location}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className={cn("mt-8 sm:mt-12 text-center animate-on-scroll fade-in-up", { 'is-visible': restaurantsAnim.isVisible }, "delay-300")}>
            <Button 
              variant="default" 
              onClick={() => navigate('/auth')}
              className="px-6 py-2 sm:px-8 sm:py-2 rounded-md text-base sm:text-lg"
            >
              Ver Todos os Restaurantes
            </Button>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section 
        ref={ctaAnim.ref} 
        className={cn("py-10 sm:py-16 bg-primary text-white animate-on-scroll fade-in", { 'is-visible': ctaAnim.isVisible })}
      >
        <div className="container-custom">
          <div className={cn("text-center md:max-w-2xl lg:max-w-3xl mx-auto px-4 animate-on-scroll fade-in", { 'is-visible': ctaAnim.isVisible }, "delay-200")}>
            <h2 className="text-xl sm:text-2xl text-white mb-3 sm:mb-4">Pronto para começar?</h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 text-white">
              Junte-se a milhares de pessoas que já estão economizando e aproveitando experiências gastronômicas exclusivas.
            </p>
            <Button 
              variant="default" 
              onClick={() => navigate('/auth')}
              className="bg-white text-primary hover:bg-gray-100 shadow-md border border-white/30 px-6 py-2 sm:px-8 sm:py-2 rounded-md text-base sm:text-lg"
            >
              Criar Conta Gratuita
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
