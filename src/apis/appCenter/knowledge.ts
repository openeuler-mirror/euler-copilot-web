import { get, post, del } from '../server';

export interface KnowledgeBase {
  kbId: string;
  name: string;
  isUsed: boolean;
  description: string;
}

const KNOWLEDGE_URL = '/api/knowledge';

/**
 * 查询Prompt列表
 * @param keyword
 * @returns
 */
const getKnowledgeList = (keyword?: string) => {
  return get<{
    team_kb_list: {
      teamId: string;
      teamName: string;
      kb_list: KnowledgeBase[];
    }[];
  }>(KNOWLEDGE_URL, { kbName: keyword });
};

export const kbApi = {
  getKnowledgeList,
};
