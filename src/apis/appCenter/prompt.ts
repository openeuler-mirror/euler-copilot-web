import { get, post, del } from '../server';

export interface Prompt {
  promptId: string;
  name: string;
  description: string;
  prompt?: string;
}

const PROMPT_URL = '/api/prompt';

/**
 * 查询Prompt列表
 * @param keyword
 * @returns
 */
const getPrompts = (keyword?: string) => {
  return get<{
    prompts: Prompt[];
    totalPrompts: number;
  }>(PROMPT_URL, { keyword });
};

/**
 * 创建或更新Prompt
 * @param params
 * @returns
 */
const createOrUpdatePrompts = (params: {
  name: string;
  description: string;
  prompt: string;
  promptId?: string;
}) => {
  return post<{
    promptId: string;
  }>(PROMPT_URL, params);
};

/**
 * 删除Prompt
 * @param promptId
 * @returns
 */
const deletePrompt = (promptId: string) => {
  return del<{
    promptId: string;
  }>(`${PROMPT_URL}/${promptId}`);
};

export const promptApi = {
  getPrompts,
  createOrUpdatePrompts,
  deletePrompt,
};
