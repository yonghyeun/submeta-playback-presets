import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/600.css';
import '@fontsource/noto-sans-kr/700.css';
import '../stories/gallery.css';
export default {
  parameters: {
    layout: 'fullscreen',
    options: {storySort: {order: ['시작', '재생 설정', '조합 요소', '기본 요소']}},
    controls: {expanded: true},
  },
};
