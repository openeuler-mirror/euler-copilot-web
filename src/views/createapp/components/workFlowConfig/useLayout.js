import dagre from '@dagrejs/dagre';
import { Position, useVueFlow } from '@vue-flow/core';
import { ref } from 'vue';

/**
 * Composable to run the layout algorithm on the graph.
 * It uses the `dagre` library to calculate the layout of the nodes and edges.
 *
 * @see https://github.com/dagrejs/dagre/wiki
 */
export function useLayout() {
  const {findNode} = useVueFlow();


  

  const graph = ref(new dagre.graphlib.Graph());

  const previousDirection = ref('LR');

  function layout(nodes, edges, direction) {
    const dagreGraph = new dagre.graphlib.Graph();

    graph.value = dagreGraph;

    // 设置默认边标签
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'TB';

    // 设置图布局
    dagreGraph.setGraph({rankdir: direction});

    previousDirection.value = direction;
    let maxHeight = 108;
    for (const node of nodes) {
      // 查找到节点的信息
      const graphNode = findNode(node.id)
      maxHeight = maxHeight > graphNode.dimensions.height ? maxHeight : graphNode.dimensions.height;
    }

    for (const node of nodes) {
      // 查找到节点的信息
      const graphNode = findNode(node.id)
      const newNode = {
        width: graphNode.dimensions.width + 100 || 150,
        height: graphNode.dimensions.height + 100 || 50,
      }

      // 设置节点
      dagreGraph.setNode(node.id, {
        width: graphNode.dimensions.width + 100 || 150,
        height: graphNode.dimensions.height + 100 || 50,
      });
    }

    // 设置边
    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target);
    }

    // 排版
    dagre.layout(dagreGraph);

    // set nodes with updated positions
    return nodes.map(node => {
      const nodeWithPosition = dagreGraph.node(node.id);
      let diff = maxHeight - nodeWithPosition.height;
      let position = { x: nodeWithPosition.x, y: nodeWithPosition.y + diff / 2}
      // newY = diff
      // if(['1','2'].includes(node.id)){
        
      // }+
      let newPosition = { x: nodeWithPosition.x, y: nodeWithPosition.y + diff / 2}
      // 需要进行判断--是否为开始结束
      if(node.id === 'start' || node.id === 'end') {
        newPosition = { x: nodeWithPosition.x + 132, y: nodeWithPosition.y + diff / 2 + 26}
      }
      
      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: newPosition, // 这里修改即可
      };
    });
  }

  return { graph, layout, previousDirection };

  }

