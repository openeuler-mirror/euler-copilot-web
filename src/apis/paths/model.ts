import { get, post, del } from '../server';

enum Provider {
  OLLAMA = 'Ollama',
  VLLM = 'VLLM',
  QWEN = 'Tongyi-Qianwen',
  XUNFEI = 'XunFei Spark',
  BAICHUAN = 'BaiChuan',
  BAIDU = 'BaiduYiyan',
  MODELSCOPE = 'ModelScope',
}

/**
 * 获取用户的模型列表
 * @returns
 */
const getUserModelList = () => {
  return get<{
    models: {
      modelId: string;
      icon: string;
      description: string;
      name: string;
      model: string;
      url: string;
      provider: string;
      maxTokens: number;
      apiKey: string;
    }[];
    totalModels: number;
  }>('/api/model');
};

/**
 * 获取模型提供商列表
 * @returns
 */
const getModelProviderList = () => {
  return get<{
    providers: {
      providerId: string;
      icon: string;
      url: string;
      description: string;
      name: string;
    }[];
    totalProviders: number;
  }>('/api/model/provider');
};

const getAllModels = (searchKey: string) => {
  return get<{
    models: { modelId: string; modelName: string }[];
  }>('/api/model/all', {
    searchKey,
  });
};

/**
 * 添加模型
 * @param params
 * @returns
 */
const createModel = (params: {
  modelId?: string;
  name: string;
  provider: string;
  icon?: string;
  apiKey: string;
  maxTokens: string;
  model: string;
  url: string;
}) => {
  return post('/api/model', params);
};

/**
 * 删除模型
 * @param modelId
 * @returns
 */
const deleteModel = (modelId: string) => {
  return del(`/api/model/${modelId}`);
};

export const modelApi = {
  getUserModelList,
  getModelProviderList,
  createModel,
  getAllModels,
  deleteModel,
};
