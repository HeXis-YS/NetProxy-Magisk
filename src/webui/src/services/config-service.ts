import { KSU } from "./ksu.js";

interface ConfigGroup {
  type: "default";
  name: string;
  dirName: string;
  configs: string[];
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
    await KSU.exec(
      `sed -i 's|^CURRENT_CONFIG=.*|CURRENT_CONFIG="${configPath}"|' ${KSU.MODULE_PATH}/config/module.conf`,
    );

    const pidOutput = await KSU.exec(
      `pidof -s /data/adb/modules/netproxy/bin/xray 2>/dev/null || echo`,
    );
    if (pidOutput.trim() !== "") {
      await KSU.exec(`sh ${KSU.MODULE_PATH}/scripts/core/service.sh restart`);
    }
  }
}
