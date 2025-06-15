# Metaverse Landing Page

Modern landing page for the metaverse with interactive elements, 3D-объектами и современными анимациями.

## 🚀 Technologies

- HTML5
- SCSS/CSS3
- JavaScript (ES6+)
- Webpack 5
- Bootstrap 5
- Intersection Observer API
- AOS (Animate On Scroll)
- Three.js (3D, WebGL)
- WebGL (for 3D rendering)
- GitHub Actions (for automatic deployment)
- Design Patterns: Singleton, Observer, Template Method

## 🛠 Project Structure

```
src/
├── assets/
│   ├── icons/          # Icons and logos
│   ├── images/         # Images
│   └── svg/            # SVG files (star, circle, etc.)
├── js/
│   ├── components/
│   │   ├── ui/         # UI components (DynamicStarEffect, etc.)
│   │   ├── three/      # Three.js/3D components
│   ├── controllers/    # Controllers (logic, managers)
│   ├── setup/          # Section/component setup scripts
│   ├── utils/          # Utilities (helpers, logger, animationObserver_CSS, etc.)
│   ├── data/           # Static/config data
│   └── index.js        # Main JavaScript file
├── scss/
│   ├── components/     # Component styles
│   ├── sections/       # Section styles (footer, hero, etc.)
│   ├── abstracts/      # Abstracts/mixins
│   ├── _variables.scss # SCSS variables
│   └── main.scss       # Main SCSS file (imports all others)
└── index.html          # Main HTML page
```

## ✨ Key Features

### 1. Responsive Design
- Fully responsive interface for all devices
- Mobile navigation with dropdown menu
- Optimized images and animations

### 2. Animations, 3D & Interactivity
- Smooth scroll animations (AOS)
- Animated galaxy/star backgrounds (Three.js, WebGL)
- Dynamic animated stars (JS + CSS)
- Interactive roadmap with animated circles
- Animated buttons and hover effects
- Accessibility: semantic HTML, aria-labels, keyboard navigation

### 3. Performance Optimization
- Lazy loading of images
- Optimized animations (requestAnimationFrame, Intersection Observer)
- CSS and JavaScript minification
- Resource caching

### 4. Architecture & Patterns
- Modular SCSS and JS structure
- Design patterns: Singleton (managers), Observer (IntersectionObserver, AnimationObserverCSS), Template Method (abstract base classes)
- Separation of concerns: UI, logic, data, setup

## 🚀 Deployment

The project is automatically deployed to GitHub Pages when pushing to the `main` branch. GitHub Actions builds the project and publishes it to the `gh-pages` branch.

## 🛠 Installation and Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Metaverse.git
```

2. Install dependencies:
```bash
npm install
```

3. Run the project in development mode:
```bash
npm run dev
```

4. Build the project for production:
```bash
npm run build
```

## 📦 Scripts

- `npm run dev` - Run in development mode
- `npm run build` - Build the project
- `npm run preview` - Preview the built project

## 🔧 Configuration

### Webpack
- Configured for SCSS, JavaScript, and image processing
- Production optimization
- Source Maps support for development

### GitHub Actions
- Automatic deployment to GitHub Pages
- Dependency caching
- Build process optimization

## 📱 Supported Browsers

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS, Android)

## 📄 License

MIT 