  
<script lang="ts"  setup>
import { ref, onMounted, withDefaults, watch } from 'vue';
import FlowCode from './FlowCode.vue';
import { useHistorySessionStore } from 'src/store';
import { storeToRefs } from 'pinia';
const { params } = storeToRefs(useHistorySessionStore());

  const visible = ref(true);
  const props = withDefaults(
  defineProps<{
    code: any; // 添加jsonData属性
    title: string;
    type: string;
  }>(),{}
); 
const descriptions = ref({});

const schema = ref(props.code)||{};
const inputCode = ref();
if(props.type !== 'code'){
if(typeof props.code === 'string'){
  inputCode.value = JSON.parse(props.code)||{};

}else{
  inputCode.value = props.code||{};
}
}
function generateJsonObjectFromSchema(code) {
  // 创建一个空对象来存储最终的 JSON 对象
  const schema = code;
  const jsonObject = {};
  // 遍历 schema 的 properties
  for (const key in schema.properties) {
    if (schema.properties.hasOwnProperty(key)) {
      const propertySchema = schema.properties[key];
      const str = key + ":" + propertySchema["description"]
      descriptions.value[key] = propertySchema["description"].toString();
      // 如果属性是一个对象，并且包含 required 字段
      if (propertySchema["type"] === 'object') {
        jsonObject[key] = {};
        // 遍历该对象的 properties
        for (const subKey in propertySchema.properties) {
          if (propertySchema.properties.hasOwnProperty(subKey)) {
            const subPropertySchema = propertySchema.properties[subKey];

            // 检查是否有默认值，并使用它，否则使用空值或根据类型推断一个值
            let value;
            if (subPropertySchema.default !== undefined) {
              value = subPropertySchema.default;
            } else if (subPropertySchema.enum && subPropertySchema.enum.length > 0) {
              // 如果没有默认值，但有一个枚举，我们可以选择枚举的第一个值作为默认值（这只是一个选择，可能不适合所有情况）
              value = subPropertySchema.enum[0];
            } else {
              // 对于字符串，我们可以使用空字符串；对于其他类型，可能需要更复杂的逻辑来推断默认值
              value = subPropertySchema.type === 'string' ? '' : null;
            }

            // 如果该属性是 required 的，我们确保它在对象中
            if (propertySchema.required.includes(subKey)) {
              jsonObject[key][subKey] = value;
            } else if (subKey in jsonObject[key] === false) {
              // 如果不是 required 的，但我们之前没有添加过它（避免覆盖默认值），则添加它（这一步是可选的，取决于你是否想要所有属性都出现在对象中）
              jsonObject[key][subKey] = value;
            }
          }
        }
      }else{ 
        const subPropertySchema = propertySchema;
        // 检查是否有默认值，并使用它，否则使用空值或根据类型推断一个值
        let value;
        if (subPropertySchema.default !== undefined) {
          value = subPropertySchema.default;
        } else if (subPropertySchema.enum && subPropertySchema.enum.length > 0) {
          // 如果没有默认值，但有一个枚举，我们可以选择枚举的第一个值作为默认值（这只是一个选择，可能不适合所有情况）
          value = subPropertySchema.enum[0];
        } else {
          // 对于字符串，我们可以使用空字符串；对于其他类型，可能需要更复杂的逻辑来推断默认值
          value = subPropertySchema.type === 'string' ? '' : null;
        }
        // 如果该属性是 required 的，我们确保它在对象中
          jsonObject[key] = value;
        }
    }
  }

  // 在这个特定的例子中，我们没有处理 schema 的其他部分，比如 "required" 字段（因为它是空的）
  // 和其他可能的顶层属性（因为我们的 schema 没有定义它们）

  return jsonObject;
}

const jsonObject = ref(generateJsonObjectFromSchema(schema.value));
params.value = jsonObject.value;

watch(() => jsonObject, (newSchema) => {
  params.value = jsonObject.value;
})

watch(() => params, (newSchema) => {
  params.value = jsonObject.value;
})

</script>
<template>
  <div class="json-form-container">
    <ul v-if="props.type === 'code'">
      <li v-for="(value, key) of descriptions" :key="key">
        <span>{{key}}:</span>
        <span>{{value}}</span>
      </li>
    </ul>
      <FlowCode :code="jsonObject" title="参数代码" :disabled="false" v-if="props.type === 'code'"/>
      <FlowCode :code="inputCode" title="params" :disabled="true" v-else/>
    </div>
  </template>
  
  <style scoped>

  .json-form-container {
    width: 100%;
    height: 100%;
    /* padding: 10px; */
    box-sizing: border-box;
    overflow-y: auto;
  }

  </style>