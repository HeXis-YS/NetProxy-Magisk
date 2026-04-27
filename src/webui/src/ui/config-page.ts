import { ConfigService } from "../services/config-service.js";
import { StatusService } from "../services/status-service.js";
import { toast } from "../utils/toast.js";
import { I18nService } from "../i18n/i18n-service.js";
import type { UI } from "./ui-core.js";

interface ConfigGroup {
  name: string;
  dirName?: string;
  configs: string[];
}

/**
 * 配置页面管理器 - 支持分组显示
 */
export class ConfigPageManager {
  ui: UI;
  currentOpenDropdown: any;
  _tabEventBound: boolean;
  _cachedGroups: ConfigGroup[] | null;
  _cachedCurrentConfig: string | null;
  _selectedTab: string | null;
  editingFilename: string | null;
  _tabChangeHandler: ((e: Event) => Promise<void>) | null;

  constructor(ui: UI) {
    this.ui = ui;
    this.currentOpenDropdown = null;
    this._tabEventBound = false; // 防止重复绑定 tab 事件
    this._cachedGroups = null;
    this._cachedCurrentConfig = null;
    this._selectedTab = null; // 持久化当前选中的 tab
    this.editingFilename = null;
    this._tabChangeHandler = null;
  }

  // 刷新数据并渲染（首次加载或手动刷新时调用）
  async update(forceRefresh = false) {
    try {
      // 如果已有缓存且不是强制刷新，直接渲染（页面切换回来时使用缓存）
      if (
        !forceRefresh &&
        this._cachedGroups &&
        this._cachedGroups.length > 0
      ) {
        await this.render();
        return;
      }

      // 1. 获取目录结构（快速，无详情）
      const groups = await ConfigService.getConfigGroups();

      // 2. 更新缓存
      this._cachedGroups = groups;
      const { config } = await StatusService.getStatus();
      this._cachedCurrentConfig = config;

      // 3. 立即渲染结构
      await this.render();

    } catch (error) {}
  }
  // 仅渲染 UI（使用 mdui-tabs 横向分组）
  async render() {
    const tabsEl = document.getElementById("config-tabs");
    if (!tabsEl) return;

    if (!this._cachedGroups || this._cachedGroups.length === 0) {
      tabsEl.innerHTML =
        '<mdui-tab value="empty">暂无节点</mdui-tab><mdui-tab-panel slot="panel" value="empty"><p style="padding: 16px; text-align: center;">暂无节点</p></mdui-tab-panel>';
      return;
    }

    // 保存当前选中的 tab
    const currentTab =
      this._selectedTab || this._cachedGroups[0]?.name || "default";

    // 检查现有 tabs 是否匹配缓存（如果匹配则跳过重建，只刷新内容）
    const existingTabs = tabsEl.querySelectorAll("mdui-tab");
    const existingNames = Array.from(existingTabs).map((t) => (t as any).value);
    const cachedNames = this._cachedGroups.map((g) => g.name);
    const tabsMatch =
      existingNames.length === cachedNames.length &&
      existingNames.every((name, i) => name === cachedNames[i]);

    if (
      tabsMatch &&
      existingNames.length > 0 &&
      existingNames[0] !== "loading"
    ) {
      // Tabs 结构匹配，只刷新当前 tab 的内容
      const validTab = this._cachedGroups.find((g) => g.name === currentTab)
        ? currentTab
        : this._cachedGroups[0]?.name;
      this._selectedTab = validTab;
      await this.renderActiveTab(validTab);
      return;
    }

    // 清空并重建 tabs（首次加载或结构变化时）
    tabsEl.innerHTML = "";

    // 1. 创建所有 tab 标签
    for (const group of this._cachedGroups) {
      const tab = document.createElement("mdui-tab") as any;
      tab.value = group.name;
      tab.textContent = `${group.name} (${group.configs.length})`;
      tabsEl.appendChild(tab);
    }

    // 1.5 注入滚动样式到 Shadow DOM（等待渲染后）
    requestAnimationFrame(() => {
      const shadowRoot = tabsEl.shadowRoot;
      if (shadowRoot) {
        const container = shadowRoot.querySelector('[part="container"]');
        if (container) {
          (container as HTMLElement).style.cssText =
            "display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch;";
        }

        // 让每个 tab 保持自然宽度不收缩
        const tabs = shadowRoot.querySelectorAll("slot");
        tabs.forEach((slot) => {
          const assignedElements = slot.assignedElements();
          assignedElements.forEach((el) => {
            if (el.tagName === "MDUI-TAB") {
              (el as HTMLElement).style.cssText =
                "flex-shrink: 0; white-space: nowrap;";
            }
          });
        });
      }

      // 同时给 Light DOM 中的 tab 设置样式
      const lightTabs = tabsEl.querySelectorAll("mdui-tab");
      lightTabs.forEach((tab) => {
        tab.style.cssText = "flex-shrink: 0; white-space: nowrap;";
      });
    });

    // 2. 创建所有 tab-panel
    // 2. 创建所有 tab-panel
    for (const group of this._cachedGroups) {
      const panel = document.createElement("mdui-tab-panel") as any;
      panel.slot = "panel";
      panel.value = group.name;

      // 操作栏 (Toolbar)
      const actions = document.createElement("div");
      actions.style.cssText =
        "display: flex; justify-content: space-between; align-items: center; padding: 12px 16px 4px 16px;";

      // 左侧标题
      const title = document.createElement("span");
      title.textContent = I18nService.t("config.node_list");
      title.setAttribute("data-i18n", "config.node_list");
      title.style.cssText =
        "font-size: 14px; font-weight: 500; color: var(--mdui-color-on-surface-variant);";
      actions.appendChild(title);

      panel.appendChild(actions);

      // 创建列表容器
      const list = document.createElement("mdui-list");
      list.id = `config-list-${group.name}`;
      list.className = "config-group-list";
      panel.appendChild(list);

      tabsEl.appendChild(panel);
    }

    // 3. 恢复选中状态
    const validTab = this._cachedGroups.find((g) => g.name === currentTab)
      ? currentTab
      : this._cachedGroups[0]?.name;
    this._selectedTab = validTab; // 保存到实例变量

    // 延迟激活 tab - 使用点击方式更可靠
    requestAnimationFrame(() => {
      setTimeout(async () => {
        if (validTab) {
          // 找到并点击目标 tab
          const targetTab = tabsEl.querySelector(
            `mdui-tab[value="${validTab}"]`,
          );
          if (targetTab) {
            (targetTab as HTMLElement).click();
          }
          // 为当前 tab 加载并渲染内容
          await this.renderActiveTab(validTab);
        }
      }, 100);
    });

    // 5. 绑定 tab 切换事件（每次重新绑定，先移除旧的）
    if (this._tabChangeHandler) {
      tabsEl.removeEventListener("change", this._tabChangeHandler);
    }
    this._tabChangeHandler = async (e: Event) => {
      const target = e.target as any;
      const newTab = target?.value;
      if (newTab) {
        this._selectedTab = newTab;
        await this.renderActiveTab(newTab);
      }
    };
    tabsEl.addEventListener("change", this._tabChangeHandler);
  }

  // 渲染当前激活的 tab 内容
  async renderActiveTab(groupName) {
    const group = this._cachedGroups.find((g) => g.name === groupName);
    if (!group) return;

    const listEl = document.getElementById(`config-list-${groupName}`);
    if (!listEl) return;

    // 渲染列表
    const fragment = document.createDocumentFragment();
    for (const filename of group.configs) {
      const fullPath = group.dirName
        ? `${group.dirName}/${filename}`
        : filename;
      const isCurrent =
        this._cachedCurrentConfig &&
        this._cachedCurrentConfig.endsWith(filename);

      this.renderConfigItem(
        fragment,
        filename,
        fullPath,
        isCurrent,
        group,
      );
    }

    listEl.innerHTML = "";
    listEl.appendChild(fragment);
  }

  renderConfigItem(container, filename, fullPath, isCurrent, group) {
    const item = document.createElement("mdui-list-item");
    item.setAttribute("clickable", "");
    item.classList.add("config-item");
    item.dataset.groupName = group.name;
    item.dataset.filename = filename;

    const displayName = filename.replace(/\.json$/i, "");
    item.setAttribute("headline", displayName);

    if (isCurrent) {
      const currentTag = document.createElement("span");
      currentTag.textContent = I18nService.t("config.status.current");
      currentTag.slot = "description";
      currentTag.className = "current-tag-text";
      currentTag.style.cssText =
        "font-size: 12px; color: var(--mdui-color-primary); font-weight: 500;";
      item.appendChild(currentTag);
    }

    // 三点菜单
    const dropdown = document.createElement("mdui-dropdown");
    dropdown.setAttribute("placement", "bottom-end");
    dropdown.slot = "end-icon";

    const menuBtn = document.createElement("mdui-button-icon");
    menuBtn.setAttribute("slot", "trigger");
    menuBtn.setAttribute("icon", "more_vert");
    // 阻止所有事件冒泡到父列表项，防止触发 ripple 和选中效果
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // 关闭之前打开的下拉菜单
      if (this.currentOpenDropdown && this.currentOpenDropdown !== dropdown) {
        this.currentOpenDropdown.open = false;
      }
      // 更新当前打开的下拉菜单
      this.currentOpenDropdown = dropdown;
    });
    menuBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    menuBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    menuBtn.addEventListener("touchstart", (e) => e.stopPropagation());
    dropdown.appendChild(menuBtn);

    // 监听下拉菜单关闭事件
    dropdown.addEventListener("closed", () => {
      if (this.currentOpenDropdown === dropdown) {
        this.currentOpenDropdown = null;
      }
    });

    const menu = document.createElement("mdui-menu");

    const editItem = document.createElement("mdui-menu-item");
    editItem.innerHTML = `<mdui-icon slot="icon" name="edit"></mdui-icon>${I18nService.t("common.edit") || "Edit"}`;
    editItem.addEventListener("click", async (e) => {
      e.stopPropagation();
      dropdown.open = false;
      await this.showDialog(filename);
    });
    menu.appendChild(editItem);

    const deleteItem = document.createElement("mdui-menu-item");
    deleteItem.innerHTML = `<mdui-icon slot="icon" name="delete"></mdui-icon>${I18nService.t("common.delete") || "Delete"}`;
    deleteItem.addEventListener("click", async (e) => {
      e.stopPropagation();
      dropdown.open = false;
      await this.deleteConfig(filename);
    });
    menu.appendChild(deleteItem);

    dropdown.appendChild(menu);
    item.appendChild(dropdown);

    item.addEventListener("click", () => {
      if (!isCurrent) {
        this.switchConfig(fullPath, displayName);
      }
    });

    container.appendChild(item);
  }

  async switchConfig(fullPath, displayName) {
    try {
      await ConfigService.switchConfig(fullPath);
      toast(I18nService.t("config.toast.switch_success") + displayName);
      // 更新当前配置缓存
      this._cachedCurrentConfig = fullPath;
      // 强制重新渲染当前 tab 以更新"当前"标记
      if (this._selectedTab) {
        await this.renderActiveTab(this._selectedTab);
      }
      await this.ui.statusPage.update();
    } catch (error) {
      toast(I18nService.t("config.toast.switch_failed") + error.message);
    }
  }

  async showDialog(filename: string | null = null) {
    this.editingFilename = filename;
    const dialog = document.getElementById("config-dialog") as any;
    const title = document.getElementById("config-dialog-title");
    const filenameInput = document.getElementById("config-filename") as any;
    const contentInput = document.getElementById("config-content") as any;

    if (!dialog || !filenameInput || !contentInput) return;

    if (filename) {
      if (title) title.textContent = I18nService.t("common.edit") || "Edit";
      filenameInput.value = filename;
      filenameInput.disabled = true;
      contentInput.value = await ConfigService.readConfig(filename);
    } else {
      if (title) title.textContent = I18nService.t("config.add_node");
      filenameInput.value = "";
      filenameInput.disabled = false;
      contentInput.value = JSON.stringify(
        {
          log: { loglevel: "warning" },
          inbounds: [],
          outbounds: [],
          routing: { rules: [] },
        },
        null,
        2,
      );
    }

    dialog.open = true;
  }

  async saveConfig() {
    const dialog = document.getElementById("config-dialog") as any;
    const saveBtn = document.getElementById("config-save-btn") as any;
    const filenameInput = document.getElementById("config-filename") as any;
    const contentInput = document.getElementById("config-content") as any;

    if (!filenameInput || !contentInput) return;

    const filename = filenameInput.value.trim();
    const content = contentInput.value;
    if (!filename) {
      toast(I18nService.t("config.toast.filename_required"));
      return;
    }

    try {
      if (saveBtn) saveBtn.loading = true;
      const result = await ConfigService.saveConfig(filename, content);
      if (!result.success) {
        toast(result.error || I18nService.t("config.toast.save_failed"));
        return;
      }
      if (dialog) dialog.open = false;
      this._cachedGroups = null;
      await this.update(true);
      toast(I18nService.t("config.toast.save_success"));
    } finally {
      if (saveBtn) saveBtn.loading = false;
    }
  }

  async deleteConfig(filename: string) {
    if (
      this._cachedCurrentConfig &&
      this._cachedCurrentConfig.endsWith(filename)
    ) {
      toast(I18nService.t("config.toast.delete_current_forbidden"));
      return;
    }

    const result = await ConfigService.deleteConfig(filename);
    if (!result.success) {
      toast(result.error || I18nService.t("common.delete_failed"));
      return;
    }

    this._cachedGroups = null;
    await this.update(true);
    toast(I18nService.t("config.toast.delete_success"));
  }

}
