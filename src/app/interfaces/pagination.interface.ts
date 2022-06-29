export interface PaginationOptions {
    limit: number;
    page: number;
}

export interface PaginationResponse <T>{
    totalPages: number;
    total: number;
    pageTotal: number;
    results: T[];
}