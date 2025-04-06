import * as THREE from 'three';

// Social media cards data
const socialCards = [
  { id: 'twitter', name: 'TWITTER', texture: 'assets/images/social/twitter.png', color: 0x56FFEB },
  { id: 'telegram', name: 'TELEGRAM', texture: 'assets/images/social/telegram.png', color: 0xF00AFE },
  { id: 'youtube', name: 'YOUTUBE', texture: 'assets/images/social/youtube.png', color: 0x4642F4 },
  { id: 'discord', name: 'DISCORD', texture: 'assets/images/social/discord.png', color: 0x7A42F4 }
];

// Card dimensions and parameters
const CARD_HEIGHT = 350;
const CARD_ASPECT_RATIO = 0.7;
const CARD_WIDTH = CARD_HEIGHT * CARD_ASPECT_RATIO;
const CARD_GAP = 40;

class Card {
  constructor(data, index, totalCards) {
    this.data = data;
    this.index = index;
    this.totalCards = totalCards;
    this.isHovered = false;
    this.animationOffset = Math.random() * Math.PI * 2;
    this.container = document.createElement('div');
    this.container.className = 'social-card';
    this.container.style.cssText = `
      position: absolute;
      width: ${CARD_WIDTH}px;
      height: ${CARD_HEIGHT}px;
      transition: transform 0.3s ease, opacity 0.3s ease;
    `;

    // Setup Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, CARD_WIDTH / CARD_HEIGHT, 0.1, 1000);
    this.camera.position.z = 300;

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(CARD_WIDTH, CARD_HEIGHT);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Load texture and create mesh
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(data.texture);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      // metalness: 0.0,
      // roughness: 0.3,
      // emissive: new THREE.Color(data.color),
      // emissiveIntensity: 2.5,
      transparent: true,
      opacity: 1,
      side: THREE.FrontSide
    });

    const geometry = new THREE.PlaneGeometry(CARD_WIDTH * 0.8, CARD_HEIGHT * 0.8);
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(data.color, 10, 300);
    pointLight.position.set(0, 0, 50);
    this.scene.add(pointLight);

    // Event listeners
    this.container.addEventListener('mouseenter', () => this.isHovered = true);
    this.container.addEventListener('mouseleave', () => this.isHovered = false);
    this.container.addEventListener('click', () => {
      // Здесь можно добавить обработку клика по карточке
      console.log(`Clicked ${data.name}`);
    });

    this.animate = this.animate.bind(this);
    this.animationFrameId = null;
  }

  setDesktopPosition() {
    const totalWidth = (this.totalCards * CARD_WIDTH) + ((this.totalCards - 1) * CARD_GAP);
    const startX = -totalWidth / 2;
    const x = startX + (this.index * (CARD_WIDTH + CARD_GAP)) + (CARD_WIDTH / 2);
    
    this.container.style.transform = `translateX(${x}px)`;
    this.container.style.opacity = '1';
  }

  setMobilePosition(currentSlide) {
    const distance = Math.abs(this.index - currentSlide);
    const x = (this.index - currentSlide) * (CARD_WIDTH + CARD_GAP);
    
    this.container.style.transform = `translateX(${x}px)`;
    this.container.style.opacity = distance === 0 ? '1' : '0.3';
    
    if (distance > 1) {
      this.container.style.visibility = 'hidden';
    } else {
      this.container.style.visibility = 'visible';
    }
  }

  startAnimation() {
    if (!this.animationFrameId) {
      this.animate();
    }
  }

  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animate() {
    if (!this.container.isConnected) {
      this.stopAnimation();
      return;
    }

    const time = Date.now() * 0.001;

    if (!this.isHovered) {
      this.mesh.rotation.y = Math.sin(time * 0.5 + this.animationOffset) * 0.1;
      this.mesh.position.y = Math.sin(time + this.animationOffset) * 5;
    } else {
      this.mesh.rotation.y += (0 - this.mesh.rotation.y) * 0.1;
      this.mesh.position.y += (0 - this.mesh.position.y) * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  dispose() {
    this.stopAnimation();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    if (this.mesh.material.map) this.mesh.material.map.dispose();
    this.renderer.dispose();
  }
}

export const initSocialCards = () => {
  const containerSection = document.getElementById('social-media-section');
  if (!containerSection) return;

  // Create container for cards
  const container = document.createElement('div');
  container.className = 'social-cards-container';
  container.style.cssText = `
    position: relative;
    width: 100%;
    height: 450px;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  containerSection.appendChild(container);

  // Create cards
  const cards = socialCards.map((data, index) => 
    new Card(data, index, socialCards.length)
  );

  // Add cards to container
  cards.forEach(card => container.appendChild(card.container));

  // Mobile controls
  const mobileControls = document.createElement('div');
  mobileControls.className = 'social-cards-controls';
  mobileControls.innerHTML = `
    <button class="prev-btn" aria-label="Previous slide">←</button>
    <div class="indicators">
      ${cards.map((_, i) => `<button class="indicator${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('')}
    </div>
    <button class="next-btn" aria-label="Next slide">→</button>
  `;
  containerSection.appendChild(mobileControls);

  let currentSlide = 0;
  let autoSlideInterval = null;
  let autoSlideDelay = 3000; // Увеличиваем интервал до 5 секунд
  let isAutoPlayPaused = false;

  const updateSlide = (index, smooth = true) => {
    currentSlide = index;
    cards.forEach(card => {
      if (smooth) {
        card.container.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
      } else {
        card.container.style.transition = 'none';
      }
      card.setMobilePosition(currentSlide);
    });
    
    const indicators = mobileControls.querySelectorAll('.indicator');
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle('active', i === currentSlide);
      indicator.setAttribute('aria-pressed', i === currentSlide);
    });
  };

  const nextSlide = () => {
    if (isAutoPlayPaused) return;
    updateSlide((currentSlide + 1) % cards.length);
  };

  const prevSlide = () => {
    if (isAutoPlayPaused) return;
    updateSlide((currentSlide - 1 + cards.length) % cards.length);
  };

  const startAutoSlide = () => {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    if (!isAutoPlayPaused) {
      autoSlideInterval = setInterval(nextSlide, autoSlideDelay);
    }
  };

  const pauseAutoSlide = () => {
    isAutoPlayPaused = true;
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  };

  const resumeAutoSlide = () => {
    isAutoPlayPaused = false;
    startAutoSlide();
  };

  // Touch events for mobile swipe
  let touchStartX = 0;
  let touchEndX = 0;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    pauseAutoSlide();
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    touchEndX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', () => {
    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) > 50) { // Минимальное расстояние для свайпа
      if (swipeDistance > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    setTimeout(resumeAutoSlide, 3000); // Возобновляем автопрокрутку через 3 секунды после свайпа
  });

  // Mobile controls event listeners
  mobileControls.querySelector('.prev-btn').addEventListener('click', () => {
    prevSlide();
    pauseAutoSlide();
    setTimeout(resumeAutoSlide, 3000);
  });

  mobileControls.querySelector('.next-btn').addEventListener('click', () => {
    nextSlide();
    pauseAutoSlide();
    setTimeout(resumeAutoSlide, 3000);
  });

  mobileControls.querySelectorAll('.indicator').forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      updateSlide(index);
      pauseAutoSlide();
      setTimeout(resumeAutoSlide, 3000);
    });
  });

  // Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach(card => card.startAnimation());
        if (window.innerWidth < 768) {
          resumeAutoSlide();
        }
      } else {
        cards.forEach(card => card.stopAnimation());
        pauseAutoSlide();
      }
    });
  }, { threshold: 0.1 });

  observer.observe(containerSection);

  // Handle responsive design
  const handleResize = () => {
    const isMobile = window.innerWidth < 768;
    mobileControls.style.display = isMobile ? 'flex' : 'none';
    
    if (isMobile) {
      updateSlide(currentSlide, false);
      resumeAutoSlide();
    } else {
      pauseAutoSlide();
      cards.forEach(card => card.setDesktopPosition());
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  // Return cleanup function
  return () => {
    observer.disconnect();
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    cards.forEach(card => card.dispose());
    if (container.parentNode) container.parentNode.removeChild(container);
    if (mobileControls.parentNode) mobileControls.parentNode.removeChild(mobileControls);
    window.removeEventListener('resize', handleResize);
  };
}; 