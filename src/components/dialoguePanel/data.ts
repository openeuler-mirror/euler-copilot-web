export const input = {
  event: 'flow.start',
  id: '0f9d3e6b-7845-44ab-b247-35c522d38f13',
  groupId: '09125776-ba69-4832-86c9-c5035f9343fd',
  conversationId: 'eccb08c3-0621-4602-a4d2-4eaada892557',
  task_id: 'eb717bc7-3435-4172-82d1-6b69e62f3fd6',
  flow: {
    appId: 'aops-cve',
    flowId: 'query_cve_info',
    step_name: '开始',
    step_status: 'finished',
    step_progress: '1/4',
  },
  content: {
    question: 'openEuler社区版本有哪些分类？',
    params: {},
  },
  measure: {
    input_tokens: 200,
    output_tokens: 50,
    time: 0.5,
  },
};

export const output = {
  event: 'flow.stop',
  id: '0f9d3e6b-7845-44ab-b247-35c522d38f13',
  groupId: '09125776-ba69-4832-86c9-c5035f9343fd',
  conversationId: 'eccb08c3-0621-4602-a4d2-4eaada892557',
  task_id: 'eb717bc7-3435-4172-82d1-6b69e62f3fd6',
  flow: {
    appId: 'aops-cve',
    flowId: 'query_cve_info',
    step_name: '开始',
    step_status: 'finished',
    step_progress: '1/4',
  },
  content: {
    question: '查询所有主机的CVE信息',
    params: {},
  },
  measure: {
    input_tokens: 200,
    output_tokens: 50,
    time: 0.5,
  },
};
