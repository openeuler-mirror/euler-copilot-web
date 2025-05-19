import { get, post, del, put } from '../server';
import { AddedModalList } from './type';
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
  return get<
    {
      llmId: string;
      icon: string;
      openaiBaseUrl: string;
      openaiApiKey: string;
      modelName: string;
      maxTokens: number;
    }[]
  >('/api/llm');
};

const getModelById = (modelId: string) => {
  return get<{
    modelId: string;
    icon: string;
    model: string;
    url: string;
    provider: string;
    maxTokens: number;
    apiKey: string;
  }>(`/api/model/${modelId}`);
};

/**
 * 获取模型提供商列表
 * @returns
 */
const getModelProviderList = () => {
  return get<
    {
      provider: string;
      icon: string;
      url: string;
      description: string;
    }[]
  >('/api/llm/provider');
};


const getAllModels = (searchKey: string) => {
  return get<{
    models: { modelId: string; modelName: string }[];
  }>('/api/model/model', {
    keyword: searchKey,
  });
};

/**
 * 获取已添加模型列表
 */
const getAddedModels = () => {
  return get<AddedModalList[]>('/api/llm');
};

/**
 * 添加模型
 * @param params
 * @returns
 */
const createOrUpdateModel = (params: {
  llmId?: string;
  icon: string;
  openaiBaseUrl?: string;
  openaiApiKey: string;
  modelName: string;
  maxTokens: number;
}) => {
  return put('/api/llm', params, { llmId: params.llmId });
};

/**
 * 删除模型
 * @param modelId
 * @returns
 */
const deleteModel = (modelId: string) => {
  return del(`/api/llm`, undefined, { llmId: modelId });
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
  createOrUpdateModel,
  getAllModels,
  deleteModel,
  getModelById,
};
