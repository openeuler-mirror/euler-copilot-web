export const Circlelegend = {
  icon: 'circle',
  left: '24px',
  top: '30%',
  orient: 'vertical',
  padding: 24,
  textStyle: {
    fontSize: 12,
    width: 200,
    rich: {
      oneone: {
        fontSize: 16,
        height: 30,
        align: 'right',
      },
    },
  },
};

export const Linetooltip = {
  trigger: 'axis',
  formatter: function (params: any) {
    let res = // 字符串形式的html标签会被echarts转换渲染成数据，这个res主要是画的tooltip里的上部分的标题部分
      "<div style='color:#8D98AA;margin-bottom:16px;padding:0 12px;width:100%;height:24px;line-height:24px;border-radius:3px;font-size:12px'><p>" +
      params[0].name;
    (' </p></div>');
    for (let i = 0; i < params.length; i++) {
      //因为是个数组，所以要遍历拿到里面的数据，并加入到tooltip的数据内容部分里面去
      res += `<div style="color: #4e5865;font-size: 12px;line-height: 24px;width:180px">
                <span style="display:inline-block;border-radius:2px;width:16px;height:3px;background-color:${[
                  params[i].color, // 默认是小圆点，我们将其修改成有圆角的正方形，这里用的是模板字符串。并拿到对应颜色、名字、数据
                ]};"></span>
                ${params[i].seriesName}
                 <span style="display:inline-block;float:right;left:0px;font-size:16px">${params[i].data}</span>
              </div>`;
    }
    return res; // 经过这么一加工，最终返回出去并渲染，最终就出现了我们所看的效果
  },
};
