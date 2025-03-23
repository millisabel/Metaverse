# Metaverse Landing Page

A landing page for a metaverse project with starry sky background using Three.js.  
[View Demo](https://millisabel.github.io/Metaverse/)

## Technologies Used

- HTML5, CSS3
- Bootstrap 5
- Three.js for 3D graphics
- GSAP for animations
- JavaScript (ES6+)
- Webpack for bundling
- Sharp for image processing

## Features

- Interactive starry sky background created with Three.js
- Responsive layout with Bootstrap
- Modern design elements
- Animated navbar with GSAP
- SVG favicon with dark/light mode support
- Mobile-friendly navigation
- Neon design elements and highlight effects

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/millisabel/Metaverse.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run locally:
   ```bash
   npm start
   ```

## Project Structure

- `src/` - Source files
  - `js/` - JavaScript files
    - `animations/` - GSAP animations
    - `galaxy/` - Three.js star field implementation
    - `navbar/` - Navbar functionality
  - `scss/` - Styling files
    - `components/` - Component styles
    - `abstracts/` - Variables, mixins, and utilities
  - `assets/` - Images and other assets
- `dist/` - Compiled files
- `index.html` - Main HTML file

## Animations

The project uses GSAP for smooth animations:
- Navbar elements appear with sequential animation
- Menu items have custom entrance animations
- Interactive highlight elements with glow effect

## Responsive Design

- Desktop: Full navigation bar with animated menu items
- Mobile: Collapsible navigation with hamburger menu
- Custom behaviors at different breakpoints

## Deployment

The project is deployed on GitHub Pages. Any changes pushed to the `gh-pages` branch will be automatically deployed.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- SVG favicon with fallback for older browsers
- Support for both light and dark modes