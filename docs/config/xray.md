# Xray 配置

NetProxy 直接使用完整 Xray JSON 配置，不再拆分或自动合并多个配置片段。

## 配置目录

```
/data/adb/modules/netproxy/config/xray/
└── configs/
    └── default.json
```

`module.conf` 中的 `CURRENT_CONFIG` 指向当前生效的完整配置文件。Xray 启动时只加载这个文件：

```bash
xray run -config "$CURRENT_CONFIG"
```

## 管理方式

- 专家用户可以直接编辑 `/data/adb/modules/netproxy/config/xray/configs/*.json`。
- WebUI 的节点管理页也编辑同一批完整 JSON 文件。
- DNS、routing、inbounds、outbounds、policy、api 都属于同一个配置文件的一部分。

## 示例

```json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [],
  "outbounds": [
    {
      "tag": "proxy",
      "protocol": "freedom"
    }
  ],
  "routing": {
    "rules": []
  }
}
```
