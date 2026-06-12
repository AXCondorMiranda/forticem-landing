const sidebar =
document.querySelector('.sidebar');

const menuToggle =
document.querySelector('.menu-toggle');

const overlay =
document.querySelector('.overlay');

const logo =
document.querySelector('.logo');

const navItems =
document.querySelectorAll('.nav-item');

let pinned = false;

const closeMobileMenu = () => {

    sidebar.classList.remove(
        'active'
    );

    overlay.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'menu-open'
    );

};

/* =========================
   DESKTOP
========================= */

logo.addEventListener('click', (e) => {

    if(window.innerWidth > 768){

        e.preventDefault();

        pinned = !pinned;

        sidebar.classList.toggle(
            'active'
        );

    }

});

/* =========================
   MOBILE
========================= */

menuToggle.addEventListener('click', () => {

    sidebar.classList.add(
        'active'
    );

    overlay.classList.add(
        'active'
    );

    document.body.classList.add(
        'menu-open'
    );

});

overlay.addEventListener('click', () => {

    closeMobileMenu();

});

navItems.forEach((item) => {

    item.addEventListener('click', () => {

        if(window.innerWidth <= 768){

            closeMobileMenu();

        }

    });

});

window.addEventListener('resize', () => {

    if(window.innerWidth > 768){

        document.body.classList.remove(
            'menu-open'
        );

        overlay.classList.remove(
            'active'
        );

    }

});
