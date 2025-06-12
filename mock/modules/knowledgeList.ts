
import type { MockMethod } from "vite-plugin-mock";
import Mock from 'mockjs';

export default [
  {
    url: "/api/kb",
    method: "post",
    response: () => {
        const result = Mock.mock({
          'tkbList|5': [
            {
                teamId: '@guid',
                teamName: '@cname(2,5)',
                "kbList|5": [{
                    kbId: '@guid',
                    kbName: '@csentence(5,20)',
                    description: '@csentence(10, 50)',
                    isUsed: '@boolean', // 生成随机颜色的图片
                }]
            },
          ],
        });
        return {
          code: 200,
          result: result,
          message: 'operation succeed',
        };
      },
  },
] as MockMethod[];