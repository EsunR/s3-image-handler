# 1. 调用方式

调用方式参考 [BOS 图像处理的使用规则](https://cloud.baidu.com/doc/BOS/s/7ldh5wpk6)，做出了部分调整。

调用方式相对于 BOS 的调整：

- 不使用 url query 来写入图像处理参数，而是直接将图像处理参数作为 file key 来检索和创建文件
- 没有 `x-bce-process=` 前缀
- action 分隔符由 `/` 改为 `__op__`

文件请求参考示例：

```
[原始文件名]__op__[支持的图像操作],[操作参数1]_[参数值],[操作参数2]_[参数值]，如：

/path/to/image.jpg__op__resize,m_lfit,w_1282,limit_1__op__quality,q_80__op__format,f_auto
```

## 1.1 图像缩放

操作符：`resize`

## 1.2 图像质量

操作符: `quality`

## 1.3 图像格式

操作符: `format`

# 2. 缺陷

- Webp 不支持自动回落；
  - 待验证：目前来说，如果是用 f_auto，服务端会生成一张 webp 格式的图片放置到 s3 上，但是当使用不支持 webp 的浏览器访问时，无法自动回落到原始格式。后期尝试是否可以通过 lambda@edge 的请求源函数来直接修改请求 uri，从而让用户获取回落格式的资源。
  - 待验证：Cloudfront 会缓存请求资源如何处理？
- 大文图片处理速度慢，有可能会卡死（基本无法处理10M以上的图片）；
- 首次处理完图片后会以 base64 的方式返回给客户端，速度慢，而且支持的 base64 长度未知；
  - 待验证：如果文件过大，处理完成后使用重定向来重新从 S3 获取资源，而不是强行返还图像产出。
- 仅支持公开权限的 bucket；


# 3. 参考文档

- [使用 Amazon S3 触发器创建缩略图](https://docs.aws.amazon.com/zh_cn/lambda/latest/dg/with-s3-tutorial.html)