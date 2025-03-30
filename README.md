# Metaverse Landing Page

Modern landing page for the metaverse with interactive elements and animations.

## 🚀 Technologies

- HTML5
- SCSS/CSS3
- JavaScript (ES6+)
- Webpack 5
- Bootstrap 5
- AOS (Animate On Scroll)
- Three.js (for starry background)
- GitHub Actions (for automatic deployment)

## 🛠 Project Structure

```
src/
├── assets/
│   ├── icons/          # Icons and logos
│   ├── images/         # Images
│   └── svg/            # SVG files
│       └── circle/     # SVG for animated circles
├── js/
│   ├── components/     # JavaScript components
│   │   ├── roadmap.js # Roadmap section logic
│   │   └── galaxy.js  # Galaxy animation
│   ├── utils/         # Utilities
│   │   └── animationObserver.js # Universal animation observer
│   └── index.js       # Main JavaScript file
├── scss/
│   ├── components/    # Component styles
│   │   ├── _roadmap.scss
│   │   └── _navbar.scss
│   ├── base/         # Base styles
│   │   ├── _reset.scss
│   │   └── _typography.scss
│   └── style.scss    # Main SCSS file
└── index.html        # Main HTML page
```

## ✨ Key Features

### 1. Responsive Design
- Fully responsive interface for all devices
- Mobile navigation with dropdown menu
- Optimized images and animations

### 2. Animations and Interactivity
- Smooth scroll animations (AOS)
- Animated galaxy background (Three.js)
- Interactive roadmap with animated circles
- Animated buttons and hover effects

### 3. Performance Optimization
- Lazy loading of images
- Optimized animations
- CSS and JavaScript minification
- Resource caching

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

## 📄 License

MIT 