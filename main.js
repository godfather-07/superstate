// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileDrawer = document.querySelector('.mobile-drawer');
const closeDrawerBtn = document.querySelector('.close-drawer');

if (mobileMenuBtn && mobileDrawer && closeDrawerBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  closeDrawerBtn.addEventListener('click', () => {
    mobileDrawer.classList.remove('open');
    document.body.style.overflow = '';
  });
}

// Hide navbar on scroll down, show on scroll up
const navbar = document.querySelector('.navbar');
if (navbar) {
  let lastScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          navbar.classList.add('navbar--hidden');
        } else {
          navbar.classList.remove('navbar--hidden');
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  });
}

// Fade-up Animation on Scroll
const fadeUpElements = document.querySelectorAll('.fade-up');
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

fadeUpElements.forEach(el => {
  observer.observe(el);
});

// Waitlist Form Handler Simulation
const waitlistForms = document.querySelectorAll('.waitlist-form');
waitlistForms.forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Joined!';
    btn.style.backgroundColor = 'var(--success)';
    btn.style.color = 'white';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.backgroundColor = '';
      btn.style.color = '';
      form.reset();
    }, 3000);
  });
});

// FAQ Accordion Handler
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const header = item.querySelector('.faq-header');
  header.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    
    // Close all other items
    faqItems.forEach(otherItem => {
      otherItem.classList.remove('active');
      const otherContent = otherItem.querySelector('.faq-content');
      if (otherContent) otherContent.style.maxHeight = null;
    });

    if (!isActive) {
      item.classList.add('active');
      const content = item.querySelector('.faq-content');
      if (content) {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    }
  });
});

// Ingredient Carousel Navigation (Infinite Scroll)
const grid = document.getElementById('ing-grid');
const prev = document.getElementById('ing-prev');
const next = document.getElementById('ing-next');

if (grid && prev && next) {
  // Clone cards for infinite effect
  const cards = [...grid.children];
  cards.forEach(card => {
    const clone = card.cloneNode(true);
    grid.appendChild(clone);
  });

  const getScrollAmount = () => {
    const card = grid.querySelector('.ing-card');
    const style = window.getComputedStyle(grid);
    const gap = parseInt(style.gap) || 32;
    return card.offsetWidth + gap;
  };

  next.addEventListener('click', () => {
    const scrollAmount = getScrollAmount();
    const maxScroll = grid.scrollWidth / 2;
    
    if (grid.scrollLeft >= maxScroll - 10) {
      // Jump back to start of first set before scrolling
      grid.scrollTo({ left: 0, behavior: 'instant' });
    }
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  prev.addEventListener('click', () => {
    const scrollAmount = getScrollAmount();
    
    if (grid.scrollLeft <= 5) {
      // Jump to start of second set before scrolling
      grid.scrollTo({ left: grid.scrollWidth / 2, behavior: 'instant' });
    }
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  // Optional: Reset position if user manually scrolls past half
  grid.addEventListener('scroll', () => {
    const maxScroll = grid.scrollWidth / 2;
    if (grid.scrollLeft >= maxScroll * 1.5) {
       grid.scrollLeft -= maxScroll;
    }
  });
}

