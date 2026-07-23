import { defineModule } from "@/core/modules";

export const storageModule = defineModule({
  id: "storage",
  name: "Storage",
  description: "文件上传、下载和对象存储访问",
  kind: "optional",
  dependencies: [],
  routes: [
    {
      path: "/api/upload/presigned",
      source: "src/app/api/upload/presigned/route.ts",
    },
    {
      path: "/image-proxy/[...path]",
      source: "src/app/image-proxy/[...path]/route.ts",
    },
  ],
  navigation: [],
  translations: [],
  schema: [],
});
