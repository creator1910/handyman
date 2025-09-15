/**
 * CRM Database abstraction for MCP server
 * Uses Prisma to connect to the HandyAI database
 */
export declare class CRMDatabase {
    private prisma;
    constructor();
    createCustomer(data: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        address?: string;
        isProspect?: boolean;
    }): Promise<{
        success: boolean;
        customer: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        customer?: undefined;
    }>;
    getCustomers(search?: string): Promise<{
        success: boolean;
        customers: any;
        count: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        customers?: undefined;
        count?: undefined;
    }>;
    updateCustomer(id: string, data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        address?: string;
        isProspect?: boolean;
    }): Promise<{
        success: boolean;
        customer: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        customer?: undefined;
    }>;
    createOffer(data: {
        customerId: string;
        jobDescription?: string;
        measurements?: string;
        materialsCost?: number;
        laborCost?: number;
        totalCost?: number;
    }): Promise<{
        success: boolean;
        offer: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        offer?: undefined;
    }>;
    getOffers(customerId?: string): Promise<{
        success: boolean;
        offers: any;
        count: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        offers?: undefined;
        count?: undefined;
    }>;
    getStats(): Promise<{
        success: boolean;
        statistics: {
            customers: {
                total: any;
                prospects: any;
                recent: any;
            };
            offers: {
                total: any;
                recent: any;
            };
            invoices: {
                total: any;
            };
            revenue: {
                total: any;
            };
            conversionRate: string;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        statistics?: undefined;
    }>;
    disconnect(): Promise<void>;
}
