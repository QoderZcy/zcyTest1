# API 使用示例

本文档提供了 Photo Upload System 各个 API 接口的详细使用示例。

## 认证说明

大部分 API 接口需要 HTTP Basic 认证。使用以下账户：

- **管理员账户**: `admin:admin123`
- **普通用户账户**: `user:user123`

## 1. 文件上传接口

### 1.1 单文件上传

**请求**:
```bash
curl -X POST \
  http://localhost:8080/api/files/upload/single \
  -u admin:admin123 \
  -F 'file=@/path/to/your/image.jpg'
```

**JavaScript 示例**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/files/upload/single', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('admin:admin123')
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('上传成功:', data);
});
```

**响应示例**:
```json
{
  "code": 200,
  "message": "文件上传成功",
  "data": {
    "fileId": 1,
    "originalName": "sunset.jpg",
    "storedName": "20231201_143022_a1b2c3d4.jpg",
    "fileSize": 2048576,
    "formattedFileSize": "2.0 MB",
    "contentType": "image/jpeg",
    "imageWidth": 1920,
    "imageHeight": 1080,
    "downloadUrl": "/api/files/download/20231201_143022_a1b2c3d4.jpg",
    "previewUrl": "/api/files/preview/20231201_143022_a1b2c3d4.jpg",
    "thumbnailUrl": "/api/files/thumbnail/20231201_143022_a1b2c3d4.jpg",
    "status": "SUCCESS"
  },
  "timestamp": "2023-12-01 14:30:22"
}
```

### 1.2 多文件上传

**请求**:
```bash
curl -X POST \
  http://localhost:8080/api/files/upload/multiple \
  -u admin:admin123 \
  -F 'files=@/path/to/image1.jpg' \
  -F 'files=@/path/to/image2.png' \
  -F 'files=@/path/to/image3.gif'
```

**JavaScript 示例**:
```javascript
const formData = new FormData();
Array.from(fileInput.files).forEach(file => {
  formData.append('files', file);
});

fetch('/api/files/upload/multiple', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('admin:admin123')
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('批量上传结果:', data);
});
```

### 1.3 Base64 上传

**请求**:
```bash
curl -X POST \
  http://localhost:8080/api/files/upload/base64 \
  -u admin:admin123 \
  -H 'Content-Type: application/json' \
  -d '{
    "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "filename": "base64-image.jpg",
    "mimeType": "image/jpeg"
  }'
```

**JavaScript 示例**:
```javascript
// 将文件转换为 Base64
const reader = new FileReader();
reader.onload = function(e) {
  const base64Data = e.target.result;
  
  fetch('/api/files/upload/base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('admin:admin123')
    },
    body: JSON.stringify({
      data: base64Data,
      filename: file.name,
      mimeType: file.type
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Base64上传成功:', data);
  });
};
reader.readAsDataURL(file);
```

## 2. 文件下载接口

### 2.1 文件下载

**请求**:
```bash
# 下载文件
curl -X GET \
  http://localhost:8080/api/files/download/20231201_143022_a1b2c3d4.jpg \
  -o downloaded-image.jpg
```

**JavaScript 示例**:
```javascript
// 创建下载链接
function downloadFile(storedName, originalName) {
  const link = document.createElement('a');
  link.href = `/api/files/download/${storedName}`;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

downloadFile('20231201_143022_a1b2c3d4.jpg', 'sunset.jpg');
```

### 2.2 文件预览

**HTML 示例**:
```html
<!-- 直接在 img 标签中使用 -->
<img src="/api/files/preview/20231201_143022_a1b2c3d4.jpg" 
     alt="预览图片" 
     style="max-width: 800px;">

<!-- 缩略图 -->
<img src="/api/files/thumbnail/20231201_143022_a1b2c3d4.jpg" 
     alt="缩略图" 
     width="200" height="200">
```

### 2.3 断点续传下载

**JavaScript 示例**:
```javascript
async function downloadWithResume(storedName, startByte = 0) {
  const response = await fetch(`/api/files/download/${storedName}`, {
    headers: {
      'Range': `bytes=${startByte}-`
    }
  });
  
  if (response.status === 206) {
    console.log('断点续传下载');
    const contentRange = response.headers.get('Content-Range');
    console.log('范围:', contentRange);
  }
  
  return response.blob();
}
```

## 3. 文件管理接口

### 3.1 获取文件列表

**请求**:
```bash
curl -X GET \
  'http://localhost:8080/api/files/manage/list?page=0&size=10&sortBy=createdDate&sortDir=desc' \
  -u admin:admin123
```

**JavaScript 示例**:
```javascript
async function getFileList(page = 0, size = 10) {
  const response = await fetch(
    `/api/files/manage/list?page=${page}&size=${size}&sortBy=createdDate&sortDir=desc`, {
    headers: {
      'Authorization': 'Basic ' + btoa('admin:admin123')
    }
  });
  
  const data = await response.json();
  return data.data; // PageResponse<FileInfoDto>
}

// 使用示例
getFileList(0, 20).then(pageData => {
  console.log('文件列表:', pageData.content);
  console.log('分页信息:', pageData.pageInfo);
});
```

### 3.2 搜索文件

**请求**:
```bash
curl -X GET \
  'http://localhost:8080/api/files/manage/search?keyword=sunset&page=0&size=10' \
  -u admin:admin123
```

**JavaScript 示例**:
```javascript
async function searchFiles(keyword, page = 0, size = 10) {
  const response = await fetch(
    `/api/files/manage/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`, {
    headers: {
      'Authorization': 'Basic ' + btoa('admin:admin123')
    }
  });
  
  return response.json();
}
```

### 3.3 删除文件

**请求**:
```bash
# 删除单个文件
curl -X DELETE \
  http://localhost:8080/api/files/manage/delete/1 \
  -u admin:admin123
```

**JavaScript 示例**:
```javascript
async function deleteFile(fileId) {
  const response = await fetch(`/api/files/manage/delete/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Basic ' + btoa('admin:admin123')
    }
  });
  
  return response.json();
}

// 确认删除
if (confirm('确定要删除这个文件吗？')) {
  deleteFile(1).then(result => {
    if (result.code === 200) {
      alert('删除成功');
      // 刷新文件列表
      location.reload();
    }
  });
}
```

### 3.4 批量删除

**请求**:
```bash
curl -X DELETE \
  http://localhost:8080/api/files/manage/batch-delete \
  -u admin:admin123 \
  -H 'Content-Type: application/json' \
  -d '{
    "fileIds": [1, 2, 3, 4, 5]
  }'
```

**JavaScript 示例**:
```javascript
async function batchDeleteFiles(fileIds) {
  const response = await fetch('/api/files/manage/batch-delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('admin:admin123')
    },
    body: JSON.stringify({
      fileIds: fileIds
    })
  });
  
  return response.json();
}

// 批量删除选中的文件
const selectedIds = [1, 2, 3];
batchDeleteFiles(selectedIds).then(result => {
  console.log(`成功删除 ${result.data.successCount} 个文件`);
  if (result.data.failedCount > 0) {
    console.log('删除失败的文件:', result.data.failedItems);
  }
});
```

## 4. 系统管理接口

### 4.1 获取系统统计

**请求**:
```bash
curl -X GET \
  http://localhost:8080/api/files/manage/statistics \
  -u admin:admin123
```

**JavaScript 示例**:
```javascript
async function getSystemStatistics() {
  const response = await fetch('/api/files/manage/statistics', {
    headers: {
      'Authorization': 'Basic ' + btoa('admin:admin123')
    }
  });
  
  const data = await response.json();
  return data.data;
}

// 显示统计信息
getSystemStatistics().then(stats => {
  document.getElementById('totalFiles').textContent = stats.totalFiles;
  document.getElementById('totalSize').textContent = stats.formattedTotalSize;
  document.getElementById('todayUploads').textContent = stats.todayUploads;
});
```

### 4.2 健康检查

**请求**:
```bash
curl -X GET http://localhost:8080/api/files/manage/health
```

### 4.3 清理缓存

**请求**:
```bash
curl -X POST \
  http://localhost:8080/api/files/manage/cache/clear \
  -u admin:admin123
```

## 5. 完整的前端集成示例

### 5.1 文件上传组件

```html
<!DOCTYPE html>
<html>
<head>
    <title>文件上传示例</title>
    <style>
        .upload-area { border: 2px dashed #ccc; padding: 20px; text-align: center; }
        .progress { width: 100%; height: 20px; background: #f0f0f0; margin: 10px 0; }
        .progress-bar { height: 100%; background: #4CAF50; width: 0%; transition: width 0.3s; }
        .file-list { margin-top: 20px; }
        .file-item { display: flex; align-items: center; margin: 5px 0; padding: 10px; border: 1px solid #ddd; }
        .thumbnail { width: 50px; height: 50px; object-fit: cover; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="upload-area" id="uploadArea">
        <p>拖拽文件到此处或 <input type="file" id="fileInput" multiple accept="image/*"> 选择文件</p>
        <div class="progress" id="progressContainer" style="display: none;">
            <div class="progress-bar" id="progressBar"></div>
        </div>
    </div>
    
    <div class="file-list" id="fileList"></div>

    <script>
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const fileList = document.getElementById('fileList');
        
        // 认证信息
        const authHeader = 'Basic ' + btoa('admin:admin123');
        
        // 文件选择处理
        fileInput.addEventListener('change', handleFiles);
        
        // 拖拽处理
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.backgroundColor = '#f0f0f0';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.backgroundColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.backgroundColor = '';
            handleFiles({ target: { files: e.dataTransfer.files } });
        });
        
        function handleFiles(event) {
            const files = Array.from(event.target.files);
            if (files.length === 0) return;
            
            if (files.length === 1) {
                uploadSingleFile(files[0]);
            } else {
                uploadMultipleFiles(files);
            }
        }
        
        async function uploadSingleFile(file) {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                progressContainer.style.display = 'block';
                progressBar.style.width = '0%';
                
                const response = await fetch('/api/files/upload/single', {
                    method: 'POST',
                    headers: { 'Authorization': authHeader },
                    body: formData
                });
                
                progressBar.style.width = '100%';
                const result = await response.json();
                
                if (result.code === 200) {
                    addFileToList(result.data);
                } else {
                    alert('上传失败: ' + result.message);
                }
            } catch (error) {
                alert('上传错误: ' + error.message);
            } finally {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 1000);
            }
        }
        
        async function uploadMultipleFiles(files) {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            
            try {
                progressContainer.style.display = 'block';
                progressBar.style.width = '0%';
                
                const response = await fetch('/api/files/upload/multiple', {
                    method: 'POST',
                    headers: { 'Authorization': authHeader },
                    body: formData
                });
                
                progressBar.style.width = '100%';
                const result = await response.json();
                
                if (result.code === 200) {
                    result.data.forEach(fileResult => {
                        if (fileResult.status === 'SUCCESS') {
                            addFileToList(fileResult);
                        }
                    });
                }
            } catch (error) {
                alert('批量上传错误: ' + error.message);
            } finally {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 1000);
            }
        }
        
        function addFileToList(fileData) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <img src="${fileData.thumbnailUrl}" alt="缩略图" class="thumbnail" onerror="this.style.display='none'">
                <div style="flex: 1;">
                    <div><strong>${fileData.originalName}</strong></div>
                    <div>大小: ${fileData.formattedFileSize} | 尺寸: ${fileData.imageWidth}x${fileData.imageHeight}</div>
                </div>
                <div>
                    <button onclick="previewFile('${fileData.storedName}')">预览</button>
                    <button onclick="downloadFile('${fileData.storedName}', '${fileData.originalName}')">下载</button>
                    <button onclick="deleteFile(${fileData.fileId}, this)">删除</button>
                </div>
            `;
            fileList.appendChild(fileItem);
        }
        
        function previewFile(storedName) {
            window.open(`/api/files/preview/${storedName}`, '_blank');
        }
        
        function downloadFile(storedName, originalName) {
            const link = document.createElement('a');
            link.href = `/api/files/download/${storedName}`;
            link.download = originalName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        async function deleteFile(fileId, button) {
            if (!confirm('确定要删除这个文件吗？')) return;
            
            try {
                const response = await fetch(`/api/files/manage/delete/${fileId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': authHeader }
                });
                
                const result = await response.json();
                if (result.code === 200) {
                    button.closest('.file-item').remove();
                } else {
                    alert('删除失败: ' + result.message);
                }
            } catch (error) {
                alert('删除错误: ' + error.message);
            }
        }
        
        // 页面加载时获取文件列表
        window.onload = async function() {
            try {
                const response = await fetch('/api/files/manage/list?page=0&size=20', {
                    headers: { 'Authorization': authHeader }
                });
                const result = await response.json();
                
                if (result.code === 200) {
                    result.data.content.forEach(addFileToList);
                }
            } catch (error) {
                console.error('加载文件列表失败:', error);
            }
        };
    </script>
</body>
</html>
```

## 6. 错误处理

### 6.1 常见错误码

- `400`: 请求参数错误
- `401`: 未授权访问
- `403`: 访问被拒绝
- `404`: 文件不存在
- `413`: 文件大小超过限制
- `415`: 不支持的文件类型
- `429`: 请求频率超限
- `500`: 服务器内部错误

### 6.2 错误处理示例

```javascript
async function handleApiCall(apiCall) {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (data.code === 200) {
      return data;
    } else {
      throw new Error(`API错误 ${data.code}: ${data.message}`);
    }
  } catch (error) {
    console.error('API调用失败:', error);
    
    // 根据错误类型进行处理
    if (error.message.includes('401')) {
      alert('请登录后再试');
      // 跳转到登录页面
    } else if (error.message.includes('413')) {
      alert('文件太大，请选择小于10MB的文件');
    } else if (error.message.includes('415')) {
      alert('不支持的文件格式，请选择图片文件');
    } else {
      alert('操作失败: ' + error.message);
    }
    
    throw error;
  }
}
```

---

这些示例涵盖了 Photo Upload System 的主要功能。您可以根据实际需求调整和扩展这些代码。