import { get, post, del, put } from '../server';
import { AddedModalList } from './type';
/**
 * 获取用户的模型列表
 * @returns
 */
const getLLMList = () => {
  return get<
    {
      id: string;
      icon: string;
      openaiBaseUrl: string;
      openaiApiKey: string;
      modelName: string;
      maxTokens: number;
    }[]
  >('/api/llm');
};

/**
 * 获取用户的模型列表
 * @returns
 */
const updateLLMList = ({ conversationId, llmId }) => {
  return put('/api/llm/conv', {}, { conversationId, llmId: llmId.llmId });
};

/**
 * 获取已添加模型列表
 */
const getAddedModels = () => {
  return get<AddedModalList[]>('/api/llm');
};

/**
 * 获取 Embedding 配置
 * @returns
 */
const getEmbeddingConfig = () => {
  return get<{
    type: string;
    endpoint: string;
    api_key: string;
    model: string;
    icon?: string;
  }>('/api/llm/embedding');
};

/**
 * 获取 Reranker 配置
 * @returns
 */
const getRerankerConfig = () => {
  return get<{
    type: string;
    name: string;
  }[]>('/api/llm/reranker');
};

export const llmApi = {
  getAddedModels,
  getLLMList,
  updateLLMList,
  getEmbeddingConfig,
  getRerankerConfig,
};
