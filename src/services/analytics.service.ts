// Analytics Service
import { ordersService } from './orders.service';
import { bookingsService } from './bookings.service';
import { usersService } from './users.service';
import { productsService } from './products.service';
import { emergencyService } from './emergency.service';
import { supportService } from './support.service';

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  bookings: {
    total: number;
    pending: number;
    todayBookings: number;
  };
  users: {
    total: number;
    newThisMonth: number;
  };
  emergencies: {
    pending: number;
    active: number;
  };
  support: {
    open: number;
    inProgress: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
}

export const analyticsService = {
  // Get all dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();

    const [orderStats, bookingStats, userStats, emergencyStats, ticketStats, inventoryStats] =
      await Promise.all([
        ordersService.getOrderStats(today),
        bookingsService.getBookingStats(),
        usersService.getUserStats(),
        emergencyService.getEmergencyStats(),
        supportService.getTicketStats(),
        productsService.getInventoryStats(),
      ]);

    return {
      orders: orderStats,
      bookings: {
        total: bookingStats.total,
        pending: bookingStats.pending,
        todayBookings: bookingStats.todayBookings,
      },
      users: {
        total: userStats.total,
        newThisMonth: userStats.newThisMonth,
      },
      emergencies: {
        pending: emergencyStats.pending,
        active: emergencyStats.active,
      },
      support: {
        open: ticketStats.open,
        inProgress: ticketStats.inProgress,
      },
      inventory: {
        totalProducts: inventoryStats.totalProducts,
        lowStock: inventoryStats.lowStock,
        outOfStock: inventoryStats.outOfStock,
      },
    };
  },

  // Get revenue chart data
  async getRevenueChartData(days: number = 30) {
    return ordersService.getRevenueStats(days);
  },
};
