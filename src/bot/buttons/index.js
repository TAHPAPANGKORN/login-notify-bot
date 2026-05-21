import { handleViewStats } from './viewStats.js';
import { handleResetStats } from './resetStats.js';

export const buttonHandlers = {
  view_stats_today: handleViewStats,
  refresh_stats_today: handleViewStats,
  reset_stats_today: handleResetStats
};
