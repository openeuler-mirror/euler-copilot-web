import { defineComponent, ref } from 'vue';
import { IconCaretRight } from '@computing/opendesign-icons';
import './yamlContentOutput.scss'

export default defineComponent({
    name: 'YamlContentOutput',
    props:{
        yamlOutPutContent:''
    },
    setup(props) {
        const yamlContent = ref(props.yamlOutPutContent);
        const handelOpsData = (data) => {
            const yamlOutPut = Object.keys(data).map((item) => {
                if (typeof data[item] === 'object' && item !== 'items') {
                    return <el-collapse class="o-hpc-collapse">
                        <el-collapse-item
                            name="1"
                            v-slots={{
                                title: () => <div class="yamlTitle">
                                    <el-icon>
                                        <IconCaretRight />
                                    </el-icon>
                                    <div class="yamlBox">
                                        <div class="yamlKey">{item}</div>
                                        <div  class="yamlKeyType">{data[item].type}</div>
                                    </div>
                                </div>,
                            }}>
                            <div class="yamlDes">{data[item].description}</div>
                            {Object.keys(data[item].items || {}).length ? handelOpsData(data[item].items) : null}

                        </el-collapse-item>
                    </el-collapse>
                }

                if (typeof data[item] === 'object' && item === 'items') {
                    return handelOpsData(data[item])
                }
            });

            return yamlOutPut;
        };
        return {
            handelOpsData: handelOpsData,
            yamlContent: yamlContent.value
        };
    },

    render() {
        return <div class="outputContainer">{this.handelOpsData(this.yamlContent)}</div>;
    },
});
