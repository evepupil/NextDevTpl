# 来源: https://nextdevkit.com/zh/docs/storage

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
对象存储与文件管理🤔 为什么需要对象存储？
# 对象存储与文件管理
深入学习如何在 NextDevKit 中使用对象存储，掌握预签名 URL、Image Proxy 和文件上传的完整功能。
在现代 SaaS 应用中，文件存储是不可缺少的功能。用户需要上传头像、文档、图片等文件，应用需要安全、高效地管理这些资源。NextDevKit 提供了完整的对象存储解决方案。
## [🤔 为什么需要对象存储？](https://nextdevkit.com/zh/docs/storage#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8)
### [传统文件存储的问题](https://nextdevkit.com/zh/docs/storage#%E4%BC%A0%E7%BB%9F%E6%96%87%E4%BB%B6%E5%AD%98%E5%82%A8%E7%9A%84%E9%97%AE%E9%A2%98)
**本地文件存储的局限性** ：
  * **扩展性差** ：服务器磁盘空间有限，难以处理大量文件
  * **性能瓶颈** ：大文件传输会占用服务器带宽和计算资源
  * **安全风险** ：文件直接暴露在服务器上，容易被恶意访问
  * **维护成本高** ：需要处理文件备份、容灾等复杂问题


### [对象存储的优势](https://nextdevkit.com/zh/docs/storage#%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8%E7%9A%84%E4%BC%98%E5%8A%BF)
**对象存储（Object Storage）** 解决了这些问题：
✅ **无限扩展** ：理论上无限的存储空间  
✅ **高可用性** ：自动备份和容灾机制  
✅ **全球分发** ：CDN 加速，快速访问  
✅ **安全控制** ：细粒度的访问权限控制  
✅ **成本优化** ：按使用量付费，无需预置资源
## [🏗️ NextDevKit 存储架构](https://nextdevkit.com/zh/docs/storage#%EF%B8%8F-nextdevkit-%E5%AD%98%E5%82%A8%E6%9E%B6%E6%9E%84)
NextDevKit 采用了抽象化的存储架构，支持多种存储服务商：
### [架构设计理念](https://nextdevkit.com/zh/docs/storage#%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1%E7%90%86%E5%BF%B5)
**1. Provider 抽象** ：统一接口，支持多种存储服务  
**2. 预签名 URL** ：客户端直接上传，减少服务器负载  
**3. Image Proxy** ：安全的图片访问和缓存  
**4. 类型安全** ：完整的 TypeScript 支持
### [目录结构](https://nextdevkit.com/zh/docs/storage#%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)
**核心模块功能** ：
  * **actions.ts** ：Server Actions，处理文件上传请求
  * **types.ts** ：存储相关的 TypeScript 类型定义
  * **providers/** ：存储服务商抽象层
  * **image-proxy/** ：图片代理路由，安全访问存储的图片


### [支持的存储服务](https://nextdevkit.com/zh/docs/storage#%E6%94%AF%E6%8C%81%E7%9A%84%E5%AD%98%E5%82%A8%E6%9C%8D%E5%8A%A1)
NextDevKit 默认支持：
  * **AWS S3** ：最流行的对象存储服务
  * **Cloudflare R2** ：S3 兼容，成本更低
  * **可扩展** ：基于统一接口，轻松添加其他服务商


## [🔐 预签名 URL 核心概念](https://nextdevkit.com/zh/docs/storage#-%E9%A2%84%E7%AD%BE%E5%90%8D-url-%E6%A0%B8%E5%BF%83%E6%A6%82%E5%BF%B5)
### [什么是预签名 URL？](https://nextdevkit.com/zh/docs/storage#%E4%BB%80%E4%B9%88%E6%98%AF%E9%A2%84%E7%AD%BE%E5%90%8D-url)
**预签名 URL（Pre-signed URL）** 是一种临时的、带有签名的 URL，允许客户端直接访问存储服务，而无需暴露存储凭据。
**预签名 URL 工作流程** ：
  1. **客户端请求** ：客户端向 NextDevKit 服务器请求上传权限
  2. **生成签名** ：服务器调用存储服务 API 生成预签名 URL
  3. **返回 URL** ：服务器将临时 URL 返回给客户端
  4. **直接上传** ：客户端使用预签名 URL 直接上传文件到存储服务
  5. **上传完成** ：存储服务确认上传成功


### [预签名 URL 的优势](https://nextdevkit.com/zh/docs/storage#%E9%A2%84%E7%AD%BE%E5%90%8D-url-%E7%9A%84%E4%BC%98%E5%8A%BF)
**1. 安全性** ：
  * 临时有效，自动过期
  * 不暴露存储凭据
  * 限制特定操作权限


**2. 性能** ：
  * 客户端直传，不经过应用服务器
  * 减少服务器带宽消耗
  * 提高上传速度


**3. 可控性** ：
  * 灵活设置过期时间
  * 限制文件类型和大小
  * 指定存储位置


## [⚙️ 环境配置](https://nextdevkit.com/zh/docs/storage#%EF%B8%8F-%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE)
NextDevKit 支持多种存储服务，根据你的部署平台选择合适的配置。
具体的 S3 和 R2 的配置可以参考 [NextDevKit 存储](https://nextdevkit.com/docs/storage) 的配置。
### [NextDevKit 应用配置](https://nextdevkit.com/zh/docs/storage#nextdevkit-%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE)
无论选择哪种存储服务，都需要在应用配置中设置：
src/config/index.ts
```
export const appConfig = {
  storage: {
    provider: "s3",  // S3 兼容协议
    bucketNames: {
      avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME || "avatars",
    },
  },
} as const;
```

### [不同部署模板的存储选择](https://nextdevkit.com/zh/docs/storage#%E4%B8%8D%E5%90%8C%E9%83%A8%E7%BD%B2%E6%A8%A1%E6%9D%BF%E7%9A%84%E5%AD%98%E5%82%A8%E9%80%89%E6%8B%A9)
**Cloudflare Workers 模板** :
  * 使用 **Cloudflare R2**
  * 原因：同一生态系统，延迟更低，成本更优


**SST AWS 模板** :
  * 使用 **AWS S3**
  * 原因：原生 AWS 集成，IAM 权限管理


**Next.js 标准部署** （Vercel/Docker）:
  * 可选择 **Cloudflare R2** 或 **AWS S3**
  * 根据成本和地理位置需求决定


### [AWS S3 设置](https://nextdevkit.com/zh/docs/storage#aws-s3-%E8%AE%BE%E7%BD%AE)
#### [环境变量](https://nextdevkit.com/zh/docs/storage#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
```
STORAGE_REGION=your_region # 例如 us-east-1
STORAGE_ACCESS_KEY_ID=your_access_key_id
STORAGE_SECRET_ACCESS_KEY=your_secret_access_key
# 存储桶名称（可选，可在应用配置中配置）
NEXT_PUBLIC_AVATARS_BUCKET_NAME=your-bucket-name
```

#### [AWS S3 存储桶设置](https://nextdevkit.com/zh/docs/storage#aws-s3-%E5%AD%98%E5%82%A8%E6%A1%B6%E8%AE%BE%E7%BD%AE)
  1. **创建 AWS 账户** ：在 
  2. **创建 S3 存储桶** ：
     * 转到 S3 对象存储
     * 创建新存储桶
     * 如有需要，禁用"阻止所有公共访问"
  3. **配置存储桶策略** ：
     * 转到存储桶权限
     * 添加以下策略：
```
{
 "Version": "2012-10-17",
 "Statement": [
     {
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:*",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
     }
   ]
 }
```

  4. **配置 CORS** ：
     * 转到存储桶 CORS
     * 添加以下 CORS 配置：
```
[
 {
     "AllowedHeaders": [
         "*"
     ],
     "AllowedMethods": [
         "PUT",
         "GET",
         "HEAD",
         "POST"
     ],
     "AllowedOrigins": [
         "*"
     ],
     "ExposeHeaders": [],
     "MaxAgeSeconds": 3000
 }
] 
```

  5. **生成 API 令牌** ：
     * 创建具有 S3 权限的 API 令牌
     * 用作访问密钥凭证


### [Cloudflare R2 设置](https://nextdevkit.com/zh/docs/storage#cloudflare-r2-%E8%AE%BE%E7%BD%AE)
#### [环境变量](https://nextdevkit.com/zh/docs/storage#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F-1)
```
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=your_access_key_id
STORAGE_SECRET_ACCESS_KEY=your_secret_access_key
STORAGE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
# 存储桶名称（可选，可在应用配置中配置）
NEXT_PUBLIC_AVATARS_BUCKET_NAME=your-bucket-name
```

#### [Cloudflare R2 存储桶设置](https://nextdevkit.com/zh/docs/storage#cloudflare-r2-%E5%AD%98%E5%82%A8%E6%A1%B6%E8%AE%BE%E7%BD%AE)
  1. **创建 Cloudflare 账户** ：在 
  2. **创建 R2 存储桶** ：
     * 转到 R2 对象存储
     * 创建新存储桶
     * 为您的存储桶设置自定义域名
  3. **配置 CORS** ：
     * 转到存储桶 CORS
     * 添加以下 CORS 配置：
```
[
   {
     "AllowedOrigins": [
       "*"
     ],
     "AllowedMethods": [
       "PUT",
       "GET",
       "HEAD"
     ],
     "AllowedHeaders": [
       "Content-Type" // 必须设置
     ],
     "ExposeHeaders": [],
     "MaxAgeSeconds": 3000
   }
 ]
```

  4. 创建新的 API 令牌：
     * 转到 R2/API/管理 API 令牌
     * 点击 `创建用户 API 令牌`
     * 将权限设置为存储桶的 `对象读写`
     * 创建 API 令牌，获取 `访问密钥 ID` 和 `秘密访问密钥`


## [📤 文件上传功能详解](https://nextdevkit.com/zh/docs/storage#-%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E5%8A%9F%E8%83%BD%E8%AF%A6%E8%A7%A3)
### [Server Action：获取上传 URL](https://nextdevkit.com/zh/docs/storage#server-action%E8%8E%B7%E5%8F%96%E4%B8%8A%E4%BC%A0-url)
NextDevKit 提供了 `getSignedUploadUrl` Server Action：
src/storage/actions.ts
```
export const getSignedUploadUrl = actionClient
  .inputSchema(z.object({
    bucket: z.string().min(1),
    key: z.string().min(1),
    contentType: z.string().min(1),
  }))
  .outputSchema(z.string())
  .action(async ({ parsedInput: { bucket, key, contentType } }) => {
    const storageProvider = getStorageProvider();
    return await storageProvider.getSignedUploadUrl({
      bucket,
      key,
      contentType,
    });
  });
```

### [客户端文件上传实现](https://nextdevkit.com/zh/docs/storage#%E5%AE%A2%E6%88%B7%E7%AB%AF%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E5%AE%9E%E7%8E%B0)
文件上传组件示例
```
"use client";
import { getSignedUploadUrl } from "@/storage/actions";
import { appConfig } from "@/config";
import { useState } from "react";
export default function AvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // 1. 生成唯一的文件名
      const fileExtension = file.name.split('.').pop();
      const fileName = `user-${Date.now()}.${fileExtension}`;
      // 2. 获取预签名上传 URL
      const signedUrl = await getSignedUploadUrl({
        bucket: appConfig.storage.bucketNames.avatars,
        key: fileName,
        contentType: file.type,
      });
      // 3. 直接上传到存储服务
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      if (uploadResponse.ok) {
        console.log("文件上传成功！", fileName);
        // 4. 更新用户信息或界面
        await updateUserAvatar(fileName);
      }
    } catch (error) {
      console.error("上传失败:", error);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        disabled={uploading}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0"
      />
      {uploading && <p>上传中...</p>}
    </div>
  );
}
```

### [上传流程解析](https://nextdevkit.com/zh/docs/storage#%E4%B8%8A%E4%BC%A0%E6%B5%81%E7%A8%8B%E8%A7%A3%E6%9E%90)
**完整的文件上传流程** ：
  1. **前端选择文件** ：用户通过 input 选择文件
  2. **请求上传权限** ：调用 `getSignedUploadUrl` Server Action
  3. **生成预签名 URL** ：服务器验证权限并生成临时 URL
  4. **直接上传** ：前端使用 fetch 将文件上传到存储服务
  5. **更新记录** ：上传成功后更新数据库或用户界面


**关键优势** ：
  * 文件不经过 NextJS 服务器，节省带宽
  * 上传失败不影响应用性能
  * 支持大文件上传


## [🖼️ Image Proxy 功能](https://nextdevkit.com/zh/docs/storage#%EF%B8%8F-image-proxy-%E5%8A%9F%E8%83%BD)
### [什么是 Image Proxy？](https://nextdevkit.com/zh/docs/storage#%E4%BB%80%E4%B9%88%E6%98%AF-image-proxy)
Image Proxy 是一个代理服务，为存储的图片提供安全访问和缓存优化。
### [NextDevKit Image Proxy 实现](https://nextdevkit.com/zh/docs/storage#nextdevkit-image-proxy-%E5%AE%9E%E7%8E%B0)
src/app/image-proxy/[...path]/route.ts
```
export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) => {
  const { path } = await params;
  const [bucket, filePath] = path;
  // 验证存储桶权限
  if (bucket === appConfig.storage.bucketNames.avatars) {
    // 生成访问 URL
    const signedUrl = await getStorageProvider().getSignedUrl({
      bucket,
      key: filePath,
      expiresIn: 60 * 60, // 1 小时
    });
    // 重定向到签名 URL，添加缓存头
    return NextResponse.redirect(signedUrl, {
      headers: { "Cache-Control": "max-age=3600" },
    });
  }
  return new Response("Not found", { status: 404 });
};
```

### [Image Proxy 使用方式](https://nextdevkit.com/zh/docs/storage#image-proxy-%E4%BD%BF%E7%94%A8%E6%96%B9%E5%BC%8F)
在组件中使用 Image Proxy
```
import Image from "next/image";
export default function UserAvatar({ fileName }: { fileName: string }) {
  // 通过 Image Proxy 访问图片
  const imageUrl = `/image-proxy/${appConfig.storage.bucketNames.avatars}/${fileName}`;
  return (
    <Image
      src={imageUrl}
      alt="用户头像"
      width={64}
      height={64}
      className="rounded-full"
    />
  );
}
```

### [Image Proxy 的核心优势](https://nextdevkit.com/zh/docs/storage#image-proxy-%E7%9A%84%E6%A0%B8%E5%BF%83%E4%BC%98%E5%8A%BF)
**1. 安全性** ：
  * 隐藏真实存储 URL
  * 访问权限集中控制
  * 防止直接访问存储服务


**2. 性能优化** ：
  * HTTP 缓存头优化
  * 减少重复的签名生成
  * 支持 CDN 缓存


**3. 灵活性** ：
  * 可添加图片处理功能
  * 支持不同存储桶的差异化处理
  * 易于监控和日志记录


## [🔧 存储系统架构详解](https://nextdevkit.com/zh/docs/storage#-%E5%AD%98%E5%82%A8%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84%E8%AF%A6%E8%A7%A3)
### [Provider 抽象层](https://nextdevkit.com/zh/docs/storage#provider-%E6%8A%BD%E8%B1%A1%E5%B1%82)
NextDevKit 的存储系统基于 Provider 模式：
src/storage/types.ts
```
export interface StorageProvider {
  // 获取文件访问 URL
  getSignedUrl(params: SignedUrlParams): Promise<string>;
  // 获取文件上传 URL
  getSignedUploadUrl(params: SignedUploadUrlParams): Promise<string>;
}
export interface SignedUrlParams {
  bucket: string;
  key: string;
  expiresIn: number;
}
export interface SignedUploadUrlParams {
  bucket: string;
  key: string;
  contentType: string;
}
```

## [🚀 实际应用场景](https://nextdevkit.com/zh/docs/storage#-%E5%AE%9E%E9%99%85%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF)
### [用户头像管理](https://nextdevkit.com/zh/docs/storage#%E7%94%A8%E6%88%B7%E5%A4%B4%E5%83%8F%E7%AE%A1%E7%90%86)
完整的头像上传组件
```
"use client";
import { getSignedUploadUrl } from "@/storage/actions";
import { appConfig } from "@/config";
import { authClient } from "@/lib/auth/client";
import { useState } from "react";
import Image from "next/image";
export default function AvatarManager({ currentAvatar }: {
  currentAvatar?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(currentAvatar);
  const handleAvatarUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB 限制
      alert("文件大小不能超过 5MB");
      return;
    }
    setUploading(true);
    try {
      // 生成文件名：user-{timestamp}.{extension}
      const fileExtension = file.name.split('.').pop();
      const fileName = `user-${Date.now()}.${fileExtension}`;
      // 获取上传 URL
      const result = await getSignedUploadUrl({
        bucket: appConfig.storage.bucketNames.avatars,
        key: fileName,
        contentType: file.type,
      });
      // 上传文件
      const uploadResponse = await fetch(result, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }
      // 更新用户资料
      const { error } = await authClient.updateUser({
        image: fileName,
      });
      if (error) {
        throw new Error(error.message);
      }
      setAvatarKey(fileName);
      alert("头像更新成功！");
    } catch (error) {
      console.error("上传失败:", error);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };
  const avatarUrl = avatarKey 
    ? `/image-proxy/${appConfig.storage.bucketNames.avatars}/${avatarKey}`
    : "/default-avatar.png";
  return (
    <div className="flex items-center space-x-4">
      <Image
        src={avatarUrl}
        alt="用户头像"
        width={64}
        height={64}
        className="rounded-full border-2 border-gray-300"
      />
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAvatarUpload(file);
          }}
          disabled={uploading}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {uploading ? "上传中..." : "更换头像"}
        </label>
      </div>
    </div>
  );
}
```

### [文档上传功能](https://nextdevkit.com/zh/docs/storage#%E6%96%87%E6%A1%A3%E4%B8%8A%E4%BC%A0%E5%8A%9F%E8%83%BD)
文档上传示例
```
export default function DocumentUpload() {
  const handleDocumentUpload = async (file: File) => {
    // 支持的文档类型
    const allowedTypes = ['application/pdf', 'application/msword', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert("只支持 PDF、Word 和文本文件");
      return;
    }
    const fileName = `documents/${Date.now()}-${file.name}`;
    const signedUrl = await getSignedUploadUrl({
      bucket: "documents", // 假设有文档存储桶
      key: fileName,
      contentType: file.type,
    });
    await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    // 保存文档记录到数据库
    await saveDocumentRecord({
      fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  };
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleDocumentUpload(file);
        }}
        className="w-full"
      />
      <p className="text-sm text-gray-500 mt-2">
        支持 PDF、Word、文本文件，最大 10MB
      </p>
    </div>
  );
}
```

## [📚 总结](https://nextdevkit.com/zh/docs/storage#-%E6%80%BB%E7%BB%93)
NextDevKit 的对象存储系统提供了：
### [💡 关键技术点](https://nextdevkit.com/zh/docs/storage#-%E5%85%B3%E9%94%AE%E6%8A%80%E6%9C%AF%E7%82%B9)
**预签名 URL 机制** ：
  * 客户端直传，减少服务器负载
  * 临时权限，提高安全性
  * 支持大文件上传


**Image Proxy 功能** ：
  * 隐藏真实存储 URL
  * 缓存优化提高性能
  * 集中访问控制


**Provider 抽象** ：
  * 统一接口，易于扩展
  * 支持 S3、Cloudflare R2 等多种服务
  * 配置灵活，环境变量控制


现在你可以在 NextDevKit 项目中构建完整的文件存储功能，为用户提供安全、高效的文件管理体验！
**参考资源** ：
[如何发送邮件 深入学习如何在 NextDevKit 中使用 Resend + React Email 发送邮件和管理 Newsletter，掌握邮件系统的完整功能。](https://nextdevkit.com/zh/docs/email)[基于文件的博客系统 从基础到高级，全面掌握 NextDevKit 博客模块，学习 MDX 写作、内容管理和高级功能定制。](https://nextdevkit.com/zh/docs/blog)
[](https://nextdevkit.com/zh/docs/storage#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8)[](https://nextdevkit.com/zh/docs/storage#%E4%BC%A0%E7%BB%9F%E6%96%87%E4%BB%B6%E5%AD%98%E5%82%A8%E7%9A%84%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/storage#%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8%E7%9A%84%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/storage#%EF%B8%8F-nextdevkit-%E5%AD%98%E5%82%A8%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/storage#%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1%E7%90%86%E5%BF%B5)[](https://nextdevkit.com/zh/docs/storage#%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)[](https://nextdevkit.com/zh/docs/storage#%E6%94%AF%E6%8C%81%E7%9A%84%E5%AD%98%E5%82%A8%E6%9C%8D%E5%8A%A1)[](https://nextdevkit.com/zh/docs/storage#-%E9%A2%84%E7%AD%BE%E5%90%8D-url-%E6%A0%B8%E5%BF%83%E6%A6%82%E5%BF%B5)[](https://nextdevkit.com/zh/docs/storage#%E4%BB%80%E4%B9%88%E6%98%AF%E9%A2%84%E7%AD%BE%E5%90%8D-url)[](https://nextdevkit.com/zh/docs/storage#%E9%A2%84%E7%AD%BE%E5%90%8D-url-%E7%9A%84%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/storage#%EF%B8%8F-%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/storage#nextdevkit-%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/storage#%E4%B8%8D%E5%90%8C%E9%83%A8%E7%BD%B2%E6%A8%A1%E6%9D%BF%E7%9A%84%E5%AD%98%E5%82%A8%E9%80%89%E6%8B%A9)[](https://nextdevkit.com/zh/docs/storage#aws-s3-%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/storage#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/storage#aws-s3-%E5%AD%98%E5%82%A8%E6%A1%B6%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/storage#cloudflare-r2-%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/storage#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F-1)[](https://nextdevkit.com/zh/docs/storage#cloudflare-r2-%E5%AD%98%E5%82%A8%E6%A1%B6%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/storage#-%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E5%8A%9F%E8%83%BD%E8%AF%A6%E8%A7%A3)[](https://nextdevkit.com/zh/docs/storage#server-action%E8%8E%B7%E5%8F%96%E4%B8%8A%E4%BC%A0-url)[](https://nextdevkit.com/zh/docs/storage#%E5%AE%A2%E6%88%B7%E7%AB%AF%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E5%AE%9E%E7%8E%B0)[](https://nextdevkit.com/zh/docs/storage#%E4%B8%8A%E4%BC%A0%E6%B5%81%E7%A8%8B%E8%A7%A3%E6%9E%90)[](https://nextdevkit.com/zh/docs/storage#%EF%B8%8F-image-proxy-%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/storage#%E4%BB%80%E4%B9%88%E6%98%AF-image-proxy)[](https://nextdevkit.com/zh/docs/storage#nextdevkit-image-proxy-%E5%AE%9E%E7%8E%B0)[](https://nextdevkit.com/zh/docs/storage#image-proxy-%E4%BD%BF%E7%94%A8%E6%96%B9%E5%BC%8F)[](https://nextdevkit.com/zh/docs/storage#image-proxy-%E7%9A%84%E6%A0%B8%E5%BF%83%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/storage#-%E5%AD%98%E5%82%A8%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84%E8%AF%A6%E8%A7%A3)[](https://nextdevkit.com/zh/docs/storage#provider-%E6%8A%BD%E8%B1%A1%E5%B1%82)[](https://nextdevkit.com/zh/docs/storage#-%E5%AE%9E%E9%99%85%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF)[](https://nextdevkit.com/zh/docs/storage#%E7%94%A8%E6%88%B7%E5%A4%B4%E5%83%8F%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/storage#%E6%96%87%E6%A1%A3%E4%B8%8A%E4%BC%A0%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/storage#-%E6%80%BB%E7%BB%93)[](https://nextdevkit.com/zh/docs/storage#-%E5%85%B3%E9%94%AE%E6%8A%80%E6%9C%AF%E7%82%B9)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
