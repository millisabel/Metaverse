import { gsap } from 'gsap';

export function initNavbarAnimations() {
  if (window.innerWidth >= 991.98) {
    gsap.set('.navbar-nav .nav-item', { 
      opacity: 0,
      y: -30 
    });
  }

  const tl = gsap.timeline({ delay: 0.2 });
  
  // Animate navbar brand
  tl.from('.navbar-brand', {
    duration: 1,
    opacity: 0,
    y: -30,
    ease: 'power2.out'
  });
  
  // Then animate navbar items one by one
  if (window.innerWidth >= 991.98) {
    tl.to('.navbar-nav .nav-item', {
      duration: 1, 
      opacity: 1,
      y: 0, 
      stagger: 0.05,
      ease: 'power2.out'
    }, "0");
  }
}

/**
 * Animation for desktop menu when window size changes
 */
export function animateDesktopMenu() {
  gsap.to('.navbar-nav .nav-item', {
    duration: 1,
    opacity: 1,
    y: 0,
    stagger: 0.15,
    ease: 'power2.out'
  });
}

export function handleResize() {
  const isMobile = window.innerWidth < 991.98;
  const wasDesktop = document.body.classList.contains('was-desktop');
  const isBecomeDesktop = !wasDesktop && !isMobile;
  
  if (isBecomeDesktop) {
    document.body.classList.add('was-desktop');
    
    gsap.set('.navbar-nav .nav-item', { 
      opacity: 0,
      y: -30 
    });
    
    animateDesktopMenu();
  } else if (isMobile) {
    document.body.classList.remove('was-desktop');
  }
}


export function initAllAnimations() {
  if (window.innerWidth >= 991.98) {
    document.body.classList.add('was-desktop');
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    initNavbarAnimations();
    
    window.addEventListener('resize', handleResize);
  });
}
