import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'vendly-green': '#A1BC3F',
        'vendly-dark-green': '#8CA437',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
} as Config

export default config