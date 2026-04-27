import { KSU } from "./ksu.js";

interface ConfigGroup {
  type: "default";
  name: string;
  dirName: string;
  configs: string[];
}

interface ConfigInfo {
  protocol: string;
  address: string;
  port: string;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

/**
 * Config Service - 节点页面相关业务逻辑
 */
export class ConfigService {
  // ==================== 配置文件管理 ====================

  // 获取分组配置
  static async getConfigGroups(): Promise<ConfigGroup[]> {
    // 先获取默认分组
    const groups: ConfigGroup[] = [];
    const configsDir = `${KSU.MODULE_PATH}/config/xray/configs`;

    try {
      const defaultFiles = await KSU.exec(
        `find ${configsDir} -maxdepth 1 -name '*.json' -exec basename {} \\;`,
      );
      const defaultConfigs = defaultFiles.split("\n").filter((f) => f);
      if (defaultConfigs.length > 0) {
        groups.push({
          type: "default",
          name: "Xray",
          dirName: "",
          configs: defaultConfigs,
        });
      }
    } catch (e) { }

    return groups;
  }

  // 批量读取多个配置文件的基本信息
  static async batchReadConfigInfos(
    filePaths: string[],
  ): Promise<Map<string, ConfigInfo>> {
    if (!filePaths || filePaths.length === 0) return new Map();

    const basePath = `${KSU.MODULE_PATH}/config/xray/configs`;
    const fileList = filePaths.map((f) => `${basePath}/${f}`).join("\n");

    const result = await KSU.exec(`
            while IFS= read -r f; do
                [ -z "$f" ] && continue
                echo "===FILE:$(basename "$f")==="
                cat "$f" 2>/dev/null
            done << 'EOF'
${fileList}
EOF
        `);

    if (!result) return new Map();

    const infoMap = new Map<string, ConfigInfo>();
    const blocks = result.split("===FILE:").filter((b) => b.trim());

    for (const block of blocks) {
      const lines = block.split("\n");
      const filename = lines[0].replace("===", "").trim();
      const content = lines.slice(1).join("\n");

      let protocol = "unknown";
      let address = "";
      let port = "";
      try {
        const config = JSON.parse(content);
        const outbounds = Array.isArray(config.outbounds) ? config.outbounds : [];
        const proxyOutbound =
          outbounds.find((outbound) => outbound.tag === "proxy") ||
          outbounds.find(
            (outbound) =>
              outbound.protocol &&
              !["freedom", "blackhole", "dns"].includes(outbound.protocol),
          ) ||
          outbounds[0];

        if (proxyOutbound) {
          protocol = proxyOutbound.protocol || protocol;
          const settings = proxyOutbound.settings || {};
          if (settings.vnext?.[0]) {
            address = settings.vnext[0].address || "";
            port = String(settings.vnext[0].port || "");
          } else if (settings.servers?.[0]) {
            address = settings.servers[0].address || "";
            port = String(settings.servers[0].port || "");
          }
        }
      } catch (error) {
        protocol = "invalid";
      }

      infoMap.set(filename, { protocol, address, port });
    }

    return infoMap;
  }

  static async readConfig(filename: string): Promise<string> {
    const configPath = `${KSU.MODULE_PATH}/config/xray/configs/${filename}`;
    return await KSU.exec(`cat '${configPath}'`);
  }

  static async saveConfig(
    filename: string,
    content: string,
  ): Promise<OperationResult> {
    try {
      JSON.parse(content);
      const safeName = filename.endsWith(".json") ? filename : `${filename}.json`;
      if (!/^[a-zA-Z0-9._-]+\.json$/.test(safeName)) {
        return { success: false, error: "Invalid filename" };
      }
      const configPath = `${KSU.MODULE_PATH}/config/xray/configs/${safeName}`;
      const tempPath = `${configPath}.tmp`;
      const base64 = btoa(unescape(encodeURIComponent(content)));
      await KSU.exec(`mkdir -p ${KSU.MODULE_PATH}/config/xray/configs`);
      await KSU.exec(`echo '${base64}' | base64 -d > '${tempPath}'`);
      await KSU.exec(`mv '${tempPath}' '${configPath}'`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteConfig(filename: string): Promise<OperationResult> {
    try {
      const configPath = `${KSU.MODULE_PATH}/config/xray/configs/${filename}`;
      await KSU.exec(`rm -f '${configPath}'`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 切换配置
  static async switchConfig(filename: string): Promise<void> {
    const configPath = `${KSU.MODULE_PATH}/config/xray/configs/${filename}`;

    // 需要检查服务状态来决定是热切换还是直接修改配置
    // 为了避免循环依赖，这里重复一下 pidof 检查，或者简单地都尝试调用 switch-config.sh
    // switch-config.sh 内部建议增加判断逻辑，目前 KSUService 逻辑是先检查状态
    const pidOutput = await KSU.exec(
      `pidof -s /data/adb/modules/netproxy/bin/xray 2>/dev/null || echo`,
    );
    const isRunning = pidOutput.trim() !== "";

    if (isRunning) {
      await KSU.exec(
        `sh ${KSU.MODULE_PATH}/scripts/core/switch-config.sh '${configPath}'`,
      );
    } else {
      await KSU.exec(
        `sed -i 's|^CURRENT_CONFIG=.*|CURRENT_CONFIG="${configPath}"|' ${KSU.MODULE_PATH}/config/module.conf`,
      );
    }
  }
}
