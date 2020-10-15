# geojson-of-china-full
全国行政区域json文件，根据行政区域id命名，包含省市区

自动抓取阿里云的json数据，阿里云地址：http://datav.aliyun.com/tools/atlas

## 使用方法

### 你可以自己实时更新
下载/克隆之后输入命令即可

```
# 更新不带子级的数据+区域数据
npm run update

# 更新带子级的数据+区域数据
npm run update full

# 仅更新区域数据
npm run update area
```

### 也可以直接使用现成的json文件
项目的data目录中是上次更新的GeoJSON文件，文件都是带子级的。

## data目录上次更新时间
2020年10月15日20:36:37


如果觉得有用，右上角请留下你的star，这样能让更多的人知道，不胜感激！
