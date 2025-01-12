import { log } from "console";

export function extractChapterText(document: Document): string {
  const chapterContentElement = document.querySelector('div.chapter-inner.chapter-content');
  if (chapterContentElement) {
    return chapterContentElement.innerHTML.trim();
  } else {
    log('Chapter content element not found');
  }
  return 'WTF';
}

export default extractChapterText;
