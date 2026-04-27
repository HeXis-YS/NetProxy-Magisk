# 路由规则

路由规则现在直接写在完整 Xray JSON 的 `routing.rules` 中。

配置文件位置由 `module.conf` 的 `CURRENT_CONFIG` 决定，默认是：

```
/data/adb/modules/netproxy/config/xray/configs/default.json
```

## 规则结构

```json
{
  "routing": {
    "domainStrategy": "AsIs",
    "rules": [
      {
        "type": "field",
        "domain": ["geosite:cn"],
        "outboundTag": "direct"
      }
    ]
  }
}
```

规则按列表顺序从上到下匹配，第一条匹配的规则生效。
