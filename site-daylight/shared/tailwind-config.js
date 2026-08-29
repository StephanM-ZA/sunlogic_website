tailwind.config = {
  theme: {
    extend: {
      colors: {
        background: '#0a0804',
        surface: '#4c2806',
        'text-primary': '#fff7e9',
        'text-muted': '#514e4a',
        border: '#1c1c1c',
        accent: '#c8b2ff',
        danger: '#f66f00',
        warning: '#dacab6',
        info: '#321f61',
      },
      fontFamily: {
        display: ['featureDeck', 'sans-serif'],
        body: ['aeonikPro', 'sans-serif'],
        mono: ['socialMono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        '3xl': '16px',
      },
    },
  },
};
