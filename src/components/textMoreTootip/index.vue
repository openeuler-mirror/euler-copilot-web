<template>
  <div
    class="vue-text"
    ref="text"
    :style="textStyle"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
  >
    <el-tooltip
      :disabled="isShowHover"
      :enterable="false"
      class="box-item"
      effect="dark"
      :content="value"
      placement="top"
    >
      {{ value }}
    </el-tooltip>
  </div>
</template>

<script>
export default {
  // 显示文字组件，可以设置最多显示几行，超过后会隐藏并且鼠标hover显示全部信息（需要给组件设置宽度）
  name: "VueText",
  props: {
    value: {
      type: String,
      default: "",
    },
    row: {
      //最多显示几行，超过后会...隐藏 为0时不隐藏
      type: [Number, String],
      default: 0,
    },
  },
  data() {
    return {
      isShowHover: false,
      textStyle: {},
      visible: false,
      div: null,
    };
  },
  computed: {
    text() {
      return this.$refs.text;
    },
  },
  watch: {
    row: function (val) {
      this.init();
    },
    value: function () {
      this.isShowHover = false;
      this.textStyle = {
        cursor: "text",
      };
      this.$nextTick(() => {
        this.getStyle(this.row - 0);
      });
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.div = document.querySelector(".hover-wrap");
      if (!this.div && this.row - 0) {
        this.div = document.createElement("div");
        this.div.className = "hover-wrap";
        this.div.style.top = 0;
        this.div.style.left = 0;
        document.body.append(this.div);
      }
      if (this.div && this.row - 0) {
        this.getStyle(this.row - 0);
      }
    },
    getStyle(val) {
      let lineHeight =
        getComputedStyle(this.text).lineHeight.replace("px", "") - 0 || 20;
      let height = getComputedStyle(this.text).height.replace("px", "") - 0;
      if (height > lineHeight * val) {
        this.isShowHover = false;
        this.textStyle = {
          height: `${lineHeight * val}px`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          webkitLineClamp: val,
          webkitBoxOrient: "vertical",
          cursor: "pointer",
        };
      } else {
        this.isShowHover = true;
        this.textStyle = {
          cursor: "text",
        };
      }
    },
    mouseenter(e) {
      if (!this.isShowHover) {
        return;
      }
      let box = e.target.getBoundingClientRect();
      let left = 0;
      this.div.innerHTML = this.value;
      let top = box.top - this.div.getBoundingClientRect().height + "px";
      left =
        box.left +
        (box.width - this.div.getBoundingClientRect().width) / 2 +
        "px";
      this.div.style.top = top;
      this.div.style.left = left;
      this.div.classList.add("active");
      this.div.style.opacity = "0";
      this.visible = true;
    },
    mouseleave(e) {
      if (!this.isShowHover) {
        return;
      }
      if (e.relatedTarget !== this.div) {
        this.div.style.top = 0;
        this.div.style.left = 0;
        this.div.classList.remove("active");
        this.visible = false;
      }
      this.div.onmouseleave = () => {
        this.div.style.top = 0;
        this.div.style.left = 0;
        this.div.classList.remove("active");
      };
    },
  },
};
</script>

<style lang="css">
.hover-wrap {
  position: absolute;
  z-index: -1;
  max-width: 400px;
  padding: 6px 10px;
  font-size: 14px;
  line-height: 1.4;
  color: #666;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 5px;
  opacity: 0;
  transition: opacity 0.3s linear;
}
.vue-text {
  word-break: break-all;
  word-wrap: break-word;
  user-select: none;
  color: var(--o-text-color-primary);
}
.hover-wrap.active {
  z-index: 1999;
  opacity: 1;
}
</style>
