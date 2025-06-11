import { Star, MapPin, QrCode, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface RestaurantCardProps {
  id: string;
  name: string;
  imageUrl: string;
  category: string; // Keep category as string for now, will map cuisine to it
  location: string;
  address: string;
  rating: number;
  discount: string;
  voucherLink?: string;
  description?: string; // Adicionando a propriedade description
  onClick?: () => void;
  onQrCodeClick?: (event: React.MouseEvent) => void;
}

const RestaurantCard = ({
  id,
  name,
  imageUrl,
  category,
  location,
  address,
  rating,
  discount,
  voucherLink,
  onClick,
  onQrCodeClick,
}: RestaurantCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Format category text to be more readable
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      animate={{ scale: isHovered ? 1.02 : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 cursor-pointer transform transition-all duration-300 hover:shadow-xl relative group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagem com gradientes aprimorados */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          src={imageError ? "/restaurant-placeholder.svg" : imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={handleImageError}
        />
        {/* Overlay gradiente aprimorado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
        
        {/* Badge de desconto aprimorado */}
        <div 
          className="absolute top-4 left-4 bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg transform -translate-y-1 group-hover:translate-y-0 transition-all duration-300"
        >
          {discount}
        </div>

        {/* Botão QR Code aprimorado */}
        {voucherLink && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQrCodeClick?.(e);
            }}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-white hover:scale-110"
            title="Resgatar Benefício"
          >
            <Ticket className="w-5 h-5 text-primary" />
          </button>
        )}
      </div>

      {/* Informações aprimoradas */}
      <div className="p-5 relative">
        {/* Semi-transparent subtle divider */}
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        
        <h3 className="font-bold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-300">
          {name}
        </h3>
        
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-sm font-medium shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            {rating.toFixed(1)}
          </span>
          <span className="text-sm font-medium text-gray-600 px-2.5 py-1 bg-gray-50 rounded-full">
            {formatCategory(category)}
          </span>
        </div>

        <div className="flex items-start gap-3 text-gray-600">
          <div className="bg-primary-50 p-1.5 rounded-full">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{location}</p>
            <p className="text-sm text-gray-500 truncate mt-0.5">{address}</p>
          </div>
        </div>
        
        {/* Card hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out" />
      </div>
    </motion.div>
  );
};

export default RestaurantCard;
