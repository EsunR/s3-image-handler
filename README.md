# 0. 简介

本项目利用 Lambda@Edge 函数实现了对 S3 图片进行图像处理的操作，有以下特点：

-   处理后的图片会自动上传到 S3 提供副本，下次请求直接获取 S3 资源；
-   支持 CloudFront 的图片缓存；
-   使用 Lambda@Edge 进行部署，Lambda 函数被部署到全球边缘节点，加快函数执行速度；
-   使用 sharp 实现了图缩放、质量调整、格式调整等；
-   支持图片格式自动择优使用 webp 格式。

架构设计：[《使用 Lambda 函数实现 AWS S3 的图片裁剪、质量调整、自动 webp》](https://blog.esunr.xyz/2023/07/a7f4fe8c61e9.html)

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

本函数提供了两种调用模式，一种是将图像处理参数放在请求的 querystring 部分，而另一种则是将图像处理参数直接放在 uri 中。

## 图像处理参数位于 querystring 部分

调用方式与 [百度云 BOS 图像处理的使用规则](https://cloud.baidu.com/doc/BOS/s/7ldh5wpk6) 一致，但仅适配了部分操作，具体查看下一节参数说明。

图片处理命令形式为：

```text
x-bce-process=image/${action},${key}_${value},${key}_${value}/${action},${key}_${value}
```

其中：

-   **image**：BOS支持多种数据处理形式，均使用x-bce-process参数触发，当使用图片处理时，需要指定此处名字为image。
-   **action**：BOS支持多种图片处理命令，每种图片处理命令称作一种action，比如缩放resize，裁剪crop等。
-   **key**：每种action支持多种具体的处理参数，比如缩放宽度w,高度h等。
-   **value**：处理参数取值。
-   **分隔符**：

| 分隔符名称 | 分隔符 | 两侧顺序 | 说明                                           |
| ---------- | ------ | -------- | ---------------------------------------------- |
| 处理分隔符 | /      | 有关     | 多个action之间的分隔符，~~前后action顺序执行~~ |
| 参数分隔符 | ,      | 无关     | 多处理参数项之间的分隔符                       |
| 值分隔符   | \_     | 固定顺序 | 参数名与参数值之间的分隔符                     |

如对图片进行等比缩放图片，且缩放后的图片宽最大200，高最大100，格式自动调整，则对应命令为：

```text
https://xxx.cloudfront.net/image.jpg?x-bce-process=image/resize,m_lfit,w_200,h_100/format,f_auto
```

## 图像处理参数位于 uri 部分

调用方式相对于 BOS 的调整：

-   不使用 url query 来写入图像处理参数，而是直接将图像处理参数作为 file key 来检索和创建文件
-   没有 `x-bce-process=` 前缀
-   action 分隔符由 `/` 改为 `__op__`

文件请求参考示例：

```
[原始文件名]__op__[支持的图像操作],[操作参数1]_[参数值],[操作参数2]_[参数值]，如：

https://xxx.cloudfront.net/image.jpg__op__resize,m_lfit,w_200,h_100__op__format,f_auto
```

# 3. 参数说明

## 图像缩放

操作符：`resize`

| 参数  | 值                | 备注                                                                                |
| ----- | ----------------- | ----------------------------------------------------------------------------------- |
| m     | lift, mfit, fixed | 缩放策略，详情查看下方补充说明                                                      |
| w     | 100~4096          | 缩放宽度，会根据用户传递的数字自动以百分位取整，如传递 120 会被保留为 100           |
| h     | 100~4096          | 缩放高度，会根据用户传递的数字自动以百分位取整，如传递 120 会被保留为 100           |
| limit | 0,1               | 设置是否限制图片缩放的尺寸大小不可超过原图大小，0不限制，1限制。非必选，默认0不限制 |

缩放策略参数解释：

-   lfit：等比缩放图片，缩放到能放到以w、h为宽高的矩形内的最大缩放图片
-   mfit：等比缩放图片，缩放到能包含住以w、h为宽高的矩形的最小缩放图片
-   fixed：强制缩放到指定w宽、h高

![](https://esunr-image-bed.oss-cn-beijing.aliyuncs.com/picgo/202308031550381.png)

## 图像质量

操作符: `quality`

| 参数 | 值             | 备注                                                                                  |
| ---- | -------------- | ------------------------------------------------------------------------------------- |
| q    | 20, 40, 60, 80 | 图像质量，如果填写为大于 20 的其他数值，会自动向下取为相近的数值，如 90 会被保留为 80 |

## 图像格式

操作符: `format`

| 参数 | 值                              | 备注                                                                |
| ---- | ------------------------------- | ------------------------------------------------------------------- |
| f    | jpg, png, webp, heic, gif, auto | 图像质量，设置为 auto 后，会根据浏览器的支持程度判断是否转化为 webp |

# 4. 常见问题 Q&A

Q：这个函数会被恶意调用吗？

A：有一定的风险，但在函数的代码层采取了一些幂等性措施来防止函数重复调用:

1. Origin Response 阶段的函数只在图片请求且图片参数是全新的组合时候才会触发图片处理逻辑，且被 CloudFront 缓存请求结果后，在缓存失效前就不会再次触发；
2. Viewer Request 阶段的函数只会对携带了图片处理参数的请求才会生效；
3. Viewer Request 阶段的函数会对图片处理参数进行排序和数值合并，如 `/resize,m_lfit,w_100/format,f_auto`、`/format,f_auto/resize,m_lfit,w_100` 对应的都是同一个图片格式转换和图片大小调整的处理操作，这些请求参数对应的都是同一张图片，一定程度防止了多余的图片生成；
4. 对于最容易触发穷举的数值操作，如宽高、图片质量，在进行了一定的大小限制之外，还会对输入值进行除模运算来合并一些数值，如 `h_101~h_199` 都会被视作 `h_100` 处理，并在 Viewer Request 就进行这一行为，如果处理后的数值命中缓存后就不会触发 Origin Response 阶段。

<hr/>

Q：同一页面展示多张图片时，图片加载失败并返回 503 状态码。

A：如果日志没有报错，就说明是触发了 Lambda 函数的并发限制，访问 [Service Quptas](https://us-east-1.console.aws.amazon.com/servicequotas/home/services/lambda/quotas) 并查看 Lambda 函数的并发配额。
新账号已应用的配额值为 10，也就是只能处理 10 次并发，超过的并发则会被拒绝处理并返回 503 状态码，可以按照 [这篇文章](https://benellis.cloud/my-lambda-concurrency-applied-quota-is-only-10-but-why) 的方法来申请扩充配额。

<hr/>

Q：访问大体积图片时会出现多次重定向的情况。

A：因为 Origin Request 处理后的响应体不能超过 1.33M，因此如果处理后的图片大于这一体积，就不会在当前请求中返回处理后的图片，而是使用重定向的方式来重新发起请求，让其命中 S3 来获取图片。这次重定向行为在响应头中通过 Cache-Control 禁止了 CloudFront 缓存，但是 CloudFront 默认的最小缓存时长为 1s，因此会出现在重定向行为发生后又多次重定向（缓存存活中），而在重定向 3~6 次后正常返回图片（重定向缓存被销毁）。可以按照如下方式修改：

1. 进入 CloudFront 分配的 `行为` 面板；
2. 选中并编辑行为；
3. 可以看到在 `缓存键和源请求` 选项的 `缓存策略` 默认选中的为 `CachingOptimized`，查看该策略详情发现 `最小 TTL` 值为 `1`；
4. 点击 `Create cache policy` 创建新策略，`最小 TTL` 设置为 `0`，其他配置按照 `CachingOptimized` 策略中的配置填写；
5. 选中新创建的策略，保存更改。

<hr/>

Q: 如果参数越来越多，在 s3 上保存的对象文件名（也就是 key）也就会越长，那么最终会不会因为文件名过长而无法处理？

A：其实不必过分担忧，s3 标称可以允许 1024 个字符长度的 key 值，经过测试，就算文本是纯中文也支持 300~350 个中文，而操作系统的最长文件名一般为 255 个，并不足矣达到让 S3 都无法处理文件名的地步。
