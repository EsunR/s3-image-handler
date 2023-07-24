# 0. 简介

本项目利用 Lambda@Edge 函数实现了对 S3 图片进行图像处理的操作，有以下特点：

-   处理后的图片会自动上传到 S3 提供副本；
-   支持 CloudFront 的图片缓存；
-   使用 Lambda@Edge 进行部署，函数被部署到全球边缘节点，加快函数执行效率；
-   使用 sharp 实现了图缩放、质量调整、格式调整等
-   支持图片格式自动择优使用 webp 格式

# 1. 部署流程

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

然后进入 Lambda 函数控制面板，地区选择 `美国东部(弗吉尼亚北部) us-east-1`，可以看到成功上传的两个函数：

![](https://s2.loli.net/2023/07/24/4q9HOMTtBsepiIC.png)

### 部署 Lambda@Edge

Lambda 函数上传完成后需要部署到 Lambda@Edge 上才能生效。

首先部署 S3ImageHandler_ViewerRequest 到 ViewerRequest 上，点击 S3ImageHandler_ViewerRequest 函数，点击右上角 `操作 - 部署到 Lambda@Edge`：

![](https://s2.loli.net/2023/07/24/PoKZecAyvf6h8Ir.png)

选择 CloudFront 触发器，分配到目标 Bucket 所分配的 CloudFront 上，CloudFront 事件选择为 `查看者请求(Viewer Request)`，如下图：

![](https://s2.loli.net/2023/07/24/VgQEtM5kBGOl3ca.png)

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

## 图像质量

操作符: `quality`

## 图像格式

操作符: `format`

# 3. 缺陷

-   Webp 不支持自动回落；
    -   待验证：目前来说，如果是用 f_auto，服务端会生成一张 webp 格式的图片放置到 s3 上，但是当使用不支持 webp 的浏览器访问时，无法自动回落到原始格式。后期尝试是否可以通过 lambda@edge 的请求源函数来直接修改请求 uri，从而让用户获取回落格式的资源。
    -   待验证：Cloudfront 会缓存请求资源如何处理？
-   大文图片处理速度慢，有可能会卡死（基本无法处理10M以上的图片）；
-   首次处理完图片后会以 base64 的方式返回给客户端，速度慢，而且支持的 base64 长度未知；
    -   待验证：如果文件过大，处理完成后使用重定向来重新从 S3 获取资源，而不是强行返还图像产出。
-   仅支持公开权限的 bucket；

# 4. 参考文档

-   [使用 Amazon S3 触发器创建缩略图](https://docs.aws.amazon.com/zh_cn/lambda/latest/dg/with-s3-tutorial.html)
-   [Customizing at the edge with Lambda@Edge](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)
