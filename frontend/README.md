# xerostark App

A React + Vite + TypeScript application with Tailwind CSS, featuring light/dark theme support.

## Features

- ⚡ **Vite** - Fast build tool and dev server
- ⚛️ **React 18** - Modern React with TypeScript
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🌓 **Light/Dark Theme** - Toggle between themes with persistent storage
- 🎯 **Reusable Components** - Pre-built UI components and styles
- 📱 **Responsive Design** - Mobile-first approach

## Project Structure

```
xerostark-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Header.tsx
│   ├── contexts/         # React contexts (Theme, etc.)
│   │   └── ThemeContext.tsx
│   ├── pages/           # Page components
│   │   └── Home.tsx
│   ├── styles/          # Global styles and Tailwind config
│   │   └── index.css
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Styling System

### Custom Tailwind Classes

The app includes pre-configured utility classes:

#### Buttons
- `.btn` - Base button styles
- `.btn-primary` - Primary purple button
- `.btn-secondary` - Secondary dark button
- `.btn-outline` - Outlined button

#### Cards
- `.card` - Base card component
- `.card-hover` - Card with hover effects

#### Inputs
- `.input` - Styled input field

#### Layout
- `.container-custom` - Max-width container with padding

#### Text
- `.gradient-text` - Gradient text effect

### Theme Colors

```javascript
primary: '#8B5CF6'      // Purple
dark-900: '#0F0F1E'     // Darkest background
dark-800: '#1A1A2E'     // Dark background
accent-blue: '#3B82F6'  // Blue accent
accent-pink: '#EC4899'  // Pink accent
```

## Theme System

The app uses React Context for theme management:

```tsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

## Adding New Pages

1. Create a new component in `src/pages/`
2. Import and add to your routing system (to be implemented)
3. Use the pre-built styles and components

Example:

```tsx
import React from 'react';

const MyNewPage: React.FC = () => {
  return (
    <div className="container-custom py-20">
      <h1 className="text-4xl font-bold text-white mb-4">
        My New Page
      </h1>
      <p className="text-gray-400">
        Content here...
      </p>
    </div>
  );
};

export default MyNewPage;
```

## Pre-built Components

### Header
Sticky navigation with theme toggle and wallet connect button.

### Home Page
Hero section with stats and featured circuits grid.

## Customization

### Colors
Edit `tailwind.config.js` to customize the color palette.

### Fonts
Edit `index.html` to change the Google Fonts import.

### Global Styles
Edit `src/styles/index.css` for custom CSS components.

## License

MIT
