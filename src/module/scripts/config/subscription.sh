#!/system/bin/sh

#############################################################################
# 订阅管理脚本
# 功能: remove/list 订阅
#############################################################################

set -e

readonly MODDIR="$(cd "$(dirname "$0")/../.." && pwd)"
readonly OUTBOUNDS_DIR="$MODDIR/config/xray/outbounds"
readonly LOG_FILE="$MODDIR/logs/subscription.log"

# 导入工具库
. "$MODDIR/scripts/utils/log.sh"

#######################################
# 显示帮助
#######################################
show_help() {
  cat << EOF
用法: $0 <命令> [参数]

命令:
    remove <name>       删除订阅
    list                列出所有订阅

示例:
    $0 remove "机场A"
EOF
  exit 0
}

#######################################
# 清理文件名
#######################################
sanitize_name() {
  echo "$1" | sed 's/[\/\\:*?"<>| ]/_/g'
}

#######################################
# 添加订阅
#######################################
cmd_add() {
  echo "错误: 订阅导入已移除，请手动添加 Xray 出站 JSON 配置"
  exit 1
}

#######################################
# 更新订阅
#######################################
cmd_update() {
  echo "错误: 订阅更新已移除，请手动添加 Xray 出站 JSON 配置"
  exit 1
}

#######################################
# 更新所有订阅
#######################################
cmd_update_all() {
  echo "错误: 订阅更新已移除，请手动添加 Xray 出站 JSON 配置"
  exit 1
}

#######################################
# 删除订阅
#######################################
cmd_remove() {
  local name="$1"

  if [ -z "$name" ]; then
    echo "错误: 请提供订阅名称"
    exit 1
  fi

  local safe_name=$(sanitize_name "$name")
  local sub_dir="$OUTBOUNDS_DIR/sub_$safe_name"

  if [ ! -d "$sub_dir" ]; then
    echo "错误: 订阅 '$name' 不存在"
    exit 1
  fi

  rm -rf "$sub_dir"
  echo "订阅 '$name' 已删除"
}

#######################################
# 列出订阅
#######################################
cmd_list() {
  echo "订阅列表:"
  for sub_dir in "$OUTBOUNDS_DIR"/sub_*; do
    [ -d "$sub_dir" ] || continue
    local meta_file="$sub_dir/_meta.json"
    [ -f "$meta_file" ] || continue

    local name=$(grep -o '"name": *"[^"]*"' "$meta_file" | sed 's/"name": *"\([^"]*\)"/\1/')
    local updated=$(grep -o '"updated": *"[^"]*"' "$meta_file" | sed 's/"updated": *"\([^"]*\)"/\1/')
    local node_count=$(find "$sub_dir" -name "*.json" ! -name "_meta.json" | wc -l)

    echo "  - $name ($node_count 节点, 更新于 $updated)"
  done
}

#######################################
# 下载并解析订阅
#######################################
update_subscription() {
  log "ERROR" "订阅导入与更新已移除"
  echo "错误: 订阅导入与更新已移除，请手动添加 Xray 出站 JSON 配置"
  exit 1
}

#######################################
# 主程序
#######################################
case "${1:-}" in
  add)
    cmd_add "$2" "$3"
    ;;
  update)
    cmd_update "$2"
    ;;
  update-all)
    cmd_update_all
    ;;
  remove)
    cmd_remove "$2"
    ;;
  list)
    cmd_list
    ;;
  -h | --help | "")
    show_help
    ;;
  *)
    echo "错误: 未知命令 '$1'"
    show_help
    ;;
esac
