document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('.case-section');
    const navItems = document.querySelectorAll('.side-nav .nav-item');

    const observerOptions = {
        root: null,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                let id = entry.target.getAttribute('id');
                if (id === 's05-b' || id === 's05-c') id = 's05';
                navItems.forEach((item) => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach((sec) => observer.observe(sec));

    navItems.forEach((item) => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSec = document.querySelector(targetId);
            if (targetSec) {
                targetSec.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

