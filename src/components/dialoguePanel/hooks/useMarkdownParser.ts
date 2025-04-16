import { computed, ref } from "vue";
import type { Ref } from "vue";
import { marked } from "marked";
import xss from "xss";
export function useMarkdownParser(content: Ref<string | string[]>, currentSelected: Ref<number>) {
    const thoughtContent = ref('');
    // 解析Markdown
    const contentAfterMark = computed(() => {
        if (!content) {
          return '';
        }
        //xxs将大于号转为html实体以防歧义；将< >替换为正常字符；
        let str = marked.parse(
            xss(content.value[currentSelected.value])
              .replace(/&gt;/g, '>')
              .replace(/&lt;/g, '<'),{
                  async:false
              }
          );
        //将table提取出来中加一个<div>父节点控制溢出
        let tableStart = str.indexOf('<table>');
        if (tableStart !== -1) {
          str =
            str.slice(0, tableStart) +
            '<div class="overflowTable">' +
            str
              .slice(tableStart, str.indexOf('</table>') + '</table>'.length)
              .replace('</table>', '</table></div>') +
            str.slice(str.indexOf('</table>') + '</table>'.length);
        }
        //仅获取第一个遇到的 think 标签
        const startIndex = str.indexOf('<think>');
        const endIndex = str.indexOf('</think>');
        if (startIndex !== -1 && endIndex === -1) {
          // 计算 <a> 之后的字符串
          const contentAfterA = str.substring(startIndex + 7); // +2 是因为我们要跳过 <a> 这两个字符
          thoughtContent.value = contentAfterA;
          return '';
        } else if (str && startIndex !== -1 && endIndex !== -1) {
          thoughtContent.value = str.match(/<think>([\s\S]*?)<\/think>/)?.[1] || '';
        }
        return str.replace(/<think>([\s\S]*?)<\/think>/g, '');
      });
      
    return {
        thoughtContent,
        contentAfterMark
    }
}