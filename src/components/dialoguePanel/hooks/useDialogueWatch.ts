import { ref, watch } from 'vue';
import type { Ref } from 'vue';

// 判断是否点赞,逻辑待补充
export function useIslikeList(isLikeList: Ref<string[] | string | undefined>) {
  const isLike = ref<boolean | undefined>(undefined);
  const isSupport = ref<boolean>(false);
  const isAgainst = ref<boolean>(false);
  const handleIsLike = () => {
    if (isLike.value) {
      isSupport.value = true;
      isAgainst.value = false;
    } else {
      isSupport.value = false;
      isAgainst.value = true;
    }
  };  
  /**
 * 反对
 * @param reason
 * @param reasionLink
 * @param reasonDescription
 */
    watch(
        () => isLikeList,
        (val, oldVal) => {
            handleIsLike();
        },
      );
    return {
        isLike,
    }
}