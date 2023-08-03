# 0. 简介

本项目利用 Lambda@Edge 函数实现了对 S3 图片进行图像处理的操作，有以下特点：

-   处理后的图片会自动上传到 S3 提供副本，下次请求直接获取 S3 资源；
-   支持 CloudFront 的图片缓存；
-   使用 Lambda@Edge 进行部署，Lambda 函数被部署到全球边缘节点，加快函数执行速度；
-   使用 sharp 实现了图缩放、质量调整、格式调整等；
-   支持图片格式自动择优使用 webp 格式。

架构设计：[《使用 Lambda 函数实现 AWS S3 的图片裁剪、质量调整、自动 webp》](https://blog.esunr.xyz/2023/07/0608f5f6ff91.html)

# 1. 部署流程

### 创建 Bucket 并为其创建 CloudFront 分配

参考：[《创建 AWS S3 公共存储桶并添加 CloudFront CDN 加速域名》](https://blog.esunr.xyz/2023/07/cd2440f9b860.html)

### 配置角色

进入 [IAM 控制台](https://us-east-1.console.aws.amazon.com/iam/home#/home)，选择 `访问管理 - 角色` 创建新的角色。可心实体类型选择 `AWS 服务`，并勾选使用案例为 `Lambda`：

![](https://s2.loli.net/2023/07/24/U6ZYCuvNhaOfwVp.png)

添加权限时搜索并勾选 `CloudWatchLogsFullAccess` 和 `AmazonS3FullAccess`，如果需要缩减权限请务必保证该角色拥有 S3 的读写权限以及日志组权限。

创建角色名时填写 `Lambda_S3ImageHandler`，完成创建。

角色创建完成后完后点击角色进入详情面板，选择 `信任关系` 面板，编辑信任策略为以下内容（增加 `edgelambda.amazonaws.com` 保证该角色可以部署 Lambda@Edge）：

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "edgelambda.amazonaws.com",
                    "lambda.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

### 编辑环境变量

首先，在 `packages/origin-response/` 目录下创建 `.env` 文件，并写入如下环境变量：

```
BUCKET=your-bucket-name
BUCKET=your-bucket-region
```

### 构建文件

本项目基于 pnpm@8 管理，请确认安装好 pnpm 环境。同时构建环境必须在 x86_64 的 Linux 环境进行，MacOS 请使用虚拟机构建，Window 请使用 WSL 构建。

使用 pnpm 安装依赖：

```
pnpm install
```

执行构建指令：

```
pnpm build
```

### 上传 Lambda 函数

[安装 AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)，然后登录用户信息，需要将用户信息的地区设置为 `us-east-1`（只有该地区支持设置 Lambda@Edge）。

然后登录到 Aws 控制台，用户菜单选择 `账户`，获取 `账户 ID`：

![](https://s2.loli.net/2023/07/24/TJRBbvQnzY5lGWp.png)

项目内提供了 publish.sh 脚本用来发布 Lambda 函数，执行：

```sh
export AWS_ACCOUNT_ID=your-account-id && sh ./publish.sh
```

> 如果出现文本编辑器，退出文本编辑器即可（如出现 vim 就输入 q 点回车），不要直接 ctrl+c 结束脚本

然后进入 Lambda 函数控制面板，地区选择 `美国东部(弗吉尼亚北部) us-east-1`，可以看到成功上传的两个函数：

![](https://s2.loli.net/2023/07/24/4q9HOMTtBsepiIC.png)

### 部署 Lambda@Edge

Lambda 函数上传完成后需要部署到 Lambda@Edge 上才能生效。

首先部署 S3ImageHandler_ViewerRequest 到 ViewerRequest 上，点击 S3ImageHandler_ViewerRequest 函数进入详情，点击右上角 `操作 - 部署到 Lambda@Edge`：

![](https://s2.loli.net/2023/07/24/PoKZecAyvf6h8Ir.png)

选择 CloudFront 触发器，分配到目标 Bucket 所分配的 CloudFront 上，CloudFront 事件选择为 `查看者请求(Viewer Request)`，如下图：

![](https://s2.loli.net/2023/07/25/ZsCEkQVa4GhuRAN.png)

点击部署后，S3ImageHandler_ViewerRequest 部署完成。

然后点击 S3ImageHandler_OriginResponse 函数进入详情，同样的，点击右上角 `操作 - 部署到 Lambda@Edge`。选择 CloudFront 触发器，分配到目标 Bucket 所分配的 CloudFront 上，CloudFront 事件选择为 `源响应(Origin Response)`，如下图：

![](https://s2.loli.net/2023/07/25/YTBq6Jr2xaQH8DN.png)

点击部署后，S3ImageHandler_OriginResponse 部署完成。

### 验证

验证是否成功部署到边缘节点，可以进入到 CloudFront 控制台，点击 S3 Bucket 所绑定的 CloudFront 分配，进入 `行为` 面板，勾选默行为并点击 `编辑` 按钮：

![](https://s2.loli.net/2023/07/25/E8fFPQDhvTXRBec.png)

滑动到最下方，查看函数关联部分，确认 `查看器请求` 和 `源响应请求` 绑定的函数正确：

![](https://esunr-image-bed.oss-cn-beijing.aliyuncs.com/picgo/202307251127868.png)

然后使用 CloudFront 分配的域名，或者使用用户绑定的备用域名访问图片查看是否可以正常请求到图片，查看请求资源的响应头是否存在 `Lambda-Edge` 字段，如果是 `not-modify` 说明用户当前访问的是 S3 存在的资源，Lambda 函数不修改图片直接返回：

![](https://esunr-image-bed.oss-cn-beijing.aliyuncs.com/picgo/202307251134027.png)

如果当携带请求参数（详情看下一章节的调用方式），如 `/image.jpeg__op__resize,w_720__op__format,f_auto`(将图片宽度设置为 720，图片格式自动选择)，那么 `Lambda-Edge` 将为 `successful`，如下：

![](https://esunr-image-bed.oss-cn-beijing.aliyuncs.com/picgo/202307251259307.png)

### 错误排查

如果出现了访问错误的问题，可以进入 [CloudWatch 控制台](https://console.aws.amazon.com/cloudwatch/home)，选择日志组面板，会看到如下的日志组，点击即可查看详细的日志信息：

![](https://esunr-image-bed.oss-cn-beijing.aliyuncs.com/picgo/202307251457933.png)

> 注意：如果显示没有日志组说明当前右上角选中的地区的 CloudFront 分配并没有命中，手动切换到一个有命中 CloudFront 分配的地区，比如在中国访问，那么切换到香港或者日本、韩国就可以看到访问日志。

如果代码有调整需要重新部署，代码编译后执行 `sh ./update.sh` 脚本即可将代码更新到 Lambda。然后到进入到对应的 Lambda 函数详情，点击 `操作 - 部署到 Lambda@Edge`，选择 `对此函数使用现有的 CloudFront 触发器` 然后选中之前部署的触发器即可更新：

![](https://esunr-image-bed.oss-cn-beijing.aliyuncs.com/picgo/202307251505018.png)

# 2. 调用方式

调用方式参考 [BOS 图像处理的使用规则](https://cloud.baidu.com/doc/BOS/s/7ldh5wpk6)，做出了部分调整。

调用方式相对于 BOS 的调整：

-   不使用 url query 来写入图像处理参数，而是直接将图像处理参数作为 file key 来检索和创建文件
-   没有 `x-bce-process=` 前缀
-   action 分隔符由 `/` 改为 `__op__`

文件请求参考示例：

```
[原始文件名]__op__[支持的图像操作],[操作参数1]_[参数值],[操作参数2]_[参数值]，如：

/path/to/image.jpg__op__resize,m_lfit,w_1282,limit_1__op__quality,q_80__op__format,f_auto
```

## 图像缩放

操作符：`resize`

| 参数 | 值          | 备注                                                                           |
| ---- | ----------- | ------------------------------------------------------------------------------ |
| m    | lift / mfit | lfit: 给定宽高时，会以高度优先适配容器；mfit：给定宽高时，会以宽度优先适配容器 |
|      |             |                                                                                |

## 图像质量

操作符: `quality`

## 图像格式

操作符: `format`
