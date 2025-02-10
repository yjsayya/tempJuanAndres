window.addEventListener('scroll', function() {
    const subTitle = document.querySelector('.header-content-title-sub');
    const mainTitle = document.querySelector('.header-content-title-main');
    if (window.scrollY > 50) {
        subTitle.classList.add('hidden');
        mainTitle.classList.add('enlarged');
    } else {
        subTitle.classList.remove('hidden');
        mainTitle.classList.remove('enlarged');
    }
});