import { nextTick, onBeforeUnmount, onMounted, ref, Ref } from 'vue';

interface ScrollOptions {
  // 滚动检测阈值（像素）
  threshold?: number;
}

export function useScrollBottom(
  containerRef: Ref<HTMLElement | null>,
  options: ScrollOptions = {},
) {
  const { threshold = 10 } = options;

  const isAutoScrolling = ref(true);
  let scrollTimeout: any = undefined;

  const scrollController = {
    get isAtBottom() {
      if (!containerRef.value) return false;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
      return scrollTop + clientHeight >= scrollHeight - threshold;
    },

    get shouldAutoScroll() {
      return this.isAtBottom && isAutoScrolling.value;
    },

    checkScrollPosition() {
      const wasAtBottom = isAutoScrolling.value;
      isAutoScrolling.value = this.isAtBottom;

      // 当从底部移出时立即停止自动滚动
      if (wasAtBottom && !this.isAtBottom) {
        stopAutoScroll();
      }
    },
  };

  const stopAutoScroll = () => {
    isAutoScrolling.value = false;
    clearTimeout(scrollTimeout);
  };

  async function scrollToBottom(force: boolean = false) {
    if (!containerRef.value) return;
    if (force) {
      await nextTick();
      containerRef.value.scrollTo({
        top: containerRef.value.scrollHeight,
        behavior: 'smooth',
      });
    }

    if (!scrollController.shouldAutoScroll) return;

    await nextTick();
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth',
    });
  }

  function onChatContainerScroll() {
    if (!containerRef.value) return;
    scrollController.checkScrollPosition();
    resetAutoScrollTimer();
  }

  const resetAutoScrollTimer = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (scrollController.shouldAutoScroll) {
        scrollToBottom();
      }
    }, 100);
  };

  onMounted(() => {
    containerRef.value?.addEventListener('scroll', onChatContainerScroll, {
      passive: true,
    });
  });

  onBeforeUnmount(() => {
    containerRef.value?.removeEventListener('scroll', onChatContainerScroll);
    scrollTimeout && clearTimeout(scrollTimeout);
  });

  return {
    scrollToBottom,
  };
}
