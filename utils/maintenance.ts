/**
 * 系统维护模式开关
 *
 * 启用维护：在 .env.local 或部署环境变量中设置
 *   NEXT_PUBLIC_MAINTENANCE_MODE=true
 *
 * 放开系统：删除该变量或设置为
 *   NEXT_PUBLIC_MAINTENANCE_MODE=false
 * 然后重新部署或重启 dev server 即可。
 */
export const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
