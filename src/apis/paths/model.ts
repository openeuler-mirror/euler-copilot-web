import { get, post, del } from '../server';
import { addedModalList } from './type';
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

const getKnowledgeList = (conversationId?: string) => {
  return post('/api/kb', { conversationId });
};

const getAllModels = (searchKey: string) => {
  return get<{
    models: { modelId: string; modelName: string }[];
  }>('/api/model/all', {
    searchKey,
  });
};

/**
 * 获取已添加模型列表
 */
const getAddedModels = () => {
  return get<{
    models: addedModalList[];
  }>('/api/model');
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

const updateModelAndKnowLedgeList = (params: {
  conversationId: string;
  modelId: string;
  kbIds: string[];
}) => {
  return post('/api/conversation', params);
};

export const modelApi = {
  updateModelAndKnowLedgeList,
  getAddedModels,
  getUserModelList,
  getModelProviderList,
  createModel,
  getAllModels,
  deleteModel,
  getKnowledgeList,
};
