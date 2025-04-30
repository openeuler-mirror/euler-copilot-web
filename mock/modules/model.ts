import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

const getUserModels: MockMethod = {
  url: '/api/model',
  timeout: 200,
  method: 'get',
  response: () => {
    const result = Mock.mock({
      'models|2': [
        {
          modelId: '@guid',
          icon: 'https://ollama.com/public/ollama.png',
          description: '@paragraph()',
          name: '@word(3,20)',
          url: '@url()',
          model: '@word(3,20)',
          provider: '@word(3,20)',
          maxTokens: '@integer(1,1000)',
          apiKey: '@word(3,20)',
        },
      ],
      totalModels: 2,
    });
    return {
      code: 200,
      result: result,
      message: 'operation succeed',
    };
  },
};

const getModelProviders: MockMethod = {
  url: '/api/model/provider',
  timeout: 200,
  method: 'get',
  response: () => {
    const result = Mock.mock({
      'providers|5': [
        {
          providerId: '@guid',
          url: '@url()',
          icon: 'https://ollama.com/public/ollama.png',
          description: '@cparagraph()',
          name: '@word(3,20)',
        },
      ],
      totalModels: 2,
    });
    return {
      code: 200,
      result: result,
      message: 'operation succeed',
    };
  },
};

const addModel: MockMethod = {
  url: '/api/model',
  timeout: 200,
  method: 'post',
  response: () => {
    const result = Mock.mock({});
    return {
      code: 200,
      result: result,
      message: 'operation succeed',
    };
  },
};

const getAllModels: MockMethod = {
  url: '/api/model/all',
  timeout: 200,
  method: 'get',
  response: () => {
    const result = Mock.mock({
      'models|2': [
        {
          modelId: '@guid',
          modelName: '@word(3,20)',
        },
      ],
    });
    return {
      code: 200,
      result: result,
      message: 'operation succeed',
    };
  },
};

export const model: Array<MockMethod> = [
  getUserModels,
  getModelProviders,
  addModel,
  getAllModels,
];
