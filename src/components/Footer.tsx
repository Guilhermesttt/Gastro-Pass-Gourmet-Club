import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-primary-dark text-white pt-16 pb-8">
      <div className="container-custom">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Column 1: Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white border-b border-white/20 pb-2">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-secondary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/#benefits" className="hover:text-secondary transition-colors">
                  Benefícios
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="hover:text-secondary transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link to="/#restaurants" className="hover:text-secondary transition-colors">
                  Restaurantes Parceiros
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-secondary transition-colors">
                  Área do Cliente
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 2: Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white border-b border-white/20 pb-2">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Mail size={18} className="mr-3 text-secondary" />
                <span>Gastropass01@gmail.com</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-3 text-secondary" />
                <span>(67) 99835-4747</span>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Social */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white border-b border-white/20 pb-2">Redes Sociais</h3>
            <div className="flex space-x-4 mb-8">
              <a href="#" className="w-10 h-10 rounded-custom bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-white transition-colors shadow-custom">
                <Instagram size={20} />
              </a>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-white">Assine nossa newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="px-4 py-2 rounded-l-custom flex-1 text-foreground border-2 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                <button className="bg-primary text-white px-4 py-2 rounded-r-custom hover:bg-primary-dark transition-colors shadow-custom ml-2">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 text-center text-sm">
          <p className="text-white/80">© {new Date().getFullYear()} RestoBenefícios. Todos os direitos reservados.</p>
          <div className="flex justify-center mt-4 space-x-6">
            <Link to="/privacy" className="hover:text-secondary transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/terms" className="hover:text-secondary transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
