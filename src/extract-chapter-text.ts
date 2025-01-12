import { log } from "console";

export function extractChapterText(document: Document): string {
  const chapterContentElement = document.querySelector('div.chapter-inner.chapter-content');
  if (chapterContentElement) {
    // Remove block elements that contain only whitespace
    chapterContentElement.querySelectorAll('p, div, span').forEach(element => {
      if (!element.textContent || !element.textContent.trim()) {
        element.remove();
      } else {
        // Remove class attribute if the element has a single class with a name that is 44 characters long
        if (element.classList.length === 1 && element.classList[0].length === 44) {
          element.removeAttribute('class');
        }
        // Remove margin specifications from the style attribute
        if (element.hasAttribute('style')) {
          const style = element.getAttribute('style');
          const newStyle = style?.replace(/margin[^;]*;?/g, '').trim();
          if (newStyle) {
            element.setAttribute('style', newStyle);
          } else {
            element.removeAttribute('style');
          }
        }
      }
    });
    return chapterContentElement.innerHTML.trim();
  } else {
    log('Chapter content element not found');
  }
  return 'WTF';
}

export default extractChapterText;
