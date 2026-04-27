#!/system/bin/sh
set -e
set -u

readonly MODDIR="$(cd "$(dirname "$0")/../.." && pwd)"
readonly LOG_FILE="$MODDIR/logs/service.log"
readonly XRAY_BIN="$MODDIR/bin/xray"

# 导入工具库
. "$MODDIR/scripts/utils/log.sh"

#######################################
# 切换完整 Xray 配置
# Arguments:
#   $1 - 新配置文件路径
#######################################
switch_config() {
  local config_file="$1"

  if [ ! -f "$config_file" ]; then
    log "ERROR" "配置文件不存在: $config_file"
    exit 1
  fi

  log "INFO" "========== 开始切换 Xray 配置 =========="
  log "INFO" "新配置: $config_file"

  sed -i "s|^CURRENT_CONFIG=.*|CURRENT_CONFIG=\"$config_file\"|" "$MODDIR/config/module.conf"

  log "INFO" "配置文件已更新"
  if pidof -s "$XRAY_BIN" > /dev/null 2>&1; then
    log "INFO" "Xray 正在运行，重启服务以应用完整配置"
    sh "$MODDIR/scripts/core/service.sh" restart
  fi

  log "INFO" "========== 配置切换完成 =========="
}

# 主流程
if [ -z "${1:-}" ]; then
  echo "用法: $0 <config_file>"
  echo "  config_file - 新配置文件的完整路径"
  exit 1
fi

switch_config "$1"
