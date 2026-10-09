export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#F3F4F6', // Lighter elegant gray
        sidebar: '#0B1121', // Deep midnight blue
        panel: '#FFFFFF', // Crisp white panels
        primary: '#4F46E5', // Indigo-600
        primaryHover: '#4338CA', // Indigo-700
        secondary: '#0EA5E9', // Sky-500
        critical: '#EF4444', 
        high: '#F97316',
        medium: '#EAB308',
        low: '#10B981',
        text: '#111827', // Gray-900
        muted: '#6B7280', // Gray-500
        border: '#E5E7EB', // Gray-200
        sidebarText: '#F3F4F6', // Gray-100
        sidebarHover: '#1F2937', // Gray-800
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(79, 70, 229, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'sidebar-gradient': 'linear-gradient(180deg, #0B1121 0%, #111827 100%)',
      }
    },
  },
  plugins: [],
}
