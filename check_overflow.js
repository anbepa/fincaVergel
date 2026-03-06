// Check for horizontal overflow
const body = document.body;
const html = document.documentElement;
const elements = document.querySelectorAll('*');
let overflowElements = [];

elements.forEach(el => {
  if (el.scrollWidth > el.clientWidth || el.offsetWidth > window.innerWidth) {
    overflowElements.push({
      tag: el.tagName,
      class: el.className,
      width: el.offsetWidth,
      scrollWidth: el.scrollWidth
    });
  }
});

console.log('Window width:', window.innerWidth);
console.log('Body width:', body.offsetWidth);
console.log('Html width:', html.offsetWidth);
console.log('Overflow elements:', overflowElements.slice(0, 10));
