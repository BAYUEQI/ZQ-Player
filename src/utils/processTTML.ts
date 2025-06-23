import type { LyricLine, LyricWord } from '@/types/amll';

/**
 * 从TTML格式解析歌词并转换为AMLL格式
 * @param ttmlContent TTML格式的歌词内容
 * @returns AMLL格式的歌词行数组
 */
export function parseTTMLToAMLL(ttmlContent: string): LyricLine[] {
  if (!ttmlContent) {
    console.error('无法解析TTML：内容为空');
    return [];
  }

  try {
    // 创建一个临时的DOM解析器来解析TTML内容
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(ttmlContent, 'text/xml');
    
    // 检查解析是否成功
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('TTML解析错误：', xmlDoc.getElementsByTagName('parsererror')[0].textContent);
      return [];
    }

    // 获取所有的p标签（歌词行）
    const pElements = xmlDoc.getElementsByTagName('p');
    if (!pElements || pElements.length === 0) {
      console.error('TTML中没有找到歌词行');
      return [];
    }

    // 转换为AMLL格式的歌词行
    const amllLines = [];
    for (let i = 0; i < pElements.length; i++) {
      const p = pElements[i];
      const beginAttr = p.getAttribute('begin');
      const endAttr = p.getAttribute('end');
      
      if (!beginAttr || !endAttr) {
        console.warn(`跳过没有时间属性的歌词行: ${p.textContent}`);
        continue;
      }

      // 解析时间（格式可能是 mm:ss.sss 或 hh:mm:ss.sss）
      // 确保时间值为非负数，避免动画duration为负值
      const startTime = Math.max(0, parseTimeToMs(beginAttr));
      const endTime = Math.max(startTime + 100, parseTimeToMs(endAttr)); // 确保结束时间大于开始时间
      
      if (isNaN(startTime) || isNaN(endTime)) {
        console.warn(`无法解析歌词行的时间: ${beginAttr} - ${endAttr}`);
        continue;
      }

      // 获取主要歌词内容和翻译/音译内容
      let mainContent = p.textContent?.trim() || '';
      let translatedLyric = '';
      let romanLyric = '';
      
      // 查找翻译和音译标签
      const translationSpan = p.querySelector('.translation');
      const romajiSpan = p.querySelector('.romaji');
      
      if (translationSpan) {
        translatedLyric = translationSpan.textContent?.trim() || '';
        // 从主内容中移除翻译部分
        mainContent = mainContent.replace(translatedLyric, '').trim();
      }
      
      if (romajiSpan) {
        romanLyric = romajiSpan.textContent?.trim() || '';
        // 从主内容中移除音译部分
        mainContent = mainContent.replace(romanLyric, '').trim();
      }

      // 创建AMLL格式的歌词行
      // 修改歌词行创建逻辑
      const amllLine: LyricLine = {
        startTime,
        endTime: Math.max(startTime + 100, endTime), // 强制最小间隔
        words: [{
          word: mainContent || '♪',
          startTime,
          endTime: Math.max(startTime + 100, endTime) // 单词级别保护
        }],
        translatedLyric,
        romanLyric,
        isBG: false,
        isDuet: false
      };

      // 确保每个词的持续时间至少为100ms，避免动画问题
      amllLine.words.forEach(word => {
        if (word.endTime <= word.startTime) {
          word.endTime = word.startTime + 100;
        }
      });

      amllLines.push(amllLine);
    }

    // 确保歌词行按时间排序
    amllLines.sort((a, b) => a.startTime - b.startTime);

    return amllLines;
  } catch (error) {
    console.error('解析TTML时发生错误：', error);
    return [];
  }
}

/**
 * 将时间字符串解析为毫秒
 * @param timeStr 时间字符串，格式如 "mm:ss.sss" 或 "hh:mm:ss.sss"
 * @returns 毫秒数
 */
function parseTimeToMs(timeStr: string): number {
  if (!timeStr) return NaN;
  
  // 处理不同格式的时间字符串
  const parts = timeStr.split(':');
  let hours = 0, minutes = 0, seconds = 0;
  
  if (parts.length === 3) {
    // hh:mm:ss.sss 格式
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // mm:ss.sss 格式
    minutes = parseInt(parts[0], 10);
    seconds = parseFloat(parts[1]);
  } else {
    // 尝试直接解析为秒
    seconds = parseFloat(timeStr);
  }
  
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    return NaN;
  }
  
  // 确保返回非负值
  return Math.max(0, (hours * 3600 + minutes * 60 + seconds) * 1000);
}