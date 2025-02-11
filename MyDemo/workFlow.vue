<script setup lang="ts">
import '../../styles/workFlowArrange.scss';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElTooltip } from 'element-plus';
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import CustomEdge from './workFlowConfig/CustomEdge.vue';
import CustomNode from './workFlowConfig/CustomNode.vue';
import CustomControl from './CustomControl.vue';
import CustomSaENode from './workFlowConfig/CustomSaENode.vue';
import useDragAndDrop from './workFlowConfig/useDnD';
import WorkFlowDialog from './workFlowConfig/workFlowDialog.vue';
import WorkFlowDebug from './workFlowDebug.vue';
import { useLayout } from './workFlowConfig/useLayout';
import { IconSearch, IconCaretRight, IconCaretDown, IconPlusCircle } from '@computing/opendesign-icons';
import EditYamlDrawer from './workFlowConfig/yamlEditDrawer.vue';
import { api } from 'src/apis';
import yaml from 'js-yaml';

const { t } = useI18n();
const copilotAside = ref<HTMLElement>();
const isCopilotAsideVisible = ref(true);
const apiSearchValue = ref();
const activeNames = ref([]);
const activeName = ref();
const workFlowItem = ref();
const isAddWorkFlow = ref(false);
const editData = ref();
const dialogType = ref('');
const isEditYaml = ref(false);
const nodeName = ref();
const flowZoom = ref(1);
const debugDialogVisible = ref(false);
const isNodeAndLineConnect = ref(false);
const apiServiceList = ref([]);
const yamlContent = ref();
const emits = defineEmits(['validateConnect']);
const hanleAsideVisible = () => {
  if (!copilotAside.value) return;
  if (isCopilotAsideVisible.value) {
    isCopilotAsideVisible.value = false;
  } else {
    isCopilotAsideVisible.value = true;
  }
};

const {
  onConnect,
  updateNode,
  updateEdgeData,
  addEdges,
  getNodes,
  getEdges,
  findNode,
  removeNodes,
  setViewport,
  getViewport,
  fitView,
  setNodes,
  setEdges,
} = useVueFlow();
const { layout } = useLayout();

const { onDragOver, onDrop, onDragLeave, isDragOver, onDragStart } = useDragAndDrop();
// 这里是初始化的开始结束的节点
const nodes = ref([
  {
    id: 'node1',
    type: 'custom-start',
    data: {
      name: '开始',
      desc: '',
      nodePosition: 'Right',
      target: 'source',
    },
    position: { x: 100, y: 160 },
  },
  {
    id: 'node2',
    type: 'custom-end',
    data: {
      name: '结束',
      desc: '',
      nodePosition: 'Left',
      target: 'target',
    },
    position: { x: 600, y: 160 },
  },
]);
// 开始的边默认为空数组【当然回显时应该有值】
const edges = ref([]);
// 下方为死数据--之后有接口请将其替换为接口
const nodeStancesList = ref([
  {
    id: '11',
    type: 'custom',
    mark: 'iiiiii',
    data: {
      label: '知识库(成功节点)',
      desc: '这里是知识库说明',
      status: 'success',
    },
  },
  {
    id: '12',
    type: 'custom',
    mark: 'iiiiii',
    data: {
      label: 'LLM(失败节点)',
      desc: '调用大模型，生成自然语言报告',
      status: 'error',
    },
  },
  {
    id: '13',
    type: 'custom',
    mark: 'iiiiii',
    data: {
      label: '条件(正常初始化节点)',
      desc: '条件说明',
    },
  },
]);

const apiServiceNodeList = ref([]);

const handleChangeZoom = zoomValue => {
  setViewport({
    zoom: zoomValue,
    x: 0,
    y: 0,
  });
};

onConnect(e => {
  // 边的起点和终点节点的两个状态
  const sourceItem = getNodes.value.find(item => item.id === e.source);
  const targetItem = getNodes.value.find(item => item.id === e.target);
  // 获取当前状态
  const sourceStatus = sourceItem?.data?.status || 'default';
  const targetStatus = targetItem?.data?.status || 'default';
  addEdges({
    ...e,
    data: {
      sourceStatus,
      targetStatus,
    },
    type: 'custom',
  });
  // 添加边连接时-判断节点是否都连接
  nodeAndLineConnection();
});
const handleChange = activeList => {
  activeNames.value = activeName.value;
};

const serviceIdObj = ref({});

const handleClickCollapse = serviceId => {
  if (!serviceIdObj.value[serviceId]) {
    api
      .querySingleFlowServiceNode({
        serviceId: serviceId,
      })
      .then(node => {
        serviceIdObj.value[serviceId] = node[1]?.result.nodeMetaDatas;
        apiServiceNodeList.value = node[1]?.result.nodeMetaDatas;
      });
  }
};
// 打开新增工作流弹窗
const addWorkFlow = () => {
  // 待增加新增弹窗
  dialogType.value = '新增';
  isAddWorkFlow.value = true;
};
// 关闭工作流弹出
const handleClose = () => {
  isAddWorkFlow.value = false;
};
// 删除节点
const delNode = id => {
  if (id) {
    const node = findNode(id);
    node ? removeNodes(node) : '';
    // 删除节点时-判断节点是否都连接
    nodeAndLineConnection();
  }
};
// 编辑yaml
const editYamlDrawer = (name, yamlCode) => {
  yamlContent.value = yaml.dump(yamlCode);
  nodeName.value = name;
  isEditYaml.value = true;
};
// 关闭抽屉
const closeDrawer = () => {
  isEditYaml.value = false;
};

const handleZommOnScroll = () => {
  const zoomObj = getViewport();
  localStorage.setItem('nodes','[{"id":"node1","type":"custom-start","dimensions":{"width":56,"height":56},"computedPosition":{"x":28.75,"y":440,"z":0},"handleBounds":{"source":[{"id":null,"position":"right","nodeId":"node1","type":"source","x":50.627403259277344,"y":16.686248779296875,"width":16,"height":16}],"target":[]},"selected":false,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":28.75,"y":440},"data":{"name":"开始","desc":"","nodePosition":"Right","target":"source"},"events":{}},{"id":"node2","type":"custom-end","dimensions":{"width":56,"height":56},"computedPosition":{"x":1713.75,"y":585,"z":1000},"handleBounds":{"source":[],"target":[{"id":null,"position":"left","nodeId":"node2","type":"target","x":-17.254791259765625,"y":16.686248779296875,"width":16,"height":16}]},"selected":true,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":1713.75,"y":585},"data":{"name":"结束","desc":"","nodePosition":"Left","target":"target"},"events":{}},{"id":"node9","type":"custom","dimensions":{"width":328,"height":96},"computedPosition":{"x":124.75,"y":414.5,"z":0},"handleBounds":{"source":[{"id":"target-a","position":"right","nodeId":"node9","type":"source","x":315.99998474121094,"y":17.99999237060547,"width":16,"height":16},{"id":"target-b","position":"right","nodeId":"node9","type":"source","x":315.99998474121094,"y":62.00000762939453,"width":16,"height":16}],"target":[{"id":null,"position":"left","nodeId":"node9","type":"target","x":-4.0000152587890625,"y":40,"width":16,"height":16}]},"selected":false,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":124.75,"y":414.5},"data":{"serviceId":"6a08c845-abdc-45fb-853e-54a806437dab","apiId":"57aaf87c-d8ca-4b4d-967d-5c62bb6e7ec2","type":"choice","name":"【LLM】意图识别","description":"利用大模型能力选择分支","parametersTemplate":{"fixed_params":{},"params_schema":{"base_url":{"type":"string","description":"大模型的地址"},"api_key":{"type":"string","description":"大模型的api_key"},"prompt":{"type":"string","description":"大模型的提示词"}},"output_schema":{"content":{"type":"str","description":"大模型的返回内容"}},"choice":[{"branch":"valid","description":"是否进行CVE扫描"},{"branch":"invalid","description":"其他"}]},"editable":true,"createdAt":1737962938.624},"events":{},"class":"round-start"},{"id":"node10","type":"custom","dimensions":{"width":328,"height":88},"computedPosition":{"x":509.75,"y":291,"z":0},"handleBounds":{"source":[{"id":"target-a","position":"right","nodeId":"node10","type":"source","x":316.00006103515625,"y":36.000022888183594,"width":16,"height":16}],"target":[{"id":null,"position":"left","nodeId":"node10","type":"target","x":-4.000091552734375,"y":36.000022888183594,"width":16,"height":16}]},"selected":false,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":509.75,"y":291},"data":{"serviceId":"6d7f65ff-55de-4206-9e5b-87aa2b529bd4","apiId":"b3a8faf5-786d-4e34-9d82-47512a134069","type":"search","name":"【API】扫描CVE漏洞","description":"扫描某个机器所有的CVE漏洞","parametersTemplate":{"fixed_params":{},"params_schema":{"host":{"type":"string","description":"需要扫描的机器IP地址"}},"output_schema":{"task_id":{"type":"str"}}},"editable":true,"createdAt":1737962938.624},"events":{},"class":"round-start"},{"id":"node11","type":"custom","dimensions":{"width":328,"height":96},"computedPosition":{"x":901,"y":205.75,"z":0},"handleBounds":{"source":[{"id":"target-a","position":"right","nodeId":"node11","type":"source","x":316.00006103515625,"y":17.99999237060547,"width":16,"height":16},{"id":"target-b","position":"right","nodeId":"node11","type":"source","x":316.00006103515625,"y":62.00000762939453,"width":16,"height":16}],"target":[{"id":null,"position":"left","nodeId":"node11","type":"target","x":-3.99993896484375,"y":40,"width":16,"height":16}]},"selected":false,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":901,"y":205.75},"data":{"serviceId":"6a08c845-abdc-45fb-853e-54a806437dab","apiId":"d6919926-282e-47d0-84e9-8310930f0141","type":"choice","name":"【CHOICE】条件分支","description":"条件分支节点","parametersTemplate":{"fixed_params":{},"params_schema":{"use_llm":{"type":"boolean","description":"是否使用大模型"}},"output_schema":{},"choice":[{"branch":"valid","description":"扫描到CVE漏洞"},{"branch":"invalid","description":"其他"}]},"editable":true,"createdAt":1737962938.624},"events":{},"class":"round-start"},{"id":"node12","type":"custom","dimensions":{"width":328,"height":96},"computedPosition":{"x":1279.75,"y":79.5,"z":0},"handleBounds":{"source":[{"id":"target-a","position":"right","nodeId":"node12","type":"source","x":315.9999084472656,"y":17.99999237060547,"width":16,"height":16},{"id":"target-b","position":"right","nodeId":"node12","type":"source","x":315.9999084472656,"y":62.00000762939453,"width":16,"height":16}],"target":[{"id":null,"position":"left","nodeId":"node12","type":"target","x":-3.99993896484375,"y":40,"width":16,"height":16}]},"selected":false,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":1279.75,"y":79.5},"data":{"serviceId":"6a08c845-abdc-45fb-853e-54a806437dab","apiId":"57aaf87c-d8ca-4b4d-967d-5c62bb6e7ec2","type":"choice","name":"【LLM】意图识别","description":"利用大模型能力选择分支","parametersTemplate":{"fixed_params":{},"params_schema":{"base_url":{"type":"string","description":"大模型的地址"},"api_key":{"type":"string","description":"大模型的api_key"},"prompt":{"type":"string","description":"大模型的提示词"}},"output_schema":{"content":{"type":"str","description":"大模型的返回内容"}},"choice":[{"branch":"valid","description":"是否进行CVE热修复"},{"branch":"invalid","description":"其他"}]},"editable":true,"createdAt":1737962938.624},"events":{},"class":"round-start"},{"id":"node13","type":"custom","dimensions":{"width":328,"height":88},"computedPosition":{"x":1696,"y":61,"z":0},"handleBounds":{"source":[{"id":"target-a","position":"right","nodeId":"node13","type":"source","x":315.9999084472656,"y":36.000003814697266,"width":16,"height":16}],"target":[{"id":null,"position":"left","nodeId":"node13","type":"target","x":-4.000091552734375,"y":36.000003814697266,"width":16,"height":16}]},"selected":false,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":1696,"y":61},"data":{"serviceId":"6d7f65ff-55de-4206-9e5b-87aa2b529bd4","apiId":"bc30f899-3404-43d8-9036-bf05da6aee3a","type":"search","name":"【API】修复CVE漏洞","description":"修复某个机器上的CVE漏洞","parametersTemplate":{"fixed_params":{},"params_schema":{"host":{"type":"string","description":"需要扫描的机器IP地址"},"cve_id":{"type":"string","description":"cve漏洞的id"}},"output_schema":{"task_report":{"type":"dict[str,Any]","description":"cve修复任务详情"}}},"editable":true,"createdAt":1737962938.624},"events":{},"class":"round-start"},{"id":"node14","type":"custom","dimensions":{"width":328,"height":96},"computedPosition":{"x":1858.5,"y":322,"z":0},"handleBounds":{"source":[{"id":"target-a","position":"right","nodeId":"node14","type":"source","x":316.00006103515625,"y":17.99999237060547,"width":16,"height":16},{"id":"target-b","position":"right","nodeId":"node14","type":"source","x":316.00006103515625,"y":62.00000762939453,"width":16,"height":16}],"target":[{"id":null,"position":"left","nodeId":"node14","type":"target","x":-4.000091552734375,"y":40,"width":16,"height":16}]},"selected":false,"dragging":false,"resizing":false,"initialized":false,"isParent":false,"position":{"x":1858.5,"y":322},"data":{"serviceId":"6a08c845-abdc-45fb-853e-54a806437dab","apiId":"d6919926-282e-47d0-84e9-8310930f0141","type":"choice","name":"【CHOICE】条件分支","description":"条件分支节点","parametersTemplate":{"fixed_params":{},"params_schema":{"use_llm":{"type":"boolean","description":"是否使用大模型"}},"output_schema":{},"choice":[{"branch":"valid","description":"扫描到CVE漏洞"},{"branch":"invalid","description":"其他"}]},"editable":true,"createdAt":1737962938.624},"events":{},"class":"round-start"}]'); localStorage.setItem('edges',JSON.stringify(getEdges.value));
  flowZoom.value = Number(zoomObj.zoom.toFixed(1));
};

async function layoutGraph(direction) {
 
  nodes.value = layout(getNodes.value, getEdges.value, direction);
}

const nodeAndLineConnection = () => {
  // 获取当前所有节点和边
  const curNodes = [...getNodes.value];
  const curEdges = [...getEdges.value];
  // 判断开始节点是否连接
  let isNodeConnect = true;
  const len = curNodes.length;
  // 遍历每个节点
  for (let i = 0; i < len; i++) {
    if (curNodes[i].type === 'custom-start') {
      // 判断开始节点是否连接
      isNodeConnect = curEdges.some(item => item.sourceNode?.type === 'custom-start');
    } else if (curNodes[i].type === 'custom-end') {
      // 判断结束节点是否连接
      isNodeConnect = curEdges.some(item => item.targetNode?.type === 'custom-end');
    } else {
      // 判断普通节点是否有连接-普通节点开始和结束都需要进行判断
      const isStartCustomNodeConnect = curEdges.some(item => item.sourceNode?.id === curNodes[i].id);
      const isEndCustomNodeConnect = curEdges.some(item => item.targetNode?.id === curNodes[i].id);
      isNodeConnect = isStartCustomNodeConnect && isEndCustomNodeConnect;
    }
    if (!isNodeConnect) {
      break;
    }
  }
  // 是否所有节点都已连接
  isNodeAndLineConnect.value = isNodeConnect;
  emits('validateConnect', isNodeAndLineConnect.value);
};

// 拖拽添加
const dropFunc = e => {
  onDrop(e);
  // 添加节点时-判断节点是否都连接
  nodeAndLineConnection();
};

// 更新节点状态--这里是测试第一个成功节点改变状态的方法【同时边也随之改变】
const updateNodeTest = state => {
  // 获取当前的success状态的
  const nodes = getNodes.value.filter(item => item.data.status === 'success');
  const id = nodes[0].id;
  const data = nodes[0].data;
  // 取第一个，状态改为error
  updateNode(id, { data: { ...data, status: 'error' } });
  // 遍历获取以当前节点为起源节点的边和为目的节点的边
  const changeSourceEdges = [...getEdges.value.filter(item => item.source === id)];
  const changeTargetEdges = [...getEdges.value.filter(item => item.target === id)];
  // 分别遍历相应的边-并更新它们的状态为最新状态
  changeSourceEdges.forEach(item => {
    updateEdgeData(item.id, { sourceStatus: 'error' });
  });
  changeTargetEdges.forEach(item => {
    updateEdgeData(item.id, { targetStatus: 'error' });
  });
};

onMounted(() => {
  // let nodeList = [
  //   { description: '测试', name: '开始', nodeId: 'node1' },
  //   { description: '测试', name: '条件', nodeId: 'node2' },
  //   { description: '测试', name: '结束', nodeId: 'node3' },
  // ].map(item => {
  // 节点回显
  //   let nodeInfo = {
  //     data: { description: item.description, name: item.name, target: 'target' },
  //     handleBounds: {
  //       source: [
  //         {
  //           height: 24,
  //           id: 'target-a',
  //           nodeId: 'node3',
  //           position: 'right',
  //           type: 'source',
  //           width: 24,
  //           x: 315,
  //           y: 44,
  //         },
  //         {
  //           height: 24,
  //           id: 'target-b',
  //           nodeId: 'node3',
  //           position: 'right',
  //           type: 'source',
  //           width: 24,
  //           x: 315,
  //           y: 50,
  //         },
  //       ],
  //       target: [
  //         {
  //           height: 24,
  //           id: null,
  //           nodeId: 'node7',
  //           position: 'left',
  //           type: 'target',
  //           width: 24,
  //           x: -12.9705810546875,
  //           y: 27.029438018798828,
  //         },
  //       ],
  //     },
  //     id: item.nodeId,
  //     isParent: false,
  //     parentNode: undefined,
  //     position: { x: 600, y: 160 },
  //     type: 'custom',
  //   };
  //   return nodeInfo;
  // });
  let nodes = localStorage.getItem("nodes");
  setNodes(JSON.parse(nodes));
  let edges = localStorage.getItem('edges');
  setEdges(JSON.parse(edges));
  api
    .queryAllFlowService({
      page: 1,
      pageSize: 10,
    })
    .then(res => {
      apiServiceList.value = res[1]?.result.services;
      activeName.value = [res[1]?.result.services[0]?.serviceId];
      activeNames.value = [res[1]?.result.services[0]?.serviceId];
      api
        .querySingleFlowServiceNode({
          serviceId: res[1]?.result.services[0]?.serviceId,
        })
        .then(node => {
          serviceIdObj.value[res[1]?.result.services[0]?.serviceId] = node[1]?.result.nodeMetaDatas;
          apiServiceNodeList.value = node[1]?.result.nodeMetaDatas;
        });
    });
  // api
  //   .querySingleFlowTopology({
  //     appId: 'test',
  //     flowId: 'test5',
  //   })
  //   .then(res => {
  //     console.log(res, 'kkk');
  // 节点回显
  //     let nodeList = res[1]?.result.flow.nodes.map(item => {
  //       let nodeInfo = {
  //         data: { desc: item.description, label: item.name, target: 'target' },
  //         handleBounds: {
  //           source: [
  //             {
  //               height: 16,
  //               id: null,
  //               nodeId: 'node3',
  //               position: 'right',
  //               type: 'source',
  //               width: 16,
  //               x: 315,
  //               y: 44,
  //             },
  //             {
  //               height: 16,
  //               id: null,
  //               nodeId: 'node3',
  //               position: 'right',
  //               type: 'source',
  //               width: 16,
  //               x: 315,
  //               y: 50,
  //             },
  //           ],
  //           target: Array(1),
  //         },
  //         id: 'node2',
  //         isParent: false,
  //         parentNode: undefined,
  //         position: { x: 600, y: 160 },
  //         type: 'custom-end',
  //       };
  //       if (item.type === 'start') {
  //         nodeInfo.data.nodePosition = 'Right';
  //       }

  //       if (item.type === 'edn') {
  //         nodeInfo.data.nodePosition = 'Left';
  //       }
  //       return nodeInfo;
  //     });
  //     setNodes(nodeList);
  //   });
});

const handleDebugDialogOps = visible => {
  debugDialogVisible.value = visible;
};

const handleDemo = () => {
  return {
    nodes: getNodes.value,
    edges: getEdges.value,
  };
};

defineExpose({
  handleDemo,
});
</script>
<template>
  <div class="workFlowContainer" @drop="dropFunc">
    <aside class="aside-wrapper" ref="copilotAside">
      <ElTooltip placement="right" :content="isCopilotAsideVisible ? t('history.collapse') : t('history.expand')">
        <div class="trapezoid" @click="hanleAsideVisible" />
      </ElTooltip>

      <transition name="transition-fade">
        <div class="copilot-aside nodes" v-if="isCopilotAsideVisible">
          <div class="apiCenterBox">
            <div class="apiCenterTitle">语义接口中心</div>
            <div class="apiCenterSearch">
              <el-input
                v-model="apiSearchValue"
                class="o-style-search"
                placeholder="搜索"
                :prefix-icon="IconSearch"
                clearable
              ></el-input>
            </div>
            <div class="apiContanter">
              <el-collapse v-model="activeName" @change="handleChange" class="o-hpc-collapse">
                <el-collapse-item
                  title="Consistency"
                  @click="handleClickCollapse(item.serviceId)"
                  :name="item.serviceId"
                  v-for="item in apiServiceList"
                >
                  <template #title>
                    <el-icon
                      class="el-collapse-item__arrow"
                      :class="{ 'is-active': activeNames.includes(item.serviceId) }"
                    >
                      <IconCaretRight />
                    </el-icon>
                    <span>{{ item.name }}</span>
                  </template>
                  <div
                    class="stancesItem"
                    v-for="(node, index) in serviceIdObj[item.serviceId]"
                    :key="node.apiId"
                    :draggable="true"
                    @dragstart="onDragStart($event, 'custom', { serviceId: item.serviceId, ...node })"
                  >
                    {{ node.name }}
                  </div>
                </el-collapse-item>
              </el-collapse>
              <div style="display: none" @click="updateNodeTest">测试状态修改（暂不显示）</div>
            </div>
          </div>
        </div>
      </transition>
    </aside>
    <div class="workFlowContainerRight">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 0.8 }"
        :min-zoom="0.5"
        :max-zoom="4"
        class="my-diagram-class"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @paneScroll="handleZommOnScroll"
      >
        <Background pattern-color="#aaa" :gap="8" />
        <MiniMap :width="220" mask-color="#f4f6fa" :mask-stroke-width="250" />
        <CustomControl :handleChangeZoom="handleChangeZoom" :flowZoom="flowZoom" :layoutGraph="layoutGraph" />
        <!-- 自定义节点 -->
        <template #node-custom="customNodeProps">
          <CustomNode v-bind="customNodeProps" @delNode="delNode" @editYamlDrawer="editYamlDrawer"></CustomNode>
        </template>

        <template #node-custom-start="customNodeStartProps">
          <CustomSaENode v-bind="customNodeStartProps"></CustomSaENode>
        </template>

        <template #node-custom-end="customNodeEndProps">
          <CustomSaENode v-bind="customNodeEndProps"></CustomSaENode>
        </template>

        <!-- 自定义边线 -->
        <template #edge-custom="props">
          <CustomEdge
            :id="props.id"
            :key="props.id"
            :sourceX="props.sourceX"
            :sourceY="props.sourceY"
            :targetX="props.targetX"
            :targetY="props.targetY"
            :sourcePosition="props.sourcePosition"
            :targetPosition="props.targetPosition"
            :data="JSON.parse(JSON.stringify(props.data))"
          />
        </template>

        <template #connection-line="props">
          <CustomEdge
            :sourceX="props.sourceX"
            :sourceY="props.sourceY"
            :targetX="props.targetX"
            :targetY="props.targetY"
            :sourcePosition="props.sourcePosition"
            :targetPosition="props.targetPosition"
          />
        </template>

        <WorkFlowDebug v-if="debugDialogVisible" :handleDebugDialogOps="handleDebugDialogOps" />
      </VueFlow>
      <div class="workFlowOps">
        <div class="workFlowSelect">
          <el-select v-model="workFlowItem" placeholder="请选择" :suffix-icon="IconCaretDown">
            <template #footer class="selectFooter">
              <div class="addWorkFlow" @click="addWorkFlow">
                <el-icon>
                  <IconPlusCircle></IconPlusCircle>
                </el-icon>
                <span>新建工作流</span>
              </div>
            </template>
          </el-select>
        </div>
        <div class="debugBtn" @click="handleDebugDialogOps(true)">
          <img src="@/assets/images/debugBtnDis.png" v-if="debugDialogVisible" />
          <img src="@/assets/images/debugBtn.png" v-else />
        </div>
        <div class="debugStatus"></div>
      </div>
    </div>
    <WorkFlowDialog
      v-if="isAddWorkFlow"
      :editData="editData"
      :dialogType="dialogType"
      @handleClose="handleClose"
    ></WorkFlowDialog>
  </div>
  <EditYamlDrawer
    v-if="isEditYaml"
    @closeDrawer="closeDrawer"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
  ></EditYamlDrawer>
</template>
