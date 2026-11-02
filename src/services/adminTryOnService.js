import apiClient from './apiClient';

/**
 * Usage numbers for the last `days` days: { total, succeeded, failed, abandoned, inProgress, uniqueCustomers,
 * averageSeconds, successRate, estimatedCost, byGarmentType: [{label,count}], topProducts, featureEnabled,
 * providerConfigured, supportedGarmentTypes }.
 */
export async function getTryOnStats(days = 30) {
  const response = await apiClient.get('/admin/try-on/stats', { params: { days } });
  return response.data;
}
