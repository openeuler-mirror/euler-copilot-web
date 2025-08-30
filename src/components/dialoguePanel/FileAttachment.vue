<template>
  <div class="file-attachment">
    <div class="file-header">
      <el-icon class="file-icon"><Document /></el-icon>
      <span class="file-title">附件列表</span>
    </div>
    <div class="file-list">
      <div 
        v-for="file in files" 
        :key="file.file_id"
        class="file-item"
        @click="downloadFile(file)"
      >
        <div class="file-info">
          <el-icon class="file-type-icon"><Document /></el-icon>
          <div class="file-details">
            <div class="file-name">{{ file.filename }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
              <span class="file-variable">来自变量: {{ file.variable_name }}</span>
            </div>
          </div>
        </div>
        <el-icon class="download-icon"><Download /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface FileAttachment {
  file_id: string
  filename: string
  file_type: string
  file_size: number
  content: string // base64编码的内容
  variable_name: string
}

interface Props {
  files: FileAttachment[]
}

const props = defineProps<Props>()

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 下载文件
const downloadFile = (file: FileAttachment) => {
  try {
    // 将base64内容转换为Blob
    const binaryString = atob(file.content)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    const blob = new Blob([bytes], { type: file.file_type })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.filename
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 释放URL对象
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`文件 ${file.filename} 下载成功`)
  } catch (error) {
    console.error('文件下载失败:', error)
    ElMessage.error(`文件 ${file.filename} 下载失败`)
  }
}
</script>

<style lang="scss" scoped>
.file-attachment {
  margin: 12px 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
  overflow: hidden;
  
  .file-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    .file-icon {
      font-size: 16px;
      color: var(--el-color-primary);
      margin-right: 8px;
    }
    
    .file-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  
  .file-list {
    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid var(--el-border-color-lighter);
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background: var(--el-color-primary-light-9);
        
        .download-icon {
          color: var(--el-color-primary);
        }
      }
      
      .file-info {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        
        .file-type-icon {
          font-size: 24px;
          color: var(--el-color-info);
          margin-right: 12px;
          flex-shrink: 0;
        }
        
        .file-details {
          flex: 1;
          min-width: 0;
          
          .file-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .file-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
            
            .file-size {
              padding: 2px 6px;
              background: var(--el-fill-color);
              border-radius: 4px;
            }
            
            .file-variable {
              color: var(--el-color-primary);
            }
          }
        }
      }
      
      .download-icon {
        font-size: 18px;
        color: var(--el-text-color-placeholder);
        transition: color 0.2s ease;
        flex-shrink: 0;
      }
    }
  }
}
</style> 