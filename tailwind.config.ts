import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 이음 플랫폼 디자인 토큰 (실제 값은 이음 플랫폼 공유 config에서 가져옴)
        eum: {
          primary: '#1E40AF',
          secondary: '#7C3AED',
          accent: '#059669',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
