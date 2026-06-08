document.addEventListener('DOMContentLoaded', () => {
    // Mobilne Menu (Hamburger)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li a');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Zamykanie menu po kliknięciu w link na mobile
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Sticky Navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Blokowanie wysyłania formularza dla dema
    const form = document.getElementById('form-contact');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Dziękujemy za wiadomość! Odezwiemy się wkrótce.');
            form.reset();
        });
    }

    // Scroll Reveal (animacje przy przewijaniu)
    const reveals = document.querySelectorAll('.reveal');
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Animuje się tylko raz
            }
        });
    }, revealOptions);

    // Rozmycie tła podczas przewijania w dół
    const bgSlider = document.querySelector('.hero-slider');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        // Oblicz rozmycie: np. max 25px po 800px scrollu
        const blurValue = Math.min((scrolled / 40), 25);
        if (bgSlider) {
            bgSlider.style.filter = `blur(${blurValue}px)`;
        }
    });

    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });
});
