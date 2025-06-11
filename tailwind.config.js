/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9D6314',       /* Champagne Brown */
          dark: '#A86B1B',        /* Deep Bronze */
        },
        background: {
          DEFAULT: '#F5F5F5',            /* Wine White */
          secondary: '#E4DED7',        /* Soft Taupe */
        },
        foreground: {
          DEFAULT: '#1E1E1E',           /* Charcoal Black - para textos principais e títulos */
          light: '#777777',         /* Gray Text - para parágrafos e textos secundários */
        },
        card: {
          DEFAULT: '#FFFFFF',               /* Elegant White - para o fundo dos cards */
        },
        border: {
          DEFAULT: '#d4d4d4',
        },
        footer: {
          DEFAULT: '#b3721e' /* Cor original do footer */
        }
        // Mantendo accent e secondary para evitar quebras, mas podem ser removidos ou ajustados depois
        // Se não forem usados diretamente nos componentes após a refatoração das classes CSS.
        // Se você quiser, podemos definir novas cores para accent e secondary baseadas na nova paleta.
        ,accent: {
          DEFAULT: '#A86B1B', // Usando primary-dark como accent por enquanto
        },
        secondary: { // Renomeando o secondary original para algo diferente se necessário ou ajustando
          DEFAULT: '#A86B1B', // Usando primary-dark como secondary por enquanto
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)', // Sombra mais suave
        'custom-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)', // Sombra grande mais suave
      },
      borderRadius: {
        'custom': '0.5rem', // Reduzindo um pouco o raio para um look mais sóbrio
      },
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
} 