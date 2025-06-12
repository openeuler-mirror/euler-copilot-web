import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

const getApps: MockMethod = {
  url: '/api/app',
  timeout: 200,
  method: 'get',
  response: () => {
    const result = Mock.mock({
      'applications|21': [
        {
          appId: '@guid',
          author: '@cname(2,5)',
          'app_type|1': ['flow', 'agent'],
          description: '@cparagraph()',
          favorited: '@boolean',
          icon: '',
          name: '@cword(3,5)',
          published: '@boolean',
        },
      ],
      totalApps: 21,
      currentPage: 1,
    });
    return {
      code: 200,
      result: result,
      message: 'operation succeed',
    };
  },
};

export const appCenter: Array<MockMethod> = [getApps];
