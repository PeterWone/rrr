import { log } from "console";
import { ChapterMeta } from "./extract-story-metadata";

export function extractChapterText(document: Document, chapterMeta: ChapterMeta): string {
  const chapterContentElement = document.querySelector('div.chapter-inner.chapter-content');
  if (chapterContentElement) {
    const elements = chapterContentElement.querySelectorAll('*');
    elements.forEach(element => {
      // Remove elements that contain only whitespace or the chapter title
      if (!element.textContent || !element.textContent.trim() || element.textContent.includes(chapterMeta.title)) {
        element.remove();
      } else {
        // Remove class attribute if the element has a single class with a name that is 44 characters long
        if (element.classList.length === 1 && element.classList[0].length === 44) {
          element.removeAttribute('class');
        }
        if (element.textContent.includes('Royal Road')) {
          element.classList.add("watermark");
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
    return 'WTF';
  }
}

export default extractChapterText;
