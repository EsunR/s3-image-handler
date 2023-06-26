# 教程

https://docs.aws.amazon.com/zh_cn/lambda/latest/dg/with-s3-tutorial.html#s3-tutorial-events-adminuser-create-test-function-upload-zip-test-manual-invoke

# 图片处理格式参数

图片处理命令形式为：

```
x-bce-process=image/${action},${key}_${value},${key}_${value}/${action},${key}_${value}
```

其中：

* **image**：BOS支持多种数据处理形式，均使用x-bce-process参数触发，当使用图片处理时，需要指定此处名字为image。
* **action**：BOS支持多种图片处理命令，每种图片处理命令称作一种action，比如缩放resize，裁剪crop等。
* **key**：每种action支持多种具体的处理参数，比如缩放宽度w,高度h等。
* **value**：处理参数取值。
* **分隔符**：

| 分隔符名称 | 分隔符 | 两侧顺序 | 说明                                       |
| ---------- | ------ | -------- | ------------------------------------------ |
| 处理分隔符 | /      | 有关     | 多个action之间的分隔符，前后action顺序执行 |
| 参数分隔符 | ,      | 无关     | 多处理参数项之间的分隔符                   |
| 值分隔符   | \_     | 固定顺序 | 参数名与参数值之间的分隔符                 |

如对图片进行等比缩放图片，且缩放后的图片宽最大200，高最大100，亮度-5，格式转化为webp，则对应命令为：

```text
http://bucket-A.bj.bcebos.com/sample.jpg?x-bce-process=image/resize,m_lfit,w_200,h_100/bright,b_-10/format,f_webp
```

# 图片缩放

本文介绍如何对图片大小进行缩放处理(`resize`)。

## 缩放参数

| **参数** | **取值**                     | **说明**                                                                                              |
| -------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| m        | lfit，mfit，fill，pad，fixed | ...                                                                                                   |
| w        | 1-4096                       | 设置缩略图的高度，单位px。lfit类型必须设置w或h，fill fixed类型必须同时设置w和h。与l/s/p/wp/hp互斥。 |
| h        | 1-4096                       | 设置缩略图的高度，单位px。lfit类型必须设置w或h，fill fixed类型必须同时设置w和h。与l/s/p/wp/hp互斥。 |

m 参数说明：

* 设置缩略图的宽度，单位px。lfit类型必须设置w或h，fill fixed类型必须同时设置w和h
* lfit：等比缩放图片，缩放到能放到以w、h为宽高的矩形内的最大缩放图片
* mfit：等比缩放图片，缩放到能包含住以w、h为宽高的矩形的最小缩放图片
* fill：mfit基础上，对w、h矩形内的图片部分进行裁剪
* pad：lfit基础上，对w、h矩形内的非图片空白部分进行指定颜色填充
* fixed：强制缩放到指定w宽、h高